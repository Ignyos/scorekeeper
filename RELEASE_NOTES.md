## Overview
This release improves score entry readability across games and updates Yahtzee roll handling with clearer actions for first-roll outcomes.

## New Features
- **Yahtzee Roll Actions**: Adds Clear and Forfeit actions in the Yahtzee roll modal to handle first-roll Yahtzee decisions directly.

## Improvements
- **Score Input Styling**: Updates score input fields in Yahtzee, Trepenta, Scrabble, and Three to Thirteen with bordered, surfaced inputs for clearer entry.
- **Three to Thirteen Winner Label**: Renames the winner toggle label from "Win" to "1st" for clearer placement meaning.
- **Yahtzee Action Layout**: Improves roll modal button layout so actions stay aligned and evenly sized.

## Bug Fixes
- **Yahtzee Cell Display**: Shows a dash for forfeited Yahtzee and keeps empty cells blank until a value is recorded.
- **Yahtzee Action Guardrails**: Restricts Clear and Forfeit availability based on current score state to prevent invalid updates.

## Technical Changes
- Adds Yahtzee modal action-state helpers to control Clear, Forfeit, and Apply visibility.
- Adds Yahtzee state sync logic to recompute Yahtzee count, totals, leaderboard, and timestamps after clearing.
- Updates Yahtzee modal rendering paths to support forfeited state handling and consistent preview visibility.

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