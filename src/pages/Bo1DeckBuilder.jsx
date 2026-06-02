import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Youtube, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Bo1DeckCard from "../components/bo1/Bo1DeckCard";

export default function Bo1DeckBuilder() {
  const [sets, setSets] = useState([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [decks, setDecks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    base44.entities.SetGuide.list("sort_order").then((records) => {
      setSets(records || []);
    });
  }, []);

  const selectedSet = sets.find((s) => s.set_code === selectedCode);

  const generateDecks = async () => {
    if (!selectedSet) return;
    setLoading(true);
    setError(null);
    setDecks(null);

    // Give Claude the set's graded card list so the decks use real, strong cards.
    const cardContext = (selectedSet.cards || [])
      .map((c) => `${c.name} (${c.grade || "?"}, ${c.type || "?"}, ${(c.colors || []).join("") || "C"})`)
      .join("\n");

    const result = await base44.integrations.Core.InvokeLLM({
      model: "claude_sonnet_4_6",
      prompt: `You are an expert Magic: The Gathering content creator and Standard deck builder who makes fun, creative, YouTube-worthy Best-of-One (Bo1) Standard decks.

Build exactly 3 DIFFERENT, creative, fun Bo1 Standard decklists themed around the set "${selectedSet.set_name}" (${selectedSet.set_code}). Each deck must highlight that set's key cards, mechanics, and themes while remaining legal and competitive in current Standard.

${cardContext ? `KEY CARDS / THEMES FROM ${selectedSet.set_name} (use the best of these as the deck's identity):\n${cardContext}\n` : ""}

Requirements for EACH of the 3 decks:
- A catchy, YouTube-friendly deck name (clickable, fun, e.g. "Mono-Red Goblin EXPLOSION!!!").
- A short 2-3 sentence description that would work great as a YouTube video description, hyping the deck up.
- The archetype (Aggro, Midrange, Control, Combo, Tempo, etc.).
- The color identity (array of colors used, e.g. ["Red", "White"]).
- A complete 60-card Standard decklist as an array of { name, quantity }. The quantities MUST sum to exactly 60, including lands. Use ~23-26 lands appropriate to the curve, count colored pips for the mana base, and run a sensible number of each spell (max 4 of any non-basic card).

Make the 3 decks meaningfully different from each other (different archetypes/colors/strategies) so they're all worth featuring in a video. Optimize them around ${selectedSet.set_name}'s standout cards and themes. Use only real card names.`,
      response_json_schema: {
        type: "object",
        properties: {
          decks: {
            type: "array",
            items: {
              type: "object",
              properties: {
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
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const data = result?.response && typeof result.response === "object" ? result.response : result;
    const generated = data?.decks || [];

    if (!generated.length) {
      setError("Could not generate decks. Please try again.");
    } else {
      setDecks(generated);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-accent/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-8 sm:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="font-heading text-4xl sm:text-5xl text-foreground tracking-tight flex items-center justify-center gap-3">
            <Youtube className="w-9 h-9 text-primary" />
            Bo1 Deck Builder
          </h1>
          <p className="font-body text-muted-foreground text-lg mt-4 max-w-xl mx-auto">
            Pick a Standard set and let AI craft 3 fun, YouTube-worthy Best-of-One decklists themed around it.
          </p>
        </motion.div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-center gap-3 mb-10 max-w-2xl mx-auto">
          <div className="flex-1 space-y-2">
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
          <Button
            onClick={generateDecks}
            disabled={!selectedCode || loading}
            size="lg"
            className="gap-2 font-body bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            Generate Decks
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="font-body text-muted-foreground">
              Brewing 3 spicy Bo1 decks around {selectedSet?.set_name}...
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-center max-w-xl mx-auto">
            <p className="font-body text-destructive">{error}</p>
          </div>
        )}

        {/* Decks */}
        <AnimatePresence>
          {decks && !loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {decks.map((deck, i) => (
                <Bo1DeckCard key={i} deck={deck} />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}