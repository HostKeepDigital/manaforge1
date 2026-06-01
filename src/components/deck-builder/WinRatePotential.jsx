import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, Droplets, Swords, BarChart2 } from "lucide-react";

const ratingColor = {
  S: "text-yellow-300",
  A: "text-green-400",
  B: "text-blue-400",
  C: "text-orange-400",
  D: "text-red-400",
};

const ratingBg = {
  S: "bg-yellow-400/15 border-yellow-400/30",
  A: "bg-green-400/15 border-green-400/30",
  B: "bg-blue-400/15 border-blue-400/30",
  C: "bg-orange-400/15 border-orange-400/30",
  D: "bg-red-400/15 border-red-400/30",
};

function ScoreBar({ label, score, icon: Icon, detail }) {
  const pct = Math.max(0, Math.min(100, score));
  const color = pct >= 75 ? "bg-green-500" : pct >= 50 ? "bg-blue-500" : pct >= 30 ? "bg-orange-500" : "bg-red-500";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-body text-sm text-foreground">{label}</span>
        </div>
        <span className="font-body text-sm font-semibold text-foreground">{pct}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      {detail && <p className="font-body text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}

export default function WinRatePotential({ winRate }) {
  if (!winRate) return null;

  const rating = winRate.overall_rating || "C";
  const winPct = winRate.estimated_win_rate || 50;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card rounded-2xl border border-border p-5 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-heading text-lg text-foreground">Win Rate Potential</h3>
        </div>
        <div className={`px-3 py-1 rounded-lg border font-heading text-xl font-bold ${ratingBg[rating]} ${ratingColor[rating]}`}>
          {rating}
        </div>
      </div>

      {/* Big win rate number */}
      <div className="flex items-end gap-3 py-2">
        <motion.span
          className="font-heading text-5xl text-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {winPct}%
        </motion.span>
        <span className="font-body text-muted-foreground text-sm pb-2">estimated win rate</span>
      </div>

      {/* Summary */}
      {winRate.summary && (
        <p className="font-body text-sm text-foreground/80">{winRate.summary}</p>
      )}

      {/* Score bars */}
      <div className="space-y-4 pt-1">
        <ScoreBar
          label="Mana Curve"
          score={winRate.mana_curve_score}
          icon={BarChart2}
          detail={winRate.mana_curve_detail}
        />
        <ScoreBar
          label="Removal / Creature Ratio"
          score={winRate.removal_ratio_score}
          icon={Swords}
          detail={winRate.removal_ratio_detail}
        />
        <ScoreBar
          label="Color Consistency"
          score={winRate.color_consistency_score}
          icon={Droplets}
          detail={winRate.color_consistency_detail}
        />
      </div>

      {/* Recommendations */}
      {winRate.recommendations?.length > 0 && (
        <div className="pt-1">
          <p className="font-body text-xs text-muted-foreground uppercase tracking-wider mb-2">Recommendations</p>
          <ul className="space-y-1.5">
            {winRate.recommendations.map((rec, i) => (
              <li key={i} className="font-body text-sm text-foreground/80 flex gap-2">
                <span className="text-primary mt-0.5">→</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}