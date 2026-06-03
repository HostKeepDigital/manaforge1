import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Daily job: promotes SetGuide records from "upcoming" to "current" once
// Scryfall reports the set as released (released_at <= today).
// It NEVER demotes a set back to "upcoming", so manual early promotions are preserved.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled (no user) execution, but if a user IS present they must be admin.
    let isScheduled = false;
    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    } catch (_e) {
      // No authenticated user -> treated as scheduled/system run.
      isScheduled = true;
    }

    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const upcomingSets = await base44.asServiceRole.entities.SetGuide.filter({ status: 'upcoming' });

    const changed = [];
    const skipped = [];
    const errors = [];

    for (const set of upcomingSets) {
      const code = (set.set_code || '').toLowerCase().trim();
      if (!code) {
        errors.push({ id: set.id, set_name: set.set_name, reason: 'missing set_code' });
        continue;
      }

      try {
        const resp = await fetch(`https://api.scryfall.com/sets/${encodeURIComponent(code)}`, {
          headers: {
            'User-Agent': 'ManaForge/1.0',
            'Accept': 'application/json',
          },
        });

        if (!resp.ok) {
          errors.push({ set_code: set.set_code, status: resp.status, reason: 'scryfall lookup failed' });
          continue;
        }

        const data = await resp.json();
        const releasedAt = data?.released_at; // YYYY-MM-DD

        if (!releasedAt) {
          skipped.push({ set_code: set.set_code, reason: 'no released_at on scryfall' });
          continue;
        }

        if (releasedAt <= todayStr) {
          await base44.asServiceRole.entities.SetGuide.update(set.id, { status: 'current' });
          changed.push({ set_code: set.set_code, set_name: set.set_name, released_at: releasedAt });
          console.log(`Promoted "${set.set_name}" (${set.set_code}) to current — Scryfall released_at ${releasedAt}`);
        } else {
          skipped.push({ set_code: set.set_code, released_at: releasedAt, reason: 'still in the future' });
        }
      } catch (err) {
        errors.push({ set_code: set.set_code, reason: err.message });
      }
    }

    console.log(
      `syncSetReleaseStatus run (${isScheduled ? 'scheduled' : 'manual'}): checked ${upcomingSets.length} upcoming, promoted ${changed.length}, skipped ${skipped.length}, errors ${errors.length}`
    );

    return Response.json({
      checked: upcomingSets.length,
      promoted: changed,
      skipped,
      errors,
      today: todayStr,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});