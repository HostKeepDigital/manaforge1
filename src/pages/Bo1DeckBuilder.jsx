import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, Youtube, Loader2, Swords, Crosshair } from "lucide-react";
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
      mode === "metaSniper"
        ? "Cross-referencing the meta snapshot to build a hard counter-deck..."
        : mode === "competitive"
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

    const metaSniperContext = `MODE: META SNIPER — a hard counter to the CURRENT top archetypes. Power and meta-hate first, spice second.
- This is a precision anti-meta deck built by directly cross-referencing the LIVE META SNAPSHOT above. If no snapshot is available, analyze the current Standard meta from the internet instead.
- STEP 1: From the snapshot, list the top 3-5 most-played archetypes RIGHT NOW, and for each one name its key threats, its win condition, and its biggest structural weakness.
- STEP 2: For EACH of those top archetypes, choose the best currently-legal cards in these colors that specifically prey on it — e.g. cheap interaction vs aggro, graveyard/exile hate vs recursion decks, enchantment/artifact removal, anti-control resilience (uncounterable threats, card advantage), lifegain vs burn, sweepers vs go-wide, etc. Prioritize cards that answer MULTIPLE top decks at once.
- STEP 3: Wrap these answers around ONE proactive, fast win condition so the deck still closes games — it must not be all reaction.
- The maindeck itself should function like a tuned sideboard against the field: every flex slot should be pointed at a real, named meta deck.
- In key_interactions, go archetype-by-archetype: name each top meta deck and list exactly which of your cards beat it and how (must be literally true under current rules).
- Competitiveness rating should be high only if it genuinely dismantles the current top decks.`;

    // Extra instruction injected on retries, listing the exact cards Scryfall
    // rejected so the AI rebuilds without them.
    let legalityFixContext = "";

    const modeContext =
      mode === "metaSniper"
        ? metaSniperContext
        : mode === "competitive"
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

    // Generate one deck and run all structural validation. Returns a clean deck object.
    const generateOnce = async () => {
      const result = await base44.integrations.Core.InvokeLLM({
        model: "gemini_3_1_pro",
        add_context_from_internet: true,
        prompt: `You are an expert Magic: The Gathering deck builder, content creator, and metagame analyst.

Your task is to create a unique, 60-card, CURRENTLY STANDARD-LEGAL Constructed deck designed specifically for YouTube content.

LEGALITY (critical):
- The deck must be 100% legal in the CURRENT MTG Arena Standard format as of ${new Date().toLocaleDateString()}.
- You may use ANY card that is currently Standard-legal (not rotated out, not from non-Standard sets).
- Do NOT include any card that is currently banned in Standard. Double-check the current Standard ban list before finalizing.
- Every card name you output MUST be the EXACT, real Oracle name of a card that currently exists and is Standard-legal. Do NOT invent card names, do NOT use rotated cards, and do NOT misremember names. If unsure whether a card is legal, do not include it.${legalityFixContext}

COLOR CONSTRAINT:
- ${colorContext}

${metaContext ? metaContext + "\n\n" : ""}${modeContext}

GRANDMASTER 5-PASS REVIEW (mandatory, do this internally before giving the final list):
- Adopt the mindset of the single greatest MTG player and deckbuilding tactician who ever lived — a Hall-of-Fame, Pro-Tour-winning master who never makes a loose deckbuilding decision.
- Build a first draft, then critique and REBUILD it 5 separate times. On each of the 5 passes, ruthlessly ask:
  1) Is EVERY card the best possible currently-legal option for its role, or is there a strictly better card? Cut weak/cute/win-more cards.
  2) Does the core engine/combo ACTUALLY work with these exact legal cards (names, timing, mana, no ban/rotation issues)? If not, fix or replace it.
  3) Is the mana base flawless — correct colors, counts, untapped early, best legal lands? Fix any awkward mana.
  4) Is the curve tight and the deck fast/consistent enough to beat the current meta's top decks? Trim clunk.
  5) Against the live meta above, does this deck have a real plan vs each top archetype? Add answers where it's weak.
- After each pass the deck must be STRICTLY BETTER than before. Keep only the final, 5x-refined version. The result must be a deck this grandmaster would confidently play in a high-stakes match "no matter what" — never a deck that simply doesn't function.

RULES ACCURACY (critical — no false claims):
- Use ONLY real, current oracle text and the current MTG comprehensive rules. Before describing any interaction, verify the exact card text and how the rules actually resolve it.
- TARGETING vs WARD/PROTECTION: if an ability or spell TARGETS, it is stopped by Ward (must pay the Ward cost) and by hexproof/protection/shroud. Do NOT claim a targeted effect like Floodpits Drowner "bypasses" or "gets around" Ward — it does not. Only non-targeting effects (e.g. board wipes, edicts, "each"/sacrifice effects) ignore Ward.
- INDESTRUCTIBLE: only bounce, exile, -X/-X, sacrifice, or "can't be blocked"-style answers get around indestructible; destroy/damage does not.
- GRAVEYARD RECURSION: only exile-based or shuffle/bounce answers truly deny recursion; "destroy" alone does not.
- Every claim in strategy/key_interactions about what the deck "beats" or "bypasses" MUST be literally true under current rules. If you are not certain an interaction works, do not include the claim. Prefer fewer, correct claims over impressive-sounding false ones.

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

      return data;
    };

    try {
      // Generate, verify every card against Scryfall, and if any card is
      // banned/rotated/illegal, re-roll the deck telling the AI exactly which
      // cards to drop. Only a fully legal deck is ever shown or saved.
      const MAX_ATTEMPTS = 3;
      let data = null;
      let illegal = [];

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        setStatus(
          attempt === 1
            ? status || "Brewing your deck..."
            : `Some cards weren't Standard-legal — rebuilding the deck (attempt ${attempt}/${MAX_ATTEMPTS})...`
        );
        data = await generateOnce();

        setStatus("Verifying every card is Standard-legal via Scryfall...");
        let result;
        try {
          result = await validateStandardLegality(data.cards);
        } catch {
          // Scryfall unreachable — we cannot verify legality, so stop and warn
          // rather than risk showing an illegal deck.
          throw new Error(
            "Couldn't reach Scryfall to verify card legality. Please try again in a moment."
          );
        }

        if (result.legal) {
          illegal = [];
          break;
        }

        illegal = result.illegal;
        // Feed the rejected cards back into the next prompt attempt.
        legalityFixContext = `\n- CRITICAL FIX: your previous attempt included cards that are NOT currently Standard-legal (banned, rotated out, or not real). You MUST NOT use any of these cards again: ${illegal.join(
          ", "
        )}. Replace them with real, currently Standard-legal alternatives.`;
        data = null;
      }

      if (!data) {
        throw new Error(
          `The AI kept including cards that aren't Standard-legal (e.g. ${illegal
            .slice(0, 4)
            .join(", ")}). Please try again or pick different colors.`
        );
      }

      setDeck(data);

      // Deck is verified legal — save it to history.
      setStatus("Saving your verified deck...");
      try {
        await base44.entities.SavedDeck.create({
          ...toSavedDeck(data, colors),
          verified_legal: true,
        });
        toast.success("Verified Standard-legal brew saved to Spice History!");
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            <Button
              onClick={() => generateDeck("metaSniper")}
              disabled={!colors.length || loading}
              size="lg"
              className="w-full gap-2 font-body bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crosshair className="w-5 h-5" />}
              Meta Sniper
            </Button>
          </div>
          <p className="font-body text-xs text-muted-foreground text-center">
            <span className="text-accent font-semibold">Spicy Fun</span> = creative & surprising ·{" "}
            <span className="text-primary font-semibold">Spicy Competitive</span> = meta-countering & tournament-viable ·{" "}
            <span className="text-destructive font-semibold">Meta Sniper</span> = hard counter to top archetypes
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