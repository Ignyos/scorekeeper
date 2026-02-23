## Overview
Scorekeeper MVP launches with full Yahtzee scoring, local data persistence, and responsive mobile-first UI. This release includes player management, game session tracking, and automated release workflow infrastructure.

## New Features
- **Yahtzee Scorekeeper**: Complete Yahtzee game with category-by-row layout, live totals, and accurate bonus scoring (upper bonus at 63+, Yahtzee bonuses)
- **Player Management**: Create, rename, restore, and manage players with soft-delete protection for active sessions
- **Game Sessions**: Start Yahtzee games, track scores in real-time, and view running totals and leaderboard
- **History & Continue**: Resume active games and view past completed sessions with date-range formatting
- **Theme Persistence**: Select and save visual theme preference across browser sessions
- **Local Data Storage**: All data stored in IndexedDB with automatic save on every score update

## Improvements
- **Mobile-First UI**: Touch-friendly controls with 44px+ tap targets, responsive layout for all screen sizes
- **Live Score Updates**: Immediate total recalculation and leaderboard refresh as scores change
- **Special Scoring Rules**: Full Yahtzee rule implementation including forced/optional Joker placement and multiple Yahtzee bonuses

## Technical Changes
- IndexedDB database with `players`, `sessions`, and `settings` stores
- Game registry architecture supporting multiple game types
- Plain JavaScript implementation with no module dependencies
- Branch-gated release workflow (main branch only for production releases)
- Automated diff generation and release notes clipboard integration

## Installation
1. Clone this repository
2. Open `index.html` in a modern web browser (Chromium, Firefox, or Safari)
3. Or visit the hosted version at https://scorekeeper.ignyos.com/

## Requirements
- Modern web browser with IndexedDB support (Chromium 25+, Firefox 16+, Safari 10+)
- No backend server or additional dependencies required
- Minimum 44x44 pixel touch targets recommended for mobile devices

## Documentation
- See [requirements.md](requirements.md) for feature specifications and acceptance criteria
- See [RELEASE_NOTES_STYLE.md](RELEASE_NOTES_STYLE.md) for release note guidelines