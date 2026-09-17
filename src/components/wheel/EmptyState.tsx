import { motion } from 'framer-motion';
import { ArrowUp, ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptyState({
  isMobile,
  onAddNames,
  reducedMotion,
}: {
  isMobile: boolean;
  onAddNames: () => void;
  reducedMotion: boolean;
}) {
  const Arrow = isMobile ? ArrowUp : ArrowLeft;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex items-center justify-center gap-3 rounded-2xl border border-border-c bg-surface/70 px-4 py-3 backdrop-blur"
    >
      <motion.div
        aria-hidden
        animate={
          reducedMotion
            ? {}
            : isMobile
              ? { y: [0, -5, 0] }
              : { x: [-6, 0, -6] }
        }
        transition={
          reducedMotion
            ? undefined
            : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
        }
        className="text-primary"
      >
        <Arrow className="h-5 w-5" />
      </motion.div>
      <div className="min-w-0">
        <p className="font-display text-sm font-semibold text-text">
          Who&rsquo;s in the running?
        </p>
        <p className="truncate text-xs text-muted">
          Add a name or two, then watch the wheel pick a winner.
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={onAddNames}
        className="shrink-0 gap-1.5"
        aria-label="Add participants"
      >
        <Users className="h-3.5 w-3.5" />
        Add names
      </Button>
    </motion.div>
  );
}