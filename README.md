# Fuzzy Page Search

Fuzzy, deduplicated, keyboard-navigable search for any web page.

## Version 1.0

## Installation
1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle switch in the top right corner.
4. Click **Load unpacked** and select the root directory of this repository.

## Features
- **Fuzzy Matching**: Uses the Damerau-Levenshtein algorithm to handle typos and approximate matches.
- **Match Deduplication**: Intelligently removes parent/container matches when child elements also match.
- **Keyboard Navigation**:
  - `Enter`: Cycle through matches.
  - `Escape`: Clear search and unfocus input.
- **Adjustable Threshold**: Fine-tune match sensitivity (0.0 for loose, 1.0 for exact).
- **DOM Mutation Tracking**: Automatically updates matches when page content changes dynamically.
- **Visual Highlighting**: Highlights matches and provides smooth scrolling to the active result.

## Usage
1. Click the extension icon in your browser toolbar to open the popup.
2. Note that the extension is **disabled globally by default** (`globalEnabled: false`). Click **Enable for This Site** in the popup to activate search on the current tab.
3. A search bar will appear fixed at the top of the page.
4. Type your query into the search bar.
5. Use **Enter** to navigate through matches and **Escape** to clear the search.
6. Click the **Threshold** button to adjust match sensitivity via a browser prompt.

## Configuration
Settings can be accessed via the **Options** page (accessible by clicking **Options** in the popup).

*Note: The Options page template exists in `options.html`, but backend storage logic (`options.js`) is currently missing from this build.*

Default configuration parameters in `content.js`:
- **Global Toggle** (`globalEnabled`): Disabled by default (`false`).
- **Default Threshold** (`defaultThreshold`): Starting sensitivity (`0.6`).
- **Maximum Matches** (`maxMatches`): Upper bound on result count (`100`).
- **Debounce Milliseconds** (`debounceMilliseconds`): Input delay before clearing empty search (`300ms`).
- **Text Length Limits** (`minTextLength` / `maxTextLength`): Ignores elements with text shorter than 2 or longer than 500 characters.
- **Console Logging** (`enableLogging`): Enables detailed debugging logs in the browser console (`true`).

## Developer Information
This extension is built using Manifest V3 and vanilla JavaScript.

### Key Files
- `manifest.json`: Extension manifest and configuration (version 1.0).
- `content.js`: Core search logic, DOM mutation observer, and search bar UI injection.
- `popup.html` / `popup.js`: Extension popup UI and per-site toggle logic.
- `options.html`: Extension options page template (requires `options.js` for persistence).
