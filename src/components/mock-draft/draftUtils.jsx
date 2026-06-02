// Helpers for the Mock Draft simulator: building packs from a SetGuide's
// graded card list and scoring cards to recommend the best pick.

// Higher = better. Used to rank cards and pick the recommended card.
export const GRADE_SCORE = { A: 5, B: 4, C: 3, D: 2, E: 1 };

export const GRADE_STYLES = {
  A: "bg-primary/20 text-primary border-primary/40",
  B: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  C: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  D: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  E: "bg-red-500/15 text-red-300 border-red-500/30",
};

export const GRADE_LABELS = {
  A: "Bomb / Premium",
  B: "Strong",
  C: "Playable",
  D: "Marginal",
  E: "Unplayable",
};

const MANA_STYLES = {
  W: "bg-amber-100 text-amber-900",
  U: "bg-blue-500/20 text-blue-300",
  B: "bg-zinc-700 text-zinc-200",
  R: "bg-red-500/20 text-red-300",
  G: "bg-green-500/20 text-green-300",
  C: "bg-zinc-500/20 text-zinc-300",
};

export const manaStyle = (c) => MANA_STYLES[c] || MANA_STYLES.C;

// Rough pack rarity feel: ~1 rare/mythic, ~3 uncommons, rest commons.
const slotCounts = { rareSlot: 1, uncommon: 3, common: 11 };

const byRarity = (cards, rarity) =>
  cards.filter((c) => (c.rarity || "").toLowerCase() === rarity);

const sample = (pool, n) => {
  const copy = [...pool];
  const out = [];
  while (out.length < n && copy.length) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
};

// Build a 15-card pack from a set's card list, weighted by rarity. Falls back
// gracefully when a rarity bucket is thin by topping up from the full list.
export function buildPack(cards) {
  const valid = (cards || []).filter((c) => c && c.name);
  if (valid.length === 0) return [];

  const rares = [...byRarity(valid, "rare"), ...byRarity(valid, "mythic")];
  const uncommons = byRarity(valid, "uncommon");
  const commons = byRarity(valid, "common");

  let pack = [
    ...sample(rares, slotCounts.rareSlot),
    ...sample(uncommons, slotCounts.uncommon),
    ...sample(commons, slotCounts.common),
  ];

  // Top up to 15 from any remaining cards if buckets were short.
  if (pack.length < 15) {
    const used = new Set(pack.map((c) => c.name));
    const rest = valid.filter((c) => !used.has(c.name));
    pack = [...pack, ...sample(rest, 15 - pack.length)];
  }

  return pack.slice(0, 15);
}

// Extract lowercase keywords/mechanics signals from a card's note + type so we
// can reward cards that reinforce the same theme already in the pool.
function cardSignals(card) {
  const text = `${card.note || ""} ${card.type || ""}`.toLowerCase();
  return text;
}

// Common Limited synergy themes to look for across the drafted pool.
const THEMES = [
  "vehicle", "crew", "saddle", "mount", "exhaust", "speed", "cycling",
  "artifact", "sacrifice", "counter", "graveyard", "discard", "flying",
  "lifelink", "token", "removal", "pirate", "engine",
];

// Rates 0-100 how well `card` works with the cards already drafted (`pool`).
// Considers shared colors, shared mechanic themes, and curve/type balance.
// Returns null when the pool is empty (nothing to synergize with yet).
export function synergyScore(card, pool) {
  if (!pool || pool.length === 0) return null;

  let score = 30; // baseline

  // Color overlap: cards that fit the colors you're already in are better.
  const poolColors = new Set();
  pool.forEach((c) => (c.colors || []).forEach((col) => poolColors.add(col)));
  const cardColors = card.colors || [];
  if (cardColors.length === 0) {
    score += 15; // colorless / artifacts splash anywhere
  } else {
    const shared = cardColors.filter((c) => poolColors.has(c)).length;
    const offColor = cardColors.filter((c) => !poolColors.has(c)).length;
    score += shared * 18;
    score -= offColor * 12;
  }

  // Theme overlap: reward shared mechanics/keywords with the pool.
  const cardText = cardSignals(card);
  const poolText = pool.map(cardSignals).join(" ");
  let themeHits = 0;
  THEMES.forEach((t) => {
    if (cardText.includes(t) && poolText.includes(t)) themeHits += 1;
  });
  score += Math.min(themeHits * 10, 30);

  // Type balance: nudge toward creatures when the pool is creature-light.
  const creatures = pool.filter((c) => (c.type || "").toLowerCase() === "creature").length;
  const creatureRatio = creatures / pool.length;
  const isCreature = (card.type || "").toLowerCase() === "creature";
  if (isCreature && creatureRatio < 0.55) score += 8;
  if (!isCreature && creatureRatio < 0.4) score -= 6;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// Returns the index of the recommended best pick (highest grade, then rarity).
export function bestPickIndex(pack) {
  let best = 0;
  let bestScore = -1;
  pack.forEach((c, i) => {
    const score = GRADE_SCORE[c.grade] ?? 0;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return best;
}