import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ImageUploader from "../components/deck-builder/ImageUploader";
import CardList from "../components/deck-builder/CardList";
import DeckSuggestion from "../components/deck-builder/DeckSuggestion";
import LoadingState from "../components/deck-builder/LoadingState";

export default function Home() {
  const [imageFile, setImageFile] = useState(null);
  const [cards, setCards] = useState(null);
  const [deck, setDeck] = useState(null);
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
      prompt: `You are an expert MTG (Magic: The Gathering) card identifier. 
Analyze this screenshot from MTG Arena and identify ALL visible Magic: The Gathering cards.
For each card, provide:
- The exact card name
- The card colors (W=White, U=Blue, B=Black, R=Red, G=Green, C=Colorless)
- The card type (Creature, Instant, Sorcery, Enchantment, Artifact, Planeswalker, Land)
- The quantity visible (default 1 if unclear)
- The mana cost as a string (e.g. "2WW")

Be as thorough as possible. List every card you can identify from the image.`,
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

    // Step 3: Build the best deck
    setLoadingStep(3);
    const cardListText = identifiedCards
      .map((c) => `${c.quantity || 1}x ${c.name} (${c.type}, ${c.colors?.join("")}, ${c.mana_cost})`)
      .join("\n");

    const deckResult = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert MTG deck builder and competitive player.
Given the following cards identified from an MTG Arena collection screenshot, build the BEST possible deck (60 cards for Standard, or 40 for Limited/Draft if the pool seems small).

Available cards:
${cardListText}

Build the strongest deck possible from ONLY these cards. You may include basic lands as needed.

Provide:
1. A creative deck name
2. The deck archetype (aggro, midrange, control, combo, tempo, etc.)
3. The deck's primary colors
4. The full deck list with quantities and card types
5. A detailed strategy guide explaining how to play the deck, key combos, mulligan tips, and matchup advice

Focus on:
- Good mana curve
- Card synergies
- Win conditions
- Proper land count (typically 24 for 60-card, 17 for 40-card)`,
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
    });

    setDeck(deckResult);
    setLoading(false);
    stopLoadingAnimation();
  };

  const reset = () => {
    setImageFile(null);
    setCards(null);
    setDeck(null);
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
            Upload a screenshot from MTG Arena and let AI craft the perfect deck from your collection.
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