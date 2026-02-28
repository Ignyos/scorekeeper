(function () {
  "use strict";

  function buildPlayerMap(players) {
    const map = {};
    for (const player of players) {
      map[player.id] = player;
    }
    return map;
  }

  async function renderThreeToThirteenPage(db, deps) {
    const {
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
    } = deps;

    const sessionId = parseSessionId();
    if (!sessionId) {
      const players = await listPlayers(db, { includeDeleted: false });
      renderShell("", startGameModalHtml("Three to Thirteen", players));

      const modal = document.getElementById("start-game-modal");
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

      function handleCancel() {
        window.location.href = routePath("home");
      }

      function moveSelectedPlayer(playerId, direction) {
        const currentIndex = selectedPlayerIds.indexOf(playerId);
        if (currentIndex < 0) {
          return;
        }

        const nextIndex = currentIndex + direction;
        if (nextIndex < 0 || nextIndex >= selectedPlayerIds.length) {
          return;
        }

        const reordered = [...selectedPlayerIds];
        const [movedPlayerId] = reordered.splice(currentIndex, 1);
        reordered.splice(nextIndex, 0, movedPlayerId);
        selectedPlayerIds = reordered;
      }

      function renderSelectedPlayers() {
        selectedList.innerHTML = selectedPlayerIds
          .map((playerId, index) => {
            const playerName = playerById[playerId]?.name || playerId;
            return `
              <li class="selected-player-item">
                <span class="selected-player-label">${escapeHtml(playerName)}</span>
                <span class="selected-player-actions">
                  <button type="button" data-move-selected-player-up="${playerId}" aria-label="Move ${escapeHtml(playerName)} up" ${index === 0 ? "disabled" : ""}>↑</button>
                  <button type="button" data-move-selected-player-down="${playerId}" aria-label="Move ${escapeHtml(playerName)} down" ${index === selectedPlayerIds.length - 1 ? "disabled" : ""}>↓</button>
                  <button type="button" data-remove-selected-player="${playerId}" aria-label="Remove ${escapeHtml(playerName)}">×</button>
                </span>
              </li>
            `;
          })
          .join("");

        selectedList.querySelectorAll("[data-move-selected-player-up]").forEach((button) => {
          button.addEventListener("click", () => {
            const playerId = button.getAttribute("data-move-selected-player-up");
            moveSelectedPlayer(playerId, -1);
            renderSelectedPlayers();
          });
        });

        selectedList.querySelectorAll("[data-move-selected-player-down]").forEach((button) => {
          button.addEventListener("click", () => {
            const playerId = button.getAttribute("data-move-selected-player-down");
            moveSelectedPlayer(playerId, 1);
            renderSelectedPlayers();
          });
        });

        selectedList.querySelectorAll("[data-remove-selected-player]").forEach((button) => {
          button.addEventListener("click", () => {
            const playerId = button.getAttribute("data-remove-selected-player");
            selectedPlayerIds = selectedPlayerIds.filter((id) => id !== playerId);
            renderSelectedPlayers();
          });
        });
      }

      cancelButton?.addEventListener("click", handleCancel);

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

      openModal();
      if (shouldAutoOpenNewGame()) {
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

          const GameClass = await loadGameClassBySlug("threetothirteen");
          const game = new GameClass(null);
          game.ensurePlayers(selected);

          const session = await createSession(db, {
            game: "threetothirteen",
            gameClass: "ThreeToThirteenGame",
            gameVersion: "1",
            playerIds: selected,
            gameState: game.getState(),
          });

          window.location.href = withSessionId(routePath("threetothirteen"), session.id);
        } catch (error) {
          alert(error.message);
        }
      });
      return;
    }

    const session = await getSession(db, sessionId);
    if (!session) {
      renderShell(
        "Three to Thirteen",
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

    const GameClass = await loadGameClassBySlug("threetothirteen");
    const game = new GameClass(session.gameState);
    game.ensurePlayers(session.playerIds);

    const completedGameWindowText =
      session.status === "completed" ? formatCompletedGameWindow(session.startTime, session.endTime) : "";

    renderShell(
      "Three to Thirteen",
      `
        ${
          completedGameWindowText
            ? `<section class="card"><p class="muted">${escapeHtml(completedGameWindowText)}</p></section>`
            : ""
        }

        <section class="card">
          <div class="yahtzee-sheet-wrap">
            <table class="ttt-sheet">
              <thead>
                <tr>
                  <th scope="col">Round</th>
                  <th scope="col">Deal</th>
                  ${session.playerIds
                    .map((playerId) => {
                      const playerName = playerMap[playerId]?.name || playerId;
                      return `<th scope="col">${escapeHtml(playerName)}</th>`;
                    })
                    .join("")}
                </tr>
              </thead>
              <tbody id="ttt-scoreboard-body"></tbody>
            </table>
          </div>
          <div class="row scrabble-actions-row">
            <button type="button" id="ttt-end-game" ${session.status !== "active" ? "disabled" : ""}>End Game</button>
          </div>
        </section>

        <div class="modal-backdrop" id="ttt-end-confirm-modal" hidden>
          <div class="modal" role="dialog" aria-modal="true" aria-labelledby="ttt-end-confirm-title">
            <h2 id="ttt-end-confirm-title">End Three to Thirteen Game</h2>
            <p id="ttt-end-confirm-text"></p>
            <div class="row start-game-actions">
              <button type="button" id="ttt-end-confirm-submit">End Game</button>
              <button type="button" id="ttt-end-confirm-cancel">Cancel</button>
            </div>
          </div>
        </div>

        <div class="modal-backdrop" id="ttt-end-results-modal" hidden>
          <div class="modal" role="dialog" aria-modal="true" aria-labelledby="ttt-end-results-title">
            <h2 id="ttt-end-results-title">Final Results (Lowest Wins)</h2>
            <ul id="ttt-end-results-list" class="end-game-results"></ul>
            <div class="row start-game-actions">
              <button type="button" id="ttt-end-results-close">Close</button>
            </div>
          </div>
        </div>
      `,
    );

    const scoreboardBody = document.getElementById("ttt-scoreboard-body");
    const endGameButton = document.getElementById("ttt-end-game");

    const endConfirmModal = document.getElementById("ttt-end-confirm-modal");
    const endConfirmText = document.getElementById("ttt-end-confirm-text");
    const endConfirmSubmit = document.getElementById("ttt-end-confirm-submit");
    const endConfirmCancel = document.getElementById("ttt-end-confirm-cancel");

    const endResultsModal = document.getElementById("ttt-end-results-modal");
    const endResultsList = document.getElementById("ttt-end-results-list");
    const endResultsClose = document.getElementById("ttt-end-results-close");

    function parseInputInteger(value) {
      if (!value || !String(value).trim()) {
        return null;
      }
      const parsed = Number.parseInt(String(value), 10);
      return Number.isInteger(parsed) ? parsed : null;
    }

    function roundScoreInputSelector(roundIndex, playerId) {
      return `.ttt-score-input[data-round-index="${roundIndex}"][data-player-id="${playerId}"]`;
    }

    function moveFocusToNextScoreInput(roundIndex, playerId) {
      const currentPlayerIndex = session.playerIds.indexOf(playerId);
      if (currentPlayerIndex < 0) {
        return;
      }

      const nextPlayerIndex = currentPlayerIndex + 1;
      if (nextPlayerIndex < session.playerIds.length) {
        const nextPlayerId = session.playerIds[nextPlayerIndex];
        const nextInput = scoreboardBody?.querySelector(roundScoreInputSelector(roundIndex, nextPlayerId));
        if (nextInput instanceof HTMLInputElement) {
          nextInput.focus({ preventScroll: true });
        }
        return;
      }

      const nextRoundIndex = roundIndex + 1;
      if (nextRoundIndex < GameClass.roundCount()) {
        const nextInput = scoreboardBody?.querySelector(
          roundScoreInputSelector(nextRoundIndex, session.playerIds[0]),
        );
        if (nextInput instanceof HTMLInputElement) {
          nextInput.focus({ preventScroll: true });
        }
      }
    }

    function renderScoreboard() {
      if (!scoreboardBody) {
        return;
      }

      const rounds = game.getRounds();
      const rowsHtml = rounds
        .map((round, roundIndex) => {
          const dealerName = playerMap[round.dealerPlayerId]?.name || round.dealerPlayerId || "-";
          const scoreCells = session.playerIds
            .map((playerId) => {
              const playerName = playerMap[playerId]?.name || playerId;
              const score = round.scoresByPlayer[playerId];
              const checked = round.winnerPlayerId === playerId;
              if (session.status !== "active") {
                return `
                  <td>
                    <div class="ttt-player-cell">
                      <div>${Number.isInteger(score) ? String(score) : ""}</div>
                      <label class="ttt-winner-toggle">
                        <input type="radio" disabled ${checked ? "checked" : ""} />
                        <span>Win</span>
                      </label>
                    </div>
                  </td>
                `;
              }

              return `
                <td>
                  <div class="ttt-player-cell">
                    <input
                      class="ttt-score-input"
                      type="number"
                      step="1"
                      value="${Number.isInteger(score) ? String(score) : ""}"
                      data-round-index="${roundIndex}"
                      data-player-id="${playerId}"
                      aria-label="Round ${round.cardValue} score for ${escapeHtml(playerName)}"
                    />
                    <label class="ttt-winner-toggle">
                      <input
                        class="ttt-winner-radio"
                        type="radio"
                        name="ttt-round-winner-${roundIndex}"
                        data-round-index="${roundIndex}"
                        data-player-id="${playerId}"
                        ${checked ? "checked" : ""}
                        aria-label="Mark ${escapeHtml(playerName)} as winner for round ${round.cardValue}"
                      />
                      <span>Win</span>
                    </label>
                  </div>
                </td>
              `;
            })
            .join("");

          return `
            <tr>
              <th scope="row">${round.cardValue}</th>
              <td class="ttt-dealer-cell">${escapeHtml(dealerName)}</td>
              ${scoreCells}
            </tr>
          `;
        })
        .join("");

      const totals = game.getTotalsByPlayer(session.playerIds);
      const totalCells = session.playerIds.map((playerId) => `<td><strong>${totals[playerId]}</strong></td>`).join("");
      const totalRow = `
        <tr class="yahtzee-summary-row">
          <th scope="row">Total</th>
          <td></td>
          ${totalCells}
        </tr>
      `;

      scoreboardBody.innerHTML = `${rowsHtml}${totalRow}`;

      if (session.status !== "active") {
        return;
      }

      scoreboardBody.querySelectorAll(".ttt-score-input").forEach((input) => {
        const commitScore = async (moveFocusAfterCommit) => {
          const roundIndex = Number.parseInt(input.getAttribute("data-round-index"), 10);
          const playerId = input.getAttribute("data-player-id");
          if (!Number.isInteger(roundIndex) || !playerId) {
            return;
          }

          const parsed = parseInputInteger(input.value);
          try {
            game.applyScoreUpdate({
              roundIndex,
              playerId,
              value: parsed,
            });
            await updateSessionGameState(db, session.id, game.getState(), null);
            renderScoreboard();
            if (moveFocusAfterCommit) {
              moveFocusToNextScoreInput(roundIndex, playerId);
            }
          } catch (error) {
            alert(error.message);
          }
        };

        input.addEventListener("keydown", async (event) => {
          if (event.key !== "Enter") {
            return;
          }
          event.preventDefault();

            await commitScore(true);
        });

          input.addEventListener("change", async () => {
            await commitScore(false);
          });

          input.addEventListener("blur", async () => {
            await commitScore(false);
          });
      });

      scoreboardBody.querySelectorAll(".ttt-winner-radio").forEach((radio) => {
        radio.addEventListener("change", async () => {
          const roundIndex = Number.parseInt(radio.getAttribute("data-round-index"), 10);
          const playerId = radio.getAttribute("data-player-id");
          if (!Number.isInteger(roundIndex) || !playerId) {
            return;
          }

          try {
            game.setRoundWinner(roundIndex, playerId);
            await updateSessionGameState(db, session.id, game.getState(), null);
            renderScoreboard();
          } catch (error) {
            alert(error.message);
          }
        });
      });

    }

    function openEndConfirmModal() {
      if (!endConfirmModal || !endConfirmText) {
        return;
      }

      endConfirmText.textContent = game.hasIncompleteRounds(session.playerIds)
        ? "Are you sure you want to end the game? Some rounds are incomplete."
        : "Are you sure you want to end the game?";

      endConfirmModal.hidden = false;
    }

    function closeEndConfirmModal() {
      if (endConfirmModal) {
        endConfirmModal.hidden = true;
      }
    }

    function showEndResults() {
      const totals = game.getTotalsByPlayer(session.playerIds);
      const sortedPlayerIds = [...session.playerIds].sort((leftPlayerId, rightPlayerId) => {
        return totals[leftPlayerId] - totals[rightPlayerId];
      });

      endResultsList.innerHTML = sortedPlayerIds
        .map((playerId) => {
          const playerName = playerMap[playerId]?.name || playerId;
          return `
            <li class="end-game-result-item">
              <span class="end-game-result-score">${totals[playerId]}</span>
              <span class="end-game-result-name">${escapeHtml(playerName)}</span>
            </li>
          `;
        })
        .join("");

      if (endResultsModal) {
        endResultsModal.hidden = false;
      }
    }

    renderScoreboard();

    endGameButton?.addEventListener("click", openEndConfirmModal);
    endConfirmCancel?.addEventListener("click", closeEndConfirmModal);
    endConfirmSubmit?.addEventListener("click", async () => {
      try {
        await completeSession(db, session.id, game.getState());
        closeEndConfirmModal();
        showEndResults();
      } catch (error) {
        alert(error.message);
      }
    });

    endResultsClose?.addEventListener("click", () => {
      window.location.href = routePath("home");
    });
  }

  window.ScorekeeperGamesUI = window.ScorekeeperGamesUI || {};
  window.ScorekeeperGamesUI.renderThreeToThirteenPage = renderThreeToThirteenPage;
})();
