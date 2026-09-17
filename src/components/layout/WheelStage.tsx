import { Play, Expand, Users, Settings2, History, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wheel } from '@/components/wheel/Wheel';
import { EmptyState } from '@/components/wheel/EmptyState';
import { useParticipantStore } from '@/stores/participantStore';
import { useWheelStore } from '@/stores/wheelStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUIStore } from '@/stores/uiStore';
import { useDrawStore, SpinPhase } from '@/stores/drawStore';
import { useSpin } from '@/hooks/useSpin';
import { useMediaQuery, usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

function phaseShadow(phase: SpinPhase): string {
  switch (phase) {
    case 'windup':
      return 'drop-shadow(0 8px 26px rgba(0,0,0,0.5)) drop-shadow(0 0 18px var(--sp-primary)33)';
    case 'spin':
      return 'drop-shadow(0 4px 32px rgba(0,0,0,0.62)) drop-shadow(0 0 24px var(--sp-accent)45)';
    case 'landing':
      return 'drop-shadow(0 2px 40px rgba(0,0,0,0.78)) drop-shadow(0 0 34px var(--sp-accent)66)';
    case 'win':
      return 'drop-shadow(0 10px 24px rgba(0,0,0,0.5)) drop-shadow(0 0 26px var(--sp-primary)44)';
    default:
      return 'drop-shadow(0 10px 22px rgba(0,0,0,0.35))';
  }
}

function phaseScale(phase: SpinPhase): number {
  switch (phase) {
    case 'windup':
      return 0.985;
    case 'spin':
      return 1.02;
    case 'landing':
      return 1.04;
    default:
      return 1;
  }
}

export function WheelStage() {
  const participants = useParticipantStore((s) => s.participants);
  const eligible = participants.filter((p) => p.enabled);
  const wheelName = useWheelStore((s) => s.wheelName);
  const rotation = useWheelStore((s) => s.rotation);
  const settings = useWheelStore((s) => s.settings);
  const theme = useSettingsStore((s) => s.theme);
  const isSpinning = useUIStore((s) => s.isSpinning);
  const setIsPresenting = useUIStore((s) => s.setIsPresenting);
  const setActivePanel = useUIStore((s) => s.setActivePanel);
  const winnerMode = useSettingsStore((s) => s.winnerMode);
  const winnerCount = useSettingsStore((s) => s.winnerCount);
  const setWinnerCount = useSettingsStore((s) => s.setWinnerCount);
  const setWinnerMode = useSettingsStore((s) => s.setWinnerMode);
  const phase = useDrawStore((s) => s.phase);
  const { spin, statusText } = useSpin();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const prefersReducedMotion = usePrefersReducedMotion();

  const handleCountChange = (n: number) => {
    setWinnerCount(n);
    if (n > 1 && winnerMode === 'single') setWinnerMode('multi');
    if (n === 1 && winnerMode !== 'single') setWinnerMode('single');
  };

  const canSpin = eligible.length > 0 && winnerCount <= eligible.length;

  const displaySize = isMobile ? 280 : 420;
  const actActive = phase === 'windup' || phase === 'spin' || phase === 'landing';
  const dimActive = !prefersReducedMotion && actActive;

  return (
    <div className="relative flex h-full flex-col items-center justify-between overflow-hidden p-4">
      {dimActive && (
        <motion.div
          initial={false}
          animate={{ opacity: phase === 'landing' ? 0.55 : phase === 'spin' ? 0.34 : 0.24 }}
          transition={{ duration: 0.4 }}
          className="pointer-events-none fixed inset-0 z-30"
          style={{
            background:
              'radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,0) 34%, rgba(0,0,0,0.42) 78%, rgba(0,0,0,0.66) 100%)',
          }}
        />
      )}

      <div className="relative flex w-full items-center justify-between">
        <div className="min-w-0">
          <h2 className="truncate font-display text-lg font-semibold text-text">{wheelName}</h2>
          <p className="text-xs text-muted">
            {eligible.length} eligible · {winnerMode} mode
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsPresenting(true)}
            aria-label="Enter presentation mode"
            title="Presentation mode"
          >
            <Expand className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center">
        <motion.div
          className="relative"
          style={{
            width: displaySize,
            height: displaySize,
            maxWidth: '100%',
          }}
          animate={
            prefersReducedMotion || settings.reduceMotionOn
              ? { scale: 1 }
              : { scale: phaseScale(phase) }
          }
          transition={{ type: 'spring', stiffness: 110, damping: 16 }}
        >
          <motion.div
            className="h-full w-full transition-[filter] duration-300"
            style={{
              filter:
                prefersReducedMotion || settings.reduceMotionOn
                  ? 'drop-shadow(0 10px 22px rgba(0,0,0,0.35))'
                  : phaseShadow(phase),
            }}
          >
            <Wheel
              participants={participants}
              theme={theme}
              settings={settings}
              rotation={rotation}
              size={displaySize}
              isSpinning={isSpinning}
            />
          </motion.div>
          {statusText && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-2 rounded-full bg-elevated/80 px-4 py-1.5 text-sm text-text shadow-lg backdrop-blur">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                {statusText}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <div className="relative z-40 flex w-full max-w-md flex-col items-center gap-2">
        {!canSpin &&
          (eligible.length === 0 ? (
            <EmptyState
              isMobile={isMobile}
              reducedMotion={prefersReducedMotion || settings.reduceMotionOn}
              onAddNames={() => setActivePanel('participants')}
            />
          ) : (
            <p className="text-center text-xs text-amber-400">
              Need at least {winnerCount} eligible participant{winnerCount === 1 ? '' : 's'} — you have {eligible.length}.
            </p>
          ))}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <label htmlFor="winner-count" className="text-xs text-muted">
              Winners:
            </label>
            <Select
              value={String(winnerCount)}
              onValueChange={(v) => handleCountChange(parseInt(v, 10))}
            >
              <SelectTrigger id="winner-count" className="h-9 w-20" aria-label="Number of winners">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((n) => (
                  <SelectItem key={n} value={String(n)} disabled={n > eligible.length}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            size="lg"
            onClick={spin}
            disabled={!canSpin || isSpinning}
            className="h-12 min-w-40 rounded-full bg-gradient-to-r from-primary to-secondary px-8 text-base shadow-lg shadow-primary/25 transition-transform hover:scale-[1.03] active:scale-[0.99] disabled:opacity-40"
            aria-label="Spin the wheel"
          >
            {isSpinning ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Spinning…</>
            ) : (
              <><Play className="h-5 w-5" /> Spin</>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {!isMobile && (
            <>
              <button
                onClick={() => setActivePanel('participants')}
                className={cn('flex items-center gap-1.5 rounded-lg border border-border-c bg-surface px-3 py-1.5 text-xs text-muted transition-colors hover:text-text')}
              >
                <Users className="h-3.5 w-3.5" /> Participants
              </button>
              <button
                onClick={() => setActivePanel('settings')}
                className="flex items-center gap-1.5 rounded-lg border border-border-c bg-surface px-3 py-1.5 text-xs text-muted transition-colors hover:text-text"
              >
                <Settings2 className="h-3.5 w-3.5" /> Settings
              </button>
              <button
                onClick={() => setActivePanel('history')}
                className="flex items-center gap-1.5 rounded-lg border border-border-c bg-surface px-3 py-1.5 text-xs text-muted transition-colors hover:text-text"
              >
                <History className="h-3.5 w-3.5" /> History
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}