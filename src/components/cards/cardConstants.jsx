// Color buckets used to load a set color-by-color so nothing gets truncated.
export const COLOR_BUCKETS = [
  { key: "W", label: "White", pip: "bg-amber-100 text-amber-900", dot: "bg-amber-300" },
  { key: "U", label: "Blue", pip: "bg-sky-500 text-white", dot: "bg-sky-400" },
  { key: "B", label: "Black", pip: "bg-neutral-800 text-white", dot: "bg-neutral-500" },
  { key: "R", label: "Red", pip: "bg-red-600 text-white", dot: "bg-red-400" },
  { key: "G", label: "Green", pip: "bg-green-600 text-white", dot: "bg-green-400" },
  { key: "M", label: "Multicolor", pip: "bg-gradient-to-br from-amber-400 to-purple-500 text-white", dot: "bg-amber-400" },
  { key: "C", label: "Colorless", pip: "bg-slate-400 text-white", dot: "bg-slate-400" },
];

export const RARITY_COLOR = {
  common: "text-foreground",
  uncommon: "text-slate-300",
  rare: "text-primary",
  mythic: "text-orange-400",
};