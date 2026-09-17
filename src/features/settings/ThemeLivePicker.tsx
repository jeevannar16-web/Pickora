import { THEMES } from '@/features/themes/presets';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUIStore } from '@/stores/uiStore';
import { Theme } from '@/types/theme';
import { MiniWheel } from '@/components/wheel/MiniWheel';
import { cn } from '@/lib/utils';

function ThemeThumb({ theme, active }: { theme: Theme; active: boolean }) {
  return (
    <div className="relative">
      <MiniWheel
        colors={theme.segmentColors}
        hubColor={theme.hubColor}
        size={40}
        type={theme.motion?.type === 'compact' ? 'compact' : theme.motion?.type}
        labelColor={theme.labelColor}
      />
      {active && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white shadow-md">
          ✓
        </span>
      )}
    </div>
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
          <ThemeThumb theme={t} active={activeThemeId === t.id} />
          <span className="mt-0.5 text-center text-xs font-semibold text-text">{t.name}</span>
          {t.tag && <span className="-mt-0.5 text-center text-[10px] leading-tight text-muted">{t.tag}</span>}
        </button>
      ))}
    </div>
  );
}