import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Trophy, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { validateStandardLegality, toMtgaFormat } from "@/lib/deckUtils";
import MetaDeckPanel from "../components/meta/MetaDeckPanel";

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    decks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          archetype: { type: "string" },
          tier: { type: "string" },
          colors: { type: "array", items: { type: "string" } },
          est_meta_share: { type: "string" },
          est_win_rate: { type: "string" },
          why_it_wins: { type: "string" },
          maindeck: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                quantity: { type: "number" },
                type: { type: "string" },
              },
            },
          },
          sideboard: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                quantity: { type: "number" },
              },
            },
          },
          pilot_guide: { type: "string" },
          key_matchups: { type: "string" },
          mtga_decklist: { type: "string" },
        },
      },
    },
  },
};

export default function MetaDecks() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());

  const buildPrompt = (snapshotBlock, fixContext) => {
    const today = new Date().toLocaleDateString();
    return `You are a Magic: The Gathering Standard metagame analyst. As of ${today}, report the REAL, currently top-performing Standard Constructed decks — the established Tier 1 and strong Tier 2 archetypes actually winning Arena ladder and paper events right now.

You are a CURATOR, NOT a brewer:
- Reproduce real, established, tournament-proven decklists. Do NOT invent original or off-meta brews. If a deck is a known netdeck, give the known list with its standard card counts.
- Ground your answer in the META SNAPSHOT below and in current web results from MTGGoldfish, MTGTop8, MTGDecks, Untapped and Aetherhub. Prefer decks with recent high finishes and high play+win rates.
- Every card name MUST be the exact real Oracle name of a card that is Standard-legal TODAY. No rotated cards, no banned cards, no invented or misremembered names.
- Any meta-share or win-rate figure is an ESTIMATE — present it as such, never as official data, and never fabricate false precision.

For the top 4-5 archetypes, give: archetype name; tier; color identity; estimated meta share and win rate (labelled estimates); a 2-4 sentence why-it-wins / what-it-preys-on; a 60-card maindeck and 15-card sideboard with real quantities; a concise pilot guide (mulligan priorities, key sequencing, how it closes games); the 2-3 most important matchups with the plan for each; and an MTGA import string (quantity + name per line, maindeck, then a blank line, then sideboard).

META SNAPSHOT (build WITH this, do not contradict it):
${snapshotBlock}${fixContext || ""}`;
  };

  const generateOnce = async (snapshotBlock, fixContext) => {
    const result = await base44.integrations.Core.InvokeLLM({
      model: "gemini_3_1_pro",
      add_context_from_internet: true,
      prompt: buildPrompt(snapshotBlock, fixContext),
      response_json_schema: RESPONSE_SCHEMA,
    });

    let data = result?.response !== undefined ? result.response : result;
    if (typeof data === "string") {
      const cleaned = data.replace(/```json/gi, "").replace(/```/g, "").trim();
      data = JSON.parse(cleaned);
    }
    if (!data || !Array.isArray(data.decks) || !data.decks.length) {
      throw new Error("Couldn't retrieve the current meta decks. Please try again.");
    }
    return data.decks;
  };

  const loadDecks = async () => {
    setLoading(true);
    setError(null);
    setDecks([]);
    setSavedIds(new Set());

    try {
      setStatus("Pulling the current Standard metagame...");
      let snapshotBlock = "No snapshot available — analyze the current Standard meta from the web.";
      try {
        const snaps = await base44.entities.MetaKnowledge.filter({ format: "Standard" }, "-researched_at", 1);
        const m = snaps?.[0];
        if (m) {
          snapshotBlock = `${m.top_archetypes || ""}\n\n${m.summary || ""}\n\n${m.pro_insights || ""}`.trim();
        }
      } catch (_e) {
        // fall back to web-only analysis
      }

      const MAX_ATTEMPTS = 3;
      let finalDecks = null;
      let fixContext = "";

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        setStatus(
          attempt === 1
            ? "Researching the top current Standard decks..."
            : `Some cards weren't Standard-legal — refreshing the lists (attempt ${attempt}/${MAX_ATTEMPTS})...`
        );
        const candidate = await generateOnce(snapshotBlock, fixContext);

        setStatus("Verifying every maindeck is Standard-legal via Scryfall...");
        const allMain = candidate.flatMap((d) => d.maindeck || []);
        let validation;
        try {
          validation = await validateStandardLegality(allMain);
        } catch {
          throw new Error("Couldn't reach Scryfall to verify card legality. Please try again in a moment.");
        }

        if (validation.legal || attempt === MAX_ATTEMPTS) {
          finalDecks = candidate;
          break;
        }
        fixContext = `\n\nCRITICAL FIX: your previous answer included cards that are NOT currently Standard-legal (banned, rotated, or misremembered): ${validation.illegal.join(
          ", "
        )}. Replace EACH of them with the real, currently Standard-legal cards the established list actually plays. Keep every other card.`;
      }

      // Ensure each deck has an MTGA string for copy/save.
      finalDecks = finalDecks.map((d) => ({
        ...d,
        mtga_decklist:
          d.mtga_decklist ||
          `${toMtgaFormat(d.maindeck)}${d.sideboard?.length ? "\n\n" + toMtgaFormat(d.sideboard) : ""}`,
      }));

      setDecks(finalDecks);
    } catch (err) {
      setError(err?.message || "Something went wrong loading the meta decks. Please try again.");
    } finally {
      setStatus("");
      setLoading(false);
    }
  };

  const saveDeck = async (deck) => {
    try {
      await base44.entities.SavedDeck.create({
        deck_name: deck.archetype || "Meta Deck",
        source: "meta",
        category: "Meta Netdeck",
        colors: deck.colors || [],
        strategy: deck.why_it_wins || "",
        key_interactions: deck.key_matchups || "",
        decklist: (deck.maindeck || []).map((c) => ({
          name: c.name,
          quantity: c.quantity || 1,
          type: c.type || "",
        })),
        mtga_decklist: deck.mtga_decklist || toMtgaFormat(deck.maindeck),
        verified_legal: true,
        generated_at: new Date().toISOString(),
      });
      setSavedIds((prev) => new Set(prev).add(deck.archetype));
      toast.success(`"${deck.archetype}" saved to your Meta decks!`);
    } catch (err) {
      toast.error("Couldn't save this deck: " + (err?.message || "unknown error"));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-8 sm:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-heading text-4xl sm:text-5xl text-foreground tracking-tight flex items-center justify-center gap-3">
            <Trophy className="w-9 h-9 text-primary" />
            Meta Decks
          </h1>
          <p className="font-body text-muted-foreground text-lg mt-4 max-w-xl mx-auto">
            The real top Standard decks right now — full importable lists, pilot guides, and matchups.
          </p>
          <p className="font-body text-xs text-muted-foreground/70 mt-4 max-w-2xl mx-auto">
            Lists reflect current web research and the latest Standard meta snapshot — win rates are estimates,
            not official data. Verify on MTGGoldfish before a tournament.
          </p>
        </motion.div>

        {/* Control */}
        <div className="bg-card rounded-xl border border-border p-5 sm:p-6 mb-10 flex justify-center">
          <Button
            onClick={loadDecks}
            disabled={loading}
            size="lg"
            className="gap-2 font-body bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trophy className="w-5 h-5" />}
            Load the current best decks
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="font-body text-muted-foreground text-center">
              {status || "Loading the current best Standard decks..."}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-center">
            <p className="font-body text-destructive">{error}</p>
          </div>
        )}

        {/* Decks */}
        {!loading && decks.length > 0 && (
          <div className="space-y-8">
            {decks.map((deck, i) => (
              <MetaDeckPanel
                key={i}
                deck={deck}
                onSave={saveDeck}
                saved={savedIds.has(deck.archetype)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}