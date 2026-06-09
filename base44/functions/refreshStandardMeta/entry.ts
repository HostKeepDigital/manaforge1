import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Researches the CURRENT Standard metagame by reading MTGDecks, MTGTop8 and
// MTGGoldfish, then saves a fresh `MetaKnowledge` snapshot (format "Standard").
// Designed to run unattended from a daily scheduled automation, or manually by an admin.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow an authenticated admin (manual trigger) OR the scheduled automation
    // (which runs with no user). Block normal logged-in users.
    let isAdmin = false;
    try {
      const user = await base44.auth.me();
      isAdmin = user?.role === 'admin';
      if (user && !isAdmin) {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    } catch (_e) {
      // No user (scheduled run) — proceed with service role.
    }

    const today = new Date().toISOString().split('T')[0];

    const research = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'gemini_3_1_pro',
      add_context_from_internet: true,
      prompt: `You are an expert Magic: The Gathering Standard metagame analyst. As of ${today}, research the CURRENT MTG Arena Standard metagame by reading these three sites:
- MTGDecks (https://mtgdecks.net/Standard)
- MTGTop8 (https://www.mtgtop8.com/format?f=ST)
- MTGGoldfish (https://www.mtggoldfish.com/metagame/standard)

Cross-reference all three sources and produce an accurate, current snapshot. Use only real, currently Standard-legal card and archetype names.

Capture:
1. current_sets: which sets are currently legal / driving the format.
2. top_archetypes: markdown listing Tier 1 and strong Tier 2 decks with approximate meta share %, win rate %, and 2-3 signature cards each.
3. draft_strategies: markdown describing the overall format shape (aggro/control/combo split), what dominates, and what an off-meta counter-deck should target.
4. pro_insights: markdown of takeaways from recent major events and notable win-rate sleepers.
5. summary: a concise overall summary used as context for deck building.`,
      response_json_schema: {
        type: 'object',
        properties: {
          current_sets: { type: 'string' },
          top_archetypes: { type: 'string' },
          draft_strategies: { type: 'string' },
          pro_insights: { type: 'string' },
          summary: { type: 'string' },
        },
      },
    });

    const data = research?.response && typeof research.response === 'object' ? research.response : research;

    const record = await base44.asServiceRole.entities.MetaKnowledge.create({
      format: 'Standard',
      current_sets: data.current_sets || '',
      top_archetypes: data.top_archetypes || '',
      draft_strategies: data.draft_strategies || '',
      pro_insights: data.pro_insights || '',
      summary: data.summary || '',
      researched_at: new Date().toISOString(),
    });

    return Response.json({ success: true, id: record.id, researched_at: record.researched_at });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});