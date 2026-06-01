import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow either an authenticated admin (manual trigger) or the scheduled
    // automation (which runs without a user). Block normal logged-in users.
    let isAdmin = false;
    try {
      const user = await base44.auth.me();
      isAdmin = user?.role === 'admin';
      if (user && !isAdmin) {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    } catch (_e) {
      // No user (scheduled run) — allowed to proceed with service role.
    }

    const today = new Date().toISOString().split('T')[0];

    const research = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'gemini_3_1_pro',
      add_context_from_internet: true,
      prompt: `You are an expert Magic: The Gathering Limited/Draft coach. Research the CURRENT state of MTG as of ${today} by reading FULL drafting guides and articles from across the internet.

Read and synthesize the best publicly available drafting/deckbuilding content, including sources like:
- ChannelFireball (CFB) draft guides and Limited set reviews
- Draftsim, 17Lands data articles and tier lists
- Cardmarket Insight, MTGGoldfish Limited articles
- Star City Games (SCG) Limited content
- Lords of Limited / Limited Resources podcast takeaways
- Reddit r/lrcast and r/spikes Limited threads
- Pro Tour and Arena Open draft coverage and top-drafter interviews

Distill the GENERAL, TIMELESS deckbuilding principles AND the current-format specifics. Specifically capture:

1. CURRENT SETS: the newest sets being drafted right now and which formats are live.

2. TOP ARCHETYPES: the strongest current Constructed AND Limited archetypes/color pairs and why they perform.

3. DRAFT STRATEGIES — be very concrete and actionable. Include:
   - The fundamental deckbuilding template for a 40-card Limited deck: 14-17 creatures (aim ~15-16), 6-9 non-creature spells, 16-17 lands.
   - A strong, low mana curve: how many 1-2-3-4-5+ drops to aim for (a typical good curve has its bulk at 2-3 mana).
   - "Bombs, Removal, Evasion, Creatures, Card advantage, Tricks" (BREAD) pick priority and how to apply it.
   - Reading signals, staying open early, committing to two colors, when a splash is acceptable.
   - PIP COUNTING for the mana base: count colored mana symbols per color across all spells and distribute the 16-17 lands proportionally (main color ~9-10 sources, secondary ~7-8, splash ~3-4; double-pip costs demand more sources).
   - Common deckbuilding mistakes to avoid (too few creatures, too many lands, greedy 3-color manabases, top-heavy curves).

4. PRO INSIGHTS: notable takeaways from recent Pro Tour/Arena Open drafts and how top drafters approach the current format.

Be specific, accurate, cite set/archetype names, and write the draft_strategies field as a thorough, practical guide a deckbuilder can follow step by step.`,
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
      format: 'All',
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