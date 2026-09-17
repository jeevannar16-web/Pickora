import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';

/**
 * A slow, GPU-cheap animated mesh behind everything. Pure transform + blur on
 * a few large circles — no paint churn at 60fps. Fully decorative and honors
 * prefers-reduced-motion.
 */
export function AmbientBackground() {
  const reduced = usePrefersReducedMotion();
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <motion.div
        className="absolute -left-24 -top-24 h-96 w-96 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--sp-primary) 0%, transparent 70%)', opacity: 0.14 }}
        animate={reduced ? undefined : { x: [0, 40, -20, 0], y: [0, 24, 52, 0] }}
        transition={reduced ? undefined : { duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--sp-secondary) 0%, transparent 70%)', opacity: 0.12 }}
        animate={reduced ? undefined : { x: [0, -36, 16, 0], y: [0, -28, 8, 0] }}
        transition={reduced ? undefined : { duration: 32, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="left-1/2 top-1/3 h-72 w-72 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--sp-accent) 0%, transparent 70%)', opacity: 0.09 }}
        animate={reduced ? undefined : { x: [0, 28, -14, 0], y: [0, -34, 18, 0] }}
        transition={reduced ? undefined : { duration: 24, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}