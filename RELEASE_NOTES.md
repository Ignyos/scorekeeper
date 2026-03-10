## Overview
This release adds full support for Dice 10,000, introduces winner celebration animations across games, and improves game browsing and rules clarity.

## New Features
- **Dice 10,000 Game**: Adds Dice 10,000 as a playable game with round-by-round score entry, running totals, end-game results, and history/continue support.
- **Winner Celebration Modal**: Adds a full-screen winner celebration experience with animated effects and tie-aware winner display before final results.
- **Developer Celebration Tester (File Mode)**: Adds a local debug modal to test celebration names and animation variants with `Ctrl+Shift+D` when running from `file://`.

## Improvements
- **Trepenta Rules Content**: Expands Trepenta rules with setup steps, field and die value explanation, and exchange examples.
- **Alphabetical Game Ordering**: Sorts games alphabetically on the Home screen and in the History game filter.
- **End-Game Flow Consistency**: Updates Yahtzee, Scrabble, Three Thirteen, Trepenta, and Dice 10,000 to show celebration before final score results.

## Bug Fixes
- **Celebration Rendering Availability**: Ensures celebration animations load consistently by including the celebration script on main and sub-pages.
- **File-Mode Dice 10,000 Routing**: Fixes local file-mode navigation and route resolution for Dice 10,000 paths.

## Technical Changes
- **Canvas Celebration Engine**: Adds `js/celebration.js` with reusable canvas-based animation variants (`confetti`, `bursts`, `streamers`, `sparkles`).
- **Dice 10,000 Modules**: Adds `dice10000/Dice10000Game.js` and `dice10000/dice10000Page.js` for game state and UI rendering.
- **App Integration Updates**: Adds Dice 10,000 route/registry support, history outcome calculation, and shared celebration wiring across game renderers.

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