export async function confettiBurst(colors: string[], particleCount = 90) {
  const { default: confetti } = await import('canvas-confetti');
  confetti({
    particleCount,
    spread: 120,
    origin: { y: 0.55 },
    scalar: 1.1,
    colors,
  });
  confetti({
    particleCount: Math.round(particleCount * 0.55),
    angle: 60,
    spread: 70,
    origin: { x: 0.15, y: 0.6 },
    colors,
  });
  confetti({
    particleCount: Math.round(particleCount * 0.55),
    angle: 120,
    spread: 70,
    origin: { x: 0.85, y: 0.6 },
    colors,
  });
}

export async function confettiRing(colors: string[], duration = 650) {
  const { default: confetti } = await import('canvas-confetti');
  const end = Date.now() + duration;
  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}