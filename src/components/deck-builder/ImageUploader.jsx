import React, { useCallback, useState } from "react";
import { Upload, Image, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function ImageUploader({ onImageSelected, isProcessing }) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
    onImageSelected(file);
  }, [onImageSelected]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  const clearPreview = () => {
    setPreview(null);
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-xl overflow-hidden border-2 border-primary/30 bg-card"
          >
            <img
              src={preview}
              alt="MTG Arena screenshot"
              className="w-full max-h-[400px] object-contain bg-black/50"
            />
            {!isProcessing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearPreview}
                className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <p className="text-sm text-primary font-body">Analyzing cards...</p>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.label
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`
              flex flex-col items-center justify-center w-full min-h-[280px]
              border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300
              ${dragOver
                ? "border-primary bg-primary/10 scale-[1.01]"
                : "border-muted-foreground/30 hover:border-primary/50 hover:bg-card/50"
              }
            `}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-4 p-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                {dragOver ? (
                  <Image className="w-8 h-8 text-primary" />
                ) : (
                  <Upload className="w-8 h-8 text-primary/70" />
                )}
              </div>
              <div className="text-center">
                <p className="text-foreground font-body font-medium text-lg">
                  Drop your MTG Arena screenshot
                </p>
                <p className="text-muted-foreground font-body text-sm mt-1">
                  or click to browse • PNG, JPG supported
                </p>
              </div>
            </div>
          </motion.label>
        )}
      </AnimatePresence>
    </div>
  );
}