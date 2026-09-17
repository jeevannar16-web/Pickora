import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Participant } from "@/types/participant";
import { Theme } from "@/types/theme";
import { WheelSettings } from "@/types/wheel";
import {
  arcPath,
  polarToCartesian,
  getSegmentColor,
  wrapLabel,
  truncateLabel,
  TAU,
  radiansToDegrees,
} from "@/lib/wheelGeometry";
import { getEligibleParticipants } from "@/lib/random";
import { useDrawStore, SpinPhase } from "@/stores/drawStore";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

type WheelProps = {
  participants: Participant[];
  theme: Theme;
  settings: WheelSettings;
  rotation: number;
  size: number;
  isSpinning: boolean;
};

const Pointer = memo(function Pointer({
  theme,
  size,
  phase,
}: {
  theme: Theme;
  size: number;
  phase: SpinPhase;
}) {
  const cx = size / 2;
  const cxp = cx;

  const pointer = (() => {
    switch (theme.pointerStyle) {
      case "arrow": {
        const w = 26;
        const h = 38;
        return (
          <path
            d={`M ${cxp - w / 2} ${size - h} L ${cxp + w / 2} ${size - h} L ${cxp} ${size - 2}`}
            fill={theme.pointerColor}
            stroke="rgba(0,0,0,0.3)"
            strokeWidth="1.5"
          />
        );
      }
      case "dot":
        return (
          <circle
            cx={cxp}
            cy={size - 16}
            r={14}
            fill={theme.pointerColor}
            stroke="rgba(0,0,0,0.3)"
            strokeWidth="1.5"
          />
        );
      case "needle":
        return (
          <path
            d={`M ${cxp - 4} ${size - 46} L ${cxp + 4} ${size - 46} L ${cxp} ${size - 2}`}
            fill={theme.pointerColor}
            stroke="rgba(0,0,0,0.3)"
            strokeWidth="1.2"
          />
        );
      case "triangle":
      default:
        return (
          <path
            d={`M ${cxp - 13} ${size - 40} L ${cxp + 13} ${size - 40} L ${cxp} ${size - 3}`}
            fill={theme.pointerColor}
            stroke="rgba(0,0,0,0.3)"
            strokeWidth="1.5"
          />
        );
    }
  })();

  const anim =
    phase === "windup"
      ? { y: [0, -3, 0], scaleY: [1, 0.95, 1] }
      : phase === "landing"
        ? { x: [0, -2.2, 2.4, -2, 1, 0] }
        : phase === "win"
          ? { scaleY: [1, 0.82, 1.12, 1], y: [0, 3, 0] }
          : { x: 0, y: 0, scaleY: 1 };

  const transition =
    phase === "landing"
      ? { duration: 0.5, times: [0, 0.15, 0.35, 0.55, 0.8, 1], ease: "easeInOut" as const }
      : phase === "win"
        ? { duration: 0.46, times: [0, 0.3, 0.7, 1], ease: "easeInOut" as const }
        : phase === "windup"
          ? { duration: 0.4, ease: "easeInOut" as const }
          : undefined;

  return (
    <motion.g
      animate={anim}
      transition={transition}
      style={{
        transformOrigin: `${cxp}px ${size - 30}px`,
        transformBox: "view-box" as const,
      }}
    >
      <circle
        cx={cxp}
        cy={size - 12}
        r={7}
        fill={theme.pointerColor}
        stroke="rgba(0,0,0,0.25)"
        strokeWidth="1"
      />
      {pointer}
    </motion.g>
  );
});

function WheelInner({
  participants,
  theme,
  settings,
  rotation,
  size,
  isSpinning,
  phase,
  winnerIndexes,
  ghostName,
}: Omit<WheelProps, "isSpinning"> & {
  isSpinning: boolean;
  phase: SpinPhase;
  winnerIndexes: number[];
  ghostName: string;
}) {
  const eligible = useMemo(
    () => getEligibleParticipants(participants),
    [participants],
  );
  const count = eligible.length;
  const reduced = usePrefersReducedMotion() || settings.reduceMotionOn;
  const highSpeed = !reduced && (phase === "windup" || phase === "spin");
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 6;
  const innerR = size * 0.18;
  const labelR = size * 0.36;
  const direction = settings.spinDirection === "counterclockwise" ? -1 : 1;
  const slice = count > 0 ? TAU / count : TAU;

  const colors = useMemo(
    () =>
      Array.from({ length: count }, (_, i) =>
        getSegmentColor(theme.segmentColors, i),
      ),
    [count, theme.segmentColors],
  );

  const gaps = useMemo(() => {
    const g = Math.min(settings.segmentSpacing, slice * 0.35);
    return g;
  }, [settings.segmentSpacing, slice]);

  const segmentDefs = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const start = i * slice + gaps / 2;
      const end = (i + 1) * slice - gaps / 2;
      return {
        d: arcPath(cx, cy, innerR, outerR, start, end),
        mid: i * slice + slice / 2,
      };
    });
  }, [count, slice, gaps, cx, cy, innerR, outerR]);

  // Auto-shrink + truncate once wheels get crowded; full names exposed via title tooltip.
  const largeCount = count > 24;
  const mediumCount = count > 12;
  const baseFont = settings.labelSize;
  const fontSize = Math.max(
    7,
    Math.min(baseFont, largeCount ? 9 : mediumCount ? 12 : 16),
  );
  const maxChars = largeCount ? 7 : mediumCount ? 10 : 18;
  const truncated = mediumCount || largeCount;

  const ringPath = useMemo(
    () => arcPath(cx, cy, innerR, outerR, 0, TAU),
    [cx, cy, innerR, outerR],
  );

  const ghostPath = useMemo(
    () => arcPath(cx, cy, innerR, outerR, 0, TAU),
    [cx, cy, innerR, outerR],
  );

  const emptyRing = (
    <g>
      <motion.circle
        cx={cx}
        cy={cy}
        r={outerR * 0.96}
        fill={theme.primary}
        filter="url(#spinora-halo)"
        animate={!reduced ? { opacity: [0.05, 0.18, 0.05] } : { opacity: 0.1 }}
        transition={!reduced ? { duration: 3.6, repeat: Infinity, ease: "easeInOut" } : undefined}
      />
      <circle
        cx={cx}
        cy={cy}
        r={outerR}
        fill={theme.surface}
        stroke={theme.wheelBorder}
        strokeWidth={theme.wheelBorderWidth}
      />
      <motion.g
        animate={!reduced && !isSpinning ? { rotate: 360 } : { rotate: 0 }}
        transition={
          !reduced && !isSpinning
            ? { duration: 60, ease: "linear", repeat: Infinity }
            : undefined
        }
        style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: "view-box" as const }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={outerR * 0.88}
          fill="none"
          stroke={theme.wheelBorder}
          strokeWidth="1.5"
          strokeDasharray="0.5 13"
          strokeLinecap="round"
          opacity={reduced ? 0.45 : 0.85}
        />
        <circle
          cx={cx}
          cy={cy - outerR + 20}
          r={3.5}
          fill={theme.primary}
          opacity={reduced ? 0.5 : 0.9}
        />
      </motion.g>
      {ghostName.trim() && (
        <g>
          <motion.path
            d={ghostPath}
            fill={theme.primary}
            stroke={theme.wheelBorder}
            strokeWidth={Math.max(0.5, theme.wheelBorderWidth * 0.8)}
            animate={!reduced ? { opacity: [0.2, 0.34, 0.2] } : { opacity: 0.24 }}
            transition={!reduced ? { duration: 2.6, repeat: Infinity, ease: "easeInOut" } : undefined}
          />
          <circle
            cx={cx}
            cy={cy}
            r={innerR}
            fill={theme.hubColor}
            stroke={theme.wheelBorder}
            strokeWidth={2}
          />
          <circle cx={cx} cy={cy} r={innerR} fill="url(#spinora-hub-sheen)" />
          <circle
            cx={cx}
            cy={cy - outerR + 16}
            r={2.5}
            fill={theme.labelColor}
            opacity={0.9}
          />
          {(() => {
            const pos = polarToCartesian(cx, cy, labelR, -Math.PI / 2);
            const label = truncateLabel(ghostName.trim(), 16);
            return (
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={Math.max(9, fontSize - 1)}
                fontWeight={600}
                fill={theme.labelColor}
                style={{
                  pointerEvents: "none",
                  userSelect: "none",
                  paintOrder: "stroke",
                  stroke: "rgba(0,0,0,0.4)",
                  strokeWidth: 2.5,
                }}
              >
                {label}
              </text>
            );
          })()}
        </g>
      )}
    </g>
  );

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      height="100%"
      role="img"
      aria-label={`Wheel with ${count} participant${count === 1 ? "" : "s"}`}
      style={{ overflow: "visible" }}
    >
      <defs>
        <filter id="wheel-shadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow
            dx="0"
            dy="10"
            stdDeviation="14"
            floodColor="rgba(0,0,0,0.5)"
          />
        </filter>
        <filter id="spinora-halo" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <filter id="spinora-blur" x="-12%" y="-12%" width="124%" height="124%">
          <feGaussianBlur stdDeviation="2 0" />
        </filter>
        <filter id="spinora-win-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <radialGradient id="spinora-hub-sheen" cx="36%" cy="32%" r="80%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        {count > 0 && (
          <radialGradient id="spinora-wheel-grad" cx="45%" cy="40%" r="75%">
            <stop offset="0%" stopColor={colors[0]} stopOpacity="1" />
            <stop offset="100%" stopColor={theme.surface} />
          </radialGradient>
        )}
      </defs>

      <g filter="url(#wheel-shadow)">
        {count === 0 ? (
          emptyRing
        ) : (
          <g transform={`rotate(${rotation} ${cx} ${cy})`} filter={highSpeed ? "url(#spinora-blur)" : undefined}>
            {(settings.type === "classic" || settings.type === "party") && (
              <path
                d={ringPath}
                fill="url(#spinora-wheel-grad)"
                opacity={0.12}
              />
            )}
            <motion.g
              animate={{ opacity: phase === "win" ? 0.3 : 1 }}
              transition={{ duration: 0.2 }}
            >
              {segmentDefs.map((seg, i) => {
                const p = eligible[i];
                return (
                  <path
                    key={p.id}
                    d={seg.d}
                    fill={
                      settings.type === "monochrome"
                        ? theme.segmentColors[
                            i % Math.max(1, theme.segmentColors.length)
                          ]
                        : colors[i]
                    }
                    stroke={theme.wheelBorder}
                    strokeWidth={Math.max(0.5, theme.wheelBorderWidth * 0.8)}
                    strokeLinejoin="round"
                  />
                );
              })}

              {settings.showLabels &&
                segmentDefs.map((seg, i) => {
                  const p = eligible[i];
                  const labelAngle = seg.mid * direction;
                  const pos = polarToCartesian(cx, cy, labelR, labelAngle);
                  const textRot =
                    (radiansToDegrees(seg.mid) * direction + 90) % 360;
                  const lines = truncated
                    ? [truncateLabel(p.name, maxChars)]
                    : wrapLabel(p.name, Math.max(4, settings.labelSize), 2);
                  return (
                    <g
                      key={p.id}
                      transform={`translate(${pos.x} ${pos.y}) rotate(${textRot})`}
                    >
                      {lines.map((ln, li) => (
                        <text
                          key={li}
                          x={0}
                          y={(li - (lines.length - 1) / 2) * fontSize * 1.15}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={fontSize}
                          fontWeight={600}
                          fill={theme.labelColor}
                          style={{
                            pointerEvents: "none",
                            userSelect: "none",
                            paintOrder: "stroke",
                            stroke: "rgba(0,0,0,0.35)",
                            strokeWidth: 2.5,
                          }}
                        >
                          {ln}
                        </text>
                      ))}
                      {truncated && (p.name.length > maxChars || p.name.length > 0) && (
                        <title>{p.name}</title>
                      )}
                    </g>
                  );
                })}
            </motion.g>

            {!reduced && (phase === "windup" || phase === "spin" || phase === "landing") && (
              <motion.circle
                cx={cx}
                cy={cy}
                r={innerR * 1.4}
                fill={theme.hubColor}
                filter="url(#spinora-halo)"
                animate={{ opacity: [0.25, 0.6, 0.25] }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
              />
            )}

            {phase === "win" &&
              winnerIndexes.map((wi) => {
                const seg = segmentDefs[wi];
                if (!seg) return null;
                return (
                  <motion.path
                    key={`win-${wi}`}
                    d={seg.d}
                    fill={theme.labelColor}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.75, 0.18, 0.6, 0] }}
                    transition={{
                      duration: 0.55,
                      times: [0, 0.2, 0.5, 0.75, 1],
                      ease: "easeOut",
                    }}
                  />
                );
              })}

            <circle
              cx={cx}
              cy={cy}
              r={innerR}
              fill={theme.hubColor}
              stroke={theme.wheelBorder}
              strokeWidth={2}
            />
            <circle cx={cx} cy={cy} r={innerR} fill="url(#spinora-hub-sheen)" />
            <circle
              cx={cx}
              cy={cy}
              r={innerR * 0.66}
              fill="none"
              stroke="rgba(0,0,0,0.28)"
              strokeWidth="1"
            />
            <circle
              cx={cx}
              cy={cy}
              r={innerR * 0.4}
              fill={theme.text}
              opacity={0.85}
            />
            <circle
              cx={cx}
              cy={cy}
              r={innerR * 0.18}
              fill={theme.background}
              opacity={0.5}
            />

            {phase === "win" &&
              winnerIndexes.map((wi) => {
                const seg = segmentDefs[wi];
                if (!seg) return null;
                return (
                  <motion.path
                    key={`win-pop-${wi}`}
                    d={seg.d}
                    fill="none"
                    stroke={theme.accent}
                    strokeWidth={3}
                    strokeLinejoin="round"
                    filter="url(#spinora-win-glow)"
                    initial={{ scale: 1, opacity: 0 }}
                    animate={{ scale: [1, 1.08, 1.05], opacity: [0, 1, 1] }}
                    transition={{ duration: 0.46, times: [0, 0.55, 1], ease: "easeOut" }}
                    style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: "view-box" as const }}
                  />
                );
              })}
          </g>
        )}
      </g>

      <Pointer theme={theme} size={size} phase={phase} />
    </svg>
  );
}

export const Wheel = memo(function Wheel(props: WheelProps) {
  const { participants, theme, settings, rotation, size, isSpinning } = props;
  const phase = useDrawStore((s) => s.phase);
  const winnerIndexes = useDrawStore((s) => s.winnerIndexes);
  const ghostName = useDrawStore((s) => s.ghostName);
  return (
    <div
      className="relative w-full select-none"
      style={{ maxWidth: size, maxHeight: size, aspectRatio: "1" }}
      aria-live="polite"
    >
      <WheelInner
        participants={participants}
        theme={theme}
        settings={settings}
        rotation={rotation}
        size={size}
        isSpinning={isSpinning}
        phase={phase}
        winnerIndexes={winnerIndexes}
        ghostName={ghostName}
      />
      {isSpinning && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="sr-only">Wheel is spinning</span>
        </div>
      )}
    </div>
  );
});