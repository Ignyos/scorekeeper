## Overview
This release adds an About entry in the main menu, introduces a simple About modal with an Ignyos link, and fixes the GitHub Pages deployment workflow configuration.

## New Features
- **About Menu Item**: Adds an About action to the main menu for quick access to site information.
- **About Modal**: Opens a simple About dialog with a short site description and a direct link to ignyos.com.

## Improvements
- **About Link Styling**: Keeps the About modal link in the app’s blue accent color, including the visited state.
- **Menu Visual Consistency**: Matches About button hover, spacing, and text size with other menu items.

## Bug Fixes
- **GitHub Pages Deploy Job**: Adds the required `github-pages` environment so the Pages deployment action runs without the "Missing environment" error.

## Technical Changes
- **Shared Shell Modal Integration**: Renders the About modal from the shared shell so it is available across app pages.
- **Menu Button Support**: Adds menu-panel button styling to support non-link menu actions with existing menu layout behavior.

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