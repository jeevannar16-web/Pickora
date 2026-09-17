import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useSettingsStore } from '@/stores/settingsStore';

export function SoundSettingsTab() {
  const sound = useSettingsStore((s) => s.sound);
  const setSound = useSettingsStore((s) => s.setSound);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-text">Master sound</div>
          <div className="text-xs text-muted">Global switch for all sound effects</div>
        </div>
        <Switch checked={sound.masterEnabled} onCheckedChange={(b) => setSound({ masterEnabled: b })} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted">Volume</label>
          <span className="text-xs text-primary">{sound.masterVolume}%</span>
        </div>
        <Slider
          value={[sound.masterVolume]}
          min={0}
          max={100}
          step={5}
          onValueChange={(v) => setSound({ masterVolume: v[0] })}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-text">Spin sound</div>
          <div className="text-xs text-muted">Whoosh when the wheel starts</div>
        </div>
        <Switch checked={sound.spinSoundEnabled} onCheckedChange={(b) => setSound({ spinSoundEnabled: b })} />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-text">Winner sound</div>
          <div className="text-xs text-muted">Fanfare on reveal</div>
        </div>
        <Switch checked={sound.winnerSoundEnabled} onCheckedChange={(b) => setSound({ winnerSoundEnabled: b })} />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-text">Tick sound</div>
          <div className="text-xs text-muted">Tick per segment during spin</div>
        </div>
        <Switch checked={sound.tickSoundEnabled} onCheckedChange={(b) => setSound({ tickSoundEnabled: b })} />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-text">Reduced sound mode</div>
          <div className="text-xs text-muted">Fewer, quieter effects</div>
        </div>
        <Switch checked={sound.reducedSoundMode} onCheckedChange={(b) => setSound({ reducedSoundMode: b })} />
      </div>
    </div>
  );
}