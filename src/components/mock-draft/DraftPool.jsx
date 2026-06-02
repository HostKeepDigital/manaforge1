import React from "react";
import { Badge } from "@/components/ui/badge";
import { Layers } from "lucide-react";
import { GRADE_STYLES, manaStyle } from "./draftUtils";

// Shows the cards the user has drafted so far.
export default function DraftPool({ pool }) {
  if (!pool || pool.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-3">
        <Layers className="w-4 h-4 text-primary" />
        <h3 className="font-heading text-lg text-foreground">Your Picks</h3>
        <Badge variant="secondary" className="font-body">{pool.length}</Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {pool.map((card, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-md bg-secondary/30"
          >
            <span className="font-body text-sm text-foreground truncate">
              <span className="text-muted-foreground mr-2">{i + 1}.</span>
              {card.name}
            </span>
            <div className="flex items-center gap-1 flex-shrink-0">
              {(card.colors || []).map((c, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${manaStyle(c)}`}
                >
                  {c}
                </span>
              ))}
              <span
                className={`w-5 h-5 rounded border text-[11px] font-bold flex items-center justify-center ${GRADE_STYLES[card.grade] || GRADE_STYLES.C}`}
              >
                {card.grade || "?"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}