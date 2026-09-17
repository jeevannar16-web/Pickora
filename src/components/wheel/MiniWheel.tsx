import { motion } from "framer-motion";
import { WheelType } from "@/types/wheel";
import { arcPath, TAU } from "@/lib/wheelGeometry";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

type MiniWheelProps = {
  colors: string[];
  count?: number;
  size?: number;
  hubColor?: string;
  type?: WheelType;
  rotating?: boolean;
  label?: string;
  labelColor?: string;
};

function desaturate(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  const c = gray.toString(16).padStart(2, "0");
  return `#${c}${c}${c}`;
}

/**
 * A tiny, always-alive wheel thumbnail used for pickers and previews. It spins
 * slowly on a loop so every choice reads as "what this will actually look
 * like" before the user commits to it. Honors prefers-reduced-motion.
 */
export function MiniWheel({
  colors,
  count: countProp,
  size = 40,
  hubColor = "#8B5CF6",
  type = "classic",
  rotating = true,
  label,
  labelColor = "#FFFFFF",
}: MiniWheelProps) {
  const reduced = usePrefersReducedMotion();
  const derived = Math.max(4, Math.min(countProp ?? colors.length, 8));
  const cx = size / 2;
  const cy = size / 2;
  const outer = size / 2 - (type === "compact" ? 2 : 3);
  const inner = type === "compact" ? size * 0.34 : size * 0.23;
  const slice = TAU / derived;
  const gap = type === "minimal" || type === "monochrome" ? 0 : slice * 0.03;

  const palette = (color: string, i: number): string => {
    if (type === "monochrome") return desaturate(color);
    if (type === "gradient") return color;
    if (type === "party") return color;
    return color;
  };

  const ringStroke =
    type === "neon"
      ? colors[0]
      : type === "minimal"
        ? "rgba(255,255,255,0.4)"
        : "rgba(255,255,255,0.18)";

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id={`mini-sheen-${type}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.g
        animate={
          rotating && !reduced ? { rotate: 360 } : { rotate: 0 }
        }
        transition={
          rotating && !reduced
            ? { duration: type === "party" ? 5 : 7, ease: "linear", repeat: Infinity }
            : undefined
        }
        style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: "view-box" as const }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={outer}
          fill={type === "monochrome" ? "#141414" : "rgba(255,255,255,0.03)"}
          stroke={ringStroke}
          strokeWidth={type === "minimal" ? 0.5 : 0.8}
        />
        {Array.from({ length: derived }, (_, i) => {
          const start = i * slice + gap;
          const end = (i + 1) * slice - gap;
          const fill = palette(colors[i % colors.length], i);
          return (
            <path
              key={i}
              d={arcPath(cx, cy, inner, outer, start, end)}
              fill={fill}
              stroke={type === "neon" ? "#ffffff" : "rgba(255,255,255,0.35)"}
              strokeWidth={type === "neon" ? 0.4 : 0.25}
              style={
                type === "neon"
                  ? ({ filter: `drop-shadow(0 0 ${size * 0.08}px ${fill})` } as React.CSSProperties)
                  : undefined
              }
            />
          );
        })}
        {label && (
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={type === "compact" ? size * 0.2 : size * 0.16}
            fontWeight={700}
            fill={labelColor}
            style={{ pointerEvents: "none" }}
          >
            {label}
          </text>
        )}
      </motion.g>
      <circle
        cx={cx}
        cy={cy}
        r={inner * 0.82}
        fill={hubColor}
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={0.5}
      />
      <circle cx={cx} cy={cy} r={inner * 0.82} fill={`url(#mini-sheen-${type})`} />
      <motion.circle
        cx={cx}
        cy={cy}
        r={(inner * 0.82) / 2}
        fill="#ffffff"
        opacity={0.5}
        animate={!reduced ? { opacity: [0.4, 0.8, 0.4] } : { opacity: 0.5 }}
        transition={!reduced ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" } : undefined}
      />
    </svg>
  );
}