import React from "react";

// The 5 MTG colors shown as colored pill buttons with their mana symbols.
const COLORS = [
  { key: "White", symbol: "W", on: "bg-amber-100 text-amber-900 border-amber-200", ring: "ring-amber-300" },
  { key: "Blue", symbol: "U", on: "bg-sky-500 text-white border-sky-400", ring: "ring-sky-300" },
  { key: "Black", symbol: "B", on: "bg-neutral-800 text-white border-neutral-600", ring: "ring-neutral-400" },
  { key: "Red", symbol: "R", on: "bg-red-600 text-white border-red-500", ring: "ring-red-300" },
  { key: "Green", symbol: "G", on: "bg-green-600 text-white border-green-500", ring: "ring-green-300" },
];

export default function ColorMultiSelect({ selected, onChange }) {
  const toggle = (key) => {
    if (selected.includes(key)) {
      onChange(selected.filter((c) => c !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="font-body text-sm text-muted-foreground">Colors to include</label>
      <div className="flex flex-wrap gap-2">
        {COLORS.map(({ key, symbol, on, ring }) => {
          const active = selected.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border font-body text-sm font-semibold transition-all
                ${active
                  ? `${on} ring-2 ${ring}`
                  : "bg-secondary/40 text-muted-foreground border-border hover:text-foreground hover:bg-secondary/70"
                }`}
            >
              <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold
                ${active ? "bg-black/15" : "bg-secondary"}`}>
                {symbol}
              </span>
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}