import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Gauge, TrendingUp, TrendingDown, CheckCircle2 } from "lucide-react";

const COLORS = ["W", "U", "B", "R", "G"];

const colorMeta = {
  W: { name: "White", dot: "bg-amber-200", text: "text-amber-200", bar: "#fde68a" },
  U: { name: "Blue", dot: "bg-blue-400", text: "text-blue-300", bar: "#60a5fa" },
  B: { name: "Black", dot: "bg-zinc-400", text: "text-zinc-300", bar: "#a1a1aa" },
  R: { name: "Red", dot: "bg-red-400", text: "text-red-300", bar: "#f87171" },
  G: { name: "Green", dot: "bg-green-400", text: "text-green-300", bar: "#4ade80" },
};

// Basic land name -> color it produces
const basicLandColor = {
  plains: "W",
  island: "U",
  swamp: "B",
  mountain: "R",
  forest: "G",
};

// Rule of thumb (Frank Karsten style, scaled): target sources for a color
// based on its share of total colored pips in the deck.
function targetSources(deckSize) {
  // ~ proportional to deck size; 60-card wants more raw sources than 40-card
  return deckSize >= 50 ? 1 : 0.62; // multiplier applied to pip share later
}

export default function ManaCalculator({ cards }) {
  const analysis = useMemo(() => {
    if (!cards || cards.length === 0) return null;

    const lands = cards.filter((c) => c.type === "Land");
    const spells = cards.filter((c) => c.type !== "Land");

    const deckSize = cards.reduce((s, c) => s + (c.quantity || 1), 0);
    const landCount = lands.reduce((s, c) => s + (c.quantity || 1), 0);

    // 1) Count colored pips in demand (weighted by quantity)
    const pipDemand = { W: 0, U: 0, B: 0, R: 0, G: 0 };
    spells.forEach((card) => {
      const qty = card.quantity || 1;
      const cost = card.mana_cost || card.cost || "";
      const pips = cost.match(/[WUBRG]/g) || [];
      if (pips.length) {
        pips.forEach((p) => (pipDemand[p] += qty));
      } else if (Array.isArray(card.colors)) {
        // fall back to color identity if no cost string parsed
        card.colors.forEach((p) => {
          if (pipDemand[p] != null) pipDemand[p] += qty;
        });
      }
    });

    // 2) Count land sources per color
    const sources = { W: 0, U: 0, B: 0, R: 0, G: 0 };
    lands.forEach((land) => {
      const qty = land.quantity || 1;
      const name = (land.name || "").toLowerCase();
      const basic = Object.keys(basicLandColor).find((b) => name.includes(b));
      if (basic) {
        sources[basicLandColor[basic]] += qty;
      } else if (Array.isArray(land.colors) && land.colors.length) {
        // dual / fixing land produces each listed color
        land.colors.forEach((c) => {
          if (sources[c] != null) sources[c] += qty;
        });
      }
    });

    const totalPips = COLORS.reduce((s, c) => s + pipDemand[c], 0);
    const mult = targetSources(deckSize);

    const perColor = COLORS.filter((c) => pipDemand[c] > 0).map((c) => {
      const pipShare = totalPips > 0 ? pipDemand[c] / totalPips : 0;
      // target sources scales with land count and how heavily the color is used
      const target = Math.max(1, Math.round(landCount * pipShare * mult * 1.6));
      const have = sources[c];
      const ratio = target > 0 ? have / target : 1;
      const confidence = Math.max(0, Math.min(100, Math.round(ratio * 100)));
      const delta = have - target; // positive = surplus, negative = shortfall
      return {
        color: c,
        pips: pipDemand[c],
        have,
        target,
        confidence,
        delta,
      };
    });

    const overall =
      perColor.length > 0
        ? Math.round(perColor.reduce((s, p) => s + p.confidence, 0) / perColor.length)
        : 0;

    return { perColor, overall, landCount, deckSize, totalPips };
  }, [cards]);

  if (!analysis || analysis.perColor.length === 0) return null;

  const { perColor, overall, landCount } = analysis;

  const overallTier =
    overall >= 85
      ? { label: "Excellent", text: "text-green-400", ring: "stroke-green-400" }
      : overall >= 65
      ? { label: "Solid", text: "text-primary", ring: "stroke-primary" }
      : overall >= 45
      ? { label: "Shaky", text: "text-orange-400", ring: "stroke-orange-400" }
      : { label: "Inconsistent", text: "text-red-400", ring: "stroke-red-400" };

  const circumference = 2 * Math.PI * 36;
  const dash = (overall / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-5 space-y-5"
    >
      {/* Header + overall gauge */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-heading text-lg text-foreground">Mana Calculator</h3>
            <p className="text-xs font-body text-muted-foreground">
              Color pip demand vs. land sources
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="none" strokeWidth="6" className="stroke-secondary" />
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                strokeWidth="6"
                strokeLinecap="round"
                className={overallTier.ring}
                strokeDasharray={`${dash} ${circumference}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`font-heading text-xl ${overallTier.text}`}>{overall}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-body text-muted-foreground uppercase tracking-wider">
              Confidence
            </p>
            <p className={`font-heading text-base ${overallTier.text}`}>{overallTier.label}</p>
          </div>
        </div>
      </div>

      {/* Per-color breakdown */}
      <div className="space-y-3">
        {perColor.map((p) => {
          const meta = colorMeta[p.color];
          return (
            <div key={p.color} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-body">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${meta.dot}`} />
                  <span className={`font-semibold ${meta.text}`}>{meta.name}</span>
                  <span className="text-muted-foreground">{p.pips} pips</span>
                </div>
                <span className="text-muted-foreground">
                  <span className="text-foreground font-semibold">{p.have}</span> / {p.target} sources
                </span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${p.confidence}%`, backgroundColor: meta.bar }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommendations */}
      <div className="space-y-2 pt-1">
        {perColor.map((p) => {
          const meta = colorMeta[p.color];
          if (p.delta <= -2) {
            return (
              <div
                key={p.color}
                className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
              >
                <TrendingUp className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-body text-red-300">
                  Add <span className="font-semibold">{Math.abs(p.delta)}</span> more {meta.name} source
                  {Math.abs(p.delta) !== 1 ? "s" : ""} (basic or dual lands) — your {meta.name} pips are
                  under-supported and you may miss color on key turns.
                </p>
              </div>
            );
          }
          if (p.delta >= 3) {
            return (
              <div
                key={p.color}
                className="flex items-start gap-2 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2"
              >
                <TrendingDown className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-body text-orange-300">
                  You have <span className="font-semibold">{p.delta}</span> more {meta.name} source
                  {p.delta !== 1 ? "s" : ""} than needed — consider cutting one for a color you're short on
                  or an extra spell.
                </p>
              </div>
            );
          }
          return null;
        })}

        {perColor.every((p) => p.delta > -2 && p.delta < 3) && (
          <div className="flex items-start gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-body text-green-300">
              Your mana base is well-balanced across all colors — sources match your pip demand. No land
              changes needed.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}