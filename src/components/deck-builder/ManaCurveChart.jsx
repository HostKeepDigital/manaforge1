import React, { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";
import { BarChart2, Info } from "lucide-react";

const COLOR_BY_CMC = ["#a78bfa", "#818cf8", "#60a5fa", "#34d399", "#fbbf24", "#f87171", "#f472b6"];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl text-sm font-body">
      <p className="text-muted-foreground mb-1">{label === "7" ? "7+" : `${label} mana`}</p>
      <p className="text-foreground font-semibold">{payload[0].value} spell{payload[0].value !== 1 ? "s" : ""}</p>
    </div>
  );
}

export default function ManaCurveChart({ cards }) {
  const { data, totalSpells, avgCmc, landCount } = useMemo(() => {
    const nonLands = (cards || []).filter((c) => c.type !== "Land");
    const lands = (cards || []).filter((c) => c.type === "Land");
    const landCount = lands.reduce((s, c) => s + (c.quantity || 1), 0);

    // Parse CMC from mana_cost or cost string
    const getCmc = (card) => {
      if (card.cmc != null) return card.cmc;
      const cost = card.mana_cost || card.cost || "";
      let cmc = 0;
      // generic mana number
      const generic = cost.match(/(\d+)/);
      if (generic) cmc += parseInt(generic[1]);
      // count each pip letter
      cmc += (cost.match(/[WUBRGC]/g) || []).length;
      return cmc;
    };

    const buckets = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, "7+": 0 };
    let totalCmc = 0;
    let totalSpells = 0;

    nonLands.forEach((card) => {
      const qty = card.quantity || 1;
      const cmc = getCmc(card);
      totalCmc += cmc * qty;
      totalSpells += qty;
      const key = cmc >= 7 ? "7+" : String(cmc);
      buckets[key] = (buckets[key] || 0) + qty;
    });

    const data = Object.entries(buckets).map(([cmc, count]) => ({
      cmc,
      count,
      label: cmc === "7+" ? "7+" : `${cmc}`,
    }));

    const avgCmc = totalSpells > 0 ? (totalCmc / totalSpells).toFixed(2) : 0;
    return { data, totalSpells, avgCmc, landCount };
  }, [cards]);

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-primary" />
          <h3 className="font-heading text-lg text-foreground">Mana Curve</h3>
        </div>
        <div className="flex items-center gap-4 text-xs font-body text-muted-foreground">
          <span>
            Avg CMC:{" "}
            <span className="text-primary font-semibold">{avgCmc}</span>
          </span>
          <span>
            Spells:{" "}
            <span className="text-foreground font-semibold">{totalSpells}</span>
          </span>
          <span>
            Lands:{" "}
            <span className="text-foreground font-semibold">{landCount}</span>
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={32} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontFamily: "var(--font-body)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontFamily: "var(--font-body)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--secondary))", radius: 4 }} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={COLOR_BY_CMC[Math.min(index, COLOR_BY_CMC.length - 1)]}
                  fillOpacity={entry.count === 0 ? 0.15 : 0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Balance hint */}
      {landCount < 16 || landCount > 28 ? (
        <div className="flex items-start gap-2 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2">
          <Info className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-body text-orange-300">
            {landCount < 16
              ? `Only ${landCount} lands detected — consider adjusting ratios for consistency.`
              : `${landCount} lands is high — you may be able to cut a few for more spells.`}
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
          <Info className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-body text-green-300">
            Land count looks healthy. Avg CMC of {avgCmc} suggests a{" "}
            {avgCmc < 2.5 ? "fast aggro curve" : avgCmc < 3.5 ? "balanced midrange curve" : "high-end control/ramp curve"}.
          </p>
        </div>
      )}
    </motion.div>
  );
}