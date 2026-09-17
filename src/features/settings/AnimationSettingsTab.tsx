import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useWheelStore } from '@/stores/wheelStore';
import { Input } from '@/components/ui/input';

export function AnimationSettingsTab() {
  const settings = useWheelStore((s) => s.settings);
  const setSpeed = useWheelStore((s) => s.setSpeed);
  const setCustomDuration = useWheelStore((s) => s.setCustomDuration);
  const setCustomRotations = useWheelStore((s) => s.setCustomRotations);
  const setEasing = useWheelStore((s) => s.setEasing);
  const setPointerBounce = useWheelStore((s) => s.setPointerBounce);
  const setReduceMotion = useWheelStore((s) => s.setReduceMotion);

  const speedOptions = [
    { id: 'fast', label: 'Fast', rotations: 8, duration: 3.5 },
    { id: 'normal', label: 'Normal', rotations: 10, duration: 5 },
    { id: 'dramatic', label: 'Dramatic', rotations: 14, duration: 7.5 },
  ];

  const current = speedOptions.find((s) => s.id === settings.speed);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted">Speed</label>
        <div className="grid grid-cols-3 gap-1.5">
          {speedOptions.map((s) => (
            <button
              key={s.id}
              onClick={() => setSpeed(s.id as 'fast' | 'normal' | 'dramatic')}
              className={
                settings.speed === s.id
                  ? 'rounded-lg bg-primary px-2 py-1.5 text-xs font-medium text-white'
                  : 'rounded-lg border border-border-c bg-surface px-2 py-1.5 text-xs text-muted hover:text-text'
              }
              aria-pressed={settings.speed === s.id}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted">Easing</label>
        <Select value={settings.easing} onValueChange={(e) => setEasing(e as typeof settings.easing)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="easeOut">Ease Out</SelectItem>
            <SelectItem value="easeInOut">Ease In Out</SelectItem>
            <SelectItem value="inOutCubic">In Out Cubic</SelectItem>
            <SelectItem value="easeOutQuart">Ease Out Quart</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted">Duration (s)</label>
          <Input
            type="number"
            min={2}
            max={12}
            placeholder={String(current?.duration ?? 5)}
            value={settings.customDuration ?? ''}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setCustomDuration(Number.isNaN(v) ? null : Math.min(12, Math.max(2, v)));
            }}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted">Rotations</label>
          <Input
            type="number"
            min={4}
            max={40}
            placeholder={String(current?.rotations ?? 10)}
            value={settings.customRotations ?? ''}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setCustomRotations(Number.isNaN(v) ? null : Math.min(40, Math.max(4, v)));
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted">Pointer bounce</label>
        <Switch checked={settings.pointerBounce} onCheckedChange={setPointerBounce} />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted">Reduced motion</label>
        <Switch checked={settings.reduceMotionOn} onCheckedChange={setReduceMotion} />
      </div>
    </div>
  );
}