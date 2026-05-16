import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ImageUploader from "../components/deck-builder/ImageUploader";
import CardList from "../components/deck-builder/CardList";
import DeckSuggestion from "../components/deck-builder/DeckSuggestion";
import SynergyAnalysis from "../components/deck-builder/SynergyAnalysis";
import LoadingState from "../components/deck-builder/LoadingState";

export default function Home() {
  const [imageFile, setImageFile] = useState(null);
  const [cards, setCards] = useState(null);
  const [deck, setDeck] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

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
      prompt: `You are an expert MTG (Magic: The Gathering) card identifier specializing in reading MTG Arena screenshots.

MTG Arena displays cards in MANY formats — full card art, compact list rows with small card names in sidebars, draft deck views with stacked columns, collection grids, etc. You MUST read ALL of them.

CRITICAL INSTRUCTIONS:
- Read every piece of text in the image carefully, including small card name labels in list/sidebar views
- MTG Arena draft/deck screens show cards as TEXT ROWS in columns (e.g. "Flashback", "Mana Sculpt", "Zombify") — read ALL of these
- Look for card names in ALL columns and ALL rows, even if the text is small
- Quantities may appear as "x2", "x3", "x4" badges next to card names — capture those
- Do NOT require full card art to be visible — text list rows count as valid cards
- Common MTG Arena UI elements to read: Draft Deck panel, collection sidebar, card lists, booster pack views
- If you see a "Draft Deck" panel with card names listed, read EVERY card name from it
- Ignore UI chrome (buttons, mana symbols in headers, "Done" buttons) but read ALL card names

For each card found:
- name: exact card name as shown
- colors: array of W/U/B/R/G/C based on your MTG knowledge of the card
- type: Creature/Instant/Sorcery/Enchantment/Artifact/Planeswalker/Land
- quantity: number shown (x2, x3, x4) or 1 if not specified
- mana_cost: from your MTG knowledge (e.g. "2WW")

Be exhaustive — identify every single card visible in any form in the image.`,
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

    const identifiedCards = cardResult.cards || [];
    setCards(identifiedCards);

    if (identifiedCards.length === 0) {
      setError("No MTG cards could be identified in this image. Try a clearer screenshot from MTG Arena.");
      setLoading(false);
      stopLoadingAnimation();
      return;
    }

    setLoadingStep(2);
    const cardListText = identifiedCards
      .map((c) => `${c.quantity || 1}x ${c.name} (${c.type}, colors: ${c.colors?.join("") || "C"}, cost: ${c.mana_cost || "?"})`)
      .join("\n");

    // Step 3: Run synergy analysis AND deck building in parallel
    const [deckResult, analysisResult] = await Promise.all([
      base44.integrations.Core.InvokeLLM({
        model: "claude_sonnet_4_6",
        prompt: `You are an expert MTG deck builder and competitive player.
Given the following cards identified from an MTG Arena collection screenshot, build the BEST possible deck (60 cards for Standard, or 40 for Limited/Draft if the pool seems small).

Available cards:
${cardListText}

Build the strongest deck possible from ONLY these cards. You may include basic lands as needed.

Provide:
1. A creative deck name
2. The deck archetype (aggro, midrange, control, combo, tempo, etc.)
3. The deck's primary colors
4. The full deck list with quantities and card types grouped correctly
5. A detailed strategy guide (use markdown) explaining: how to play the deck, key combos, mulligan tips, and matchup advice

Focus on: good mana curve, card synergies, win conditions, proper land count (24 for 60-card, 17 for 40-card).`,
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
            strategy: { type: "string" },
          },
        },
      }),

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

Focus on REAL MTG synergies based on actual card mechanics. Be specific and accurate.`,
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
    ]);

    setDeck(deckResult);
    setAnalysis(analysisResult);
    setLoading(false);
    stopLoadingAnimation();
  };

  const reset = () => {
    setImageFile(null);
    setCards(null);
    setDeck(null);
    setAnalysis(null);
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
                <SynergyAnalysis analysis={analysis} />
                <DeckSuggestion deck={deck} />

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