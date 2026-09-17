import { useState } from 'react';
import { Save, PlayCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWheelStore } from '@/stores/wheelStore';
import { useUIStore } from '@/stores/uiStore';
import { useSavedWheelStore, SavedWheel } from '@/stores/savedWheelStore';
import { useParticipantStore } from '@/stores/participantStore';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { THEMES as presets } from '@/features/themes/presets';

export function SavedWheelsDialog() {
  const [open, setOpen] = useState(false);
  const wheels = useSavedWheelStore((s) => s.wheels);
  const saveWheel = useSavedWheelStore((s) => s.saveWheel);
  const deleteWheel = useSavedWheelStore((s) => s.deleteWheel);
  const duplicateWheel = useSavedWheelStore((s) => s.duplicateWheel);
  const getWheel = useSavedWheelStore((s) => s.getWheel);
  const recentlyUsed = useSavedWheelStore((s) => s.recentlyUsed);
  const touchRecent = useSavedWheelStore((s) => s.touchRecent);

  const wheelName = useWheelStore((s) => s.wheelName);
  const setWheelName = useWheelStore((s) => s.setWheelName);
  const participants = useParticipantStore((s) => s.participants);
  const setParticipants = useParticipantStore.setState;
  const themeId = useSettingsStore((s) => s.activeThemeId);
  const customThemes = useSettingsStore((s) => s.customThemes);
  const winnerMode = useSettingsStore((s) => s.winnerMode);
  const winnerCount = useSettingsStore((s) => s.winnerCount);
  const allowDuplicates = useSettingsStore((s) => s.allowDuplicates);
  const removeWinners = useSettingsStore((s) => s.removeWinners);
  const wheelType = useWheelStore((s) => s.settings.type);
  const showToast = useUIStore((s) => s.showToast);
  const requestConfirmation = useUIStore((s) => s.requestConfirmation);

  const saveCurrent = () => {
    saveWheel({
      name: wheelName,
      participants,
      themeId,
      customThemes,
      wheelType,
      winnerSettings: { mode: winnerMode, winnerCount, allowDuplicates, removeWinners },
    });
    showToast('Wheel saved.', 'success');
  };

  const openWheel = (w: SavedWheel) => {
    setWheelName(w.name);
    setParticipants({ participants: w.participants });
    useSettingsStore.getState().setTheme(w.themeId);
    useSettingsStore.setState({ customThemes: w.customThemes ?? [] });
    useWheelStore.getState().setType(w.wheelType as never);
    useSettingsStore.getState().setWinnerMode(w.winnerSettings.mode as never);
    useSettingsStore.getState().setWinnerCount(w.winnerSettings.winnerCount);
    useSettingsStore.getState().setAllowDuplicates(w.winnerSettings.allowDuplicates);
    useSettingsStore.getState().setRemoveWinners(w.winnerSettings.removeWinners);
    touchRecent(w.id);
    showToast(`Loaded "${w.name}".`, 'success');
    setOpen(false);
  };

  const recentWheels = recentlyUsed.map((id) => getWheel(id)).filter(Boolean) as SavedWheel[];

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Save className="h-4 w-4" /> Saved Wheels
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Saved Wheels</DialogTitle>
            <DialogDescription>
              Save and reload your wheels from this browser.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-border-c bg-surface p-3">
            <div className="flex items-center gap-2">
              <Input
                value={wheelName}
                onChange={(e) => setWheelName(e.target.value)}
                placeholder="Wheel name"
              />
              <Button onClick={saveCurrent}>Save current</Button>
            </div>
          </div>

          {recentWheels.length > 0 && (
            <div>
              <div className="mb-1.5 text-xs font-medium text-muted">Recently used</div>
              <div className="space-y-1.5">
                {recentWheels.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => openWheel(w)}
                    className="flex w-full items-center gap-2 rounded-lg border border-border-c bg-elevated px-3 py-2 text-left text-sm text-text hover:border-primary/50 transition-colors"
                  >
                    <PlayCircle className="h-4 w-4 text-primary" />
                    <span className="flex-1">{w.name}</span>
                    <span className="text-xs text-muted">{w.participants.length} participants</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {wheels.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-c p-6 text-center text-sm text-muted">
              No saved wheels yet. Save your first wheel to see it here.
            </div>
          ) : (
            <div className="space-y-1.5">
              {wheels.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center gap-2 rounded-lg border border-border-c bg-elevated px-3 py-2"
                >
                  <button onClick={() => openWheel(w)} className="flex flex-1 items-center gap-2 text-left text-sm text-text hover:text-primary">
                    <div className="flex gap-0.5">
                      {w.themeId in presets && (
                        <span className="h-4 w-4 rounded-full" style={{ background: presets[w.themeId]?.segmentColors?.[0] }} />
                      )}
                    </div>
                    <span className="truncate">{w.name}</span>
                  </button>
                  <button
                    className="text-xs text-muted hover:text-text"
                    onClick={() => { duplicateWheel(w.id); showToast('Wheel duplicated.', 'success'); }}
                    aria-label={`Duplicate ${w.name}`}
                  >
                    Copy
                  </button>
                  <button
                    className="text-xs text-danger hover:text-danger/80"
                    onClick={() => requestConfirmation(() => deleteWheel(w.id), `Delete "${w.name}"?`) }
                    aria-label={`Delete ${w.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}