import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Play, RotateCcw, Eye, EyeOff, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { buildPack, bestPickIndex } from "../components/mock-draft/draftUtils";
import DraftCard from "../components/mock-draft/DraftCard";
import DraftPool from "../components/mock-draft/DraftPool";

const TOTAL_PICKS = 15;

export default function MockDraft() {
  const [sets, setSets] = useState([]);
  const [loadingSets, setLoadingSets] = useState(true);
  const [selectedSetId, setSelectedSetId] = useState("");
  const [activeSet, setActiveSet] = useState(null);

  const [pack, setPack] = useState([]);
  const [pool, setPool] = useState([]);
  const [pickNumber, setPickNumber] = useState(1);
  const [showBest, setShowBest] = useState(true);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    (async () => {
      const records = await base44.entities.SetGuide.list("sort_order", 100);
      // Only sets that actually have graded cards can be drafted.
      const drafted = (records || []).filter((s) => (s.cards || []).length >= 15);
      setSets(drafted);
      if (drafted[0]) setSelectedSetId(drafted[0].id);
      setLoadingSets(false);
    })();
  }, []);

  const startDraft = () => {
    const set = sets.find((s) => s.id === selectedSetId);
    if (!set) return;
    setActiveSet(set);
    setPool([]);
    setPickNumber(1);
    setPack(buildPack(set.cards));
    setStarted(true);
  };

  const pickCard = (card) => {
    const newPool = [...pool, card];
    setPool(newPool);
    if (pickNumber >= TOTAL_PICKS) {
      setPack([]);
      setPickNumber(pickNumber + 1);
      return;
    }
    setPickNumber(pickNumber + 1);
    setPack(buildPack(activeSet.cards));
  };

  const reset = () => {
    setStarted(false);
    setActiveSet(null);
    setPack([]);
    setPool([]);
    setPickNumber(1);
  };

  const finished = started && pickNumber > TOTAL_PICKS;
  const best = pack.length ? bestPickIndex(pack) : -1;

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-8 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 sm:mb-12"
        >
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-foreground tracking-tight">
            Mock <span className="text-primary">Draft</span>
          </h1>
          <p className="font-body text-muted-foreground text-lg mt-4 max-w-xl mx-auto">
            Pick a set and simulate opening 15-card packs. Each pick comes with a grade-based "best pick" recommendation to sharpen your drafting instincts.
          </p>
        </motion.div>

        {/* Setup */}
        {!started && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border p-6 space-y-6 max-w-lg mx-auto"
          >
            {loadingSets ? (
              <p className="font-body text-center text-muted-foreground py-4">Loading sets...</p>
            ) : sets.length === 0 ? (
              <p className="font-body text-center text-muted-foreground py-4">
                No graded set guides are available yet to draft from.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="font-body">Set</Label>
                  <Select value={selectedSetId} onValueChange={setSelectedSetId}>
                    <SelectTrigger className="font-body">
                      <SelectValue placeholder="Choose a set" />
                    </SelectTrigger>
                    <SelectContent>
                      {sets.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.set_name} ({s.set_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="font-body">Show best pick hint</Label>
                  <Switch checked={showBest} onCheckedChange={setShowBest} />
                </div>

                <Button
                  onClick={startDraft}
                  size="lg"
                  className="w-full gap-2 font-body text-base py-6 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Play className="w-5 h-5" />
                  Start Mock Draft
                </Button>
              </>
            )}
          </motion.div>
        )}

        {/* Active draft */}
        {started && !finished && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-heading text-xl text-foreground">{activeSet?.set_name}</h2>
                  <p className="font-body text-sm text-muted-foreground">
                    Pick {pickNumber} of {TOTAL_PICKS}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBest((v) => !v)}
                  className="gap-2 font-body"
                >
                  {showBest ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showBest ? "Hide" : "Show"} Hint
                </Button>
                <Button variant="outline" size="sm" onClick={reset} className="gap-2 font-body">
                  <RotateCcw className="w-4 h-4" />
                  Restart
                </Button>
              </div>
            </div>

            <p className="font-body text-sm text-muted-foreground">
              Click a card to draft it. {showBest ? "The highlighted card is the recommended pick by grade." : "Hint is hidden — trust your instincts!"}
            </p>

            <AnimatePresence mode="wait">
              <motion.div
                key={pickNumber}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5"
              >
                {pack.map((card, i) => (
                  <DraftCard
                    key={`${card.name}-${i}`}
                    card={card}
                    index={i}
                    isBest={i === best}
                    showBest={showBest}
                    onPick={pickCard}
                  />
                ))}
              </motion.div>
            </AnimatePresence>

            <DraftPool pool={pool} />
          </div>
        )}

        {/* Finished */}
        {finished && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-card rounded-xl border border-border p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-7 h-7 text-primary" />
              </div>
              <h2 className="font-heading text-2xl text-foreground">Draft Complete!</h2>
              <p className="font-body text-muted-foreground mt-2">
                You drafted {pool.length} cards from {activeSet?.set_name}. Review your pool below.
              </p>
            </div>

            <DraftPool pool={pool} />

            <div className="flex justify-center pt-2">
              <Button onClick={reset} variant="outline" className="gap-2 font-body">
                <RotateCcw className="w-4 h-4" />
                New Draft
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}