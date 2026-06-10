import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Youtube, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import ManaCurveBars from "./ManaCurveBars";
import RatingBars from "./RatingBars";
import DeckList from "./DeckList";

export default function Bo1DeckDisplay({ deck, mtgaString, hideDecklist = false }) {
  if (!deck) return null;

  const total = (deck.cards || []).reduce((s, c) => s + (c.quantity || 1), 0);

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
      {!hideDecklist && <DeckList cards={deck.cards} mtgaString={mtgaString} />}
    </motion.div>
  );
}