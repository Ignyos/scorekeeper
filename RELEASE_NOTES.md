## Overview
This release adds Chess Timer as a fully-featured chess clock game, supporting all standard timing controls used in competitive and casual play.

## New Features
- **Chess Timer Game**: Adds Chess Timer as a playable game with a two-player live clock, full session persistence, and a completed-game results view.
- **Nine Timing Modes**: Supports No Timer, Sudden Death, Fischer Increment, Bronstein Delay, US Delay, Hourglass, Per-Move, Hybrid (base + per-move), and Stage-Based time controls.
- **Time Control Presets**: Includes 14 one-tap presets across Bullet (1+0, 1+1, 2+1), Blitz (3+0, 3+2, 5+0, 5+3), Rapid (10+0, 10+5, 15+10, 25+10), and Classical (60+0, 90+30, 120+0) categories.
- **Custom Time Controls**: Allows fully custom configuration of base time, increment, delay, per-move limit, and multi-stage parameters.
- **Stage-Based Time Control**: Supports multi-phase tournament formats (e.g., 40 moves in 90 minutes, then +30 minutes for the rest of the game).
- **End Game Flow**: Adds an End Game button that pauses the clock and lets players declare a winner or agree to a draw without waiting for time to expire.

## Improvements
- **Winner Celebration on Chess Timer**: Displays the winner celebration modal when a player wins on time or is declared the winner manually; skips celebration on draws.
- **Black Clock Rotation**: Rotates Black's clock 180° so both players face their own display when the phone is placed between them.
- **Auto-Pause on Tab Switch**: Automatically pauses the clock when the browser tab is hidden, preventing unintended time loss.
- **Explicit Player Entry**: Requires both White and Black players to be explicitly selected or entered by name — no default player fallbacks.

## Technical Changes
- **Chess Timer Modules**: Adds `chesstimer/ChessTimerGame.js` for game state management and `chesstimer/chessTimerPage.js` for UI rendering and wiring.
- **App Integration**: Adds Chess Timer route support, in-app rules content, history outcome calculation, and `renderChessTimer` wiring in `js/app.js`.
- **Registry and Router Updates**: Registers the `chesstimer` slug in `js/registry.js` and adds route matching in `js/router.js`.

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