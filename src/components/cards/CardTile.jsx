import React from "react";

// A single Magic card with its real Scryfall image. Falls back to a name plate
// if the image is missing.
export default function CardTile({ card }) {
  return (
    <div className="group relative rounded-lg overflow-hidden border border-border bg-card aspect-[5/7]">
      {card.image_normal ? (
        <img
          src={card.image_normal}
          alt={card.name}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center p-2 text-center">
          <span className="font-body text-xs text-muted-foreground">{card.name}</span>
        </div>
      )}
    </div>
  );
}