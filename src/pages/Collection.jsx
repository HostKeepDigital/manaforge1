import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Library, Trash2, ChevronDown, ChevronUp, Sparkles, Plus, Loader2, LayoutGrid, List } from "lucide-react";
import MultiImageUploader from "../components/collection/MultiImageUploader";
import CollectionGrid from "../components/collection/CollectionGrid";
import { toast } from "sonner";

// Scan a single screenshot into a card array.
async function scanScreenshot(file) {
  const { file_url } = await base44.integrations.Core.UploadFile({ file });
  const result = await base44.integrations.Core.InvokeLLM({
    model: "claude_sonnet_4_6",
    prompt: `Identify ALL Magic: The Gathering cards visible in this MTG Arena screenshot. For each card provide: exact name, colors (W/U/B/R/G/C), type (Creature/Instant/Sorcery/Enchantment/Artifact/Planeswalker/Land), quantity, and mana_cost.`,
    file_urls: [file_url],
    response_json_schema: {
      type: "object",
      properties: {
        cards: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              colors: { type: "array", items: { type: "string" } },
              type: { type: "string" },
              quantity: { type: "number" },
              mana_cost: { type: "string" },
            },
          },
        },
      },
    },
  });
  return { cards: result?.cards || [], file_url };
}

// Merge duplicate card names, keeping the highest seen quantity.
function mergeCards(cardLists) {
  const map = new Map();
  cardLists.flat().forEach((c) => {
    if (!c?.name) return;
    const key = c.name.trim();
    const qty = Number(c.quantity) || 1;
    const existing = map.get(key);
    if (existing) existing.quantity = Math.max(existing.quantity, qty);
    else map.set(key, { ...c, name: key, quantity: qty });
  });
  return [...map.values()];
}

function CollectionEntry({ entry, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <Library className="w-4 h-4 text-primary" />
          <div>
            <p className="font-body font-semibold text-foreground text-sm">
              {entry.label || "Untitled Upload"}
            </p>
            <p className="text-xs text-muted-foreground font-body">
              {entry.cards?.length || 0} unique cards • {new Date(entry.uploaded_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
            className="w-7 h-7 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
            {(entry.cards || []).map((card, i) => (
              <div key={i} className="bg-secondary/40 rounded-md px-2 py-1.5 text-xs font-body text-foreground truncate">
                {card.quantity > 1 && <span className="text-primary font-semibold mr-1">{card.quantity}x</span>}
                {card.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function CollectionPage() {
  const [entries, setEntries] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState("");
  const [labelInput, setLabelInput] = useState("");
  const [view, setView] = useState("uploads");

  const load = async () => {
    const data = await base44.entities.Collection.list("-uploaded_at");
    setEntries(data);
  };

  useEffect(() => { load(); }, []);

  const handleScan = async () => {
    if (!imageFiles.length) return;
    setScanning(true);
    setProgress("");
    try {
      const cardLists = [];
      let firstUrl = null;
      for (let i = 0; i < imageFiles.length; i++) {
        setProgress(`Scanning screenshot ${i + 1} of ${imageFiles.length}...`);
        const { cards, file_url } = await scanScreenshot(imageFiles[i]);
        if (!firstUrl) firstUrl = file_url;
        cardLists.push(cards);
      }

      const merged = mergeCards(cardLists);
      setProgress("Saving to your collection...");

      await base44.entities.Collection.create({
        screenshot_url: firstUrl,
        cards: merged,
        uploaded_at: new Date().toISOString(),
        label: labelInput || `Collection ${new Date().toLocaleDateString()}`,
      });

      toast.success(`Added ${merged.length} unique cards from ${imageFiles.length} screenshot(s)!`);
      setShowUpload(false);
      setImageFiles([]);
      setLabelInput("");
      load();
    } catch (err) {
      toast.error(err?.message || "Failed to scan screenshots. Please try again.");
    } finally {
      setScanning(false);
      setProgress("");
    }
  };

  const handleDelete = async (id) => {
    await base44.entities.Collection.delete(id);
    toast.success("Removed from collection");
    load();
  };

  const totalUnique = [...new Set(entries.flatMap(e => (e.cards || []).map(c => c.name)))].length;
  const allCards = mergeCards(entries.map(e => e.cards || []));

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
      </div>
      <div className={`relative mx-auto px-4 py-10 ${view === "grid" ? "max-w-6xl" : "max-w-3xl"}`}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl text-foreground">My Collection</h1>
            <p className="font-body text-sm text-muted-foreground mt-1">
              {totalUnique} unique cards across {entries.length} uploads
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setView("uploads")}
                className={`p-2 transition-colors ${view === "uploads" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary/40"}`}
                title="Uploads view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("grid")}
                className={`p-2 transition-colors ${view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary/40"}`}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
            <Button onClick={() => setShowUpload(!showUpload)} className="gap-2 font-body">
              <Plus className="w-4 h-4" />
              Add Screenshot
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {showUpload && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 bg-card rounded-xl border border-border p-5 space-y-4 overflow-hidden"
            >
              <input
                type="text"
                placeholder="Label this upload (e.g. 'Rare Collection June')"
                value={labelInput}
                onChange={e => setLabelInput(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <MultiImageUploader files={imageFiles} onChange={setImageFiles} disabled={scanning} />
              {imageFiles.length > 0 && (
                <Button onClick={handleScan} disabled={scanning} className="w-full gap-2 font-body">
                  {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {scanning ? (progress || "Scanning Cards...") : `Scan & Save ${imageFiles.length} Screenshot${imageFiles.length > 1 ? "s" : ""}`}
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {view === "grid" ? (
          entries.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground font-body">
              <Library className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No collection uploads yet. Add your first screenshot!</p>
            </div>
          ) : (
            <CollectionGrid cards={allCards} />
          )
        ) : (
          <div className="space-y-3">
            {entries.length === 0 && (
              <div className="text-center py-20 text-muted-foreground font-body">
                <Library className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No collection uploads yet. Add your first screenshot!</p>
              </div>
            )}
            {entries.map(e => (
              <CollectionEntry key={e.id} entry={e} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}