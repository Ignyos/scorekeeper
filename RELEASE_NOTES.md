## Overview
This release improves Home and About messaging, adds smarter Continue availability on game cards, and updates Trepenta house-rule details links to open the official rule sections directly.

## New Features
- **Trepenta Rule Deep Links**: Updates each Trepenta house rule with its own official section link on trepenta.ignyos.com.
- **Game Card Continue Availability**: Enables Continue on Home cards only when that game has an active session.

## Improvements
- **Home Hero Message**: Updates the Home tagline to “Scorekeeping made easy for every round, every game.”
- **About Modal Messaging**: Clarifies local-only data storage and adds explicit privacy wording.
- **About Attribution Row**: Updates the about link row to read “Developed by ignyos.com”.
- **Disabled Continue Styling**: Adds a visual disabled state for inactive Continue buttons on Home cards.

## Bug Fixes
- **Trepenta Rule Details Action**: Changes Trepenta house-rule Details actions to open the official rule page for the selected rule instead of the in-app modal.
- **Disabled Continue Interaction**: Prevents disabled Continue buttons from navigating when clicked.

## Technical Changes
- **Home Session Check Logic**: Adds active-session lookup on Home render to control per-game Continue state.
- **Trepenta Rule Metadata**: Extends selected Trepenta rule definitions to carry `officialUrl` values with fallbacks.
- **External Rule Link Handler**: Adds click handling for Trepenta rule links that open official URLs in a new tab.

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