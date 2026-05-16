import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Sparkles, RotateCcw, Shield, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import ImageUploader from "../components/deck-builder/ImageUploader";
import LoadingState from "../components/deck-builder/LoadingState";

const MATCHUP_COLORS = {
  Favorable: "text-green-400 bg-green-400/10 border-green-400/30",
  Even: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  Unfavorable: "text-red-400 bg-red-400/10 border-red-400/30",
};

function MatchupCard({ matchup, index }) {
  const style = MATCHUP_COLORS[matchup.result] || MATCHUP_COLORS.Even;
  const winPct = matchup.estimated_win_rate;
  const barW = Math.max(5, Math.min(95, winPct));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="bg-card rounded-xl border border-border p-4 space-y-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-body font-semibold text-foreground">{matchup.opponent_deck}</p>
          <p className="text-xs text-muted-foreground font-body">{matchup.opponent_strategy}</p>
        </div>
        <span className={`text-xs font-body font-bold px-2.5 py-1 rounded-full border shrink-0 ${style}`}>
          {matchup.result}
        </span>
      </div>

      {/* Win rate bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs font-body text-muted-foreground">
          <span>Win Rate</span>
          <span className="font-semibold text-foreground">{winPct}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${barW}%` }}
            transition={{ delay: index * 0.07 + 0.3, duration: 0.5 }}
            className={`h-full rounded-full ${winPct >= 55 ? "bg-green-500" : winPct >= 45 ? "bg-blue-500" : "bg-red-500"}`}
          />
        </div>
      </div>

      <p className="text-sm font-body text-foreground/80">{matchup.explanation}</p>

      {matchup.key_interactions?.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-1.5">Key Interactions</p>
          <ul className="space-y-1">
            {matchup.key_interactions.map((item, i) => (
              <li key={i} className="text-xs font-body text-foreground/70 flex items-start gap-1.5">
                <span className="text-primary mt-0.5">•</span>{item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {matchup.sideboard_cards?.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Shield className="w-3 h-3" /> Sideboard Targets
          </p>
          <div className="flex flex-wrap gap-1.5">
            {matchup.sideboard_cards.map((c, i) => (
              <Badge key={i} variant="outline" className="font-body text-xs text-muted-foreground">{c}</Badge>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function MatchupAnalyzer() {
  const [imageFile, setImageFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deckName, setDeckName] = useState("");

  const analyze = async () => {
    if (!imageFile) return;
    setLoading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });

    const res = await base44.integrations.Core.InvokeLLM({
      model: "claude_sonnet_4_6",
      prompt: `You are a competitive MTG player and matchup specialist.

Analyze this MTG Arena deck screenshot and provide detailed matchup analysis against the current meta.
${deckName ? `Deck name hint: ${deckName}` : ""}

1. First identify the deck archetype and key cards from the screenshot.
2. Then analyze matchups against the top 6 current meta decks.

For each matchup provide:
- opponent_deck: name of the meta deck
- opponent_strategy: one-line description
- result: "Favorable", "Even", or "Unfavorable"
- estimated_win_rate: number 30-70
- explanation: 2 sentences explaining the matchup dynamic
- key_interactions: 2-3 specific card interactions that define this matchup
- sideboard_cards: 2-4 cards from the deck or general sideboard staples that help this matchup

Also provide:
- overall_meta_position: overall assessment of where this deck sits in the meta
- upgrade_suggestions: 3 cards that would most improve the deck`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          deck_name: { type: "string" },
          deck_archetype: { type: "string" },
          overall_meta_position: { type: "string" },
          upgrade_suggestions: { type: "array", items: { type: "string" } },
          matchups: {
            type: "array",
            items: {
              type: "object",
              properties: {
                opponent_deck: { type: "string" },
                opponent_strategy: { type: "string" },
                result: { type: "string" },
                estimated_win_rate: { type: "number" },
                explanation: { type: "string" },
                key_interactions: { type: "array", items: { type: "string" } },
                sideboard_cards: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
    });
    setResult(res);
    setLoading(false);
  };

  const favorable = result?.matchups?.filter(m => m.result === "Favorable").length || 0;
  const unfavorable = result?.matchups?.filter(m => m.result === "Unfavorable").length || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
      </div>
      <div className="relative max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="font-heading text-3xl text-foreground">Matchup Analyzer</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            Upload your deck screenshot to see how it performs against the current meta
          </p>
        </div>

        {!result && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Deck name (optional)"
              value={deckName}
              onChange={e => setDeckName(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <ImageUploader onImageSelected={setImageFile} isProcessing={loading} />
            {imageFile && !loading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
                <Button onClick={analyze} size="lg" className="gap-2 font-body px-8">
                  <Swords className="w-5 h-5" />
                  Analyze Matchups
                </Button>
              </motion.div>
            )}
            {loading && <LoadingState step={2} />}
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {/* Overview */}
              <div className="bg-card rounded-xl border border-border p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-heading text-xl text-foreground">{result.deck_name}</h2>
                    <p className="font-body text-xs text-muted-foreground">{result.deck_archetype}</p>
                  </div>
                  <div className="flex gap-3 text-sm font-body">
                    <span className="text-green-400 font-semibold">{favorable} Favorable</span>
                    <span className="text-red-400 font-semibold">{unfavorable} Unfavorable</span>
                  </div>
                </div>
                <p className="font-body text-sm text-foreground/80">{result.overall_meta_position}</p>
                {result.upgrade_suggestions?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Upgrade Suggestions
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.upgrade_suggestions.map((c, i) => (
                        <Badge key={i} variant="secondary" className="font-body text-xs">{c}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {(result.matchups || [])
                  .sort((a, b) => b.estimated_win_rate - a.estimated_win_rate)
                  .map((m, i) => <MatchupCard key={i} matchup={m} index={i} />)}
              </div>

              <Button variant="outline" onClick={() => { setResult(null); setImageFile(null); }} className="w-full gap-2 font-body">
                <RotateCcw className="w-4 h-4" /> Analyze Another Deck
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {!result && !loading && !imageFile && (
          <div className="text-center py-20 text-muted-foreground font-body">
            <Swords className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Upload a deck screenshot to analyze its meta matchups.</p>
          </div>
        )}
      </div>
    </div>
  );
}