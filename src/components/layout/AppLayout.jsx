import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Library, BarChart2, Swords, TrendingUp, BookOpen, Menu, X, Trophy, Lightbulb, GraduationCap, Youtube, Settings, History, PanelLeftClose, PanelLeftOpen, UserCircle, LibraryBig, Home
} from "lucide-react";

const NAV = [
  { path: "/", label: "Home", icon: Home },
  { path: "/deck-builder", label: "Deck Builder", icon: Sparkles },
  { path: "/bo1", label: "Daily Spice Rack", icon: Youtube },
  { path: "/spice-history", label: "Spice History", icon: History },
  { path: "/standard-cards", label: "Standard Cards", icon: LibraryBig },
  { path: "/ideas", label: "Deck Ideas", icon: Lightbulb },
  { path: "/mock-draft", label: "Mock Draft", icon: GraduationCap },
  { path: "/collection", label: "Collection", icon: Library },
  { path: "/draft", label: "Draft Assistant", icon: BookOpen },
  { path: "/meta", label: "Meta Tier List", icon: TrendingUp },
  { path: "/matchups", label: "Matchup Analyzer", icon: Swords },
  { path: "/stats", label: "My Stats", icon: BarChart2 },
  { path: "/admin/sets", label: "Manage Sets", icon: Settings },
  { path: "/account", label: "Account", icon: UserCircle },
];

export default function AppLayout() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar — desktop */}
      <aside className={`hidden lg:flex flex-col shrink-0 border-r border-border bg-sidebar sticky top-0 h-screen overflow-y-auto transition-all duration-200 ${collapsed ? "w-16" : "w-56"}`}>
        <div className={`py-6 border-b border-border flex items-center ${collapsed ? "justify-center px-2" : "justify-between px-5"}`}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="font-heading text-lg text-foreground">ArenaCraft</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title={collapsed ? "Expand menu" : "Collapse menu"}
          >
            {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-all
                ${collapsed ? "justify-center" : ""}
                ${pathname === path
                  ? "bg-primary/15 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <span className="font-heading text-lg text-foreground">ArenaCraft</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-muted-foreground hover:text-foreground">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.22 }}
            className="lg:hidden fixed inset-0 z-40 bg-background/95 pt-16 px-4"
          >
            <nav className="space-y-1 py-4">
              {NAV.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-body transition-all
                    ${pathname === path
                      ? "bg-primary/15 text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page content */}
      <main className="flex-1 min-w-0 pt-14 lg:pt-0 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}