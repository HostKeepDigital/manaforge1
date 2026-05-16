import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RotateCcw, Trophy, ChevronDown, ChevronUp, Camera, X, Layers } from "lucide-react";

const GRADE_ORDER = ["A+", "A", "A-", "B+", "B", "B-", "C", "D", "F"];

const GRADE_STYLE = {
  "A+": "text-yellow-300 bg-yellow-400/20 border-yellow-400/40",
  "A":  "text-green-300 bg-green-400/20 border-green-400/40",
  "A-": "text-green-300 bg-green-400/20 border-green-400/40",
  "B+": "text-blue-300 bg-blue-400/20 border-blue-400/40",
  "B":  "text-blue-300 bg-blue-400/20 border-blue-400/40",
  "B-": "text-blue-300 bg-blue-400/20 border-blue-400/40",
  "C":  "text-orange-300 bg-orange-400/20 border-orange-400/40",
  "D":  "text-red-400 bg-red-400/20 border-red-400/40",
  "F":  "text-red-500 bg-red-500/20 border-red-500/40",
};

function CardRow({ card, isBest, onPick }) {
  const [open, setOpen] = useState(false);
  const style = GRADE_STYLE[card.grade] || "text-muted-foreground bg-secondary/30 border-border";

  return (
    <div className={`rounded-xl border overflow-hidden transition-colors ${isBest ? "border-primary/50 bg-primary/5" : "border-border bg-card/60"}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-3 text-left active:bg-secondary/30"
      >
        {isBest && <Trophy className="w-4 h-4 text-primary shrink-0" />}
        <span className={`text-xs font-bold px-2 py-0.5 rounded border shrink-0 font-heading ${style}`}>
          {card.grade}
        </span>
        <span className="font-body text-sm text-foreground flex-1 truncate leading-tight">{card.name}</span>
        <span className="text-xs text-muted-foreground font-body shrink-0 hidden sm:block">{card.card_type}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t border-border/40 space-y-2">
              <p className="text-sm font-body text-foreground/80">{card.reasoning}</p>
              {card.synergy_note && (
                <p className="text-xs font-body text-primary/80 italic">🔗 {card.synergy_note}</p>
              )}
              <Button
                size="sm"
                className="w-full font-body text-xs h-8 mt-1"
                onClick={(e) => { e.stopPropagation(); onPick(card.name); }}
              >
                Pick {card.name}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DraftAssistant() {
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [optimalDeck, setOptimalDeck] = useState(null);
  const [pickedCards, setPickedCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("pack");
  const [packNumber, setPackNumber] = useState(1);
  const [showPool, setShowPool] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setRatings(null);
    setOptimalDeck(null);
  };

  const analyze = async () => {
    if (!imageFile) return;
    setLoading(true);
    setRatings(null);
    setOptimalDeck(null);

    const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });

    if (mode === "pack") {
      const poolContext = pickedCards.length > 0
        ? `Current pool (${pickedCards.length} cards): ${pickedCards.join(", ")}`
        : "No cards picked yet — rate on raw power.";

      const result = await base44.integrations.Core.InvokeLLM({
        model: "claude_sonnet_4_6",
        prompt: `You are an expert MTG Arena draft coach specializing in reading MTG Arena screenshots.

MTG Arena shows draft packs and deck lists in many formats — full card art packs, compact list rows, stacked column deck views, etc. Read ALL visible card names regardless of format.

CRITICAL: Read every text label in the image. Card names appear as:
- Large card art with name at top/bottom
- Small text rows in list/sidebar panels (e.g. "Flashback", "Mana Sculpt")
- Stacked column views in Draft Deck screens
- ANY readable card name text counts — you do NOT need full art to be visible

${poolContext}

IMPORTANT: When a pool exists, synergy with already-picked cards should heavily influence grades. A mediocre card that completes a combo should rank higher than a powerful card in the wrong color.

For EVERY card you can identify in the image:
- name: exact card name
- card_type: Creature / Instant / Sorcery / Enchantment / Artifact / Land
- grade: A+, A, A-, B+, B, B-, C, D, or F
- reasoning: 1-2 sentences on power level + fit in pool
- synergy_note: only if it directly synergizes with a card already in the pool

Also pick the single best card to take given the current pool.`,
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
      const result = await base44.integrations.Core.InvokeLLM({
        model: "claude_sonnet_4_6",
        prompt: `You are an expert MTG limited deck builder. Analyze this draft pool screenshot and build the optimal 40-card deck. Pick 22-23 non-land cards and 17-18 lands. Provide a short strategy summary and list key cards.`,
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

  const pickCard = (name) => {
    if (!pickedCards.includes(name)) {
      setPickedCards(prev => [...prev, name]);
    }
    // Clear current pack, ready for next upload
    setImageFile(null);
    setPreviewUrl(null);
    setRatings(null);
    setPackNumber(p => p + 1);
  };

  const quickPick = () => {
    if (ratings?.best_pick) pickCard(ratings.best_pick);
  };

  const resetDraft = () => {
    setImageFile(null);
    setPreviewUrl(null);
    setRatings(null);
    setOptimalDeck(null);
    setPickedCards([]);
    setPackNumber(1);
    setLoading(false);
  };

  const sortedCards = ratings?.pack_cards
    ? [...ratings.pack_cards].sort((a, b) => GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade))
    : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-3 pt-4 pb-24">

        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-heading text-xl text-foreground">Draft Assistant</h1>
            <p className="text-xs text-muted-foreground font-body">
              {mode === "pack" ? `Pack ${packNumber} · ${pickedCards.length} cards in pool` : "Build from full pool"}
            </p>
          </div>
          <div className="flex gap-2">
            {pickedCards.length > 0 && (
              <button
                onClick={() => setShowPool(!showPool)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/60 text-xs text-foreground font-body"
              >
                <Layers className="w-3.5 h-3.5" />
                Pool ({pickedCards.length})
              </button>
            )}
            {(pickedCards.length > 0 || ratings || imageFile) && (
              <button onClick={resetDraft} className="text-xs text-muted-foreground font-body hover:text-foreground flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Pool drawer */}
        <AnimatePresence>
          {showPool && pickedCards.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="bg-card rounded-xl border border-border p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground font-body uppercase tracking-wider">Current Pool</p>
                  <button onClick={() => setShowPool(false)}><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mode toggle */}
        <div className="flex gap-1 bg-secondary/50 rounded-lg p-1 mb-4">
          {[["pack", "Rate Pack"], ["pool", "Build Deck"]].map(([m, label]) => (
            <button
              key={m}
              onClick={() => { setMode(m); setRatings(null); setOptimalDeck(null); }}
              className={`flex-1 py-2 rounded-md text-sm font-body font-medium transition-all
                ${mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Upload area — compact for mobile */}
        {!previewUrl ? (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/30 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-card/40 transition-all mb-4">
            <input type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
            <Camera className="w-7 h-7 text-primary/60 mb-2" />
            <p className="text-sm font-body text-muted-foreground">
              {mode === "pack" ? "Tap to photograph pack" : "Tap to photograph pool"}
            </p>
            <p className="text-xs text-muted-foreground/60 font-body mt-0.5">or upload screenshot</p>
          </label>
        ) : (
          <div className="relative mb-4 rounded-xl overflow-hidden border border-border">
            <img src={previewUrl} alt="Pack" className="w-full max-h-48 object-cover" />
            {!loading && (
              <button
                onClick={() => { setImageFile(null); setPreviewUrl(null); setRatings(null); }}
                className="absolute top-2 right-2 bg-black/60 rounded-full p-1"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            )}
            {loading && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-xs text-primary font-body">Analyzing with your pool...</p>
              </div>
            )}
          </div>
        )}

        {/* Analyze button */}
        {imageFile && !loading && !ratings && !optimalDeck && (
          <Button onClick={analyze} className="w-full gap-2 font-body mb-4" size="lg">
            <Sparkles className="w-5 h-5" />
            {mode === "pack" ? "Rate Pack" : "Build Deck"}
          </Button>
        )}

        {/* RESULTS — Pack ratings */}
        <AnimatePresence>
          {ratings && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">

              {/* Best pick — sticky CTA */}
              {ratings.best_pick && (
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-primary shrink-0" />
                    <p className="font-heading text-base text-primary">Best Pick: {ratings.best_pick}</p>
                  </div>
                  <p className="font-body text-xs text-foreground/70">{ratings.best_pick_reason}</p>
                  <Button onClick={quickPick} className="w-full font-body text-sm h-9 gap-2">
                    ✓ Pick & Next Pack
                  </Button>
                </div>
              )}

              {/* All cards */}
              <div className="space-y-2">
                {sortedCards.map((card, i) => (
                  <CardRow
                    key={i}
                    card={card}
                    index={i}
                    isBest={card.name === ratings.best_pick}
                    onPick={pickCard}
                  />
                ))}
              </div>

              <Button variant="outline" onClick={() => { setImageFile(null); setPreviewUrl(null); setRatings(null); }} className="w-full font-body gap-2">
                <Camera className="w-4 h-4" /> Upload Different Pack
              </Button>
            </motion.div>
          )}

          {/* Deck result */}
          {optimalDeck && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border border-border p-4 space-y-3">
              <div>
                <h3 className="font-heading text-lg text-foreground">{optimalDeck.deck_name}</h3>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {(optimalDeck.colors || []).map((c, i) => <Badge key={i} variant="secondary" className="font-body text-xs">{c}</Badge>)}
                </div>
              </div>
              <p className="font-body text-sm text-foreground/80">{optimalDeck.strategy}</p>
              {optimalDeck.key_cards?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-1.5">Key Cards</p>
                  <div className="flex flex-wrap gap-1.5">
                    {optimalDeck.key_cards.map((c, i) => <Badge key={i} variant="secondary" className="font-body text-xs">{c}</Badge>)}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-1.5">
                {(optimalDeck.cards || []).map((c, i) => (
                  <div key={i} className="bg-secondary/40 rounded-md px-2.5 py-1.5 text-xs font-body flex justify-between">
                    <span className="text-foreground truncate">{c.name}</span>
                    <span className="text-muted-foreground ml-1">×{c.quantity}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" onClick={resetDraft} className="w-full gap-2 font-body">
                <RotateCcw className="w-4 h-4" /> New Draft
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}