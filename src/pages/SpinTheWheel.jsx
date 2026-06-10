import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dices, RotateCcw, Sparkles, Swords, Crosshair, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import SpinWheel from "../components/wheel/SpinWheel";

// MTG colors used in Round 2.
const COLORS = [
  { label: "White", color: "#f5e7c0", textColor: "#5b4a1a" },
  { label: "Blue", color: "#3b82c4", textColor: "#fff" },
  { label: "Black", color: "#2b2630", textColor: "#fff" },
  { label: "Red", color: "#c0392b", textColor: "#fff" },
  { label: "Green", color: "#3a8a4a", textColor: "#fff" },
];

// Round 1: how many colors (1-5).
const COUNT_SEGMENTS = [1, 2, 3, 4, 5].map((n) => ({
  label: String(n),
  color: n % 2 ? "#7c3aed" : "#a78bfa",
  textColor: "#fff",
}));

// Round 3: the Daily Spice Rack modes.
const MODES = [
  { key: "fun", label: "Spicy Fun", color: "#a855f7", textColor: "#fff", icon: Sparkles, desc: "Creative & surprising brew" },
  { key: "competitive", label: "Competitive", color: "#eab308", textColor: "#1a1a1a", icon: Swords, desc: "Meta-countering & tournament-viable" },
  { key: "metaSniper", label: "Meta Sniper", color: "#dc2626", textColor: "#fff", icon: Crosshair, desc: "Hard counter to top archetypes" },
];

export default function SpinTheWheel() {
  const [round, setRound] = useState(1);
  const [spinning, setSpinning] = useState(false);

  const [colorCount, setColorCount] = useState(null);
  const [remaining, setRemaining] = useState(COLORS); // colors still on the wheel
  const [pickedColors, setPickedColors] = useState([]);
  const [mode, setMode] = useState(null);

  // ---- Round 1: number of colors ----
  const onCountResult = (i) => {
    setSpinning(false);
    const count = i + 1; // segments are 1..5
    setColorCount(count);
    if (count === 5) {
      // All five colors are forced — skip Round 2 entirely.
      setPickedColors(COLORS);
      setRemaining([]);
      setTimeout(() => setRound(3), 900);
    } else {
      setTimeout(() => setRound(2), 900);
    }
  };

  // ---- Round 2: pick that many unique colors ----
  const onColorResult = (i) => {
    setSpinning(false);
    const picked = remaining[i];
    const nextPicked = [...pickedColors, picked];
    const nextRemaining = remaining.filter((_, idx) => idx !== i);
    setPickedColors(nextPicked);
    setRemaining(nextRemaining);

    if (nextPicked.length >= colorCount) {
      setTimeout(() => setRound(3), 900);
    }
  };

  // ---- Round 3: spice rack mode ----
  const onModeResult = (i) => {
    setSpinning(false);
    setMode(MODES[i]);
    setTimeout(() => setRound(4), 900);
  };

  const reset = () => {
    setRound(1);
    setSpinning(false);
    setColorCount(null);
    setRemaining(COLORS);
    setPickedColors([]);
    setMode(null);
  };

  const ModeIcon = mode?.icon || Youtube;

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-accent/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 py-8 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-heading text-4xl sm:text-5xl text-foreground tracking-tight flex items-center justify-center gap-3">
            <Dices className="w-9 h-9 text-primary" />
            Spin the Wheel
          </h1>
          <p className="font-body text-muted-foreground text-lg mt-3 max-w-xl mx-auto">
            Let fate decide your daily brew. Spin for colors, then a Spice Rack mode — totally out of your control.
          </p>
        </motion.div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((r) => (
            <div
              key={r}
              className={`h-2 rounded-full transition-all ${
                round > r ? "w-10 bg-primary" : round === r ? "w-10 bg-primary/60" : "w-6 bg-secondary"
              }`}
            />
          ))}
        </div>

        {/* Picked-so-far summary */}
        {(colorCount || pickedColors.length > 0) && round < 4 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {colorCount && (
              <span className="px-3 py-1 rounded-full bg-secondary text-sm font-body text-foreground">
                {colorCount} color{colorCount > 1 ? "s" : ""}
              </span>
            )}
            {pickedColors.map((c) => (
              <span
                key={c.label}
                className="px-3 py-1 rounded-full text-sm font-body font-semibold"
                style={{ backgroundColor: c.color, color: c.textColor }}
              >
                {c.label}
              </span>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Round 1 */}
          {round === 1 && (
            <motion.div key="r1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="font-heading text-2xl text-center text-foreground mb-6">Round 1 — Number of Colors</h2>
              <SpinWheel
                segments={COUNT_SEGMENTS}
                spinning={spinning}
                onSpin={() => setSpinning(true)}
                onResult={onCountResult}
              />
            </motion.div>
          )}

          {/* Round 2 */}
          {round === 2 && (
            <motion.div key="r2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="font-heading text-2xl text-center text-foreground mb-2">
                Round 2 — Pick {colorCount} Color{colorCount > 1 ? "s" : ""}
              </h2>
              <p className="font-body text-center text-muted-foreground mb-6">
                Color {pickedColors.length + 1} of {colorCount} — picked colors leave the wheel.
              </p>
              <SpinWheel
                segments={remaining}
                spinning={spinning}
                disabled={remaining.length === 0}
                onSpin={() => setSpinning(true)}
                onResult={onColorResult}
              />
            </motion.div>
          )}

          {/* Round 3 */}
          {round === 3 && (
            <motion.div key="r3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="font-heading text-2xl text-center text-foreground mb-6">Round 3 — Spice Rack Mode</h2>
              <SpinWheel
                segments={MODES}
                spinning={spinning}
                onSpin={() => setSpinning(true)}
                onResult={onModeResult}
              />
            </motion.div>
          )}

          {/* Result */}
          {round === 4 && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-2xl border border-border p-8 text-center space-y-6"
            >
              <h2 className="font-heading text-3xl text-primary">Your Daily Brew!</h2>

              <div className="flex flex-wrap items-center justify-center gap-2">
                {pickedColors.map((c) => (
                  <span
                    key={c.label}
                    className="px-4 py-2 rounded-full font-body font-bold"
                    style={{ backgroundColor: c.color, color: c.textColor }}
                  >
                    {c.label}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-center gap-3">
                <ModeIcon className="w-6 h-6" style={{ color: mode?.color }} />
                <div className="text-left">
                  <p className="font-heading text-xl text-foreground">{mode?.label}</p>
                  <p className="font-body text-sm text-muted-foreground">{mode?.desc}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  to="/bo1"
                  className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-body font-bold hover:bg-primary/90 transition-all"
                >
                  Build it in the Spice Rack
                </Link>
                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-secondary text-foreground font-body font-semibold hover:bg-secondary/70 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  Spin Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {round < 4 && (
          <div className="text-center mt-8">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Start over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}