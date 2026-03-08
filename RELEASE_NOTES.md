## Overview
This release improves Three Thirteen scoreboard behavior on mobile and desktop by making the score sheet adapt to available viewport space.

## New Features
- **Adaptive Scoreboard Height**: Adds viewport-aware sizing for the Three Thirteen score sheet so the round table stays usable on small screens.

## Improvements
- **Three Thirteen Scroll Experience**: Uses the score sheet as the main scroll area so player headers stay visible while reviewing rounds.

## Bug Fixes
- **Mobile Header Visibility**: Fixes cases where player names could scroll out of view when the page was taller than the viewport.

## Technical Changes
- **Three Thirteen Card Layout**: Adds a dedicated `ttt-game-card` container to support viewport-based score sheet sizing.
- **Viewport Resize Handling**: Adds resize, orientation, and visual viewport listeners to recalculate score sheet max height.
- **Sticky Header Layering**: Raises Three Thirteen header z-index for more reliable visibility above scrolling cells.

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