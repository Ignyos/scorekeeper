## Overview
This release adds full Trepenta support, including game setup, score tracking, and end-game results, plus related routing and UI updates.

## New Features
- **Trepenta Game Mode**: Adds Trepenta as a playable game with five rounds, rotating dealer display, per-round winner selection, and lowest-total scoring.
- **Trepenta Setup Options**: Adds deck configuration (standard decks or Trepenta suit count) and optional selectable house rules when starting a Trepenta session.
- **Trepenta Rules Content**: Adds in-app Trepenta rules in the shared Rules modal.
- **Trepenta Pages and Navigation**: Adds Trepenta to the game registry, routing, and page rendering flow so sessions can be started and resumed.

## Improvements
- **Session Details for Trepenta**: Shows Trepenta deck configuration and selected house rules in history/session cards.
- **Start Game Modal Scrolling**: Limits start-game modal height and enables internal scrolling for long setup content.
- **Home Card Actions Layout**: Uses full-width New/Continue buttons in a consistent grid layout on Home game cards.
- **Trepenta End-Game Actions**: Uses the same left/center/right confirmation action layout as other game end dialogs, including a Home action.
- **Score Sheet Header Alignment**: Centers row headers in Scrabble and Three Thirteen score sheets for consistent table presentation.

## Bug Fixes
- **Trepenta Final Totals in Session Views**: Computes Trepenta standings from round scores so rankings display correctly in session summaries.

## Technical Changes
- **New Trepenta Modules**: Adds `trepenta/TrepentaGame.js`, `trepenta/trepentaPage.js`, and `trepenta/index.html`.
- **App Shell Integration**: Extends route/path helpers and game rendering to include Trepenta.
- **Trepenta Styling**: Adds Trepenta-specific setup, rules, and scoreboard styles in `css/styles.css`.

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