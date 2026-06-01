import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Copy, ChevronDown, ChevronUp, Swords, Shield, Zap, TreePine, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import ManaCurveChart from "./ManaCurveChart";
import OpeningHands from "./OpeningHands";

const typeIcons = {
  Creature: Swords,
  Instant: Zap,
  Sorcery: Zap,
  Enchantment: Shield,
  Artifact: Shield,
  Planeswalker: Crown,
  Land: TreePine,
};

function DeckSection({ title, cards, icon: Icon, onAdjust }) {
  if (!cards || cards.length === 0) return null;
  const totalCards = cards.reduce((sum, c) => sum + (c.quantity || 1), 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-primary" />}
        <h4 className="font-body font-semibold text-foreground text-sm uppercase tracking-wider">
          {title}
        </h4>
        <span className="text-xs text-muted-foreground">({totalCards})</span>
      </div>
      <div className="space-y-1">
        {cards.map((card, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-3 py-1.5 rounded-md bg-secondary/30 hover:bg-secondary/50 transition-colors group"
          >
            <span className="font-body text-sm text-foreground truncate mr-2">{card.name}</span>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onAdjust(card.name, -1)}
                className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="font-body text-xs text-muted-foreground font-medium w-6 text-center">
                x{card.quantity || 1}
              </span>
              <button
                onClick={() => onAdjust(card.name, +1)}
                className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DeckSuggestion({ deck }) {
  const [showStrategy, setShowStrategy] = useState(false);
  const [quantities, setQuantities] = useState({});

  if (!deck) return null;

  const adjustQuantity = (cardName, delta) => {
    setQuantities((prev) => {
      const currentCard = deck.cards.find((c) => c.name === cardName);
      const base = currentCard?.quantity || 1;
      const current = prev[cardName] ?? base;
      const next = Math.max(0, Math.min(4, current + delta));
      return { ...prev, [cardName]: next };
    });
  };

  // Merge AI quantities with user overrides
  const resolvedCards = (deck.cards || [])
    .map((c) => ({
      ...c,
      quantity: quantities[c.name] ?? c.quantity ?? 1,
    }))
    .filter((c) => c.quantity > 0);

  const groupedCards = {};
  resolvedCards.forEach((card) => {
    const type = card.type || "Other";
    if (!groupedCards[type]) groupedCards[type] = [];
    groupedCards[type].push(card);
  });

  const totalCards = resolvedCards.reduce((sum, c) => sum + (c.quantity || 1), 0);

  const copyDeckList = () => {
    const list = resolvedCards.map((c) => `${c.quantity} ${c.name}`).join("\n");
    navigator.clipboard.writeText(list);
    toast.success("Deck list copied to clipboard!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Crown className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-heading text-2xl text-foreground">
              {deck.deck_name || "Your Deck"}
            </h2>
            <p className="font-body text-sm text-muted-foreground">
              {totalCards} cards • {deck.archetype || "Custom"}
            </p>
          </div>
        </div>
        <Button onClick={copyDeckList} variant="outline" className="gap-2 font-body">
          <Copy className="w-4 h-4" />
          Copy Deck List
        </Button>
      </div>

      {/* Colors */}
      {deck.colors && deck.colors.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground font-body">Colors:</span>
          {deck.colors.map((color, i) => (
            <Badge key={i} variant="secondary" className="font-body">
              {color}
            </Badge>
          ))}
        </div>
      )}

      {/* Mana Curve Chart */}
      <ManaCurveChart cards={resolvedCards} />

      {/* Land count + opening hands */}
      <OpeningHands
        landCount={deck.land_count}
        landExplanation={deck.land_count_explanation}
        goodHand={deck.good_opening_hand}
        badHand={deck.bad_opening_hand}
      />

      {/* Cards by type with adjusters */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-1">
        <p className="text-xs text-muted-foreground font-body mb-3">
          Hover a card to adjust its quantity — the mana curve updates live.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(groupedCards).map(([type, cards]) => (
            <DeckSection
              key={type}
              title={type}
              cards={cards}
              icon={typeIcons[type] || Swords}
              onAdjust={adjustQuantity}
            />
          ))}
        </div>
      </div>

      {/* Strategy */}
      {deck.strategy && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => setShowStrategy(!showStrategy)}
            className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
          >
            <span className="font-heading text-lg text-foreground">Strategy Guide</span>
            {showStrategy ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          {showStrategy && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="px-4 pb-4"
            >
              <div className="prose prose-sm prose-invert max-w-none font-body">
                <ReactMarkdown>{deck.strategy}</ReactMarkdown>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}