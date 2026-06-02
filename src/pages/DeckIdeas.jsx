import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lightbulb, Sparkles, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ColorPicker from "../components/deck-builder/ColorPicker";
import DeckSuggestion from "../components/deck-builder/DeckSuggestion";
import LoadingState from "../components/deck-builder/LoadingState";

const FORMATS = [
  "Standard",
  "Pioneer",
  "Modern",
  "Historic",
  "Alchemy",
  "Pauper",
  "Commander",
];

export default function DeckIdeas() {
  const [format, setFormat] = useState("Standard");
  const [colors, setColors] = useState([]);
  const [idea, setIdea] = useState("");
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

  const generate = async () => {
    if (!idea.trim()) return;
    setLoading(true);
    setError(null);
    setDeck(null);
    startLoadingAnimation();

    // Pull the latest auto-researched meta knowledge so the build reflects
    // the current sets, archetypes, and strategies.
    const knowledgeRecords = await base44.entities.MetaKnowledge.list("-researched_at", 1);
    const knowledge = knowledgeRecords?.[0];
    const metaContext = knowledge
      ? `\n\nCURRENT META KNOWLEDGE (auto-researched ${knowledge.researched_at?.split("T")[0]}):\n${knowledge.summary || ""}\n${knowledge.top_archetypes || ""}\n${knowledge.draft_strategies || ""}\n${knowledge.pro_insights || ""}`
      : "";

    const colorText = colors.length ? colors.join("") : "any colors that best fit the idea";

    const result = await base44.integrations.Core.InvokeLLM({
      model: "claude_sonnet_4_6",
      add_context_from_internet: true,
      prompt: `You are a world-class Magic: The Gathering Constructed deck builder.

Build a complete, legal, tournament-ready 60-card deck for the following request.

FORMAT: ${format}
COLORS: ${colorText}
DECK IDEA / STRATEGY: ${idea}

Requirements:
- The deck MUST contain exactly 60 cards in the main deck (counting quantities), legal in ${format}.
- Use ONLY real Magic cards that are legal in ${format}. Do not invent cards.
- Stay within the requested colors${colors.length ? ` (${colorText})` : ""}. If the idea truly needs a small splash, you may add it but keep the mana base consistent.
- Maximize SYNERGY with the stated idea — pick cards that combo, support the game plan, and reinforce the core strategy.
- Include a proper mana base: count the colored pips across all spells and run an appropriate number of lands (typically 23-26 for 60-card Constructed), distributed by pip weight. Include real nonbasic lands where helpful.
- Provide a creative deck name, the archetype, the deck's colors, the full 60-card list grouped with card types and quantities, the total land count with a one-line explanation, an example good and bad opening 7, and a markdown strategy guide (game plan, key synergies, mulligan and matchup tips).${metaContext}`,
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

    const unwrap = (r) =>
      r && r.response && typeof r.response === "object" ? r.response : r;
    const built = unwrap(result);

    if (!built?.cards?.length) {
      setError("Could not generate a deck for that idea. Try refining your description or colors.");
      setLoading(false);
      stopLoadingAnimation();
      return;
    }

    setDeck(built);
    setLoading(false);
    stopLoadingAnimation();
  };

  const reset = () => {
    setDeck(null);
    setError(null);
    setLoading(false);
    stopLoadingAnimation();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-8 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 sm:mb-12"
        >
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-foreground tracking-tight">
            Deck <span className="text-primary">Ideas</span>
          </h1>
          <p className="font-body text-muted-foreground text-lg mt-4 max-w-lg mx-auto">
            Pick a format, choose your colors, describe your idea — and get a synergistic 60-card decklist built around it.
          </p>
        </motion.div>

        <div className="space-y-8">
          {!deck && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border p-6 space-y-6"
            >
              <div className="space-y-2">
                <Label className="font-body">Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger className="font-body">
                    <SelectValue placeholder="Choose a format" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMATS.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-body">Colors</Label>
                <ColorPicker selected={colors} onChange={setColors} />
              </div>

              <div className="space-y-2">
                <Label className="font-body">Your deck idea</Label>
                <Textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="e.g. An aggressive go-wide tokens deck that floods the board and finishes with an anthem effect..."
                  className="min-h-28 font-body"
                />
              </div>

              <Button
                onClick={generate}
                disabled={!idea.trim()}
                size="lg"
                className="w-full gap-2 font-body text-base py-6 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Sparkles className="w-5 h-5" />
                Generate 60-Card Deck
              </Button>
            </motion.div>
          )}

          <AnimatePresence>
            {loading && <LoadingState step={loadingStep} />}
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-center"
            >
              <p className="font-body text-destructive">{error}</p>
            </motion.div>
          )}

          <AnimatePresence>
            {deck && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <DeckSuggestion deck={deck} />
                <div className="flex justify-center pt-4">
                  <Button onClick={reset} variant="outline" className="gap-2 font-body">
                    <RotateCcw className="w-4 h-4" />
                    New Idea
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