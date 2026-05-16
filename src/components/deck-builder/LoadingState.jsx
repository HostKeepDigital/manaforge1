import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const tips = [
  "Scanning cards from screenshot...",
  "Identifying card names & types...",
  "Matching meta archetypes...",
  "Finding synergy combos...",
  "Crafting your optimal deck...",
];

export default function LoadingState({ step }) {
  const tipIndex = Math.min(step || 0, tips.length - 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 py-12"
    >
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-muted border-t-primary animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
        </div>
      </div>

      <div className="text-center">
        <motion.p
          key={tipIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-foreground font-body font-medium text-lg"
        >
          {tips[tipIndex]}
        </motion.p>
        <p className="text-muted-foreground font-body text-sm mt-2">
          This may take a moment
        </p>
      </div>

      <div className="flex gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className={`w-2 h-2 rounded-full ${i <= tipIndex ? 'bg-primary' : 'bg-muted'}`}
            animate={i === tipIndex ? { scale: [1, 1.3, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        ))}
      </div>
    </motion.div>
  );
}