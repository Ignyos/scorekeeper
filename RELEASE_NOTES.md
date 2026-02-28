## Overview
This release adds in-app game rules across Home and active game screens, improves Scrabble score-entry/editing behavior, and refines game UI layout and branding assets.

## New Features
- **Game Rules Modal**: Adds detailed in-app rules for Yahtzee, Scrabble, and Three Thirteen in a shared modal.
- **Rules Access from Home**: Adds a Rules badge on each Home game card for quick rules access before starting.
- **Rules Access During Games**: Adds a Rules button on each game action row so players can review rules mid-session.

## Improvements
- **Rules Modal Usability**: Limits rules modal height to 90% of the viewport and enables internal scrolling for long rule content.
- **End-Game Modal Actions**: Adds a Home option in game end confirmation modals and uses a consistent left/center/right action layout.
- **Three Thirteen Scoreboard Layout**: Uses a more compact per-cell layout with score and winner controls on one row and the Win label above its radio.
- **About Modal Branding**: Shows the Ignyos logo next to the ignyos.com link in the About modal.
- **Game Naming Clarity**: Updates user-facing text from “Three to Thirteen” to “Three Thirteen”.

## Bug Fixes
- **Scrabble Round Progression**: Fixes active row commits so new rows are created reliably when a round is completed.
- **Scrabble Extra Blank Row**: Keeps one trailing blank row visible to make upcoming score entry clearer.
- **Scrabble Completed-Cell Editing**: Fixes completed-cell edit interactions and switches to full-cell tap/click editing for better mobile usability.
- **Scrabble Cross-Row Input Carryover**: Prevents stale input events from copying values into the next round.

## Technical Changes
- **Shared Rules Infrastructure**: Adds centralized rules content, modal rendering, trigger helpers, and URL-state handling in the app shell.
- **Game Page Integration**: Wires rules trigger helpers into Yahtzee, Scrabble, and Three Thirteen page render flows.
- **Brand Asset Organization**: Moves favicon references to the `images` folder, removes the root `.ico`, and adds `ignyos-logo.png` and `ignyos-logo.svg` assets.

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