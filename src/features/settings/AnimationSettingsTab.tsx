import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { type ReactNode } from 'react';
import { useWheelStore } from '@/stores/wheelStore';
import { Input } from '@/components/ui/input';

function Field({ label, hint, children }: { label: string; hint: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-text">{label}</label>
      {children}
      <p className="-mt-1 text-[11px] leading-relaxed text-muted">{hint}</p>
    </div>
  );
}

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
      <Field
        label="Spin speed"
        hint="How long the spin lasts. Fast for snappy, Dramatic for a slow, suspenseful reveal."
      >
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
      </Field>

      <Field
        label="How it slows down"
        hint="The curve the wheel follows as it comes to rest. Ease out = long, smooth stop."
      >
        <Select value={settings.easing} onValueChange={(e) => setEasing(e as typeof settings.easing)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="easeOut">Ease Out</SelectItem>
            <SelectItem value="easeInOut">Ease In Out</SelectItem>
            <SelectItem value="inOutCubic">In Out Cubic</SelectItem>
            <SelectItem value="easeOutQuart">Ease Out Quart</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Spin length (s)" hint="Lower = quicker, higher = longer buildup.">
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
        </Field>
        <Field label="Full turns" hint="How many times the wheel rotates before stopping.">
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
        </Field>
      </div>

      <Field label="Pointer bounce" hint="The pointer dips slightly as the wheel starts — a small bit of life.">
        <Switch checked={settings.pointerBounce} onCheckedChange={setPointerBounce} />
      </Field>

      <Field label="Reduced motion" hint="Turns off most animation. Use it for a calm, snappy spin.">
        <Switch checked={settings.reduceMotionOn} onCheckedChange={setReduceMotion} />
      </Field>
    </div>
  );
}