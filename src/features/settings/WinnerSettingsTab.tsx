import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { type ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { useSettingsStore } from '@/stores/settingsStore';
import { useParticipantStore } from '@/stores/participantStore';
import { getEligibleParticipants } from '@/lib/random';

function Field({ label, hint, children }: { label: string; hint: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-text">{label}</label>
      {children}
      <p className="-mt-1 text-[11px] leading-relaxed text-muted">{hint}</p>
    </div>
  );
}

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

export function WinnerSettingsTab() {
  const winnerMode = useSettingsStore((s) => s.winnerMode);
  const winnerCount = useSettingsStore((s) => s.winnerCount);
  const allowDuplicates = useSettingsStore((s) => s.allowDuplicates);
  const removeWinners = useSettingsStore((s) => s.removeWinners);
  const setWinnerMode = useSettingsStore((s) => s.setWinnerMode);
  const setWinnerCount = useSettingsStore((s) => s.setWinnerCount);
  const setAllowDuplicates = useSettingsStore((s) => s.setAllowDuplicates);
  const setRemoveWinners = useSettingsStore((s) => s.setRemoveWinners);
  const participants = useParticipantStore((s) => s.participants);

  const eligibleCount = getEligibleParticipants(participants).length;
  const invalid = winnerCount < 1 || winnerCount > eligibleCount;

  return (
    <div className="space-y-4">
      <Field label="Winner mode" hint="How winners are picked. Multi picks several at once; Sequential draws one every spin; Elimination removes each winner automatically.">
        <Select value={winnerMode} onValueChange={(v) => setWinnerMode(v as typeof winnerMode)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="single">Single winner</SelectItem>
            <SelectItem value="multi">Multiple winners</SelectItem>
            <SelectItem value="sequential">Sequential winners</SelectItem>
            <SelectItem value="elimination">Elimination mode</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="Number of winners" hint="How many people this spin should pick. (Quick options up top covers the common cases.)">
        <Input
          type="number"
          min={1}
          aria-label="Number of winners (customize)"
          value={winnerCount}
          onChange={(e) => setWinnerCount(Math.max(1, parseInt(e.target.value) || 1))}
        />
        {invalid && (
          <p className="text-xs text-danger">
            Must be between 1 and {Math.max(0, eligibleCount)} eligible participant{eligibleCount === 1 ? '' : 's'}.
          </p>
        )}
      </Field>

      <Row
        label="Allow duplicate winners"
        hint="The same person can win again in the same spin or across spins."
        checked={allowDuplicates}
        onCheckedChange={setAllowDuplicates}
      />

      <Row
        label="Remove winners from list"
        hint="Take winners out of the list after a draw, so they can't win again."
        checked={removeWinners}
        onCheckedChange={setRemoveWinners}
      />
    </div>
  );
}