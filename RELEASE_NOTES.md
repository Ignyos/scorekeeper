## Overview
This release adds full Three to Thirteen support, updates new-game player ordering across game setup flows, and applies a consistent site icon across pages.

## New Features
- **Three to Thirteen Game Mode**: Adds a dedicated Three to Thirteen game with 11 rounds (3 through 13), rotating dealer assignment, per-round winner selection, and lowest-total scoring.
- **Three to Thirteen Session Flow**: Adds start, play, and end-game flows with session persistence, final results ranking, and Home return after completion.

## Improvements
- **Player Order Controls**: Adds move-up and move-down controls in game setup so selected players can be reordered before starting.
- **Start Game Clarity**: Adds a setup note that selection order determines player order.
- **New Game Entry Flow**: Opens the player selection modal immediately on new game pages for Yahtzee, Scrabble, and Three to Thirteen.
- **Page Branding Consistency**: Adds the Ignyos favicon to Home and game/support pages for a consistent browser tab icon.

## Bug Fixes
- **Three to Thirteen History Ranking**: Computes completed-game totals from round scores and sorts by lowest total so outcomes display correctly for Three to Thirteen sessions.

## Technical Changes
- **Game Registration & Routing**: Registers Three to Thirteen in the game registry and adds route handling for standard and subfolder paths.
- **Three to Thirteen Modules**: Adds `threetothirteen/ThreeToThirteenGame.js`, `threetothirteen/threetothirteenPage.js`, and `threetothirteen/index.html`.
- **Three to Thirteen Styling**: Adds dedicated table, score input, and winner toggle styles for the new scoreboard UI.

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