import React, { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Copy, ChevronDown, ChevronUp, Swords, Shield, Zap, TreePine } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const typeIcons = {
  Creature: Swords,
  Instant: Zap,
  Sorcery: Zap,
  Enchantment: Shield,
  Artifact: Shield,
  Planeswalker: Crown,
  Land: TreePine,
};

function DeckSection({ title, cards, icon: Icon }) {
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
            className="flex items-center justify-between px-3 py-1.5 rounded-md bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <span className="font-body text-sm text-foreground">{card.name}</span>
            <span className="font-body text-xs text-muted-foreground font-medium">
              x{card.quantity || 1}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DeckSuggestion({ deck }) {
  const [showStrategy, setShowStrategy] = useState(false);

  if (!deck) return null;

  const groupedCards = {};
  (deck.cards || []).forEach((card) => {
    const type = card.type || "Other";
    if (!groupedCards[type]) groupedCards[type] = [];
    groupedCards[type].push(card);
  });

  const totalCards = (deck.cards || []).reduce((sum, c) => sum + (c.quantity || 1), 0);

  const copyDeckList = () => {
    const list = (deck.cards || [])
      .map((c) => `${c.quantity || 1} ${c.name}`)
      .join("\n");
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

      {/* Cards by type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card rounded-xl p-6 border border-border">
        {Object.entries(groupedCards).map(([type, cards]) => (
          <DeckSection
            key={type}
            title={type}
            cards={cards}
            icon={typeIcons[type] || Swords}
          />
        ))}
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