import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star, Trash2, ChevronDown, CheckCircle2, Sparkles, Swords, Smile, Zap,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import ColorPips from "../bo1/ColorPips";
import Bo1DeckDisplay from "../bo1/Bo1DeckDisplay";
import { savedDeckToDisplay } from "@/lib/deckUtils";

const RATING_META = [
  { key: "competitiveness", icon: Swords, label: "Comp" },
  { key: "entertainment", icon: Smile, label: "Fun" },
  { key: "surprise", icon: Zap, label: "Surprise" },
];

export default function HistoryDeckCard({ deck, onToggleFavorite, onDelete }) {
  const [open, setOpen] = useState(false);
  const r = deck.ratings || {};

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <button onClick={() => setOpen((v) => !v)} className="flex-1 text-left min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-heading text-lg text-foreground truncate">{deck.deck_name}</h3>
              {deck.verified_legal && (
                <Badge className="gap-1 bg-green-600/20 text-green-400 border-green-600/30 font-body text-xs">
                  <CheckCircle2 className="w-3 h-3" /> Standard Legal
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <ColorPips colors={deck.colors} />
              {deck.category && (
                <Badge variant="secondary" className="gap-1 font-body text-xs">
                  <Sparkles className="w-3 h-3" /> {deck.category}
                </Badge>
              )}
              {deck.generated_at && (
                <span className="text-xs text-muted-foreground font-body">
                  {format(new Date(deck.generated_at), "MMM d, yyyy")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2">
              {RATING_META.map(({ key, icon: Icon, label }) => (
                <span key={key} className="flex items-center gap-1 text-xs text-muted-foreground font-body">
                  <Icon className="w-3 h-3 text-primary" /> {label} {r[key] ?? 0}
                </span>
              ))}
            </div>
          </button>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleFavorite(deck)}
              className={deck.favorite ? "text-primary" : "text-muted-foreground"}
            >
              <Star className={`w-4 h-4 ${deck.favorite ? "fill-primary" : ""}`} />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this deck?</AlertDialogTitle>
                  <AlertDialogDescription>
                    "{deck.deck_name}" will be permanently removed from your history.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(deck)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)} className="text-muted-foreground">
              <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="p-4 sm:p-5">
              <Bo1DeckDisplay deck={savedDeckToDisplay(deck)} mtgaString={deck.mtga_decklist} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}