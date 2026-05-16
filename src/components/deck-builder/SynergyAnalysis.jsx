import React, { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Flame, Link, TrendingUp, AlertTriangle, Star } from "lucide-react";

const TIER_CONFIG = {
  S: { label: "S-Tier", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30", desc: "Tournament-ready power" },
  A: { label: "A-Tier", color: "text-green-400", bg: "bg-green-400/10 border-green-400/30", desc: "Strong competitive option" },
  B: { label: "B-Tier", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/30", desc: "Solid FNM-level deck" },
  C: { label: "C-Tier", color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/30", desc: "Casual / needs upgrades" },
  D: { label: "D-Tier", color: "text-red-400", bg: "bg-red-400/10 border-red-400/30", desc: "Limited power level" },
};

const ARCHETYPE_COLORS = [
  "border-l-yellow-400",
  "border-l-purple-400",
  "border-l-blue-400",
  "border-l-green-400",
  "border-l-red-400",
];

function SynergyCombo({ combo, index }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      className="bg-secondary/40 rounded-xl border border-border overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-3 p-4 hover:bg-secondary/60 transition-colors text-left"
      >
        <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Link className="w-3.5 h-3.5 text-accent-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-1.5 mb-1">
            {combo.cards.map((card, i) => (
              <span key={i} className="inline-flex items-center">
                <span className="text-sm font-body font-semibold text-primary">{card}</span>
                {i < combo.cards.length - 1 && (
                  <span className="text-muted-foreground mx-1 text-xs">+</span>
                )}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground font-body">{combo.summary}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${i < (combo.synergy_score || 3) ? "text-primary fill-primary" : "text-muted"}`}
              />
            ))}
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="px-4 pb-4"
        >
          <p className="text-sm font-body text-foreground/80 leading-relaxed">{combo.explanation}</p>
          {combo.how_to_use && (
            <p className="text-xs font-body text-muted-foreground mt-2 italic">
              💡 {combo.how_to_use}
            </p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

function ArchetypeCard({ archetype, index }) {
  const [open, setOpen] = useState(false);
  const tier = TIER_CONFIG[archetype.tier] || TIER_CONFIG["C"];
  const borderColor = ARCHETYPE_COLORS[index % ARCHETYPE_COLORS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-card rounded-xl border border-border border-l-4 ${borderColor} overflow-hidden`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-3 p-4 hover:bg-secondary/20 transition-colors text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-heading text-base text-foreground">{archetype.name}</span>
            <span className={`text-xs font-body font-bold px-2 py-0.5 rounded-full border ${tier.bg} ${tier.color}`}>
              {tier.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-body">{archetype.playstyle}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right">
            <div className="text-xs text-muted-foreground font-body">Match</div>
            <div className="text-sm font-body font-bold text-primary">{archetype.match_percentage}%</div>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="px-4 pb-4 space-y-3"
        >
          <p className="text-sm font-body text-foreground/80 leading-relaxed">{archetype.description}</p>

          {archetype.key_cards_present?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-1.5">Key cards you have</p>
              <div className="flex flex-wrap gap-1.5">
                {archetype.key_cards_present.map((card, i) => (
                  <Badge key={i} variant="secondary" className="font-body text-xs">{card}</Badge>
                ))}
              </div>
            </div>
          )}

          {archetype.missing_key_cards?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-orange-400" /> Missing for full archetype
              </p>
              <div className="flex flex-wrap gap-1.5">
                {archetype.missing_key_cards.map((card, i) => (
                  <Badge key={i} variant="outline" className="font-body text-xs text-muted-foreground border-dashed">{card}</Badge>
                ))}
              </div>
            </div>
          )}

          {archetype.win_condition && (
            <p className="text-xs font-body text-muted-foreground border-t border-border pt-2">
              <span className="text-foreground font-medium">Win condition:</span> {archetype.win_condition}
            </p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

export default function SynergyAnalysis({ analysis }) {
  const [activeTab, setActiveTab] = useState("archetypes");

  if (!analysis) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-accent-foreground" />
        </div>
        <div>
          <h2 className="font-heading text-2xl text-foreground">Synergy Analysis</h2>
          <p className="font-body text-sm text-muted-foreground">Meta archetypes & card combinations detected</p>
        </div>
      </div>

      {/* Overall rating */}
      {analysis.collection_power_rating && (
        <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-body text-sm text-muted-foreground">Collection Power Rating</p>
            <p className="font-heading text-xl text-foreground mt-0.5">{analysis.collection_power_summary}</p>
          </div>
          <div className="flex flex-col items-center">
            <div className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center font-heading text-2xl font-bold
              ${TIER_CONFIG[analysis.collection_power_rating]?.bg || "bg-muted"} 
              ${TIER_CONFIG[analysis.collection_power_rating]?.color || "text-foreground"}
            `}>
              {analysis.collection_power_rating}
            </div>
            <p className="text-xs text-muted-foreground font-body mt-1">
              {TIER_CONFIG[analysis.collection_power_rating]?.desc || ""}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 rounded-lg p-1">
        {[
          { id: "archetypes", label: "Meta Archetypes", icon: Flame },
          { id: "combos", label: "Synergy Combos", icon: Link },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-body font-medium transition-all
              ${activeTab === id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Archetypes tab */}
      {activeTab === "archetypes" && (
        <div className="space-y-3">
          {(analysis.archetypes || []).map((archetype, i) => (
            <ArchetypeCard key={i} archetype={archetype} index={i} />
          ))}
        </div>
      )}

      {/* Combos tab */}
      {activeTab === "combos" && (
        <div className="space-y-3">
          {(analysis.synergy_combos || []).length > 0 ? (
            (analysis.synergy_combos || []).map((combo, i) => (
              <SynergyCombo key={i} combo={combo} index={i} />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground font-body">
              No notable synergy combos detected
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}