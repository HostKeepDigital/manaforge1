import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Settings, RefreshCw, ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import SetStatusRow from "../components/admin/SetStatusRow";

export default function AdminSets() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sets, setSets] = useState([]);
  const [promotingId, setPromotingId] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const loadSets = async () => {
    const records = await base44.entities.SetGuide.list("-sort_order", 100);
    setSets(records || []);
  };

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        if (me?.role === "admin") await loadSets();
      } catch (_e) {
        setUser(null);
      }
      setLoading(false);
    })();
  }, []);

  const promote = async (set) => {
    setPromotingId(set.id);
    await base44.entities.SetGuide.update(set.id, { status: "current" });
    await loadSets();
    setPromotingId(null);
    toast.success(`${set.set_name} is now live.`);
  };

  const runSyncNow = async () => {
    setSyncing(true);
    const res = await base44.functions.invoke("syncSetReleaseStatus", {});
    await loadSets();
    setSyncing(false);
    const promoted = res?.data?.promoted?.length || 0;
    toast.success(promoted ? `Sync complete — ${promoted} set(s) released.` : "Sync complete — no sets due yet.");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <ShieldAlert className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h1 className="font-heading text-2xl text-foreground">Admins only</h1>
          <p className="font-body text-muted-foreground mt-2">
            This set management area is restricted to administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="relative max-w-3xl mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="font-heading text-3xl text-foreground flex items-center gap-2">
                <Settings className="w-7 h-7 text-primary" />
                Manage Sets
              </h1>
              <p className="font-body text-sm text-muted-foreground mt-1">
                Upcoming sets auto-release on their Scryfall date. Use "Release now" to flip one live early.
              </p>
            </div>
            <Button onClick={runSyncNow} disabled={syncing} variant="outline" className="gap-2 font-body">
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              Run sync now
            </Button>
          </div>
        </motion.div>

        <div className="space-y-2">
          {sets.map((s) => (
            <SetStatusRow
              key={s.id}
              set={s}
              promoting={promotingId === s.id}
              onPromote={promote}
            />
          ))}
        </div>
      </div>
    </div>
  );
}