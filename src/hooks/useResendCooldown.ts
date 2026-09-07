import { useCallback, useEffect, useState } from 'react';

const STORAGE_PREFIX = 'otpResendCooldown:';

const readUntil = (key: string): number => {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    const ts = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(ts) ? ts : 0;
  } catch {
    return 0;
  }
};

const writeUntil = (key: string, until: number) => {
  try {
    if (until > Date.now()) {
      localStorage.setItem(STORAGE_PREFIX + key, String(until));
    } else {
      localStorage.removeItem(STORAGE_PREFIX + key);
    }
  } catch { }
};

const computeSecondsLeft = (until: number) =>
  Math.max(0, Math.ceil((until - Date.now()) / 1000));

/**
 * Tracks an OTP resend cooldown keyed by something stable (usually the email).
 * Returns the remaining seconds, a `canResend` flag, and a `startCooldown`
 * function to call after a successful resend. The timestamp is persisted to
 * localStorage so the cooldown survives reloads.
 *
 * If `startImmediately` is true, the cooldown is initialized on mount (useful
 * for OTP screens where a code was just sent during the prior step).
 */
export const useResendCooldown = (
  key: string | undefined | null,
  durationSec: number = 45,
  startImmediately: boolean = true,
) => {
  const safeKey = key || '';
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!safeKey) {
      setSecondsLeft(0);
      return;
    }
    let until = readUntil(safeKey);
    if (!until && startImmediately) {
      until = Date.now() + durationSec * 1000;
      writeUntil(safeKey, until);
    }
    setSecondsLeft(computeSecondsLeft(until));

    if (until <= Date.now()) return;
    const id = window.setInterval(() => {
      const left = computeSecondsLeft(until);
      setSecondsLeft(left);
      if (left <= 0) window.clearInterval(id);
    }, 1000);
    return () => window.clearInterval(id);
  }, [safeKey, durationSec, startImmediately]);

  const startCooldown = useCallback(() => {
    if (!safeKey) return;
    const until = Date.now() + durationSec * 1000;
    writeUntil(safeKey, until);
    setSecondsLeft(computeSecondsLeft(until));
    const id = window.setInterval(() => {
      const left = computeSecondsLeft(until);
      setSecondsLeft(left);
      if (left <= 0) window.clearInterval(id);
    }, 1000);
  }, [safeKey, durationSec]);

  const formatted = (() => {
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  })();

  return {
    secondsLeft,
    canResend: secondsLeft <= 0,
    formatted,
    startCooldown,
  };
};
