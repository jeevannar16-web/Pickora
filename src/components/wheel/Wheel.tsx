import { memo, useMemo } from "react";
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
}: {
  theme: Theme;
  size: number;
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

  return (
    <g>
      <circle
        cx={cxp}
        cy={size - 12}
        r={7}
        fill={theme.pointerColor}
        stroke="rgba(0,0,0,0.25)"
        strokeWidth="1"
      />
      {pointer}
    </g>
  );
});

function WheelInner({
  participants,
  theme,
  settings,
  rotation,
  size,
}: Omit<WheelProps, 'isSpinning'>) {
  const eligible = useMemo(
    () => getEligibleParticipants(participants),
    [participants],
  );
  const count = eligible.length;
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

  const largeCount = count > 24;
  const mediumCount = count > 12;
  const baseFont = settings.labelSize;
  const fontSize = Math.max(
    7,
    Math.min(baseFont, largeCount ? 10 : mediumCount ? 13 : 16),
  );
  const maxChars = largeCount ? 8 : mediumCount ? 12 : 18;

  const ringPath = useMemo(
    () => arcPath(cx, cy, innerR, outerR, 0, TAU),
    [cx, cy, innerR, outerR],
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
        {count > 0 && (
          <radialGradient id="spinora-wheel-grad" cx="45%" cy="40%" r="75%">
            <stop offset="0%" stopColor={colors[0]} stopOpacity="1" />
            <stop offset="100%" stopColor={theme.surface} />
          </radialGradient>
        )}
      </defs>

      <g filter="url(#wheel-shadow)">
        {count === 0 ? (
          <circle
            cx={cx}
            cy={cy}
            r={outerR}
            fill={theme.surface}
            stroke={theme.wheelBorder}
            strokeWidth={theme.wheelBorderWidth}
          />
        ) : (
          <g transform={`rotate(${rotation} ${cx} ${cy})`}>
            {(settings.type === "classic" || settings.type === "party") && (
              <path
                d={ringPath}
                fill="url(#spinora-wheel-grad)"
                opacity={0.12}
              />
            )}
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
                const lines = largeCount
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
      </g>

      <Pointer theme={theme} size={size} />
    </svg>
  );
}

export const Wheel = memo(function Wheel(props: WheelProps) {
  const { participants, theme, settings, rotation, size, isSpinning } = props;
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
      />
      {isSpinning && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="sr-only">Wheel is spinning</span>
        </div>
      )}
    </div>
  );
});
