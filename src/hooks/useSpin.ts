import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParticipantStore } from '@/stores/participantStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useWheelStore } from '@/stores/wheelStore';
import { useUIStore } from '@/stores/uiStore';
import { useHistoryStore } from '@/stores/historyStore';
import { useDrawStore } from '@/stores/drawStore';
import { getEligibleParticipants, generateDrawId, selectRandomWinners, selectRandomWinner } from '@/lib/random';
import { computeFinalWheelRotation } from '@/lib/wheelGeometry';
import { validateParticipantCount } from '@/lib/validation';
import { audio } from '@/lib/audio';
import { Participant } from '@/types/participant';
import { usePrefersReducedMotion } from './useMediaQuery';

export function useSpin() {
  const participants = useParticipantStore((s) => s.participants);
  const removeParticipant = useParticipantStore((s) => s.removeParticipant);
  const wheelName = useWheelStore((s) => s.wheelName);
  const setRotation = useWheelStore((s) => s.setRotation);
  const settings = useWheelStore((s) => s.settings);
  const winnerMode = useSettingsStore((s) => s.winnerMode);
  const winnerCount = useSettingsStore((s) => s.winnerCount);
  const allowDuplicates = useSettingsStore((s) => s.allowDuplicates);
  const removeWinnersSetting = useSettingsStore((s) => s.removeWinners);
  const sound = useSettingsStore((s) => s.sound);
  const isSpinning = useUIStore((s) => s.isSpinning);
  const setIsSpinning = useUIStore((s) => s.setIsSpinning);
  const setWinnerModalOpen = useUIStore((s) => s.setWinnerModalOpen);
  const setLastWinners = useUIStore((s) => s.setLastWinners);
  const addDraw = useHistoryStore((s) => s.addDraw);
  const setEligibleCount = useDrawStore((s) => s.setEligibleCount);
  const setLastResult = useDrawStore((s) => s.setLastResult);
  const prefersReducedMotion = usePrefersReducedMotion();

  const rafRef = useRef<number | null>(null);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [statusText, setStatusText] = useState('');

  const eligible = useMemo(() => getEligibleParticipants(participants), [participants]);

  useEffect(() => {
    setEligibleCount(eligible.length);
  }, [eligible.length, setEligibleCount]);

  const cleanup = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (tickTimerRef.current) {
      clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const spin = useCallback(() => {
    if (isSpinning) return;
    const validation = validateParticipantCount(winnerCount, eligible.length);
    if (!validation.valid) {
      useUIStore.getState().showToast(validation.message ?? 'Cannot spin with current settings.', 'error');
      audio.error();
      return;
    }

    let winners: Participant[];
    if (winnerMode === 'single') {
      const w = selectRandomWinner(eligible);
      winners = w ? [w] : [];
    } else if (winnerMode === 'multi') {
      winners = selectRandomWinners(eligible, winnerCount, allowDuplicates);
    } else {
      winners = allowDuplicates
        ? selectRandomWinners(eligible, winnerCount, true)
        : selectRandomWinners(eligible, winnerCount, false);
    }
    if (winners.length === 0) return;

    const winnerIndex = eligible.findIndex((p) => p.id === winners[0].id);
    const count = eligible.length;
    const direction = settings.spinDirection === 'counterclockwise' ? -1 : 1;

    const speedConfig = {
      fast: { rotations: 8, duration: 3.5 },
      normal: { rotations: 10, duration: 5 },
      dramatic: { rotations: 14, duration: 7.5 },
    }[settings.speed];

    const reduced = prefersReducedMotion || settings.reduceMotionOn;
    const rotations = settings.customRotations ?? speedConfig.rotations;
    const duration = reduced ? 1.2 : settings.customDuration ?? speedConfig.duration;

    const finalTarget = computeFinalWheelRotation(winnerIndex, count, rotations, direction);

    setIsSpinning(true);
    setStatusText(reduced ? 'Selecting winner…' : 'Spinning…');

    if (sound.masterEnabled && sound.spinSoundEnabled) {
      audio.spinStart();
    }

    if (!reduced) {
      tickTimerRef.current = setInterval(() => {
        if (sound.masterEnabled && sound.tickSoundEnabled) {
          audio.tick();
        }
      }, Math.max(90, (duration * 1000) / (rotations * count)));
    }

    const startTime = performance.now();
    const startRotation = 0;

    const easeFunctions: Record<string, (t: number) => number> = {
      easeOut: (t) => 1 - Math.pow(1 - t, 3),
      easeInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
      inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
      easeOutQuart: (t) => 1 - Math.pow(1 - t, 4),
    };
    const easingFn = easeFunctions[settings.easing] ?? easeFunctions.easeOutQuart;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / (duration * 1000));
      const eased = easingFn(progress);
      const current = startRotation + finalTarget * eased;
      setRotation(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setRotation(startRotation + finalTarget);
        setIsSpinning(false);
        setStatusText('');

        if (sound.masterEnabled && sound.winnerSoundEnabled) {
          audio.winner();
        }

        const drawId = generateDrawId();
        const winnerNames = winners.map((w) => w.name);
        const modeLabel =
          winnerMode === 'single'
            ? 'Single'
            : winnerMode === 'multi'
              ? 'Multiple'
              : winnerMode === 'sequential'
                ? 'Sequential'
                : 'Elimination';

        if (removeWinnersSetting) {
          winners.forEach((w) => removeParticipant(w.id));
        }

        setLastWinners({ names: winnerNames, drawId, mode: modeLabel });
        setLastResult({
          winners,
          mode: modeLabel,
          drawId,
          pulled: new Date(),
        });
        addDraw({
          wheelName,
          winners: winnerNames,
          participantCount: count,
          winnerMode: modeLabel,
          winnersRemoved: removeWinnersSetting,
        });
        setWinnerModalOpen(true);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
  }, [
    isSpinning,
    winnerCount,
    eligible,
    winnerMode,
    allowDuplicates,
    settings,
    sound,
    prefersReducedMotion,
    removeWinnersSetting,
    wheelName,
    setRotation,
    setIsSpinning,
    setWinnerModalOpen,
    setLastWinners,
    removeParticipant,
    addDraw,
    setLastResult,
  ]);

  return {
    spin,
    isSpinning,
    statusText,
    eligibleCount: eligible.length,
  };
}