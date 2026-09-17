import { useSettingsStore } from '@/stores/settingsStore';
import { THEMES } from '@/features/themes/presets';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

export function ThemeSelector() {
  const activeThemeId = useSettingsStore((s) => s.activeThemeId);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const showToast = useUIStore((s) => s.showToast);

  const allThemes = [
    ...Object.values(THEMES).filter((t) => !t.curated),
    ...useSettingsStore((s) => s.customThemes),
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {allThemes.map((t) => (
        <button
          key={t.id}
          onClick={() => {
            setTheme(t.id);
            showToast(`Theme "${t.name}" applied.`, 'success');
          }}
          className={cn(
            'group overflow-hidden rounded-lg border text-left transition-all',
            activeThemeId === t.id
              ? 'border-primary ring-2 ring-primary/40'
              : 'border-border-c hover:border-primary/50'
          )}
          aria-pressed={activeThemeId === t.id}
          aria-label={`Apply ${t.name} theme`}
        >
          <div
            className="flex h-8 items-center gap-1 px-2"
            style={{ background: t.segmentColors[0] }}
          >
            {t.segmentColors.slice(0, 5).map((c, i) => (
              <span key={i} className="h-3 w-3 rounded-full" style={{ background: c, border: '1px solid rgba(255,255,255,0.4)' }} />
            ))}
          </div>
          <div className="bg-surface px-2 py-1.5 text-xs font-medium text-text">
            {t.name}
            {!t.isPreset && <span className="ml-1 text-[10px] text-muted">custom</span>}
          </div>
        </button>
      ))}
    </div>
  );
}