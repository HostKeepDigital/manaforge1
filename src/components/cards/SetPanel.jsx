import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronDown, Loader2, Layers } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ColorSection from "./ColorSection";
import { COLOR_BUCKETS } from "./cardConstants";

// A collapsible panel for one Standard set. Loads each color bucket on demand
// (sequentially when "Load all colors" is used) so the full picture builds up
// without truncating anything.
export default function SetPanel({ set }) {
  const [open, setOpen] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [colors, setColors] = useState({}); // { W: {status, cards}, ... }

  const loadColor = async (key) => {
    if (colors[key]?.status === "loading" || colors[key]?.status === "loaded") return colors[key];
    setColors((p) => ({ ...p, [key]: { status: "loading", cards: [] } }));
    try {
      const res = await base44.functions.invoke("scryfallStandard", {
        action: "cards",
        setCode: set.code,
        color: key,
      });
      const cards = res.data?.cards || [];
      setColors((p) => ({ ...p, [key]: { status: "loaded", cards } }));
      return { status: "loaded", cards };
    } catch {
      setColors((p) => ({ ...p, [key]: { status: "idle", cards: [] } }));
      return { status: "idle", cards: [] };
    }
  };

  const loadAll = async () => {
    setLoadingAll(true);
    for (const b of COLOR_BUCKETS) {
      await loadColor(b.key); // sequential — one color per set at a time
    }
    setLoadingAll(false);
  };

  const toggle = () => setOpen((v) => !v);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center gap-3 px-4 sm:px-5 py-4 hover:bg-secondary/30 transition-colors text-left"
      >
        {set.icon ? (
          <img src={set.icon} alt="" className="w-7 h-7 shrink-0" style={{ filter: "invert(0.85)" }} />
        ) : (
          <Layers className="w-6 h-6 text-muted-foreground shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-heading text-lg text-foreground truncate">{set.name}</h2>
          <p className="font-body text-xs text-muted-foreground">
            {set.code.toUpperCase()} · {set.released_at} · {set.card_count} cards in set
          </p>
        </div>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-6 pt-2 space-y-6 border-t border-border">
              <button
                onClick={loadAll}
                disabled={loadingAll}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-body text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
              >
                {loadingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                Load all colors
              </button>

              {COLOR_BUCKETS.map((b) => (
                <ColorSection
                  key={b.key}
                  bucket={b.key}
                  state={colors[b.key]}
                  onLoad={() => loadColor(b.key)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}