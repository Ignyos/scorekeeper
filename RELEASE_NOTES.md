# Release Notes

## Overview
This release improves the user experience for score entry in round-based games by giving users full control over input focus and eliminating unexpected keyboard behavior.

## Improvements
- **Score Input Focus Control**: Focus now only moves when users explicitly tap an input. The app no longer automatically advances focus to the next field, allowing players to enter scores in any order they choose.
- **Keyboard Behavior**: The on-screen keyboard opens only when users tap an input and remains predictable—no unexpected auto-focus triggering unneeded keyboard popups.
- **Input Switching**: When tapping a different score field, the previous field's value is committed before focus switches, ensuring reliable data entry without forcing a specific entry order.

## Technical Changes
- Added shared focus management module (`focusManager.js`) that handles user-initiated focus control across all round-based games.
- Refactored Three Thirteen and Trepenta score entry to use the new focus manager, eliminating per-input event listeners and auto-advance logic.
- Score commit now uses `change` and `Enter` key events rather than blur events, providing more stable focus behavior.

## Affected Games
- **Three Thirteen**: Updated score entry UI with new focus control
- **Trepenta**: Updated score entry UI with new focus control

## Installation
Download and extract the latest release, or pull the latest changes from the repository.

## Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled

## Documentation
For gameplay rules and game-specific help, visit the [Scorekeeper home page](https://ignyos.com/scorekeeper/).
