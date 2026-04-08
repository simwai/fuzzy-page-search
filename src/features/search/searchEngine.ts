import { Configuration } from "../../shared/types/config";
import { Logger } from "../../shared/utils/logger";
import { smartSimilarity } from "./algorithms";

export interface Match {
	element: HTMLElement;
	similarity: number;
	text: string;
	textLength: number;
}

export class SearchEngine {
	private EXCLUDED_TAGS = new Set([
		"SCRIPT",
		"STYLE",
		"NOSCRIPT",
		"META",
		"LINK",
		"TITLE",
		"HEAD",
	]);

	constructor(
		private config: Configuration,
		private logger: Logger,
	) {}

	public findMatches(query: string, threshold: number): Match[] {
		this.logger.log(`🔍 Search: "${query}" (threshold: ${threshold})`);

		const matchData: Match[] = [];

		const walker = document.createTreeWalker(
			document.body,
			NodeFilter.SHOW_ELEMENT,
			{
				acceptNode: (node) =>
					this.isValidElement(node as HTMLElement)
						? NodeFilter.FILTER_ACCEPT
						: NodeFilter.FILTER_SKIP,
			},
		);

		let node = walker.nextNode() as HTMLElement | null;
		while (node && matchData.length < this.config.maxMatches) {
			const textContent = node.textContent?.trim() || "";
			const textLength = textContent.length;

			if (
				textLength > this.config.minTextLength &&
				textLength <= this.config.maxTextLength
			) {
				const similarity = smartSimilarity(query, textContent);

				if (similarity > threshold) {
					matchData.push({
						element: node,
						similarity,
						text: textContent,
						textLength,
					});
				}
			}
			node = walker.nextNode() as HTMLElement | null;
		}

		matchData.sort((a, b) => {
			const scoreDiff = b.similarity - a.similarity;
			if (Math.abs(scoreDiff) > 0.01) return scoreDiff;
			return a.textLength - b.textLength;
		});

		const deduplicated = this.removeNestedMatches(matchData);

		this.logger.log(
			`✓ Found ${deduplicated.length} unique matches (${matchData.length} before dedup)`,
		);
		return deduplicated;
	}

	private isValidElement(node: HTMLElement): boolean {
		if (
			this.EXCLUDED_TAGS.has(node.tagName) ||
			node.classList.contains(`${this.config.cssPrefix}-search-bar`)
		) {
			return false;
		}

		const style = window.getComputedStyle(node);
		if (style.display === "none" || style.visibility === "hidden") {
			return false;
		}

		// Avoid offset check in JSDOM unless mocked
		if (
			typeof window !== "undefined" &&
			(window as any).isJSDOM &&
			node.offsetWidth === 0 &&
			node.offsetHeight === 0
		) {
			return false;
		}

		return true;
	}

	private removeNestedMatches(matchData: Match[]): Match[] {
		if (matchData.length === 0) return [];

		const getDomDepth = (element: HTMLElement) => {
			let depth = 0;
			let node: HTMLElement | null = element;
			while (node?.parentElement) {
				depth++;
				node = node.parentElement;
			}
			return depth;
		};

		const withDepth = matchData.map((m) => ({
			...m,
			depth: getDomDepth(m.element),
		}));
		withDepth.sort((a, b) => b.depth - a.depth);

		const keptElements = new Set<HTMLElement>();
		const ancestorsOfKept = new Set<HTMLElement>();

		for (const item of withDepth) {
			if (ancestorsOfKept.has(item.element)) {
				continue;
			}

			keptElements.add(item.element);

			let ancestor = item.element.parentElement;
			while (ancestor) {
				ancestorsOfKept.add(ancestor);
				ancestor = ancestor.parentElement;
			}
		}

		return matchData.filter((m) => keptElements.has(m.element));
	}
}
