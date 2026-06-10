import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, ChevronDown, Trophy, Swords, Save, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import ColorPips from "../bo1/ColorPips";

const TIER_CLS = {
  "1": "bg-primary/20 text-primary border-primary/30",
  "2": "bg-accent/20 text-accent border-accent/30",
};

function tierLabel(tier) {
  const t = String(tier || "").replace(/tier/i, "").trim();
  return t ? `Tier ${t}` : "Tier ?";
}

function tierCls(tier) {
  const t = String(tier || "").replace(/tier/i, "").trim();
  return TIER_CLS[t] || "bg-secondary text-secondary-foreground border-border";
}

function CardLines({ cards }) {
  return (
    <ul className="space-y-1">
      {(cards || []).map((c, i) => (
        <li key={i} className="flex justify-between gap-3 font-body text-sm text-foreground">
          <span className="truncate">{c.name}</span>
          <span className="text-muted-foreground shrink-0">×{c.quantity || 1}</span>
        </li>
      ))}
    </ul>
  );
}

export default function MetaDeckCard({ deck, onSave, saving }) {
  const [guideOpen, setGuideOpen] = useState(false);

  const copyList = async () => {
    if (!deck.mtga_decklist) {
      toast.error("No MTGA list available for this deck.");
      return;
    }
    await navigator.clipboard.writeText(deck.mtga_decklist);
    toast.success("MTGA list copied to clipboard!");
  };

  const mainTotal = (deck.maindeck || []).reduce((s, c) => s + (c.quantity || 1), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-5 sm:p-6 space-y-5"
    >
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Trophy className="w-6 h-6 text-primary shrink-0" />
            <h2 className="font-heading text-2xl text-foreground leading-tight truncate">
              {deck.archetype}
            </h2>
          </div>
          <Badge className={`shrink-0 font-body border ${tierCls(deck.tier)}`}>
            {tierLabel(deck.tier)}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ColorPips colors={deck.colors} />
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-body">
            <BarChart3 className="w-3.5 h-3.5 text-primary" />
            est. {deck.est_meta_share || "—"} share · est. {deck.est_win_rate || "—"} win
          </span>
        </div>
      </div>

      {/* Why it wins */}
      {deck.why_it_wins && (
        <div>
          <h3 className="font-heading text-base text-foreground mb-1.5">Why it wins</h3>
          <p className="font-body text-sm text-muted-foreground leading-relaxed">{deck.why_it_wins}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={copyList} variant="outline" className="gap-2 font-body">
          <Copy className="w-4 h-4" /> Copy MTGA list
        </Button>
        <Button
          onClick={() => onSave(deck)}
          disabled={saving}
          className="gap-2 font-body bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Save className="w-4 h-4" /> Save to my decks
        </Button>
      </div>

      {/* Decklists */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-background/40 rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading text-base text-foreground">Maindeck</h3>
            <span className="text-xs text-muted-foreground font-body">{mainTotal} cards</span>
          </div>
          <CardLines cards={deck.maindeck} />
        </div>
        <div className="bg-background/40 rounded-lg border border-border p-4">
          <h3 className="font-heading text-base text-foreground mb-3">Sideboard</h3>
          <CardLines cards={deck.sideboard} />
        </div>
      </div>

      {/* Pilot guide (collapsible) */}
      {deck.pilot_guide && (
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setGuideOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <span className="font-heading text-base text-foreground">Pilot guide</span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${guideOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {guideOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 py-4 prose prose-sm prose-invert max-w-none font-body">
                  <ReactMarkdown>{deck.pilot_guide}</ReactMarkdown>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Key matchups */}
      {deck.key_matchups && (
        <div>
          <h3 className="font-heading text-base text-foreground mb-1.5 flex items-center gap-2">
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