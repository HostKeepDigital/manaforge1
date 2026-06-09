import React from "react";
import { Loader2, Check } from "lucide-react";
import { motion } from "framer-motion";
import CardTile from "./CardTile";
import { COLOR_BUCKETS } from "./cardConstants";

// One color bucket within a set. Loads on demand so the page builds up the full
// picture color-by-color rather than all at once.
export default function ColorSection({ bucket, state, onLoad }) {
  const meta = COLOR_BUCKETS.find((b) => b.key === bucket);
  const { status, cards } = state || { status: "idle", cards: [] };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${meta.pip}`}>
          {bucket === "M" ? "◆" : bucket === "C" ? "◇" : bucket}
        </span>
        <h3 className="font-heading text-lg text-foreground">{meta.label}</h3>
        {status === "loaded" && (
          <span className="flex items-center gap-1 text-xs font-body text-green-500">
            <Check className="w-3.5 h-3.5" /> {cards.length} cards
          </span>
        )}
        {status === "loading" && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
        {status === "idle" && (
          <button
            onClick={onLoad}
            className="text-xs font-body text-primary hover:underline"
          >
            Load
          </button>
        )}
      </div>

      {status === "loaded" && cards.length === 0 && (
        <p className="font-body text-sm text-muted-foreground pl-9">No cards in this color.</p>
      )}

      {status === "loaded" && cards.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 pl-0 sm:pl-9"
        >
          {cards.map((c) => (
            <CardTile key={c.id} card={c} />
          ))}
        </motion.div>
      )}
    </div>
  );
}