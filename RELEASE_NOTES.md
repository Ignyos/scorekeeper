## Overview
This release improves the Three Thirteen score entry layout by better using available screen height and reducing horizontal scrolling on mobile.

## New Features
- **Viewport-Fit Three Thirteen Layout**: Sizes the Three Thirteen game card to visible viewport space so the scoreboard area remains easier to use across devices.

## Improvements
- **Mobile Scoreboard Compaction**: Reduces Three Thirteen column and input widths on small screens to minimize left-right scrolling.
- **Score Area Prioritization**: Keeps the score sheet as the primary scroll region within the Three Thirteen game card.

## Bug Fixes
- **Small-Screen Table Usability**: Fixes cramped Three Thirteen table behavior on phones by tightening spacing and control sizing.

## Technical Changes
- **Three Thirteen Flex Card Structure**: Uses `ttt-game-card` and a flexible `ttt-sheet-wrap` so the score area can expand within available height.
- **Viewport Height Sync**: Replaces sheet-only max-height logic with viewport-based card height recalculation on resize and orientation changes.
- **Responsive Table Rules**: Adds a mobile media query that switches Three Thirteen to compact fixed-layout columns and narrower score controls.

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