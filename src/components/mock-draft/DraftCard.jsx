import React from "react";
import { motion } from "framer-motion";
import { Crown, Check } from "lucide-react";
import { GRADE_STYLES, GRADE_LABELS, manaStyle } from "./draftUtils";
import CardPreview from "../deck-builder/CardPreview";

// A single pickable card in the current pack.
export default function DraftCard({ card, index, isBest, showBest, onPick }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => onPick(card)}
      className={`relative text-left bg-secondary/40 hover:bg-secondary/70 rounded-lg p-3 border transition-colors ${
        showBest && isBest ? "border-primary ring-1 ring-primary" : "border-border/50 hover:border-primary/40"
      }`}
    >
      {showBest && isBest && (
        <div className="absolute -top-2 -right-2 flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-body font-semibold px-2 py-0.5 rounded-full shadow">
          <Crown className="w-3 h-3" />
          Best Pick
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <CardPreview name={card.name}>
          <span className="font-body text-sm font-medium text-foreground cursor-help">
            {card.name}
          </span>
        </CardPreview>
        <span
          className={`flex-shrink-0 w-6 h-6 rounded-md border text-xs font-bold flex items-center justify-center ${GRADE_STYLES[card.grade] || GRADE_STYLES.C}`}
          title={GRADE_LABELS[card.grade] || ""}
        >
          {card.grade || "?"}
        </span>
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        {(card.colors || []).map((c, i) => (
          <span
            key={i}
            className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${manaStyle(c)}`}
          >
            {c}
          </span>
        ))}
        <span className="text-[11px] text-muted-foreground ml-auto capitalize">
          {card.rarity || ""}
        </span>
      </div>
      {card.note && (
        <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2 leading-snug">
          {card.note}
        </p>
      )}
    </motion.button>
  );
}