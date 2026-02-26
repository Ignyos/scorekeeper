(() => {
  const {
    openDatabase,
    createPlayer,
    listPlayers,
    softDeletePlayer,
    renamePlayer,
    restorePlayer,
    createSession,
    getSession,
    listSessions,
    updateSessionGameState,
    completeSession,
    deleteSession,
    getGlobalSettings,
    saveGlobalSettings,
  } = window.ScorekeeperDb;

  const { State, applyTheme } = window.ScorekeeperState;
  const { getRouteFromPath, withSessionId } = window.ScorekeeperRouter;
  const { gameRegistry, loadGameClassBySlug } = window.ScorekeeperRegistry;

  const app = document.getElementById("app");

  function isFileMode() {
    return window.location.protocol === "file:";
  }

  function routePath(routeName) {
    const path = window.location.pathname.toLowerCase();
    const inSubFolder =
      path.includes("/yahtzee/") ||
      path.includes("/scrabble/") ||
      path.includes("/settings/") ||
      path.includes("/players/") ||
      path.includes("/history/");

    if (!isFileMode()) {
      if (routeName === "home") return "/";
      if (routeName === "yahtzee") return "/yahtzee";
      if (routeName === "scrabble") return "/scrabble";
      if (routeName === "settings") return "/settings";
      if (routeName === "players") return "/players";
      if (routeName === "history") return "/history";
      return "/";
    }

    if (routeName === "home") {
      return inSubFolder ? "../index.html" : "./index.html";
    }
    if (routeName === "yahtzee") {
      if (path.includes("/yahtzee/")) return "./index.html";
      return inSubFolder ? "../yahtzee/index.html" : "./yahtzee/index.html";
    }
    if (routeName === "scrabble") {
      if (path.includes("/scrabble/")) return "./index.html";
      return inSubFolder ? "../scrabble/index.html" : "./scrabble/index.html";
    }
    if (routeName === "settings") {
      if (path.includes("/settings/")) return "./index.html";
      return inSubFolder ? "../settings/index.html" : "./settings/index.html";
    }
    if (routeName === "players") {
      if (path.includes("/players/")) return "./index.html";
      return inSubFolder ? "../players/index.html" : "./players/index.html";
    }
    if (routeName === "history") {
      if (path.includes("/history/")) return "./index.html";
      return inSubFolder ? "../history/index.html" : "./history/index.html";
    }

    return inSubFolder ? "../index.html" : "./index.html";
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function parseSessionId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("session");
  }

  function formatCompletedGameWindow(startIso, endIso) {
    if (!startIso || !endIso) {
      return "";
    }

    const start = new Date(startIso);
    const end = new Date(endIso);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return "";
    }

    const sameDay =
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate();

    if (sameDay) {
      const startText = start.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
      const endTime = end.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      });
      return `Started ${startText}, ended ${endTime}`;
    }

    const startDate = start.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const endDate = end.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    return `Started ${startDate}, ended ${endDate}`;
  }

  function formatSessionWindowCompact(startIso, endIso) {
    if (!startIso) {
      return "Unknown";
    }

    const start = new Date(startIso);
    if (Number.isNaN(start.getTime())) {
      return "Unknown";
    }

    if (!endIso) {
      return start.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }

    const end = new Date(endIso);
    if (Number.isNaN(end.getTime())) {
      return start.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }

    const sameDay =
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate();

    if (sameDay) {
      const startText = start.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
      const endTime = end.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      });
      return `${startText} - ${endTime}`;
    }

    const startDate = start.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const endDate = end.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    return `${startDate} - ${endDate}`;
  }

  function parseGameFilter() {
    const params = new URLSearchParams(window.location.search);
    return (params.get("game") || "").toLowerCase() || null;
  }

  function shouldAutoOpenNewGame() {
    const params = new URLSearchParams(window.location.search);
    return params.get("new") === "1";
  }

  function clearNewGameQueryParam() {
    const url = new URL(window.location.href);
    if (url.searchParams.has("new")) {
      url.searchParams.delete("new");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }

  function menuHtml() {
    return `
      <details class="menu" id="main-menu">
        <summary class="menu-button" aria-label="Open menu">☰</summary>
        <div class="menu-panel" role="menu">
          <a href="${routePath("home")}" role="menuitem">Home</a>
          <a href="${routePath("players")}" role="menuitem">Manage Players</a>
          <a href="${routePath("history")}" role="menuitem">History / Continue</a>
          <a href="${routePath("settings")}" role="menuitem">Settings</a>
        </div>
      </details>
    `;
  }

  function startGameModalHtml(gameTitle, players) {
    const playerOptions = players
      .map((player) => `<option value="${player.id}">${escapeHtml(player.name)}</option>`)
      .join("");

    return `
      <div class="modal-backdrop" id="start-game-modal" hidden>
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="start-game-title">
          <h2 id="start-game-title">${escapeHtml(gameTitle)}: Select Players</h2>
          <p class="muted start-game-note">Choose at least 2 players.</p>

          <div class="row start-game-section">
            <select id="start-game-player-select" aria-label="Select player">
              <option value="">Select player</option>
              ${playerOptions}
            </select>
          </div>

          <div class="row start-game-section">
            <ul id="start-game-selected-list" class="selected-player-list"></ul>
          </div>

          <div class="row start-game-section">
            <input id="start-game-new-player" placeholder="Add Player" aria-label="Add player" />
            <button type="button" id="start-game-add-player">Add</button>
          </div>

          <div class="row start-game-actions">
            <button type="button" id="start-game-submit">Start Game</button>
            <button type="button" id="start-game-cancel">Cancel</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderShell(title, innerHtml) {
    app.innerHTML = `
      <header class="topbar">
        <div class="topbar-inner">
          ${menuHtml()}
        </div>
      </header>
      <div class="container">
        <h1>${title}</h1>
        ${innerHtml}
      </div>
    `;

    const menuRoot = document.getElementById("main-menu");
    if (menuRoot) {
      document.addEventListener(
        "click",
        (event) => {
          if (!menuRoot.open) {
            return;
          }
          const clickTarget = event.target;
          if (!(clickTarget instanceof Node)) {
            return;
          }
          if (!menuRoot.contains(clickTarget)) {
            menuRoot.open = false;
          }
        },
        { capture: true },
      );
    }
  }

  async function persistState(db, state) {
    await saveGlobalSettings(db, state.toGlobalSettings());
  }

  function themeSelectHtml(selectedTheme) {
    return `
      <label for="theme-select">Theme</label>
      <select id="theme-select" name="theme">
        <option value="light" ${selectedTheme === "light" ? "selected" : ""}>Light</option>
        <option value="dark-mode" ${selectedTheme === "dark-mode" ? "selected" : ""}>Dark</option>
      </select>
    `;
  }

  async function renderHome(db, state) {
    const homeGameCards = Object.values(gameRegistry)
      .map((gameDef) => {
        const title = gameDef.title || gameDef.slug;
        const description = gameDef.description || "Start a new game";
        return `
          <article class="home-game-card">
            <h2>${escapeHtml(title)}</h2>
            <p class="muted">${escapeHtml(description)}</p>
            <div class="row home-game-actions">
              <a href="${routePath(gameDef.slug)}?new=1">New</a>
              <a href="${routePath("history")}?game=${encodeURIComponent(gameDef.slug)}">Continue</a>
            </div>
          </article>
        `;
      })
      .join("");

    renderShell(
      "Scorekeeper",
      `
        <section class="home-hero">
          <p class="home-mission">Simple local score tracking for game night.</p>
          <p class="muted">Your data stays in this browser.</p>
          <section class="home-game-grid">
            ${homeGameCards}
          </section>
        </section>
      `,
    );
  }

  async function renderPlayers(db) {
    const players = await listPlayers(db, { includeDeleted: true });
    const activePlayers = players.filter((player) => !player.deletedAt);
    const deletedPlayers = players.filter((player) => Boolean(player.deletedAt));

    renderShell(
      "Manage Players",
      `
        <section class="card">
          <form id="add-player-form" class="row">
            <input id="add-player-name" placeholder="Add Player" required />
            <button type="submit">Add</button>
          </form>
        </section>

        <section class="card">
          <h2>Players</h2>
          ${
            activePlayers.length || deletedPlayers.length
              ? `<ul class="player-items">${activePlayers
                  .map((player) => {
                    return `
                      <li class="player-item">
                        <span><strong>${escapeHtml(player.name)}</strong></span>
                        <span class="row player-actions">
                          <button type="button" data-rename-player="${player.id}" data-player-name="${escapeHtml(player.name)}">Rename</button>
                          <button type="button" data-delete-player="${player.id}">Delete</button>
                        </span>
                      </li>
                    `;
                  })
                  .join("")}
                ${deletedPlayers
                  .map((player) => {
                    return `
                      <li class="player-item deleted-player" hidden>
                        <span><strong>${escapeHtml(player.name)}</strong> <span class='muted'>[deleted]</span></span>
                        <span class="row player-actions">
                          <button type="button" data-restore-player="${player.id}">Restore</button>
                        </span>
                      </li>
                    `;
                  })
                  .join("")}</ul>
                ${
                  deletedPlayers.length
                    ? `<div class="row show-deleted-row"><button type="button" id="toggle-deleted">Show Deleted</button></div>`
                    : ""
                }`
              : "<p class='muted'>No players yet.</p>"
          }
        </section>
      `,
    );

    document.getElementById("add-player-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await createPlayer(db, document.getElementById("add-player-name").value);
        window.location.reload();
      } catch (error) {
        alert(error.message);
      }
    });

    document.querySelectorAll("[data-delete-player]").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          await softDeletePlayer(db, button.getAttribute("data-delete-player"));
          window.location.reload();
        } catch (error) {
          alert(error.message);
        }
      });
    });

    document.querySelectorAll("[data-restore-player]").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          await restorePlayer(db, button.getAttribute("data-restore-player"));
          window.location.reload();
        } catch (error) {
          alert(error.message);
        }
      });
    });

    document.querySelectorAll("[data-rename-player]").forEach((button) => {
      button.addEventListener("click", async () => {
        const playerId = button.getAttribute("data-rename-player");
        const currentName = button.getAttribute("data-player-name") || "";
        const nextName = window.prompt("Rename player:", currentName);
        if (nextName === null) {
          return;
        }
        try {
          await renamePlayer(db, playerId, nextName);
          window.location.reload();
        } catch (error) {
          alert(error.message);
        }
      });
    });

    const toggleDeletedButton = document.getElementById("toggle-deleted");
    toggleDeletedButton?.addEventListener("click", () => {
      const deletedRows = Array.from(document.querySelectorAll(".deleted-player"));
      const willShow = deletedRows.some((row) => row.hidden);
      deletedRows.forEach((row) => {
        row.hidden = !willShow;
      });
      toggleDeletedButton.textContent = willShow ? "Hide Deleted" : "Show Deleted";
    });
  }

  async function renderHistory(db) {
    const sessions = await listSessions(db);
    const players = await listPlayers(db, { includeDeleted: true });
    const playerMap = buildPlayerMap(players);
    const gameFilter = parseGameFilter();
    const visibleSessions = gameFilter ? sessions.filter((session) => (session.game || "").toLowerCase() === gameFilter) : sessions;
    const filterTitle = gameFilter ? `Filtered by: ${escapeHtml(gameFilter)}` : "All games";
    const gameOptions = [
      `<option value="">All games</option>`,
      ...Object.values(gameRegistry).map((gameDef) => {
        const slug = gameDef.slug;
        const label = gameDef.title || slug;
        return `<option value="${slug}" ${gameFilter === slug ? "selected" : ""}>${escapeHtml(label)}</option>`;
      }),
    ].join("");

    const sessionCards = visibleSessions
      .map((session) => {
        const gameKey = String(session.game || "").toLowerCase();
        const gameTitle = gameRegistry[gameKey]?.title || session.game || "Unknown";
        const gameName = escapeHtml(gameTitle);
        const sessionWindow = formatSessionWindowCompact(session.startTime, session.endTime);
        const playerNames = (session.playerIds || [])
          .map((playerId) => playerMap[playerId]?.name || playerId)
          .map((name) => escapeHtml(name))
          .join(", ");

        const outcomeRows = buildOutcomeRows(session);
        const outcome = outcomeRows.length
          ? `<ol class="session-outcome">${outcomeRows
              .map((row) => {
                const playerName = playerMap[row.playerId]?.name || row.playerId;
                return `<li>${escapeHtml(playerName)} (${row.total})</li>`;
              })
              .join("")}</ol>`
          : `<p class="muted">Outcome unavailable.</p>`;

        const isActive = session.status === "active";
        const continueAction = isActive
          ? `<a class="session-action" href="${withSessionId(routePath(gameKey), session.id)}">Continue</a>`
          : "";
        const detailBody = isActive ? "" : outcome;

        return `
          <article class="session-item card">
            <div class="session-heading">
              <h3>${gameName}</h3>
              <p class="muted session-window">${escapeHtml(sessionWindow)}</p>
            </div>
            <p class="muted">${playerNames || "None"}</p>
            <div class="session-detail">
              ${detailBody}
              <div class="row session-actions">
                ${continueAction}
                <button type="button" data-delete-session="${session.id}">Delete Game</button>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    renderShell(
      "History / Continue",
      `
        <section class="card">
          <form id="history-filter-form" class="row history-filter-row">
            <label for="history-game-filter">Game</label>
            <select id="history-game-filter" name="game">${gameOptions}</select>
            <button type="submit">Apply</button>
            <button type="button" id="history-clear-filter">Clear</button>
          </form>
          <p class="muted">${filterTitle}</p>
          ${sessionCards || "<p class='muted'>No sessions found.</p>"}
        </section>
      `,
    );

    document.getElementById("history-filter-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const selectedGame = document.getElementById("history-game-filter").value;
      const base = routePath("history");
      window.location.href = selectedGame ? `${base}?game=${encodeURIComponent(selectedGame)}` : base;
    });

    document.getElementById("history-clear-filter")?.addEventListener("click", () => {
      window.location.href = routePath("history");
    });

    document.querySelectorAll("[data-delete-session]").forEach((button) => {
      button.addEventListener("click", async () => {
        const sessionId = button.getAttribute("data-delete-session");
        const confirmed = window.confirm(
          "Warning: This will permanently delete this game and all of its scores. This cannot be undone.",
        );
        if (!confirmed) {
          return;
        }

        try {
          await deleteSession(db, sessionId);
          await renderHistory(db);
        } catch (error) {
          alert(error.message);
        }
      });
    });
  }

  async function renderSettings(db, state) {
    renderShell(
      "Settings",
      `
        <section class="card">
          <div class="row">${themeSelectHtml(state.theme)}</div>
        </section>
      `,
    );

    const themeSelect = document.getElementById("theme-select");
    themeSelect?.addEventListener("change", async (event) => {
      state.setTheme(event.target.value);
      applyTheme(state.theme);
      await persistState(db, state);
    });
  }

  function buildPlayerMap(players) {
    const map = {};
    for (const player of players) {
      map[player.id] = player;
    }
    return map;
  }

  function buildOutcomeRows(session) {
    const gameState = session?.gameState || {};
    const leaderboard = Array.isArray(gameState.leaderboard) ? gameState.leaderboard : [];
    if (leaderboard.length) {
      return leaderboard;
    }

    const gameKey = String(session?.game || "").toLowerCase();
    const playerIds = Array.isArray(session?.playerIds) ? session.playerIds : [];

    if (gameKey === "scrabble") {
      const totalsByPlayer = {};
      for (const playerId of playerIds) {
        totalsByPlayer[playerId] = 0;
      }

      const rounds = Array.isArray(gameState.rounds) ? gameState.rounds : [];
      rounds.forEach((round) => {
        const scoresByPlayer = round?.scoresByPlayer || {};
        playerIds.forEach((playerId) => {
          const value = scoresByPlayer[playerId];
          if (Number.isInteger(value)) {
            totalsByPlayer[playerId] += value;
          }
        });
      });

      const activeRound = gameState.activeRoundScoresByPlayer || {};
      playerIds.forEach((playerId) => {
        const value = activeRound[playerId];
        if (Number.isInteger(value)) {
          totalsByPlayer[playerId] += value;
        }
      });

      return playerIds
        .map((playerId) => ({
          playerId,
          total: totalsByPlayer[playerId] || 0,
        }))
        .sort((left, right) => right.total - left.total);
    }

    const totalsByPlayer = gameState.totalsByPlayer || {};
    if (totalsByPlayer && typeof totalsByPlayer === "object") {
      const rows = Object.keys(totalsByPlayer)
        .map((playerId) => ({
          playerId,
          total: Number.isInteger(totalsByPlayer[playerId]) ? totalsByPlayer[playerId] : 0,
        }))
        .sort((left, right) => right.total - left.total);
      if (rows.length) {
        return rows;
      }
    }

    return [];
  }

  async function renderYahtzee(db) {
    const renderYahtzeePage = window.ScorekeeperGamesUI?.renderYahtzeePage;
    if (typeof renderYahtzeePage !== "function") {
      throw new Error("Yahtzee page renderer is unavailable");
    }

    await renderYahtzeePage(db, {
      parseSessionId,
      listPlayers,
      renderShell,
      startGameModalHtml,
      shouldAutoOpenNewGame,
      clearNewGameQueryParam,
      createPlayer,
      loadGameClassBySlug,
      createSession,
      withSessionId,
      routePath,
      getSession,
      formatCompletedGameWindow,
      escapeHtml,
      updateSessionGameState,
      completeSession,
    });
  }

  async function renderScrabble(db) {
    const renderScrabblePage = window.ScorekeeperGamesUI?.renderScrabblePage;
    if (typeof renderScrabblePage !== "function") {
      throw new Error("Scrabble page renderer is unavailable");
    }

    await renderScrabblePage(db, {
      parseSessionId,
      listPlayers,
      renderShell,
      startGameModalHtml,
      shouldAutoOpenNewGame,
      clearNewGameQueryParam,
      createPlayer,
      loadGameClassBySlug,
      createSession,
      withSessionId,
      routePath,
      getSession,
      formatCompletedGameWindow,
      escapeHtml,
      updateSessionGameState,
      completeSession,
    });
  }

  function renderNotFound() {
    renderShell(
      "Not Found",
      `
        <section class="card">
          <p>Unknown route.</p>
          <a href="${routePath("home")}">Go to Home</a>
        </section>
      `,
    );
  }

  async function bootstrap() {
    try {
      const db = await openDatabase();
      const globalSettings = await getGlobalSettings(db);
      const state = new State(globalSettings);
      applyTheme(state.theme);

      const route = getRouteFromPath(window.location.pathname);
      state.setCurrentPage(window.location.pathname);
      await persistState(db, state);

      if (route.key === "home") {
        await renderHome(db, state);
        return;
      }
      if (route.key === "settings") {
        await renderSettings(db, state);
        return;
      }
      if (route.key === "players") {
        await renderPlayers(db);
        return;
      }
      if (route.key === "history") {
        await renderHistory(db);
        return;
      }
      if (route.key === "game") {
        if (!gameRegistry[route.slug]) {
          renderNotFound();
          return;
        }
        if (route.slug === "yahtzee") {
          await renderYahtzee(db);
          return;
        }
        if (route.slug === "scrabble") {
          await renderScrabble(db);
          return;
        }
      }
      renderNotFound();
    } catch (error) {
      app.innerHTML = `
        <div class="container">
          <h1>Scorekeeper</h1>
          <div class="card">
            <p>Unable to start app: ${escapeHtml(error.message)}</p>
            <p class="muted">Check browser support for IndexedDB.</p>
          </div>
        </div>
      `;
    }
  }

  bootstrap();
})();
