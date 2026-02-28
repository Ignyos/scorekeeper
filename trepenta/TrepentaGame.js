const TREPENTA_ROUND_COUNT = 5;

function createTrepentaRound(playerIds, roundIndex, startingDealerIndex) {
  const scoresByPlayer = {};
  for (const playerId of playerIds) {
    scoresByPlayer[playerId] = null;
  }

  const dealerPlayerId =
    playerIds.length > 0 ? playerIds[(startingDealerIndex + roundIndex) % playerIds.length] : null;

  return {
    roundIndex,
    dealerPlayerId,
    winnerPlayerId: null,
    scoresByPlayer,
  };
}

class TrepentaGame {
  constructor(state) {
    this.state = state || {
      rounds: [],
      startingDealerIndex: 0,
      settings: {
        deckConfig: {
          type: "standard",
          count: 1,
        },
        selectedRuleKeys: [],
      },
      isFinal: false,
      rulesVersion: "1",
      updatedAt: new Date().toISOString(),
    };

    if (!Array.isArray(this.state.rounds)) {
      this.state.rounds = [];
    }

    if (!Number.isInteger(this.state.startingDealerIndex) || this.state.startingDealerIndex < 0) {
      this.state.startingDealerIndex = 0;
    }

    if (!this.state.settings || typeof this.state.settings !== "object") {
      this.state.settings = {
        deckConfig: {
          type: "standard",
          count: 1,
        },
        selectedRuleKeys: [],
      };
    }

    if (!Array.isArray(this.state.settings.selectedRuleKeys)) {
      this.state.settings.selectedRuleKeys = [];
    }
    if (!Array.isArray(this.state.settings.selectedRules)) {
      this.state.settings.selectedRules = [];
    }
  }

  static roundCount() {
    return TREPENTA_ROUND_COUNT;
  }

  ensurePlayers(playerIds) {
    const normalizedPlayerIds = Array.isArray(playerIds) ? [...playerIds] : [];
    if (!normalizedPlayerIds.length) {
      this.state.rounds = [];
      this.state.updatedAt = new Date().toISOString();
      return;
    }

    const playerCount = normalizedPlayerIds.length;
    this.state.startingDealerIndex = this.state.startingDealerIndex % playerCount;

    for (let roundIndex = 0; roundIndex < TREPENTA_ROUND_COUNT; roundIndex += 1) {
      if (!this.state.rounds[roundIndex] || typeof this.state.rounds[roundIndex] !== "object") {
        this.state.rounds[roundIndex] = createTrepentaRound(
          normalizedPlayerIds,
          roundIndex,
          this.state.startingDealerIndex,
        );
      }

      const round = this.state.rounds[roundIndex];
      round.roundIndex = roundIndex;
      round.dealerPlayerId =
        normalizedPlayerIds[(this.state.startingDealerIndex + roundIndex) % normalizedPlayerIds.length];

      round.scoresByPlayer = round.scoresByPlayer || {};
      for (const playerId of normalizedPlayerIds) {
        const value = round.scoresByPlayer[playerId];
        round.scoresByPlayer[playerId] = Number.isInteger(value) ? value : null;
      }

      if (!normalizedPlayerIds.includes(round.winnerPlayerId)) {
        round.winnerPlayerId = null;
      }
    }

    this.state.rounds = this.state.rounds.slice(0, TREPENTA_ROUND_COUNT);
    this.state.updatedAt = new Date().toISOString();
  }

  configureSettings(settingsInput) {
    const input = settingsInput || {};
    const deckConfigInput = input.deckConfig || {};
    const selectedRuleKeysInput = Array.isArray(input.selectedRuleKeys) ? input.selectedRuleKeys : [];

    const type = deckConfigInput.type === "trepenta" ? "trepenta" : "standard";
    const minCount = type === "trepenta" ? 4 : 1;
    const maxCount = type === "trepenta" ? 8 : 3;
    const rawCount = Number.parseInt(String(deckConfigInput.count || ""), 10);
    const count = Number.isInteger(rawCount) ? Math.min(maxCount, Math.max(minCount, rawCount)) : minCount;

    this.state.settings = {
      deckConfig: {
        type,
        count,
      },
      selectedRuleKeys: [...new Set(selectedRuleKeysInput.map((ruleKey) => String(ruleKey || "").trim()).filter(Boolean))],
      selectedRules: Array.isArray(input.selectedRules)
        ? input.selectedRules
            .filter((rule) => rule && typeof rule === "object")
            .map((rule) => ({
              key: String(rule.key || "").trim(),
              name: String(rule.name || "").trim(),
              summary: String(rule.summary || "").trim(),
            }))
            .filter((rule) => rule.key)
        : [],
    };

    this.state.updatedAt = new Date().toISOString();
  }

  validateScoreUpdate(update) {
    if (!update || !Number.isInteger(update.roundIndex) || update.roundIndex < 0) {
      throw new Error("Round is required");
    }
    if (!update.playerId) {
      throw new Error("Player is required");
    }
    if (update.value !== null && !Number.isInteger(update.value)) {
      throw new Error("Score must be an integer");
    }
  }

  applyScoreUpdate(update) {
    this.validateScoreUpdate(update);
    const round = this.state.rounds[update.roundIndex];
    if (!round) {
      throw new Error("Round not found");
    }

    round.scoresByPlayer[update.playerId] = update.value;
    this.state.updatedAt = new Date().toISOString();
  }

  setRoundWinner(roundIndex, playerId) {
    if (!Number.isInteger(roundIndex) || roundIndex < 0) {
      throw new Error("Round is required");
    }
    const round = this.state.rounds[roundIndex];
    if (!round) {
      throw new Error("Round not found");
    }
    if (playerId !== null && !Object.prototype.hasOwnProperty.call(round.scoresByPlayer, playerId)) {
      throw new Error("Player is required");
    }

    round.winnerPlayerId = playerId;
    this.state.updatedAt = new Date().toISOString();
  }

  getRounds() {
    return this.state.rounds.map((round) => ({
      roundIndex: round.roundIndex,
      dealerPlayerId: round.dealerPlayerId,
      winnerPlayerId: round.winnerPlayerId,
      scoresByPlayer: { ...(round.scoresByPlayer || {}) },
    }));
  }

  getTotalsByPlayer(playerIds) {
    const totalsByPlayer = {};
    for (const playerId of playerIds) {
      totalsByPlayer[playerId] = 0;
    }

    for (const round of this.state.rounds) {
      const scoresByPlayer = round.scoresByPlayer || {};
      for (const playerId of playerIds) {
        const value = scoresByPlayer[playerId];
        if (Number.isInteger(value)) {
          totalsByPlayer[playerId] += value;
        }
      }
    }

    return totalsByPlayer;
  }

  hasIncompleteRounds(playerIds) {
    return this.state.rounds.some((round) => {
      const winnerMissing = !round.winnerPlayerId;
      const scoreMissing = playerIds.some((playerId) => !Number.isInteger(round.scoresByPlayer[playerId]));
      return winnerMissing || scoreMissing;
    });
  }

  getSettings() {
    return JSON.parse(JSON.stringify(this.state.settings || {}));
  }

  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }
}

window.ScorekeeperGames = window.ScorekeeperGames || {};
window.ScorekeeperGames.TrepentaGame = TrepentaGame;
