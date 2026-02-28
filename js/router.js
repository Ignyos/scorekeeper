function getRouteFromPath(pathname) {
  const normalizedPath = String(pathname || "").toLowerCase();
  const cleanPath = normalizedPath.replace(/\/+$/, "");

  if (cleanPath === "" || cleanPath === "/") {
    return { key: "home", slug: "" };
  }

  if (cleanPath.endsWith("/settings") || cleanPath.endsWith("/settings/index.html")) {
    return { key: "settings", slug: "settings" };
  }

  if (cleanPath.endsWith("/players") || cleanPath.endsWith("/players/index.html")) {
    return { key: "players", slug: "players" };
  }

  if (cleanPath.endsWith("/history") || cleanPath.endsWith("/history/index.html")) {
    return { key: "history", slug: "history" };
  }

  if (cleanPath.endsWith("/yahtzee") || cleanPath.endsWith("/yahtzee/index.html")) {
    return { key: "game", slug: "yahtzee" };
  }

  if (cleanPath.endsWith("/scrabble") || cleanPath.endsWith("/scrabble/index.html")) {
    return { key: "game", slug: "scrabble" };
  }

  if (cleanPath.endsWith("/threetothirteen") || cleanPath.endsWith("/threetothirteen/index.html")) {
    return { key: "game", slug: "threetothirteen" };
  }

  if (cleanPath.endsWith("/trepenta") || cleanPath.endsWith("/trepenta/index.html")) {
    return { key: "game", slug: "trepenta" };
  }

  const fileModeGameMatch = cleanPath.match(/^\/(?!settings|players|history)([^/]+)\/index\.html$/);
  if (fileModeGameMatch) {
    return { key: "game", slug: fileModeGameMatch[1].toLowerCase() };
  }

  if (cleanPath.endsWith("/index.html")) {
    return { key: "home", slug: "" };
  }

  const match = cleanPath.match(/^\/([^/]+)$/);
  if (match) {
    return { key: "game", slug: match[1].toLowerCase() };
  }

  return { key: "notFound", slug: "" };
}

function withSessionId(path, sessionId) {
  if (!sessionId) {
    return path;
  }
  return `${path}?session=${encodeURIComponent(sessionId)}`;
}

window.ScorekeeperRouter = {
  getRouteFromPath,
  withSessionId,
};