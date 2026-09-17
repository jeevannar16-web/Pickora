import { memo, useEffect, useMemo, useState } from "react";
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
import { useSettingsStore } from "@/stores/settingsStore";
import { PACKS } from "@/features/packs/presets";

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
  tick,
  bounceEnabled,
}: {
  theme: Theme;
  size: number;
  phase: SpinPhase;
  tick: number;
  bounceEnabled: boolean;
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
      {phase === "landing" && bounceEnabled && tick > 0 && (
        <motion.g
          key={tick}
          animate={{ rotate: tick % 2 ? -2.6 : 3.4 }}
          transition={{ type: "spring", stiffness: 1100, damping: 30 }}
          style={{
            transformOrigin: `${cxp}px ${size - 30}px`,
            transformBox: "view-box" as const,
          }}
        >
          {pointer}
        </motion.g>
      )}
      {!(phase === "landing" && bounceEnabled && tick > 0) && pointer}
      <circle
        cx={cxp}
        cy={size - 12}
        r={7}
        fill={theme.pointerColor}
        stroke="rgba(0,0,0,0.25)"
        strokeWidth="1"
      />
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
  landingTick,
  bounceEnabled,
}: Omit<WheelProps, "isSpinning"> & {
  isSpinning: boolean;
  phase: SpinPhase;
  winnerIndexes: number[];
  ghostName: string;
  landingTick: number;
  bounceEnabled: boolean;
}) {
  const eligible = useMemo(
    () => getEligibleParticipants(participants),
    [participants],
  );
  const count = eligible.length;
  const reduced = usePrefersReducedMotion() || settings.reduceMotionOn;
  const highSpeed = !reduced && (phase === "windup" || phase === "spin");
  const [hovered, setHovered] = useState<number | null>(null);
  const interactive = !isSpinning && !highSpeed;
  const activePack = useSettingsStore((s) => s.activePack);
  const pack = PACKS[activePack] ?? PACKS.custom;
  const packIcons = pack.icons ?? [];

  // Sequential reveal for multi-winner draws: each winner's slice lights up in
  // turn after the wheel stops (approach b), so the outcome is showcased on the
  // wheel itself, not just listed in the modal afterward. Timings mirror the
  // win-window held open in useSpin (WIN_REVEAL_FIRST_MS / WIN_REVEAL_STEP_MS).
  const WIN_REVEAL_FIRST_MS = 60;
  const WIN_REVEAL_STEP_MS = 620;
  const [revealCount, setRevealCount] = useState(0);
  useEffect(() => {
    if (phase !== "win") {
      const t = setTimeout(() => setRevealCount(0), 0);
      return () => clearTimeout(t);
    }
    if (revealCount < winnerIndexes.length) {
      const t = setTimeout(
        () => setRevealCount((c) => c + 1),
        revealCount === 0 ? WIN_REVEAL_FIRST_MS : WIN_REVEAL_STEP_MS,
      );
      return () => clearTimeout(t);
    }
  }, [phase, revealCount, winnerIndexes.length]);
  const revealedWinners = phase === "win" ? winnerIndexes.slice(0, revealCount) : [];
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
                const isHover = interactive && hovered === i;
                return (
                  <g
                    key={p.id}
                    onMouseEnter={interactive ? () => setHovered(i) : undefined}
                    onMouseLeave={interactive ? () => setHovered((h) => (h === i ? null : h)) : undefined}
                    onFocus={interactive ? () => setHovered(i) : undefined}
                    onBlur={interactive ? () => setHovered((h) => (h === i ? null : h)) : undefined}
                    style={{ pointerEvents: interactive ? "visiblePainted" : "none" }}
                    role={interactive ? "button" : undefined}
                    tabIndex={interactive ? 0 : -1}
                  >
                    <path
                      d={seg.d}
                      fill={
                        settings.type === "monochrome"
                          ? theme.segmentColors[
                              i % Math.max(1, theme.segmentColors.length)
                            ]
                          : colors[i]
                      }
                      stroke={
                        isHover
                          ? theme.accent
                          : theme.wheelBorder
                      }
                      strokeWidth={
                        isHover
                          ? Math.max(2, theme.wheelBorderWidth)
                          : Math.max(0.5, theme.wheelBorderWidth * 0.8)
                      }
                      strokeLinejoin="round"
                      style={
                        isHover
                          ? ({ filter: `drop-shadow(0 0 6px ${theme.accent})` } as React.CSSProperties)
                          : undefined
                      }
                      data-hovered={isHover ? "true" : undefined}
                    />
                    {isHover && (
                      <path
                        d={seg.d}
                        fill={theme.accent}
                        opacity={0.14}
                        stroke="none"
                      />
                    )}
                  </g>
                );
              })}

              {count > 0 &&
                pack.id !== 'custom' &&
                segmentDefs.map((seg, i) => {
                  const labelAngle = seg.mid * direction;
                  const iconRadius = pack.id === 'numbers' ? labelR : labelR * 0.56;
                  const pos = polarToCartesian(cx, cy, iconRadius, labelAngle);
                  const textRot = (radiansToDegrees(seg.mid) * direction + 90) % 360;
                  const iconFont =
                    pack.id === 'numbers'
                      ? Math.max(12, Math.min(22, size / (largeCount ? 13 : mediumCount ? 11 : 8.5)))
                      : Math.max(9, Math.min(19, size / (largeCount ? 26 : mediumCount ? 22 : 15)));
                  return (
                    <g
                      key={`pack-${i}`}
                      transform={`translate(${pos.x} ${pos.y}) rotate(${textRot})`}
                    >
                      <text
                        x={0}
                        y={0}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={iconFont}
                        fontWeight={pack.id === 'numbers' ? 800 : 600}
                        fill={pack.id === 'numbers' ? theme.labelColor : 'currentColor'}
                        style={{
                          pointerEvents: "none",
                          userSelect: "none",
                          paintOrder: "stroke",
                          stroke:
                            pack.id === 'numbers'
                              ? `rgba(0,0,0,0.55)`
                              : "rgba(0,0,0,0.45)",
                          strokeWidth: pack.id === 'numbers' ? 3 : 1.5,
                        }}
                        aria-hidden="true"
                      >
                        {pack.id === 'numbers' ? i + 1 : packIcons[i % packIcons.length]}
                      </text>
                    </g>
                  );
                })}

              {settings.showLabels &&
                pack.id !== 'numbers' &&
                segmentDefs.map((seg, i) => {
                  const p = eligible[i];
                  const isHover = interactive && hovered === i;
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
                          fontSize={isHover ? fontSize + 3 : fontSize}
                          fontWeight={isHover ? 800 : 600}
                          fill={isHover ? theme.text : theme.labelColor}
                          style={{
                            pointerEvents: "none",
                            userSelect: "none",
                            paintOrder: "stroke",
                            stroke: isHover
                              ? "rgba(0,0,0,0.75)"
                              : "rgba(0,0,0,0.35)",
                            strokeWidth: isHover ? 3.5 : 2.5,
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

            {count > 0 && !isSpinning && !reduced && (
              <motion.circle
                cx={cx}
                cy={cy}
                r={innerR * 1.55}
                fill={theme.hubColor}
                filter="url(#spinora-halo)"
                animate={{ opacity: [0.1, 0.28, 0.1] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}

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

            {revealedWinners.map((wi, ri) => {
                const seg = segmentDefs[wi];
                if (!seg) return null;
                const isLatest = ri === revealCount - 1;
                const winPos = polarToCartesian(cx, cy, labelR * 0.95, seg.mid);
                return (
                  <g key={`win-reveal-${wi}`}>
                    {isLatest && (
                      <motion.path
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
                    )}
                    {isLatest && (
                      <motion.circle
                        cx={winPos.x}
                        cy={winPos.y}
                        r={labelR * 0.42}
                        fill="none"
                        stroke={theme.accent}
                        strokeWidth={2.5}
                        initial={{ opacity: 0.9, scale: 0.35 }}
                        animate={{ opacity: 0, scale: 2.1 }}
                        transition={{ duration: 0.95, ease: "easeOut" }}
                        style={{
                          transformOrigin: `${winPos.x}px ${winPos.y}px`,
                          transformBox: "view-box" as const,
                        }}
                      />
                    )}
                    <motion.path
                      d={seg.d}
                      fill="none"
                      stroke={theme.accent}
                      strokeWidth={isLatest ? 4 : 2.5}
                      strokeLinejoin="round"
                      filter="url(#spinora-win-glow)"
                      initial={{ opacity: 0, scale: 1 }}
                      animate={
                        isLatest
                          ? { opacity: [0, 1, 0.95, 1], scale: [1, 1.12, 1.06, 1.08] }
                          : { opacity: 0.9, scale: 1 }
                      }
                      transition={
                        isLatest
                          ? { duration: 0.62, times: [0, 0.4, 0.7, 1], ease: "easeOut" }
                          : { duration: 0.3 }
                      }
                      style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: "view-box" as const }}
                    />
                  </g>
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
          </g>
        )}

        {count > 0 && !isSpinning && !reduced && (
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 42, ease: "linear", repeat: Infinity }}
            style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: "view-box" as const }}
            aria-hidden="true"
          >
            <circle
              cx={cx}
              cy={cy}
              r={outerR * 0.96}
              fill="none"
              stroke={theme.wheelBorder}
              strokeWidth="1"
              strokeDasharray="0.5 16"
              strokeLinecap="round"
              opacity={0.7}
            />
            <circle
              cx={cx}
              cy={cy - outerR * 0.96 + 2}
              r={2.6}
              fill={theme.primary}
              opacity={0.85}
            />
          </motion.g>
        )}
      </g>

      {interactive && hovered !== null && eligible[hovered] && (
        <g pointerEvents="none" aria-hidden="true">
          <motion.g
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            <rect
              x={cx - Math.min(110, Math.max(42, eligible[hovered].name.length * 8 + 30)) / 2}
              y={cy - outerR + 4}
              width={Math.min(110, Math.max(42, eligible[hovered].name.length * 8 + 30))}
              height={24}
              rx={12}
              fill={theme.surface}
              stroke={theme.accent}
              strokeWidth={1}
            />
            <text
              x={cx}
              y={cy - outerR + 16}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={12.5}
              fontWeight={700}
              fill={theme.text}
            >
              {eligible[hovered].name}
            </text>
          </motion.g>
        </g>
      )}

      <Pointer
        theme={theme}
        size={size}
        phase={phase}
        tick={landingTick}
        bounceEnabled={bounceEnabled}
      />
    </svg>
  );
}

export const Wheel = memo(function Wheel(props: WheelProps) {
  const { participants, theme, settings, rotation, size, isSpinning } = props;
  const phase = useDrawStore((s) => s.phase);
  const winnerIndexes = useDrawStore((s) => s.winnerIndexes);
  const ghostName = useDrawStore((s) => s.ghostName);
  const landingTick = useDrawStore((s) => s.landingTick);
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
        landingTick={landingTick}
        bounceEnabled={settings.pointerBounce}
      />
      {isSpinning && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="sr-only">Wheel is spinning</span>
        </div>
      )}
    </div>
  );
});