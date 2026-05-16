import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, LineChart, Line, CartesianGrid,
} from "recharts";
import { BarChart2, Plus, Trash2, Trophy, TrendingUp, TrendingDown, X } from "lucide-react";
import { toast } from "sonner";

const RANKS = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Mythic"];
const ARCHETYPES = [
  "Mono-Red Aggro", "Azorius Soldiers", "Rakdos Midrange", "Domain Ramp",
  "Esper Midrange", "Golgari Midrange", "Azorius Control", "Mono-White Aggro",
  "Other"
];

function LogGameModal({ onSave, onClose }) {
  const [form, setForm] = useState({
    deck_name: "", archetype: "Other", result: "win",
    opponent_archetype: "Other", rank: "Gold", turns: "", notes: "", played_at: new Date().toISOString().split("T")[0]
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-xl text-foreground">Log Game</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground hover:text-foreground" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-1 block">Deck Name</label>
            <input
              value={form.deck_name}
              onChange={e => setForm({ ...form, deck_name: e.target.value })}
              placeholder="My Rakdos deck"
              className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {[
            { key: "result", label: "Result", opts: ["win", "loss", "draw"] },
            { key: "rank", label: "Rank", opts: RANKS },
            { key: "archetype", label: "My Archetype", opts: ARCHETYPES },
            { key: "opponent_archetype", label: "Opponent", opts: ARCHETYPES },
          ].map(({ key, label, opts }) => (
            <div key={key}>
              <label className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-1 block">{label}</label>
              <select
                value={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                className="w-full bg-secondary/50 border border-border rounded-lg px-2 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div>
            <label className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-1 block">Turns</label>
            <input
              type="number"
              value={form.turns}
              onChange={e => setForm({ ...form, turns: e.target.value })}
              placeholder="8"
              className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-1 block">Date</label>
            <input
              type="date"
              value={form.played_at}
              onChange={e => setForm({ ...form, played_at: e.target.value })}
              className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-1 block">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Key moments, mistakes, learnings..."
              rows={2}
              className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
        </div>

        <Button onClick={() => onSave(form)} className="w-full font-body">Save Game</Button>
      </motion.div>
    </motion.div>
  );
}

export default function MyStats() {
  const [sessions, setSessions] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    const data = await base44.entities.GameSession.list("-played_at", 200);
    setSessions(data);
  };
  useEffect(() => { load(); }, []);

  const saveGame = async (form) => {
    await base44.entities.GameSession.create({
      ...form,
      turns: form.turns ? parseInt(form.turns) : undefined,
    });
    toast.success("Game logged!");
    setShowModal(false);
    load();
  };

  const deleteGame = async (id) => {
    await base44.entities.GameSession.delete(id);
    load();
  };

  // Stats
  const total = sessions.length;
  const wins = sessions.filter(s => s.result === "win").length;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const avgTurns = sessions.filter(s => s.turns).length > 0
    ? (sessions.filter(s => s.turns).reduce((a, s) => a + s.turns, 0) / sessions.filter(s => s.turns).length).toFixed(1)
    : "—";

  // Win rate by archetype
  const archetypeStats = {};
  sessions.forEach(s => {
    if (!s.archetype) return;
    if (!archetypeStats[s.archetype]) archetypeStats[s.archetype] = { wins: 0, total: 0 };
    archetypeStats[s.archetype].total++;
    if (s.result === "win") archetypeStats[s.archetype].wins++;
  });
  const archetypeData = Object.entries(archetypeStats)
    .map(([name, d]) => ({ name: name.replace(" ", "\n"), wr: Math.round((d.wins / d.total) * 100), total: d.total }))
    .sort((a, b) => b.total - a.total).slice(0, 6);

  // Results pie
  const pieData = [
    { name: "Win", value: wins, color: "#34d399" },
    { name: "Loss", value: sessions.filter(s => s.result === "loss").length, color: "#f87171" },
    { name: "Draw", value: sessions.filter(s => s.result === "draw").length, color: "#94a3b8" },
  ].filter(d => d.value > 0);

  // Win rate trend (last 20 games in batches of 5)
  const recentSessions = [...sessions].reverse();
  const trendData = [];
  for (let i = 0; i < Math.min(recentSessions.length, 40); i += 5) {
    const batch = recentSessions.slice(i, i + 5);
    const batchWins = batch.filter(s => s.result === "win").length;
    trendData.push({ game: `G${i + 1}-${i + batch.length}`, wr: Math.round((batchWins / batch.length) * 100) });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
      </div>
      <div className="relative max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl text-foreground">My Stats</h1>
            <p className="font-body text-sm text-muted-foreground mt-1">Track your ladder climb and performance</p>
          </div>
          <Button onClick={() => setShowModal(true)} className="gap-2 font-body">
            <Plus className="w-4 h-4" /> Log Game
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Games", value: total, icon: BarChart2 },
            { label: "Win Rate", value: `${winRate}%`, icon: Trophy },
            { label: "Wins", value: wins, icon: TrendingUp },
            { label: "Avg Turns", value: avgTurns, icon: TrendingDown },
          ].map(({ label, value, icon: Icon }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-card rounded-xl border border-border p-4 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="font-heading text-xl text-foreground">{value}</div>
                <div className="text-xs text-muted-foreground font-body">{label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {sessions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Win/Loss Pie */}
            <div className="bg-card rounded-xl border border-border p-5">
              <p className="font-heading text-sm text-foreground mb-3">Results Breakdown</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Legend formatter={(v) => <span className="text-xs font-body text-foreground">{v}</span>} />
                  <Tooltip formatter={(v) => [v, ""]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontFamily: "var(--font-body)", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Trend */}
            {trendData.length > 1 && (
              <div className="bg-card rounded-xl border border-border p-5">
                <p className="font-heading text-sm text-foreground mb-3">Win Rate Trend</p>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="game" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v) => [`${v}%`, "Win Rate"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontFamily: "var(--font-body)", fontSize: 12 }} />
                    <Line type="monotone" dataKey="wr" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Win rate by archetype */}
        {archetypeData.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-5 mb-6">
            <p className="font-heading text-sm text-foreground mb-3">Win Rate by Archetype</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={archetypeData} barSize={28} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`${v}%`, "Win Rate"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontFamily: "var(--font-body)", fontSize: 12 }} />
                <Bar dataKey="wr" radius={[6, 6, 0, 0]}>
                  {archetypeData.map((e, i) => <Cell key={i} fill={e.wr >= 55 ? "#34d399" : e.wr >= 45 ? "#60a5fa" : "#f87171"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent games list */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <p className="font-heading text-sm text-foreground">Recent Games</p>
          </div>
          {sessions.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground font-body">
              <BarChart2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No games logged yet. Click "Log Game" to start tracking!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sessions.slice(0, 30).map((s, i) => (
                <div key={s.id} className="flex items-center justify-between px-5 py-2.5 hover:bg-secondary/20 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${s.result === "win" ? "bg-green-400" : s.result === "loss" ? "bg-red-400" : "bg-slate-400"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-body font-medium text-foreground truncate">{s.deck_name || s.archetype}</p>
                      <p className="text-xs text-muted-foreground font-body">vs {s.opponent_archetype} · {s.rank}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge
                      variant="outline"
                      className={`font-body text-xs ${s.result === "win" ? "text-green-400 border-green-400/30" : s.result === "loss" ? "text-red-400 border-red-400/30" : "text-muted-foreground"}`}
                    >
                      {s.result}
                    </Badge>
                    <button
                      onClick={() => deleteGame(s.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && <LogGameModal onSave={saveGame} onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  );
}