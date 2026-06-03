import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Youtube, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import ColorMultiSelect from "../components/bo1/ColorMultiSelect";
import Bo1DeckDisplay from "../components/bo1/Bo1DeckDisplay";

export default function Bo1DeckBuilder() {
  const [sets, setSets] = useState([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [colors, setColors] = useState([]);
  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    base44.entities.SetGuide.list("sort_order").then((records) => {
      setSets(records || []);
    });
  }, []);

  const selectedSet = sets.find((s) => s.set_code === selectedCode);

  const generateDeck = async () => {
    if (!selectedSet) return;
    setLoading(true);
    setError(null);
    setDeck(null);

    const cardContext = (selectedSet.cards || [])
      .map((c) => `${c.name} (${c.grade || "?"}, ${c.type || "?"}, ${(c.colors || []).join("") || "C"})`)
      .join("\n");

    const colorContext = colors.length
      ? `\n\nCOLOR CONSTRAINT — the deck's color identity MUST be limited to ONLY these colors: ${colors.join(", ")}. Do not include cards of any other color. Only include off-color lands if absolutely necessary for mana fixing.`
      : "";

    const result = await base44.integrations.Core.InvokeLLM({
      model: "claude_sonnet_4_6",
      prompt: `You are an expert Magic: The Gathering deck builder, content creator, and metagame analyst.

Your task is to create a unique 60-card Constructed deck designed specifically for YouTube content.

Requirements:
- The deck must be legal in the format and set specified by the user.
- Analyze the current meta before building.
- Do NOT give a copy of any existing tier 1, tier 2, or commonly played archetype.
- Instead, identify successful mechanics, synergies, and strategies from multiple meta decks and combine them into something original.
- The deck should have a clear win condition and internal synergy.
- The deck should feel like something that could realistically win games, not just a meme deck.
- Avoid obvious netdecks and avoid simply changing a few cards from a known list.
- Prioritize interesting interactions that create entertaining gameplay for YouTube viewers.
- Include exactly 60 cards in the main deck and provide a mana curve breakdown.
- Explain the core strategy, key card interactions, and why you believe the deck could compete against the current meta.
- Rate the deck on: Competitiveness (1-10), Entertainment Value (1-10), Surprise Factor (1-10).

Additional Content Creator Mode:
Before building, randomly select ONE of the following deck concept categories and briefly explain why it has potential in the current meta:
1. Meta Fusion (combine 2-3 meta archetypes into one deck)
2. Forgotten Card Revival (build around an overlooked card)
3. Anti-Meta Innovation (specifically attacks the current meta)
4. Synergy Over Power (focus on unusual card interactions)
5. Hidden Combo (a combo that is rarely seen)
6. Tribal Twist (unusual tribe with a competitive shell)
7. Colour Pie Crime (colours doing things they normally don't do)
8. Graveyard Shenanigans
9. Value Engine Madness
10. "This Shouldn't Work" Challenge Deck

The goal is to create a deck that makes viewers say: "I've never seen that before, but that's actually kind of brilliant."

USER SETTINGS:
- Format/Set focus: Standard, themed around and highlighting the key cards & mechanics of "${selectedSet.set_name}" (${selectedSet.set_code}).${colorContext}

${cardContext ? `KEY CARDS / THEMES FROM ${selectedSet.set_name} (lean on the best of these for the deck's identity):\n${cardContext}\n` : ""}

OUTPUT FORMAT:
- category: the exact name of the randomly chosen concept category from the list above.
- category_reason: a brief explanation of why that category has potential in the current meta.
- deck_name: a catchy, YouTube-friendly deck name.
- description: a 2-3 sentence YouTube-friendly video description.
- archetype: Aggro / Midrange / Control / Combo / Tempo / etc.
- colors: array of the deck's colors (full color names).
- cards: array of exactly 60 cards as { name, quantity, type } where type is one of Creature, Instant, Sorcery, Enchantment, Artifact, Planeswalker, Land. Quantities must sum to exactly 60.
- mana_curve: an object mapping mana value to the number of NON-LAND cards at that cost, with keys "0","1","2","3","4","5","6","7+".
- strategy: markdown explaining the core strategy and win condition.
- key_interactions: markdown explaining the key card interactions and why the deck can compete with the current meta.
- ratings: object with integer fields competitiveness, entertainment_value, surprise_factor (each 1-10).

Use only real card names.`,
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

    const data = result?.response && typeof result.response === "object" ? result.response : result;
    if (!data?.cards?.length) {
      setError("Could not generate a deck. Please try again.");
    } else {
      setDeck(data);
    }
    setLoading(false);
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
            Your daily off-meta Standard brew. Pick your colors and AI cooks up one original, YouTube-worthy deck.
          </p>
        </motion.div>

        {/* Controls */}
        <div className="bg-card rounded-xl border border-border p-5 sm:p-6 space-y-5 mb-10">
          <div className="space-y-2">
            <label className="font-body text-sm text-muted-foreground">Choose a set</label>
            <Select value={selectedCode} onValueChange={setSelectedCode}>
              <SelectTrigger className="font-body">
                <SelectValue placeholder="Select a Standard set..." />
              </SelectTrigger>
              <SelectContent>
                {sets.map((s) => (
                  <SelectItem key={s.set_code} value={s.set_code}>
                    {s.set_name} ({s.set_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ColorMultiSelect selected={colors} onChange={setColors} />

          <Button
            onClick={generateDeck}
            disabled={!selectedCode || loading}
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
              Brewing a spicy, original Bo1 deck around {selectedSet?.set_name}...
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