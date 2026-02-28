(function () {
  "use strict";

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

  function buildPlayerMap(players) {
    const map = {};
    for (const player of players) {
      map[player.id] = player;
    }
    return map;
  }

  async function renderYahtzeePage(db, deps) {
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
      renderShell("", startGameModalHtml("Yahtzee", players));

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
            <div class="row start-game-actions yahtzee-end-confirm-actions">
              <button type="button" id="end-game-confirm-home">Home</button>
              <button type="button" id="end-game-confirm-submit">End Game</button>
              <button type="button" id="end-game-confirm-cancel">Cancel</button>
            </div>
          </div>
        </div>

        <div class="modal-backdrop" id="yahtzee-roll-modal" hidden>
          <div class="modal" role="dialog" aria-modal="true" aria-labelledby="yahtzee-roll-title">
            <h2 id="yahtzee-roll-title">Record Yahtzee Roll</h2>
            <p id="yahtzee-roll-player-name" class="muted"></p>
            <div class="row" id="yahtzee-roll-face-row">
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
    const yahtzeeRollFaceRow = document.getElementById("yahtzee-roll-face-row");
    const yahtzeeRollFace = document.getElementById("yahtzee-roll-face");
    const yahtzeeRollRule = document.getElementById("yahtzee-roll-rule");
    const yahtzeeRollPreview = document.getElementById("yahtzee-roll-preview");
    const yahtzeeRollTargetRow = document.getElementById("yahtzee-roll-target-row");
    const yahtzeeRollTarget = document.getElementById("yahtzee-roll-target");
    const yahtzeeRollTriggers = document.querySelectorAll(".yahtzee-roll-trigger");

    let yahtzeeModalPlayerId = null;

    function selectedYahtzeePlayerId() {
      return yahtzeeModalPlayerId || session.playerIds[0];
    }

    function selectedYahtzeeFaceValue() {
      return Number.parseInt(yahtzeeRollFace?.value || "1", 10);
    }

    function setFirstYahtzeeModalMode(isFirstYahtzee) {
      if (yahtzeeRollFaceRow) {
        yahtzeeRollFaceRow.hidden = isFirstYahtzee;
      }
      if (yahtzeeRollRule) {
        yahtzeeRollRule.hidden = isFirstYahtzee;
        if (isFirstYahtzee) {
          yahtzeeRollRule.textContent = "";
        }
      }
      if (yahtzeeRollPreview) {
        yahtzeeRollPreview.hidden = isFirstYahtzee;
        if (isFirstYahtzee) {
          yahtzeeRollPreview.textContent = "";
        }
      }
      if (yahtzeeRollTargetRow) {
        yahtzeeRollTargetRow.hidden = true;
      }
      if (yahtzeeRollTarget && isFirstYahtzee) {
        yahtzeeRollTarget.innerHTML = "";
      }
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
      const value = game.getJokerScoreValue(resolution.faceValue, category, false);
      yahtzeeRollPreview.textContent = `Preview: ${formatYahtzeeCategoryLabel(category)} will score ${value}.`;
    }

    function renderYahtzeeRollResolution() {
      if (!yahtzeeRollRule || !yahtzeeRollTargetRow || !yahtzeeRollTarget) {
        return null;
      }

      const playerId = selectedYahtzeePlayerId();
      const faceValue = selectedYahtzeeFaceValue();
      const resolution = game.getYahtzeeRollResolution(playerId, faceValue);

      if (resolution.isFirstYahtzee) {
        setFirstYahtzeeModalMode(true);
        return resolution;
      }

      setFirstYahtzeeModalMode(false);
      const bonusText = resolution.grantsBonus ? ` Includes +${resolution.bonusPoints} Yahtzee bonus.` : " No Yahtzee bonus.";
      yahtzeeRollRule.textContent = `${resolution.reason}${bonusText}`;

      if (resolution.candidateCategories.length === 0) {
        yahtzeeRollTargetRow.hidden = true;
        yahtzeeRollTarget.innerHTML = "";
        renderYahtzeeRollPreview(resolution);
        return resolution;
      }

      yahtzeeRollTargetRow.hidden = false;
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
      const initialResolution = game.getYahtzeeRollResolution(playerId, 1);
      setFirstYahtzeeModalMode(initialResolution.isFirstYahtzee);
      renderYahtzeeRollResolution();
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
      renderYahtzeeRollResolution();
    });
    yahtzeeRollTarget?.addEventListener("change", () => {
      renderYahtzeeRollPreview(renderYahtzeeRollResolution());
    });

    yahtzeeRollSubmit?.addEventListener("click", async () => {
      try {
        const playerId = selectedYahtzeePlayerId();
        const baseResolution = game.getYahtzeeRollResolution(playerId, 1);
        const faceValue = baseResolution.isFirstYahtzee ? 1 : selectedYahtzeeFaceValue();
        const resolution = renderYahtzeeRollResolution();
        const targetCategory =
          resolution && !resolution.isFirstYahtzee && resolution.candidateCategories.length > 0
            ? yahtzeeRollTarget?.value || resolution.forcedCategory || resolution.candidateCategories[0]
            : null;

        const move = {
          playerId,
          faceValue,
          targetCategory,
          scratch: false,
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
        await renderYahtzeePage(db, deps);
      } catch (error) {
        alert(error.message);
      }
    });

    const completeButton = document.getElementById("complete-session");
    const endGameConfirmModal = document.getElementById("end-game-confirm-modal");
    const endGameConfirmText = document.getElementById("end-game-confirm-text");
    const endGameConfirmHome = document.getElementById("end-game-confirm-home");
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

    endGameConfirmHome?.addEventListener("click", () => {
      window.location.href = routePath("home");
    });

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

  window.ScorekeeperGamesUI = window.ScorekeeperGamesUI || {};
  window.ScorekeeperGamesUI.renderYahtzeePage = renderYahtzeePage;
})();
