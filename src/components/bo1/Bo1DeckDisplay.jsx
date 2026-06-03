import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Youtube, Sparkles, Swords, Zap, Shield, Crown, TreePine } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import ManaCurveBars from "./ManaCurveBars";
import RatingBars from "./RatingBars";

const TYPE_ORDER = ["Creature", "Instant", "Sorcery", "Enchantment", "Artifact", "Planeswalker", "Land"];
const TYPE_LABEL = {
  Creature: "Creatures",
  Instant: "Instants",
  Sorcery: "Sorceries",
  Enchantment: "Enchantments",
  Artifact: "Artifacts",
  Planeswalker: "Planeswalkers",
  Land: "Lands",
};
const TYPE_ICON = {
  Creature: Swords,
  Instant: Zap,
  Sorcery: Zap,
  Enchantment: Shield,
  Artifact: Shield,
  Planeswalker: Crown,
  Land: TreePine,
};

function toMtgaFormat(cards) {
  return (cards || []).map((c) => `${c.quantity || 1} ${c.name}`).join("\n");
}

function DeckSection({ type, cards }) {
  if (!cards?.length) return null;
  const Icon = TYPE_ICON[type] || Swords;
  const total = cards.reduce((s, c) => s + (c.quantity || 1), 0);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <h4 className="font-body font-semibold text-foreground text-sm uppercase tracking-wider">
          {TYPE_LABEL[type] || type}
        </h4>
        <span className="text-xs text-muted-foreground">({total})</span>
      </div>
      <div className="space-y-0.5">
        {cards.map((card, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-md bg-secondary/30 text-sm font-body">
            <span className="text-foreground truncate mr-2">{card.name}</span>
            <span className="text-muted-foreground font-medium shrink-0">x{card.quantity || 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Bo1DeckDisplay({ deck }) {
  if (!deck) return null;

  const total = (deck.cards || []).reduce((s, c) => s + (c.quantity || 1), 0);

  const grouped = {};
  (deck.cards || []).forEach((c) => {
    const t = TYPE_ORDER.includes(c.type) ? c.type : "Other";
    if (!grouped[t]) grouped[t] = [];
    grouped[t].push(c);
  });
  const orderedTypes = [...TYPE_ORDER.filter((t) => grouped[t]), ...(grouped.Other ? ["Other"] : [])];

  const copyDecklist = () => {
    navigator.clipboard.writeText(toMtgaFormat(deck.cards));
    toast.success("Decklist copied in MTGA format!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        {deck.category && (
          <Badge className="gap-1.5 bg-accent text-accent-foreground font-body">
            <Sparkles className="w-3.5 h-3.5" />
            {deck.category}
          </Badge>
        )}
        <div className="flex items-start gap-3">
          <Youtube className="w-7 h-7 text-primary shrink-0 mt-0.5" />
          <h2 className="font-heading text-3xl text-foreground leading-tight">{deck.deck_name}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {deck.archetype && <Badge variant="secondary" className="font-body">{deck.archetype}</Badge>}
          {(deck.colors || []).map((c, i) => (
            <Badge key={i} variant="outline" className="font-body">{c}</Badge>
          ))}
          <span className="text-xs text-muted-foreground font-body">{total} cards</span>
        </div>
        {deck.description && (
          <p className="font-body text-muted-foreground leading-relaxed">{deck.description}</p>
        )}
        {deck.category_reason && (
          <p className="font-body text-sm text-muted-foreground/80 italic border-l-2 border-accent/40 pl-3">
            {deck.category_reason}
          </p>
        )}
      </div>

      {/* Strategy + key interactions */}
      {(deck.strategy || deck.key_interactions) && (
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          {deck.strategy && (
            <div>
              <h3 className="font-heading text-lg text-foreground mb-2">Core Strategy</h3>
              <div className="prose prose-sm prose-invert max-w-none font-body">
                <ReactMarkdown>{deck.strategy}</ReactMarkdown>
              </div>
            </div>
          )}
          {deck.key_interactions && (
            <div>
              <h3 className="font-heading text-lg text-foreground mb-2">Key Interactions</h3>
              <div className="prose prose-sm prose-invert max-w-none font-body">
                <ReactMarkdown>{deck.key_interactions}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mana curve + ratings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ManaCurveBars curve={deck.mana_curve} />
        <RatingBars ratings={deck.ratings} />
      </div>

      {/* Decklist grouped by type */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg text-foreground">Decklist</h3>
          <Button onClick={copyDecklist} variant="outline" className="gap-2 font-body">
            <Copy className="w-4 h-4" />
            Copy Decklist (MTGA Format)
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {orderedTypes.map((type) => (
            <DeckSection key={type} type={type} cards={grouped[type]} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}