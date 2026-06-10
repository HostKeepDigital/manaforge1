import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Trophy, ChevronDown, BookOpen, Swords } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import ColorPips from "../bo1/ColorPips";
import DeckList from "../bo1/DeckList";

const TIER_CLS = {
  S: "bg-primary/20 text-primary border-primary/30",
  1: "bg-primary/20 text-primary border-primary/30",
  2: "bg-accent/20 text-accent border-accent/30",
  3: "bg-secondary text-secondary-foreground",
};

export default function MetaDeckPanel({ deck, index }) {
  const [guideOpen, setGuideOpen] = useState(false);

  const copyMtga = () => {
    navigator.clipboard.writeText(deck.mtga_decklist || "");
    toast.success("MTGA list copied!");
  };

  const tierKey = String(deck.tier || "").replace(/tier\s*/i, "").trim().toUpperCase();
  const tierCls = TIER_CLS[tierKey] || "bg-secondary text-secondary-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card rounded-xl border border-border p-5 sm:p-6 space-y-5"
    >
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-primary shrink-0" />
            <h2 className="font-heading text-2xl text-foreground leading-tight">{deck.archetype}</h2>
          </div>
          <div className="flex items-center gap-2">
            {deck.tier && <Badge className={`font-body border ${tierCls}`}>Tier {tierKey}</Badge>}
            <ColorPips colors={deck.colors} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm font-body text-muted-foreground">
          {deck.est_meta_share && (
            <span><span className="text-foreground font-semibold">{deck.est_meta_share}</span> meta share (est.)</span>
          )}
          {deck.est_win_rate && (
            <span><span className="text-foreground font-semibold">{deck.est_win_rate}</span> win rate (est.)</span>
          )}
        </div>
        {deck.why_it_wins && (
          <p className="font-body text-muted-foreground leading-relaxed border-l-2 border-accent/40 pl-3">
            {deck.why_it_wins}
          </p>
        )}
      </div>

      {/* Copy MTGA */}
      <Button onClick={copyMtga} className="gap-2 font-body bg-primary text-primary-foreground hover:bg-primary/90">
        <Copy className="w-4 h-4" />
        Copy MTGA list
      </Button>

      {/* Maindeck */}
      <DeckList cards={deck.maindeck} mtgaString={deck.mtga_decklist} />

      {/* Sideboard */}
      {deck.sideboard?.length > 0 && (
        <div className="bg-secondary/20 rounded-xl border border-border p-5 space-y-2">
          <h3 className="font-body font-semibold text-foreground text-sm uppercase tracking-wider">Sideboard</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0.5">
            {deck.sideboard.map((c, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-md bg-secondary/30 text-sm font-body">
                <span className="text-foreground truncate mr-2">{c.name}</span>
                <span className="text-muted-foreground font-medium shrink-0">x{c.quantity || 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pilot guide (collapsible) */}
      {deck.pilot_guide && (
        <div className="bg-secondary/20 rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => setGuideOpen((v) => !v)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <span className="flex items-center gap-2 font-body font-semibold text-foreground">
              <BookOpen className="w-4 h-4 text-primary" /> Pilot guide
            </span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${guideOpen ? "rotate-180" : ""}`} />
          </button>
          {guideOpen && (
            <div className="px-4 pb-4 prose prose-sm prose-invert max-w-none font-body">
              <ReactMarkdown>{deck.pilot_guide}</ReactMarkdown>
            </div>
          )}
        </div>
      )}

      {/* Key matchups */}
      {deck.key_matchups && (
        <div>
          <h3 className="flex items-center gap-2 font-heading text-lg text-foreground mb-2">
            <Swords className="w-4 h-4 text-primary" /> Key matchups
          </h3>
          <div className="prose prose-sm prose-invert max-w-none font-body">
            <ReactMarkdown>{deck.key_matchups}</ReactMarkdown>
          </div>
        </div>
      )}
    </motion.div>
  );
}