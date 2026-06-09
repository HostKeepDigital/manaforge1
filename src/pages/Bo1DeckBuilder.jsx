import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, Youtube, Loader2, Swords } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import ColorMultiSelect from "../components/bo1/ColorMultiSelect";
import Bo1DeckDisplay from "../components/bo1/Bo1DeckDisplay";
import { validateStandardLegality, toSavedDeck } from "@/lib/deckUtils";

export default function Bo1DeckBuilder() {
  const [colors, setColors] = useState([]);
  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState(null);

  const generateDeck = async (mode = "fun") => {
    if (!colors.length) return;
    setLoading(true);
    setError(null);
    setDeck(null);
    setStatus(
      mode === "competitive"
        ? "Analyzing the current meta and brewing a competitive counter-deck..."
        : "Brewing a spicy, fun Standard deck..."
    );

    const colorContext = `The deck's color identity MUST be limited to ONLY these colors: ${colors.join(
      ", "
    )}. Do not include cards of any other color. Only include off-color lands if absolutely necessary for mana fixing.`;

    // Pull the freshest live Standard meta snapshot so brews are grounded in the
    // actual current metagame (top decks, win rates, what to beat) instead of guesses.
    let metaContext = "";
    try {
      const snaps = await base44.entities.MetaKnowledge.filter(
        { format: "Standard" },
        "-researched_at",
        1
      );
      const m = snaps?.[0];
      if (m) {
        metaContext = `LIVE CURRENT STANDARD META SNAPSHOT (researched ${m.researched_at?.slice(0, 10) || "recently"} from MTGDecks, MTGTop8 & MTGGoldfish) — build WITH this, do not contradict it:

TOP ARCHETYPES:
${m.top_archetypes || "(n/a)"}

FORMAT SHAPE / WHAT TO TARGET:
${m.draft_strategies || "(n/a)"}

PRO INSIGHTS & SLEEPERS:
${m.pro_insights || "(n/a)"}

SUMMARY:
${m.summary || "(n/a)"}`;
      }
    } catch (_e) {
      metaContext = "";
    }

    const modeContext =
      mode === "competitive"
        ? `MODE: SPICY COMPETITIVE — this is the priority. The deck MUST be genuinely powerful enough to beat the current meta. Power first, spice second.
- It must be tournament-viable and realistically able to climb ranked ladder, while still being off-meta (NOT a known tier 1/tier 2 netdeck).
- USE THE BEST AVAILABLE CARDS in these colors. Do NOT use weak, cute, or "fun-but-bad" cards to force a theme. Every card must earn its slot. Include the format's premium removal, efficient threats, card advantage engines, and the strongest mana base possible (best dual/utility lands legal in Standard).
- SPEED & CURVE: be fast and proactive enough to race or disrupt the meta. Keep a tight, low curve appropriate to the archetype; do not be clunky or slow.
- ENGINEER A REAL ENGINE: build around a deeply analyzed, ACTUALLY FUNCTIONAL plan — a true infinite/lock combo, a powerful synergy/value engine, OR a tuned meta-countering tech build. It does NOT have to be a combo, but whatever the core is, it MUST actually work with real, currently-legal cards and produce a fast, repeatable, game-winning advantage. Verify the interaction is real before including it (correct card names, timing, mana, and that it isn't broken up by rotation/bans).
- COUNTER THE META: using the live meta snapshot above, identify the top 3-5 most-played decks and their key threats/removal/weaknesses, then include targeted maindeck answers and resilience so this deck preys on them.
- In key_interactions: explicitly (1) explain the engine/combo step-by-step proving it works, and (2) name WHICH meta decks this beats and exactly HOW.
- Competitiveness rating must be high ONLY if the deck genuinely earns it against THIS meta.`
        : `MODE: SPICY FUN — but still powerful.
- Creative, entertaining and surprising, built to be a blast on YouTube, with unexpected synergies and "this shouldn't work but it does" energy.
- It MUST still be genuinely strong: use the best available cards for the theme, keep a clean curve, and include a real, FUNCTIONAL engine/combo (verify it actually works with real legal cards). No win-more filler, no cards that are just bad.
- It should realistically beat real meta decks, not just be a meme. Flavor and surprise matter, but never at the cost of the deck actually working.`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        model: "gemini_3_1_pro",
        add_context_from_internet: true,
        prompt: `You are an expert Magic: The Gathering deck builder, content creator, and metagame analyst.

Your task is to create a unique, 60-card, CURRENTLY STANDARD-LEGAL Constructed deck designed specifically for YouTube content.

LEGALITY (critical):
- The deck must be 100% legal in the CURRENT MTG Arena Standard format as of ${new Date().toLocaleDateString()}.
- You may use ANY card that is currently Standard-legal (not rotated out, not from non-Standard sets).
- Do NOT include any card that is currently banned in Standard. Double-check the current Standard ban list before finalizing.

COLOR CONSTRAINT:
- ${colorContext}

${metaContext ? metaContext + "\n\n" : ""}${modeContext}

Requirements:
- Ground the build in the live meta snapshot above (if provided). Analyze the current meta before building.
- POWER IS MANDATORY: the deck must be strong enough to genuinely beat the current meta. Use the BEST currently-legal cards in these colors — premium removal, efficient threats, card-advantage engines, and the strongest legal mana base. Never include weak/cute cards just for theme.
- ENGINE MUST WORK: build around a real, deeply-analyzed core (infinite/lock combo, powerful synergy/value engine, or meta-countering tech). It need not be a combo, but it MUST actually function with real, currently-legal cards — verify the interaction (names, timing, mana) before including it.
- Do NOT copy any existing tier 1 / tier 2 / commonly played archetype — but DO use their best individual cards where correct.
- Combine successful mechanics and synergies from multiple meta decks into something original AND powerful.
- Clear win condition and tight internal synergy. It must realistically win games against meta decks, not just be a meme deck.
- Be fast/consistent: clean low-to-mid curve, no clunky filler.
- Avoid obvious netdecks. Prioritize interesting interactions for YouTube viewers — but power comes first.
- The main deck MUST contain EXACTLY 60 cards total. The sum of all "quantity" values across every entry in the cards array MUST equal exactly 60 — no more, no less. This is mandatory. Include enough lands (typically 22-25) and spells so the quantities add up to 60. Do not stop early or summarize; list every card with its full quantity.
- Rate the deck HONESTLY and SPECIFICALLY on Competitiveness (1-10), Entertainment Value (1-10), Surprise Factor (1-10). These scores MUST genuinely reflect THIS specific deck — do NOT default to similar or generic high numbers every time. Judge critically: a janky off-meta brew should usually score lower on Competitiveness than a tuned synergy deck; a straightforward deck should score lower on Surprise Factor than a true "this shouldn't work" build. Use the full 1-10 range and vary the three scores from each other where appropriate based on the deck's actual strengths and weaknesses.

Content Creator Mode — randomly select ONE concept category and briefly explain why it has potential in the current meta:
1. Meta Fusion  2. Forgotten Card Revival  3. Anti-Meta Innovation  4. Synergy Over Power
5. Hidden Combo  6. Tribal Twist  7. Colour Pie Crime  8. Graveyard Shenanigans
9. Value Engine Madness  10. "This Shouldn't Work" Challenge Deck

Goal: make viewers say "I've never seen that before, but that's actually kind of brilliant."

OUTPUT FORMAT:
- category: the exact name of the randomly chosen concept category.
- category_reason: brief explanation of why that category has potential in the current meta.
- deck_name: a catchy, YouTube-friendly deck name.
- description: a 2-3 sentence YouTube-friendly video description.
- archetype: Aggro / Midrange / Control / Combo / Tempo / etc.
- colors: array of the deck's colors (full color names).
- cards: array of exactly 60 cards as { name, quantity, type } where type is one of Creature, Instant, Sorcery, Enchantment, Artifact, Planeswalker, Land. Quantities must sum to exactly 60.
- mana_curve: object mapping mana value to the number of NON-LAND cards at that cost, keys "0","1","2","3","4","5","6","7+".
- strategy: markdown explaining the core strategy and win condition.
- key_interactions: markdown explaining the key card interactions and why the deck can compete with the current meta.
- ratings: object with integer fields competitiveness, entertainment_value, surprise_factor (each 1-10), reflecting this specific deck's real strengths/weaknesses — not generic numbers.

Use only real card names that are currently legal in Standard (or basic lands).`,
      response_json_schema: {
        type: "object",
        properties: {
          category: { type: "string" },
          category_reason: { type: "string" },
          deck_name: { type: "string" },
          description: { type: "string" },
          archetype: { type: "string" },
          colors: { type: "array", items: { type: "string" } },
          cards: {
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
          mana_curve: {
            type: "object",
            properties: {
              "0": { type: "number" },
              "1": { type: "number" },
              "2": { type: "number" },
              "3": { type: "number" },
              "4": { type: "number" },
              "5": { type: "number" },
              "6": { type: "number" },
              "7+": { type: "number" },
            },
          },
          strategy: { type: "string" },
          key_interactions: { type: "string" },
          ratings: {
            type: "object",
            properties: {
              competitiveness: { type: "number" },
              entertainment_value: { type: "number" },
              surprise_factor: { type: "number" },
            },
          },
        },
      },
    });

      // Harden parsing: response may be an object, or a string with markdown fences.
      let data = result?.response !== undefined ? result.response : result;
      if (typeof data === "string") {
        const cleaned = data.replace(/```json/gi, "").replace(/```/g, "").trim();
        try {
          data = JSON.parse(cleaned);
        } catch {
          throw new Error("AI returned malformed data, please regenerate.");
        }
      }

      if (!data || typeof data !== "object" || !Array.isArray(data.cards) || !data.cards.length) {
        throw new Error("AI returned malformed data, please regenerate.");
      }

      // Drop empty/invalid entries before counting.
      data.cards = data.cards.filter(
        (c) => c && typeof c.name === "string" && c.name.trim() && (Number(c.quantity) || 0) > 0
      );

      const totalCards = data.cards.reduce((sum, c) => sum + (Number(c.quantity) || 0), 0);
      const distinctNonLand = data.cards.filter(
        (c) => (c.type || "").toLowerCase() !== "land"
      ).length;

      // A real 60-card deck has exactly 60 cards and a meaningful spread of
      // distinct non-land cards. Reject collapsed decks like "4 Faerie + 20 Island".
      if (totalCards !== 60 || distinctNonLand < 8) {
        throw new Error(
          `The AI returned an incomplete deck (${totalCards} cards, ${distinctNonLand} distinct spells). Please hit Generate again.`
        );
      }

      setDeck(data);

      // Validate Standard legality, then always save the brew to history,
      // recording whether it passed verification.
      setStatus("Verifying Standard legality & saving...");
      let legal = false;
      try {
        ({ legal } = await validateStandardLegality(data.cards));
      } catch {
        // If Scryfall is unreachable, still save the deck (unverified).
        legal = false;
      }
      try {
        await base44.entities.SavedDeck.create({
          ...toSavedDeck(data, colors),
          verified_legal: legal,
        });
        toast.success("Brew saved to Spice History!");
      } catch (saveErr) {
        toast.error("Couldn't save this brew to history: " + (saveErr?.message || "unknown error"));
      }
    } catch (err) {
      setError(err?.message || "Something went wrong generating the deck. Please try again.");
    } finally {
      setStatus("");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-accent/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-8 sm:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="font-heading text-4xl sm:text-5xl text-foreground tracking-tight flex items-center justify-center gap-3">
            <Youtube className="w-9 h-9 text-primary" />
            Daily Spice Rack
          </h1>
          <p className="font-body text-muted-foreground text-lg mt-4 max-w-xl mx-auto">
            Your daily off-meta Standard brew. Pick your colors and AI cooks up one original, YouTube-worthy deck from the entire current Standard card pool.
          </p>
        </motion.div>

        {/* Controls */}
        <div className="bg-card rounded-xl border border-border p-5 sm:p-6 space-y-5 mb-10">
          <ColorMultiSelect selected={colors} onChange={setColors} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              onClick={() => generateDeck("fun")}
              disabled={!colors.length || loading}
              size="lg"
              className="w-full gap-2 font-body bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Spicy Fun
            </Button>
            <Button
              onClick={() => generateDeck("competitive")}
              disabled={!colors.length || loading}
              size="lg"
              className="w-full gap-2 font-body bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Swords className="w-5 h-5" />}
              Spicy Competitive
            </Button>
          </div>
          <p className="font-body text-xs text-muted-foreground text-center">
            <span className="text-accent font-semibold">Spicy Fun</span> = creative & surprising ·{" "}
            <span className="text-primary font-semibold">Spicy Competitive</span> = meta-countering & tournament-viable
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="font-body text-muted-foreground text-center">
              {status || "Brewing a spicy, original Standard-legal Bo1 deck..."}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-center">
            <p className="font-body text-destructive">{error}</p>
          </div>
        )}

        {/* Deck */}
        {deck && !loading && <Bo1DeckDisplay deck={deck} />}
      </div>
    </div>
  );
}