import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { History, Loader2, Star, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import HistoryDeckCard from "../components/history/HistoryDeckCard";
import ColorMultiSelect from "../components/bo1/ColorMultiSelect";

export default function SpiceHistory() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favOnly, setFavOnly] = useState(false);
  const [colorFilter, setColorFilter] = useState([]);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.SavedDeck.list("-generated_at");
    setDecks(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleFavorite = async (deck) => {
    const next = !deck.favorite;
    setDecks((prev) => prev.map((d) => (d.id === deck.id ? { ...d, favorite: next } : d)));
    await base44.entities.SavedDeck.update(deck.id, { favorite: next });
  };

  const deleteDeck = async (deck) => {
    setDecks((prev) => prev.filter((d) => d.id !== deck.id));
    await base44.entities.SavedDeck.delete(deck.id);
    toast.success("Deck removed from history.");
  };

  const filtered = decks.filter((d) => {
    if (favOnly && !d.favorite) return false;
    if (colorFilter.length) {
      const set = new Set((d.colors || []).map((c) => (c || "").toLowerCase()));
      const map = { white: "w", blue: "u", black: "b", red: "r", green: "g" };
      const norm = [...set].map((c) => map[c] || c);
      if (!colorFilter.some((c) => norm.includes(c.toLowerCase()))) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="relative max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="font-heading text-4xl sm:text-5xl text-foreground tracking-tight flex items-center justify-center gap-3">
            <History className="w-9 h-9 text-primary" />
            Spice History
          </h1>
          <p className="font-body text-muted-foreground text-lg mt-3 max-w-xl mx-auto">
            Every Standard-legal brew you've generated, saved automatically.
          </p>
        </motion.div>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-4 sm:p-5 mb-8 space-y-4">
          <div className="flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-muted-foreground" />
            <Button
              variant={favOnly ? "outline" : "default"}
              size="sm"
              onClick={() => setFavOnly(false)}
              className="font-body"
            >
              All
            </Button>
            <Button
              variant={favOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setFavOnly(true)}
              className="gap-1.5 font-body"
            >
              <Star className={`w-3.5 h-3.5 ${favOnly ? "fill-current" : ""}`} /> Favourites
            </Button>
          </div>
          <ColorMultiSelect selected={colorFilter} onChange={setColorFilter} />
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="font-body text-muted-foreground">Loading your history...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground font-body">
            {decks.length === 0
              ? "No saved decks yet. Generate one on the Daily Spice Rack!"
              : "No decks match your filters."}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((deck) => (
              <HistoryDeckCard
                key={deck.id}
                deck={deck}
                onToggleFavorite={toggleFavorite}
                onDelete={deleteDeck}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}