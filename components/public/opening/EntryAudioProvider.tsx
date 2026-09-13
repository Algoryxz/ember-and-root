'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  createPrologueAudioController,
  getPrologueAudio,
  type PrologueAudioController,
} from './prologueAudio';

export interface EntryAudioContextValue {
  isMuted: boolean;
  isPlaying: boolean;
  isExiting: boolean;
  toggleMute: () => void;
  play: () => Promise<void>;
  restart: () => Promise<void>;
  startExitTransition: (redirectTo: string) => Promise<void>;
}

const EntryAudioContext = createContext<EntryAudioContextValue | null>(null);

const ENTRY_ROUTES = new Set(['/', '/login', '/signup']);

export function EntryAudioProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const controllerRef = useRef<PrologueAudioController | null>(null);

  const getController = useCallback((): PrologueAudioController | null => {
    if (typeof window === 'undefined') return null;
    if (!controllerRef.current) {
      controllerRef.current = createPrologueAudioController((muted, playing) => {
        setIsMuted(muted);
        setIsPlaying(playing);
      });
    }
    return controllerRef.current;
  }, []);

  // Synchronize state and enforce entry/game boundary
  useEffect(() => {
    const isEntry = ENTRY_ROUTES.has(pathname);
    if (!isEntry) {
      // Out of entry chapter (e.g. game surfaces, onboarding): enforce ZERO presence
      if (controllerRef.current) {
        controllerRef.current.cleanup();
        controllerRef.current = null;
      }
      setIsPlaying(false);
    } else {
      const controller = getController();
      if (controller) {
        setIsMuted(controller.isMuted);
        setIsPlaying(controller.isPlaying);
      }
    }
  }, [pathname, getController]);

  const toggleMute = useCallback(() => {
    getController()?.toggleMute();
  }, [getController]);

  const play = useCallback(async () => {
    await getController()?.play();
  }, [getController]);

  const restart = useCallback(async () => {
    await getController()?.restart();
  }, [getController]);

  const startExitTransition = useCallback(
    async (redirectTo: string) => {
      setIsExiting(true);
      const controller = controllerRef.current;
      // Start 2.4s slow cinematic fade (100% -> ~40% at midpoint -> 0%)
      const fadePromise = controller ? controller.fadeExit(2400) : Promise.resolve();
      // Delay navigation until fade completes
      await Promise.all([
        fadePromise,
        new Promise((resolve) => setTimeout(resolve, 2400)),
      ]);

      router.push(redirectTo);
      // Brief timeout before resetting exit state after navigation initiates
      setTimeout(() => {
        setIsExiting(false);
      }, 500);
    },
    [router]
  );

  return (
    <EntryAudioContext.Provider
      value={{
        isMuted,
        isPlaying,
        isExiting,
        toggleMute,
        play,
        restart,
        startExitTransition,
      }}
    >
      {children}
    </EntryAudioContext.Provider>
  );
}

export function useEntryAudio(): EntryAudioContextValue {
  const context = useContext(EntryAudioContext);
  if (!context) {
    // Fallback safe dummy object if rendered outside provider (e.g. isolated test environments)
    return {
      isMuted: false,
      isPlaying: false,
      isExiting: false,
      toggleMute: () => {},
      play: async () => {},
      restart: async () => {},
      startExitTransition: async (to) => {
        if (typeof window !== 'undefined') window.location.href = to;
      },
    };
  }
  return context;
}
