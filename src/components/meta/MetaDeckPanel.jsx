import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, ChevronDown, BookOpen, Swords, BarChart3, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import ColorPips from "../bo1/ColorPips";
import DeckList from "../bo1/DeckList";

const TIER_STYLE = {
  "1": "bg-primary/20 text-primary border-primary/30",
  "2": "bg-accent/20 text-accent-foreground border-accent/30",
};

function tierKey(tier) {
  const t = String(tier || "").toLowerCase();
  if (t.includes("1")) return "1";
  if (t.includes("2")) return "2";
  return "1";
}

export default function MetaDeckPanel({ deck, onSave, saved }) {
  const [guideOpen, setGuideOpen] = useState(false);

  const copyList = () => {
    navigator.clipboard.writeText(deck.mtga_decklist || "");
    toast.success("MTGA list copied!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <div className="p-5 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-heading text-2xl text-foreground">{deck.archetype}</h2>
              <Badge variant="outline" className={`font-body ${TIER_STYLE[tierKey(deck.tier)]}`}>
                Tier {tierKey(deck.tier)}
              </Badge>
              <ColorPips colors={deck.colors} />
            </div>
            <p className="font-body text-sm text-muted-foreground">
              {deck.est_meta_share && (
                <span className="text-primary font-medium">{deck.est_meta_share} meta share</span>
              )}
              {deck.est_meta_share && deck.est_win_rate && " · "}
              {deck.est_win_rate && (
                <span className="text-accent-foreground font-medium">{deck.est_win_rate} win rate</span>
              )}
              <span className="ml-1 italic text-muted-foreground/70">(est.)</span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button onClick={copyList} variant="outline" size="sm" className="gap-1.5 font-body">
              <Copy className="w-4 h-4" /> Copy MTGA list
            </Button>
            <Button
              onClick={() => onSave(deck)}
              disabled={saved}
              size="sm"
              className="gap-1.5 font-body bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? "Saved" : "Save to my decks"}
            </Button>
          </div>
        </div>

        {/* Why it wins */}
        {deck.why_it_wins && (
          <div className="bg-secondary/30 rounded-lg p-4">
            <h3 className="font-body font-semibold text-foreground text-sm uppercase tracking-wider mb-1.5">
              Why it wins
            </h3>
            <p className="font-body text-sm text-muted-foreground leading-relaxed">{deck.why_it_wins}</p>
          </div>
        )}
      </div>

      {/* Maindeck */}
      <div className="px-5 sm:px-6 pb-2">
        <DeckList cards={deck.maindeck} mtgaString={deck.mtga_decklist} />
      </div>

      {/* Sideboard */}
      {deck.sideboard?.length > 0 && (
        <div className="px-5 sm:px-6 pb-5">
          <div className="bg-card rounded-xl border border-border p-5 space-y-2">
            <h3 className="font-heading text-lg text-foreground">Sideboard</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
              {deck.sideboard.map((c, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-md bg-secondary/30 text-sm font-body">
                  <span className="text-foreground truncate mr-2">{c.name}</span>
                  <span className="text-muted-foreground font-medium shrink-0">x{c.quantity || 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pilot guide (collapsible) + matchups */}
      <div className="px-5 sm:px-6 pb-6 space-y-4">
        {deck.pilot_guide && (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <button
              onClick={() => setGuideOpen((v) => !v)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <span className="flex items-center gap-2 font-heading text-lg text-foreground">
                <BookOpen className="w-5 h-5 text-primary" /> Pilot guide
              </span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${guideOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {guideOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-border"
                >
                  <div className="p-4 prose prose-sm prose-invert max-w-none font-body">
                    <ReactMarkdown>{deck.pilot_guide}</ReactMarkdown>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {deck.key_matchups && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="flex items-center gap-2 font-heading text-lg text-foreground mb-2">
              <Swords className="w-5 h-5 text-primary" /> Key matchups
            </h3>
            <div className="prose prose-sm prose-invert max-w-none font-body">
              <ReactMarkdown>{deck.key_matchups}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}