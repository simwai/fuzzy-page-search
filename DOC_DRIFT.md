# Documentation Drift Report

**Date/Time:** Fri Sep 25 23:15:39 UTC 2026
**Branch Analyzed:** main

## Files Reviewed
- `manifest.json`
- `content.js`
- `popup.html`
- `popup.js`
- `options.html`
- `README.md`

## Regressions Found
1. **Version Mismatch**: `content.js` header claimed version 5.0, while `manifest.json` specifies version 1.0.
2. **Missing Extension Setup Instructions**: `README.md` lacked Chrome unpacked extension installation steps (`chrome://extensions`).
3. **Unclear Default State**: `content.js` sets `globalEnabled: false` by default, but user instructions did not explain that search will not appear until explicitly enabled via the popup.
4. **Non-functional Options Page**: `options.html` references missing `options.js`.

## Files Changed
- `README.md`
- `DOC_DRIFT.md`

## Fixes Made
- Updated `README.md` with explicit Chrome extension installation/onboarding steps.
- Clarified default disabled state (`globalEnabled: false`) and popup per-site toggle usage in `README.md`.
- Standardized project version to 1.0 in `README.md` (matching `manifest.json`).
- Documented missing `options.js` backend logic limitation for `options.html`.
