import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, Loader2 } from "lucide-react";

// Lets the user iterate on an already-built deck with further ideas
// (e.g. "lean harder into Sneak", "cut the splash", "more removal").
export default function DeckRefiner({ onRefine, isRefining }) {
  const [text, setText] = useState("");

  const submit = async () => {
    if (!text.trim() || isRefining) return;
    await onRefine(text.trim());
    setText("");
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Wand2 className="w-4 h-4 text-primary" />
        <h3 className="font-heading text-lg text-foreground">Refine this deck</h3>
      </div>
      <p className="font-body text-sm text-muted-foreground">
        Want changes? Describe further ideas and the build will be updated — e.g. "lean harder into the Sneak mechanic", "make it more aggressive", or "add more removal".
      </p>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add your refinement ideas..."
        className="min-h-20 font-body"
        disabled={isRefining}
      />
      <div className="flex justify-end">
        <Button
          onClick={submit}
          disabled={!text.trim() || isRefining}
          className="gap-2 font-body bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isRefining ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Refining...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              Update Deck
            </>
          )}
        </Button>
      </div>
    </div>
  );
}