import React from "react";
import { Button } from "@/components/ui/button";
import { Copy, Swords, Zap, Shield, Crown, TreePine } from "lucide-react";
import { toast } from "sonner";

const TYPE_ORDER = ["Creature", "Instant", "Sorcery", "Enchantment", "Artifact", "Planeswalker", "Land"];
const TYPE_LABEL = {
  Creature: "Creatures",
  Instant: "Instants",
  Sorcery: "Sorceries",
  Enchantment: "Enchantments",
  Artifact: "Artifacts",
  Planeswalker: "Planeswalkers",
  Land: "Lands",
};
const TYPE_ICON = {
  Creature: Swords,
  Instant: Zap,
  Sorcery: Zap,
  Enchantment: Shield,
  Artifact: Shield,
  Planeswalker: Crown,
  Land: TreePine,
};

function toMtgaFormat(cards) {
  return (cards || []).map((c) => `${c.quantity || 1} ${c.name}`).join("\n");
}

function DeckSection({ type, cards }) {
  if (!cards?.length) return null;
  const Icon = TYPE_ICON[type] || Swords;
  const total = cards.reduce((s, c) => s + (c.quantity || 1), 0);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <h4 className="font-body font-semibold text-foreground text-sm uppercase tracking-wider">
          {TYPE_LABEL[type] || type}
        </h4>
        <span className="text-xs text-muted-foreground">({total})</span>
      </div>
      <div className="space-y-0.5">
        {cards.map((card, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-md bg-secondary/30 text-sm font-body">
            <span className="text-foreground truncate mr-2">{card.name}</span>
            <span className="text-muted-foreground font-medium shrink-0">x{card.quantity || 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DeckList({ cards, mtgaString }) {
  const grouped = {};
  (cards || []).forEach((c) => {
    const t = TYPE_ORDER.includes(c.type) ? c.type : "Other";
    if (!grouped[t]) grouped[t] = [];
    grouped[t].push(c);
  });
  const orderedTypes = [...TYPE_ORDER.filter((t) => grouped[t]), ...(grouped.Other ? ["Other"] : [])];

  const copyDecklist = () => {
    navigator.clipboard.writeText(mtgaString || toMtgaFormat(cards));
    toast.success("Decklist copied in MTGA format!");
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg text-foreground">Decklist</h3>
        <Button onClick={copyDecklist} variant="outline" className="gap-2 font-body">
          <Copy className="w-4 h-4" />
          Copy Decklist (MTGA Format)
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {orderedTypes.map((type) => (
          <DeckSection key={type} type={type} cards={grouped[type]} />
        ))}
      </div>
    </div>
  );
}