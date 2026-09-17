import { useState, type ReactNode } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ThemeLivePicker } from './ThemeLivePicker';
import { ThemeSelector } from './ThemeSelector';
import { ThemeEditor } from './ThemeEditor';
import { WheelSettingsTab } from './WheelSettingsTab';
import { AnimationSettingsTab } from './AnimationSettingsTab';
import { SoundSettingsTab } from './SoundSettingsTab';
import { WinnerSettingsTab } from './WinnerSettingsTab';
import { PackSelector } from '@/features/packs/PackSelector';
import { useSettingsStore } from '@/stores/settingsStore';
import { useParticipantStore } from '@/stores/participantStore';
import { getEligibleParticipants } from '@/lib/random';
import { cn } from '@/lib/utils';

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
      <span className="h-px flex-1 bg-border-c" />
      {children}
      <span className="h-px flex-1 bg-border-c" />
    </h3>
  );
}

export function SettingsPanel() {
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const winnerCount = useSettingsStore((s) => s.winnerCount);
  const setWinnerCount = useSettingsStore((s) => s.setWinnerCount);
  const winnerMode = useSettingsStore((s) => s.winnerMode);
  const setWinnerMode = useSettingsStore((s) => s.setWinnerMode);
  const participants = useParticipantStore((s) => s.participants);

  const eligibleCount = getEligibleParticipants(participants).length;
  const maxWinners = Math.max(1, Math.min(5, eligibleCount));
  const winnerOptions = Array.from({ length: maxWinners }, (_, i) => i + 1);
  const displayedCount = Math.min(winnerCount, maxWinners);

  const handleCountChange = (n: number) => {
    setWinnerCount(n);
    if (n > 1 && winnerMode === 'single') setWinnerMode('multi');
    if (n === 1 && winnerMode !== 'single') setWinnerMode('single');
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="spinora-scroll flex-1 overflow-y-auto p-3">
        <section className="space-y-4" aria-label="Quick options">
          <div>
            <h3 className="font-display text-sm font-semibold text-text">Quick options</h3>
            <p className="text-[11px] leading-relaxed text-muted">
              Pick a look and how many winners. Everything else is already tuned.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted">Theme</label>
            <p className="-mt-1 text-[11px] text-muted">Your theme sets the colors, motion feel, and sounds together.</p>
            <ThemeLivePicker />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted">
              Content pack
            </label>
            <p className="-mt-1 text-[11px] text-muted">
              Adds icons, character, and a matching feel to every slice.
            </p>
            <PackSelector />
          </div>

          <div className="space-y-2">
            <label htmlFor="quick-winner-count" className="text-xs font-medium text-muted">
              Number of winners
            </label>
            <Select value={String(displayedCount)} onValueChange={(v) => handleCountChange(parseInt(v, 10))}>
              <SelectTrigger id="quick-winner-count" className="h-9 w-full" aria-label="Number of winners">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {winnerOptions.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} {n === 1 ? 'winner' : 'winners'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="-mt-1 text-[11px] text-muted">
              How many people this spin should pick{eligibleCount > 0 ? `, up to your ${eligibleCount} eligible name${eligibleCount === 1 ? '' : 's'}` : ''}.
            </p>
          </div>
        </section>

        <section className="mt-5" aria-label="Customize">
          <button
            onClick={() => setCustomizeOpen((o) => !o)}
            className={cn(
              'flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
              customizeOpen ? 'border-primary/50 bg-surface text-text' : 'border-border-c bg-surface text-text hover:border-primary/40'
            )}
            aria-expanded={customizeOpen}
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Customize
            </span>
            <ChevronDown className={cn('h-4 w-4 text-muted transition-transform', customizeOpen && 'rotate-180')} />
          </button>
          <p className="mt-1.5 px-1 text-[11px] leading-relaxed text-muted">
            For power users: fine-tune the wheel's look, motion, sound, and winner rules here.
          </p>

          {customizeOpen && (
            <div className="mt-3 space-y-5">
              <div aria-label="Appearance">
                <SectionTitle>Appearance</SectionTitle>
                <WheelSettingsTab />
              </div>

              <div aria-label="Themes">
                <SectionTitle>Themes</SectionTitle>
                <div className="space-y-3">
                  <div>
                    <p className="mb-1.5 text-[11px] text-muted">More looks:</p>
                    <ThemeSelector />
                  </div>
                  <div className="rounded-lg border border-border-c bg-surface p-3">
                    <ThemeEditor />
                  </div>
                </div>
              </div>

              <div aria-label="Motion">
                <SectionTitle>Motion</SectionTitle>
                <AnimationSettingsTab />
              </div>

              <div aria-label="Sound">
                <SectionTitle>Sound</SectionTitle>
                <SoundSettingsTab />
              </div>

              <div aria-label="Winner rules">
                <SectionTitle>Winner rules</SectionTitle>
                <WinnerSettingsTab />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}