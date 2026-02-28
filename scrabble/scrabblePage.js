(function () {
  "use strict";

  function buildPlayerMap(players) {
    const map = {};
    for (const player of players) {
      map[player.id] = player;
    }
    return map;
  }

  async function renderScrabblePage(db, deps) {
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
      rulesTriggerHtml,
    } = deps;

    const sessionId = parseSessionId();
    if (!sessionId) {
      const players = await listPlayers(db, { includeDeleted: false });
      renderShell("", startGameModalHtml("Scrabble", players));

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
                <span class="selected-player-label">
                  ${escapeHtml(playerName)}
                </span>
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

          const GameClass = await loadGameClassBySlug("scrabble");
          const game = new GameClass(null);
          game.ensurePlayers(selected);

          const session = await createSession(db, {
            game: "scrabble",
            gameClass: "ScrabbleGame",
            gameVersion: "1",
            playerIds: selected,
            gameState: game.getState(),
          });

          window.location.href = withSessionId(routePath("scrabble"), session.id);
        } catch (error) {
          alert(error.message);
        }
      });
      return;
    }

    const session = await getSession(db, sessionId);
    if (!session) {
      renderShell(
        "Scrabble",
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

    const GameClass = await loadGameClassBySlug("scrabble");
    const game = new GameClass(session.gameState);
    game.ensurePlayers(session.playerIds);

    const completedGameWindowText =
      session.status === "completed" ? formatCompletedGameWindow(session.startTime, session.endTime) : "";
    const rulesAction = rulesTriggerHtml("scrabble", { context: "game", sessionId: session.id });

    renderShell(
      "Scrabble",
      `
        ${
          completedGameWindowText
            ? `<section class="card"><p class="muted">${escapeHtml(completedGameWindowText)}</p></section>`
            : ""
        }

        <section class="card">
          <div class="yahtzee-sheet-wrap">
            <table class="scrabble-sheet">
            <thead>
              <tr>
                <th scope="col">Round</th>
                ${session.playerIds
                  .map((playerId) => {
                    const playerName = playerMap[playerId]?.name || playerId;
                    return `<th scope="col">${escapeHtml(playerName)}</th>`;
                  })
                  .join("")}
              </tr>
            </thead>
            <tbody id="scrabble-scoreboard-body"></tbody>
          </table>
          </div>
          <div class="row game-actions-row">
            ${rulesAction}
            <button type="button" id="scrabble-end-game" ${session.status !== "active" ? "disabled" : ""}>End Game</button>
          </div>
        </section>

        <div class="modal-backdrop" id="scrabble-end-confirm-modal" hidden>
          <div class="modal" role="dialog" aria-modal="true" aria-labelledby="scrabble-end-confirm-title">
            <h2 id="scrabble-end-confirm-title">End Scrabble Game</h2>
            <p id="scrabble-end-confirm-text">Are you sure you want to end the game?</p>
            <p class="muted">You can also go Home now and continue this game later from History / Continue.</p>
            <div class="row start-game-actions scrabble-end-confirm-actions">
              <button type="button" id="scrabble-end-confirm-home">Home</button>
              <button type="button" id="scrabble-end-confirm-submit">End Game</button>
              <button type="button" id="scrabble-end-confirm-cancel">Cancel</button>
            </div>
          </div>
        </div>

        <div class="modal-backdrop" id="scrabble-end-results-modal" hidden>
          <div class="modal" role="dialog" aria-modal="true" aria-labelledby="scrabble-end-results-title">
            <h2 id="scrabble-end-results-title">Final Results</h2>
            <ul id="scrabble-end-results-list" class="end-game-results"></ul>
            <div class="row start-game-actions">
              <button type="button" id="scrabble-end-results-close">Close</button>
            </div>
          </div>
        </div>
      `,
    );

    const scoreboardBody = document.getElementById("scrabble-scoreboard-body");
    const endGameButton = document.getElementById("scrabble-end-game");

    const endConfirmModal = document.getElementById("scrabble-end-confirm-modal");
    const endConfirmHome = document.getElementById("scrabble-end-confirm-home");
    const endConfirmSubmit = document.getElementById("scrabble-end-confirm-submit");
    const endConfirmCancel = document.getElementById("scrabble-end-confirm-cancel");

    const endResultsModal = document.getElementById("scrabble-end-results-modal");
    const endResultsList = document.getElementById("scrabble-end-results-list");
    const endResultsClose = document.getElementById("scrabble-end-results-close");
    let editingCell = null;
    let pendingCompletedCellEdit = null;

    function parseInputInteger(value) {
      if (!value || !String(value).trim()) {
        return null;
      }
      const parsed = Number.parseInt(String(value), 10);
      return Number.isInteger(parsed) ? parsed : null;
    }

    function startCompletedCellEdit(roundIndex, playerId) {
      const rounds = game.getCompletedRounds();
      const round = rounds[roundIndex];
      if (!round) {
        return;
      }
      const currentValue = round.scoresByPlayer[playerId];
      editingCell = {
        roundIndex,
        playerId,
        draftValue: Number.isInteger(currentValue) ? String(currentValue) : "",
      };
      renderScoreboardRows();
    }

    function cancelCompletedCellEdit() {
      editingCell = null;
      renderScoreboardRows();
    }

    async function commitCompletedCellEdit(roundIndex, playerId, rawValue) {
      const parsed = parseInputInteger(rawValue);
      if (!Number.isInteger(parsed)) {
        alert("Enter a valid integer score.");
        return false;
      }

      game.updateCompletedRoundScore({
        roundIndex,
        playerId,
        value: parsed,
      });
      editingCell = null;
      await updateSessionGameState(db, session.id, game.getState(), null);
      renderScoreboardRows();
      return true;
    }

    async function commitActiveRoundScore(playerId, rawValue, expectedRoundNumber) {
      const currentActiveRoundNumber = game.getCompletedRounds().length + 1;
      if (!Number.isInteger(expectedRoundNumber) || expectedRoundNumber !== currentActiveRoundNumber) {
        return;
      }

      const parsed = parseInputInteger(rawValue);
      game.applyActiveRoundScoreUpdate({
        playerId,
        value: parsed,
      });

      if (game.canAdvanceRound(session.playerIds)) {
        game.advanceRound(session.playerIds);
      }

      renderScoreboardRows();
      await updateSessionGameState(db, session.id, game.getState(), null);
    }

    function renderScoreboardRows() {
      if (!scoreboardBody) {
        return;
      }

      const completedRounds = game.getCompletedRounds();
      const completedRowsHtml = completedRounds
        .map((round, index) => {
          const roundCells = session.playerIds
            .map((playerId) => {
              const value = round.scoresByPlayer[playerId];
              const isEditing =
                session.status === "active" &&
                editingCell &&
                editingCell.roundIndex === index &&
                editingCell.playerId === playerId;

              if (isEditing) {
                const playerName = playerMap[playerId]?.name || playerId;
                return `
                  <td class="scrabble-editing-cell">
                    <input
                      class="scrabble-completed-edit-input"
                      type="number"
                      step="1"
                      value="${escapeHtml(editingCell.draftValue)}"
                      data-edit-round-index="${index}"
                      data-edit-player-id="${playerId}"
                      aria-label="Edit round ${index + 1} score for ${escapeHtml(playerName)}"
                    />
                  </td>
                `;
              }

              const displayValue = Number.isInteger(value) ? String(value) : "";
              if (session.status !== "active") {
                return `<td>${displayValue}</td>`;
              }

              const playerName = playerMap[playerId]?.name || playerId;
              return `
                <td
                  class="scrabble-completed-cell-wrap"
                  data-round-index="${index}"
                  data-player-id="${playerId}"
                  role="button"
                  tabindex="0"
                  aria-label="Edit round ${index + 1} score for ${escapeHtml(playerName)}"
                >
                  <span>${displayValue}</span>
                </td>
              `;
            })
            .join("");

          return `
            <tr class="scrabble-completed-row">
              <th scope="row">${index + 1}</th>
              ${roundCells}
            </tr>
          `;
        })
        .join("");

      const activeRoundNumber = completedRounds.length + 1;
      const activeRoundCells = session.playerIds
        .map((playerId) => {
          const playerName = playerMap[playerId]?.name || playerId;
          const current = game.getActiveRoundScore(playerId);
          if (session.status !== "active") {
            return `<td>${current === null ? "" : String(current)}</td>`;
          }
          return `
            <td>
              <input
                class="scrabble-round-input"
                type="number"
                step="1"
                value="${current === null ? "" : String(current)}"
                data-player-id="${playerId}"
                data-active-round-number="${activeRoundNumber}"
                aria-label="Round ${activeRoundNumber} score for ${escapeHtml(playerName)}"
              />
            </td>
          `;
        })
        .join("");

      const totals = game.getTotalsByPlayer(session.playerIds, { includeActiveRound: true });
      const totalCells = session.playerIds
        .map((playerId) => `<td><strong>${totals[playerId]}</strong></td>`)
        .join("");

      const activeRoundRow = `
        <tr class="scrabble-active-row">
          <th scope="row">
            <span class="scrabble-round-number">${activeRoundNumber}</span>
          </th>
          ${activeRoundCells}
        </tr>
      `;

      const trailingBlankRoundNumber = activeRoundNumber + 1;
      const trailingBlankCells = session.playerIds.map(() => "<td></td>").join("");
      const trailingBlankRow =
        session.status === "active"
          ? `
            <tr class="scrabble-next-round-row">
              <th scope="row" class="muted">${trailingBlankRoundNumber}</th>
              ${trailingBlankCells}
            </tr>
          `
          : "";

      const totalRow = `
        <tr class="yahtzee-summary-row">
          <th scope="row">Total</th>
          ${totalCells}
        </tr>
      `;

      scoreboardBody.innerHTML = `${completedRowsHtml}${activeRoundRow}${trailingBlankRow}${totalRow}`;

      if (session.status === "active") {
        scoreboardBody.querySelectorAll(".scrabble-completed-cell-wrap").forEach((cell) => {
          const getCellEditTarget = () => {
            const roundIndex = Number.parseInt(cell.getAttribute("data-round-index"), 10);
            const playerId = cell.getAttribute("data-player-id");
            if (!Number.isInteger(roundIndex) || !playerId) {
              return null;
            }
            return { roundIndex, playerId };
          };

          const openCellEditor = () => {
            const target = getCellEditTarget();
            if (!target) {
              return;
            }
            pendingCompletedCellEdit = null;
            const { roundIndex, playerId } = target;
            startCompletedCellEdit(roundIndex, playerId);
          };

          cell.addEventListener("pointerdown", () => {
            pendingCompletedCellEdit = getCellEditTarget();
          });

          cell.addEventListener("click", openCellEditor);
          cell.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ") {
              return;
            }
            event.preventDefault();
            openCellEditor();
          });
        });

        scoreboardBody.querySelectorAll(".scrabble-completed-edit-input").forEach((input) => {
          input.addEventListener("input", () => {
            const roundIndex = Number.parseInt(input.getAttribute("data-edit-round-index"), 10);
            const playerId = input.getAttribute("data-edit-player-id");
            if (!Number.isInteger(roundIndex) || !playerId) {
              return;
            }
            if (editingCell && editingCell.roundIndex === roundIndex && editingCell.playerId === playerId) {
              editingCell.draftValue = input.value;
            }
          });

          input.addEventListener("keydown", async (event) => {
            const roundIndex = Number.parseInt(input.getAttribute("data-edit-round-index"), 10);
            const playerId = input.getAttribute("data-edit-player-id");
            if (!Number.isInteger(roundIndex) || !playerId) {
              return;
            }

            if (event.key === "Escape") {
              event.preventDefault();
              cancelCompletedCellEdit();
              return;
            }

            if (event.key !== "Enter") {
              return;
            }

            event.preventDefault();
            await commitCompletedCellEdit(roundIndex, playerId, input.value);
          });

          input.addEventListener("blur", async () => {
            const roundIndex = Number.parseInt(input.getAttribute("data-edit-round-index"), 10);
            const playerId = input.getAttribute("data-edit-player-id");
            if (!Number.isInteger(roundIndex) || !playerId) {
              return;
            }

            const stillEditingThisCell =
              editingCell && editingCell.roundIndex === roundIndex && editingCell.playerId === playerId;
            if (!stillEditingThisCell) {
              return;
            }

            await commitCompletedCellEdit(roundIndex, playerId, input.value);
          });
        });

        scoreboardBody.querySelectorAll(".scrabble-round-input").forEach((input) => {
          const tryCommitActiveInput = async () => {
            const playerId = input.getAttribute("data-player-id");
            const expectedRoundNumber = Number.parseInt(input.getAttribute("data-active-round-number"), 10);
            if (!playerId || !Number.isInteger(expectedRoundNumber)) {
              return;
            }

            try {
              await commitActiveRoundScore(playerId, input.value, expectedRoundNumber);
            } catch (error) {
              alert(error.message);
              input.value = game.getActiveRoundScore(playerId) ?? "";
            }
          };

          input.addEventListener("keydown", async (event) => {
            if (event.key !== "Enter") {
              return;
            }
            event.preventDefault();

            await tryCommitActiveInput();
          });

          input.addEventListener("change", async () => {
            await tryCommitActiveInput();
          });

          input.addEventListener("blur", async () => {
            if (pendingCompletedCellEdit) {
              const { roundIndex, playerId } = pendingCompletedCellEdit;
              pendingCompletedCellEdit = null;
              startCompletedCellEdit(roundIndex, playerId);
              return;
            }

            await tryCommitActiveInput();
          });
        });

        const currentTurnPlayerId = session.playerIds.find((playerId) => game.getActiveRoundScore(playerId) === null) || null;
        const editInput = scoreboardBody.querySelector(".scrabble-completed-edit-input");
        const currentTurnInput = editingCell
          ? editInput
          : currentTurnPlayerId
            ? scoreboardBody.querySelector(`.scrabble-round-input[data-player-id="${currentTurnPlayerId}"]`)
            : null;
        if (currentTurnInput instanceof HTMLInputElement) {
          try {
            currentTurnInput.focus({ preventScroll: true });
          } catch {
            currentTurnInput.focus();
          }
        }
      }
    }

    renderScoreboardRows();

    function openEndConfirmModal() {
      if (endConfirmModal) {
        endConfirmModal.hidden = false;
      }
    }

    function closeEndConfirmModal() {
      if (endConfirmModal) {
        endConfirmModal.hidden = true;
      }
    }

    function showEndResults() {
      const finalTotals = game.getTotalsByPlayer(session.playerIds, { includeActiveRound: true });
      const sortedPlayerIds = [...session.playerIds].sort((leftPlayerId, rightPlayerId) => {
        return finalTotals[rightPlayerId] - finalTotals[leftPlayerId];
      });
      endResultsList.innerHTML = sortedPlayerIds
        .map((playerId) => {
          const playerName = playerMap[playerId]?.name || playerId;
          return `
            <li class="end-game-result-item">
              <span class="end-game-result-score">${finalTotals[playerId]}</span>
              <span class="end-game-result-name">${escapeHtml(playerName)}</span>
            </li>
          `;
        })
        .join("");
      if (endResultsModal) {
        endResultsModal.hidden = false;
      }
    }

    endGameButton?.addEventListener("click", openEndConfirmModal);
    endConfirmCancel?.addEventListener("click", closeEndConfirmModal);
    endConfirmHome?.addEventListener("click", () => {
      window.location.href = routePath("home");
    });
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
  window.ScorekeeperGamesUI.renderScrabblePage = renderScrabblePage;
})();
