## Overview
This release updates Chess Timer with player-controlled clock orientation. Each side now includes a rotate control while preserving the existing default board layout.

## New Features
- **Clock Rotation Controls**: Adds a rotate button on both Chess Timer clocks so each player can choose their preferred orientation during play.

## Improvements
- **Default Orientation Preserved**: Keeps the current layout as the default, with White unrotated and Black rotated for across-the-board play.
- **Per-Player Orientation Persistence**: Saves each player's rotate choice in the game session so orientation remains consistent after state updates.

## Bug Fixes
- **Clock Tap Safety**: Prevents rotate button interaction from triggering a clock tap or unintended turn switch.

## Technical Changes
- Adds persistent `clockRotatedByPlayer` state in Chess Timer game state initialization and hydration.
- Adds orientation defaulting, rotate button rendering, and rotate event handling in the Chess Timer page.
- Updates Chess Timer styles with class-based rotation and rotate button styling, including Safari `user-select` compatibility.

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