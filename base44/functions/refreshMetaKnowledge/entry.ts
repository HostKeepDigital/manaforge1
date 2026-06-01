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

    // A reusable helper that researches a specific batch of named sets. We split
    // the full back-catalogue (original Strixhaven 2021 → upcoming) into several
    // parallel passes so each response stays detailed and is never truncated.
    const researchSetBatch = (label, setList) =>
      base44.asServiceRole.integrations.Core.InvokeLLM({
        model: 'gemini_3_1_pro',
        add_context_from_internet: true,
        prompt: `You are an expert Magic: The Gathering Limited set reviewer. As of ${today}, research these specific MTG sets using the internet and write a thorough Limited breakdown of EACH one. Do not skip any set in this list.

SETS TO COVER (${label}):
${setList}

Read individual set breakdowns and Limited set reviews from sources like ChannelFireball, Draftsim, 17Lands, Cardmarket, MTGGoldfish, Limited Resources, and the official MTG set pages.

For EACH set, provide a clearly headed markdown section (use the real set name and 3-letter code) covering:
- Set name, code, and release window.
- Core mechanics and keywords introduced/returning.
- The two-color Limited archetypes (or the set's draft themes) and which are strongest.
- Standout bombs, premium removal, and the best commons/uncommons to prioritize.
- The set's overall Limited speed (aggressive vs grindy) and any signpost cards.
- Any rotation/legality notes.

Be specific and accurate, cite real card and set names, and format as clean markdown with one '## ' section per set. Keep each set concise but complete so all listed sets fit in the response.`,
        response_json_schema: {
          type: 'object',
          properties: { set_breakdowns: { type: 'string' } },
        },
      });

    // Run the general meta research plus several per-era set batches in parallel.
    const [research, ...setBatches] = await Promise.all([
    base44.asServiceRole.integrations.Core.InvokeLLM({
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
    }),

    // 2021 era (original Strixhaven onward)
    researchSetBatch(
      '2021 sets',
      `- Kaldheim (KHM) — Feb 2021
- Strixhaven: School of Mages (STX) — April 2021 (the ORIGINAL Strixhaven, with the Mystical Archive)
- Adventures in the Forgotten Realms (AFR) — July 2021
- Innistrad: Midnight Hunt (MID) — Sept 2021
- Innistrad: Crimson Vow (VOW) — Nov 2021`
    ),
    // 2022 era
    researchSetBatch(
      '2022 sets',
      `- Kamigawa: Neon Dynasty (NEO) — Feb 2022
- Streets of New Capenna (SNC) — April 2022
- Dominaria United (DMU) — Sept 2022
- The Brothers' War (BRO) — Nov 2022`
    ),
    // 2023 era
    researchSetBatch(
      '2023 sets',
      `- Phyrexia: All Will Be One (ONE) — Feb 2023
- March of the Machine (MOM) — April 2023
- Wilds of Eldraine (WOE) — Sept 2023
- The Lost Caverns of Ixalan (LCI) — Nov 2023`
    ),
    // 2024 era
    researchSetBatch(
      '2024 sets',
      `- Murders at Karlov Manor (MKM) — Feb 2024
- Outlaws of Thunder Junction (OTJ) — April 2024
- Bloomburrow (BLB) — Aug 2024
- Duskmourn: House of Horror (DSK) — Sept 2024`
    ),
    // 2025–2026 era + present + future
    researchSetBatch(
      '2025-2026 + present + upcoming sets',
      `- Aetherdrift (DFT) — Feb 2025
- Tarkir: Dragonstorm (TDM) — April 2025
- Lorwyn Eclipsed (ECL) — Jan 2026
- Secrets of Strixhaven (SOS) — April 2026 (PRESENT: currently being drafted on MTG Arena)
- Any officially announced/spoiled UPCOMING sets after Secrets of Strixhaven (mark clearly as upcoming; info may be partial)`
    ),
    ]);

    const data = research?.response && typeof research.response === 'object' ? research.response : research;

    // Merge all per-era set breakdowns into one combined markdown document.
    const set_breakdowns = setBatches
      .map((b) => {
        const d = b?.response && typeof b.response === 'object' ? b.response : b;
        return d?.set_breakdowns || '';
      })
      .filter(Boolean)
      .join('\n\n');

    // The combined set breakdowns can exceed the entity field size limit, so we
    // upload it as a markdown file and store only the URL on the entity.
    let set_breakdowns_url = '';
    if (set_breakdowns) {
      const file = new File([set_breakdowns], 'set_breakdowns.md', { type: 'text/markdown' });
      const upload = await base44.asServiceRole.integrations.Core.UploadFile({ file });
      set_breakdowns_url = upload?.file_url || '';
    }

    const record = await base44.asServiceRole.entities.MetaKnowledge.create({
      format: 'All',
      current_sets: data.current_sets || '',
      set_breakdowns_url: set_breakdowns_url,
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