import React from "react";
import { motion } from "framer-motion";
import {
  Sparkles, Youtube, History, LibraryBig, Lightbulb, GraduationCap,
  Library, BookOpen, TrendingUp, Swords, BarChart2, Trophy, Dices
} from "lucide-react";
import FeatureCard from "../components/home/FeatureCard";

const FEATURES = [
  { to: "/deck-builder", icon: Sparkles, title: "Deck Builder", description: "Upload an Arena screenshot and let AI build your most optimal deck with synergy & win-rate analysis." },
  { to: "/bo1", icon: Youtube, title: "Daily Spice Rack", description: "Generate an original, off-meta Standard brew built for YouTube — fun or competitive." },
  { to: "/spin", icon: Dices, title: "Spin the Wheel", description: "Let fate pick your colors and brew mode — randomize your daily video, totally out of your control." },
  { to: "/spice-history", icon: History, title: "Spice History", description: "Revisit, favorite, and manage every deck you've generated." },
  { to: "/standard-cards", icon: LibraryBig, title: "Standard Cards", description: "Browse every Standard-legal card live from Scryfall, by set and color." },
  { to: "/ideas", icon: Lightbulb, title: "Deck Ideas", description: "Describe a strategy and get a tournament-ready, format-legal decklist." },
  { to: "/mock-draft", icon: GraduationCap, title: "Mock Draft", description: "Practice drafting full sets with optional AI pick recommendations." },
  { to: "/collection", icon: Library, title: "Collection", description: "Scan and organize your card collection from screenshots." },
  { to: "/draft", icon: BookOpen, title: "Draft Assistant", description: "Get real-time pick advice and synergy notes during a draft." },
  { to: "/meta", icon: TrendingUp, title: "Meta Tier List", description: "Browse the strongest current archetypes ranked by tier." },
  { to: "/matchups", icon: Swords, title: "Matchup Analyzer", description: "See how your deck performs against the current meta." },
  { to: "/stats", icon: BarChart2, title: "My Stats", description: "Log your games and track win rates and trends over time." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-10 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trophy className="w-7 h-7 text-primary" />
            <span className="font-heading text-xl text-foreground tracking-wide">ArenaCraft</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-foreground tracking-tight">
            Your MTG Arena <span className="text-primary">Command Center</span>
          </h1>
          <p className="font-body text-muted-foreground text-lg mt-4 max-w-2xl mx-auto">
            Build decks, brew off-meta spice, browse the Standard pool, and track your climb — all powered by AI.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.to} index={i} {...f} />
          ))}
        </div>
      </div>
    </div>
  );
}