## Overview
This release adds full Scrabble support with round-based scoring, in-game score correction for completed rounds, and route/session updates so Scrabble works end-to-end across Home, game play, and History.

## New Features
- **Scrabble Game Mode**: Adds a dedicated Scrabble game page with New Game flow, player selection, and session persistence.
- **Round-Based Scrabble Scoreboard**: Uses a round table with one active input row, auto-advances when all players submit valid round scores, and keeps running totals visible.
- **Completed Round Score Editing**: Lets players correct previously entered Scrabble scores during active games using per-cell edit controls.

## Improvements
- **Scrabble Score Entry UX**: Focuses the next active Scrabble input automatically and commits values on Enter for faster turn-by-turn entry.
- **Scrabble Table Styling**: Improves readability with dedicated Scrabble table layout, active-row highlighting, and cleaner number inputs.
- **Game Routing Coverage**: Adds Scrabble route handling for both standard and file-based paths.

## Bug Fixes
- **History Continue Links**: Fixes Continue links to open the correct game route instead of always routing to Yahtzee.
- **Scrabble History Outcomes**: Resolves "Outcome unavailable" for Scrabble sessions by computing results from round-based game state when needed.

## Technical Changes
- **Game Registry Expansion**: Registers Scrabble in the game registry for Home and History integration.
- **Session Metadata Support**: Updates session creation to store game-specific metadata (`game`, `gameClass`, `gameVersion`) instead of hardcoded Yahtzee values.
- **Scrabble Modules**: Adds `scrabble/ScrabbleGame.js`, `scrabble/scrabblePage.js`, and `scrabble/index.html`.

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