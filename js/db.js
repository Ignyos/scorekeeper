const DB_NAME = "ignyos.scorekeeper";
const DB_VERSION = 1;

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB request failed"));
  });
}

function txDoneToPromise(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed"));
    tx.onabort = () => reject(tx.error || new Error("IndexedDB transaction aborted"));
  });
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains("players")) {
        const players = db.createObjectStore("players", { keyPath: "id" });
        players.createIndex("by_name", "name", { unique: false });
        players.createIndex("by_lastAccessed", "lastAccessed", { unique: false });
        players.createIndex("by_deletedAt", "deletedAt", { unique: false });
      }

      if (!db.objectStoreNames.contains("sessions")) {
        const sessions = db.createObjectStore("sessions", { keyPath: "id", autoIncrement: true });
        sessions.createIndex("by_startTime", "startTime", { unique: false });
        sessions.createIndex("by_game", "game", { unique: false });
        sessions.createIndex("by_status", "status", { unique: false });
      }

      if (!db.objectStoreNames.contains("settings")) {
        const settings = db.createObjectStore("settings", { keyPath: "key" });
        settings.createIndex("by_userId", "userId", { unique: false });
        settings.createIndex("by_updatedAt", "updatedAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Unable to open IndexedDB"));
  });
}

function generateId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "";
  for (let index = 0; index < 6; index += 1) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

async function createPlayer(db, name) {
  const cleanName = String(name || "").trim();
  if (!cleanName) {
    throw new Error("Player name is required");
  }

  const existing = await listPlayers(db, { includeDeleted: false });
  const duplicate = existing.some((player) => player.name.toLowerCase() === cleanName.toLowerCase());
  if (duplicate) {
    throw new Error("Active player name already exists");
  }

  const tx = db.transaction(["players"], "readwrite");
  const playersStore = tx.objectStore("players");

  let id = generateId();
  while (await requestToPromise(playersStore.get(id))) {
    id = generateId();
  }

  const now = new Date().toISOString();
  const player = {
    id,
    name: cleanName,
    createdAt: now,
    lastAccessed: now,
    deletedAt: null,
  };

  playersStore.put(player);
  await txDoneToPromise(tx);
  return player;
}

async function listPlayers(db, options = {}) {
  const includeDeleted = Boolean(options.includeDeleted);
  const tx = db.transaction(["players"], "readonly");
  const rows = await requestToPromise(tx.objectStore("players").getAll());
  const filtered = includeDeleted ? rows : rows.filter((row) => !row.deletedAt);
  return filtered.sort((left, right) => left.name.localeCompare(right.name));
}

async function softDeletePlayer(db, playerId) {
  const tx = db.transaction(["players", "sessions"], "readwrite");
  const sessions = await requestToPromise(tx.objectStore("sessions").getAll());
  const activeSession = sessions.find((session) => session.status === "active" && session.playerIds.includes(playerId));
  if (activeSession) {
    tx.abort();
    throw new Error("Cannot delete player in active session");
  }

  const playersStore = tx.objectStore("players");
  const player = await requestToPromise(playersStore.get(playerId));
  if (!player) {
    tx.abort();
    throw new Error("Player not found");
  }

  player.deletedAt = new Date().toISOString();
  playersStore.put(player);
  await txDoneToPromise(tx);
}

async function renamePlayer(db, playerId, newName) {
  const cleanName = String(newName || "").trim();
  if (!cleanName) {
    throw new Error("Player name is required");
  }

  const existing = await listPlayers(db, { includeDeleted: false });
  const duplicate = existing.some(
    (player) => player.id !== playerId && player.name.toLowerCase() === cleanName.toLowerCase(),
  );
  if (duplicate) {
    throw new Error("Active player name already exists");
  }

  const tx = db.transaction(["players"], "readwrite");
  const store = tx.objectStore("players");
  const player = await requestToPromise(store.get(playerId));
  if (!player) {
    tx.abort();
    throw new Error("Player not found");
  }

  player.name = cleanName;
  store.put(player);
  await txDoneToPromise(tx);
}

async function restorePlayer(db, playerId) {
  const tx = db.transaction(["players"], "readwrite");
  const store = tx.objectStore("players");
  const player = await requestToPromise(store.get(playerId));
  if (!player) {
    tx.abort();
    throw new Error("Player not found");
  }

  if (!player.deletedAt) {
    await txDoneToPromise(tx);
    return;
  }

  const activePlayers = (await requestToPromise(store.getAll())).filter((row) => !row.deletedAt);
  const duplicate = activePlayers.some((row) => row.id !== playerId && row.name.toLowerCase() === player.name.toLowerCase());
  if (duplicate) {
    tx.abort();
    throw new Error("Cannot restore because an active player already has that name");
  }

  player.deletedAt = null;
  player.lastAccessed = new Date().toISOString();
  store.put(player);
  await txDoneToPromise(tx);
}

async function createSession(db, input) {
  const now = new Date().toISOString();
  const session = {
    game: input.game || "yahtzee",
    gameVersion: input.gameVersion || "1",
    gameClass: input.gameClass || "YahtzeeGame",
    playerIds: input.playerIds,
    status: "active",
    startTime: now,
    endTime: null,
    gameState: input.gameState,
    scoreEntries: [],
    createdAt: now,
    updatedAt: now,
  };

  const tx = db.transaction(["sessions", "players"], "readwrite");
  const sessionId = await requestToPromise(tx.objectStore("sessions").add(session));

  const playersStore = tx.objectStore("players");
  for (const playerId of input.playerIds) {
    const player = await requestToPromise(playersStore.get(playerId));
    if (player) {
      player.lastAccessed = now;
      playersStore.put(player);
    }
  }

  await txDoneToPromise(tx);
  return { ...session, id: sessionId };
}

async function getSession(db, sessionId) {
  const tx = db.transaction(["sessions"], "readonly");
  return requestToPromise(tx.objectStore("sessions").get(Number(sessionId)));
}

async function listSessions(db) {
  const tx = db.transaction(["sessions"], "readonly");
  const sessions = await requestToPromise(tx.objectStore("sessions").getAll());
  return sessions.sort((left, right) => right.startTime.localeCompare(left.startTime));
}

async function updateSessionGameState(db, sessionId, gameState, scoreEntry) {
  const tx = db.transaction(["sessions"], "readwrite");
  const store = tx.objectStore("sessions");
  const session = await requestToPromise(store.get(Number(sessionId)));
  if (!session) {
    tx.abort();
    throw new Error("Session not found");
  }

  session.gameState = gameState;
  session.updatedAt = new Date().toISOString();
  if (scoreEntry) {
    session.scoreEntries = [...(session.scoreEntries || []), scoreEntry];
  }
  store.put(session);
  await txDoneToPromise(tx);
  return session;
}

async function completeSession(db, sessionId, finalGameState) {
  const tx = db.transaction(["sessions"], "readwrite");
  const store = tx.objectStore("sessions");
  const session = await requestToPromise(store.get(Number(sessionId)));
  if (!session) {
    tx.abort();
    throw new Error("Session not found");
  }

  const now = new Date().toISOString();
  session.status = "completed";
  session.endTime = now;
  session.updatedAt = now;
  session.gameState = { ...finalGameState, isFinal: true, updatedAt: now };

  store.put(session);
  await txDoneToPromise(tx);
  return session;
}

async function deleteSession(db, sessionId) {
  const tx = db.transaction(["sessions"], "readwrite");
  const store = tx.objectStore("sessions");
  const id = Number(sessionId);
  const session = await requestToPromise(store.get(id));
  if (!session) {
    tx.abort();
    throw new Error("Session not found");
  }

  store.delete(id);
  await txDoneToPromise(tx);
}

async function getSetting(db, key) {
  const tx = db.transaction(["settings"], "readonly");
  return requestToPromise(tx.objectStore("settings").get(key));
}

async function putSetting(db, setting) {
  const tx = db.transaction(["settings"], "readwrite");
  tx.objectStore("settings").put({
    ...setting,
    updatedAt: new Date().toISOString(),
  });
  await txDoneToPromise(tx);
}

async function getGlobalSettings(db) {
  const setting = await getSetting(db, "global");
  return setting?.value || null;
}

async function saveGlobalSettings(db, value) {
  await putSetting(db, {
    key: "global",
    userId: null,
    value,
  });
}

window.ScorekeeperDb = {
  openDatabase,
  createPlayer,
  listPlayers,
  softDeletePlayer,
  renamePlayer,
  restorePlayer,
  createSession,
  getSession,
  listSessions,
  updateSessionGameState,
  completeSession,
  deleteSession,
  getSetting,
  putSetting,
  getGlobalSettings,
  saveGlobalSettings,
};