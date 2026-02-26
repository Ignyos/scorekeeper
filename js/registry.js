const gameRegistry = {
  yahtzee: {
    slug: "yahtzee",
    title: "Yahtzee",
    description: "Classic dice game with category scoring.",
    className: "YahtzeeGame",
    load: async () => window.ScorekeeperGames?.YahtzeeGame || null,
  },
  scrabble: {
    slug: "scrabble",
    title: "Scrabble",
    description: "Track running totals for a Scrabble game.",
    className: "ScrabbleGame",
    load: async () => window.ScorekeeperGames?.ScrabbleGame || null,
  },
};

async function loadGameClassBySlug(slug) {
  const def = gameRegistry[slug];
  if (!def) {
    return null;
  }
  return def.load();
}

window.ScorekeeperRegistry = {
  gameRegistry,
  loadGameClassBySlug,
};
