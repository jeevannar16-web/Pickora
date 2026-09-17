import { PACKS } from '@/features/packs/presets';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUIStore } from '@/stores/uiStore';
import { Pack } from '@/types/pack';
import { cn } from '@/lib/utils';

function packGlyph(pack: Pack): string {
  if (pack.icons && pack.icons.length > 0) return pack.icons[0];
  if (pack.id === 'numbers') return '1';
  return 'Aa';
}

function PackBadge({ pack }: { pack: Pack }) {
  const isNumbers = pack.id === 'numbers';
  return (
    <span
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-c bg-elevated/80',
        isNumbers && 'font-display text-base font-bold text-primary'
      )}
      style={!isNumbers ? { fontSize: 17, lineHeight: 1 } : undefined}
      aria-hidden="true"
    >
      {packGlyph(pack)}
    </span>
  );
}

export function PackSelector() {
  const activePack = useSettingsStore((s) => s.activePack);
  const setPack = useSettingsStore((s) => s.setPack);
  const showToast = useUIStore((s) => s.showToast);

  const packs = Object.values(PACKS);

  return (
    <div className="grid grid-cols-2 gap-2" data-testid="pack-selector">
      {packs.map((p) => {
        const active = activePack === p.id;
        return (
          <button
            key={p.id}
            onClick={() => {
              setPack(p.id);
              showToast(`Content pack "${p.name}" applied.`, 'success');
            }}
            aria-pressed={active}
            aria-label={`Apply ${p.name} pack`}
            className={cn(
              'flex items-center gap-2 rounded-xl border p-2 text-left transition-all',
              active
                ? 'border-primary bg-primary/10 ring-2 ring-primary/40'
                : 'border-border-c bg-surface hover:border-primary/50 hover:bg-elevated/60'
            )}
          >
            <PackBadge pack={p} />
            <span className="min-w-0">
              <span
                className={cn(
                  'block truncate text-xs font-semibold',
                  active ? 'text-primary' : 'text-text'
                )}
              >
                {p.name}
              </span>
              <span className="block truncate text-[10px] leading-tight text-muted">
                {p.tag}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}