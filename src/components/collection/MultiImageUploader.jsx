import React, { useCallback, useState } from "react";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MultiImageUploader({ files, onChange, disabled }) {
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback((fileList) => {
    const imgs = Array.from(fileList || []).filter((f) => f.type.startsWith("image/"));
    if (imgs.length) onChange([...files, ...imgs]);
  }, [files, onChange]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    addFiles(e.dataTransfer.files);
  }, [addFiles, disabled]);

  const removeAt = (idx) => onChange(files.filter((_, i) => i !== idx));

  return (
    <div className="w-full space-y-3">
      <label
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center w-full min-h-[180px] border-2 border-dashed rounded-xl transition-all duration-300
          ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
          ${dragOver ? "border-primary bg-primary/10 scale-[1.01]" : "border-muted-foreground/30 hover:border-primary/50 hover:bg-card/50"}`}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={disabled}
          onChange={(e) => addFiles(e.target.files)}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3 p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            {dragOver ? <ImageIcon className="w-7 h-7 text-primary" /> : <Upload className="w-7 h-7 text-primary/70" />}
          </div>
          <div>
            <p className="text-foreground font-body font-medium">Drop your Arena screenshots</p>
            <p className="text-muted-foreground font-body text-sm mt-1">
              Add as many as you like • PNG, JPG supported
            </p>
          </div>
        </div>
      </label>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-3 sm:grid-cols-4 gap-2"
          >
            {files.map((file, i) => (
              <div key={i} className="relative rounded-lg overflow-hidden border border-border bg-card aspect-video">
                <img src={URL.createObjectURL(file)} alt={`screenshot ${i + 1}`} className="w-full h-full object-cover" />
                {!disabled && (
                  <button
                    onClick={() => removeAt(i)}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}