import { THEMES } from '@/features/themes/presets';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUIStore } from '@/stores/uiStore';
import { Theme } from '@/types/theme';
import { arcPath, TAU } from '@/lib/wheelGeometry';
import { cn } from '@/lib/utils';

function ThemeThumb({ theme, size = 44 }: { theme: Theme; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const outer = size / 2 - 3;
  const inner = size * 0.24;
  const count = theme.segmentColors.length;
  const slice = TAU / count;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
      <circle cx={cx} cy={cy} r={outer} fill={theme.surface} stroke={theme.wheelBorder} strokeWidth={0.6} />
      {theme.segmentColors.slice(0, 8).map((c, i) => (
        <path
          key={i}
          d={arcPath(cx, cy, inner, outer, i * slice + 0.02, (i + 1) * slice - 0.02)}
          fill={c}
          stroke={theme.wheelBorder}
          strokeWidth={0.35}
        />
      ))}
      <circle cx={cx} cy={cy} r={inner * 0.72} fill={theme.hubColor} />
    </svg>
  );
}

export function ThemeLivePicker() {
  const activeThemeId = useSettingsStore((s) => s.activeThemeId);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const showToast = useUIStore((s) => s.showToast);

  const curated = Object.values(THEMES).filter((t) => t.curated);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {curated.map((t) => (
        <button
          key={t.id}
          onClick={() => {
            setTheme(t.id);
            showToast(`Applied "${t.name} — ${t.tag ?? 'custom'}".`, 'success');
          }}
          className={cn(
            'group flex flex-col items-center gap-1 rounded-xl border px-2 pb-2 pt-2.5 transition-all',
            activeThemeId === t.id
              ? 'border-primary bg-primary/10 ring-2 ring-primary/40'
              : 'border-border-c bg-surface hover:border-primary/50 hover:bg-elevated/60'
          )}
          aria-pressed={activeThemeId === t.id}
          aria-label={`Apply ${t.name} theme`}
        >
          <ThemeThumb theme={t} />
          <span className="mt-0.5 text-center text-xs font-semibold text-text">{t.name}</span>
          {t.tag && <span className="-mt-0.5 text-center text-[10px] leading-tight text-muted">{t.tag}</span>}
        </button>
      ))}
    </div>
  );
}