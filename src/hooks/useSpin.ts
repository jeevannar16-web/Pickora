import { useCallback, useEffect, useMemo } from 'react';
import { useParticipantStore } from '@/stores/participantStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useWheelStore } from '@/stores/wheelStore';
import { useUIStore } from '@/stores/uiStore';
import { useHistoryStore } from '@/stores/historyStore';
import { useDrawStore, SpinPhase } from '@/stores/drawStore';
import { getEligibleParticipants, generateDrawId, selectRandomWinners, selectRandomWinner } from '@/lib/random';
import { computeFinalWheelRotation, getSegmentIndexFromAngle } from '@/lib/wheelGeometry';
import { validateParticipantCount } from '@/lib/validation';
import { audio } from '@/lib/audio';
import { Participant } from '@/types/participant';
import { usePrefersReducedMotion } from './useMediaQuery';

const WINDUP_MS = 400;
const LANDING_MS = 500;
const WIN_FLASH_MS = 460;
const WINDUP_DEG = 4;
const WIN_REVEAL_FIRST_MS = 60;
const WIN_REVEAL_STEP_MS = 620;
const WIN_REVEAL_PAD_MS = 260;

// The animation driver lives at module scope, NOT inside the hook: swapping
// layouts on a breakpoint resize unmounts WheelStage mid-spin, and the loop
// must survive that remount (otherwise the wheel freezes with isSpinning=true).
// `spin()` guards on isSpinning, so only one spin can run at a time.
let rafRef: number | null = null;
let tickTimerRef: ReturnType<typeof setInterval> | null = null;
let winTimerRef: ReturnType<typeof setTimeout> | null = null;
let lastSegRef = -1;
let lastFrameRef = 0;
let lastRotationRef = 0;
let speedRef = 0;
let phaseRef: SpinPhase = 'idle';

export function cancelSpinAnimation() {
  if (rafRef !== null) {
    cancelAnimationFrame(rafRef);
    rafRef = null;
  }
  if (tickTimerRef !== null) {
    clearInterval(tickTimerRef);
    tickTimerRef = null;
  }
  if (winTimerRef !== null) {
    clearTimeout(winTimerRef);
    winTimerRef = null;
  }
}

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
  const setPhase = useDrawStore((s) => s.setPhase);
  const setWinnerIndexes = useDrawStore((s) => s.setWinnerIndexes);
  const prefersReducedMotion = usePrefersReducedMotion();

  const eligible = useMemo(() => getEligibleParticipants(participants), [participants]);

  useEffect(() => {
    setEligibleCount(eligible.length);
  }, [eligible.length, setEligibleCount]);

  useEffect(() => {
    // Only stop audio on unmount — the rAF loop itself is intentionally NOT
    // cancelled so a spin survives layout swaps (e.g. a breakpoint resize) and
    // presentation-mode transitions while isSpinning is true.
    return () => {
      audio.stopDrone();
    };
  }, []);

  const spin = useCallback(() => {
    if (isSpinning) return;
    // Defensive context-aware clamp: never ask for more winners than exist.
    const activeWinnerCount = Math.max(1, Math.min(winnerCount, Math.max(1, eligible.length)));
    const validation = validateParticipantCount(activeWinnerCount, eligible.length);
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
      winners = selectRandomWinners(eligible, activeWinnerCount, allowDuplicates);
    } else {
      winners = allowDuplicates
        ? selectRandomWinners(eligible, activeWinnerCount, true)
        : selectRandomWinners(eligible, activeWinnerCount, false);
    }
    if (winners.length === 0) return;

    const winnerIndexes = winners
      .map((w) => eligible.findIndex((p) => p.id === w.id))
      .filter((i) => i >= 0);
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

    // The final resting angle: determined by which winner was drawn, constrained
    // to the winner slice's safe inner zone (excludes wedge gaps + edge buffer).
    const finalTarget = computeFinalWheelRotation(
      winnerIndexes[0] ?? 0,
      count,
      rotations,
      direction,
      90,
      settings.segmentSpacing,
      Math.random,
    );
    const dramatic = !reduced && settings.speed === 'dramatic';

    const masterOn = sound.masterEnabled;
    const dramaSound = masterOn && sound.spinSoundEnabled && !sound.reducedSoundMode;

    setIsSpinning(true);
    setPhase('idle');
    setWinnerIndexes([...winnerIndexes]);

    if (!reduced) {
      audio.spinStart();
    }

    let cancelled = false;
    const finish = (rotation: number) => {
      setRotation(rotation);
      audio.stopDrone();
      if (!reduced) {
        setPhase('win');
        if (dramaSound) audio.snap();
      }

      const commit = () => {
        if (cancelled) return;
        setPhase('idle');
        setWinnerIndexes([]);
        setIsSpinning(false);

        if (masterOn && sound.winnerSoundEnabled) {
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
      };

      if (!reduced) {
        // Multi-winner draws showcase each winner's slice in turn on the wheel,
        // so the win window must stay open until the final reveal plays.
        const revealTotal =
          WIN_REVEAL_FIRST_MS + Math.max(0, winnerIndexes.length - 1) * WIN_REVEAL_STEP_MS;
        winTimerRef = setTimeout(commit, Math.max(WIN_FLASH_MS, revealTotal + WIN_REVEAL_PAD_MS));
      } else {
        commit();
      }
    };

    if (!reduced) {
      const startTime = performance.now();
      const windupDeg = -direction * WINDUP_DEG;
      const mainMs = duration * 1000;
      const totalMs = WINDUP_MS + mainMs + LANDING_MS;
      const spinRange = finalTarget - windupDeg;
      lastSegRef = -1;
      lastFrameRef = startTime;
      lastRotationRef = 0;
      speedRef = 0;
      phaseRef = 'idle';
      audio.stopDrone();

      const easeFunctions: Record<string, (t: number) => number> = {
        easeOut: (t) => 1 - Math.pow(1 - t, 3),
        easeInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
        inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
        easeOutQuart: (t) => 1 - Math.pow(1 - t, 4),
      };
      const easeInCubic = (t: number) => t * t * t;
      const baseEase = easeFunctions[settings.easing] ?? easeFunctions.easeOutQuart;

      // Act 1: pull back against the direction of travel (slingshot).
      const overture = (elapsed: number) => {
        const u = Math.min(1, elapsed / WINDUP_MS);
        return windupDeg * easeFunctions.inOutCubic(u);
      };

      // Act 2: monotonic forward curve, optional false-deceleration when "Dramatic".
      const mainEase = (t: number) => {
        if (dramatic) {
          const seg = 0.5;
          const slowed = baseEase(t / seg);
          const remaining = 1 - slowed;
          const surge = easeInCubic(Math.min(1, (t - seg) / (1 - seg)));
          return slowed + remaining * surge;
        }
        return baseEase(t);
      };

      const animate = (now: number) => {
        const elapsed = now - startTime;
        let current: number;

        if (elapsed <= WINDUP_MS) {
          current = overture(elapsed);
          if (phaseRef !== 'windup') {
            phaseRef = 'windup';
            setPhase('windup');
            if (dramaSound) audio.windupSwell();
          }
        } else {
          const u = Math.min(1, (elapsed - WINDUP_MS) / (mainMs + LANDING_MS));
          current = windupDeg + spinRange * mainEase(u);
          const phaseNow = elapsed >= WINDUP_MS + mainMs ? 'landing' : 'spin';
          if (phaseRef !== phaseNow) {
            phaseRef = phaseNow;
            setPhase(phaseNow);
            if (phaseNow === 'landing' && dramaSound) {
              audio.startDrone();
            }
          }
        }

        setRotation(current);

        const dt = now - lastFrameRef;
        if (dt > 0) {
          speedRef = (Math.abs(current - lastRotationRef) / dt) * 1000;
        }
        if (masterOn && sound.tickSoundEnabled) {
          const seg = getSegmentIndexFromAngle(current, count);
          if (seg !== lastSegRef && seg >= 0) {
            lastSegRef = seg;
            const freq = Math.round(Math.min(1000, 430 + speedRef * 0.62));
            const heaviness = Math.min(0.042, Math.max(0.02, 0.035 - speedRef * 0.00002));
            audio.tickTension(freq, heaviness);
          }
        }
        lastFrameRef = now;
        lastRotationRef = current;

        if (elapsed < totalMs) {
          rafRef = requestAnimationFrame(animate);
        } else {
          finish(current);
        }
      };

      rafRef = requestAnimationFrame(animate);
    } else {
      // Reduced motion: no overture, no false-deceleration, no landing drama.
      const startTime = performance.now();
      const easing = (t: number) => 1 - Math.pow(1 - t, 3);
      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / (duration * 1000));
        const current = finalTarget * easing(progress);
        setRotation(current);
        if (progress < 1) {
          rafRef = requestAnimationFrame(animate);
        } else {
          finish(current);
        }
      };
      rafRef = requestAnimationFrame(animate);
    }
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
    setPhase,
    setWinnerIndexes,
  ]);

  return {
    spin,
    isSpinning,
    eligibleCount: eligible.length,
  };
}