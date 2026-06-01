import React from "react";
import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, Layers } from "lucide-react";
import CardPreview from "./CardPreview";

function Hand({ title, cards, explanation, positive }) {
  if (!cards || cards.length === 0) return null;

  return (
    <div
      className={`rounded-xl border p-4 space-y-3 ${
        positive
          ? "border-green-500/30 bg-green-500/5"
          : "border-destructive/30 bg-destructive/5"
      }`}
    >
      <div className="flex items-center gap-2">
        {positive ? (
          <ThumbsUp className="w-4 h-4 text-green-400" />
        ) : (
          <ThumbsDown className="w-4 h-4 text-destructive" />
        )}
        <h4 className="font-body font-semibold text-foreground text-sm uppercase tracking-wider">
          {title}
        </h4>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {cards.map((name, i) => (
          <CardPreview key={i} name={name}>
            <span className="text-xs font-body px-2 py-1 rounded-md bg-secondary/60 text-foreground cursor-help">
              {name}
            </span>
          </CardPreview>
        ))}
      </div>

      {explanation && (
        <p className="text-xs font-body text-muted-foreground leading-relaxed">
          {explanation}
        </p>
      )}
    </div>
  );
}

export default function OpeningHands({ landCount, landExplanation, goodHand, badHand }) {
  if (!goodHand && !badHand && landCount == null) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3">
        <Layers className="w-5 h-5 text-primary" />
        <h3 className="font-heading text-xl text-foreground">Mana Base & Opening Hands</h3>
      </div>

      {landCount != null && (
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
          <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-primary/15 flex-shrink-0">
            <span className="font-heading text-2xl text-primary leading-none">{landCount}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Lands</span>
          </div>
          {landExplanation && (
            <p className="text-sm font-body text-muted-foreground leading-relaxed">
              {landExplanation}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Hand
          title="Good Opening 7"
          cards={goodHand?.cards}
          explanation={goodHand?.explanation}
          positive
        />
        <Hand
          title="Bad Opening 7"
          cards={badHand?.cards}
          explanation={badHand?.explanation}
          positive={false}
        />
      </div>
    </motion.div>
  );
}