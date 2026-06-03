import React from "react";
import { motion } from "framer-motion";
import { Trophy, Smile, Zap } from "lucide-react";

const RATINGS = [
  { key: "competitiveness", label: "Competitiveness", icon: Trophy, color: "bg-primary" },
  { key: "entertainment_value", label: "Entertainment", icon: Smile, color: "bg-accent" },
  { key: "surprise_factor", label: "Surprise Factor", icon: Zap, color: "bg-sky-500" },
];

function ScoreBar({ label, icon: Icon, score, color }) {
  const pct = Math.max(0, Math.min(10, score || 0)) * 10;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm font-body">
        <span className="flex items-center gap-2 text-foreground">
          <Icon className="w-4 h-4 text-muted-foreground" />
          {label}
        </span>
        <span className="font-semibold text-foreground">{score ?? 0}/10</span>
      </div>
      <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

export default function RatingBars({ ratings }) {
  if (!ratings) return null;
  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <h3 className="font-heading text-lg text-foreground">Ratings</h3>
      {RATINGS.map(({ key, label, icon, color }) => (
        <ScoreBar key={key} label={label} icon={icon} score={ratings[key]} color={color} />
      ))}
    </div>
  );
}