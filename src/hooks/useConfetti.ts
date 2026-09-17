export function useConfetti() {
  const fire = (colors: string[], particleCount = 180) => {
    import('canvas-confetti').then(({ default: confetti }) => {
      confetti({
        particleCount,
        spread: 100,
        origin: { y: 0.6 },
        colors,
      });
    });
  };

  const fireMultiple = (colors: string[]) => {
    import('canvas-confetti').then(({ default: confetti }) => {
      const end = Date.now() + 1200;
      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 60,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 60,
          origin: { x: 1 },
          colors,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    });
  };

  return { fire, fireMultiple };
}