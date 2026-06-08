import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

// Rarity sort order (rarest first) and color sort order (WUBRG, then colorless/multi).
const RARITY_ORDER = { mythic: 0, rare: 1, uncommon: 2, common: 3, special: 4, bonus: 5, unknown: 6 };
const COLOR_ORDER = { W: 0, U: 1, B: 2, R: 3, G: 4, M: 5, C: 6 };
const RARITY_LABEL = {
  mythic: "Mythic Rare",
  rare: "Rare",
  uncommon: "Uncommon",
  common: "Common",
  special: "Special",
  bonus: "Bonus",
  unknown: "Other",
};

// Fetch image + rarity + color for a batch of card names from Scryfall's collection endpoint.
async function fetchCardData(names) {
  const results = new Map();
  // Scryfall allows up to 75 identifiers per request.
  for (let i = 0; i < names.length; i += 75) {
    const batch = names.slice(i, i + 75);
    const res = await fetch("https://api.scryfall.com/cards/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifiers: batch.map((name) => ({ name })) }),
    });
    if (!res.ok) continue;
    const json = await res.json();
    (json.data || []).forEach((card) => {
      const img =
        card.image_uris?.normal ||
        card.card_faces?.[0]?.image_uris?.normal ||
        null;
      const colors = card.color_identity || [];
      const colorKey = colors.length === 0 ? "C" : colors.length > 1 ? "M" : colors[0];
      results.set(card.name.toLowerCase(), {
        image: img,
        rarity: card.rarity || "unknown",
        colorKey,
      });
    });
  }
  return results;
}

export default function CollectionGrid({ cards }) {
  const [data, setData] = useState(new Map());
  const [loading, setLoading] = useState(true);

  const uniqueNames = useMemo(
    () => [...new Set((cards || []).map((c) => c.name).filter(Boolean))],
    [cards]
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchCardData(uniqueNames)
      .then((res) => active && setData(res))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [uniqueNames]);

  const sorted = useMemo(() => {
    return [...(cards || [])]
      .filter((c) => c?.name)
      .map((c) => {
        const meta = data.get(c.name.toLowerCase()) || {};
        return {
          ...c,
          image: meta.image || null,
          rarity: meta.rarity || "unknown",
          colorKey: meta.colorKey ?? "C",
        };
      })
      .sort((a, b) => {
        const r = (RARITY_ORDER[a.rarity] ?? 9) - (RARITY_ORDER[b.rarity] ?? 9);
        if (r !== 0) return r;
        const col = (COLOR_ORDER[a.colorKey] ?? 9) - (COLOR_ORDER[b.colorKey] ?? 9);
        if (col !== 0) return col;
        return a.name.localeCompare(b.name);
      });
  }, [cards, data]);

  // Group by rarity for section headers.
  const groups = useMemo(() => {
    const g = {};
    sorted.forEach((c) => {
      const key = c.rarity || "unknown";
      if (!g[key]) g[key] = [];
      g[key].push(c);
    });
    return Object.entries(g).sort(
      ([a], [b]) => (RARITY_ORDER[a] ?? 9) - (RARITY_ORDER[b] ?? 9)
    );
  }, [sorted]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground font-body">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p>Fetching card images from Scryfall...</p>
      </div>
    );
  }

  if (!sorted.length) {
    return (
      <div className="text-center py-20 text-muted-foreground font-body">
        No cards in your collection yet.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map(([rarity, items]) => (
        <div key={rarity}>
          <h3 className="font-heading text-lg text-foreground mb-3 flex items-center gap-2">
            {RARITY_LABEL[rarity] || rarity}
            <span className="text-xs text-muted-foreground font-body">({items.length})</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {items.map((card, i) => (
              <motion.div
                key={`${card.name}-${i}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(i * 0.01, 0.3) }}
                className="relative rounded-lg overflow-hidden bg-secondary/40 aspect-[63/88]"
              >
                {card.image ? (
                  <img
                    src={card.image}
                    alt={card.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-2 text-center text-xs font-body text-muted-foreground">
                    {card.name}
                  </div>
                )}
                {card.quantity > 1 && (
                  <div className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow">
                    {card.quantity}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}