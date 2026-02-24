const CATEGORIES = [
  "aces",
  "twos",
  "threes",
  "fours",
  "fives",
  "sixes",
  "threeOfAKind",
  "fourOfAKind",
  "fullHouse",
  "smallStraight",
  "largeStraight",
  "yahtzee",
  "chance",
];

const UPPER_CATEGORIES = ["aces", "twos", "threes", "fours", "fives", "sixes"];
const LOWER_CATEGORIES = [
  "threeOfAKind",
  "fourOfAKind",
  "fullHouse",
  "smallStraight",
  "largeStraight",
  "yahtzee",
  "chance",
];

const UPPER_BONUS_THRESHOLD = 63;
const UPPER_BONUS_SCORE = 35;
const YAHTZEE_BONUS_SCORE = 100;
const YAHTZEE_DISPLAY_INCREMENT = 50;

const FACE_TO_UPPER_CATEGORY = {
  1: "aces",
  2: "twos",
  3: "threes",
  4: "fours",
  5: "fives",
  6: "sixes",
};

const JOKER_FIXED_VALUES = {
  fullHouse: 25,
  smallStraight: 30,
  largeStraight: 40,
};

const FIXED_CATEGORY_VALUES = {
  yahtzee: 50,
  ...JOKER_FIXED_VALUES,
};

function createBlankCard() {
  const card = {};
  for (const category of CATEGORIES) {
    card[category] = null;
  }
  return card;
}

class YahtzeeGame {
  constructor(state) {
    this.state = state || {
      totalsByPlayer: {},
      leaderboard: [],
      currentValuesByPlayer: {},
      yahtzeeBonusByPlayer: {},
      yahtzeeCountByPlayer: {},
      isFinal: false,
      rulesVersion: "1",
      updatedAt: new Date().toISOString(),
    };

    this.state.yahtzeeBonusByPlayer = this.state.yahtzeeBonusByPlayer || {};
    this.state.yahtzeeCountByPlayer = this.state.yahtzeeCountByPlayer || {};
  }

  static categories() {
    return [...CATEGORIES];
  }

  static upperCategories() {
    return [...UPPER_CATEGORIES];
  }

  static lowerCategories() {
    return [...LOWER_CATEGORIES];
  }

  ensurePlayers(playerIds) {
    for (const playerId of playerIds) {
      if (!this.state.currentValuesByPlayer[playerId]) {
        this.state.currentValuesByPlayer[playerId] = createBlankCard();
      }
      if (!Number.isInteger(this.state.yahtzeeBonusByPlayer[playerId])) {
        this.state.yahtzeeBonusByPlayer[playerId] = 0;
      }

      if (!Number.isInteger(this.state.yahtzeeCountByPlayer[playerId])) {
        const yahtzeeValue = this.state.currentValuesByPlayer[playerId].yahtzee;
        const baseCount = yahtzeeValue === 50 ? 1 : 0;
        const bonusCount = Math.floor(this.state.yahtzeeBonusByPlayer[playerId] / YAHTZEE_BONUS_SCORE);
        this.state.yahtzeeCountByPlayer[playerId] = baseCount + bonusCount;
      }

      this.state.totalsByPlayer[playerId] = this.calculateGrandTotal(playerId);
    }
    this.computeLeaderboard();
  }

  validateScoreUpdate(update) {
    if (!update.playerId) {
      throw new Error("Player is required");
    }
    if (!CATEGORIES.includes(update.category)) {
      throw new Error("Invalid category");
    }
    if (update.value !== null && !Number.isInteger(update.value)) {
      throw new Error("Score value must be an integer");
    }

    if (
      Object.prototype.hasOwnProperty.call(FIXED_CATEGORY_VALUES, update.category) &&
      update.value !== null &&
      update.value !== 0 &&
      update.value !== FIXED_CATEGORY_VALUES[update.category]
    ) {
      throw new Error("Invalid value for fixed-score category");
    }

    if (update.category === "yahtzee" && this.getYahtzeeBonusPoints(update.playerId) > 0 && update.value !== 50) {
      throw new Error("Yahtzee box cannot be changed after Yahtzee bonus points are awarded");
    }
  }

  applyScoreUpdate(update) {
    this.validateScoreUpdate(update);
    if (!this.state.currentValuesByPlayer[update.playerId]) {
      this.state.currentValuesByPlayer[update.playerId] = createBlankCard();
    }

    this.state.currentValuesByPlayer[update.playerId][update.category] = update.value;
    this.state.totalsByPlayer[update.playerId] = this.calculateGrandTotal(update.playerId);
    this.computeLeaderboard();
    this.state.updatedAt = new Date().toISOString();
  }

  sumCategories(playerId, categories) {
    const values = this.state.currentValuesByPlayer[playerId] || {};
    return categories.reduce((sum, category) => {
      const value = values[category];
      return Number.isInteger(value) ? sum + value : sum;
    }, 0);
  }

  calculateUpperSubtotal(playerId) {
    return this.sumCategories(playerId, UPPER_CATEGORIES);
  }

  calculateUpperBonus(playerId) {
    return this.calculateUpperSubtotal(playerId) >= UPPER_BONUS_THRESHOLD ? UPPER_BONUS_SCORE : 0;
  }

  calculateUpperTotal(playerId) {
    return this.calculateUpperSubtotal(playerId) + this.calculateUpperBonus(playerId);
  }

  calculateLowerTotal(playerId) {
    return this.sumCategories(playerId, LOWER_CATEGORIES);
  }

  getYahtzeeBonusPoints(playerId) {
    return this.state.yahtzeeBonusByPlayer[playerId] || 0;
  }

  getYahtzeeCount(playerId) {
    return this.state.yahtzeeCountByPlayer[playerId] || 0;
  }

  getYahtzeeDisplayValue(playerId) {
    return this.getYahtzeeCount(playerId) * YAHTZEE_DISPLAY_INCREMENT;
  }

  calculateGrandTotal(playerId) {
    return this.calculateUpperTotal(playerId) + this.calculateLowerTotal(playerId) + this.getYahtzeeBonusPoints(playerId);
  }

  calculatePlayerTotal(playerId) {
    return this.calculateGrandTotal(playerId);
  }

  getPlayerBreakdown(playerId) {
    const upperSubtotal = this.calculateUpperSubtotal(playerId);
    const upperBonus = this.calculateUpperBonus(playerId);
    const upperTotal = upperSubtotal + upperBonus;
    const lowerTotal = this.calculateLowerTotal(playerId);
    const yahtzeeBonus = this.getYahtzeeBonusPoints(playerId);
    return {
      upperSubtotal,
      upperBonus,
      upperTotal,
      lowerTotal,
      yahtzeeBonus,
      yahtzeeCount: this.getYahtzeeCount(playerId),
      yahtzeeDisplayValue: this.getYahtzeeDisplayValue(playerId),
      grandTotal: upperTotal + lowerTotal + yahtzeeBonus,
    };
  }

  getYahtzeeRollResolution(playerId, faceValue) {
    if (!playerId) {
      throw new Error("Player is required");
    }
    if (!Number.isInteger(faceValue) || faceValue < 1 || faceValue > 6) {
      throw new Error("Yahtzee face value must be from 1 to 6");
    }

    const values = this.state.currentValuesByPlayer[playerId] || createBlankCard();
    const yahtzeeBoxValue = values.yahtzee;
    const matchingUpperCategory = FACE_TO_UPPER_CATEGORY[faceValue];

    if (yahtzeeBoxValue === null) {
      return {
        faceValue,
        isFirstYahtzee: true,
        grantsBonus: false,
        bonusPoints: 0,
        matchingUpperCategory,
        forcedCategory: null,
        candidateCategories: [],
        reason: "First Yahtzee scores 50 in Yahtzee box.",
      };
    }

    if (yahtzeeBoxValue !== 50 && yahtzeeBoxValue !== 0) {
      throw new Error("Yahtzee box must be 50 or 0 before applying Joker rules");
    }

    if (values[matchingUpperCategory] === null) {
      return {
        faceValue,
        isFirstYahtzee: false,
        grantsBonus: yahtzeeBoxValue === 50,
        bonusPoints: yahtzeeBoxValue === 50 ? YAHTZEE_BONUS_SCORE : 0,
        matchingUpperCategory,
        forcedCategory: matchingUpperCategory,
        candidateCategories: [matchingUpperCategory],
        reason: "Matching upper box is empty and must be used.",
      };
    }

    const openLowerCategories = LOWER_CATEGORIES.filter((category) => category !== "yahtzee").filter(
      (category) => values[category] === null,
    );

    if (openLowerCategories.length > 0) {
      return {
        faceValue,
        isFirstYahtzee: false,
        grantsBonus: yahtzeeBoxValue === 50,
        bonusPoints: yahtzeeBoxValue === 50 ? YAHTZEE_BONUS_SCORE : 0,
        matchingUpperCategory,
        forcedCategory: null,
        candidateCategories: openLowerCategories,
        reason: "Matching upper box is filled; choose any open lower box.",
      };
    }

    const openUpperCategories = UPPER_CATEGORIES.filter((category) => values[category] === null);

    return {
      faceValue,
      isFirstYahtzee: false,
      grantsBonus: yahtzeeBoxValue === 50,
      bonusPoints: yahtzeeBoxValue === 50 ? YAHTZEE_BONUS_SCORE : 0,
      matchingUpperCategory,
      forcedCategory: null,
      candidateCategories: openUpperCategories,
      reason:
        openUpperCategories.length > 0
          ? "Lower section is full; choose any open upper box."
          : "No open categories remain.",
    };
  }

  getJokerScoreValue(faceValue, category, scratch) {
    if (scratch) {
      return 0;
    }
    if (UPPER_CATEGORIES.includes(category)) {
      return faceValue * 5;
    }
    if (category === "threeOfAKind" || category === "fourOfAKind" || category === "chance") {
      return faceValue * 5;
    }
    if (Object.prototype.hasOwnProperty.call(JOKER_FIXED_VALUES, category)) {
      return JOKER_FIXED_VALUES[category];
    }
    throw new Error("Invalid Joker target category");
  }

  applyYahtzeeRoll(move) {
    const { playerId, faceValue, targetCategory, scratch } = move;
    const resolution = this.getYahtzeeRollResolution(playerId, faceValue);

    if (resolution.isFirstYahtzee) {
      this.state.yahtzeeCountByPlayer[playerId] = (this.state.yahtzeeCountByPlayer[playerId] || 0) + 1;
      this.applyScoreUpdate({
        playerId,
        category: "yahtzee",
        value: 50,
      });
      return {
        yahtzeeScore: 50,
        bonusPoints: 0,
        targetCategory: null,
        targetValue: null,
      };
    }

    this.state.yahtzeeCountByPlayer[playerId] = (this.state.yahtzeeCountByPlayer[playerId] || 0) + 1;

    if (resolution.grantsBonus) {
      this.state.yahtzeeBonusByPlayer[playerId] = (this.state.yahtzeeBonusByPlayer[playerId] || 0) + YAHTZEE_BONUS_SCORE;
    }

    if (resolution.candidateCategories.length === 0) {
      this.state.totalsByPlayer[playerId] = this.calculateGrandTotal(playerId);
      this.computeLeaderboard();
      this.state.updatedAt = new Date().toISOString();
      return {
        yahtzeeScore: this.state.currentValuesByPlayer[playerId]?.yahtzee,
        bonusPoints: resolution.bonusPoints,
        targetCategory: null,
        targetValue: null,
      };
    }

    if (!targetCategory || !resolution.candidateCategories.includes(targetCategory)) {
      throw new Error("Choose a valid category for Joker scoring");
    }

    const targetValue = this.getJokerScoreValue(faceValue, targetCategory, Boolean(scratch));
    this.applyScoreUpdate({
      playerId,
      category: targetCategory,
      value: targetValue,
    });

    this.state.totalsByPlayer[playerId] = this.calculateGrandTotal(playerId);
    this.computeLeaderboard();
    this.state.updatedAt = new Date().toISOString();

    return {
      yahtzeeScore: this.state.currentValuesByPlayer[playerId]?.yahtzee,
      bonusPoints: resolution.bonusPoints,
      targetCategory,
      targetValue,
    };
  }

  computeLeaderboard() {
    this.state.leaderboard = Object.keys(this.state.totalsByPlayer)
      .map((playerId) => ({
        playerId,
        total: this.state.totalsByPlayer[playerId] || 0,
      }))
      .sort((left, right) => right.total - left.total)
      .map((row, index) => ({
        rank: index + 1,
        ...row,
      }));
  }

  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }
}

window.ScorekeeperGames = window.ScorekeeperGames || {};
window.ScorekeeperGames.YahtzeeGame = YahtzeeGame;
