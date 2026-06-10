import React, { useState } from "react";
import { Star, Smile, Swords, Flame } from "lucide-react";

// Post-game rating: lets the user rate a deck on Fun / Competitive / Spicy (1-10).
const CATEGORIES = [
  { key: "fun", label: "Fun", icon: Smile, color: "text-accent" },
  { key: "competitive", label: "Competitive", icon: Swords, color: "text-primary" },
  { key: "spicy", label: "Spicy", icon: Flame, color: "text-destructive" },
];

function StarRow({ value, onSelect }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
        const active = n <= (hover || value);
        return (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onClick={() => onSelect(n)}
            className="p-0.5"
            title={`${n}/10`}
          >
            <Star className={`w-4 h-4 transition-colors ${active ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />
          </button>
        );
      })}
      <span className="ml-2 text-xs font-body text-muted-foreground w-8">{value ? `${value}/10` : "—"}</span>
    </div>
  );
}

export default function UserDeckRating({ rating, onRate }) {
  const r = rating || {};
  return (
    <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
      <p className="font-heading text-sm text-foreground">Your Post-Game Rating</p>
      {CATEGORIES.map(({ key, label, icon: Icon, color }) => (
        <div key={key} className="flex items-center justify-between gap-3 flex-wrap">
          <span className={`flex items-center gap-1.5 text-sm font-body ${color}`}>
            <Icon className="w-4 h-4" /> {label}
          </span>
          <StarRow value={r[key] || 0} onSelect={(n) => onRate({ ...r, [key]: n })} />
        </div>
      ))}
    </div>
  );
}