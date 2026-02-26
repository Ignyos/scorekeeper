const DEFAULT_STATE = {
  rounds: [],
  activeRoundScoresByPlayer: {},
  isFinal: false,
  rulesVersion: "1",
  updatedAt: new Date().toISOString(),
};

class ScrabbleGame {
  constructor(state) {
    const legacyTotals = state?.totalsByPlayer || {};
    const hasLegacyTotals =
      Object.keys(legacyTotals).length > 0 &&
      Object.values(legacyTotals).some((value) => Number.isInteger(value) && value !== 0);

    let rounds = Array.isArray(state?.rounds)
      ? state.rounds
          .filter((round) => round && typeof round === "object")
          .map((round) => ({ scoresByPlayer: { ...(round.scoresByPlayer || {}) } }))
      : [];

    if (rounds.length === 0 && hasLegacyTotals) {
      rounds = [{ scoresByPlayer: { ...legacyTotals } }];
    }

    this.state = {
      ...DEFAULT_STATE,
      ...(state || {}),
      rounds,
      activeRoundScoresByPlayer: {
        ...((state && state.activeRoundScoresByPlayer) || {}),
      },
      updatedAt: state?.updatedAt || new Date().toISOString(),
    };
  }

  ensurePlayers(playerIds) {
    for (const playerId of playerIds) {
      for (const round of this.state.rounds) {
        const score = round.scoresByPlayer[playerId];
        if (!Number.isInteger(score)) {
          round.scoresByPlayer[playerId] = 0;
        }
      }

      if (!Object.prototype.hasOwnProperty.call(this.state.activeRoundScoresByPlayer, playerId)) {
        this.state.activeRoundScoresByPlayer[playerId] = null;
      }
    }
    this.state.updatedAt = new Date().toISOString();
  }

  validateActiveRoundScoreUpdate(update) {
    if (!update || !update.playerId) {
      throw new Error("Player is required");
    }
    if (update.value !== null && !Number.isInteger(update.value)) {
      throw new Error("Score must be an integer");
    }
  }

  applyActiveRoundScoreUpdate(update) {
    this.validateActiveRoundScoreUpdate(update);
    this.state.activeRoundScoresByPlayer[update.playerId] = update.value;
    this.state.updatedAt = new Date().toISOString();
  }

  validateCompletedRoundScoreUpdate(update) {
    if (!update || !Number.isInteger(update.roundIndex) || update.roundIndex < 0) {
      throw new Error("Round is required");
    }
    if (!update.playerId) {
      throw new Error("Player is required");
    }
    if (!Number.isInteger(update.value)) {
      throw new Error("Score must be an integer");
    }
  }

  updateCompletedRoundScore(update) {
    this.validateCompletedRoundScoreUpdate(update);
    const round = this.state.rounds[update.roundIndex];
    if (!round) {
      throw new Error("Round not found");
    }

    round.scoresByPlayer[update.playerId] = update.value;
    this.state.updatedAt = new Date().toISOString();
  }

  getCompletedRounds() {
    return this.state.rounds.map((round) => ({ scoresByPlayer: { ...(round.scoresByPlayer || {}) } }));
  }

  getActiveRoundScore(playerId) {
    const value = this.state.activeRoundScoresByPlayer[playerId];
    return Number.isInteger(value) ? value : null;
  }

  canAdvanceRound(playerIds) {
    return playerIds.every((playerId) => Number.isInteger(this.state.activeRoundScoresByPlayer[playerId]));
  }

  advanceRound(playerIds) {
    if (!this.canAdvanceRound(playerIds)) {
      throw new Error("Enter valid scores for all players before starting the next round");
    }

    const committedScores = {};
    for (const playerId of playerIds) {
      committedScores[playerId] = this.state.activeRoundScoresByPlayer[playerId];
      this.state.activeRoundScoresByPlayer[playerId] = null;
    }

    this.state.rounds.push({ scoresByPlayer: committedScores });
    this.state.updatedAt = new Date().toISOString();
  }

  getPlayerTotal(playerId, options) {
    const includeActiveRound = options?.includeActiveRound !== false;
    let total = this.state.rounds.reduce((sum, round) => {
      const score = round.scoresByPlayer[playerId];
      return Number.isInteger(score) ? sum + score : sum;
    }, 0);

    if (includeActiveRound) {
      const active = this.state.activeRoundScoresByPlayer[playerId];
      if (Number.isInteger(active)) {
        total += active;
      }
    }

    return total;
  }

  getTotalsByPlayer(playerIds, options) {
    const totals = {};
    for (const playerId of playerIds) {
      totals[playerId] = this.getPlayerTotal(playerId, options);
    }
    return totals;
  }

  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }
}

window.ScorekeeperGames = window.ScorekeeperGames || {};
window.ScorekeeperGames.ScrabbleGame = ScrabbleGame;
