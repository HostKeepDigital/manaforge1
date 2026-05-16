import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { TrendingUp, RefreshCw, ChevronDown, ChevronUp, Swords, Shield, Zap } from "lucide-react";
import LoadingState from "../components/deck-builder/LoadingState";

const TIER_CONFIG = {
  S: { color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30", label: "S-Tier", desc: "Dominant" },
  A: { color: "text-green-400", bg: "bg-green-400/10 border-green-400/30", label: "A-Tier", desc: "Strong" },
  B: { color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/30", label: "B-Tier", desc: "Solid" },
  C: { color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/30", label: "C-Tier", desc: "Fringe" },
  D: { color: "text-red-400", bg: "bg-red-400/10 border-red-400/30", label: "D-Tier", desc: "Weak" },
};

const FORMAT_OPTIONS = ["Standard", "Historic", "Alchemy", "Explorer", "Brawl"];
const RANK_OPTIONS = ["All Ranks", "Bronze/Silver", "Gold/Platinum", "Diamond/Mythic"];

function DeckEntry({ deck, index }) {
  const [open, setOpen] = useState(false);
  const tier = TIER_CONFIG[deck.tier] || TIER_CONFIG["C"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 p-4 hover:bg-secondary/20 transition-colors text-left"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className={`text-sm font-heading font-bold px-2.5 py-1 rounded-lg border shrink-0 ${tier.bg} ${tier.color}`}>
            {tier.label}
          </span>
          <div className="min-w-0">
            <p className="font-body font-semibold text-foreground text-sm truncate">{deck.name}</p>
            <p className="text-xs text-muted-foreground font-body">{deck.playstyle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-muted-foreground font-body">Win Rate</div>
            <div className="text-sm font-body font-bold text-primary">{deck.win_rate}%</div>
          </div>
          <div className="flex flex-wrap gap-1 max-w-[100px] justify-end">
            {(deck.colors || []).map((c, i) => (
              <Badge key={i} variant="secondary" className="font-body text-[10px] px-1.5 py-0">{c}</Badge>
            ))}
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="px-4 pb-4 border-t border-border/50 space-y-3 pt-3"
        >
          <p className="text-sm font-body text-foreground/80">{deck.description}</p>
          <div className="grid grid-cols-2 gap-3">
            {deck.win_condition && (
              <div>
                <p className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-1">Win Condition</p>
                <p className="text-sm font-body text-foreground">{deck.win_condition}</p>
              </div>
            )}
            {deck.difficulty && (
              <div>
                <p className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-1">Difficulty</p>
                <p className="text-sm font-body text-foreground">{deck.difficulty}</p>
              </div>
            )}
          </div>
          {deck.key_cards?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-1.5">Key Cards</p>
              <div className="flex flex-wrap gap-1.5">
                {deck.key_cards.map((c, i) => <Badge key={i} variant="secondary" className="font-body text-xs">{c}</Badge>)}
              </div>
            </div>
          )}
          {deck.good_against?.length > 0 && (
            <div className="flex gap-4">
              <div className="flex-1">
                <p className="text-xs text-green-400 font-body uppercase tracking-wider mb-1">✓ Good vs</p>
                <div className="flex flex-wrap gap-1">
                  {deck.good_against.map((d, i) => (
                    <span key={i} className="text-xs font-body text-foreground/70 bg-green-500/10 rounded px-1.5 py-0.5">{d}</span>
                  ))}
                </div>
              </div>
              {deck.bad_against?.length > 0 && (
                <div className="flex-1">
                  <p className="text-xs text-red-400 font-body uppercase tracking-wider mb-1">✗ Weak vs</p>
                  <div className="flex flex-wrap gap-1">
                    {deck.bad_against.map((d, i) => (
                      <span key={i} className="text-xs font-body text-foreground/70 bg-red-500/10 rounded px-1.5 py-0.5">{d}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

export default function MetaTierList() {
  const [format, setFormat] = useState("Standard");
  const [rank, setRank] = useState("All Ranks");
  const [tiers, setTiers] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchMeta = async () => {
    setLoading(true);
    setTiers(null);
    const result = await base44.integrations.Core.InvokeLLM({
      add_context_from_internet: true,
      model: "gemini_3_flash",
      prompt: `You are a competitive MTG Arena meta analyst with access to current tournament data.

Provide the current ${format} meta tier list for ${rank} ranked play as of ${new Date().toLocaleDateString()}.

List the top 10-15 decks. For each deck provide:
- name: full archetype name (e.g. "Azorius Soldiers", "Mono-Red Aggro")
- tier: S, A, B, C, or D
- playstyle: one-sentence summary (aggro/control/midrange/combo/ramp)
- colors: array of color names (e.g. ["White", "Blue"])
- win_rate: estimated win rate percentage (number only, e.g. 54)
- description: 2-3 sentence meta analysis
- win_condition: how the deck wins
- difficulty: Easy / Medium / Hard
- key_cards: top 4-5 defining cards
- good_against: 2-3 archetypes this deck beats
- bad_against: 2-3 archetypes this deck struggles against

Order by tier (S first), then win rate within tier.`,
      response_json_schema: {
        type: "object",
        properties: {
          last_updated: { type: "string" },
          meta_summary: { type: "string" },
          decks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                tier: { type: "string" },
                playstyle: { type: "string" },
                colors: { type: "array", items: { type: "string" } },
                win_rate: { type: "number" },
                description: { type: "string" },
                win_condition: { type: "string" },
                difficulty: { type: "string" },
                key_cards: { type: "array", items: { type: "string" } },
                good_against: { type: "array", items: { type: "string" } },
                bad_against: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
    });
    setTiers(result);
    setLoading(false);
  };

  const groupedByTier = tiers
    ? ["S", "A", "B", "C", "D"].reduce((acc, t) => {
        const decks = (tiers.decks || []).filter(d => d.tier === t);
        if (decks.length) acc[t] = decks;
        return acc;
      }, {})
    : {};

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
      </div>
      <div className="relative max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="font-heading text-3xl text-foreground">Meta Tier List</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            AI-powered meta analysis based on current tournament data
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="flex gap-1 bg-secondary/50 rounded-lg p-1">
            {FORMAT_OPTIONS.map(f => (
              <button key={f} onClick={() => setFormat(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-body font-medium transition-all
                  ${format === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-secondary/50 rounded-lg p-1">
            {RANK_OPTIONS.map(r => (
              <button key={r} onClick={() => setRank(r)}
                className={`px-3 py-1.5 rounded-md text-xs font-body font-medium transition-all
                  ${rank === r ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {r}
              </button>
            ))}
          </div>
          <Button onClick={fetchMeta} disabled={loading} className="gap-2 font-body ml-auto">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {tiers ? "Refresh" : "Load Meta"}
          </Button>
        </div>

        {loading && <LoadingState step={1} />}

        {tiers && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {tiers.meta_summary && (
              <div className="bg-card rounded-xl border border-border p-4">
                <p className="font-body text-sm text-foreground/80">{tiers.meta_summary}</p>
              </div>
            )}
            {Object.entries(groupedByTier).map(([tier, decks]) => {
              const cfg = TIER_CONFIG[tier];
              return (
                <div key={tier}>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-3 ${cfg.bg}`}>
                    <span className={`font-heading font-bold text-sm ${cfg.color}`}>{cfg.label}</span>
                    <span className={`font-body text-xs ${cfg.color} opacity-70`}>— {cfg.desc}</span>
                  </div>
                  <div className="space-y-2">
                    {decks.map((d, i) => <DeckEntry key={i} deck={d} index={i} />)}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {!tiers && !loading && (
          <div className="text-center py-20 text-muted-foreground font-body">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Select a format and rank, then load the meta tier list.</p>
          </div>
        )}
      </div>
    </div>
  );
}