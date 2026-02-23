# Scorekeeper requirements

## 1) Product vision

Create a static website (hosted on GitHub Pages) to track scores for games.

Primary goals:
- Fast and simple score entry during live play.
- Works on mobile and desktop browsers.
- Stores all data locally in browser storage (IndexedDB).
- Supports multiple game types over time.

Initial focus:
- Card games first.
- Architecture must support board, dice, and other game types later.

## 2) Scope

### In scope (MVP)
- Manage players (create, rename, soft delete, restore).
- Start a game session and select a game type.
- Add/remove players from a session.
- Enter and update cumulative scores during play.
- Show running totals and current leader.
- Select and persist visual theme preference.
- Save data locally in IndexedDB.
- Browse and reopen historical sessions.
- Static deployment on GitHub Pages.

### Out of scope (MVP)
- User accounts and cloud sync.
- Real-time multiplayer across devices.
- AI score suggestions.
- Push notifications.

## 3) Hosting and platform constraints

- Must be a static site (HTML/CSS/JS only; no server runtime).
- Must be deployable with GitHub Pages from this repository.
- Production host is `scorekeeper.ignyos.com`.
- Root URL `https://scorekeeper.ignyos.com/` must load the home page.
- Must function without backend APIs.
- Must work in modern Chromium, Firefox, and Safari.

## 4) Functional requirements

### 4.1 Player management
- Create player with unique name (case-insensitive uniqueness among active players).
- Assign each player a generated 6-character GUID string ID.
- Player ID format for MVP: uppercase alphanumeric (`A-Z`, `0-9`), exactly 6 characters.
- Track last accessed timestamp when player is used in a session.
- Soft-delete players instead of hard delete.
- Prevent deleting a player if they are currently in an active session.

### 4.2 Game catalog
- Maintain a code-based registry of supported game classes.
- Each game class defines:
  - Scoring model.
  - Validation rules.
  - Win condition and ranking logic.

MVP game types:
- Yahtzee (first shipped game).

### 4.3 Session lifecycle
- Create session with selected game and participant list.
- Session states: active, completed, archived (optional later).
- Update current score values for each player as the game progresses.
- Allow correcting previously entered values before session completion.
- Complete session and lock final totals (while still viewable in history).

### 4.4 Scoring
- Support positive and negative integers for score values.
- Show current totals and overall totals.
- Highlight leader and ties in standings.
- Recalculate totals immediately after edits.

### 4.5 History and retrieval
- View list of past sessions sorted by most recent start time.
- Filter history by game type and player (MVP: simple filter UI).
- Open a historical session in read-only mode.

### 4.6 App state and settings
- Theme is selected from the Settings page.
- Theme preference is persisted in the settings store under key `global`.
- The app stores and restores current page so users can resume where they left off.
- App-level state is managed by a shared `State` class.

### 4.7 Main navigation model
- The app includes a main menu (hamburger) with:
  - New Game
  - Manage Players
  - History / Continue
  - Settings
- Home also includes a visible New Game button (intentional redundancy for usability).
- Continue Active Session and Recent Sessions are handled through the History page.

## 5) Data storage requirements (IndexedDB)

- Use IndexedDB as the source of truth.
- One .js file for all IndexedDB actions

### 5.0 Data architecture decision (hybrid)

- Use shared core stores for cross-game workflows: players, sessions, settings.
- Store game-specific score shapes directly in `session.gameState` (validated by the selected game class).
- Keep `session.gameState` embedded for fast current/final totals and simple persistence.
- Keep game rules in code (one class per game, one `.js` file per class).
- Do not create a dedicated per-game store by default.

A dedicated per-game store is allowed only if one or more apply:
- The game requires large binary or media-like payloads.
- The game has query patterns not efficient with sessions indexes.
- The game has significantly higher write volume than other games.
- Data retention rules differ materially from global session history.

### 5.1 Database
- Name: ignyos.scorekeeper
- Version: 1 (increment with migrations)

### 5.2 Object stores

1) players
- Key path: id (6-character GUID string)
- Indexes:
  - by_name (name, unique on active rows enforced in app logic)
  - by_lastAccessed (lastAccessed)
  - by_deletedAt (deletedAt)

2) sessions
- Key path: id (autoIncrement integer)
- Indexes:
  - by_startTime (startTime)
  - by_game (game)
  - by_status (status)

3) settings
- Key path: key (string)
- Indexes:
  - by_userId (userId)
  - by_updatedAt (updatedAt)

### 5.3 Data models

Player
- id: string (6-character GUID, indexed)
- name: string
- createdAt: datetime
- lastAccessed: datetime
- deletedAt: datetime | null

Session
- id: int
- game: string (for example yahtzee)
- gameVersion: string
- gameClass: string (for example YahtzeeGame)
- playerIds: string[] (player GUIDs)
- status: string (active | completed)
- startTime: datetime (indexed)
- endTime: datetime | null
- gameState: object (current/final score state, see GameState)
- scoreEntries: object[] (optional lightweight history entries if enabled per game)
- createdAt: datetime
- updatedAt: datetime

Setting
- key: string (user GUID or `global`)
- userId: string | null (player GUID when user-specific; null for global)
- value: object
- updatedAt: datetime

Global setting value (initial shape)
- Example: `{ theme: "dark-mode", currentPage: "/yahtzee" }`
- Additional global properties may be added later without schema break.

GameState (embedded in Session)
- totalsByPlayer: object (playerId GUID -> total or structured total)
- leaderboard: object[] (ordered player standings)
- currentValuesByPlayer: object (optional raw current values by game)
- isFinal: boolean
- rulesVersion: string
- updatedAt: datetime

Score entry examples
- Yahtzee value set: { playerId, aces, twos, threes, fours, fives, sixes, threeOfAKind, fourOfAKind, fullHouse, smallStraight, largeStraight, yahtzee, chance }

Game class contract (code, not IndexedDB)
- Each game has one class in its own `.js` file.
- Constructor signature: `constructor(state)`.
- If `state` is empty/null, the class initializes a new game state.
- If `state` is provided, the class hydrates for resume/read-only completed views.
- Required class capabilities:
  - validate score updates
  - apply score updates to state
  - compute totals and leaderboard
  - return serializable state for saving to `session.gameState`

State class contract (code, not IndexedDB)
- One shared `State` class in its own `.js` file.
- Constructor signature: `constructor(globalSettings)`.
- `globalSettings` parameter is the `value` object from setting key `global`.
- State responsibilities:
  - track current page/route
  - track current theme
  - expose serializable global settings for persistence
  - provide safe defaults when settings are missing

### 5.4 Consistency rules

- Canonical score state is `session.gameState`.
- Each score edit updates `session.gameState` and `session.updatedAt` in one IndexedDB transaction.
- If `scoreEntries` is enabled for a game, it is optional audit metadata and must not replace `gameState`.
- Completing a session sets `gameState.isFinal = true` and freezes ranking unless session is reopened.
- Session resume behavior must instantiate the selected game class with persisted `session.gameState`.
- App startup must instantiate `State` with the persisted `global` setting value.
- Theme and current page updates must persist back to `settings` key `global`.
- Player ID generation must check for collisions in `players` store and retry until unique.

## 6) UX requirements

MVP screens:
- Home/dashboard
  - Main menu (hamburger)
  - New Game button
- Players
  - Add/edit/delete/restore player
- New Game modal wizard
  - Step 1: choose game
  - Step 2: select existing players or add new player
  - Step 3: game-specific configuration
  - Start game
- History
  - Active/incomplete sessions list with resume links
  - Completed sessions list with view links
- Session scoring screen
  - Update player scores
  - Correct score values
  - View totals/leader
- Session summary screen
  - Final standings
  - Option to duplicate as new session
- Settings
  - Theme selector

UX behavior:
- Touch-friendly controls for mobile.
- Minimum tap target size of 44x44 px.
- No data loss on refresh/crash once a score update is saved.
- Theme changes apply immediately and persist across browser restarts.

### 6.1 Navigation and routing

- Use a hybrid navigation approach:
  - Thin route-specific HTML entry points (for example `/index.html`, `/yahtzee/index.html`).
  - Shared app shell and shared core modules reused by all routes.
  - Ordered plain script loading (no ES module imports required).
- Route expectations:
  - `https://scorekeeper.ignyos.com/` -> home/dashboard.
  - `https://scorekeeper.ignyos.com/<game-slug>` -> that game page (for example `/yahtzee`).
- Each route page must include the required shared script files in deterministic order.
- Avoid runtime `<head>` mutation as the primary routing mechanism.
- Routing and script paths should work in both hosted Pages mode and local file-open mode.

## 7) Non-functional requirements

- Performance: scoring interactions should feel immediate (target under 100 ms UI response on typical devices).
- Performance: with one shipped game (Yahtzee), script payload should remain lightweight and responsive on typical devices.
- Reliability: data writes are transactional per saved score update.
- Accessibility: keyboard reachable controls, semantic labels, and sufficient contrast.
- Privacy: all data remains local; no analytics required for MVP.

## 8) Error handling

- Show clear user message if IndexedDB is unavailable.
- Validate required fields before save.
- Prevent duplicate active player names.
- Guard against invalid score formats per active game class rules.

## 9) GitHub Pages deployment requirements

- Build output must be static files only.
- Repository must include workflow or documented steps for publishing to GitHub Pages.
- Routing must support direct URL entry to game routes on the custom domain.
- Deployment must include GitHub Pages custom domain configuration for `scorekeeper.ignyos.com`.

## 10) Future phases (post-MVP)

- Additional card games (spades-specific scoring template, hearts, cribbage).
- Board game presets.
- Import/export (JSON backup).
- Optional PWA offline app shell.
- Optional multi-device sync via user-provided cloud provider.

## 11) Acceptance criteria for MVP

- Can create at least 4 players and persist them across browser restarts.
- New players are assigned unique 6-character GUID string IDs.
- Generated player IDs follow the configured 6-character uppercase alphanumeric format.
- Can start a new Yahtzee session, perform at least 10 score updates, and see correct running totals.
- Can complete session and find it in history.
- Can create and score a Yahtzee session with category-level fields.
- Session `gameState` remains consistent after repeated score edits and corrections.
- Reopening an active or completed session reconstructs game behavior by calling the game class constructor with persisted state.
- Navigating directly to `/yahtzee` loads the Yahtzee page without first visiting home.
- Navigating directly to `/players` and `/history` loads their pages without first visiting home.
- Script loading uses plain non-module scripts and the app runs without ES module imports.
- Settings store supports `global` and user-specific keys and persists values across browser restarts.
- Theme can be changed from Settings and is stored in `settings` key `global`.
- Reloading the site restores the saved theme and last known page from global settings.
- Home provides a New Game button and the main menu New Game option opens the same modal wizard.
- History page contains both active and completed sessions; active sessions can be resumed from History.
- Site is reachable on GitHub Pages and works without a backend.

## 12) Implementation checklist (MVP)

1) Project scaffolding
- Create static entry pages: `/index.html`, `/yahtzee/index.html`.
- Add shared app shell scripts and base styles.
- Configure GitHub Pages custom domain (`scorekeeper.ignyos.com`).

2) Core data layer
- Implement one IndexedDB module (`db.js`) for all database actions.
- Create stores: `players`, `sessions`, `settings` with defined indexes.
- Add migration-safe DB version initialization.

3) State and settings
- Implement shared `State` class with `constructor(globalSettings)`.
- Load `settings` key `global` at startup and apply theme/current page defaults.
- Persist theme and current page updates back to `settings` key `global`.

4) Game framework
- Implement game registry mapping route slugs to game classes.
- Implement ordered plain script loading and global registry resolution.
- Implement required game class contract methods for MVP games.

5) Player and session flows
- Implement player CRUD with soft-delete behavior and unique-name validation.
- Implement 6-character player ID generation with collision retry.
- Implement session create/resume/complete flows and `gameState` persistence.

6) UI routes and screens
- Home: hamburger menu and New Game button.
- Players: add/edit/delete/restore player management.
- History: resume active sessions and view completed sessions.
- Settings: theme selector and global app preferences.
- Game route pages: score editing UI, totals, leaderboard, completion flow.

7) Validation and acceptance checks
- Verify direct URL navigation for game routes (for example `/yahtzee`).
- Verify app runs without ES module imports in browser console.
- Verify settings/theme persistence and page resume across browser restarts.

### Suggested file structure

- `/index.html`
- `/yahtzee/index.html`
- `/js/app.js`
- `/js/state.js`
- `/js/db.js`
- `/js/router.js`
- `/js/games/YahtzeeGame.js`
- `/js/games/registry.js`