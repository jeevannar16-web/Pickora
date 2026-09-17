import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Copy, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSpin } from '@/hooks/useSpin';
import { useConfetti } from '@/hooks/useConfetti';
import { copyToClipboard } from '@/lib/utils';

export function WinnerModal() {
  const open = useUIStore((s) => s.winnerModalOpen);
  const setOpen = useUIStore((s) => s.setWinnerModalOpen);
  const lastWinners = useUIStore((s) => s.lastWinners);
  const theme = useSettingsStore((s) => s.theme);
  const showToast = useUIStore((s) => s.showToast);
  const { spin, isSpinning } = useSpin();
  const { fire } = useConfetti();

  useEffect(() => {
    if (open && lastWinners) {
      const t = setTimeout(() => fire(theme.confettiColors, 160), 250);
      return () => clearTimeout(t);
    }
  }, [open, lastWinners, theme.confettiColors, fire]);

  const multi = lastWinners ? lastWinners.names.length > 1 : false;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <AnimatePresence>
        {open && lastWinners && (
          <DialogContent className="max-w-md overflow-hidden sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl text-primary">
                <Trophy className="h-5 w-5" />
                Winners Selected
              </DialogTitle>
              <DialogDescription>Draw #{lastWinners.drawId} · {lastWinners.mode} mode</DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-2">
              {lastWinners.names.map((name, i) => (
                <motion.div
                  key={`${lastWinners.drawId}-${i}`}
                  initial={{ opacity: 0, scale: 0.7, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.18, type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    style={{ background: theme.segmentColors[i % theme.segmentColors.length] }}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate text-lg font-semibold animate-pop-in">{name}</span>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const text = multi
                    ? lastWinners.names.map((n, i) => `${i + 1}. ${n}`).join('\n')
                    : lastWinners.names[0];
                  const ok = await copyToClipboard(text);
                  showToast(ok ? 'Results copied.' : 'Copy failed.', ok ? 'success' : 'error');
                }}
              >
                <Copy className="h-4 w-4" /> Copy results
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isSpinning}
                onClick={() => {
                  setOpen(false);
                  spin();
                }}
              >
                <RotateCcw className="h-4 w-4" /> Spin again
              </Button>
            </div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}