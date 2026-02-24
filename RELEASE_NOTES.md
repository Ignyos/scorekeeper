## Overview
This release focuses on cleaner game organization, streamlined Yahtzee modal behavior, and a dark-mode-first default theme. It also adds release automation for tagged builds.

## New Features
- **Default Dark Theme**: Starts new users in dark mode by default while preserving saved theme preferences.
- **First Yahtzee Quick Apply**: Uses a simplified first-Yahtzee flow with a minimal Apply/Cancel interaction.

## Improvements
- **Game Folder Organization**: Consolidates Yahtzee game files under the Yahtzee route folder and updates script loading paths.
- **Route Script Loading**: Loads only required shared/game scripts per page for a cleaner structure.
- **Yahtzee Renderer Separation**: Moves Yahtzee page rendering logic out of the app shell into a dedicated page module.

## Bug Fixes
- **Hidden UI Elements**: Ensures elements using the `hidden` attribute stay hidden consistently by enforcing `[hidden] { display: none !important; }`.

## Technical Changes
- **Release Workflow**: Adds a GitHub Actions workflow to create releases automatically on tag pushes using `RELEASE_NOTES.md`.
- **Registry Path Update**: Moves the game registry file from `js/games/registry.js` to `js/registry.js`.
- **File Layout Update**: Moves Yahtzee game files from `js/games/*` to `yahtzee/*` and adds `yahtzee/yahtzeePage.js`.

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