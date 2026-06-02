import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Youtube } from "lucide-react";
import { toast } from "sonner";

// Builds the MTGA import string, e.g. "4 Lightning Bolt\n4 Mountain".
function toMtgaFormat(cards) {
  return (cards || [])
    .map((c) => `${c.quantity || 1} ${c.name}`)
    .join("\n");
}

export default function Bo1DeckCard({ deck }) {
  if (!deck) return null;

  const total = (deck.cards || []).reduce((sum, c) => sum + (c.quantity || 1), 0);

  const copyDecklist = () => {
    navigator.clipboard.writeText(toMtgaFormat(deck.cards));
    toast.success("Decklist copied in MTGA format!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col bg-card rounded-xl border border-border overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 border-b border-border space-y-3">
        <div className="flex items-start gap-2">
          <Youtube className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <h3 className="font-heading text-lg text-foreground leading-tight">
            {deck.deck_name}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {deck.archetype && (
            <Badge variant="secondary" className="font-body">{deck.archetype}</Badge>
          )}
          {(deck.colors || []).map((color, i) => (
            <Badge key={i} variant="outline" className="font-body">{color}</Badge>
          ))}
          <span className="text-xs text-muted-foreground font-body">{total} cards</span>
        </div>
        {deck.description && (
          <p className="font-body text-sm text-muted-foreground leading-relaxed">
            {deck.description}
          </p>
        )}
      </div>

      {/* Decklist */}
      <div className="flex-1 p-5">
        <div className="space-y-0.5 max-h-80 overflow-y-auto pr-1">
          {(deck.cards || []).map((card, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-sm font-body py-0.5"
            >
              <span className="text-foreground truncate mr-2">{card.name}</span>
              <span className="text-muted-foreground font-medium shrink-0">
                x{card.quantity || 1}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-5 pt-0">
        <Button onClick={copyDecklist} variant="outline" className="w-full gap-2 font-body">
          <Copy className="w-4 h-4" />
          Copy Decklist
        </Button>
      </div>
    </motion.div>
  );
}