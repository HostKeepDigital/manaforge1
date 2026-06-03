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

// Map a generated deck object + selected colors into a SavedDeck record.
export function toSavedDeck(deck, selectedColors) {
  const r = deck.ratings || {};
  return {
    category: deck.category || "",
    category_reasoning: deck.category_reason || "",
    colors: selectedColors || deck.colors || [],
    deck_name: deck.deck_name || "Untitled Deck",
    youtube_description: deck.description || "",
    strategy: deck.strategy || "",
    key_interactions: deck.key_interactions || "",
    mana_curve: deck.mana_curve || {},
    decklist: (deck.cards || []).map((c) => ({
      name: c.name,
      quantity: c.quantity || 1,
      type: c.type || "",
    })),
    mtga_decklist: toMtgaFormat(deck.cards),
    ratings: {
      competitiveness: r.competitiveness ?? 0,
      entertainment: r.entertainment_value ?? r.entertainment ?? 0,
      surprise: r.surprise_factor ?? r.surprise ?? 0,
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