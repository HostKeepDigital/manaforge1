import React from "react";

const COLORS = [
  { code: "W", label: "White", dot: "bg-amber-100 text-slate-900" },
  { code: "U", label: "Blue", dot: "bg-blue-400 text-slate-900" },
  { code: "B", label: "Black", dot: "bg-zinc-700 text-zinc-100" },
  { code: "R", label: "Red", dot: "bg-red-500 text-slate-900" },
  { code: "G", label: "Green", dot: "bg-green-500 text-slate-900" },
];

export default function ColorPicker({ selected, onChange }) {
  const toggle = (code) => {
    if (selected.includes(code)) {
      onChange(selected.filter((c) => c !== code));
    } else {
      onChange([...selected, code]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {COLORS.map(({ code, label, dot }) => {
        const active = selected.includes(code);
        return (
          <button
            key={code}
            type="button"
            onClick={() => toggle(code)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border font-body text-sm transition-all
              ${active
                ? "border-primary bg-primary/15 text-foreground"
                : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${dot}`}>
              {code}
            </span>
            {label}
          </button>
        );
      })}
    </div>
  );
}