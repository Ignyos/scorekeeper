# Release Notes — 2026-05-17

## Overview
This release adds a Final Results modal to Kan Jam, replacing the abrupt page reload that previously occurred at the end of a game. It also refines the release tooling prompt.

## New Features
- **Kan Jam — Final Results Modal**: After a game concludes (normal win or overtime), a "Final Results" screen now appears showing all teams ranked by score. A **Close** button returns to the home screen.

## Improvements
- **Kan Jam — Overtime End Flow**: The post-overtime last-chance sequence now shows the Final Results modal instead of immediately reloading the page, giving players a chance to review the outcome before leaving.

## Bug Fixes
No bug fixes in this release.

## Technical Changes
- Updated the AI release-notes prompt in `release.ps1` to use `#file:` context references and to fully replace `RELEASE_NOTES.md` content per release rather than appending to it.

## Installation
Open the app in any modern web browser. No installation is required — the app runs entirely in the browser.

## Requirements
- A modern web browser with JavaScript enabled (Chrome, Firefox, Safari, Edge)

## Documentation
See `requirements.md` for game rules and feature specifications.
