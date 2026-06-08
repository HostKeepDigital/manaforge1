import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, Youtube, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import ColorMultiSelect from "../components/bo1/ColorMultiSelect";
import Bo1DeckDisplay from "../components/bo1/Bo1DeckDisplay";
import { validateStandardLegality, toSavedDeck } from "@/lib/deckUtils";

export default function Bo1DeckBuilder() {
  const [colors, setColors] = useState([]);
  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState(null);

  const generateDeck = async () => {
    if (!colors.length) return;
    setLoading(true);
    setError(null);
    setDeck(null);
    setStatus("Brewing a spicy Standard deck...");

    const colorContext = `The deck's color identity MUST be limited to ONLY these colors: ${colors.join(
      ", "
    )}. Do not include cards of any other color. Only include off-color lands if absolutely necessary for mana fixing.`;

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

Requirements:
- Analyze the current meta before building.
- Do NOT copy any existing tier 1 / tier 2 / commonly played archetype.
- Combine successful mechanics and synergies from multiple meta decks into something original.
- Clear win condition and internal synergy. It should realistically win games, not just be a meme deck.
- Avoid obvious netdecks. Prioritize interesting, entertaining interactions for YouTube viewers.
- Exactly 60 cards in the main deck with a mana curve breakdown.
- Rate the deck on Competitiveness (1-10), Entertainment Value (1-10), Surprise Factor (1-10).

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
- ratings: object with integer fields competitiveness, entertainment_value, surprise_factor (each 1-10).

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

      setDeck(data);

      // Validate Standard legality, and auto-save to history only if 100% legal.
      setStatus("Verifying Standard legality...");
      try {
        const { legal } = await validateStandardLegality(data.cards);
        if (legal) {
          await base44.entities.SavedDeck.create(toSavedDeck(data, colors));
        }
      } catch {
        // If validation/save fails, keep showing the deck without saving.
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

          <Button
            onClick={generateDeck}
            disabled={!colors.length || loading}
            size="lg"
            className="w-full gap-2 font-body bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            Generate Deck
          </Button>
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