import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useSettingsStore } from '@/stores/settingsStore';

function Row({ label, hint, checked, onCheckedChange }: { label: string; hint: string; checked: boolean; onCheckedChange: (b: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm text-text">{label}</div>
        <div className="text-[11px] leading-relaxed text-muted">{hint}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  );
}

export function SoundSettingsTab() {
  const sound = useSettingsStore((s) => s.sound);
  const setSound = useSettingsStore((s) => s.setSound);

  return (
    <div className="space-y-4">
      <Row
        label="Master sound"
        hint="Global switch for all sound effects."
        checked={sound.masterEnabled}
        onCheckedChange={(b) => setSound({ masterEnabled: b })}
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-text">Volume</label>
          <span className="text-xs text-primary">{sound.masterVolume}%</span>
        </div>
        <Slider
          value={[sound.masterVolume]}
          min={0}
          max={100}
          step={5}
          onValueChange={(v) => setSound({ masterVolume: v[0] })}
        />
        <p className="-mt-1 text-[11px] leading-relaxed text-muted">How loud all Spinora sounds are.</p>
      </div>

      <Row
        label="Spin sound"
        hint="A whoosh when the wheel starts moving."
        checked={sound.spinSoundEnabled}
        onCheckedChange={(b) => setSound({ spinSoundEnabled: b })}
      />

      <Row
        label="Winner sound"
        hint="A fanfare when the winner is revealed."
        checked={sound.winnerSoundEnabled}
        onCheckedChange={(b) => setSound({ winnerSoundEnabled: b })}
      />

      <Row
        label="Tick sound"
        hint="A tick as the wheel passes each slice."
        checked={sound.tickSoundEnabled}
        onCheckedChange={(b) => setSound({ tickSoundEnabled: b })}
      />

      <Row
        label="Reduced sound mode"
        hint="Fewer, quieter effects — good for quiet rooms."
        checked={sound.reducedSoundMode}
        onCheckedChange={(b) => setSound({ reducedSoundMode: b })}
      />
    </div>
  );
}