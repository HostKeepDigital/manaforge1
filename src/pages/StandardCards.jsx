import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, LibraryBig, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import SetPanel from "../components/cards/SetPanel";

// Browse every Standard-legal card, live from Scryfall, organized by set and color.
// The set list comes straight from Scryfall, so it auto-updates when new sets release.
export default function StandardCards() {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("scryfallStandard", { action: "sets" });
      setSets(res.data?.sets || []);
    } catch (err) {
      setError(err?.message || "Couldn't load the Standard set list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSets();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <LibraryBig className="w-8 h-8 text-primary" />
            <h1 className="font-heading text-3xl sm:text-4xl text-foreground">Standard Card Browser</h1>
          </div>
          <p className="font-body text-muted-foreground mt-3 max-w-2xl">
            Every Standard-legal card, pulled live from Scryfall with full images. Open a set and load
            it color-by-color — White, Blue, Black, Red, Green, Multicolor, Colorless — so you can see
            the complete picture without anything being cut off. The set list updates automatically
            whenever new sets release.
          </p>
        </motion.div>

        {loading && (
          <div className="flex flex-col items-center gap-3 py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="font-body text-muted-foreground">Loading the current Standard sets…</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-center justify-between">
            <p className="font-body text-destructive">{error}</p>
            <button onClick={loadSets} className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-body text-sm text-muted-foreground">{sets.length} Standard sets</p>
              <button onClick={loadSets} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
            {sets.map((s) => (
              <SetPanel key={s.code} set={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}