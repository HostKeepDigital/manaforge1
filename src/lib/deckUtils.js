// Shared helpers for deck saving + validation.

export function toMtgaFormat(cards) {
  return (cards || []).map((c) => `${c.quantity || 1} ${c.name}`).join("\n");
}

// Validate every non-basic card exists & is Standard-legal via Scryfall.
// Returns { legal: boolean, illegal: string[] }.
export async function validateStandardLegality(cards) {
  const BASICS = new Set(["Plains", "Island", "Swamp", "Mountain", "Forest", "Wastes"]);
  const names = [
    ...new Set(
      (cards || [])
        .map((c) => (c?.name || "").trim())
        .filter((n) => n && !BASICS.has(n))
    ),
  ];
  if (!names.length) return { legal: true, illegal: [] };

  const illegal = [];
  // Scryfall collection endpoint accepts up to 75 identifiers per request.
  for (let i = 0; i < names.length; i += 75) {
    const batch = names.slice(i, i + 75);
    const res = await fetch("https://api.scryfall.com/cards/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifiers: batch.map((name) => ({ name })) }),
    });
    if (!res.ok) throw new Error("Could not reach Scryfall to validate legality.");
    const json = await res.json();
    (json.not_found || []).forEach((nf) => illegal.push(nf.name));
    (json.data || []).forEach((card) => {
      if (card.legalities?.standard !== "legal") illegal.push(card.name);
    });
  }

  return { legal: illegal.length === 0, illegal };
}

// Build a map of card name -> quantity from a card array (any shape with name/quantity).
function cardQtyMap(cards) {
  const map = {};
  (cards || []).forEach((c) => {
    const name = (c?.name || "").trim().toLowerCase();
    if (!name) return;
    map[name] = (map[name] || 0) + (Number(c.quantity) || 1);
  });
  return map;
}

// Compute the % of cards shared between two decks (by overlapping copies / 60).
// Returns a number 0-100.
export function deckSimilarity(cardsA, cardsB) {
  const a = cardQtyMap(cardsA);
  const b = cardQtyMap(cardsB);
  let shared = 0;
  for (const name of Object.keys(a)) {
    if (b[name]) shared += Math.min(a[name], b[name]);
  }
  const totalA = Object.values(a).reduce((s, n) => s + n, 0) || 1;
  const totalB = Object.values(b).reduce((s, n) => s + n, 0) || 1;
  const denom = Math.max(totalA, totalB);
  return (shared / denom) * 100;
}

// Check a new deck's card list against all existing saved decks.
// Returns { duplicate: boolean, maxOverlap: number } — duplicate is true if any
// existing deck shares MORE than `threshold` percent of cards.
export function findTooSimilar(newCards, existingDecks, threshold = 85) {
  let maxOverlap = 0;
  for (const d of existingDecks || []) {
    const overlap = deckSimilarity(newCards, d.decklist || []);
    if (overlap > maxOverlap) maxOverlap = overlap;
  }
  return { duplicate: maxOverlap > threshold, maxOverlap };
}

// Normalize the AI mana_curve (keys "0".."7+") into the SavedDeck schema (1..6plus).
function normalizeManaCurve(curve) {
  const c = curve || {};
  const num = (k) => Number(c[k]) || 0;
  return {
    1: num("1"),
    2: num("2"),
    3: num("3"),
    4: num("4"),
    5: num("5"),
    "6plus": num("0") + num("6") + num("7+") + num("7") + num("6plus"),
  };
}

// Always coerce a value into a plain string (AI sometimes returns arrays/objects).
function asString(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map((x) => asString(x)).join("\n");
  return String(v);
}

// Map a generated deck object + selected colors into a SavedDeck record.
export function toSavedDeck(deck, selectedColors) {
  const r = deck.ratings || {};
  return {
    category: asString(deck.category),
    category_reasoning: asString(deck.category_reason),
    colors: selectedColors || deck.colors || [],
    deck_name: asString(deck.deck_name) || "Untitled Deck",
    youtube_description: asString(deck.description),
    strategy: asString(deck.strategy),
    key_interactions: asString(deck.key_interactions),
    mana_curve: normalizeManaCurve(deck.mana_curve),
    decklist: (deck.cards || []).map((c) => ({
      name: c.name,
      quantity: c.quantity || 1,
      type: c.type || "",
    })),
    mtga_decklist: toMtgaFormat(deck.cards),
    ratings: {
      competitiveness: Number(r.competitiveness) || 0,
      entertainment: Number(r.entertainment_value ?? r.entertainment) || 0,
      surprise: Number(r.surprise_factor ?? r.surprise) || 0,
    },
    verified_legal: true,
    generated_at: new Date().toISOString(),
  };
}

// Convert a SavedDeck record back into the shape Bo1DeckDisplay expects.
export function savedDeckToDisplay(saved) {
  const r = saved.ratings || {};
  return {
    category: saved.category,
    category_reason: saved.category_reasoning,
    deck_name: saved.deck_name,
    description: saved.youtube_description,
    colors: saved.colors || [],
    strategy: saved.strategy,
    key_interactions: saved.key_interactions,
    mana_curve: saved.mana_curve || {},
    cards: saved.decklist || [],
    ratings: {
      competitiveness: r.competitiveness ?? 0,
      entertainment_value: r.entertainment ?? 0,
      surprise_factor: r.surprise ?? 0,
    },
  };
}