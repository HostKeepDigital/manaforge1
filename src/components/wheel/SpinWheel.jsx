import React, { useState, useRef } from "react";

// A reusable spinning wheel. `segments` is an array of { label, color, textColor }.
// Calls onResult(index) when the spin animation finishes. Always lands on a
// randomly chosen segment (passed in via spinTo) but shows it through the spin.
export default function SpinWheel({ segments, onSpin, onResult, spinning, disabled }) {
  const [rotation, setRotation] = useState(0);
  const spinningRef = useRef(false);

  const size = 320;
  const r = size / 2;
  const n = segments.length;
  const anglePer = 360 / n;

  const spin = () => {
    if (spinningRef.current || disabled || !n) return;
    spinningRef.current = true;

    // Randomly pick the winning segment.
    const winner = Math.floor(Math.random() * n);
    onSpin?.();

    // The pointer sits at the top (12 o'clock). Compute the rotation that brings
    // the center of the winning segment under the pointer, plus extra full spins.
    const segmentCenter = winner * anglePer + anglePer / 2;
    const extraSpins = 5 * 360;
    const target = extraSpins + (360 - segmentCenter);

    // Keep accumulating so each spin always rotates forward.
    setRotation((prev) => {
      const base = Math.floor(prev / 360) * 360;
      return base + target;
    });

    window.setTimeout(() => {
      spinningRef.current = false;
      onResult?.(winner);
    }, 4200);
  };

  // Build pie slices.
  const slices = segments.map((seg, i) => {
    const start = (i * anglePer - 90) * (Math.PI / 180);
    const end = ((i + 1) * anglePer - 90) * (Math.PI / 180);
    const x1 = r + r * Math.cos(start);
    const y1 = r + r * Math.sin(start);
    const x2 = r + r * Math.cos(end);
    const y2 = r + r * Math.sin(end);
    const largeArc = anglePer > 180 ? 1 : 0;
    const path = `M ${r} ${r} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    // Label position (mid-radius along the slice center).
    const mid = ((i + 0.5) * anglePer - 90) * (Math.PI / 180);
    const lr = r * 0.62;
    const lx = r + lr * Math.cos(mid);
    const ly = r + lr * Math.sin(mid);
    const rot = (i + 0.5) * anglePer;

    return { seg, path, lx, ly, rot, i };
  });

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Pointer */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-2 z-20">
          <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[24px] border-l-transparent border-r-transparent border-t-primary drop-shadow-lg" />
        </div>

        <svg
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          className="rounded-full border-4 border-primary/40 shadow-2xl"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinningRef.current
              ? "transform 4.2s cubic-bezier(0.17, 0.67, 0.12, 0.99)"
              : "none",
          }}
        >
          {slices.map(({ seg, path, lx, ly, rot, i }) => (
            <g key={i}>
              <path d={path} fill={seg.color} stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" />
              <text
                x={lx}
                y={ly}
                fill={seg.textColor || "#fff"}
                fontSize={n > 5 ? 13 : 16}
                fontWeight="700"
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${rot}, ${lx}, ${ly})`}
                style={{ fontFamily: "var(--font-body)" }}
              >
                {seg.label}
              </text>
            </g>
          ))}
          <circle cx={r} cy={r} r="22" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="3" />
        </svg>
      </div>

      <button
        onClick={spin}
        disabled={spinning || disabled}
        className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-body font-bold text-lg shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {spinning ? "Spinning..." : "SPIN"}
      </button>
    </div>
  );
}