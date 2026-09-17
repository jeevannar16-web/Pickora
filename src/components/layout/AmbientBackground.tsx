/**
 * Ambient mesh behind everything — rendered as plain static CSS gradients so it
 * costs zero CPU/GPU per frame (no blur layers, no animation, no JS). Honors
 * prefers-reduced-motion by construction: it never moves.
 */
export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{
        background:
          'radial-gradient(42% 42% at 12% 8%, color-mix(in srgb, var(--sp-primary) 14%, transparent) 0%, transparent 70%),' +
          'radial-gradient(46% 46% at 88% 92%, color-mix(in srgb, var(--sp-secondary) 12%, transparent) 0%, transparent 70%),' +
          'radial-gradient(34% 34% at 55% 42%, color-mix(in srgb, var(--sp-accent) 9%, transparent) 0%, transparent 70%)',
      }}
    />
  );
}