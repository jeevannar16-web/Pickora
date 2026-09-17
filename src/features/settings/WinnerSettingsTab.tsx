import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useSettingsStore } from '@/stores/settingsStore';
import { useParticipantStore } from '@/stores/participantStore';
import { getEligibleParticipants } from '@/lib/random';

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
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted">Winner mode</label>
        <Select value={winnerMode} onValueChange={(v) => setWinnerMode(v as typeof winnerMode)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="single">Single winner</SelectItem>
            <SelectItem value="multi">Multiple winners</SelectItem>
            <SelectItem value="sequential">Sequential winners</SelectItem>
            <SelectItem value="elimination">Elimination mode</SelectItem>
          </SelectContent>
        </Select>
        {winnerMode !== 'single' && (
          <p className="text-[11px] text-muted">
            {winnerMode === 'multi' && 'Select several winners in one spin.'}
            {winnerMode === 'sequential' && 'Winners are drawn one per spin, one after another.'}
            {winnerMode === 'elimination' && 'Each spin removes the winner from the pool.'}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted">Number of winners</label>
        <Input
          type="number"
          min={1}
          value={winnerCount}
          onChange={(e) => setWinnerCount(Math.max(1, parseInt(e.target.value) || 1))}
        />
        {invalid && (
          <p className="text-xs text-danger">
            Winner count must be between 1 and {Math.max(0, eligibleCount)} eligible participant{eligibleCount === 1 ? '' : 's'}.
          </p>
        )}
        <p className="text-[11px] text-muted">
          {eligibleCount} eligible participant{eligibleCount === 1 ? '' : 's'} currently.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-text">Allow duplicate winners</div>
          <div className="text-xs text-muted">Same participant can win twice</div>
        </div>
        <Switch checked={allowDuplicates} onCheckedChange={setAllowDuplicates} aria-label="Allow duplicate winners" />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-text">Remove winners from list</div>
          <div className="text-xs text-muted">Auto-remove after a draw</div>
        </div>
        <Switch checked={removeWinners} onCheckedChange={setRemoveWinners} aria-label="Remove winners from list" />
      </div>
    </div>
  );
}