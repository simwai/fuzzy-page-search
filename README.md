# Fuzzy Page Search

Fuzzy, deduplicated, keyboard-navigable search for any web page.

## Version 1.0

## Features
- **Fuzzy Matching**: Uses the Damerau-Levenshtein algorithm to handle typos and approximate matches.
- **Match Deduplication**: Intelligently removes parent/container matches when child elements also match.
- **Keyboard Navigation**:
  - `Enter`: Cycle through matches.
  - `Escape`: Clear search and unfocus input.
- **Adjustable Threshold**: Fine-tune match sensitivity (0.0 for loose, 1.0 for exact).
- **DOM Mutation Tracking**: Automatically updates matches when the page content changes.
- **Visual Highlighting**: Highlights matches and provides smooth scrolling to the current result.

## Usage
1. Click the extension icon in your browser.
2. Ensure the extension is enabled for the current site.
3. A search bar will appear at the top of the page.
4. Type your query into the search bar.
5. Use **Enter** to navigate through matches and **Escape** to clear the search.
6. Click the **Threshold** button to adjust sensitivity via a prompt.

## Configuration
Settings can be accessed via the **Options** page (accessible from the extension popup).

*Note: The Options page currently has limited functionality as the backend logic (`options.js`) is missing from this build.*

The following settings are available:
- **Global Toggle**: Enable or disable the extension for all sites.
- **Default Threshold**: Set the starting sensitivity (default: 0.6).
- **Maximum Matches**: Limit the number of results for performance (default: 100).
- **Debounce Milliseconds**: Input delay before clearing empty search (default: 300ms).
- **Text Length Limits**: Ignore elements with text shorter than 2 or longer than 500 characters.
- **Console Logging**: Enable detailed logs in the browser console for debugging.

## Developer Information
This extension is built with Manifest V3 and uses a vanilla JavaScript content script (`content.js`) to provide the search functionality.

### Key Files
- `manifest.json`: Extension configuration.
- `content.js`: Core search logic and UI.
- `popup.html` / `popup.js`: Extension popup UI and logic.
- `options.html`: Extension options page UI.
