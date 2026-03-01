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
      path.includes("/threetothirteen/") ||
      path.includes("/trepenta/") ||
      path.includes("/settings/") ||
      path.includes("/players/") ||
      path.includes("/history/");

    if (!isFileMode()) {
      if (routeName === "home") return "/";
      if (routeName === "yahtzee") return "/yahtzee";
      if (routeName === "scrabble") return "/scrabble";
      if (routeName === "threetothirteen") return "/threetothirteen";
      if (routeName === "trepenta") return "/trepenta";
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
    if (routeName === "threetothirteen") {
      if (path.includes("/threetothirteen/")) return "./index.html";
      return inSubFolder ? "../threetothirteen/index.html" : "./threetothirteen/index.html";
    }
    if (routeName === "trepenta") {
      if (path.includes("/trepenta/")) return "./index.html";
      return inSubFolder ? "../trepenta/index.html" : "./trepenta/index.html";
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

  const RULES_BY_GAME = {
    yahtzee: {
      title: "Yahtzee Rules",
      html: `
        <h3>Objective</h3>
        <p>Score the highest total by filling all score categories.</p>
        <h3>Turn Flow</h3>
        <ul>
          <li>On your turn, roll five dice up to three times.</li>
          <li>After each roll, you may keep any dice and re-roll the rest.</li>
          <li>After your final roll, choose one open category and record a score.</li>
        </ul>
        <h3>Scoring Basics</h3>
        <ul>
          <li>Upper section (Ones through Sixes) scores the sum of matching dice.</li>
          <li>If your upper subtotal is 63 or more, you earn a 35-point bonus.</li>
          <li>Lower section categories score combinations like Three/Four of a Kind, Full House, Straights, Chance, and Yahtzee.</li>
        </ul>
        <h3>Yahtzee and Bonus Yahtzees</h3>
        <ul>
          <li>A Yahtzee is five of a kind and scores 50 in the Yahtzee category.</li>
          <li>Additional Yahtzees may award bonus points when allowed by your current score sheet state.</li>
          <li>If no legal scoring option is available for a roll, you must record 0 in an open category.</li>
        </ul>
        <h3>Game End</h3>
        <p>The game ends when all categories are filled for all players. Highest grand total wins.</p>
      `,
    },
    scrabble: {
      title: "Scrabble Scoring Rules",
      html: `
        <h3>Objective</h3>
        <p>Finish with the highest total score.</p>
        <h3>Round Scoring</h3>
        <ul>
          <li>After each round, each player enters their round score in the active row.</li>
          <li>When all player scores are entered, the round is committed and a new row opens automatically.</li>
          <li>Totals update as scores are entered and include the current in-progress row.</li>
        </ul>
        <h3>Score Corrections</h3>
        <ul>
          <li>Completed round cells are editable.</li>
          <li>Tap or click a completed cell to update the recorded score.</li>
          <li>Use integer values only for all score entries.</li>
        </ul>
        <h3>Game End</h3>
        <p>Click End Game when play is complete. The highest total score wins.</p>
      `,
    },
    threetothirteen: {
      title: "Three Thirteen Rules",
      html: `
        <h3>Objective</h3>
        <p>Create valid sets and runs while keeping the lowest total penalty score after 11 rounds.</p>
        <h3>Players and Decks</h3>
        <ul>
          <li>Best with 2 to 4 players.</li>
          <li>Use one standard 52-card deck for 2 players.</li>
          <li>Use two standard decks for 3 to 4 players.</li>
          <li>Aces are low; card order is A, 2, 3, ... Q, K.</li>
        </ul>
        <h3>Round Structure</h3>
        <ul>
          <li>The game has 11 rounds, with hands increasing from 3 cards up to 13 cards.</li>
          <li>Deal passes left each round.</li>
          <li>After dealing, remaining cards form the stock and one card starts the discard pile.</li>
        </ul>
        <h3>Turn Flow</h3>
        <ul>
          <li>Draw one card (from stock or top of discard pile).</li>
          <li>Arrange your hand into melds if possible.</li>
          <li>Discard one card to end your turn.</li>
        </ul>
        <h3>Melds</h3>
        <ul>
          <li><strong>Set</strong>: 3 or more cards of the same rank.</li>
          <li><strong>Run</strong>: 3 or more consecutive cards of the same suit.</li>
          <li>Each card can count in only one meld.</li>
          <li>Since Ace is low, A-2-3 is valid and Q-K-A is not.</li>
        </ul>
        <h3>Wild Cards by Round</h3>
        <ul>
          <li>Each round’s rank is wild: round 1 uses 3s, round 2 uses 4s, and so on through Kings in round 11.</li>
          <li>Wild cards may substitute for other cards in runs or sets.</li>
          <li>A valid meld must include at least one non-wild card.</li>
        </ul>
        <h3>Going Out and End of Round</h3>
        <ul>
          <li>You can go out when, after drawing, all cards can be organized into melds with one final discard.</li>
          <li>After a player goes out, other players get one last turn.</li>
        </ul>
        <h3>Scoring</h3>
        <ul>
          <li>After each round, only cards not used in melds count as penalty points.</li>
          <li>Ace = 1 point; number cards = face value; Jack/Queen/King = 10 points each.</li>
          <li>Add round penalties across all 11 rounds; lowest total wins.</li>
        </ul>
        <h3>Using This Scorekeeper</h3>
        <ul>
          <li>Enter each player’s round score as an integer.</li>
          <li>Use the Win toggle to mark the round winner.</li>
          <li>Totals update automatically, and lower totals are better.</li>
        </ul>
        <h3>Game End</h3>
        <p>Play through all 11 rounds. The player with the lowest cumulative score wins.</p>
      `,
    },
    trepenta: {
      title: "Trepenta Rules",
      html: `
        <h3>Objective</h3>
        <p>Finish five rounds with the lowest total points by making sets and runs in hand while managing your field.</p>
        <h3>Turn Sequence</h3>
        <ul>
          <li>Draw one card from the draw pile or discard pile.</li>
          <li>Exchange (optional) one hand card with a valid field position when allowed by your selected rules.</li>
          <li>Discard one card to end your turn.</li>
        </ul>
        <h3>Round and Scoring</h3>
        <ul>
          <li>The game plays exactly five rounds.</li>
          <li>Sets and runs score 0; non-melded cards score penalty points.</li>
          <li>Ace = 1 point, 2-10 = face value, J/Q/K = 10 points.</li>
          <li>Lowest total after round five wins.</li>
        </ul>
        <h3>Field and House Rules</h3>
        <ul>
          <li>Each game stores selected house rules and deck configuration as part of session state.</li>
          <li>The setup screen records your exact Trepenta configuration for history and continuation.</li>
        </ul>
      `,
    },
  };

  function menuHtml() {
    return `
      <details class="menu" id="main-menu">
        <summary class="menu-button" aria-label="Open menu">☰</summary>
        <div class="menu-panel" role="menu">
          <a href="${routePath("home")}" role="menuitem">Home</a>
          <a href="${routePath("players")}" role="menuitem">Manage Players</a>
          <a href="${routePath("history")}" role="menuitem">History / Continue</a>
          <a href="${routePath("settings")}" role="menuitem">Settings</a>
          <button type="button" role="menuitem" id="open-about-modal">About</button>
        </div>
      </details>
    `;
  }

  function aboutLogoPath() {
    const path = window.location.pathname.toLowerCase();
    const inSubFolder =
      path.includes("/yahtzee/") ||
      path.includes("/scrabble/") ||
      path.includes("/threetothirteen/") ||
      path.includes("/trepenta/") ||
      path.includes("/settings/") ||
      path.includes("/players/") ||
      path.includes("/history/");

    if (!isFileMode()) {
      return "/images/ignyos-logo.ico";
    }

    return inSubFolder ? "../images/ignyos-logo.ico" : "./images/ignyos-logo.ico";
  }

  function aboutModalHtml() {
    return `
      <div class="modal-backdrop" id="about-modal" hidden>
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="about-modal-title">
          <h2 id="about-modal-title">About Scorekeeper</h2>
          <p>Scorekeeper is a simple local app for tracking game scores in your browser.</p>
          <p class="muted">Game data is stored on this device only. We do not collect or transmit any personal information.</p>
          <p class="about-link-row">
            <img class="about-logo" src="${aboutLogoPath()}" alt="Ignyos logo" />
            <span> Developed by </span>
            <a class="about-link" href="https://ignyos.com" target="_blank" rel="noopener noreferrer">ignyos.com</a>
          </p>
          <div class="row start-game-actions">
            <button type="button" id="close-about-modal">Close</button>
          </div>
        </div>
      </div>
    `;
  }

  function rulesTriggerHtml(gameSlug, options) {
    const requestedContext = String(options?.context || "home").toLowerCase();
    const context = requestedContext === "game" || requestedContext === "stay" ? requestedContext : "home";
    const variant = options?.variant === "badge" ? "badge" : "inline";
    const sessionId = options?.sessionId ? String(options.sessionId) : "";
    const label = String(options?.label || "Rules").trim() || "Rules";
    const className = variant === "badge" ? "rules-trigger rules-trigger-badge" : "rules-trigger";

    return `
      <button
        type="button"
        class="${className}"
        data-open-rules="1"
        data-rules-game="${escapeHtml(gameSlug)}"
        data-rules-context="${escapeHtml(context)}"
        data-rules-session-id="${escapeHtml(sessionId)}"
      >${escapeHtml(label)}</button>
    `;
  }

  function rulesModalHtml() {
    return `
      <div class="modal-backdrop" id="rules-modal" hidden>
        <div class="modal rules-modal" role="dialog" aria-modal="true" aria-labelledby="rules-modal-title">
          <h2 id="rules-modal-title">Rules</h2>
          <div id="rules-modal-content" class="rules-modal-content"></div>
          <div class="row start-game-actions">
            <button type="button" id="close-rules-modal">Close</button>
          </div>
        </div>
      </div>
    `;
  }

  function parseRulesParams() {
    const params = new URLSearchParams(window.location.search);
    const game = (params.get("rules") || "").toLowerCase();
    const context = (params.get("rulesContext") || "").toLowerCase();
    const sessionId = params.get("rulesSession") || "";
    if (!game) {
      return null;
    }
    return {
      game,
      context: context === "game" || context === "stay" ? context : "home",
      sessionId,
    };
  }

  function setRulesParams(gameSlug, context, sessionId) {
    const url = new URL(window.location.href);
    url.searchParams.set("rules", gameSlug);
    url.searchParams.set("rulesContext", context);
    if (context === "game" && sessionId) {
      url.searchParams.set("rulesSession", sessionId);
    } else {
      url.searchParams.delete("rulesSession");
    }
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function clearRulesParams() {
    const url = new URL(window.location.href);
    url.searchParams.delete("rules");
    url.searchParams.delete("rulesContext");
    url.searchParams.delete("rulesSession");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
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
          <p class="muted start-game-order-note">Selection order sets player order.</p>

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

  function renderShell(title, innerHtml, titleActionHtml) {
    const heading = String(title || "").trim();
    const action = String(titleActionHtml || "").trim();
    app.innerHTML = `
      <header class="topbar">
        <div class="topbar-inner">
          ${menuHtml()}
        </div>
      </header>
      <div class="container">
        ${
          heading
            ? `
              <div class="page-title-row">
                <h1>${heading}</h1>
                ${action}
              </div>
            `
            : ""
        }
        ${innerHtml}
      </div>
      ${aboutModalHtml()}
      ${rulesModalHtml()}
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

    const aboutModal = document.getElementById("about-modal");
    const openAboutButton = document.getElementById("open-about-modal");
    const closeAboutButton = document.getElementById("close-about-modal");
    const rulesModal = document.getElementById("rules-modal");
    const rulesModalTitle = document.getElementById("rules-modal-title");
    const rulesModalContent = document.getElementById("rules-modal-content");
    const closeRulesButton = document.getElementById("close-rules-modal");

    let currentRulesContext = "home";
    let currentRulesGameSlug = "";
    let currentRulesSessionId = "";

    function closeAboutModal() {
      if (aboutModal) {
        aboutModal.hidden = true;
      }
    }

    openAboutButton?.addEventListener("click", () => {
      if (menuRoot) {
        menuRoot.open = false;
      }
      if (aboutModal) {
        aboutModal.hidden = false;
      }
    });

    closeAboutButton?.addEventListener("click", closeAboutModal);

    aboutModal?.addEventListener("click", (event) => {
      if (event.target === aboutModal) {
        closeAboutModal();
      }
    });

    function openRulesModal(gameSlug, context, sessionId) {
      const rules = RULES_BY_GAME[gameSlug];
      if (!rules || !rulesModal || !rulesModalTitle || !rulesModalContent) {
        return;
      }

      currentRulesContext = context === "game" || context === "stay" ? context : "home";
      currentRulesGameSlug = gameSlug;
      currentRulesSessionId = sessionId || "";
      rulesModalTitle.textContent = rules.title;
      rulesModalContent.innerHTML = rules.html;
      rulesModal.hidden = false;
      setRulesParams(currentRulesGameSlug, currentRulesContext, currentRulesSessionId);
    }

    function closeRulesModal() {
      if (!rulesModal) {
        return;
      }

      if (currentRulesContext === "stay") {
        clearRulesParams();
        rulesModal.hidden = true;
        return;
      }

      const gameRoute = currentRulesGameSlug ? routePath(currentRulesGameSlug) : routePath("home");
      const target =
        currentRulesContext === "game"
          ? withSessionId(gameRoute, currentRulesSessionId || parseSessionId() || "")
          : routePath("home");

      const targetUrl = new URL(target, window.location.href);
      const currentUrl = new URL(window.location.href);
      const sameTarget = targetUrl.pathname === currentUrl.pathname;

      if (sameTarget) {
        clearRulesParams();
        rulesModal.hidden = true;
        return;
      }

      window.location.href = target;
    }

    app.querySelectorAll("[data-open-rules='1']").forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const gameSlug = (trigger.getAttribute("data-rules-game") || "").toLowerCase();
        const context = (trigger.getAttribute("data-rules-context") || "home").toLowerCase();
        const sessionId = trigger.getAttribute("data-rules-session-id") || parseSessionId() || "";
        if (!gameSlug) {
          return;
        }
        openRulesModal(gameSlug, context, sessionId);
      });
    });

    closeRulesButton?.addEventListener("click", closeRulesModal);

    rulesModal?.addEventListener("click", (event) => {
      if (event.target === rulesModal) {
        closeRulesModal();
      }
    });

    const initialRules = parseRulesParams();
    if (initialRules && RULES_BY_GAME[initialRules.game]) {
      openRulesModal(initialRules.game, initialRules.context, initialRules.sessionId);
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
    const sessions = await listSessions(db);
    const gamesWithActiveSessions = new Set(
      sessions
        .filter((session) => session?.status === "active")
        .map((session) => String(session?.game || "").toLowerCase())
        .filter(Boolean),
    );

    const homeGameCards = Object.values(gameRegistry)
      .map((gameDef) => {
        const title = gameDef.title || gameDef.slug;
        const description = gameDef.description || "Start a new game";
        const hasActiveSession = gamesWithActiveSessions.has(String(gameDef.slug || "").toLowerCase());
        return `
          <article class="home-game-card">
            ${rulesTriggerHtml(gameDef.slug, { context: "home", variant: "badge" })}
            <h2>${escapeHtml(title)}</h2>
            <p class="muted">${escapeHtml(description)}</p>
            <div class="row home-game-actions">
              <button type="button" data-home-new="${escapeHtml(gameDef.slug)}">New</button>
              <button type="button" data-home-continue="${escapeHtml(gameDef.slug)}" ${hasActiveSession ? "" : "disabled"}>Continue</button>
            </div>
          </article>
        `;
      })
      .join("");

    renderShell(
      "Scorekeeper",
      `
        <section class="home-hero">
          <p class="home-mission">Scorekeeping made easy for every round, every game.</p>
          <section class="home-game-grid">
            ${homeGameCards}
          </section>
        </section>
      `,
    );

    document.querySelectorAll("[data-home-new]").forEach((button) => {
      button.addEventListener("click", () => {
        const gameSlug = button.getAttribute("data-home-new");
        if (!gameSlug) {
          return;
        }
        window.location.href = `${routePath(gameSlug)}?new=1`;
      });
    });

    document.querySelectorAll("[data-home-continue]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.hasAttribute("disabled")) {
          return;
        }
        const gameSlug = button.getAttribute("data-home-continue");
        if (!gameSlug) {
          return;
        }
        window.location.href = `${routePath("history")}?game=${encodeURIComponent(gameSlug)}`;
      });
    });
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
        const trepentaSettings = gameKey === "trepenta" ? session?.gameState?.settings || {} : null;
        const trepentaDeckConfig = trepentaSettings?.deckConfig || null;
        const trepentaRules = Array.isArray(trepentaSettings?.selectedRules)
          ? trepentaSettings.selectedRules
          : Array.isArray(trepentaSettings?.selectedRuleKeys)
            ? trepentaSettings.selectedRuleKeys.map((ruleKey) => ({
                key: ruleKey,
                name: String(ruleKey || "")
                  .split("-")
                  .filter(Boolean)
                  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                  .join(" "),
              }))
            : [];

        const trepentaDeckSummary = trepentaDeckConfig
          ? trepentaDeckConfig.type === "trepenta"
            ? `Trepenta deck (${trepentaDeckConfig.count || 4} suit${(trepentaDeckConfig.count || 4) === 1 ? "" : "s"})`
            : `${trepentaDeckConfig.count || 1} standard deck${(trepentaDeckConfig.count || 1) === 1 ? "" : "s"}`
          : "";

        const trepentaRulesHtml =
          gameKey === "trepenta"
            ? `
              <div class="session-meta">
                <p class="muted"><strong>Deck:</strong> ${escapeHtml(trepentaDeckSummary || "Not set")}</p>
                <div class="session-rule-list">
                  <strong>House Rules:</strong>
                  ${
                    trepentaRules.length
                      ? `<span class="session-rule-badges">${trepentaRules
                          .map((rule) => `<span class="session-rule-badge">${escapeHtml(rule.name || rule.key || "Rule")}</span>`)
                          .join("")}</span>`
                      : `<span class="muted">None</span>`
                  }
                </div>
              </div>
            `
            : "";

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
            ${trepentaRulesHtml}
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

    if (gameKey === "threetothirteen") {
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

      return playerIds
        .map((playerId) => ({
          playerId,
          total: totalsByPlayer[playerId] || 0,
        }))
        .sort((left, right) => left.total - right.total);
    }

    if (gameKey === "trepenta") {
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

      return playerIds
        .map((playerId) => ({
          playerId,
          total: totalsByPlayer[playerId] || 0,
        }))
        .sort((left, right) => left.total - right.total);
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
      rulesTriggerHtml,
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
      rulesTriggerHtml,
    });
  }

  async function renderThreeToThirteen(db) {
    const renderThreeToThirteenPage = window.ScorekeeperGamesUI?.renderThreeToThirteenPage;
    if (typeof renderThreeToThirteenPage !== "function") {
      throw new Error("Three Thirteen page renderer is unavailable");
    }

    await renderThreeToThirteenPage(db, {
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
      rulesTriggerHtml,
    });
  }

  async function renderTrepenta(db) {
    const renderTrepentaPage = window.ScorekeeperGamesUI?.renderTrepentaPage;
    if (typeof renderTrepentaPage !== "function") {
      throw new Error("Trepenta page renderer is unavailable");
    }

    await renderTrepentaPage(db, {
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
      rulesTriggerHtml,
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
        if (route.slug === "threetothirteen") {
          await renderThreeToThirteen(db);
          return;
        }
        if (route.slug === "trepenta") {
          await renderTrepenta(db);
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
