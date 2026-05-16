import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Sparkles, RotateCcw, Star, ChevronDown, ChevronUp, Trophy } from "lucide-react";
import ImageUploader from "../components/deck-builder/ImageUploader";
import LoadingState from "../components/deck-builder/LoadingState";

const GRADE_COLORS = {
  "A+": "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
  A: "text-green-400 border-green-400/40 bg-green-400/10",
  "A-": "text-green-400 border-green-400/40 bg-green-400/10",
  "B+": "text-blue-400 border-blue-400/40 bg-blue-400/10",
  B: "text-blue-400 border-blue-400/40 bg-blue-400/10",
  "B-": "text-blue-400 border-blue-400/40 bg-blue-400/10",
  C: "text-orange-400 border-orange-400/40 bg-orange-400/10",
  D: "text-red-400 border-red-400/40 bg-red-400/10",
  F: "text-red-500 border-red-500/40 bg-red-500/10",
};

function CardRating({ card, index, isTopPick }) {
  const [open, setOpen] = useState(false);
  const gradeStyle = GRADE_COLORS[card.grade] || "text-muted-foreground border-border bg-secondary/30";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-xl border overflow-hidden ${isTopPick ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-3 hover:bg-secondary/20 transition-colors text-left"
      >
        {isTopPick && <Trophy className="w-4 h-4 text-primary shrink-0" />}
        <span className={`text-xs font-heading font-bold px-2 py-1 rounded-md border shrink-0 ${gradeStyle}`}>
          {card.grade}
        </span>
        <span className="font-body font-medium text-foreground text-sm flex-1 truncate">{card.name}</span>
        <span className="text-xs text-muted-foreground font-body shrink-0 mr-1">{card.card_type}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-1.5 border-t border-border/50">
          <p className="text-sm font-body text-foreground/80 mt-2">{card.reasoning}</p>
          {card.synergy_note && (
            <p className="text-xs font-body text-muted-foreground italic">🔗 {card.synergy_note}</p>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function DraftAssistant() {
  const [imageFile, setImageFile] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [optimalDeck, setOptimalDeck] = useState(null);
  const [pickedCards, setPickedCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("pack"); // "pack" | "pool"

  const analyze = async () => {
    if (!imageFile) return;
    setLoading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });

    if (mode === "pack") {
      const result = await base44.integrations.Core.InvokeLLM({
        model: "claude_sonnet_4_6",
        prompt: `You are an expert MTG draft advisor like Draftsmith or Arena Tutor.

Analyze this MTG Arena draft pack screenshot. Identify every card in the pack and rate each one.

Already picked cards (consider synergy): ${pickedCards.join(", ") || "none yet"}

For each card in the pack provide:
- Exact card name
- Card type (Creature/Instant/Sorcery/etc)
- Grade: A+, A, A-, B+, B, B-, C, D, or F
- Reasoning: 1-2 sentences explaining the grade considering power level, format role, and synergy with already-picked cards
- Synergy note: if it synergizes with already-picked cards, explain how (optional)

Also identify the single best pick and explain why.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            pack_cards: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  card_type: { type: "string" },
                  grade: { type: "string" },
                  reasoning: { type: "string" },
                  synergy_note: { type: "string" },
                },
              },
            },
            best_pick: { type: "string" },
            best_pick_reason: { type: "string" },
          },
        },
      });
      setRatings(result);
    } else {
      // Pool → build deck
      const result = await base44.integrations.Core.InvokeLLM({
        model: "claude_sonnet_4_6",
        prompt: `You are an expert MTG limited deck builder. Analyze this draft pool screenshot and build the optimal 40-card limited deck.

Identify all cards, pick the best 22-23 non-land cards + 17-18 lands, and explain the deck strategy.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            deck_name: { type: "string" },
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
            key_cards: { type: "array", items: { type: "string" } },
          },
        },
      });
      setOptimalDeck(result);
    }
    setLoading(false);
  };

  const addToPicked = (name) => {
    if (!pickedCards.includes(name)) {
      setPickedCards([...pickedCards, name]);
    }
  };

  const reset = () => {
    setImageFile(null);
    setRatings(null);
    setOptimalDeck(null);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
      </div>
      <div className="relative max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="font-heading text-3xl text-foreground">Draft Assistant</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            Upload a pack screenshot for AI card ratings, or your full pool to auto-build the optimal deck.
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 bg-secondary/50 rounded-lg p-1 mb-6 w-fit">
          {["pack", "pool"].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setRatings(null); setOptimalDeck(null); }}
              className={`px-4 py-2 rounded-md text-sm font-body font-medium transition-all capitalize
                ${mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {m === "pack" ? "Rate Pack" : "Build from Pool"}
            </button>
          ))}
        </div>

        {/* Picked cards bar */}
        {mode === "pack" && pickedCards.length > 0 && (
          <div className="mb-4 p-3 bg-card rounded-xl border border-border">
            <p className="text-xs text-muted-foreground font-body mb-2">Already picked ({pickedCards.length}):</p>
            <div className="flex flex-wrap gap-1.5">
              {pickedCards.map((c, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="font-body text-xs cursor-pointer hover:bg-destructive/20"
                  onClick={() => setPickedCards(pickedCards.filter(p => p !== c))}
                >
                  {c} ×
                </Badge>
              ))}
            </div>
          </div>
        )}

        <ImageUploader onImageSelected={setImageFile} isProcessing={loading} />

        {imageFile && !loading && !ratings && !optimalDeck && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex justify-center">
            <Button onClick={analyze} size="lg" className="gap-2 font-body px-8">
              <Sparkles className="w-5 h-5" />
              {mode === "pack" ? "Rate This Pack" : "Build Optimal Deck"}
            </Button>
          </motion.div>
        )}

        {loading && <div className="mt-6"><LoadingState step={1} /></div>}

        <AnimatePresence>
          {ratings && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
              {/* Best pick callout */}
              {ratings.best_pick && (
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
                  <p className="font-heading text-base text-primary">⭐ Best Pick: {ratings.best_pick}</p>
                  <p className="font-body text-sm text-foreground/80 mt-1">{ratings.best_pick_reason}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 font-body text-xs"
                    onClick={() => { addToPicked(ratings.best_pick); reset(); }}
                  >
                    Pick this card & analyze next pack
                  </Button>
                </div>
              )}
              <div className="space-y-2">
                {(ratings.pack_cards || [])
                  .sort((a, b) => ["A+","A","A-","B+","B","B-","C","D","F"].indexOf(a.grade) - ["A+","A","A-","B+","B","B-","C","D","F"].indexOf(b.grade))
                  .map((card, i) => (
                    <CardRating key={i} card={card} index={i} isTopPick={card.name === ratings.best_pick} />
                  ))}
              </div>
              <Button variant="outline" onClick={reset} className="w-full gap-2 font-body">
                <RotateCcw className="w-4 h-4" /> Analyze New Pack
              </Button>
            </motion.div>
          )}
          {optimalDeck && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-card rounded-xl border border-border p-5 space-y-4">
              <div>
                <h3 className="font-heading text-xl text-foreground">{optimalDeck.deck_name}</h3>
                <div className="flex gap-2 mt-1">
                  {(optimalDeck.colors || []).map((c, i) => <Badge key={i} variant="secondary" className="font-body text-xs">{c}</Badge>)}
                </div>
              </div>
              <p className="font-body text-sm text-foreground/80">{optimalDeck.strategy}</p>
              {optimalDeck.key_cards?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-2">Key Cards</p>
                  <div className="flex flex-wrap gap-1.5">
                    {optimalDeck.key_cards.map((c, i) => <Badge key={i} variant="secondary" className="font-body text-xs">{c}</Badge>)}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-1.5">
                {(optimalDeck.cards || []).map((c, i) => (
                  <div key={i} className="bg-secondary/40 rounded-md px-2.5 py-1.5 text-xs font-body flex justify-between">
                    <span className="text-foreground truncate">{c.name}</span>
                    <span className="text-muted-foreground ml-2">x{c.quantity}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" onClick={reset} className="w-full gap-2 font-body">
                <RotateCcw className="w-4 h-4" /> Start New Draft
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}