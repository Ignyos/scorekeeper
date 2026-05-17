(function () {
  function setupModalHtml(players, esc, homeUrl) {
    const playerOpts = players
      .map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`)
      .join("");

    function slotHtml(label, idPrefix) {
      return `
        <div class="kanjam-player-slot">
          <label class="muted kanjam-slot-label">${esc(label)}</label>
          <select id="${idPrefix}-select" aria-label="${esc(label)} – select existing">
            <option value="">Select player</option>
            ${playerOpts}
          </select>
          <input id="${idPrefix}-input" placeholder="or type a new name" aria-label="${esc(label)} – type new name" />
        </div>
      `;
    }

    return `
      <div class="modal-backdrop" id="kanjam-setup-modal">
        <div class="modal kanjam-setup-modal-inner" role="dialog" aria-modal="true" aria-labelledby="kanjam-setup-title">
          <h2 id="kanjam-setup-title">Kan Jam: Team Setup</h2>
          <p class="muted">Assign two players to each team, then start.</p>
          <div class="kanjam-teams-setup">
            <div class="kanjam-team-setup kanjam-team-setup-blue">
              <h3 class="kanjam-setup-team-heading kanjam-color-blue">Team 1 (Blue)</h3>
              ${slotHtml("Player 1", "kanjam-t0p0")}
              ${slotHtml("Player 2", "kanjam-t0p1")}
            </div>
            <div class="kanjam-team-setup kanjam-team-setup-green">
              <h3 class="kanjam-setup-team-heading kanjam-color-green">Team 2 (Green)</h3>
              ${slotHtml("Player 1", "kanjam-t1p0")}
              ${slotHtml("Player 2", "kanjam-t1p1")}
            </div>
          </div>
          <div class="row start-game-actions">
            <button type="button" id="kanjam-setup-start">Start Game</button>
            <a href="${esc(homeUrl)}" id="kanjam-setup-cancel">Cancel</a>
          </div>
        </div>
      </div>
    `;
  }

  function gameBoardHtml(game, playerMap, esc, isReadOnly, sessionId) {
    const teams = game.getTeams();
    const activeTeamIndex = game.getCurrentTeamIndex();
    const winner = game.getWinner();
    const turnsLen = game.getState().turns.length;

    function teamCardHtml(team, index) {
      const colorClass = index === 0 ? "kanjam-team-blue" : "kanjam-team-green";
      const isActive = !isReadOnly && index === activeTeamIndex;
      const isWinner = winner === index;

      return `
        <div class="kanjam-team-card card ${colorClass}${isActive ? " kanjam-active" : ""}${isWinner ? " kanjam-winner" : ""}" id="kanjam-team-${index}">
          ${isWinner ? `<div class="kanjam-winner-badge">Winner!</div>` : ""}
          <h2 class="kanjam-team-name">${esc(team.name)}</h2>
          <div class="kanjam-score" id="kanjam-score-${index}">${team.score}</div>
          <div class="kanjam-active-indicator" id="kanjam-turn-indicator-${index}"${isActive ? "" : " hidden"}>&#9654; Your Turn</div>
        </div>
      `;
    }

    let turnLabelHtml;
    if (isReadOnly) {
      turnLabelHtml =
        winner !== null
          ? `<strong>${esc(teams[winner].name)} win!</strong>`
          : "<strong>Game over</strong>";
    } else {
      const { lastChance, overtime } = game.getState();
      if (lastChance) {
        turnLabelHtml = `<strong>Last Chance &mdash; ${esc(teams[activeTeamIndex]?.name || "")}</strong>`;
      } else if (overtime) {
        turnLabelHtml = `<strong>Overtime! &mdash; ${esc(teams[activeTeamIndex]?.name || "")}</strong>`;
      } else {
        turnLabelHtml = `<strong>${esc(teams[activeTeamIndex]?.name || "")}'s Turn</strong>`;
      }
    }

    return `
      <div class="kanjam-board" id="kanjam-board" data-active-team="${activeTeamIndex}">
        <div class="kanjam-teams-row">
          ${teams.map((t, i) => teamCardHtml(t, i)).join("")}
        </div>
        <div class="kanjam-actions card">
          <p class="kanjam-turn-label" id="kanjam-turn-label">${turnLabelHtml}</p>
          <div class="kanjam-buttons-grid">
            <button type="button" class="kanjam-action-btn" data-score-type="dinger"${isReadOnly ? " disabled" : ""}>
              Dinger<br /><small>1 pt &mdash; Deflected hit</small>
            </button>
            <button type="button" class="kanjam-action-btn" data-score-type="deuce"${isReadOnly ? " disabled" : ""}>
              Deuce<br /><small>2 pts &mdash; Direct hit</small>
            </button>
            <button type="button" class="kanjam-action-btn" data-score-type="dunk"${isReadOnly ? " disabled" : ""}>
              Dunk<br /><small>3 pts &mdash; Deflected in</small>
            </button>
            <button type="button" class="kanjam-action-btn" data-score-type="donedeal"${isReadOnly ? " disabled" : ""}>
              Done Deal<br /><small>Instant Win!</small>
            </button>
            <button type="button" class="kanjam-action-btn" data-score-type="interference"${isReadOnly ? " disabled" : ""}>
              Interference<br /><small>3 pts / Win</small>
            </button>
            <button type="button" class="kanjam-action-btn kanjam-miss-btn" data-score-type="miss"${isReadOnly ? " disabled" : ""}>
              Miss<br /><small>No Score</small>
            </button>
          </div>
          <div class="row kanjam-bottom-row">
            <button type="button" id="kanjam-undo-btn"${turnsLen === 0 || isReadOnly ? " disabled" : ""}>Undo</button>
            <button
              type="button"
              class="rules-trigger"
              data-open-rules="1"
              data-rules-game="kanjam"
              data-rules-context="${isReadOnly ? "home" : "stay"}"
              data-rules-session-id="${esc(String(sessionId || ""))}">
              Rules
            </button>
            ${!isReadOnly ? `<button type="button" id="kanjam-end-btn">End Game</button>` : ""}
          </div>
        </div>
      </div>
      <div class="modal-backdrop" id="kanjam-bust-modal" hidden>
        <div class="modal" role="dialog" aria-modal="true">
          <h2>Bust!</h2>
          <p id="kanjam-bust-message"></p>
          <div class="row start-game-actions">
            <button type="button" id="kanjam-bust-close">OK</button>
          </div>
        </div>
      </div>
    `;
  }

  async function renderKanJamPage(db, deps) {
    const {
      parseSessionId,
      listPlayers,
      renderShell,
      shouldAutoOpenNewGame,
      clearNewGameQueryParam,
      createPlayer,
      loadGameClassBySlug,
      createSession,
      withSessionId,
      routePath,
      getSession,
      escapeHtml,
      updateSessionGameState,
      completeSession,
      rulesTriggerHtml,
      showWinnerCelebration,
    } = deps;

    const esc = escapeHtml;
    const sessionId = parseSessionId();

    if (!sessionId) {
      // ── Setup phase ──────────────────────────────────────────────────────────
      const players = await listPlayers(db, { includeDeleted: false });
      const homeUrl = routePath("home");
      renderShell("", setupModalHtml(players, esc, homeUrl));

      if (shouldAutoOpenNewGame()) {
        clearNewGameQueryParam();
      }

      const kanJamSlotIds = ["kanjam-t0p0-select", "kanjam-t0p1-select", "kanjam-t1p0-select", "kanjam-t1p1-select"];
      function syncKanJamSlots() {
        const vals = kanJamSlotIds.map((id) => document.getElementById(id)?.value || "");
        kanJamSlotIds.forEach((id, i) => {
          document.getElementById(id)?.querySelectorAll("option").forEach((opt) => {
            opt.hidden = !!opt.value && vals.some((v, j) => j !== i && v === opt.value);
          });
        });
      }
      kanJamSlotIds.forEach((id) => {
        document.getElementById(id)?.addEventListener("change", syncKanJamSlots);
      });

      document.getElementById("kanjam-setup-start")?.addEventListener("click", async () => {
        try {
          const resolveSlot = async (selectId, inputId) => {
            const selectedId = document.getElementById(selectId)?.value || "";
            if (selectedId) return selectedId;
            const typedName = (document.getElementById(inputId)?.value || "").trim();
            if (!typedName) return null;
            const existing = players.find(
              (p) => p.name.toLowerCase() === typedName.toLowerCase(),
            );
            if (existing) return existing.id;
            const newPlayer = await createPlayer(db, typedName);
            players.push(newPlayer);
            return newPlayer.id;
          };

          const [t0p0, t0p1, t1p0, t1p1] = await Promise.all([
            resolveSlot("kanjam-t0p0-select", "kanjam-t0p0-input"),
            resolveSlot("kanjam-t0p1-select", "kanjam-t0p1-input"),
            resolveSlot("kanjam-t1p0-select", "kanjam-t1p0-input"),
            resolveSlot("kanjam-t1p1-select", "kanjam-t1p1-input"),
          ]);

          if (!t0p0 || !t0p1 || !t1p0 || !t1p1) {
            alert("All four player slots must be filled.");
            return;
          }

          const allIds = [t0p0, t0p1, t1p0, t1p1];
          if (new Set(allIds).size !== 4) {
            alert("All four players must be different.");
            return;
          }

          const playerMap = {};
          for (const p of players) {
            playerMap[p.id] = p;
          }

          const teamName0 =
            [playerMap[t0p0]?.name, playerMap[t0p1]?.name].filter(Boolean).join(" & ") ||
            "Team 1";
          const teamName1 =
            [playerMap[t1p0]?.name, playerMap[t1p1]?.name].filter(Boolean).join(" & ") ||
            "Team 2";

          const teamDefs = [
            { name: teamName0, playerIds: [t0p0, t0p1] },
            { name: teamName1, playerIds: [t1p0, t1p1] },
          ];

          const GameClass = await loadGameClassBySlug("kanjam");
          if (!GameClass) throw new Error("Kan Jam game class unavailable.");

          const game = new GameClass(null);
          game.initTeams(teamDefs);

          const session = await createSession(db, {
            game: "kanjam",
            gameClass: "KanJamGame",
            gameVersion: "1",
            playerIds: allIds,
            gameState: game.getState(),
          });

          window.location.href = withSessionId(routePath("kanjam"), session.id);
        } catch (error) {
          alert(error.message);
        }
      });

      return;
    }

    // ── Game phase ─────────────────────────────────────────────────────────────
    const session = await getSession(db, sessionId);
    if (!session) {
      renderShell(
        "Kan Jam",
        `<section class="card"><p>Session not found.</p><a href="${routePath("home")}">Go to Home</a></section>`,
      );
      return;
    }

    const players = await listPlayers(db, { includeDeleted: true });
    const playerMap = {};
    for (const p of players) {
      playerMap[p.id] = p;
    }

    const GameClass = await loadGameClassBySlug("kanjam");
    if (!GameClass) {
      renderShell("Kan Jam", `<section class="card"><p>Game class unavailable.</p></section>`);
      return;
    }

    const game = new GameClass(session.gameState);
    const isReadOnly = session.status !== "active";

    const rulesAction = rulesTriggerHtml("kanjam", {
      context: isReadOnly ? "home" : "stay",
      variant: "badge",
      sessionId: String(sessionId),
    });

    renderShell("Kan Jam", gameBoardHtml(game, playerMap, esc, isReadOnly, sessionId), rulesAction);

    if (isReadOnly) {
      return;
    }

    // ── Active game event handling ─────────────────────────────────────────────
    const board = document.getElementById("kanjam-board");
    const bustModal = document.getElementById("kanjam-bust-modal");
    const bustMessage = document.getElementById("kanjam-bust-message");
    const bustClose = document.getElementById("kanjam-bust-close");
    let bustTimer = null;

    function showBustModal(from, to) {
      if (!bustModal || !bustMessage) return;
      bustMessage.textContent = `Score would have been ${from}, so it was reduced to ${to} instead.`;
      bustModal.hidden = false;
      if (bustTimer) clearTimeout(bustTimer);
      bustTimer = setTimeout(() => {
        bustModal.hidden = true;
      }, 2500);
    }

    bustClose?.addEventListener("click", () => {
      if (bustTimer) clearTimeout(bustTimer);
      if (bustModal) bustModal.hidden = true;
    });

    function updateBoardState() {
      const teams = game.getTeams();
      const activeIdx = game.getCurrentTeamIndex();
      const isNowComplete = game.isComplete();
      const turnsLen = game.getState().turns.length;

      if (board) board.setAttribute("data-active-team", String(activeIdx));

      teams.forEach((team, index) => {
        const card = document.getElementById(`kanjam-team-${index}`);
        const scoreEl = document.getElementById(`kanjam-score-${index}`);
        const indicatorEl = document.getElementById(`kanjam-turn-indicator-${index}`);

        if (scoreEl) scoreEl.textContent = String(team.score);

        if (card) {
          const isActive = !isNowComplete && index === activeIdx;
          const isWinner = game.getWinner() === index;
          card.classList.toggle("kanjam-active", isActive);
          card.classList.toggle("kanjam-winner", isWinner);
          if (isWinner && !card.querySelector(".kanjam-winner-badge")) {
            const badge = document.createElement("div");
            badge.className = "kanjam-winner-badge";
            badge.textContent = "Winner!";
            card.insertBefore(badge, card.firstChild);
          }
        }

        if (indicatorEl) {
          indicatorEl.hidden = isNowComplete || index !== activeIdx;
        }
      });

      const turnLabel = document.getElementById("kanjam-turn-label");
      if (turnLabel) {
        if (isNowComplete) {
          const w = game.getWinner();
          turnLabel.innerHTML =
            w !== null
              ? `<strong>${esc(teams[w].name)} win!</strong>`
              : "<strong>Game over</strong>";
        } else {
          const { lastChance, overtime } = game.getState();
          if (lastChance) {
            turnLabel.innerHTML = `<strong>Last Chance &mdash; ${esc(teams[activeIdx].name)}</strong>`;
          } else if (overtime) {
            turnLabel.innerHTML = `<strong>Overtime! &mdash; ${esc(teams[activeIdx].name)}</strong>`;
          } else {
            turnLabel.innerHTML = `<strong>${esc(teams[activeIdx].name)}'s Turn</strong>`;
          }
        }
      }

      document.querySelectorAll(".kanjam-action-btn").forEach((btn) => {
        btn.disabled = isNowComplete;
      });

      const undoBtn = document.getElementById("kanjam-undo-btn");
      if (undoBtn) undoBtn.disabled = turnsLen === 0 || isNowComplete;

      const endBtn = document.getElementById("kanjam-end-btn");
      if (endBtn) endBtn.hidden = isNowComplete;
    }

    async function saveState() {
      await updateSessionGameState(db, sessionId, game.getState());
    }

    async function handleWin() {
      const finalState = game.getState();
      await completeSession(db, sessionId, finalState);
      const winnerIdx = game.getWinner();
      if (winnerIdx !== null) {
        const winnerTeam = game.getTeams()[winnerIdx];
        const winnerName = winnerTeam.playerIds.map((id) => playerMap[id]?.name || id).join(" & ");
        await showWinnerCelebration([winnerName]);
      }
    }

    // Scoring buttons
    document.querySelectorAll(".kanjam-action-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const scoreType = btn.getAttribute("data-score-type");
        if (!scoreType) return;
        try {
          const result = game.applyScore(scoreType);
          await saveState();
          updateBoardState();
          if (result.bustApplied) {
            showBustModal(result.bustedFrom, result.bustedTo);
          }
          if (game.isComplete()) {
            await handleWin();
          }
        } catch (err) {
          alert(err.message);
        }
      });
    });

    // Undo
    document.getElementById("kanjam-undo-btn")?.addEventListener("click", async () => {
      const undone = game.undo();
      if (!undone) return;
      await saveState();
      updateBoardState();
    });

    // End Game
    document.getElementById("kanjam-end-btn")?.addEventListener("click", async () => {
      const confirmed = window.confirm(
        "End the game now? The leading team will be declared the winner.",
      );
      if (!confirmed) return;
      try {
        const teams = game.getTeams();
        let winnerIdx = null;
        if (teams[0].score > teams[1].score) winnerIdx = 0;
        else if (teams[1].score > teams[0].score) winnerIdx = 1;

        const finalState = game.getState();
        finalState.winner = winnerIdx;
        finalState.winType = winnerIdx !== null ? "manual" : null;

        await completeSession(db, sessionId, finalState);

        if (winnerIdx !== null) {
          const winnerName = teams[winnerIdx].playerIds.map((id) => playerMap[id]?.name || id).join(" & ");
          await showWinnerCelebration([winnerName]);
        }

        window.location.reload();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  window.ScorekeeperGamesUI = window.ScorekeeperGamesUI || {};
  window.ScorekeeperGamesUI.renderKanJamPage = renderKanJamPage;
})();
