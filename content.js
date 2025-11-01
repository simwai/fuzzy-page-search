(function () {
  "use strict";

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * FUZZY SEARCH FOR WEB PAGES v5.0
   * ═══════════════════════════════════════════════════════════════════════════
   *
   * A high-performance fuzzy text search tool for any webpage with keyboard
   * navigation and intelligent match deduplication.
   *
   * ───────────────────────────────────────────────────────────────────────────
   * FEATURES
   * ───────────────────────────────────────────────────────────────────────────
   * ✓ Fuzzy matching using Damerau-Levenshtein algorithm (handles typos)
   * ✓ Intelligent nested element deduplication (O(n) performance)
   * ✓ Real-time DOM mutation tracking (auto-updates on page changes)
   * ✓ Keyboard navigation (Enter to cycle, Escape to clear)
   * ✓ Adjustable similarity threshold (0.0 - 1.0)
   * ✓ Visual highlighting with smooth scrolling
   * ✓ Substring match bonus (mimics Ctrl+F behavior)
   * ✓ Memory-efficient observer lifecycle management
   * ✓ Extension toggle via popup (click icon to enable/disable)
   * ✓ Global toggle + site-specific overrides
   *
   * ───────────────────────────────────────────────────────────────────────────
   * USE CASES
   * ───────────────────────────────────────────────────────────────────────────
   *
   * Perfect for:
   * • Documentation sites (MDN, Stack Overflow, GitHub)
   * • Long-form articles and blog posts
   * • E-commerce product pages with reviews
   * • Social media feeds (Twitter, Reddit)
   * • Any content-heavy webpage where Ctrl+F is insufficient
   *
   * Especially useful when:
   * • You remember approximate wording but not exact text
   * • Searching across dynamically loaded content
   * • Need to find similar terms (e.g., "optimize" matches "optimization")
   * • Want to ignore parent/container duplicates
   *
   * ───────────────────────────────────────────────────────────────────────────
   * USAGE
   * ───────────────────────────────────────────────────────────────────────────
   *
   * The search bar appears at the top of any page where the script runs.
   *
   * Keyboard shortcuts:
   * • Type query → Enter: Navigate through matches
   * • Escape: Clear search and unfocus input
   *
   * Buttons:
   * • Search: Execute search manually
   * • Threshold: Adjust match sensitivity (0.0 = loose, 1.0 = exact)
   *
   * Display format: "0.60 (2/5)" means:
   * • 0.60 = current threshold
   * • 2/5 = viewing match 2 out of 5 total matches
   *
   * Toggle:
   * • Click extension icon → Enable/Disable search on current page
   * • Click Options → Configure settings globally
   *
   * ───────────────────────────────────────────────────────────────────────────
   * CONFIGURATION
   * ───────────────────────────────────────────────────────────────────────────
   *
   * Settings are managed via the Options page (Options button in popup).
   * Edit defaults below:
   * • globalEnabled: Extension enabled/disabled globally (false by default)
   * • defaultThreshold: Starting sensitivity (0.6 recommended)
   * • maxMatches: Maximum results to prevent performance issues
   * • debounceMilliseconds: Input delay before clearing (300ms default)
   * • minTextLength: Ignore elements with less text (2 chars)
   * • maxTextLength: Ignore elements with more text (500 chars)
   * • enableLogging: Set to true for debugging in console
   *
   * ═══════════════════════════════════════════════════════════════════════════
   */

  let CONFIGURATION = {
    globalEnabled: false,
    defaultThreshold: 0.6,
    maxMatches: 100,
    debounceMilliseconds: 300,
    cssPrefix: "fuzzy",
    minTextLength: 2,
    maxTextLength: 500,
    enableLogging: true,
  };

  const CLASSES = {
    searchBar: `${CONFIGURATION.cssPrefix}-search-bar`,
    input: `${CONFIGURATION.cssPrefix}-search-input`,
    button: `${CONFIGURATION.cssPrefix}-search-btn`,
    thresholdButton: `${CONFIGURATION.cssPrefix}-set-thresh-btn`,
    label: `${CONFIGURATION.cssPrefix}-threshold-label`,
    highlight: `${CONFIGURATION.cssPrefix}-highlight`,
    currentHighlight: `${CONFIGURATION.cssPrefix}-current-highlight`,
    noMatches: `${CONFIGURATION.cssPrefix}-no-matches`,
  };

  const EXCLUDED_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "META",
    "LINK",
    "TITLE",
    "HEAD",
  ]);

  const logger = {
    log: (...args) =>
      CONFIGURATION.enableLogging && console.log("[FUZZY]", ...args),
    warn: (...args) =>
      CONFIGURATION.enableLogging && console.warn("[FUZZY]", ...args),
    error: (...args) =>
      CONFIGURATION.enableLogging && console.error("[FUZZY]", ...args),
  };

  // Load configuration from Chrome storage with callback
  function loadConfigurationFromStorage(callback) {
    chrome.storage.sync.get(CONFIGURATION, (items) => {
      CONFIGURATION.globalEnabled =
        items.globalEnabled !== undefined ? items.globalEnabled : false;
      CONFIGURATION.defaultThreshold = items.defaultThreshold || 0.6;
      CONFIGURATION.maxMatches = items.maxMatches || 100;
      CONFIGURATION.debounceMilliseconds = items.debounceMilliseconds || 300;
      CONFIGURATION.minTextLength = items.minTextLength || 2;
      CONFIGURATION.maxTextLength = items.maxTextLength || 500;
      CONFIGURATION.enableLogging = items.enableLogging || true;
      logger.log("Configuration loaded from storage:", CONFIGURATION);
      if (callback) callback();
    });
  }

  class FuzzySearchState {
    constructor() {
      this.threshold = CONFIGURATION.defaultThreshold;
      this.matches = [];
      this.matchSimilarities = [];
      this.currentIndex = -1;
      this.debounceTimer = null;
      this.lastQuery = "";
      this.mutationObserver = null;
      this.observerConnected = false;
    }

    get matchCount() {
      return this.matches.length;
    }

    reset() {
      this.matches = [];
      this.matchSimilarities = [];
      this.currentIndex = -1;
    }

    invalidateMatches() {
      const validMatches = [];
      const validSimilarities = [];

      this.matches.forEach((element, index) => {
        if (document.body.contains(element)) {
          validMatches.push(element);
          validSimilarities.push(this.matchSimilarities[index]);
        }
      });

      this.matches = validMatches;
      this.matchSimilarities = validSimilarities;

      if (this.currentIndex >= this.matches.length) {
        this.currentIndex = this.matches.length - 1;
      }
    }

    nextIndex() {
      if (this.matchCount === 0) return -1;
      const oldIndex = this.currentIndex;
      this.currentIndex = (this.currentIndex + 1) % this.matchCount;
      logger.log(
        `Nav: ${oldIndex + 1} → ${this.currentIndex + 1}/${this.matchCount}`
      );
      return this.currentIndex;
    }
  }

  function damerauLevenshteinSimilarity(first, second) {
    if (first === second) return 1.0;
    const firstLength = first.length;
    const secondLength = second.length;
    if (firstLength === 0 && secondLength === 0) return 1;
    if (firstLength === 0 || secondLength === 0) return 0;

    let [shorter, longer, minLength, maxLength] =
      firstLength > secondLength
        ? [second, first, secondLength, firstLength]
        : [first, second, firstLength, secondLength];

    let twoRowsBack = Array(maxLength + 1).fill(0);
    let previousRow = Array(maxLength + 1)
      .fill(0)
      .map((_, index) => index);
    let currentRow = Array(maxLength + 1).fill(0);

    for (let firstIndex = 1; firstIndex <= minLength; firstIndex++) {
      currentRow[0] = firstIndex;
      for (let secondIndex = 1; secondIndex <= maxLength; secondIndex++) {
        const cost =
          shorter[firstIndex - 1] === longer[secondIndex - 1] ? 0 : 1;
        let minEdit = Math.min(
          previousRow[secondIndex] + 1,
          currentRow[secondIndex - 1] + 1,
          previousRow[secondIndex - 1] + cost
        );
        if (
          firstIndex > 1 &&
          secondIndex > 1 &&
          shorter[firstIndex - 1] === longer[secondIndex - 2] &&
          shorter[firstIndex - 2] === longer[secondIndex - 1]
        ) {
          minEdit = Math.min(minEdit, twoRowsBack[secondIndex - 2] + 1);
        }
        currentRow[secondIndex] = minEdit;
      }
      [twoRowsBack, previousRow, currentRow] = [
        previousRow,
        currentRow,
        twoRowsBack,
      ];
    }
    return 1 - previousRow[maxLength] / Math.max(firstLength, secondLength);
  }

  function smartSimilarity(query, text) {
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    const textLength = text.length;

    if (textLower.includes(queryLower)) {
      const lengthRatio = queryLower.length / textLength;
      const lengthPenalty = Math.pow(lengthRatio, 0.3);
      const score = 0.7 + 0.3 * lengthPenalty;
      return Math.max(0.7, Math.min(1.0, score));
    }

    const words = textLower.split(/\s+/).filter((w) => w.length >= 2);
    let bestWordScore = 0;

    for (const word of words) {
      const score = damerauLevenshteinSimilarity(queryLower, word);
      if (score > bestWordScore) {
        bestWordScore = score;
      }
      if (score === 1.0) break;
    }

    return bestWordScore;
  }

  function isValidElement(node) {
    if (
      EXCLUDED_TAGS.has(node.tagName) ||
      node.classList.contains(CLASSES.searchBar)
    ) {
      return false;
    }

    const style = window.getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") {
      return false;
    }

    if (node.offsetWidth === 0 && node.offsetHeight === 0) {
      return false;
    }

    return true;
  }

  function getDomDepth(element) {
    let depth = 0;
    let node = element;
    while (node.parentElement) {
      depth++;
      node = node.parentElement;
    }
    return depth;
  }

  function removeNestedMatches(matchData) {
    if (matchData.length === 0) return [];

    const withDepth = matchData.map((m) => ({
      ...m,
      depth: getDomDepth(m.element),
    }));
    withDepth.sort((a, b) => b.depth - a.depth);

    const keptElements = new Set();
    const ancestorsOfKept = new Set();

    for (const item of withDepth) {
      if (ancestorsOfKept.has(item.element)) {
        logger.log(
          `Removing parent: "${item.text.substring(
            0,
            50
          )}..." (child already matched)`
        );
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

  function findMatches(query, threshold) {
    logger.log(`🔍 Search: "${query}" (threshold: ${threshold})`);

    const matchData = [];

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT,
      (node) =>
        isValidElement(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
    );

    let node;
    while (
      (node = walker.nextNode()) &&
      matchData.length < CONFIGURATION.maxMatches
    ) {
      const textContent = node.textContent.trim();
      const textLength = textContent.length;

      if (
        textLength <= CONFIGURATION.minTextLength ||
        textLength > CONFIGURATION.maxTextLength
      ) {
        continue;
      }

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

    matchData.sort((a, b) => {
      const scoreDiff = b.similarity - a.similarity;
      if (Math.abs(scoreDiff) > 0.01) return scoreDiff;
      return a.textLength - b.textLength;
    });

    const deduplicated = removeNestedMatches(matchData);

    logger.log(
      `✓ Found ${deduplicated.length} unique matches (${matchData.length} before dedup)`
    );
    if (deduplicated.length > 0) {
      logger.log(
        "Top 5:",
        deduplicated
          .slice(0, 5)
          .map(
            (m) =>
              `${m.similarity.toFixed(3)} (${
                m.textLength
              }ch): "${m.text.substring(0, 60)}..."`
          )
      );
    }

    return {
      matches: deduplicated.map((m) => m.element),
      similarities: deduplicated.map((m) => m.similarity),
    };
  }

  function injectStyles() {
    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href =
      "https://fonts.googleapis.com/css2?family=Victor+Mono:wght@400;600&display=swap";
    document.head.appendChild(fontLink);

    const style = document.createElement("style");
    style.textContent = `
    .${CLASSES.searchBar} {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      background: #2d1b4e !important;
      border-bottom: 2px solid #7c3aed !important;
      z-index: 9999 !important;
      padding: 10px !important;
      box-sizing: border-box !important;
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 10px !important;
      align-items: center !important;
      font-family: 'Victor Mono', monospace, sans-serif !important;
    }

    .${CLASSES.input} {
      flex: 1 1 200px !important;
      min-width: 200px !important;
      padding: 8px 12px !important;
      background: #1e1333 !important;
      border: 1px solid #6d28d9 !important;
      border-radius: 4px !important;
      color: #e9d5ff !important;
      font-size: 14px !important;
      outline: none !important;
      font-family: 'Victor Mono', monospace, sans-serif !important;
      line-height: normal !important;
      vertical-align: middle !important;
    }

    .${CLASSES.button},
    .${CLASSES.thresholdButton} {
      padding: 8px 16px !important;
      background: #7c3aed !important;
      border: none !important;
      border-radius: 4px !important;
      color: #f3e8ff !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      font-size: 14px !important;
      transition: background 0.2s !important;
      font-family: 'Victor Mono', monospace, sans-serif !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      line-height: 1 !important;
      vertical-align: middle !important;
      text-align: center !important;
      white-space: nowrap !important;
      height: 36px !important;
      box-sizing: border-box !important;
    }

    .${CLASSES.thresholdButton} {
      background: #6d28d9 !important;
    }

    .${CLASSES.button}:hover,
    .${CLASSES.thresholdButton}:hover {
      background: #8b5cf6 !important;
    }

    .${CLASSES.label} {
      color: #c4b5fd !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      font-family: 'Victor Mono', monospace, sans-serif !important;
      line-height: 1 !important;
      display: inline-flex !important;
      align-items: center !important;
      height: 36px !important;
    }

    .${CLASSES.highlight} {
      background-color: rgba(168, 85, 247, 0.3) !important;
      outline: 2px solid #d946ef !important;
    }

    .${CLASSES.currentHighlight} {
      background-color: rgba(168, 85, 247, 0.5) !important;
      outline: 3px solid #ec4899 !important;
      box-shadow: 0 0 10px rgba(236, 72, 153, 0.5) !important;
    }

    .${CLASSES.noMatches} {
      color: #fbbf24 !important;
    }
  `;
    document.head.appendChild(style);
  }

  function createUserInterface(state, handlers) {
    const searchBar = document.createElement("div");
    searchBar.className = CLASSES.searchBar;

    const input = document.createElement("input");
    input.type = "search";
    input.className = CLASSES.input;
    input.placeholder = "Fuzzy search...";
    input.autocomplete = "off";

    const searchButton = document.createElement("button");
    searchButton.className = CLASSES.button;
    searchButton.textContent = "Search";
    searchButton.type = "button";

    const thresholdButton = document.createElement("button");
    thresholdButton.className = CLASSES.thresholdButton;
    thresholdButton.textContent = "Threshold";
    thresholdButton.type = "button";

    const label = document.createElement("span");
    label.className = CLASSES.label;

    searchButton.onclick = () => handlers.navigate();
    thresholdButton.onclick = () => handlers.setThreshold();

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handlers.navigate();
      } else if (event.key === "Escape") {
        handlers.clear();
        input.value = "";
        input.blur();
      }
    });

    input.addEventListener("input", () => {
      clearTimeout(state.debounceTimer);
      if (!input.value.trim()) {
        state.debounceTimer = setTimeout(
          handlers.clear,
          CONFIGURATION.debounceMilliseconds
        );
      }
    });

    searchBar.append(input, searchButton, thresholdButton, label);
    document.body.prepend(searchBar);

    return { input, label };
  }

  function setupMutationObserver(state) {
    let mutationDebounce = null;

    const callback = () => {
      if (state.matchCount === 0) return;

      clearTimeout(mutationDebounce);
      mutationDebounce = setTimeout(() => {
        logger.log("DOM mutated, invalidating matches");
        state.invalidateMatches();

        if (state.matchCount === 0 && state.lastQuery) {
          logger.warn("All matches invalidated by DOM mutations");
        }
      }, 200);
    };

    const observer = new MutationObserver(callback);
    state.mutationObserver = observer;
    state.observerConnected = false;
  }

  function connectObserver(state) {
    if (!state.mutationObserver || state.observerConnected) return;

    state.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
    state.observerConnected = true;
    logger.log("MutationObserver connected");
  }

  function disconnectObserver(state) {
    if (!state.mutationObserver || !state.observerConnected) return;

    state.mutationObserver.disconnect();
    state.observerConnected = false;
    logger.log("MutationObserver disconnected");
  }

  function updateDisplay(label, state) {
    const displayText =
      state.matchCount > 0
        ? `${state.threshold.toFixed(2)} (${state.currentIndex + 1}/${
            state.matchCount
          })`
        : `${state.threshold.toFixed(2)} (—)`;
    label.textContent = displayText;
    label.classList.toggle(CLASSES.noMatches, state.matchCount === 0);
  }

  function highlightMatches(state) {
    state.matches.forEach((element, index) => {
      if (document.body.contains(element)) {
        element.classList.add(CLASSES.highlight);
        if (index === state.currentIndex) {
          element.classList.add(CLASSES.currentHighlight);
        }
      }
    });
  }

  function clearHighlights(state) {
    document
      .querySelectorAll(`.${CLASSES.highlight}, .${CLASSES.currentHighlight}`)
      .forEach((element) =>
        element.classList.remove(CLASSES.highlight, CLASSES.currentHighlight)
      );
    state.reset();
  }

  function ensureValidMatches(state, query, handlers) {
    if (query !== state.lastQuery) {
      handlers.search(query);
      return state.matchCount > 0;
    }

    if (state.matchCount === 0) {
      return false;
    }

    state.invalidateMatches();

    if (state.matchCount === 0) {
      handlers.search(query);
    }

    return state.matchCount > 0;
  }

  function initialize() {
    logger.log("Fuzzy Search v5.0");
    const state = new FuzzySearchState();
    injectStyles();

    const handlers = {
      search: (query) => {
        const trimmed = query.trim();
        if (!trimmed) {
          clearHighlights(state);
          disconnectObserver(state);
          updateDisplay(userInterface.label, state);
          return;
        }

        state.lastQuery = trimmed;
        clearHighlights(state);

        const result = findMatches(trimmed, state.threshold);
        state.matches = result.matches;
        state.matchSimilarities = result.similarities;

        if (state.matchCount > 0) {
          highlightMatches(state);
          connectObserver(state);
        } else {
          disconnectObserver(state);
        }

        updateDisplay(userInterface.label, state);
      },

      navigate: () => {
        const query = userInterface.input.value.trim();

        if (!query) {
          handlers.clear();
          return;
        }

        const matchesReady = ensureValidMatches(state, query, handlers);
        if (!matchesReady) return;

        if (state.currentIndex >= 0) {
          const previous = state.matches[state.currentIndex];
          if (document.body.contains(previous)) {
            previous.classList.remove(CLASSES.currentHighlight);
          }
        }

        state.nextIndex();
        const current = state.matches[state.currentIndex];

        if (!document.body.contains(current)) {
          throw new Error("Current match element no longer in DOM");
        }

        current.classList.add(CLASSES.currentHighlight);
        current.scrollIntoView({ behavior: "smooth", block: "center" });

        updateDisplay(userInterface.label, state);
      },

      setThreshold: () => {
        const description = `Threshold controls match sensitivity:
• 1.0 = exact matches only
• 0.8 = strict (minor typos)
• 0.6 = balanced (default)
• 0.4 = loose (major differences)
• 0.0 = matches everything

Current: ${state.threshold.toFixed(2)}`;

        const newValue = prompt(description, state.threshold.toFixed(2));
        if (newValue === null) return;

        const parsed = parseFloat(newValue);
        if (isNaN(parsed) || parsed < 0 || parsed > 1) {
          alert("Invalid threshold. Must be between 0 and 1.");
          return;
        }

        state.threshold = parsed;
        updateDisplay(userInterface.label, state);

        if (userInterface.input.value.trim()) {
          handlers.search(userInterface.input.value);
        }
      },

      clear: () => {
        clearHighlights(state);
        disconnectObserver(state);
        state.lastQuery = "";
        updateDisplay(userInterface.label, state);
      },
    };

    const userInterface = createUserInterface(state, handlers);
    setupMutationObserver(state);
    updateDisplay(userInterface.label, state);

    setTimeout(() => userInterface.input.focus(), 100);

    return { userInterface, state, handlers };
  }

  // Determine if search should be enabled based on global + site override
  function isSearchEnabled() {
    if (siteOverride !== null) {
      return siteOverride;
    }
    return CONFIGURATION.globalEnabled;
  }

  // Track site-specific override (null = use global, true/false = override)
  let siteOverride = null;
  let searchEnabled = isSearchEnabled();
  let instance = null;

  // Load config first, then initialize
  loadConfigurationFromStorage(() => {
    searchEnabled = isSearchEnabled();
    if (searchEnabled) {
      instance = initialize();
    } else {
      logger.log("Extension disabled globally - search bar not initialized");
    }
  });

  // Message listener for popup toggle and options reload
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(
      "[FUZZY-LISTENER] Message received from",
      sender.url,
      "Action:",
      request.action
    );

    try {
      if (request.action === "toggleSearch") {
        console.log("[FUZZY] ===== TOGGLE ACTION RECEIVED =====");
        console.log("[FUZZY] Before toggle - searchEnabled:", searchEnabled);
        console.log("[FUZZY] Site override before:", siteOverride);

        siteOverride =
          siteOverride === null ? !CONFIGURATION.globalEnabled : !siteOverride;
        searchEnabled = isSearchEnabled();

        console.log("[FUZZY] Site override after:", siteOverride);
        console.log("[FUZZY] After toggle - searchEnabled:", searchEnabled);

        if (!searchEnabled) {
          console.log("[FUZZY] DISABLING SEARCH");
          const searchBar = document.querySelector(`.${CLASSES.searchBar}`);
          console.log("[FUZZY] Search bar found:", !!searchBar);

          if (searchBar) {
            searchBar.remove();
            console.log("[FUZZY] Search bar removed");
          }

          if (instance && instance.state) {
            console.log(
              "[FUZZY] Clearing highlights and disconnecting observer"
            );
            clearHighlights(instance.state);
            disconnectObserver(instance.state);
          } else {
            console.log("[FUZZY] Instance is null - no cleanup needed");
          }
        } else {
          console.log("[FUZZY] ENABLING SEARCH");
          instance = initialize();
          console.log("[FUZZY] New instance created");
        }

        console.log("[FUZZY] Sending response - enabled:", searchEnabled);
        sendResponse({ enabled: searchEnabled });
        return true;
      } else if (request.action === "getStatus") {
        console.log("[FUZZY] Status request - enabled:", searchEnabled);
        console.log("[FUZZY] Global enabled:", CONFIGURATION.globalEnabled);
        console.log("[FUZZY] Site override:", siteOverride);
        sendResponse({
          enabled: searchEnabled,
          globalEnabled: CONFIGURATION.globalEnabled,
          siteOverride: siteOverride,
        });
        return true;
      } else if (request.action === "reloadConfig") {
        console.log("[FUZZY] Reload config request");
        loadConfigurationFromStorage(() => {
          const oldEnabled = searchEnabled;
          searchEnabled = isSearchEnabled();

          if (oldEnabled !== searchEnabled) {
            if (!searchEnabled) {
              const searchBar = document.querySelector(`.${CLASSES.searchBar}`);
              if (searchBar) searchBar.remove();
              if (instance && instance.state) {
                clearHighlights(instance.state);
                disconnectObserver(instance.state);
              }
            } else {
              instance = initialize();
            }
          } else if (searchEnabled && instance) {
            const searchBar = document.querySelector(`.${CLASSES.searchBar}`);
            if (searchBar) searchBar.remove();
            clearHighlights(instance.state);
            disconnectObserver(instance.state);
            instance = initialize();
          }

          logger.log("Configuration reloaded");
        });

        sendResponse({ success: true });
        return true;
      }
    } catch (error) {
      console.error("[FUZZY-ERROR]", error);
      logger.error("Message handler error:", error);
      sendResponse({ error: error.message });
      return true;
    }
  });
})();
