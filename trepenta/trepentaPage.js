(function () {
  "use strict";

  const TREPENTA_HOUSE_RULES = [
    {
      key: "players-choice-peek",
      name: "Player's Choice (peek)",
      brief: "Look at both five-card piles before choosing hand vs field.",
      officialUrl: "https://trepenta.ignyos.com/#rule-players-choice-peek",
    },
    {
      key: "players-choice-sort",
      name: "Player's Choice (sort)",
      brief: "Sort cards before deciding which pile becomes your hand.",
      officialUrl: "https://trepenta.ignyos.com/#rule-players-choice-sort",
    },
    {
      key: "field-unlimited",
      name: "Field Unlimited",
      brief: "Allow unlimited field/hand exchanges during a turn.",
      officialUrl: "https://trepenta.ignyos.com/#rule-field-unlimited",
    },
    {
      key: "open-field",
      name: "Open Field",
      brief: "Allow exchanges using face-up cards in any player's field.",
      officialUrl: "https://trepenta.ignyos.com/#rule-open-field",
    },
    {
      key: "long-play",
      name: "Long Play",
      brief: "Do not end the round when the draw pile empties.",
      officialUrl: "https://trepenta.ignyos.com/#rule-long-play",
    },
    {
      key: "finish-line",
      name: "Finish Line",
      brief: "Grant a bonus when a player fully reveals their field.",
      officialUrl: "https://trepenta.ignyos.com/#rule-finish-line",
    },
    {
      key: "rival-sets",
      name: "Rival Sets",
      brief: "Allow end-of-round play onto other players' combinations.",
      officialUrl: "https://trepenta.ignyos.com/#rule-rival-sets",
    },
  ];

  function buildPlayerMap(players) {
    const map = {};
    for (const player of players) {
      map[player.id] = player;
    }
    return map;
  }

  function computeDefaultStandardDeckCount(playerCount) {
    if (!Number.isInteger(playerCount) || playerCount <= 2) {
      return 1;
    }
    return Math.max(1, Math.min(3, Math.floor(playerCount / 2)));
  }

  function computeDefaultTrepentaSuitCount(playerCount) {
    if (!Number.isInteger(playerCount) || playerCount < 2) {
      return 4;
    }
    return Math.max(4, Math.min(8, 4 + playerCount - 2));
  }

  function clampDeckValue(value, min, max, fallback) {
    const parsed = Number.parseInt(String(value || ""), 10);
    if (!Number.isInteger(parsed)) {
      return fallback;
    }
    return Math.min(max, Math.max(min, parsed));
  }

  async function renderTrepentaPage(db, deps) {
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
      renderShell("", startGameModalHtml("Trepenta", players));

      const modal = document.getElementById("start-game-modal");
      const cancelButton = document.getElementById("start-game-cancel");
      const submitButton = document.getElementById("start-game-submit");
      const addPlayerButton = document.getElementById("start-game-add-player");
      const addPlayerInput = document.getElementById("start-game-new-player");
      const playerSelect = document.getElementById("start-game-player-select");
      const selectedList = document.getElementById("start-game-selected-list");
      const actionsRow = modal?.querySelector(".start-game-actions");

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

      function selectedRuleKeysFromUi() {
        return Array.from(document.querySelectorAll(".trepenta-house-rule-toggle:checked"))
          .map((input) => String(input.value || "").trim())
          .filter(Boolean);
      }

      function selectedRulesFromUi() {
        const selectedKeys = selectedRuleKeysFromUi();
        return selectedKeys
          .map((key) => TREPENTA_HOUSE_RULES.find((rule) => rule.key === key))
          .filter(Boolean)
          .map((rule) => ({
            key: rule.key,
            name: rule.name,
            summary: rule.brief,
            officialUrl: rule.officialUrl,
          }));
      }

      function syncDeckOptionState() {
        const selectedType =
          document.querySelector('input[name="trepenta-deck-type"]:checked')?.value === "trepenta"
            ? "trepenta"
            : "standard";
        const standardInput = document.getElementById("trepenta-standard-deck-count");
        const suitsInput = document.getElementById("trepenta-suit-count");
        if (standardInput) {
          standardInput.disabled = selectedType !== "standard";
        }
        if (suitsInput) {
          suitsInput.disabled = selectedType !== "trepenta";
        }
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

        syncDeckOptionState();
      }

      function renderTrepentaSetupOptions() {
        if (!modal || !actionsRow) {
          return;
        }

        const houseRuleRows = TREPENTA_HOUSE_RULES
          .map((rule) => {
            const panelId = `trepenta-house-rule-panel-${rule.key}`;
            return `
              <div class="trepenta-house-rule-item">
                <div class="trepenta-house-rule-head">
                  <input
                    class="trepenta-house-rule-toggle"
                    id="trepenta-house-rule-toggle-${rule.key}"
                    type="checkbox"
                    value="${rule.key}"
                  />
                  <label class="trepenta-house-rule-select" for="trepenta-house-rule-toggle-${rule.key}">
                    <strong class="trepenta-house-rule-name">${escapeHtml(rule.name)}</strong>
                  </label>
                  <button
                    type="button"
                    class="trepenta-house-rule-expander"
                    data-rule-expand="${rule.key}"
                    aria-expanded="false"
                    aria-controls="${panelId}"
                    aria-label="Expand details for ${escapeHtml(rule.name)}"
                  >▾</button>
                </div>
                <div class="trepenta-house-rule-panel" id="${panelId}" hidden>
                  <p class="muted">${escapeHtml(rule.brief)}</p>
                  <a href="${escapeHtml(rule.officialUrl)}" target="_blank" rel="noopener noreferrer">Official rule page</a>
                </div>
              </div>
            `;
          })
          .join("");

        const setupHtml = `
          <div class="start-game-section">
            <h2>Deck Configuration</h2>
            <div class="trepenta-deck-options">
              <label class="trepenta-deck-option">
                <input
                  type="radio"
                  name="trepenta-deck-type"
                  value="standard"
                  checked
                />
                <span class="trepenta-deck-option-content">
                  <span class="trepenta-deck-option-title">Standard Deck(s)</span>
                  <input
                    id="trepenta-standard-deck-count"
                    type="number"
                    min="1"
                    max="3"
                    value="${computeDefaultStandardDeckCount(selectedPlayerIds.length)}"
                  />
                </span>
              </label>
              <label class="trepenta-deck-option">
                <input
                  type="radio"
                  name="trepenta-deck-type"
                  value="trepenta"
                />
                <span class="trepenta-deck-option-content">
                  <span class="trepenta-deck-option-title">Trepenta Deck - # of suits</span>
                  <input
                    id="trepenta-suit-count"
                    type="number"
                    min="4"
                    max="8"
                    value="${computeDefaultTrepentaSuitCount(selectedPlayerIds.length)}"
                  />
                </span>
              </label>
            </div>
          </div>
          <div class="start-game-section">
            <div class="trepenta-section-heading">
              <button
                type="button"
                id="trepenta-house-rules-section-toggle"
                class="trepenta-section-expander"
                aria-expanded="false"
                aria-controls="trepenta-house-rules-section"
                aria-label="Expand house rules"
              >▾</button>
              <h2>House Rules <span class="muted">(optional)</span></h2>
            </div>
            <div id="trepenta-house-rules-section" class="trepenta-house-rules-list" hidden>
              ${houseRuleRows}
            </div>
          </div>
        `;

        actionsRow.insertAdjacentHTML("beforebegin", setupHtml);
        document.querySelectorAll('input[name="trepenta-deck-type"]').forEach((input) => {
          input.addEventListener("change", syncDeckOptionState);
        });

        const houseRulesSectionToggle = document.getElementById("trepenta-house-rules-section-toggle");
        const houseRulesSection = document.getElementById("trepenta-house-rules-section");
        houseRulesSectionToggle?.addEventListener("click", () => {
          const expanded = houseRulesSectionToggle.getAttribute("aria-expanded") === "true";
          houseRulesSectionToggle.setAttribute("aria-expanded", expanded ? "false" : "true");
          if (houseRulesSection) {
            houseRulesSection.hidden = expanded;
          }
        });

        document.querySelectorAll(".trepenta-house-rule-expander").forEach((button) => {
          button.addEventListener("click", () => {
            const expanded = button.getAttribute("aria-expanded") === "true";
            const panelId = button.getAttribute("aria-controls");
            const panel = panelId ? document.getElementById(panelId) : null;
            button.setAttribute("aria-expanded", expanded ? "false" : "true");
            if (panel) {
              panel.hidden = expanded;
            }
          });
        });

        syncDeckOptionState();
      }

      renderTrepentaSetupOptions();

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

          const selectedDeckType =
            document.querySelector('input[name="trepenta-deck-type"]:checked')?.value === "trepenta"
              ? "trepenta"
              : "standard";
          const standardDeckInput = document.getElementById("trepenta-standard-deck-count");
          const suitCountInput = document.getElementById("trepenta-suit-count");
          const defaultDeckCount = computeDefaultStandardDeckCount(selected.length);
          const defaultSuitCount = computeDefaultTrepentaSuitCount(selected.length);
          const deckCount = selectedDeckType === "trepenta"
            ? clampDeckValue(suitCountInput?.value, 4, 8, defaultSuitCount)
            : clampDeckValue(standardDeckInput?.value, 1, 3, defaultDeckCount);
          const selectedRuleKeys = selectedRuleKeysFromUi();
          const selectedRules = selectedRulesFromUi();

          const GameClass = await loadGameClassBySlug("trepenta");
          const game = new GameClass(null);
          game.ensurePlayers(selected);
          game.configureSettings({
            deckConfig: {
              type: selectedDeckType,
              count: deckCount,
            },
            selectedRuleKeys,
            selectedRules,
          });

          const session = await createSession(db, {
            game: "trepenta",
            gameClass: "TrepentaGame",
            gameVersion: "1",
            playerIds: selected,
            gameState: game.getState(),
          });

          window.location.href = withSessionId(routePath("trepenta"), session.id);
        } catch (error) {
          alert(error.message);
        }
      });
      return;
    }

    const session = await getSession(db, sessionId);
    if (!session) {
      renderShell(
        "Trepenta",
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

    const GameClass = await loadGameClassBySlug("trepenta");
    const game = new GameClass(session.gameState);
    game.ensurePlayers(session.playerIds);

    const completedGameWindowText =
      session.status === "completed" ? formatCompletedGameWindow(session.startTime, session.endTime) : "";
    const rulesAction = rulesTriggerHtml("trepenta", { context: "game", sessionId: session.id });

    const settings = game.getSettings();
    const deckConfig = settings?.deckConfig || { type: "standard", count: 1 };
    const selectedRuleKeys = Array.isArray(settings?.selectedRuleKeys) ? settings.selectedRuleKeys : [];
    const selectedRules = Array.isArray(settings?.selectedRules)
      ? settings.selectedRules
          .filter((rule) => rule && typeof rule === "object")
          .map((rule) => ({
            key: String(rule.key || "").trim(),
            name: String(rule.name || "").trim(),
            summary: String(rule.summary || "").trim(),
            officialUrl: String(rule.officialUrl || "").trim(),
          }))
          .filter((rule) => rule.key)
      : [];
    const houseRulesByKey = TREPENTA_HOUSE_RULES.reduce((accumulator, rule) => {
      accumulator[rule.key] = rule;
      return accumulator;
    }, {});

    const selectedRuleDefinitions = selectedRules.length
      ? selectedRules
          .map((rule) => ({
            ...rule,
            officialUrl: rule.officialUrl || houseRulesByKey[rule.key]?.officialUrl || "https://trepenta.ignyos.com/",
          }))
      : selectedRuleKeys
          .map((ruleKey) => {
            const fallback = houseRulesByKey[ruleKey];
            return {
              key: ruleKey,
              name: fallback?.name || ruleKey,
              summary: fallback?.brief || "",
              officialUrl: fallback?.officialUrl || "https://trepenta.ignyos.com/",
            };
          })
          .filter((rule) => rule.key);

    const normalizedDeckType = deckConfig?.type === "trepenta" ? "trepenta" : "standard";
    const normalizedDeckCount = Number.isInteger(deckConfig?.count) && deckConfig.count > 0 ? deckConfig.count : 1;
    const deckText =
      normalizedDeckType === "trepenta"
        ? `Trepenta deck (${normalizedDeckCount} suit${normalizedDeckCount === 1 ? "" : "s"})`
        : `${normalizedDeckCount} standard deck${normalizedDeckCount === 1 ? "" : "s"}`;

    renderShell(
      "Trepenta",
      `
        ${
          completedGameWindowText
            ? `<section class="card"><p class="muted">${escapeHtml(completedGameWindowText)}</p></section>`
            : ""
        }

        <section class="card trepenta-settings-card">
          <p><strong>Deck:</strong> ${escapeHtml(deckText)}</p>
          <div class="trepenta-rules-block">
            <strong>House Rules:</strong>
            ${
              selectedRuleDefinitions.length
                ? `<div class="trepenta-rules-badges">${selectedRuleDefinitions
                    .map((rule) => {
                      const detailsButton = `<button
                        type="button"
                        class="rules-trigger"
                        data-trepenta-rule-link="${escapeHtml(rule.officialUrl || "https://trepenta.ignyos.com/")}" 
                      >Details</button>`;
                      return `
                        <div class="trepenta-rule-pill">
                          <span class="trepenta-rule-name">${escapeHtml(rule.name || rule.key)}</span>
                          ${detailsButton}
                        </div>
                      `;
                    })
                    .join("")}</div>`
                : `<span class="muted">None</span>`
            }
          </div>
        </section>

        <section class="card">
          <div class="yahtzee-sheet-wrap">
            <table class="trepenta-sheet">
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
              <tbody id="trepenta-scoreboard-body"></tbody>
            </table>
          </div>
          <div class="row game-actions-row">
            ${rulesAction}
            <button type="button" id="trepenta-end-game" ${session.status !== "active" ? "disabled" : ""}>End Game</button>
          </div>
        </section>

        <div class="modal-backdrop" id="trepenta-end-confirm-modal" hidden>
          <div class="modal" role="dialog" aria-modal="true" aria-labelledby="trepenta-end-confirm-title">
            <h2 id="trepenta-end-confirm-title">End Trepenta Game</h2>
            <p id="trepenta-end-confirm-text"></p>
            <div class="row start-game-actions trepenta-end-confirm-actions">
              <button type="button" id="trepenta-end-confirm-home">Home</button>
              <button type="button" id="trepenta-end-confirm-submit">End Game</button>
              <button type="button" id="trepenta-end-confirm-cancel">Cancel</button>
            </div>
          </div>
        </div>

        <div class="modal-backdrop" id="trepenta-end-results-modal" hidden>
          <div class="modal" role="dialog" aria-modal="true" aria-labelledby="trepenta-end-results-title">
            <h2 id="trepenta-end-results-title">Final Results (Lowest Wins)</h2>
            <ul id="trepenta-end-results-list" class="end-game-results"></ul>
            <div class="row start-game-actions">
              <button type="button" id="trepenta-end-results-close">Close</button>
            </div>
          </div>
        </div>
      `,
    );

    const scoreboardBody = document.getElementById("trepenta-scoreboard-body");
    const endGameButton = document.getElementById("trepenta-end-game");

    const endConfirmModal = document.getElementById("trepenta-end-confirm-modal");
    const endConfirmText = document.getElementById("trepenta-end-confirm-text");
    const endConfirmHome = document.getElementById("trepenta-end-confirm-home");
    const endConfirmSubmit = document.getElementById("trepenta-end-confirm-submit");
    const endConfirmCancel = document.getElementById("trepenta-end-confirm-cancel");

    const endResultsModal = document.getElementById("trepenta-end-results-modal");
    const endResultsList = document.getElementById("trepenta-end-results-list");
    const endResultsClose = document.getElementById("trepenta-end-results-close");

    document.querySelectorAll("[data-trepenta-rule-link]").forEach((button) => {
      button.addEventListener("click", () => {
        const url = button.getAttribute("data-trepenta-rule-link");
        if (!url) {
          return;
        }
        window.open(url, "_blank", "noopener,noreferrer");
      });
    });

    function parseInputInteger(value) {
      if (!value || !String(value).trim()) {
        return null;
      }
      const parsed = Number.parseInt(String(value), 10);
      return Number.isInteger(parsed) ? parsed : null;
    }

    function roundScoreInputSelector(roundIndex, playerId) {
      return `.trepenta-score-input[data-round-index="${roundIndex}"][data-player-id="${playerId}"]`;
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
                    <div class="trepenta-player-cell">
                      <div class="trepenta-score-readonly">${Number.isInteger(score) ? String(score) : ""}</div>
                      <label class="trepenta-winner-toggle">
                        <span>Win</span>
                        <input type="radio" disabled ${checked ? "checked" : ""} />
                      </label>
                    </div>
                  </td>
                `;
              }

              return `
                <td>
                  <div class="trepenta-player-cell">
                    <input
                      class="trepenta-score-input"
                      type="number"
                      step="1"
                      value="${Number.isInteger(score) ? String(score) : ""}"
                      data-round-index="${roundIndex}"
                      data-player-id="${playerId}"
                      aria-label="Round ${roundIndex + 1} score for ${escapeHtml(playerName)}"
                    />
                    <label class="trepenta-winner-toggle">
                      <span>Win</span>
                      <input
                        class="trepenta-winner-radio"
                        type="radio"
                        name="trepenta-round-winner-${roundIndex}"
                        data-round-index="${roundIndex}"
                        data-player-id="${playerId}"
                        ${checked ? "checked" : ""}
                        aria-label="Mark ${escapeHtml(playerName)} as winner for round ${roundIndex + 1}"
                      />
                    </label>
                  </div>
                </td>
              `;
            })
            .join("");

          return `
            <tr>
              <th scope="row">${roundIndex + 1}</th>
              <td class="trepenta-dealer-cell">${escapeHtml(dealerName)}</td>
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

      scoreboardBody.querySelectorAll(".trepenta-score-input").forEach((input) => {
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

      scoreboardBody.querySelectorAll(".trepenta-winner-radio").forEach((radio) => {
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
  window.ScorekeeperGamesUI.renderTrepentaPage = renderTrepentaPage;
})();
