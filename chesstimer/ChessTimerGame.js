const VALID_TIMING_MODES = [
  "none",
  "suddenDeath",
  "fischer",
  "bronstein",
  "usDelay",
  "hourglass",
  "perMove",
  "hybrid",
  "staged",
];

function chessTimerDefaultState() {
  return {
    timingMode: "fischer",
    playerIds: [],
    initialTimeMs: {},
    incrementMs: 0,
    delayMs: 0,
    perMoveMs: 0,
    stages: [],
    timeRemainingMs: {},
    delayRemainingMs: {},
    perMoveRemainingMs: {},
    stageIndex: 0,
    moveCount: 0,
    activePlayerId: null,
    status: "ready",
    winnerId: null,
    loserPlayerId: null,
    winCondition: null,
    isFinal: false,
    updatedAt: new Date().toISOString(),
  };
}

class ChessTimerGame {
  constructor(state) {
    const base = chessTimerDefaultState();
    if (!state) {
      this.state = base;
      return;
    }
    this.state = {
      ...base,
      ...state,
      playerIds: Array.isArray(state.playerIds) ? [...state.playerIds] : [],
      initialTimeMs: { ...(state.initialTimeMs || {}) },
      stages: Array.isArray(state.stages) ? state.stages.map((s) => ({ ...s })) : [],
      timeRemainingMs: { ...(state.timeRemainingMs || {}) },
      delayRemainingMs: { ...(state.delayRemainingMs || {}) },
      perMoveRemainingMs: { ...(state.perMoveRemainingMs || {}) },
    };
  }

  _initialDelayForPlayer() {
    const mode = this.state.timingMode;
    if (mode === "bronstein" || mode === "usDelay") return this.state.delayMs;
    if (mode === "hybrid") return this.state.perMoveMs;
    if (mode === "staged") return this.state.stages[this.state.stageIndex]?.delayMs || 0;
    return 0;
  }

  ensurePlayers(playerIds) {
    this.state.playerIds = [...playerIds];
    for (const id of playerIds) {
      if (!Object.prototype.hasOwnProperty.call(this.state.initialTimeMs, id)) {
        this.state.initialTimeMs[id] = 0;
      }
      this.state.timeRemainingMs[id] = this.state.initialTimeMs[id];
      this.state.delayRemainingMs[id] = this._initialDelayForPlayer();
      this.state.perMoveRemainingMs[id] = this.state.perMoveMs;
    }
    this.state.updatedAt = new Date().toISOString();
  }

  configure(opts) {
    if (opts.timingMode && VALID_TIMING_MODES.includes(opts.timingMode)) {
      this.state.timingMode = opts.timingMode;
    }
    if (typeof opts.incrementMs === "number") this.state.incrementMs = Math.max(0, opts.incrementMs);
    if (typeof opts.delayMs === "number") this.state.delayMs = Math.max(0, opts.delayMs);
    if (typeof opts.perMoveMs === "number") this.state.perMoveMs = Math.max(0, opts.perMoveMs);
    if (Array.isArray(opts.stages)) this.state.stages = opts.stages.map((s) => ({ ...s }));
    if (opts.initialTimeMs && typeof opts.initialTimeMs === "object") {
      this.state.initialTimeMs = { ...opts.initialTimeMs };
    }
    for (const id of this.state.playerIds) {
      this.state.timeRemainingMs[id] = this.state.initialTimeMs[id] || 0;
      this.state.delayRemainingMs[id] = this._initialDelayForPlayer();
      this.state.perMoveRemainingMs[id] = this.state.perMoveMs;
    }
    this.state.updatedAt = new Date().toISOString();
  }

  startGame(firstPlayerId) {
    if (this.state.status !== "ready") throw new Error("Game already started");
    if (!this.state.playerIds.includes(firstPlayerId)) throw new Error("Invalid player");
    this.state.activePlayerId = firstPlayerId;
    this.state.status = "running";
    this.state.delayRemainingMs[firstPlayerId] = this._initialDelayForPlayer();
    this.state.updatedAt = new Date().toISOString();
  }

  switchClock(fromPlayerId) {
    if (this.state.status !== "running") throw new Error("Game not running");
    if (this.state.activePlayerId !== fromPlayerId) throw new Error("Not the active player");
    const toId = this.state.playerIds.find((id) => id !== fromPlayerId);
    if (!toId) throw new Error("No opponent");
    const mode = this.state.timingMode;
    this.state.moveCount++;

    if (mode === "fischer") {
      this.state.timeRemainingMs[fromPlayerId] =
        (this.state.timeRemainingMs[fromPlayerId] || 0) + this.state.incrementMs;
    } else if (mode === "staged") {
      this._progressStage(fromPlayerId);
    }

    if (mode === "bronstein" || mode === "usDelay") {
      this.state.delayRemainingMs[toId] = this.state.delayMs;
    } else if (mode === "hybrid") {
      this.state.delayRemainingMs[toId] = this.state.perMoveMs;
    } else if (mode === "perMove") {
      this.state.perMoveRemainingMs[toId] = this.state.perMoveMs;
    } else if (mode === "staged") {
      const stage = this.state.stages[this.state.stageIndex] || {};
      this.state.delayRemainingMs[toId] = stage.delayMs || 0;
    }

    this.state.activePlayerId = toId;
    this.state.updatedAt = new Date().toISOString();
    return toId;
  }

  _progressStage(fromPlayerId) {
    const stages = this.state.stages;
    if (!stages.length) return;
    const stage = stages[this.state.stageIndex];
    if (!stage) return;

    if (stage.incrementMs > 0) {
      this.state.timeRemainingMs[fromPlayerId] =
        (this.state.timeRemainingMs[fromPlayerId] || 0) + stage.incrementMs;
    }

    const playerMoves = Math.ceil(this.state.moveCount / this.state.playerIds.length);
    if (
      stage.movesRequired > 0 &&
      playerMoves >= stage.movesRequired &&
      this.state.stageIndex < stages.length - 1
    ) {
      this.state.stageIndex++;
      const nextStage = stages[this.state.stageIndex];
      for (const id of this.state.playerIds) {
        this.state.timeRemainingMs[id] =
          (this.state.timeRemainingMs[id] || 0) + (nextStage.addTimeMs || 0);
      }
    }
  }

  tick(elapsedMs) {
    if (this.state.status !== "running") return { flaggedPlayerId: null };
    const activeId = this.state.activePlayerId;
    if (!activeId) return { flaggedPlayerId: null };
    const mode = this.state.timingMode;
    const opponentId = this.state.playerIds.find((id) => id !== activeId);

    switch (mode) {
      case "none":
        break;

      case "suddenDeath":
      case "fischer": {
        const newTime = (this.state.timeRemainingMs[activeId] || 0) - elapsedMs;
        this.state.timeRemainingMs[activeId] = Math.max(0, newTime);
        if (newTime <= 0) {
          this.flagPlayer(activeId);
          return { flaggedPlayerId: activeId };
        }
        break;
      }

      case "bronstein":
      case "usDelay":
      case "hybrid": {
        const delay = this.state.delayRemainingMs[activeId] || 0;
        if (delay > 0) {
          this.state.delayRemainingMs[activeId] = Math.max(0, delay - elapsedMs);
        } else {
          const newTime = (this.state.timeRemainingMs[activeId] || 0) - elapsedMs;
          this.state.timeRemainingMs[activeId] = Math.max(0, newTime);
          if (newTime <= 0) {
            this.flagPlayer(activeId);
            return { flaggedPlayerId: activeId };
          }
        }
        break;
      }

      case "hourglass": {
        const newTime = (this.state.timeRemainingMs[activeId] || 0) - elapsedMs;
        this.state.timeRemainingMs[activeId] = Math.max(0, newTime);
        if (opponentId) {
          this.state.timeRemainingMs[opponentId] =
            (this.state.timeRemainingMs[opponentId] || 0) + elapsedMs;
        }
        if (newTime <= 0) {
          this.flagPlayer(activeId);
          return { flaggedPlayerId: activeId };
        }
        break;
      }

      case "perMove": {
        const newPerMove = (this.state.perMoveRemainingMs[activeId] || 0) - elapsedMs;
        this.state.perMoveRemainingMs[activeId] = Math.max(0, newPerMove);
        if (newPerMove <= 0) {
          this.flagPlayer(activeId);
          return { flaggedPlayerId: activeId };
        }
        break;
      }

      case "staged": {
        const stage = this.state.stages[this.state.stageIndex] || {};
        const delay = this.state.delayRemainingMs[activeId] || 0;
        if (stage.delayMs > 0 && delay > 0) {
          this.state.delayRemainingMs[activeId] = Math.max(0, delay - elapsedMs);
        } else {
          const newTime = (this.state.timeRemainingMs[activeId] || 0) - elapsedMs;
          this.state.timeRemainingMs[activeId] = Math.max(0, newTime);
          if (newTime <= 0) {
            this.flagPlayer(activeId);
            return { flaggedPlayerId: activeId };
          }
        }
        break;
      }

      default:
        break;
    }

    return { flaggedPlayerId: null };
  }

  flagPlayer(playerId) {
    if (this.state.isFinal) return;
    const winnerId = this.state.playerIds.find((id) => id !== playerId) || null;
    this.state.status = "finished";
    this.state.isFinal = true;
    this.state.activePlayerId = null;
    this.state.winnerId = winnerId;
    this.state.loserPlayerId = playerId;
    this.state.winCondition = "time";
    this.state.updatedAt = new Date().toISOString();
  }

  resignPlayer(playerId) {
    if (this.state.isFinal) return;
    const winnerId = this.state.playerIds.find((id) => id !== playerId) || null;
    this.state.status = "finished";
    this.state.isFinal = true;
    this.state.activePlayerId = null;
    this.state.winnerId = winnerId;
    this.state.loserPlayerId = playerId;
    this.state.winCondition = "resigned";
    this.state.updatedAt = new Date().toISOString();
  }

  declareDraw() {
    if (this.state.isFinal) return;
    this.state.status = "finished";
    this.state.isFinal = true;
    this.state.activePlayerId = null;
    this.state.winnerId = null;
    this.state.loserPlayerId = null;
    this.state.winCondition = "draw";
    this.state.updatedAt = new Date().toISOString();
  }

  pause() {
    if (this.state.status === "running") {
      this.state.status = "paused";
      this.state.updatedAt = new Date().toISOString();
    }
  }

  resume() {
    if (this.state.status === "paused") {
      this.state.status = "running";
      this.state.updatedAt = new Date().toISOString();
    }
  }

  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }
}

window.ScorekeeperGames = window.ScorekeeperGames || {};
window.ScorekeeperGames.ChessTimerGame = ChessTimerGame;
