## Overview
This release improves mobile score-entry usability across all games and adds versioned asset loading so updates appear more reliably, especially on phones.

## New Features
- **Build Version in About**: Shows the current release timestamp in the About dialog header so you can confirm which build is running.
- **Versioned Asset URLs**: Loads CSS and JavaScript files with a release version query string to reduce stale-cache issues after deployment.

## Improvements
- **All-Game Mobile Table Compaction**: Reduces score column widths, spacing, and input sizing on Yahtzee, Scrabble, Trepenta, and Three Thirteen for easier phone use.
- **About Dialog Header Layout**: Aligns the build version to the right of the About title for quick visual verification.

## Bug Fixes
- **Mobile Update Visibility**: Fixes cases where mobile devices could continue loading stale CSS/JS after release.
- **Release Script Asset Versioning**: Fixes release script handling so timestamped asset query updates run without parser errors.

## Technical Changes
- **Global Mobile CSS Rules**: Adds shared small-screen scoreboard rules for Yahtzee, Scrabble, Trepenta, and Three Thirteen in `styles.css`.
- **Automatic Asset Version Stamping**: Adds `Update-AssetVersionReferences` to `release.ps1` and runs it with each release timestamp.
- **Version Detection Logic**: Adds asset query-string parsing in `app.js` and formats build output as `YYYY-MM-DD-HH-mm`.

## Installation
1. Clone this repository
2. Open `index.html` in a modern web browser (Chromium, Firefox, or Safari)
3. Or visit the hosted version at https://scorekeeper.ignyos.com/

## Requirements
- Modern web browser with IndexedDB support (Chromium 25+, Firefox 16+, Safari 10+)
- No backend server or additional dependencies required

## Documentation
- See [requirements.md](requirements.md) for feature specifications and acceptance criteria.
- See [RELEASE_NOTES_STYLE.md](RELEASE_NOTES_STYLE.md) for release note formatting guidelines.