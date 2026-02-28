const THREE_TO_THIRTEEN_ROUND_COUNT = 11;
const THREE_TO_THIRTEEN_FIRST_CARD_VALUE = 3;

function createThreeToThirteenRound(playerIds, roundIndex, startingDealerIndex) {
  const scoresByPlayer = {};
  for (const playerId of playerIds) {
    scoresByPlayer[playerId] = null;
  }

  const dealerPlayerId =
    playerIds.length > 0 ? playerIds[(startingDealerIndex + roundIndex) % playerIds.length] : null;

  return {
    roundIndex,
    cardValue: THREE_TO_THIRTEEN_FIRST_CARD_VALUE + roundIndex,
    dealerPlayerId,
    winnerPlayerId: null,
    scoresByPlayer,
  };
}

class ThreeToThirteenGame {
  constructor(state) {
    this.state = state || {
      rounds: [],
      startingDealerIndex: 0,
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
  }

  static roundCount() {
    return THREE_TO_THIRTEEN_ROUND_COUNT;
  }

  static roundCardValue(roundIndex) {
    return THREE_TO_THIRTEEN_FIRST_CARD_VALUE + roundIndex;
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

    for (let roundIndex = 0; roundIndex < THREE_TO_THIRTEEN_ROUND_COUNT; roundIndex += 1) {
      if (!this.state.rounds[roundIndex] || typeof this.state.rounds[roundIndex] !== "object") {
        this.state.rounds[roundIndex] = createThreeToThirteenRound(
          normalizedPlayerIds,
          roundIndex,
          this.state.startingDealerIndex,
        );
      }

      const round = this.state.rounds[roundIndex];
      round.roundIndex = roundIndex;
      round.cardValue = THREE_TO_THIRTEEN_FIRST_CARD_VALUE + roundIndex;
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

    this.state.rounds = this.state.rounds.slice(0, THREE_TO_THIRTEEN_ROUND_COUNT);
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
      cardValue: round.cardValue,
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

  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }
}

window.ScorekeeperGames = window.ScorekeeperGames || {};
window.ScorekeeperGames.ThreeToThirteenGame = ThreeToThirteenGame;
