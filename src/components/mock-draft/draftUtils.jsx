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