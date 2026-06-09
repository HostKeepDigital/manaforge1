import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ImageUploader from "../components/deck-builder/ImageUploader";
import CardList from "../components/deck-builder/CardList";
import DeckSuggestion from "../components/deck-builder/DeckSuggestion";
import DeckRefiner from "../components/deck-builder/DeckRefiner";
import SynergyAnalysis from "../components/deck-builder/SynergyAnalysis";
import WinRatePotential from "../components/deck-builder/WinRatePotential";
import LoadingState from "../components/deck-builder/LoadingState";

// Builds (or rebuilds) the deck from a card pool. `refinement` carries any
// extra user ideas so the suggestion can be iterated after the first build.
function buildDeck(cardListText, metaContext, refinement) {
  const refinementContext = refinement
    ? `\n\nUSER REFINEMENT — the user has reviewed the first build and wants these changes applied. Honor them while keeping the deck legal and well-constructed:\n${refinement}`
    : "";

  return base44.integrations.Core.InvokeLLM({
    model: "claude_sonnet_4_6",
    prompt: `You are an expert MTG deck builder and competitive player.
Given the following cards identified from an MTG Arena collection screenshot, build the BEST possible deck (60 cards for Standard, or 40-42 cards for Limited/Draft if the pool seems small — 40 is the minimum, but 41-42 is fine if an extra strong playable earns its slot).

Available cards:
${cardListText}

Build the strongest deck possible from ONLY these cards. You may include basic lands (Plains, Island, Swamp, Mountain, Forest) as needed.

CRITICAL DECK COMPOSITION RULES (this is a 40-42 card Limited/Draft deck unless the pool is clearly a full 60-card Standard collection — default to 40, allow up to 42):

For a 40-42 card Limited deck, the composition MUST be:
- CREATURES: 14-17 creatures. This is the most important rule — Limited is won primarily through creatures/board presence. Aim for ~15-16. NEVER build a creature-light deck; if the pool is short on creatures, run the maximum available rather than padding with spells.
- NON-CREATURE SPELLS: the remaining ~6-9 slots (removal, combat tricks, card advantage). These support the creatures, they do not replace them.
- LANDS: 16-17 lands (17 is standard for most decks, 16 only for a low/aggressive curve). NEVER fewer than 16 and NEVER more than 18.
- These add up to 40-42: e.g. 16 creatures + 7 spells + 17 lands = 40, or 17 creatures + 8 spells + 17 lands = 42. Keep lands at 16-17 even at 42 cards.

For a 60-card Standard deck: ~24 lands (23-26), and still favor a healthy creature count for the archetype.

PIP COUNTING — build the mana base by counting colored mana symbols (pips), NOT just by color count:
- Go through every spell in the deck and tally the colored pips per color (e.g. a card costing 1WW = 2 white pips; count every copy).
- Distribute the 16-17 lands proportionally to the pip totals of each color. A color with far more pips gets far more sources; a tiny splash gets only a few sources.
- Roughly: a main color needs ~9-10 sources, a secondary color ~7-8, a light splash ~3-4. Heavy double-pip costs (e.g. WW, GG) demand MORE sources of that color.
- Prefer two colors. Only go three colors if the pips and any fixing genuinely support it.

The "cards" array MUST include the lands as entries with type "Land" and their quantities (e.g. {"name":"Plains","quantity":9,"type":"Land"}), and the basic land split MUST reflect the pip counts above. Never return a deck with zero lands, fewer than 14 creatures, or land counts outside the ranges above.

Provide:
1. A creative deck name
2. The deck archetype (aggro, midrange, control, combo, tempo, etc.)
3. The deck's primary colors
4. The full deck list with quantities and card types grouped correctly
5. The TOTAL number of lands in the deck (land_count) and a one-line explanation that states the creature count, spell count, and how the basic-land split was chosen from the colored pip counts
6. An example GOOD opening 7-card hand: list 7 cards that represent an ideal keepable hand (right land count, castable early plays, a clear game plan) plus a one-line explanation of why it's strong
7. An example BAD opening 7-card hand: list 7 cards that represent a hand you should mulligan (e.g. too few/too many lands, uncastable cards, no early plays) plus a one-line explanation of why it's weak
8. A detailed strategy guide (use markdown) explaining: how to play the deck, key combos, mulligan tips, and matchup advice

ARCHETYPE SYNERGY PRIORITY (very important): First determine the deck's core strategy from the available cards, then prioritize cards that actively reinforce THAT archetype's synergies, not just generically good cards:
- AGGRO / GO-WIDE: prioritize cards that buff each other (anthem effects, +1/+1 lords, team pumps), creatures that reward attacking (raid, battle cries, "whenever this attacks" triggers, exert), and low-curve evasive threats. Pick creatures that benefit from or enable other creatures attacking.
- MECHANIC-DRIVEN ARCHETYPES: if the pool leans on a specific keyword/mechanic (e.g. TMNT's "Sneak", ninjutsu, prowess, convoke, +1/+1 counters, sacrifice, mill, lifegain, artifacts, etc.), prioritize the cards that trigger, enable, or pay off that exact mechanic so the pieces chain together.
- MIDRANGE/CONTROL: prioritize value creatures, efficient removal, and card-advantage engines that fit the game plan.
Always favor a card that combos with the rest of the deck over a slightly stronger but isolated card. The goal is a cohesive, synergistic deck around its detected archetype.

Focus on: a creature-centric build (14-17 creatures in 40-card Limited), a smooth low curve, card synergies, clear win conditions, a pip-weighted mana base, and 16-17 lands (never 22). Following Limited best practice taught by pros like Paul Cheon and other expert drafters: creatures win games, count your pips, and run 16-17 lands.${refinementContext}${metaContext}`,
    response_json_schema: {
      type: "object",
      properties: {
        deck_name: { type: "string" },
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
        land_count: { type: "number" },
        land_count_explanation: { type: "string" },
        good_opening_hand: {
          type: "object",
          properties: {
            cards: { type: "array", items: { type: "string" } },
            explanation: { type: "string" },
          },
        },
        bad_opening_hand: {
          type: "object",
          properties: {
            cards: { type: "array", items: { type: "string" } },
            explanation: { type: "string" },
          },
        },
        strategy: { type: "string" },
      },
    },
  });
}

export default function DeckBuilder() {
  const [imageFile, setImageFile] = useState(null);
  const [cards, setCards] = useState(null);
  const [deck, setDeck] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [winRate, setWinRate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);
  const [refining, setRefining] = useState(false);
  const intervalRef = useRef(null);

  // Holds the card pool + meta context so the deck can be re-built when the
  // user refines it with further ideas.
  const buildContextRef = useRef(null);

  const startLoadingAnimation = () => {
    setLoadingStep(0);
    intervalRef.current = setInterval(() => {
      setLoadingStep((prev) => Math.min(prev + 1, 4));
    }, 3000);
  };

  const stopLoadingAnimation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleImageSelected = (file) => {
    setImageFile(file);
    setCards(null);
    setDeck(null);
    setAnalysis(null);
    setWinRate(null);
    setError(null);
  };

  const analyzeAndBuild = async () => {
    if (!imageFile) return;
    setLoading(true);
    setError(null);
    startLoadingAnimation();

    // Step 1: Upload the image
    const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });

    // Step 2: Identify cards from the image
    setLoadingStep(1);
    const cardResult = await base44.integrations.Core.InvokeLLM({
      model: "claude_sonnet_4_6",
      prompt: `You are reading an MTG Arena deck screenshot. I can see this is a DECK VIEW showing stacked card columns.

TASK: Read and list EVERY single card name you can see in this image. This is purely a text-reading exercise.

HOW TO READ THE IMAGE:
The deck is shown in vertical columns of stacked cards. In each column:
- Most cards show ONLY their name banner (a rectangular label at the top of the card)
- The bottom card of each stack shows the full card art
- Look for text in gold/yellow bordered name bars on each card
- Quantity badges show as "x2", "x3" etc on stacked groups

SCAN THE IMAGE SYSTEMATICALLY:
1. Start at the leftmost column, read each card name from TOP to BOTTOM
2. Move to the next column, read top to bottom
3. Continue through ALL columns to the right
4. The rightmost columns are usually lands with large quantity badges like x8, x9

CRITICAL — RECOGNISING LANDS BY THEIR ART (they often have NO visible name banner):
Basic lands frequently appear as full art with only a small mana symbol in the corner and a quantity badge. You MUST identify them by their artwork and mana symbol, NOT just text:
- PLAINS: white/golden plains, fields, deserts, white sun mana symbol (W). Name it "Plains".
- ISLAND: blue water, oceans, islands, blue water-drop mana symbol (U). Name it "Island".
- SWAMP: black swamps, dark marshes, skull/black mana symbol (B). Name it "Swamp".
- MOUNTAIN: red mountains, volcanoes, fire, red mana symbol (R). Name it "Mountain".
- FOREST: green forests, trees, nature, green tree mana symbol (G). Name it "Forest".
- Non-basic/dual lands: read their name banner normally (e.g. "Plaza of Heroes", "Brushland").
You MUST include EVERY land you see, using the quantity badge for the count. Do not skip lands just because they have no name text — match them by art + mana symbol.

WHAT CARD NAMES LOOK LIKE in this UI:
- They are written in a serif or stylized font on a dark/colored name plate
- Examples of what you'll see: "Defiant Strike", "Guiding Voice", "Star Pupil", "Shadewing Laureate", "Blot Out the Sky", "Plains", "Swamp"
- Every text label on a card IS a card name — read ALL of them

CRITICAL: This image CLEARLY contains MTG cards. Do NOT return an empty list. Read every name label visible in the image. If you can see text on a card frame, that is a card name — include it.

For each card found:
- name: exactly as written in the name banner
- quantity: the x-number badge if present, otherwise 1
- type: Creature/Instant/Sorcery/Enchantment/Artifact/Land/Planeswalker (use your MTG knowledge)
- colors: W/U/B/R/G/C array
- mana_cost: from your MTG knowledge`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          cards: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                colors: { type: "array", items: { type: "string" } },
                type: { type: "string" },
                quantity: { type: "number" },
                mana_cost: { type: "string" },
              },
            },
          },
        },
      },
    });

    const identifiedCards = cardResult.cards || cardResult.response?.cards || [];
    setCards(identifiedCards);

    if (identifiedCards.length === 0) {
      setError("No MTG cards could be identified. Please upload a direct screenshot from MTG Arena (not a photo of your screen). Make sure the deck or card view is clearly visible.");
      setLoading(false);
      stopLoadingAnimation();
      return;
    }

    setLoadingStep(2);
    const cardListText = identifiedCards
      .map((c) => `${c.quantity || 1}x ${c.name} (${c.type}, colors: ${c.colors?.join("") || "C"}, cost: ${c.mana_cost || "?"})`)
      .join("\n");

    // Pull the latest auto-researched meta knowledge snapshot so every build
    // reflects current sets, Pro Tour drafts, and evolving strategies.
    const knowledgeRecords = await base44.entities.MetaKnowledge.list("-researched_at", 1);
    const knowledge = knowledgeRecords?.[0];

    // The full per-set breakdowns are stored as an uploaded markdown file; fetch its contents.
    let setBreakdowns = "";
    if (knowledge?.set_breakdowns_url) {
      const res = await fetch(knowledge.set_breakdowns_url);
      if (res.ok) setBreakdowns = await res.text();
    }

    const metaContext = knowledge
      ? `\n\nCURRENT META KNOWLEDGE (auto-researched ${knowledge.researched_at?.split("T")[0]}, use this to stay up to date with the latest sets and strategies):\n${knowledge.summary || ""}\n${knowledge.draft_strategies || ""}\n${knowledge.pro_insights || ""}\n\nINDIVIDUAL SET BREAKDOWNS (use the relevant set's mechanics, archetypes, and key cards when building):\n${setBreakdowns}`
      : "";

    // Save the build context so refinements can re-run the deck builder.
    buildContextRef.current = { cardListText, metaContext };

    // Step 3: Run synergy analysis, deck building, AND win rate analysis in parallel
    const [deckResult, analysisResult, winRateResult] = await Promise.all([
      buildDeck(cardListText, metaContext, ""),

      base44.integrations.Core.InvokeLLM({
        model: "claude_sonnet_4_6",
        prompt: `You are a world-class MTG competitive analyst specializing in meta archetypes and card synergies.

Analyze this collection of Magic: The Gathering cards and provide a deep synergy & archetype analysis:

Available cards:
${cardListText}

Your analysis must cover:

1. META ARCHETYPES: Identify the top 3-5 meta archetypes (e.g. Azorius Soldiers, Rakdos Midrange, Domain Ramp, Mono-Red Aggro, Esper Midrange, etc.) that this collection supports. For each archetype:
   - Name the archetype
   - Match percentage (0-100) based on how many key cards are present
   - Tier rating: S, A, B, C, or D based on current competitive meta AND available cards
   - Playstyle description (one sentence)
   - Longer description explaining why this archetype fits the cards
   - Key cards from the collection that enable this archetype
   - Important missing cards that would complete the archetype
   - The primary win condition

2. SYNERGY COMBOS: Identify 4-8 specific high-value card synergy combinations from the available cards. For each combo:
   - List the 2-4 cards involved
   - A brief summary (one line)
   - A detailed explanation of how the synergy works mechanically
   - How to set up and use the combo effectively
   - Synergy score from 1-5 (5 = game-winning combo)

3. COLLECTION POWER: Rate the overall collection power (S/A/B/C/D tier) and give a brief summary.

Focus on REAL MTG synergies based on actual card mechanics. Be specific and accurate.${metaContext}`,
        response_json_schema: {
          type: "object",
          properties: {
            collection_power_rating: { type: "string" },
            collection_power_summary: { type: "string" },
            archetypes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  match_percentage: { type: "number" },
                  tier: { type: "string" },
                  playstyle: { type: "string" },
                  description: { type: "string" },
                  key_cards_present: { type: "array", items: { type: "string" } },
                  missing_key_cards: { type: "array", items: { type: "string" } },
                  win_condition: { type: "string" },
                },
              },
            },
            synergy_combos: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  cards: { type: "array", items: { type: "string" } },
                  summary: { type: "string" },
                  explanation: { type: "string" },
                  how_to_use: { type: "string" },
                  synergy_score: { type: "number" },
                },
              },
            },
          },
        },
      }),

      base44.integrations.Core.InvokeLLM({
        model: "claude_sonnet_4_6",
        prompt: `You are an expert MTG deck evaluator. Analyze the following deck card list and predict its win rate potential.

Deck cards:
${cardListText}

Evaluate three specific dimensions:

1. MANA CURVE (score 0-100): Is the curve smooth and appropriate for the archetype? Too many high-cost cards = low score. Good low-to-mid curve = high score.

2. REMOVAL/CREATURE RATIO (score 0-100): What is the balance between removal spells (kill spells, counters, bounce) and creatures? Pure creature flood or pure removal with no threats both score low. A healthy mix scores high.

3. COLOR CONSISTENCY (score 0-100): How many colors are being used? Single color = near 100. Two colors = 70-90 depending on curve. Three+ colors without fixing = much lower. Consider whether the mana requirements are realistic.

Then give:
- An overall letter rating: S (>75%), A (65-75%), B (50-65%), C (35-50%), D (<35%)
- An estimated win rate percentage (0-100) based on the above
- A one-paragraph summary of the deck's strengths and weaknesses
- 2-4 specific, actionable recommendations to improve win rate`,
        response_json_schema: {
          type: "object",
          properties: {
            overall_rating: { type: "string" },
            estimated_win_rate: { type: "number" },
            summary: { type: "string" },
            mana_curve_score: { type: "number" },
            mana_curve_detail: { type: "string" },
            removal_ratio_score: { type: "number" },
            removal_ratio_detail: { type: "string" },
            color_consistency_score: { type: "number" },
            color_consistency_detail: { type: "string" },
            recommendations: { type: "array", items: { type: "string" } },
          },
        },
      }),
    ]);

    // The LLM occasionally nests the structured output under a `response` key.
    // Unwrap it so the deck, analysis, and win-rate render correctly.
    const unwrap = (result) =>
      result && result.response && typeof result.response === "object"
        ? result.response
        : result;

    setDeck(unwrap(deckResult));
    setAnalysis(unwrap(analysisResult));
    setWinRate(unwrap(winRateResult));
    setLoading(false);
    stopLoadingAnimation();
  };

  const refineDeck = async (refinement) => {
    if (!refinement?.trim() || !buildContextRef.current) return;
    setRefining(true);
    const { cardListText, metaContext } = buildContextRef.current;
    const result = await buildDeck(cardListText, metaContext, refinement);
    const refined =
      result && result.response && typeof result.response === "object"
        ? result.response
        : result;
    if (refined?.cards?.length) setDeck(refined);
    setRefining(false);
  };

  const reset = () => {
    setImageFile(null);
    setCards(null);
    setDeck(null);
    setAnalysis(null);
    setWinRate(null);
    setError(null);
    setLoading(false);
    stopLoadingAnimation();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-8 sm:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 sm:mb-16"
        >
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-foreground tracking-tight">
            Arena <span className="text-primary">Deck</span> Builder
          </h1>
          <p className="font-body text-muted-foreground text-lg mt-4 max-w-lg mx-auto">
            Upload a screenshot from MTG Arena. AI identifies your cards, matches meta archetypes, finds synergy combos, and builds your perfect deck.
          </p>
        </motion.div>

        {/* Main content */}
        <div className="space-y-8">
          {/* Upload area */}
          <ImageUploader
            onImageSelected={handleImageSelected}
            isProcessing={loading}
          />

          {/* Action buttons */}
          {imageFile && !loading && !deck && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center"
            >
              <Button
                onClick={analyzeAndBuild}
                size="lg"
                className="gap-2 font-body text-base px-8 py-6 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Sparkles className="w-5 h-5" />
                Analyze & Build Deck
              </Button>
            </motion.div>
          )}

          {/* Loading */}
          <AnimatePresence>
            {loading && <LoadingState step={loadingStep} />}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-center"
            >
              <p className="font-body text-destructive">{error}</p>
            </motion.div>
          )}

          {/* Results */}
          <AnimatePresence>
            {cards && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <CardList cards={cards} />
                <WinRatePotential winRate={winRate} />
                <SynergyAnalysis analysis={analysis} />
                <div className="space-y-2">
                  <h2 className="font-heading text-2xl text-foreground">
                    Here is your most optimal deck out of these cards
                  </h2>
                  <p className="font-body text-sm text-muted-foreground">
                    Below: the recommended build, its land count, and an example of a good vs. a bad opening 7-card hand.
                  </p>
                </div>
                <DeckSuggestion deck={deck} />

                <DeckRefiner onRefine={refineDeck} isRefining={refining} />

                <div className="flex justify-center pt-4">
                  <Button
                    onClick={reset}
                    variant="outline"
                    className="gap-2 font-body"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Try Another Screenshot
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}