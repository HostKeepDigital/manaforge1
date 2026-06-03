import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";

const STATUS_BADGE = {
  current: { label: "Current", className: "bg-green-500/15 text-green-400 border-green-500/30" },
  past: { label: "Past", className: "bg-secondary text-muted-foreground" },
  upcoming: { label: "Upcoming", className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
};

export default function SetStatusRow({ set, onPromote, promoting }) {
  const badge = STATUS_BADGE[set.status] || STATUS_BADGE.past;

  return (
    <div className="flex items-center justify-between gap-3 p-4 bg-card rounded-xl border border-border">
      <div className="min-w-0">
        <p className="font-body font-semibold text-foreground truncate">
          {set.set_name} <span className="text-muted-foreground font-normal">({set.set_code})</span>
        </p>
        <p className="text-xs text-muted-foreground font-body">{set.release_window || "—"}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Badge variant="outline" className={`font-body gap-1 ${badge.className}`}>
          {set.status === "upcoming" ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
          {badge.label}
        </Badge>
        {set.status === "upcoming" && (
          <Button
            size="sm"
            variant="outline"
            className="font-body gap-2"
            disabled={promoting}
            onClick={() => onPromote(set)}
          >
            {promoting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Release now
          </Button>
        )}
      </div>
    </div>
  );
}