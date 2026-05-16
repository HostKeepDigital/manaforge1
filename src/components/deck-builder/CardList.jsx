import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Layers } from "lucide-react";

const manaColorMap = {
  W: "bg-amber-100 text-amber-900",
  U: "bg-blue-500/20 text-blue-300",
  B: "bg-zinc-700 text-zinc-200",
  R: "bg-red-500/20 text-red-300",
  G: "bg-green-500/20 text-green-300",
  C: "bg-zinc-500/20 text-zinc-300",
};

export default function CardList({ cards }) {
  if (!cards || cards.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3">
        <Layers className="w-5 h-5 text-primary" />
        <h2 className="font-heading text-xl text-foreground">
          Cards Detected
        </h2>
        <Badge variant="secondary" className="font-body">
          {cards.length} cards
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {cards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="bg-secondary/50 rounded-lg px-3 py-2 border border-border/50 hover:border-primary/30 transition-colors"
          >
            <p className="text-sm font-body font-medium text-foreground truncate">
              {card.name}
            </p>
            <div className="flex items-center gap-1 mt-1">
              {card.colors?.map((color, i) => (
                <span
                  key={i}
                  className={`inline-block w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${manaColorMap[color] || manaColorMap.C}`}
                >
                  {color}
                </span>
              ))}
              {card.quantity > 1 && (
                <span className="text-xs text-muted-foreground ml-auto">
                  x{card.quantity}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}