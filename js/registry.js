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
  threetothirteen: {
    slug: "threetothirteen",
    title: "Three Thirteen",
    description: "Track 11 rounds and keep the lowest total score to win.",
    className: "ThreeToThirteenGame",
    load: async () => window.ScorekeeperGames?.ThreeToThirteenGame || null,
  },
  trepenta: {
    slug: "trepenta",
    title: "Trepenta",
    description: "Track five rounds with configurable house rules and lowest-score wins.",
    className: "TrepentaGame",
    load: async () => window.ScorekeeperGames?.TrepentaGame || null,
  },
  dice10000: {
    slug: "dice10000",
    title: "Dice 10,000",
    description: "Track round points and race to 10,000 in this classic dice game.",
    className: "Dice10000Game",
    load: async () => window.ScorekeeperGames?.Dice10000Game || null,
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
