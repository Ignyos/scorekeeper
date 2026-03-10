(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Preset definitions
  // ---------------------------------------------------------------------------
  const PRESETS = [
    { category: "Bullet",    label: "1+0",   mode: "suddenDeath", timeMin: 1,   incSec: 0  },
    { category: "Bullet",    label: "1+1",   mode: "fischer",     timeMin: 1,   incSec: 1  },
    { category: "Bullet",    label: "2+1",   mode: "fischer",     timeMin: 2,   incSec: 1  },
    { category: "Blitz",     label: "3+0",   mode: "suddenDeath", timeMin: 3,   incSec: 0  },
    { category: "Blitz",     label: "3+2",   mode: "fischer",     timeMin: 3,   incSec: 2  },
    { category: "Blitz",     label: "5+0",   mode: "suddenDeath", timeMin: 5,   incSec: 0  },
    { category: "Blitz",     label: "5+3",   mode: "fischer",     timeMin: 5,   incSec: 3  },
    { category: "Rapid",     label: "10+0",  mode: "suddenDeath", timeMin: 10,  incSec: 0  },
    { category: "Rapid",     label: "10+5",  mode: "fischer",     timeMin: 10,  incSec: 5  },
    { category: "Rapid",     label: "15+10", mode: "fischer",     timeMin: 15,  incSec: 10 },
    { category: "Rapid",     label: "25+10", mode: "fischer",     timeMin: 25,  incSec: 10 },
    { category: "Classical", label: "60+0",  mode: "suddenDeath", timeMin: 60,  incSec: 0  },
    { category: "Classical", label: "90+30", mode: "fischer",     timeMin: 90,  incSec: 30 },
    { category: "Classical", label: "120+0", mode: "suddenDeath", timeMin: 120, incSec: 0  },
  ];

  const PRESET_CATEGORIES = ["Bullet", "Blitz", "Rapid", "Classical"];

  const MODE_LABELS = {
    none:        "No Timer",
    suddenDeath: "Sudden Death",
    fischer:     "Fischer Increment",
    bronstein:   "Bronstein Delay",
    usDelay:     "US Delay",
    hourglass:   "Hourglass",
    perMove:     "Per-Move Timer",
    hybrid:      "Hybrid (base + per-move)",
    staged:      "Stage-Based",
  };

  // ---------------------------------------------------------------------------
  // Time formatting
  // ---------------------------------------------------------------------------
  function formatTime(ms) {
    if (ms <= 0) return "0:00";
    const totalSec = ms / 1000;
    if (totalSec < 10) {
      const s = Math.floor(totalSec);
      const t = Math.floor((ms % 1000) / 100);
      return s + "." + t;
    }
    const rounded = Math.ceil(totalSec);
    const minutes = Math.floor(rounded / 60);
    const seconds = rounded % 60;
    if (minutes === 0) return String(rounded);
    return minutes + ":" + String(seconds).padStart(2, "0");
  }

  function formatDelayTime(ms) {
    if (ms <= 0) return "0.0";
    const totalSec = ms / 1000;
    const s = Math.floor(totalSec);
    const t = Math.floor((ms % 1000) / 100);
    return s + "." + t;
  }

  function isLowTime(ms, mode) {
    if (mode === "none" || mode === "perMove") return false;
    return ms > 0 && ms < 30000;
  }

  // ---------------------------------------------------------------------------
  // Setup HTML builders
  // ---------------------------------------------------------------------------
  function presetsHtml(esc) {
    return PRESET_CATEGORIES.map((cat) => {
      const buttons = PRESETS.filter((p) => p.category === cat)
        .map(
          (p) =>
            `<button type="button" class="chess-preset-btn"` +
            ` data-mode="${esc(p.mode)}"` +
            ` data-time-min="${p.timeMin}"` +
            ` data-inc-sec="${p.incSec}"` +
            `>${esc(p.label)}</button>`,
        )
        .join("");
      return (
        `<div class="chess-preset-group">` +
        `<span class="chess-preset-category">${esc(cat)}</span>` +
        `<div class="chess-preset-buttons">${buttons}</div>` +
        `</div>`
      );
    }).join("");
  }

  function modeOptionsHtml(esc) {
    return Object.entries(MODE_LABELS)
      .map(([val, label]) => `<option value="${esc(val)}">${esc(label)}</option>`)
      .join("");
  }

  function setupHtml(players, esc) {
    const playerOpts = players
      .map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`)
      .join("");

    return `
      <div class="modal-backdrop" id="chess-setup-modal">
      <div class="modal chess-setup-modal-inner">
        <h2>Chess Timer</h2>
        <p class="muted">Select players and a time control to begin.</p>

        <div class="chess-setup-players">
          <div class="chess-setup-player">
            <label for="chess-white-select">White ♙</label>
            <select id="chess-white-select">
              <option value="">Select player</option>
              ${playerOpts}
            </select>
            <input id="chess-white-name" placeholder="or type a new name" aria-label="White player name" />
          </div>
          <div class="chess-setup-player">
            <label for="chess-black-select">Black ♟</label>
            <select id="chess-black-select">
              <option value="">Select player</option>
              ${playerOpts}
            </select>
            <input id="chess-black-name" placeholder="or type a new name" aria-label="Black player name" />
          </div>
        </div>

        <div class="chess-setup-presets">
          <h3>Presets</h3>
          ${presetsHtml(esc)}
        </div>

        <details class="chess-setup-advanced" id="chess-advanced-section">
          <summary>Custom Time Control</summary>
          <div class="chess-setup-custom-form">
            <div class="chess-custom-row">
              <label for="chess-mode-select">Mode</label>
              <select id="chess-mode-select">${modeOptionsHtml(esc)}</select>
            </div>
            <div class="chess-custom-row" id="chess-row-time">
              <label for="chess-time-input">Minutes per player</label>
              <input id="chess-time-input" type="number" min="0" max="360" step="1" value="5" />
            </div>
            <div class="chess-custom-row" id="chess-row-inc" hidden>
              <label for="chess-inc-input">Increment (seconds)</label>
              <input id="chess-inc-input" type="number" min="0" max="600" step="1" value="3" />
            </div>
            <div class="chess-custom-row" id="chess-row-delay" hidden>
              <label for="chess-delay-input">Delay (seconds)</label>
              <input id="chess-delay-input" type="number" min="0" max="60" step="1" value="5" />
            </div>
            <div class="chess-custom-row" id="chess-row-permove" hidden>
              <label for="chess-permove-input">Seconds per move</label>
              <input id="chess-permove-input" type="number" min="1" max="600" step="1" value="30" />
            </div>
            <div id="chess-staged-config" hidden>
              <p class="muted" style="font-size:0.85rem;margin:4px 0 8px">Configure up to 2 stages. Leave moves at 0 for that stage to apply to the remaining game.</p>
              <div class="chess-stage-row">
                <span class="chess-stage-label">Stage 1</span>
                <span class="chess-stage-cell"><label>Base (min)</label><input type="number" class="chess-stage-base" min="0" step="1" value="90" /></span>
                <span class="chess-stage-cell"><label>Moves</label><input type="number" class="chess-stage-moves" min="0" step="1" value="40" /></span>
                <span class="chess-stage-cell"><label>Add (min)</label><input type="number" class="chess-stage-add" min="0" step="1" value="0" /></span>
                <span class="chess-stage-cell"><label>Inc (sec)</label><input type="number" class="chess-stage-inc" min="0" step="1" value="30" /></span>
                <span class="chess-stage-cell"><label>Delay (sec)</label><input type="number" class="chess-stage-delay" min="0" step="1" value="0" /></span>
              </div>
              <div class="chess-stage-row">
                <span class="chess-stage-label">Stage 2</span>
                <span class="chess-stage-cell"><label>Base (min)</label><input type="number" class="chess-stage-base" min="0" step="1" value="0" /></span>
                <span class="chess-stage-cell"><label>Moves</label><input type="number" class="chess-stage-moves" min="0" step="1" value="0" /></span>
                <span class="chess-stage-cell"><label>Add (min)</label><input type="number" class="chess-stage-add" min="0" step="1" value="30" /></span>
                <span class="chess-stage-cell"><label>Inc (sec)</label><input type="number" class="chess-stage-inc" min="0" step="1" value="30" /></span>
                <span class="chess-stage-cell"><label>Delay (sec)</label><input type="number" class="chess-stage-delay" min="0" step="1" value="0" /></span>
              </div>
            </div>
          </div>
        </details>

        <div class="row start-game-actions">
          <button type="button" id="chess-start-btn">Start Game</button>
          <button type="button" id="chess-cancel-btn">Cancel</button>
        </div>
      </div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Timer board HTML
  // ---------------------------------------------------------------------------
  function clockHalfHtml(playerId, color, state, playerMap, esc) {
    const name = playerMap[playerId]?.name || (color === "white" ? "White" : "Black");
    const mode = state.timingMode;
    const timeMs = state.timeRemainingMs[playerId] || 0;
    const delayMs = state.delayRemainingMs[playerId] || 0;
    const perMoveMs = state.perMoveRemainingMs[playerId] || 0;
    const isActive = state.activePlayerId === playerId && state.status === "running";
    const isPaused = state.status === "paused" && state.activePlayerId === playerId;
    const isFlagged = state.isFinal && state.loserPlayerId === playerId && state.winCondition === "time";

    let classes = "chess-timer-half";
    if (color === "black") classes += " chess-timer-half--black";
    if (isActive) classes += " chess-timer-half--active";
    else if (isFlagged) classes += " chess-timer-half--flagged";
    else classes += " chess-timer-half--inactive";

    let displayTime;
    if (mode === "none") {
      displayTime = "∞";
    } else if (mode === "perMove") {
      displayTime = formatTime(perMoveMs);
    } else {
      displayTime = formatTime(timeMs);
    }

    const timeClass =
      "chess-timer-display" + (isLowTime(timeMs, mode) ? " chess-timer-display--low" : "");

    const moveNum = Math.ceil(state.moveCount / 2) || 1;
    let subInfo = "Move " + moveNum;
    if ((isActive || isPaused) && (mode === "bronstein" || mode === "usDelay" || mode === "hybrid") && delayMs > 0) {
      subInfo = "Delay " + formatDelayTime(delayMs);
    }
    if (mode === "staged") {
      subInfo += " · Stage " + (state.stageIndex + 1);
    }
    if (mode === "none") {
      subInfo = "Move " + moveNum;
    }

    const symbol = color === "white" ? "♙" : "♟";

    return (
      `<div class="${classes}" role="button" tabindex="0"` +
      ` aria-label="${esc(name)} clock${isActive ? ", active" : ""}"` +
      ` data-chess-clock="${esc(playerId)}">` +
      `<div class="chess-timer-piece">${symbol}</div>` +
      `<div class="${timeClass}" aria-live="off">${esc(displayTime)}</div>` +
      `<div class="chess-timer-player-name">${esc(name)}</div>` +
      `<div class="chess-timer-move-count">${esc(subInfo)}</div>` +
      `</div>`
    );
  }

  function controlsHtml(state, playerMap, esc) {
    const isFinished = state.status === "finished";
    const isPaused = state.status === "paused";
    const isReady = state.status === "ready";

    if (isFinished) {
      const winnerId = state.winnerId;
      const winnerName = winnerId ? (playerMap[winnerId]?.name || "Unknown") : null;
      let msg;
      if (state.winCondition === "draw") {
        msg = "Draw ½-½";
      } else if (state.winCondition === "time") {
        msg = esc(winnerName || "Unknown") + " wins on time ⏱";
      } else {
        msg = esc(winnerName || "Unknown") + " wins";
      }
      return (
        `<span class="chess-result-label">${msg}</span>` +
        `<button type="button" id="chess-new-game-btn">New Game</button>`
      );
    }

    if (isReady) {
      return `<span class="chess-timer-hint">Tap a clock to start</span>`;
    }

    const [whiteId, blackId] = state.playerIds;
    const whiteName = playerMap[whiteId]?.name || "White";
    const blackName = playerMap[blackId]?.name || "Black";
    const pauseLabel = isPaused ? "▶ Resume" : "⏸ Pause";

    return (
      `<button type="button" id="chess-pause-btn" aria-label="${isPaused ? "Resume" : "Pause"}">${pauseLabel}</button>` +
      `<button type="button" id="chess-end-game-btn">⚑ End Game</button>`
    );
  }

  function endGameChoicesHtml(state, playerMap, esc) {
    const [whiteId, blackId] = state.playerIds;
    const whiteName = playerMap[whiteId]?.name || "White";
    const blackName = playerMap[blackId]?.name || "Black";
    return (
      `<span class="chess-end-game-label">Who wins?</span>` +
      `<button type="button" class="chess-end-game-choice" data-end-winner="${esc(whiteId)}">\u2659 ${esc(whiteName)}</button>` +
      `<button type="button" id="chess-draw-btn">&frac12;-&frac12; Draw</button>` +
      `<button type="button" class="chess-end-game-choice" data-end-winner="${esc(blackId)}">\u265f ${esc(blackName)}</button>` +
      `<button type="button" id="chess-end-game-cancel-btn">Cancel</button>`
    );
  }

  function timerBoardHtml(state, playerMap, esc) {
    const [whiteId, blackId] = state.playerIds;
    return (
      `<div class="chess-timer-board">` +
      clockHalfHtml(blackId, "black", state, playerMap, esc) +
      `<div class="chess-timer-controls" id="chess-controls">` +
      controlsHtml(state, playerMap, esc) +
      `</div>` +
      clockHalfHtml(whiteId, "white", state, playerMap, esc) +
      `</div>`
    );
  }

  // ---------------------------------------------------------------------------
  // Incremental display update (avoids full HTML rebuild on each tick)
  // ---------------------------------------------------------------------------
  function updateTimerDisplay(state, playerMap) {
    const mode = state.timingMode;

    for (const playerId of state.playerIds) {
      const half = document.querySelector(`[data-chess-clock="${CSS.escape(String(playerId))}"]`);
      if (!half) continue;

      const timeMs = state.timeRemainingMs[playerId] || 0;
      const delayMs = state.delayRemainingMs[playerId] || 0;
      const perMoveMs = state.perMoveRemainingMs[playerId] || 0;
      const isActive = state.activePlayerId === playerId && state.status === "running";
      const isPaused = state.status === "paused" && state.activePlayerId === playerId;
      const isFlagged = state.isFinal && state.loserPlayerId === playerId && state.winCondition === "time";

      half.classList.toggle("chess-timer-half--active", isActive);
      half.classList.toggle("chess-timer-half--inactive", !isActive && !isFlagged);
      half.classList.toggle("chess-timer-half--flagged", isFlagged);

      const timeEl = half.querySelector(".chess-timer-display");
      if (timeEl) {
        let displayTime;
        if (mode === "none") {
          displayTime = "∞";
        } else if (mode === "perMove") {
          displayTime = formatTime(perMoveMs);
        } else {
          displayTime = formatTime(timeMs);
        }
        timeEl.textContent = displayTime;
        timeEl.classList.toggle("chess-timer-display--low", isLowTime(timeMs, mode));
      }

      const subEl = half.querySelector(".chess-timer-move-count");
      if (subEl) {
        const moveNum = Math.ceil(state.moveCount / 2) || 1;
        let subInfo = "Move " + moveNum;
        if ((isActive || isPaused) && (mode === "bronstein" || mode === "usDelay" || mode === "hybrid") && delayMs > 0) {
          subInfo = "Delay " + formatDelayTime(delayMs);
        }
        if (mode === "staged") subInfo += " · Stage " + (state.stageIndex + 1);
        if (mode === "none") subInfo = "Move " + moveNum;
        subEl.textContent = subInfo;
      }
    }
  }

  function rebuildControls(state, playerMap, esc) {
    const controlsEl = document.getElementById("chess-controls");
    if (!controlsEl) return;
    controlsEl.innerHTML = controlsHtml(state, playerMap, esc);
  }

  // ---------------------------------------------------------------------------
  // Setup screen wiring
  // ---------------------------------------------------------------------------
  function wireSetupScreen(db, deps, players) {
    const { createPlayer, loadGameClassBySlug, createSession, withSessionId, routePath, escapeHtml } = deps;

    const modeSelect = document.getElementById("chess-mode-select");
    const rowTime = document.getElementById("chess-row-time");
    const rowInc = document.getElementById("chess-row-inc");
    const rowDelay = document.getElementById("chess-row-delay");
    const rowPerMove = document.getElementById("chess-row-permove");
    const stagedConfig = document.getElementById("chess-staged-config");

    function updateCustomVisibility(mode) {
      const showTime = mode !== "none" && mode !== "perMove";
      rowTime.hidden = !showTime;
      rowInc.hidden = mode !== "fischer";
      rowDelay.hidden = mode !== "bronstein" && mode !== "usDelay";
      rowPerMove.hidden = mode !== "perMove" && mode !== "hybrid";
      if (stagedConfig) stagedConfig.hidden = mode !== "staged";
    }

    if (modeSelect) {
      modeSelect.value = "fischer";
      updateCustomVisibility("fischer");
      modeSelect.addEventListener("change", () => updateCustomVisibility(modeSelect.value));
    }

    document.querySelectorAll(".chess-preset-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".chess-preset-btn").forEach((b) => b.classList.remove("chess-preset-btn--selected"));
        btn.classList.add("chess-preset-btn--selected");

        const mode = btn.getAttribute("data-mode") || "fischer";
        const timeMin = btn.getAttribute("data-time-min") || "5";
        const incSec = btn.getAttribute("data-inc-sec") || "0";

        if (modeSelect) modeSelect.value = mode;
        const ti = document.getElementById("chess-time-input");
        const ii = document.getElementById("chess-inc-input");
        if (ti) ti.value = timeMin;
        if (ii) ii.value = incSec;
        updateCustomVisibility(mode);
      });
    });

    const cancelBtn = document.getElementById("chess-cancel-btn");
    const startBtn = document.getElementById("chess-start-btn");

    cancelBtn?.addEventListener("click", () => {
      window.location.href = routePath("home");
    });

    startBtn?.addEventListener("click", async () => {
      try {
        const mode = modeSelect?.value || "fischer";
        const timeMin = parseFloat(document.getElementById("chess-time-input")?.value || "5") || 0;
        const incSec = parseInt(document.getElementById("chess-inc-input")?.value || "0", 10) || 0;
        const delaySec = parseInt(document.getElementById("chess-delay-input")?.value || "5", 10) || 0;
        const perMoveSec = parseInt(document.getElementById("chess-permove-input")?.value || "30", 10) || 1;

        const createOrFind = async (selectId, inputId) => {
          const selectVal = document.getElementById(selectId)?.value || "";
          if (selectVal) return selectVal;
          const name = (document.getElementById(inputId)?.value || "").trim();
          if (!name) return null;
          const existing = players.find((p) => p.name.toLowerCase() === name.toLowerCase());
          if (existing) return existing.id;
          const newPlayer = await createPlayer(db, name);
          return newPlayer.id;
        };

        const whiteId = await createOrFind("chess-white-select", "chess-white-name");
        const blackId = await createOrFind("chess-black-select", "chess-black-name");

        if (!whiteId || !blackId) {
          alert("Both players are required. Select a player or type a new name for each side.");
          return;
        }
        if (whiteId === blackId) {
          alert("White and Black must be different players.");
          return;
        }

        const playerIds = [whiteId, blackId];
        const timeMsEach = Math.round(timeMin * 60 * 1000);
        const initialTimeMs = {};
        for (const id of playerIds) {
          initialTimeMs[id] = mode === "perMove" ? 0 : timeMsEach;
        }

        let stages = [];
        if (mode === "staged") {
          const stageRows = document.querySelectorAll(".chess-stage-row");
          stageRows.forEach((row) => {
            const baseMin = parseFloat(row.querySelector(".chess-stage-base")?.value || "0") || 0;
            const moves = parseInt(row.querySelector(".chess-stage-moves")?.value || "0", 10) || 0;
            const addMin = parseFloat(row.querySelector(".chess-stage-add")?.value || "0") || 0;
            const incS = parseInt(row.querySelector(".chess-stage-inc")?.value || "0", 10) || 0;
            const delayS = parseInt(row.querySelector(".chess-stage-delay")?.value || "0", 10) || 0;
            stages.push({
              baseTimeMs: Math.round(baseMin * 60 * 1000),
              movesRequired: moves,
              addTimeMs: Math.round(addMin * 60 * 1000),
              incrementMs: incS * 1000,
              delayMs: delayS * 1000,
            });
          });
          // For staged mode, use stage 1 base time as initial time
          if (stages.length > 0 && stages[0].baseTimeMs > 0) {
            for (const id of playerIds) {
              initialTimeMs[id] = stages[0].baseTimeMs;
            }
          }
        }

        const GameClass = await loadGameClassBySlug("chesstimer");
        if (!GameClass) throw new Error("Chess Timer game class not available");
        const game = new GameClass(null);
        game.ensurePlayers(playerIds);
        game.configure({
          timingMode: mode,
          incrementMs: incSec * 1000,
          delayMs: delaySec * 1000,
          perMoveMs: perMoveSec * 1000,
          stages,
          initialTimeMs,
        });

        const session = await createSession(db, {
          game: "chesstimer",
          gameClass: "ChessTimerGame",
          gameVersion: "1",
          playerIds,
          gameState: game.getState(),
        });

        window.location.href = withSessionId(routePath("chesstimer"), session.id);
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Timer screen wiring
  // ---------------------------------------------------------------------------
  function wireTimerScreen(db, deps, session, game, playerMap) {
    const { updateSessionGameState, completeSession, routePath, escapeHtml, showWinnerCelebration } = deps;
    const sessionId = session.id;

    let tickInterval = null;
    let lastTickAt = null;
    let saveTimeout = null;

    function scheduleSave() {
      if (saveTimeout) return;
      saveTimeout = setTimeout(async () => {
        saveTimeout = null;
        if (game.state.status === "running") {
          await updateSessionGameState(db, sessionId, game.getState()).catch(() => {});
        }
      }, 4000);
    }

    function celebrateWinner() {
      const state = game.state;
      if (!state.winnerId || state.winCondition === "draw") return Promise.resolve();
      const winnerName = playerMap[state.winnerId]?.name || "Winner";
      return showWinnerCelebration([winnerName]);
    }

    function startTicking() {
      if (tickInterval) return;
      lastTickAt = Date.now();
      tickInterval = setInterval(async () => {
        if (game.state.status !== "running") return;
        const now = Date.now();
        const elapsed = Math.min(now - (lastTickAt || now), 300);
        lastTickAt = now;

        const result = game.tick(elapsed);
        updateTimerDisplay(game.state, playerMap);

        if (result.flaggedPlayerId) {
          stopTicking();
          rebuildControls(game.state, playerMap, escapeHtml);
          wireControlButtons();
          await completeSession(db, sessionId, game.getState()).catch(() => {});
          await celebrateWinner();
        } else {
          scheduleSave();
        }
      }, 50);
    }

    function stopTicking() {
      if (tickInterval) {
        clearInterval(tickInterval);
        tickInterval = null;
      }
      if (saveTimeout) {
        clearTimeout(saveTimeout);
        saveTimeout = null;
      }
    }

    function wireClockTaps() {
      document.querySelectorAll("[data-chess-clock]").forEach((half) => {
        half.addEventListener("click", handleClockTap);
        half.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClockTap.call(half);
          }
        });
      });
    }

    function handleClockTap() {
      const playerId = this.getAttribute("data-chess-clock");
      if (!playerId) return;

      if (game.state.status === "ready") {
        // Always start with White's clock (White moves first)
        const whiteId = game.state.playerIds[0];
        try {
          game.startGame(whiteId);
        } catch (e) {
          return;
        }
        updateTimerDisplay(game.state, playerMap);
        rebuildControls(game.state, playerMap, escapeHtml);
        wireControlButtons();
        updateSessionGameState(db, sessionId, game.getState()).catch(() => {});
        startTicking();
        return;
      }

      if (game.state.status !== "running") return;
      if (game.state.activePlayerId !== playerId) return;

      stopTicking();
      try {
        game.switchClock(playerId);
      } catch (e) {
        startTicking();
        return;
      }
      updateTimerDisplay(game.state, playerMap);
      rebuildControls(game.state, playerMap, escapeHtml);
      wireControlButtons();
      updateSessionGameState(db, sessionId, game.getState()).catch(() => {});
      startTicking();
    }

    function wireControlButtons() {
      const pauseBtn = document.getElementById("chess-pause-btn");
      const endGameBtn = document.getElementById("chess-end-game-btn");
      const newGameBtn = document.getElementById("chess-new-game-btn");

      pauseBtn?.addEventListener("click", async () => {
        if (game.state.status === "running") {
          stopTicking();
          game.pause();
          rebuildControls(game.state, playerMap, escapeHtml);
          wireControlButtons();
          await updateSessionGameState(db, sessionId, game.getState()).catch(() => {});
        } else if (game.state.status === "paused") {
          game.resume();
          rebuildControls(game.state, playerMap, escapeHtml);
          wireControlButtons();
          startTicking();
        }
      });

      endGameBtn?.addEventListener("click", () => {
        // Pause if running, then show winner-choice panel in place of normal controls
        if (game.state.status === "running") {
          stopTicking();
          game.pause();
          updateSessionGameState(db, sessionId, game.getState()).catch(() => {});
        }
        const controlsEl = document.getElementById("chess-controls");
        if (controlsEl) controlsEl.innerHTML = endGameChoicesHtml(game.state, playerMap, escapeHtml);
        wireEndGameChoices();
      });

      newGameBtn?.addEventListener("click", () => {
        window.location.href = routePath("chesstimer") + "?new=1";
      });
    }

    function wireEndGameChoices() {
      const drawBtn = document.getElementById("chess-draw-btn");
      const cancelBtn = document.getElementById("chess-end-game-cancel-btn");

      document.querySelectorAll(".chess-end-game-choice").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const winnerId = btn.getAttribute("data-end-winner");
          if (!winnerId || !game.state.playerIds.includes(winnerId)) return;
          const loserID = game.state.playerIds.find((id) => id !== winnerId);
          game.resignPlayer(loserID);
          updateTimerDisplay(game.state, playerMap);
          rebuildControls(game.state, playerMap, escapeHtml);
          wireControlButtons();
          await completeSession(db, sessionId, game.getState()).catch(() => {});
          await celebrateWinner();
        });
      });

      drawBtn?.addEventListener("click", async () => {
        game.declareDraw();
        updateTimerDisplay(game.state, playerMap);
        rebuildControls(game.state, playerMap, escapeHtml);
        wireControlButtons();
        await completeSession(db, sessionId, game.getState()).catch(() => {});
      });

      cancelBtn?.addEventListener("click", () => {
        // Resume the game and restore normal controls
        game.resume();
        rebuildControls(game.state, playerMap, escapeHtml);
        wireControlButtons();
        startTicking();
      });
    }

    function handleKeyDown(e) {
      if (e.code === "Space" && game.state.status === "running") {
        e.preventDefault();
        const activeId = game.state.activePlayerId;
        if (!activeId) return;
        stopTicking();
        try {
          game.switchClock(activeId);
        } catch (_) {
          startTicking();
          return;
        }
        updateTimerDisplay(game.state, playerMap);
        rebuildControls(game.state, playerMap, escapeHtml);
        wireControlButtons();
        updateSessionGameState(db, sessionId, game.getState()).catch(() => {});
        startTicking();
      } else if (
        (e.code === "KeyP" || e.code === "Escape") &&
        (game.state.status === "running" || game.state.status === "paused")
      ) {
        e.preventDefault();
        if (game.state.status === "running") {
          stopTicking();
          game.pause();
          rebuildControls(game.state, playerMap, escapeHtml);
          wireControlButtons();
          updateSessionGameState(db, sessionId, game.getState()).catch(() => {});
        } else {
          game.resume();
          rebuildControls(game.state, playerMap, escapeHtml);
          wireControlButtons();
          startTicking();
        }
      }
    }

    function handleVisibilityChange() {
      if (document.hidden && game.state.status === "running") {
        stopTicking();
        game.pause();
        rebuildControls(game.state, playerMap, escapeHtml);
        wireControlButtons();
        updateSessionGameState(db, sessionId, game.getState()).catch(() => {});
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // If session was saved while running, show it as paused so user resumes manually
    if (game.state.status === "running") {
      game.pause();
      rebuildControls(game.state, playerMap, escapeHtml);
    }

    wireClockTaps();
    wireControlButtons();
  }

  // ---------------------------------------------------------------------------
  // Main page renderer
  // ---------------------------------------------------------------------------
  async function renderChessTimerPage(db, deps) {
    const {
      parseSessionId,
      listPlayers,
      renderShell,
      shouldAutoOpenNewGame,
      clearNewGameQueryParam,
      loadGameClassBySlug,
      getSession,
      escapeHtml,
      routePath,
      rulesTriggerHtml,
      formatCompletedGameWindow,
    } = deps;

    const sessionId = parseSessionId();

    if (!sessionId) {
      const players = await listPlayers(db, { includeDeleted: false });
      renderShell(
        "",
        setupHtml(players, escapeHtml),
      );
      wireSetupScreen(db, deps, players);
      if (shouldAutoOpenNewGame()) clearNewGameQueryParam();
      return;
    }

    const session = await getSession(db, sessionId);
    if (!session) {
      renderShell(
        "Chess Timer",
        `<section class="card">
          <p>Session not found.</p>
          <a href="${routePath("home")}">Go to Home</a>
        </section>`,
      );
      return;
    }

    const players = await listPlayers(db, { includeDeleted: true });
    const playerMap = {};
    for (const p of players) playerMap[p.id] = p;

    const GameClass = await loadGameClassBySlug("chesstimer");
    if (!GameClass) {
      renderShell(
        "Chess Timer",
        `<section class="card"><p>Chess Timer is unavailable.</p><a href="${routePath("home")}">Go to Home</a></section>`,
      );
      return;
    }

    const game = new GameClass(session.gameState);

    if (session.status === "completed" || game.state.isFinal) {
      // Read-only completed view
      const state = game.getState();
      const windowStr = formatCompletedGameWindow(session.startTime, session.endTime);
      const [whiteId, blackId] = state.playerIds;
      const whiteName = playerMap[whiteId]?.name || "White";
      const blackName = playerMap[blackId]?.name || "Black";

      let resultMsg = "";
      if (state.winCondition === "draw") {
        resultMsg = "Draw ½-½";
      } else if (state.winCondition === "time") {
        const wName = playerMap[state.winnerId]?.name || "Unknown";
        resultMsg = `${escapeHtml(wName)} wins on time`;
      } else if (state.winCondition === "resigned") {
        const wName = playerMap[state.winnerId]?.name || "Unknown";
        resultMsg = `${escapeHtml(wName)} wins by resignation`;
      }

      const modeLabel = MODE_LABELS[state.timingMode] || state.timingMode;

      function fmtRemaining(playerId) {
        const ms = state.timeRemainingMs[playerId] || 0;
        return formatTime(ms);
      }

      renderShell(
        "Chess Timer",
        `<section class="card">
          <p class="muted">${escapeHtml(windowStr)}</p>
          <p><strong>${escapeHtml(resultMsg || "Game over")}</strong></p>
          <p class="muted">Mode: ${escapeHtml(modeLabel)}</p>
          <table class="chess-result-table">
            <thead><tr><th>Player</th><th>Color</th><th>Time Left</th></tr></thead>
            <tbody>
              <tr>
                <td>${escapeHtml(whiteName)}</td><td>♙ White</td>
                <td>${escapeHtml(state.timingMode === "none" ? "—" : fmtRemaining(whiteId))}</td>
              </tr>
              <tr>
                <td>${escapeHtml(blackName)}</td><td>♟ Black</td>
                <td>${escapeHtml(state.timingMode === "none" ? "—" : fmtRemaining(blackId))}</td>
              </tr>
            </tbody>
          </table>
          <p class="muted">Total moves: ${state.moveCount}</p>
          <div class="row start-game-actions" style="margin-top:12px">
            <a href="${routePath("chesstimer")}?new=1">New Game</a>
            <a href="${routePath("history")}">History</a>
          </div>
        </section>`,
      );
      return;
    }

    // Live timer board — no shell title for full-height layout
    renderShell("", timerBoardHtml(game.state, playerMap, escapeHtml));
    // Break out of container padding for the timer board
    document.querySelector(".container")?.classList.add("chess-timer-container");

    wireTimerScreen(db, deps, session, game, playerMap);
  }

  window.ScorekeeperGamesUI = window.ScorekeeperGamesUI || {};
  window.ScorekeeperGamesUI.renderChessTimerPage = renderChessTimerPage;
})();
