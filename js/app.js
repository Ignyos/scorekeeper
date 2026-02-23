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
      path.includes("/yahtzee/") || path.includes("/settings/") || path.includes("/players/") || path.includes("/history/");

    if (!isFileMode()) {
      if (routeName === "home") return "/";
      if (routeName === "yahtzee") return "/yahtzee";
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

        const leaderboard = session.gameState?.leaderboard || [];
        const outcome = leaderboard.length
          ? `<ol class="session-outcome">${leaderboard
              .map((row) => {
                const playerName = playerMap[row.playerId]?.name || row.playerId;
                return `<li>${escapeHtml(playerName)} (${row.total})</li>`;
              })
              .join("")}</ol>`
          : `<p class="muted">Outcome unavailable.</p>`;

        const isActive = session.status === "active";
        const continueAction = isActive
          ? `<a class="session-action" href="${withSessionId(routePath("yahtzee"), session.id)}">Continue</a>`
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

  function formatYahtzeeCategoryLabel(category) {
    const labels = {
      aces: "Aces",
      twos: "Twos",
      threes: "Threes",
      fours: "Fours",
      fives: "Fives",
      sixes: "Sixes",
      threeOfAKind: "3 of a Kind",
      fourOfAKind: "4 of a Kind",
      fullHouse: "Full House",
      smallStraight: "Small Straight",
      largeStraight: "Large Straight",
      yahtzee: "Yahtzee",
      chance: "Chance",
    };
    return labels[category] || category;
  }

  function getYahtzeeFixedCategoryValue(category) {
    const fixedValues = {
      fullHouse: 25,
      smallStraight: 30,
      largeStraight: 40,
    };
    return fixedValues[category] ?? null;
  }

  function getUpperCategoryDieValue(category) {
    const dieValueByCategory = {
      aces: 1,
      twos: 2,
      threes: 3,
      fours: 4,
      fives: 5,
      sixes: 6,
    };
    return dieValueByCategory[category] ?? null;
  }

  async function renderYahtzee(db) {
    const sessionId = parseSessionId();
    if (!sessionId) {
      const players = await listPlayers(db, { includeDeleted: false });
      renderShell(
        "Yahtzee",
        `
          <section class="card">
            <p>Start a new Yahtzee session.</p>
            <button type="button" id="open-start-game">New Game</button>
          </section>
          ${startGameModalHtml("Yahtzee", players)}
        `,
      );

      const modal = document.getElementById("start-game-modal");
      const openButton = document.getElementById("open-start-game");
      const cancelButton = document.getElementById("start-game-cancel");
      const submitButton = document.getElementById("start-game-submit");
      const addPlayerButton = document.getElementById("start-game-add-player");
      const addPlayerInput = document.getElementById("start-game-new-player");
      const playerSelect = document.getElementById("start-game-player-select");
      const selectedList = document.getElementById("start-game-selected-list");

      const playerById = {};
      for (const player of players) {
        playerById[player.id] = player;
      }

      let selectedPlayerIds = [];

      function openModal() {
        modal.hidden = false;
      }

      function closeModal() {
        modal.hidden = true;
      }

      function renderSelectedPlayers() {
        selectedList.innerHTML = selectedPlayerIds
          .map((playerId) => {
            const playerName = playerById[playerId]?.name || playerId;
            return `
              <li class="selected-player-item">
                <span>${escapeHtml(playerName)}</span>
                <button type="button" data-remove-selected-player="${playerId}" aria-label="Remove ${escapeHtml(playerName)}">×</button>
              </li>
            `;
          })
          .join("");

        selectedList.querySelectorAll("[data-remove-selected-player]").forEach((button) => {
          button.addEventListener("click", () => {
            const playerId = button.getAttribute("data-remove-selected-player");
            selectedPlayerIds = selectedPlayerIds.filter((id) => id !== playerId);
            renderSelectedPlayers();
          });
        });
      }

      openButton?.addEventListener("click", openModal);
      cancelButton?.addEventListener("click", closeModal);

      playerSelect?.addEventListener("change", () => {
        const playerId = playerSelect.value;
        if (!playerId) {
          return;
        }
        if (!selectedPlayerIds.includes(playerId)) {
          selectedPlayerIds.push(playerId);
          renderSelectedPlayers();
        }
        playerSelect.value = "";
      });

      if (shouldAutoOpenNewGame()) {
        openModal();
        clearNewGameQueryParam();
      }

      addPlayerButton?.addEventListener("click", async () => {
        const newName = addPlayerInput.value;
        if (!newName.trim()) {
          return;
        }
        try {
          const player = await createPlayer(db, newName);
          playerById[player.id] = player;

          const option = document.createElement("option");
          option.value = player.id;
          option.textContent = player.name;
          playerSelect.appendChild(option);

          if (!selectedPlayerIds.includes(player.id)) {
            selectedPlayerIds.push(player.id);
            renderSelectedPlayers();
          }

          addPlayerInput.value = "";
        } catch (error) {
          alert(error.message);
        }
      });

      submitButton?.addEventListener("click", async () => {
        try {
          const selected = [...selectedPlayerIds];
          if (selected.length < 2) {
            alert("Select at least 2 players");
            return;
          }

          const GameClass = await loadGameClassBySlug("yahtzee");
          const game = new GameClass(null);
          game.ensurePlayers(selected);

          const session = await createSession(db, {
            playerIds: selected,
            gameState: game.getState(),
          });

          window.location.href = withSessionId(routePath("yahtzee"), session.id);
        } catch (error) {
          alert(error.message);
        }
      });
      return;
    }

    const session = await getSession(db, sessionId);
    if (!session) {
      renderShell(
        "Yahtzee",
        `
          <section class="card">
            <p>Session not found.</p>
            <a href="${routePath("home")}">Go to Home</a>
          </section>
        `,
      );
      return;
    }

    const players = await listPlayers(db, { includeDeleted: true });
    const playerMap = buildPlayerMap(players);

    const GameClass = await loadGameClassBySlug("yahtzee");
    const game = new GameClass(session.gameState);
    game.ensurePlayers(session.playerIds);

    const completedGameWindowText =
      session.status === "completed" ? formatCompletedGameWindow(session.startTime, session.endTime) : "";

    const upperCategories = GameClass.upperCategories();
    const lowerCategories = GameClass.lowerCategories();

    const playerHeaderCells = session.playerIds
      .map((playerId) => {
        const playerName = playerMap[playerId]?.name || playerId;
        return `<th scope="col">${escapeHtml(playerName)}</th>`;
      })
      .join("");

    const buildScoreRow = (category) => {
      const fixedValue = getYahtzeeFixedCategoryValue(category);
      const label =
        fixedValue === null
          ? formatYahtzeeCategoryLabel(category)
          : `${formatYahtzeeCategoryLabel(category)} (${fixedValue})`;

      const scoreCells = session.playerIds
        .map((playerId) => {
          const score = game.state.currentValuesByPlayer[playerId]?.[category];

          if (category === "yahtzee") {
            const yahtzeeDisplay = String(game.getYahtzeeDisplayValue(playerId));
            return `
              <td>
                <span class="yahtzee-readonly-value" data-yahtzee-display-player-id="${playerId}">${yahtzeeDisplay}</span>
                <button
                  type="button"
                  class="yahtzee-roll-trigger"
                  data-yahtzee-player-id="${playerId}"
                  ${session.status !== "active" ? "disabled" : ""}
                >Yahtzee!</button>
              </td>
            `;
          }

          if (fixedValue !== null) {
            const isScored = score === fixedValue;
            const isCrossedOut = score === 0;
            const state = isScored ? "scored" : isCrossedOut ? "crossed" : "empty";

            return `
              <td>
                <input
                  class="yahtzee-fixed-toggle"
                  type="checkbox"
                  data-player-id="${playerId}"
                  data-category="${category}"
                  data-fixed-value="${fixedValue}"
                  data-state="${state}"
                  ${isScored ? "checked" : ""}
                  aria-label="${escapeHtml(label)} for ${escapeHtml(playerMap[playerId]?.name || playerId)}"
                  ${session.status !== "active" ? "disabled" : ""}
                />
              </td>
            `;
          }

          const value = Number.isInteger(score) ? String(score) : "";
          const upperDieValue = getUpperCategoryDieValue(category);
          const constraints =
            upperDieValue === null
              ? 'step="1"'
              : `min="0" max="${upperDieValue * 5}" step="${upperDieValue}"`;
          return `
            <td>
              <input
                class="yahtzee-score-input"
                type="number"
                ${constraints}
                value="${value}"
                data-player-id="${playerId}"
                data-category="${category}"
                aria-label="${escapeHtml(label)} score for ${escapeHtml(playerMap[playerId]?.name || playerId)}"
                ${session.status !== "active" ? "disabled" : ""}
              />
            </td>
          `;
        })
        .join("");

      return `
        <tr>
          <th scope="row">${escapeHtml(label)}</th>
          ${scoreCells}
        </tr>
      `;
    };

    const buildSummaryRow = (label, key) => {
      const summaryCells = session.playerIds
        .map(
          (playerId) =>
            `<td data-summary="${key}" data-player-id="${playerId}">0</td>`,
        )
        .join("");
      return `
        <tr class="yahtzee-summary-row">
          <th scope="row">${escapeHtml(label)}</th>
          ${summaryCells}
        </tr>
      `;
    };

    const sectionColumnSpan = session.playerIds.length + 1;
    const showEndGameSection = session.status === "active";

    renderShell(
      "Yahtzee",
      `
        <section class="card">
          ${completedGameWindowText ? `<p class="muted">${escapeHtml(completedGameWindowText)}</p>` : ""}
          <p class="muted">Fixed-score boxes (Full House / Straights): click once to score, click again to scratch for 0, click a third time to clear.</p>
          <div class="yahtzee-sheet-wrap">
            <table class="yahtzee-sheet">
              <thead>
                <tr>
                  <th scope="col">Category</th>
                  ${playerHeaderCells}
                </tr>
              </thead>
              <tbody>
                <tr class="yahtzee-section-row">
                  <th colspan="${sectionColumnSpan}" scope="colgroup">Upper Section</th>
                </tr>
                ${upperCategories.map(buildScoreRow).join("")}
                ${buildSummaryRow("Upper Subtotal", "upperSubtotal")}
                ${buildSummaryRow("Bonus (35 at 63+)", "upperBonus")}
                ${buildSummaryRow("Upper Total", "upperTotal")}

                <tr class="yahtzee-section-row">
                  <th colspan="${sectionColumnSpan}" scope="colgroup">Lower Section</th>
                </tr>
                ${lowerCategories.map(buildScoreRow).join("")}
                ${buildSummaryRow("Lower Total", "lowerTotal")}
                ${buildSummaryRow("Yahtzee Bonus", "yahtzeeBonus")}
                ${buildSummaryRow("Grand Total", "grandTotal")}
              </tbody>
            </table>
          </div>
        </section>

        ${
          showEndGameSection
            ? `
              <section class="card">
                <button id="complete-session">End Game</button>
              </section>
            `
            : ""
        }

        <div class="modal-backdrop" id="end-game-confirm-modal" hidden>
          <div class="modal" role="dialog" aria-modal="true" aria-labelledby="end-game-confirm-title">
            <h2 id="end-game-confirm-title">End Game</h2>
            <p id="end-game-confirm-text" class="muted"></p>
            <div class="row start-game-actions">
              <button type="button" id="end-game-confirm-submit">End Game</button>
              <button type="button" id="end-game-confirm-cancel">Cancel</button>
            </div>
          </div>
        </div>

        <div class="modal-backdrop" id="yahtzee-roll-modal" hidden>
          <div class="modal" role="dialog" aria-modal="true" aria-labelledby="yahtzee-roll-title">
            <h2 id="yahtzee-roll-title">Record Yahtzee Roll</h2>
            <p id="yahtzee-roll-player-name" class="muted"></p>
            <div class="row">
              <label for="yahtzee-roll-face">Rolled Number</label>
              <select id="yahtzee-roll-face">
                <option value="1">1s</option>
                <option value="2">2s</option>
                <option value="3">3s</option>
                <option value="4">4s</option>
                <option value="5">5s</option>
                <option value="6">6s</option>
              </select>
            </div>

            <p id="yahtzee-roll-rule" class="muted"></p>
            <p id="yahtzee-roll-preview" class="muted"></p>

            <div class="row" id="yahtzee-roll-target-row" hidden>
              <label for="yahtzee-roll-target">Joker Category</label>
              <select id="yahtzee-roll-target"></select>
            </div>

            <label id="yahtzee-roll-scratch-wrap" class="row" hidden>
              <input type="checkbox" id="yahtzee-roll-scratch" />
              <span>Scratch selected category for 0</span>
            </label>

            <div class="row start-game-actions">
              <button type="button" id="yahtzee-roll-submit">Apply</button>
              <button type="button" id="yahtzee-roll-cancel">Cancel</button>
            </div>
          </div>
        </div>

        <div class="modal-backdrop" id="end-game-modal" hidden>
          <div class="modal" role="dialog" aria-modal="true" aria-labelledby="end-game-title">
            <h2 id="end-game-title">Final Scores</h2>
            <ul id="end-game-results" class="end-game-results"></ul>
            <div class="row start-game-actions">
              <button type="button" id="end-game-close">Close</button>
            </div>
          </div>
        </div>
      `,
    );

    function refreshSummaryRows() {
      for (const playerId of session.playerIds) {
        const breakdown = game.getPlayerBreakdown(playerId);
        const summaryPairs = [
          ["upperSubtotal", breakdown.upperSubtotal],
          ["upperBonus", breakdown.upperBonus],
          ["upperTotal", breakdown.upperTotal],
          ["lowerTotal", breakdown.lowerTotal],
          ["yahtzeeBonus", breakdown.yahtzeeBonus],
          ["grandTotal", breakdown.grandTotal],
        ];

        for (const [key, value] of summaryPairs) {
          const cell = document.querySelector(`[data-summary="${key}"][data-player-id="${playerId}"]`);
          if (cell) {
            cell.textContent = String(value);
          }
        }
      }
    }

    refreshSummaryRows();

    const scoreInputs = document.querySelectorAll(".yahtzee-score-input");
    scoreInputs.forEach((input) => {
      input.addEventListener("change", async () => {
        try {
          const rawValue = input.value.trim();
          const value = rawValue === "" ? null : Number.parseInt(rawValue, 10);
          if (rawValue !== "" && !Number.isInteger(value)) {
            throw new Error("Score value must be an integer");
          }

          const category = input.getAttribute("data-category");
          const upperDieValue = getUpperCategoryDieValue(category);
          if (value !== null && upperDieValue !== null) {
            const maxValue = upperDieValue * 5;
            if (value < 0 || value > maxValue || value % upperDieValue !== 0) {
              throw new Error(
                `${formatYahtzeeCategoryLabel(category)} must be 0 to ${maxValue} in increments of ${upperDieValue}`,
              );
            }
          }

          const update = {
            playerId: input.getAttribute("data-player-id"),
            category,
            value,
          };

          game.applyScoreUpdate(update);
          await updateSessionGameState(db, session.id, game.getState(), {
            ...update,
            updatedAt: new Date().toISOString(),
          });
          refreshSummaryRows();
        } catch (error) {
          alert(error.message);
          const playerId = input.getAttribute("data-player-id");
          const category = input.getAttribute("data-category");
          const currentValue = game.state.currentValuesByPlayer[playerId]?.[category];
          input.value = Number.isInteger(currentValue) ? String(currentValue) : "";
        }
      });
    });

    function applyFixedToggleVisualState(input, state) {
      input.dataset.state = state;
      input.checked = state === "scored";
      input.indeterminate = state === "crossed";
    }

    function nextFixedToggleState(currentState) {
      if (currentState === "empty") {
        return "scored";
      }
      if (currentState === "scored") {
        return "crossed";
      }
      return "empty";
    }

    const fixedToggles = document.querySelectorAll(".yahtzee-fixed-toggle");
    fixedToggles.forEach((input) => {
      applyFixedToggleVisualState(input, input.dataset.state || "empty");

      input.addEventListener("click", async (event) => {
        event.preventDefault();
        try {
          const currentState = input.dataset.state || "empty";
          const nextState = nextFixedToggleState(currentState);
          const fixedValue = Number.parseInt(input.getAttribute("data-fixed-value"), 10);
          const value = nextState === "scored" ? fixedValue : nextState === "crossed" ? 0 : null;

          const update = {
            playerId: input.getAttribute("data-player-id"),
            category: input.getAttribute("data-category"),
            value,
          };

          game.applyScoreUpdate(update);
          await updateSessionGameState(db, session.id, game.getState(), {
            ...update,
            updatedAt: new Date().toISOString(),
          });

          applyFixedToggleVisualState(input, nextState);
          refreshSummaryRows();
        } catch (error) {
          alert(error.message);
          const playerId = input.getAttribute("data-player-id");
          const category = input.getAttribute("data-category");
          const fixedValue = Number.parseInt(input.getAttribute("data-fixed-value"), 10);
          const currentValue = game.state.currentValuesByPlayer[playerId]?.[category];
          const fallbackState = currentValue === fixedValue ? "scored" : currentValue === 0 ? "crossed" : "empty";
          applyFixedToggleVisualState(input, fallbackState);
        }
      });
    });

    const yahtzeeModal = document.getElementById("yahtzee-roll-modal");
    const yahtzeeRollCancel = document.getElementById("yahtzee-roll-cancel");
    const yahtzeeRollSubmit = document.getElementById("yahtzee-roll-submit");
    const yahtzeeRollPlayerName = document.getElementById("yahtzee-roll-player-name");
    const yahtzeeRollFace = document.getElementById("yahtzee-roll-face");
    const yahtzeeRollRule = document.getElementById("yahtzee-roll-rule");
    const yahtzeeRollPreview = document.getElementById("yahtzee-roll-preview");
    const yahtzeeRollTargetRow = document.getElementById("yahtzee-roll-target-row");
    const yahtzeeRollTarget = document.getElementById("yahtzee-roll-target");
    const yahtzeeRollScratchWrap = document.getElementById("yahtzee-roll-scratch-wrap");
    const yahtzeeRollScratch = document.getElementById("yahtzee-roll-scratch");
    const yahtzeeRollTriggers = document.querySelectorAll(".yahtzee-roll-trigger");

    let yahtzeeModalPlayerId = null;

    function selectedYahtzeePlayerId() {
      return yahtzeeModalPlayerId || session.playerIds[0];
    }

    function selectedYahtzeeFaceValue() {
      return Number.parseInt(yahtzeeRollFace?.value || "1", 10);
    }

    function renderYahtzeeRollPreview(resolution) {
      if (!yahtzeeRollPreview) {
        return;
      }

      if (!resolution) {
        yahtzeeRollPreview.textContent = "";
        return;
      }

      if (resolution.isFirstYahtzee) {
        yahtzeeRollPreview.textContent = "Preview: Yahtzee box will be set to 50.";
        return;
      }

      if (resolution.candidateCategories.length === 0) {
        yahtzeeRollPreview.textContent = resolution.grantsBonus
          ? "Preview: +100 Yahtzee bonus only (no open categories left)."
          : "Preview: No category updates available (no open categories left).";
        return;
      }

      const category = yahtzeeRollTarget?.value || resolution.forcedCategory || resolution.candidateCategories[0];
      const isScratch = Boolean(yahtzeeRollScratch?.checked);
      const value = game.getJokerScoreValue(resolution.faceValue, category, isScratch);
      const scoreText = isScratch ? "scratch for 0" : `score ${value}`;
      yahtzeeRollPreview.textContent = `Preview: ${formatYahtzeeCategoryLabel(category)} will ${scoreText}.`;
    }

    function renderYahtzeeRollResolution(resetScratch = false) {
      if (!yahtzeeRollRule || !yahtzeeRollTargetRow || !yahtzeeRollTarget || !yahtzeeRollScratchWrap || !yahtzeeRollScratch) {
        return null;
      }

      const playerId = selectedYahtzeePlayerId();
      const faceValue = selectedYahtzeeFaceValue();
      const resolution = game.getYahtzeeRollResolution(playerId, faceValue);
      const bonusText = resolution.grantsBonus ? ` Includes +${resolution.bonusPoints} Yahtzee bonus.` : " No Yahtzee bonus.";
      yahtzeeRollRule.textContent = `${resolution.reason}${bonusText}`;

      if (resetScratch) {
        yahtzeeRollScratch.checked = false;
      }

      if (resolution.isFirstYahtzee || resolution.candidateCategories.length === 0) {
        yahtzeeRollTargetRow.hidden = true;
        yahtzeeRollScratchWrap.hidden = true;
        yahtzeeRollTarget.innerHTML = "";
        renderYahtzeeRollPreview(resolution);
        return resolution;
      }

      yahtzeeRollTargetRow.hidden = false;
      yahtzeeRollScratchWrap.hidden = false;
      yahtzeeRollTarget.innerHTML = resolution.candidateCategories
        .map((category) => `<option value="${category}">${escapeHtml(formatYahtzeeCategoryLabel(category))}</option>`)
        .join("");

      if (resolution.forcedCategory) {
        yahtzeeRollTarget.value = resolution.forcedCategory;
        yahtzeeRollTarget.disabled = true;
      } else {
        yahtzeeRollTarget.disabled = false;
      }

      renderYahtzeeRollPreview(resolution);

      return resolution;
    }

    function openYahtzeeRollModal(playerId) {
      if (!yahtzeeModal) {
        return;
      }
      yahtzeeModalPlayerId = playerId;
      yahtzeeModal.hidden = false;
      const playerName = playerMap[playerId]?.name || playerId;
      if (yahtzeeRollPlayerName) {
        yahtzeeRollPlayerName.textContent = `Player: ${playerName}`;
      }
      if (yahtzeeRollFace && !yahtzeeRollFace.value) {
        yahtzeeRollFace.value = "1";
      }
      renderYahtzeeRollResolution(true);
    }

    function closeYahtzeeRollModal() {
      if (yahtzeeModal) {
        yahtzeeModal.hidden = true;
      }
      yahtzeeModalPlayerId = null;
    }

    yahtzeeRollTriggers.forEach((button) => {
      button.addEventListener("click", () => {
        const playerId = button.getAttribute("data-yahtzee-player-id");
        if (!playerId) {
          return;
        }
        openYahtzeeRollModal(playerId);
      });
    });
    yahtzeeRollCancel?.addEventListener("click", closeYahtzeeRollModal);
    yahtzeeRollFace?.addEventListener("change", () => {
      renderYahtzeeRollResolution(true);
    });
    yahtzeeRollTarget?.addEventListener("change", () => {
      renderYahtzeeRollPreview(renderYahtzeeRollResolution(false));
    });
    yahtzeeRollScratch?.addEventListener("change", () => {
      renderYahtzeeRollPreview(renderYahtzeeRollResolution(false));
    });

    yahtzeeRollSubmit?.addEventListener("click", async () => {
      try {
        const playerId = selectedYahtzeePlayerId();
        const faceValue = selectedYahtzeeFaceValue();
        const resolution = renderYahtzeeRollResolution(false);
        const targetCategory =
          resolution && !resolution.isFirstYahtzee && resolution.candidateCategories.length > 0
            ? yahtzeeRollTarget?.value || resolution.forcedCategory || resolution.candidateCategories[0]
            : null;

        const move = {
          playerId,
          faceValue,
          targetCategory,
          scratch: Boolean(yahtzeeRollScratch?.checked),
        };

        const result = game.applyYahtzeeRoll(move);
        await updateSessionGameState(db, session.id, game.getState(), {
          ...move,
          type: "yahtzee-roll",
          bonusPoints: result.bonusPoints,
          targetValue: result.targetValue,
          updatedAt: new Date().toISOString(),
        });

        closeYahtzeeRollModal();
        await renderYahtzee(db);
      } catch (error) {
        alert(error.message);
      }
    });

    const completeButton = document.getElementById("complete-session");
    const endGameConfirmModal = document.getElementById("end-game-confirm-modal");
    const endGameConfirmText = document.getElementById("end-game-confirm-text");
    const endGameConfirmSubmit = document.getElementById("end-game-confirm-submit");
    const endGameConfirmCancel = document.getElementById("end-game-confirm-cancel");
    const endGameModal = document.getElementById("end-game-modal");
    const endGameResults = document.getElementById("end-game-results");
    const endGameClose = document.getElementById("end-game-close");

    function finalScoresByPlayer() {
      return session.playerIds
        .map((playerId) => {
          const playerName = playerMap[playerId]?.name || playerId;
          const breakdown = game.getPlayerBreakdown(playerId);
          return {
            playerId,
            playerName,
            total: breakdown.grandTotal,
          };
        })
        .sort((left, right) => right.total - left.total);
    }

    function showEndGameResults() {
      if (!endGameModal || !endGameResults) {
        return;
      }

      const rows = finalScoresByPlayer();
      endGameResults.innerHTML = rows
        .map(
          (row) => `
            <li class="end-game-result-item">
              <span class="end-game-result-score">${row.total}</span>
              <span class="end-game-result-name">${escapeHtml(row.playerName)}</span>
            </li>
          `,
        )
        .join("");

      endGameModal.hidden = false;
    }

    function hasIncompletePlayers() {
      const categories = GameClass.categories();
      return session.playerIds.some((playerId) => {
        const values = game.state.currentValuesByPlayer[playerId] || {};
        return categories.some((category) => !Number.isInteger(values[category]));
      });
    }

    function openEndGameConfirmModal() {
      if (!endGameConfirmModal || !endGameConfirmText) {
        return;
      }

      endGameConfirmText.textContent = hasIncompletePlayers()
        ? "Are you sure you want to end the game? Not all players have finished. You can navigate away and return later to complete the scores if you're not ready to end the game."
        : "Are you sure you want to end the game?";

      endGameConfirmModal.hidden = false;
    }

    function closeEndGameConfirmModal() {
      if (endGameConfirmModal) {
        endGameConfirmModal.hidden = true;
      }
    }

    function closeEndGameResults() {
      window.location.href = routePath("home");
    }

    completeButton?.addEventListener("click", () => {
      openEndGameConfirmModal();
    });

    endGameConfirmCancel?.addEventListener("click", closeEndGameConfirmModal);

    endGameConfirmSubmit?.addEventListener("click", async () => {
      try {
        await completeSession(db, session.id, game.getState());
        closeEndGameConfirmModal();
        showEndGameResults();
      } catch (error) {
        alert(error.message);
      }
    });

    endGameClose?.addEventListener("click", closeEndGameResults);
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
