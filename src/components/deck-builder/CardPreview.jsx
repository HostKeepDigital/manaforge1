import React, { useState, useRef } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Loader2, ImageOff } from "lucide-react";

// Simple in-memory cache so we don't refetch the same card
const imageCache = {};

export default function CardPreview({ name, children }) {
  const [status, setStatus] = useState("idle"); // idle | loading | loaded | error
  const [imageUrl, setImageUrl] = useState(imageCache[name] || null);
  const fetchedRef = useRef(false);

  const fetchCard = async () => {
    if (fetchedRef.current || !name) return;
    fetchedRef.current = true;

    if (imageCache[name]) {
      setImageUrl(imageCache[name]);
      setStatus("loaded");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch(
        `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`
      );
      if (!res.ok) throw new Error("not found");
      const data = await res.json();
      const url =
        data.image_uris?.normal ||
        data.card_faces?.[0]?.image_uris?.normal ||
        null;
      if (!url) throw new Error("no image");
      imageCache[name] = url;
      setImageUrl(url);
      setStatus("loaded");
    } catch {
      setStatus("error");
    }
  };

  return (
    <HoverCard openDelay={150} closeDelay={50}>
      <HoverCardTrigger asChild onMouseEnter={fetchCard} onFocus={fetchCard}>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-[240px] p-1.5 bg-card border-border">
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center h-[300px] gap-2 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-xs font-body">Loading {name}…</span>
          </div>
        )}
        {status === "error" && (
          <div className="flex flex-col items-center justify-center h-[140px] gap-2 text-muted-foreground text-center px-3">
            <ImageOff className="w-6 h-6" />
            <span className="text-xs font-body">No preview found for "{name}"</span>
          </div>
        )}
        {status === "loaded" && imageUrl && (
          <img
            src={imageUrl}
            alt={name}
            className="w-full rounded-md"
            loading="lazy"
          />
        )}
      </HoverCardContent>
    </HoverCard>
  );
}