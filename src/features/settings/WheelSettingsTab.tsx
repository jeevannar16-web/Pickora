import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useWheelStore } from '@/stores/wheelStore';
import { WheelType } from '@/types/wheel';
import { useSettingsStore } from '@/stores/settingsStore';

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
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted">Wheel type</label>
        <div className="grid grid-cols-2 gap-1.5">
          {WHEEL_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={
                settings.type === t.id
                  ? 'rounded-lg bg-primary px-2 py-1.5 text-xs font-medium text-white'
                  : 'rounded-lg border border-border-c bg-surface px-2 py-1.5 text-xs text-muted hover:border-primary/50 hover:text-text'
              }
              aria-pressed={settings.type === t.id}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted">Spin direction</label>
        <Select value={settings.spinDirection} onValueChange={(v) => setSpinDirection(v as 'clockwise' | 'counterclockwise')}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="clockwise">Clockwise</SelectItem>
            <SelectItem value="counterclockwise">Counterclockwise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted">Segment spacing</label>
          <span className="text-xs text-primary">{settings.segmentSpacing}px</span>
        </div>
        <Slider
          value={[settings.segmentSpacing]}
          min={0}
          max={10}
          step={1}
          onValueChange={(v) => setSegmentSpacing(v[0])}
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted">Show labels</label>
        <Switch checked={settings.showLabels} onCheckedChange={setShowLabels} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted">Label size</label>
          <span className="text-xs text-primary">{settings.labelSize}px</span>
        </div>
        <Slider
          value={[settings.labelSize]}
          min={9}
          max={22}
          step={1}
          onValueChange={(v) => setLabelSize(v[0])}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted">Segment colors</label>
        <div className="flex flex-wrap gap-1.5">
          {theme.segmentColors.slice(0, 8).map((c, i) => (
            <span key={i} className="h-6 w-6 rounded-md" style={{ background: c }} />
          ))}
        </div>
      </div>
    </div>
  );
}