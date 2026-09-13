'use client';

/**
 * Prologue Audio Manager — Ember & Root
 * 
 * Strict Invariants:
 * - Scoped exclusively to the public cinematic prologue.
 * - ZERO presence in game routes (Hearth, Root, Satchel, Chronicle, Settings).
 * - Autoplay policy compliant: attempts play, defers to first user gesture if blocked.
 * - Smooth 500-800ms volume fades on exit, skip, and navigation.
 * - Accessible Sound / Mute toggle with session persistence.
 * - Never blocks visual progression if audio fails or is disabled.
 */

const AUDIO_SRC = '/audio/prologue.mp3';
const STORAGE_KEY = 'ember_prologue_muted';

export interface PrologueAudioController {
  isMuted: boolean;
  isPlaying: boolean;
  isReady: boolean;
  toggleMute: () => void;
  play: () => Promise<void>;
  fadeOut: (durationMs?: number) => Promise<void>;
  fadeExit: (durationMs?: number) => Promise<void>;
  restart: () => Promise<void>;
  cleanup: () => void;
}

let globalAudio: HTMLAudioElement | null = null;
let fadeInterval: NodeJS.Timeout | null = null;

function getStoredMutePreference(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function setStoredMutePreference(muted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, muted ? 'true' : 'false');
  } catch {
    // Ignore storage restrictions
  }
}

export function getPrologueAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!globalAudio) {
    const audio = new Audio(AUDIO_SRC);
    audio.preload = 'auto';
    audio.loop = false;
    audio.volume = getStoredMutePreference() ? 0 : 1;
    globalAudio = audio;
  }
  return globalAudio;
}

export function fadeVolume(
  audio: HTMLAudioElement,
  targetVolume: number,
  durationMs = 600
): Promise<void> {
  return new Promise((resolve) => {
    if (fadeInterval) clearInterval(fadeInterval);

    const startVol = audio.volume;
    const diff = targetVolume - startVol;
    if (Math.abs(diff) < 0.01) {
      audio.volume = targetVolume;
      resolve();
      return;
    }

    const startTime = performance.now();
    fadeInterval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 0.5 * (1 - Math.cos(Math.PI * progress));
      audio.volume = Math.max(0, Math.min(1, startVol + diff * eased));

      if (progress >= 1) {
        if (fadeInterval) clearInterval(fadeInterval);
        fadeInterval = null;
        audio.volume = targetVolume;
        resolve();
      }
    }, 25);
  });
}

/**
 * Slow non-linear cinematic exit fade for confirmed successful entry.
 * Curve: 100% -> ~40% at midpoint (~1.2s) -> 0% at completion (2.4s).
 * Cleans up and pauses audio on completion.
 */
export function fadeExitAudio(
  audio: HTMLAudioElement,
  durationMs = 2400
): Promise<void> {
  return new Promise((resolve) => {
    if (fadeInterval) clearInterval(fadeInterval);

    const startVol = audio.volume;
    if (startVol < 0.01) {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 0;
      resolve();
      return;
    }

    const startTime = performance.now();
    fadeInterval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const p = Math.min(1, elapsed / durationMs);

      let factor: number;
      if (p <= 0.5) {
        // First half: 1.0 -> 0.4 with cosine ease
        const u = p / 0.5;
        const easedU = 0.5 * (1 - Math.cos(Math.PI * u));
        factor = 1.0 - 0.6 * easedU;
      } else {
        // Second half: 0.4 -> 0.0 with cosine ease
        const v = (p - 0.5) / 0.5;
        const easedV = 0.5 * (1 - Math.cos(Math.PI * v));
        factor = 0.4 - 0.4 * easedV;
      }

      audio.volume = Math.max(0, Math.min(1, startVol * factor));

      if (p >= 1) {
        if (fadeInterval) clearInterval(fadeInterval);
        fadeInterval = null;
        audio.volume = 0;
        audio.pause();
        audio.currentTime = 0;
        resolve();
      }
    }, 25);
  });
}

export function createPrologueAudioController(
  onStateChange?: (isMuted: boolean, isPlaying: boolean) => void
): PrologueAudioController {
  let isMuted = getStoredMutePreference();
  const audio = getPrologueAudio();
  let isPlaying = Boolean(audio && !audio.paused && audio.currentTime > 0 && !audio.ended);
  let isReady = false;
  let gestureRegistered = false;

  const notify = () => {
    onStateChange?.(isMuted, isPlaying);
  };

  const handleUserGesture = () => {
    if (!audio) return;
    if (!isMuted && audio.paused) {
      audio.play().then(() => {
        isPlaying = true;
        notify();
      }).catch(() => {});
    }
    removeGestureListeners();
  };

  const addGestureListeners = () => {
    if (gestureRegistered || typeof window === 'undefined') return;
    gestureRegistered = true;
    window.addEventListener('pointerdown', handleUserGesture, { once: true });
    window.addEventListener('keydown', handleUserGesture, { once: true });
  };

  const removeGestureListeners = () => {
    if (!gestureRegistered || typeof window === 'undefined') return;
    gestureRegistered = false;
    window.removeEventListener('pointerdown', handleUserGesture);
    window.removeEventListener('keydown', handleUserGesture);
  };

  if (audio) {
    audio.oncanplay = () => {
      isReady = true;
    };
    audio.onplay = () => {
      isPlaying = true;
      notify();
    };
    audio.onpause = () => {
      isPlaying = false;
      notify();
    };
    audio.onended = () => {
      isPlaying = false;
      notify();
    };
  }

  const play = async () => {
    if (!audio) return;
    if (fadeInterval) {
      clearInterval(fadeInterval);
      fadeInterval = null;
    }

    audio.volume = isMuted ? 0 : 1;
    try {
      await audio.play();
      isPlaying = true;
      notify();
    } catch {
      // Autoplay blocked by browser policy — attach one-time user gesture listener
      addGestureListeners();
    }
  };

  const toggleMute = () => {
    if (!audio) return;
    isMuted = !isMuted;
    setStoredMutePreference(isMuted);

    if (isMuted) {
      fadeVolume(audio, 0, 300);
    } else {
      if (audio.paused) {
        audio.play().catch(() => {});
      }
      fadeVolume(audio, 1, 300);
    }
    notify();
  };

  const fadeOut = async (durationMs = 600) => {
    if (!audio) return;
    removeGestureListeners();
    await fadeVolume(audio, 0, durationMs);
    audio.pause();
    isPlaying = false;
    notify();
  };

  const fadeExit = async (durationMs = 2400) => {
    if (!audio) return;
    removeGestureListeners();
    await fadeExitAudio(audio, durationMs);
    isPlaying = false;
    globalAudio = null;
    notify();
  };

  const restart = async () => {
    if (!audio) return;
    if (fadeInterval) {
      clearInterval(fadeInterval);
      fadeInterval = null;
    }
    audio.currentTime = 0;
    audio.volume = isMuted ? 0 : 1;
    try {
      await audio.play();
      isPlaying = true;
      notify();
    } catch {
      addGestureListeners();
    }
  };

  const cleanup = () => {
    removeGestureListeners();
    if (fadeInterval) {
      clearInterval(fadeInterval);
      fadeInterval = null;
    }
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      globalAudio = null;
    }
  };

  return {
    get isMuted() {
      return isMuted;
    },
    get isPlaying() {
      return isPlaying;
    },
    get isReady() {
      return isReady;
    },
    toggleMute,
    play,
    fadeOut,
    fadeExit,
    restart,
    cleanup,
  };
}
