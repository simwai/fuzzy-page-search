import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Configuration } from "../../shared/types/config";
import { Logger } from "../../shared/utils/logger";
import { SearchEngine } from "./search-engine";

describe("SearchEngine", () => {
	let config: Configuration;
	let logger: Logger;
	let engine: SearchEngine;

	beforeEach(() => {
		config = {
			globalEnabled: true,
			defaultThreshold: 0.6,
			maxMatches: 10,
			debounceMilliseconds: 0,
			cssPrefix: "fuzzy",
			minTextLength: 2,
			maxTextLength: 100,
			enableLogging: false,
		};
		logger = new Logger(config);
		engine = new SearchEngine(config, logger);

		document.body.innerHTML = "";

		// Mock getComputedStyle for JSDOM
		vi.spyOn(window, "getComputedStyle").mockImplementation(
			() =>
				({
					display: "block",
					visibility: "visible",
				}) as any,
		);
	});

	it("should find exact matches", () => {
		const div = document.createElement("div");
		div.textContent = "hello world";
		// Mock offsetWidth/Height
		Object.defineProperty(div, "offsetWidth", { value: 100 });
		Object.defineProperty(div, "offsetHeight", { value: 20 });
		document.body.appendChild(div);

		const matches = engine.findMatches("hello", 0.8);
		expect(matches.length).toBe(1);
		expect(matches[0].element).toBe(div);
	});

	it("should exclude script tags", () => {
		const script = document.createElement("script");
		script.textContent = 'var x = "test"';
		document.body.appendChild(script);

		const matches = engine.findMatches("test", 0.1);
		expect(matches.length).toBe(0);
	});

	it("should deduplicate nested matches (prefer child)", () => {
		const parent = document.createElement("div");
		const child = document.createElement("span");
		child.textContent = "inner text";

		Object.defineProperty(parent, "offsetWidth", { value: 100 });
		Object.defineProperty(parent, "offsetHeight", { value: 20 });
		Object.defineProperty(child, "offsetWidth", { value: 50 });
		Object.defineProperty(child, "offsetHeight", { value: 10 });

		parent.appendChild(child);
		document.body.appendChild(parent);

		const matches = engine.findMatches("inner", 0.5);
		expect(matches.length).toBe(1);
		expect(matches[0].element).toBe(child);
	});
});
