import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { type ReactNode } from 'react';
import { useWheelStore } from '@/stores/wheelStore';
import { WheelType } from '@/types/wheel';
import { useSettingsStore } from '@/stores/settingsStore';
import { MiniWheel } from '@/components/wheel/MiniWheel';
import { cn } from '@/lib/utils';

const WHEEL_TYPES: { id: WheelType; label: string }[] = [
  { id: 'classic', label: 'Classic' },
  { id: 'neon', label: 'Neon' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'prize', label: 'Prize' },
  { id: 'gradient', label: 'Gradient' },
  { id: 'monochrome', label: 'Monochrome' },
  { id: 'compact', label: 'Compact' },
  { id: 'party', label: 'Party' },
];

function Field({ label, hint, children }: { label: string; hint: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-text">{label}</label>
      </div>
      {children}
      <p className="-mt-1 text-[11px] leading-relaxed text-muted">{hint}</p>
    </div>
  );
}

export function WheelSettingsTab() {
  const settings = useWheelStore((s) => s.settings);
  const setType = useWheelStore((s) => s.setType);
  const setSpinDirection = useWheelStore((s) => s.setSpinDirection);
  const setSegmentSpacing = useWheelStore((s) => s.setSegmentSpacing);
  const setShowLabels = useWheelStore((s) => s.setShowLabels);
  const setLabelSize = useWheelStore((s) => s.setLabelSize);
  const theme = useSettingsStore((s) => s.theme);

  return (
    <div className="space-y-4">
      <Field label="Wheel type" hint="A live preview of each style. Your theme picks one for you.">
        <div className="grid grid-cols-2 gap-2">
          {WHEEL_TYPES.map((t) => {
            const active = settings.type === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                aria-pressed={active}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl border px-2 pb-2 pt-2.5 transition-all',
                  active
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/40'
                    : 'border-border-c bg-surface hover:border-primary/50 hover:bg-elevated/60'
                )}
              >
                <MiniWheel
                  colors={theme.segmentColors}
                  hubColor={theme.hubColor}
                  type={t.id}
                  size={40}
                  rotating={active}
                  labelColor={theme.labelColor}
                />
                <span
                  className={cn(
                    'text-[11px] font-medium',
                    active ? 'text-primary' : 'text-muted'
                  )}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Spin direction" hint="Which way the wheel turns when it spins.">
        <Select value={settings.spinDirection} onValueChange={(v) => setSpinDirection(v as 'clockwise' | 'counterclockwise')}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="clockwise">Clockwise</SelectItem>
            <SelectItem value="counterclockwise">Counterclockwise</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="Space between slices" hint="The gap between each slice. Small looks tight, 0 removes it.">
        <div className="flex items-center justify-between">
          <span className="text-xs text-primary">{settings.segmentSpacing}px</span>
        </div>
        <Slider
          value={[settings.segmentSpacing]}
          min={0}
          max={10}
          step={1}
          onValueChange={(v) => setSegmentSpacing(v[0])}
        />
      </Field>

      <Field label="Show names" hint="Draw each person's name on its slice.">
        <Switch checked={settings.showLabels} onCheckedChange={setShowLabels} />
      </Field>

      <Field label="Name size" hint="How big the labels on the slices are.">
        <div className="flex items-center justify-between">
          <span className="text-xs text-primary">{settings.labelSize}px</span>
        </div>
        <Slider
          value={[settings.labelSize]}
          min={9}
          max={22}
          step={1}
          onValueChange={(v) => setLabelSize(v[0])}
        />
      </Field>

      <Field label="Palette in use" hint="The slice colors for this theme. Tweak them under Themes below.">
        <div className="flex flex-wrap gap-1.5">
          {theme.segmentColors.slice(0, 8).map((c, i) => (
            <span key={i} className="h-6 w-6 rounded-md" style={{ background: c }} />
          ))}
        </div>
      </Field>
    </div>
  );
}