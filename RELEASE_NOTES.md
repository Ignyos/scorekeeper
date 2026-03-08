## Overview
This release improves scoreboard readability in Three Thirteen and introduces a consistent, app-wide scrollbar style that matches the current visual theme.

## New Features
- **Themed Scrollbars**: Adds a site-wide custom scrollbar style so scrolling areas look consistent with the rest of the application.

## Improvements
- **Three Thirteen Scoreboard Header**: Keeps the player-name header row visible at the top while scrolling through rounds.

## Bug Fixes
- **Three Thirteen Name Visibility**: Fixes the scoreboard so player names remain visible during vertical scrolling.

## Technical Changes
- **Scrollbar Theme Tokens**: Adds reusable scrollbar CSS variables for size, track, thumb, and hover states.
- **Global Scrollbar Selectors**: Applies shared WebKit scrollbar styling across the app.
- **Three Thirteen Table Wrapper**: Adds a dedicated wrapper class and sticky table-header styling for the Three Thirteen score sheet.

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