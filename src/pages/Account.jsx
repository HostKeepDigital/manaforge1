import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { UserCircle, Mail, Shield, LogIn, LogOut, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Account() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="relative max-w-2xl mx-auto px-4 py-8 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-heading text-4xl sm:text-5xl text-foreground tracking-tight flex items-center justify-center gap-3">
            <UserCircle className="w-9 h-9 text-primary" />
            Account
          </h1>
          <p className="font-body text-muted-foreground text-lg mt-3">
            Your sign-in status and account details.
          </p>
        </motion.div>

        {user ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border p-6 space-y-6"
          >
            <div className="flex items-center gap-2 text-green-500 font-body font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              You are signed in
            </div>

            <div className="space-y-4">
              <Field icon={UserCircle} label="Name" value={user.full_name || "—"} />
              <Field icon={Mail} label="Email" value={user.email || "—"} />
              <Field icon={Shield} label="Role" value={user.role || "user"} />
            </div>

            <div className="pt-2 border-t border-border">
              <p className="font-body text-sm text-muted-foreground mb-3">
                Your generated decks are saved to this account and won't be lost when you close the site.
              </p>
              <Button
                variant="outline"
                onClick={() => base44.auth.logout()}
                className="gap-2 font-body"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border p-6 text-center space-y-4"
          >
            <p className="font-body text-muted-foreground">
              You are not signed in. Sign in to save and keep your Spice History.
            </p>
            <Button
              onClick={() => base44.auth.redirectToLogin()}
              className="gap-2 font-body"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary/30">
      <Icon className="w-5 h-5 text-primary shrink-0" />
      <div className="min-w-0">
        <div className="font-body text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="font-body text-foreground truncate capitalize">{value}</div>
      </div>
    </div>
  );
}