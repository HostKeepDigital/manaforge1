import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Fetches Standard-legal data from Scryfall.
// action="sets"  -> returns the list of Standard-legal expansion/core sets (auto-updates as new sets release)
// action="cards" -> returns every Standard-legal card for a given set + color bucket (fully paginated, no truncation)

const COLOR_QUERY = {
  W: "c=w -c>w",   // mono-white
  U: "c=u -c>u",
  B: "c=b -c>b",
  R: "c=r -c>r",
  G: "c=g -c>g",
  M: "c>1",        // multicolor
  C: "c=c",        // colorless
};

async function fetchAllPages(url) {
  const all = [];
  let next = url;
  while (next) {
    const res = await fetch(next, { headers: { Accept: "application/json" } });
    if (res.status === 404) break; // no cards match -> empty
    if (!res.ok) throw new Error(`Scryfall error ${res.status}`);
    const json = await res.json();
    if (Array.isArray(json.data)) all.push(...json.data);
    next = json.has_more ? json.next_page : null;
    // Be polite to Scryfall's rate limit between pages.
    if (next) await new Promise((r) => setTimeout(r, 120));
  }
  return all;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, setCode, color } = await req.json();

    if (action === "sets") {
      const res = await fetch("https://api.scryfall.com/sets", { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`Scryfall error ${res.status}`);
      const json = await res.json();
      const today = new Date().toISOString().slice(0, 10);
      // Only real, released, paper expansion/core sets that contribute to Standard.
      const sets = (json.data || [])
        .filter((s) =>
          ["expansion", "core"].includes(s.set_type) &&
          !s.digital &&
          s.released_at &&
          s.released_at <= today &&
          s.card_count > 0
        )
        .map((s) => ({
          code: s.code,
          name: s.name,
          released_at: s.released_at,
          card_count: s.card_count,
          icon: s.icon_svg_uri,
        }))
        .sort((a, b) => (a.released_at < b.released_at ? 1 : -1));
      return Response.json({ sets });
    }

    if (action === "cards") {
      if (!setCode || !color) return Response.json({ error: "setCode and color required" }, { status: 400 });
      const colorClause = COLOR_QUERY[color];
      if (!colorClause) return Response.json({ error: "invalid color" }, { status: 400 });

      const q = encodeURIComponent(`legal:standard set:${setCode} ${colorClause}`);
      const url = `https://api.scryfall.com/cards/search?q=${q}&unique=cards&order=name`;
      const raw = await fetchAllPages(url);

      const cards = raw.map((c) => {
        const face = c.image_uris ? c : (c.card_faces?.find((f) => f.image_uris) || c);
        const img = (c.image_uris || face.image_uris || {});
        return {
          id: c.id,
          name: c.name,
          rarity: c.rarity,
          type_line: c.type_line,
          mana_cost: c.mana_cost || c.card_faces?.[0]?.mana_cost || "",
          image_small: img.small || null,
          image_normal: img.normal || null,
        };
      });

      return Response.json({ setCode, color, count: cards.length, cards });
    }

    return Response.json({ error: "unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});