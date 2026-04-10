import { loadConfiguration, getSiteOverride } from "./features/storage";
import { Logger } from "./shared/utils/logger";
import { SearchEngine, Match } from "./features/search/search-engine";
import { SearchBarUI, injectStyles } from "./features/ui/search-bar";
import { Configuration } from "./shared/types/config";

class FuzzySearchController {
	private config!: Configuration;
	private logger!: Logger;
	private engine!: SearchEngine;
	private ui?: SearchBarUI;
	private matches: Match[] = [];
	private currentIndex = -1;
	private threshold = 0.6;
	private lastQuery = "";
	private mutationObserver?: MutationObserver;

	constructor() {
		this.init();
	}

	private async init() {
		this.config = await loadConfiguration();
		this.logger = new Logger(this.config);
		this.engine = new SearchEngine(this.config, this.logger);
		this.threshold = this.config.defaultThreshold;

		const siteOverride = await getSiteOverride(window.location.hostname);
		const enabled =
			siteOverride !== null ? siteOverride : this.config.globalEnabled;

		if (enabled) {
			this.enable();
		}

		this.setupMessageListeners();
	}

	private enable() {
		if (this.ui) return;

		injectStyles(this.config);
		this.ui = new SearchBarUI(this.config, {
			onSearch: (q) => this.handleSearch(q),
			onNavigate: () => this.handleNavigate(),
			onSetThreshold: () => this.handleSetThreshold(),
			onClear: () => this.handleClear(),
		});
		this.ui.mount();
		this.setupMutationObserver();
		this.ui.updateDisplay(
			this.threshold,
			this.currentIndex,
			this.matches.length,
		);
	}

	private disable() {
		this.ui?.unmount();
		this.ui = undefined;
		this.handleClear();
		this.mutationObserver?.disconnect();
	}

	private handleSearch(query: string) {
		const trimmed = query.trim();
		if (!trimmed) {
			this.handleClear();
			return;
		}

		this.lastQuery = trimmed;
		this.clearHighlights();
		this.matches = this.engine.findMatches(trimmed, this.threshold);
		this.currentIndex = -1;
		this.highlightMatches();
		this.ui?.updateDisplay(
			this.threshold,
			this.currentIndex,
			this.matches.length,
		);
	}

	private handleNavigate() {
		if (this.matches.length === 0) return;

		if (this.currentIndex >= 0) {
			this.matches[this.currentIndex].element.classList.remove(
				`${this.config.cssPrefix}-current-highlight`,
			);
		}

		this.currentIndex = (this.currentIndex + 1) % this.matches.length;
		const current = this.matches[this.currentIndex].element;

		current.classList.add(`${this.config.cssPrefix}-current-highlight`);
		current.scrollIntoView({ behavior: "smooth", block: "center" });

		this.ui?.updateDisplay(
			this.threshold,
			this.currentIndex,
			this.matches.length,
		);
	}

	private handleSetThreshold() {
		const newValue = prompt(
			"Set threshold (0.0 - 1.0):",
			this.threshold.toFixed(2),
		);
		if (newValue === null) return;
		const parsed = parseFloat(newValue);
		if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 1) {
			this.threshold = parsed;
			if (this.lastQuery) this.handleSearch(this.lastQuery);
			else
				this.ui?.updateDisplay(
					this.threshold,
					this.currentIndex,
					this.matches.length,
				);
		}
	}

	private handleClear() {
		this.clearHighlights();
		this.matches = [];
		this.currentIndex = -1;
		this.lastQuery = "";
		this.ui?.updateDisplay(this.threshold, this.currentIndex, 0);
	}

	private clearHighlights() {
		const prefix = this.config.cssPrefix;
		document
			.querySelectorAll(`.${prefix}-highlight, .${prefix}-current-highlight`)
			.forEach((el) => {
				el.classList.remove(
					`${prefix}-highlight`,
					`${prefix}-current-highlight`,
				);
			});
	}

	private highlightMatches() {
		const prefix = this.config.cssPrefix;
		for (const m of this.matches) {
			m.element.classList.add(`${prefix}-highlight`);
		}
	}

	private setupMutationObserver() {
		this.mutationObserver = new MutationObserver(() => {
			if (this.matches.length > 0 && this.lastQuery) {
				this.handleSearch(this.lastQuery);
			}
		});
		this.mutationObserver.observe(document.body, {
			childList: true,
			subtree: true,
		});
	}

	private setupMessageListeners() {
		chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
			if (request.action === "toggleSearch") {
				this.toggle().then((enabled) => sendResponse({ enabled }));
				return true;
			}
			if (request.action === "getStatus") {
				getSiteOverride(window.location.hostname).then((siteOverride) => {
					sendResponse({
						enabled: !!this.ui,
						globalEnabled: this.config.globalEnabled,
						siteOverride,
					});
				});
				return true;
			}
			return false;
		});
	}

	private async toggle(): Promise<boolean> {
		const host = window.location.hostname;
		const newEnabled = !this.ui;

		if (newEnabled === this.config.globalEnabled) {
			await chrome.storage.sync.remove(`override_${host}`);
		} else {
			await chrome.storage.sync.set({ [`override_${host}`]: newEnabled });
		}

		if (newEnabled) this.enable();
		else this.disable();

		return newEnabled;
	}
}

new FuzzySearchController();
