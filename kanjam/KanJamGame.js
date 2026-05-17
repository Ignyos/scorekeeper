const KAN_JAM_TARGET = 21;

const KAN_JAM_DEFAULT_STATE = {
  teams: [],
  currentTeamIndex: 0,
  turns: [],
  winner: null,
  winType: null,
  lastChance: null,
  overtime: false,
  rulesVersion: "1",
  updatedAt: new Date().toISOString(),
};

class KanJamGame {
  constructor(state) {
    const safeTeams = Array.isArray(state?.teams)
      ? state.teams.map((t) => ({
          name: String(t.name || ""),
          playerIds: Array.isArray(t.playerIds) ? [...t.playerIds] : [],
          score: Number.isInteger(t.score) ? t.score : 0,
        }))
      : [];

    const safeTurns = Array.isArray(state?.turns) ? [...state.turns] : [];

    this.state = {
      ...KAN_JAM_DEFAULT_STATE,
      ...(state || {}),
      teams: safeTeams,
      turns: safeTurns,
      updatedAt: state?.updatedAt || new Date().toISOString(),
    };
  }

  // teamDefs: [{ name, playerIds: [id0, id1] }, { name, playerIds: [id2, id3] }]
  initTeams(teamDefs) {
    this.state.teams = teamDefs.map((def) => ({
      name: String(def.name || ""),
      playerIds: Array.isArray(def.playerIds) ? [...def.playerIds] : [],
      score: 0,
    }));
    this.state.currentTeamIndex = 0;
    this.state.turns = [];
    this.state.winner = null;
    this.state.winType = null;
    this.state.updatedAt = new Date().toISOString();
  }

  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  getTeams() {
    return this.state.teams.map((t) => ({ ...t, playerIds: [...t.playerIds] }));
  }

  getCurrentTeamIndex() {
    return this.state.currentTeamIndex;
  }

  isComplete() {
    return this.state.winner !== null;
  }

  getWinner() {
    return this.state.winner;
  }

  getWinType() {
    return this.state.winType;
  }

  // Returns { bustApplied, bustedFrom, bustedTo, winType }
  applyScore(type) {
    if (this.isComplete()) {
      throw new Error("Game is already complete.");
    }

    const teamIndex = this.state.currentTeamIndex;
    const team = this.state.teams[teamIndex];
    const scoreBefore = team.score;

    let points = 0;
    let isInstantWin = false;
    let winType = null;

    switch (type) {
      case "dinger":
        points = 1;
        break;
      case "deuce":
        points = 2;
        break;
      case "dunk":
        points = 3;
        break;
      case "donedeal":
        isInstantWin = true;
        winType = "instant";
        break;
      case "interference":
        if (scoreBefore === 19 || scoreBefore === 20) {
          isInstantWin = true;
          winType = "interference";
        } else {
          points = 3;
        }
        break;
      case "miss":
        points = 0;
        break;
      default:
        throw new Error(`Unknown score type: ${type}`);
    }

    let scoreAfter = scoreBefore;
    let bustApplied = false;
    let bustedFrom = null;
    let bustedTo = null;

    if (!isInstantWin) {
      const potential = scoreBefore + points;
      if (!this.state.overtime && potential > KAN_JAM_TARGET && points > 0) {
        scoreAfter = scoreBefore - points;
        bustApplied = true;
        bustedFrom = potential;
        bustedTo = scoreAfter;
      } else {
        scoreAfter = potential;
      }
      team.score = scoreAfter;
    }

    const lastChanceBefore = this.state.lastChance ? { ...this.state.lastChance } : null;
    const isLastChanceTurn = !!this.state.lastChance;
    const overtimeBefore = this.state.overtime;

    this.state.turns.push({
      teamIndex,
      type,
      points,
      scoreBefore,
      scoreAfter: isInstantWin ? scoreBefore : scoreAfter,
      bustApplied,
      winType: winType || null,
      lastChanceBefore,
      overtimeBefore,
      timestamp: new Date().toISOString(),
    });

    if (isInstantWin) {
      this.state.winner = teamIndex;
      this.state.winType = winType;
      this.state.lastChance = null;
    } else if (this.state.overtime) {
      if (points > 0) {
        this.state.winner = teamIndex;
        this.state.winType = "overtime";
      } else {
        this.state.currentTeamIndex = 1 - teamIndex;
      }
    } else if (isLastChanceTurn) {
      if (scoreAfter === KAN_JAM_TARGET) {
        // Both teams tied at 21 — enter overtime, game continues
        this.state.lastChance = null;
        this.state.overtime = true;
        this.state.currentTeamIndex = lastChanceBefore.triggeringTeam;
      } else {
        this.state.winner = this.state.lastChance.triggeringTeam;
        this.state.winType = "exact";
        this.state.lastChance = null;
      }
    } else if (scoreAfter === KAN_JAM_TARGET) {
      this.state.lastChance = { triggeringTeam: teamIndex };
      this.state.currentTeamIndex = 1 - teamIndex;
    } else {
      this.state.currentTeamIndex = 1 - teamIndex;
    }

    this.state.updatedAt = new Date().toISOString();

    return {
      bustApplied,
      bustedFrom,
      bustedTo,
      winType: this.state.winType,
    };
  }

  undo() {
    if (this.state.turns.length === 0) {
      return false;
    }

    const lastTurn = this.state.turns.pop();
    const team = this.state.teams[lastTurn.teamIndex];
    team.score = lastTurn.scoreBefore;
    this.state.currentTeamIndex = lastTurn.teamIndex;
    this.state.winner = null;
    this.state.winType = null;
    this.state.lastChance = lastTurn.lastChanceBefore || null;
    this.state.overtime = lastTurn.overtimeBefore || false;
    this.state.updatedAt = new Date().toISOString();
    return true;
  }
}

window.ScorekeeperGames = window.ScorekeeperGames || {};
window.ScorekeeperGames.KanJamGame = KanJamGame;
