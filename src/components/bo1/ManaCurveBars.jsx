import React from "react";
import { BarChart2 } from "lucide-react";

const SLOTS = ["0", "1", "2", "3", "4", "5", "6", "7+"];
const COLORS = ["#a78bfa", "#818cf8", "#60a5fa", "#34d399", "#fbbf24", "#f97316", "#f87171", "#f472b6"];

// Renders a simple bar chart from an explicit mana_curve object like
// { "0": 0, "1": 4, "2": 10, ... "7+": 2 } provided by the AI.
export default function ManaCurveBars({ curve }) {
  if (!curve) return null;

  const values = SLOTS.map((s) => Number(curve[s] || curve[s === "7+" ? "7" : s] || 0));
  const max = Math.max(...values, 1);

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-primary" />
        <h3 className="font-heading text-lg text-foreground">Mana Curve</h3>
      </div>
      <div className="flex items-end justify-between gap-2 h-44">
        {SLOTS.map((slot, i) => {
          const count = values[i];
          const height = (count / max) * 100;
          return (
            <div key={slot} className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full">
              <span className="text-xs font-body text-muted-foreground">{count}</span>
              <div
                className="w-full rounded-t-md transition-all"
                style={{
                  height: `${height}%`,
                  minHeight: count > 0 ? "6px" : "2px",
                  backgroundColor: COLORS[i],
                  opacity: count === 0 ? 0.2 : 0.9,
                }}
              />
              <span className="text-xs font-body text-muted-foreground">{slot}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}