import { useCallback, useEffect, useMemo, useRef } from 'react';
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

  const rafRef = useRef<number | null>(null);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const winTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSegRef = useRef<number>(-1);
  const lastFrameRef = useRef<number>(0);
  const lastRotationRef = useRef<number>(0);
  const speedRef = useRef<number>(0);
  const phaseRef = useRef<SpinPhase>('idle');

  const eligible = useMemo(() => getEligibleParticipants(participants), [participants]);

  useEffect(() => {
    setEligibleCount(eligible.length);
  }, [eligible.length, setEligibleCount]);

  const cancelAnimation = useCallback(() => {
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
    return () => {
      cancelAnimation();
      if (winTimerRef.current) clearTimeout(winTimerRef.current);
      audio.stopDrone();
    };
  }, [cancelAnimation]);

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

    // The exact final resting angle — unchanged, purely determined by which winner was drawn.
    const finalTarget = computeFinalWheelRotation(winnerIndexes[0] ?? 0, count, rotations, direction);
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
        winTimerRef.current = setTimeout(commit, WIN_FLASH_MS);
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
      lastSegRef.current = -1;
      lastFrameRef.current = startTime;
      lastRotationRef.current = 0;
      speedRef.current = 0;
      phaseRef.current = 'idle';
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
          if (phaseRef.current !== 'windup') {
            phaseRef.current = 'windup';
            setPhase('windup');
            if (dramaSound) audio.windupSwell();
          }
        } else {
          const u = Math.min(1, (elapsed - WINDUP_MS) / (mainMs + LANDING_MS));
          current = windupDeg + spinRange * mainEase(u);
          const phaseNow = elapsed >= WINDUP_MS + mainMs ? 'landing' : 'spin';
          if (phaseRef.current !== phaseNow) {
            phaseRef.current = phaseNow;
            setPhase(phaseNow);
            if (phaseNow === 'landing' && dramaSound) {
              audio.startDrone();
            }
          }
        }

        setRotation(current);

        const dt = now - lastFrameRef.current;
        if (dt > 0) {
          speedRef.current = (Math.abs(current - lastRotationRef.current) / dt) * 1000;
        }
        if (masterOn && sound.tickSoundEnabled) {
          const seg = getSegmentIndexFromAngle(current, count);
          if (seg !== lastSegRef.current && seg >= 0) {
            lastSegRef.current = seg;
            const freq = Math.round(Math.min(1000, 430 + speedRef.current * 0.62));
            const heaviness = Math.min(0.042, Math.max(0.02, 0.035 - speedRef.current * 0.00002));
            audio.tickTension(freq, heaviness);
          }
        }
        lastFrameRef.current = now;
        lastRotationRef.current = current;

        if (elapsed < totalMs) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          finish(current);
        }
      };

      rafRef.current = requestAnimationFrame(animate);
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
          rafRef.current = requestAnimationFrame(animate);
        } else {
          finish(current);
        }
      };
      rafRef.current = requestAnimationFrame(animate);
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