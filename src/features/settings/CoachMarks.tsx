import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';

const STORAGE_KEY = 'spinora.coachmarks.dismissed';

/**
 * First-visit, one-time, dismissible tip shown above the Quick options panel.
 * Non-blocking: it never intercepts pointer events elsewhere and can be closed
 * with the X button or by just scrolling past it. Cleared forever on dismiss.
 */
export function CoachMarks() {
  const [visible, setVisible] = useState(() => {
    try {
      return !localStorage.getItem(STORAGE_KEY);
    } catch {
      // storage unavailable — skip coaching
      return false;
    }
  });

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="note"
          aria-label="Tip: how to spin"
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          className="relative mb-3 rounded-xl border border-primary/30 bg-surface/95 p-3 shadow-lg shadow-black/20"
        >
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss tip"
            className="absolute right-1.5 top-1.5 rounded-md p-1 text-muted transition-colors hover:bg-white/10 hover:text-text"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <div className="flex gap-2.5 pr-6">
            <motion.span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="h-3 w-3" />
            </motion.span>
            <div>
              <p className="text-xs font-semibold text-text">Tip</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                Spin with names on the wheel. Open{' '}
                <span className="font-semibold text-text">Customize</span> any time to swap the
                look, motion feel, and sounds.
              </p>
            </div>
          </div>
          <div className="pointer-events-none absolute -bottom-1.5 left-12 h-3 w-3 rotate-45 border-b border-r border-primary/30 bg-surface/95" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}