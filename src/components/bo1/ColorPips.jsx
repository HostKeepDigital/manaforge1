import React from "react";

// Maps full or single-letter color names to a pip letter + style.
const MAP = {
  W: { letter: "W", cls: "bg-amber-100 text-amber-900" },
  U: { letter: "U", cls: "bg-blue-200 text-blue-900" },
  B: { letter: "B", cls: "bg-neutral-700 text-neutral-100" },
  R: { letter: "R", cls: "bg-red-200 text-red-900" },
  G: { letter: "G", cls: "bg-green-200 text-green-900" },
};

const NAME_TO_LETTER = {
  white: "W", blue: "U", black: "B", red: "R", green: "G",
  w: "W", u: "U", b: "B", r: "R", g: "G",
};

export default function ColorPips({ colors }) {
  const letters = (colors || [])
    .map((c) => NAME_TO_LETTER[(c || "").toLowerCase()] || (MAP[c] ? c : null))
    .filter(Boolean);

  if (!letters.length) return null;

  return (
    <div className="flex items-center gap-1">
      {letters.map((l, i) => {
        const m = MAP[l];
        if (!m) return null;
        return (
          <span
            key={i}
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${m.cls}`}
          >
            {m.letter}
          </span>
        );
      })}
    </div>
  );
}