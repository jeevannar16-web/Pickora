import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Wheel } from '@/components/wheel/Wheel';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/uiStore';
import { useWheelStore } from '@/stores/wheelStore';
import { useParticipantStore } from '@/stores/participantStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSpin } from '@/hooks/useSpin';
import { useConfetti } from '@/hooks/useConfetti';

export function PresentationMode() {
  const isPresenting = useUIStore((s) => s.isPresenting);
  const setIsPresenting = useUIStore((s) => s.setIsPresenting);
  const participants = useParticipantStore((s) => s.participants);
  const rotation = useWheelStore((s) => s.rotation);
  const settings = useWheelStore((s) => s.settings);
  const wheelName = useWheelStore((s) => s.wheelName);
  const theme = useSettingsStore((s) => s.theme);
  const isSpinning = useUIStore((s) => s.isSpinning);
  const lastWinners = useUIStore((s) => s.lastWinners);
  const { spin } = useSpin();
  const { fire } = useConfetti();

  useEffect(() => {
    if (!isPresenting) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsPresenting(false);
      if (e.code === 'Space') {
        e.preventDefault();
        spin();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPresenting, setIsPresenting, spin]);

  if (!isPresenting) return null;

  const eligible = participants.filter((p) => p.enabled);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-black"
      style={{ background: `radial-gradient(1200px 700px at 50% 30%, ${theme.surface}, ${theme.background})` }}
      role="dialog"
      aria-label="Presentation mode"
    >
      <button
        onClick={() => setIsPresenting(false)}
        className="fixed right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
        aria-label="Exit presentation mode"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="mb-2 px-4 text-center">
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">{wheelName}</h1>
        <p className="text-sm text-white/50">{eligible.length} participants</p>
      </div>

      <div className="relative w-[min(80vw,70vh)]">
        <Wheel
          participants={participants}
          theme={theme}
          settings={settings}
          rotation={rotation}
          size={Math.min(window.innerWidth * 0.8, window.innerHeight * 0.6)}
          isSpinning={isSpinning}
        />
      </div>

      <div className="mt-4 flex flex-col items-center gap-1">
        <Button
          size="xl"
          onClick={() => {
            const el = eligible.length;
            if (el > 0) {
              fire(theme.confettiColors, 80);
              spin();
            }
          }}
          disabled={isSpinning || eligible.length === 0}
          className="h-16 min-w-64 rounded-full bg-gradient-to-r from-primary to-secondary text-xl text-white shadow-2xl"
        >
          {isSpinning ? 'Spinning…' : 'Spin'}
        </Button>
        <p className="mt-2 text-xs text-white/40">Press Space to spin · Esc to exit</p>
      </div>

      <AnimatePresence>
        {lastWinners && (
          <motion.div
            key={lastWinners.drawId}
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 rounded-2xl border border-primary/40 bg-elevated/90 px-10 py-4 text-center shadow-2xl backdrop-blur"
          >
            <div className="text-sm uppercase tracking-widest text-primary">Winners</div>
            <div className="mt-1 flex items-end gap-3">
              {lastWinners.names.map((n, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.2 }}
                  className="text-3xl font-bold text-white sm:text-5xl"
                >
                  {n}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}