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
      prompt: `You are an expert Magic: The Gathering analyst. Research the CURRENT state of MTG as of ${today} using up-to-date internet sources.

Cover both Standard (Constructed) and Limited/Draft. Specifically research:
1. The newest MTG sets currently legal / being drafted right now, and which are most relevant.
2. The strongest current Constructed archetypes and why they perform well.
3. The best current Limited/Draft strategies: color pair power rankings, pick priorities, archetype signals, and correct land counts (remember ~17 lands for 40-card Limited, ~24 for 60-card Standard).
4. Notable insights from recent Pro Tour drafts and how top pro drafters are approaching the current format.

Be specific, accurate, and cite the set names and archetypes by their real names. Summarize concisely.`,
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