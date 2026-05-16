import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Library, Upload, Trash2, ChevronDown, ChevronUp, Sparkles, Plus } from "lucide-react";
import ImageUploader from "../components/deck-builder/ImageUploader";
import { toast } from "sonner";

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
  const [imageFile, setImageFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [labelInput, setLabelInput] = useState("");

  const load = async () => {
    const data = await base44.entities.Collection.list("-uploaded_at");
    setEntries(data);
  };

  useEffect(() => { load(); }, []);

  const handleScan = async () => {
    if (!imageFile) return;
    setScanning(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
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

    await base44.entities.Collection.create({
      screenshot_url: file_url,
      cards: result.cards || [],
      uploaded_at: new Date().toISOString(),
      label: labelInput || `Collection ${new Date().toLocaleDateString()}`,
    });

    toast.success(`Added ${result.cards?.length || 0} cards to your collection!`);
    setScanning(false);
    setShowUpload(false);
    setImageFile(null);
    setLabelInput("");
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.Collection.delete(id);
    toast.success("Removed from collection");
    load();
  };

  const totalUnique = [...new Set(entries.flatMap(e => (e.cards || []).map(c => c.name)))].length;

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
      </div>
      <div className="relative max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl text-foreground">My Collection</h1>
            <p className="font-body text-sm text-muted-foreground mt-1">
              {totalUnique} unique cards across {entries.length} uploads
            </p>
          </div>
          <Button onClick={() => setShowUpload(!showUpload)} className="gap-2 font-body">
            <Plus className="w-4 h-4" />
            Add Screenshot
          </Button>
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
              <ImageUploader onImageSelected={setImageFile} isProcessing={scanning} />
              {imageFile && (
                <Button onClick={handleScan} disabled={scanning} className="w-full gap-2 font-body">
                  <Sparkles className="w-4 h-4" />
                  {scanning ? "Scanning Cards..." : "Scan & Save"}
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

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
      </div>
    </div>
  );
}