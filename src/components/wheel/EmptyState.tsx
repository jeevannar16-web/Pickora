import { motion } from 'framer-motion';
import { ArrowUp, ArrowLeft, Users, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useParticipantStore } from '@/stores/participantStore';
import { useUIStore } from '@/stores/uiStore';

const EXAMPLES: { id: string; label: string; names: string[] }[] = [
  {
    id: 'standup',
    label: 'Team standup',
    names: ['Alex', 'Maya', 'Jordan', 'Priya', 'Sam', 'Diego', 'Nina', 'Kai'],
  },
  {
    id: 'raffle',
    label: 'Raffle night',
    names: ['Luca', 'Emma', 'Omar', 'Sofia', 'Raj', 'Chloe', 'Ethan', 'Ava'],
  },
  {
    id: 'classroom',
    label: 'Classroom pick',
    names: ['Lin', 'Mateo', 'Ruby', 'Jamal', 'Hana', 'Leo', 'Tessa', 'Noah'],
  },
];

export function EmptyState({
  isMobile,
  onAddNames,
  reducedMotion,
}: {
  isMobile: boolean;
  onAddNames: () => void;
  reducedMotion: boolean;
}) {
  const addParticipants = useParticipantStore((s) => s.addParticipants);
  const showToast = useUIStore((s) => s.showToast);
  const setActivePanel = useUIStore((s) => s.setActivePanel);
  const Arrow = isMobile ? ArrowUp : ArrowLeft;

  const loadExample = (id: string) => {
    const ex = EXAMPLES.find((e) => e.id === id);
    if (!ex) return;
    const result = addParticipants(ex.names);
    showToast(
      `Loaded "${ex.label}" (${result.added} names). Hit Spin when ready!`,
      'success'
    );
    setActivePanel('wheel');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex w-full flex-col items-center gap-2.5 rounded-2xl border border-border-c bg-surface/70 px-4 py-3 backdrop-blur"
    >
      <div className="flex items-center justify-center gap-3">
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
            Add names, or load an example to see the wheel in action.
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
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <span className="flex items-center gap-1 text-[11px] text-muted">
          <Wand2 className="h-3 w-3" /> Try an example:
        </span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.id}
            onClick={() => loadExample(ex.id)}
            className="rounded-full border border-border-c bg-elevated/60 px-3 py-1 text-[11px] font-medium text-text transition-colors hover:border-primary/50 hover:bg-elevated"
          >
            {ex.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}