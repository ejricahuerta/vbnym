"use client";

import type { ReactElement, ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";

type GameDetailSignupOpenerContextValue = {
  registerOpener: (fn: (() => void) | null) => void;
  requestOpen: () => void;
};

const GameDetailSignupOpenerContext = createContext<GameDetailSignupOpenerContextValue | null>(null);

export function GameDetailSignupOpenerProvider({ children }: { children: ReactNode }): ReactElement {
  const openerRef = useRef<(() => void) | null>(null);

  const registerOpener = useCallback((fn: (() => void) | null) => {
    openerRef.current = fn;
  }, []);

  const requestOpen = useCallback(() => {
    openerRef.current?.();
  }, []);

  const value = useMemo(
    () => ({ registerOpener, requestOpen }),
    [registerOpener, requestOpen],
  );

  return (
    <GameDetailSignupOpenerContext.Provider value={value}>{children}</GameDetailSignupOpenerContext.Provider>
  );
}

export function useRegisterGameDetailSignupOpener(fn: () => void): void {
  const ctx = useContext(GameDetailSignupOpenerContext);
  if (!ctx) {
    throw new Error("useRegisterGameDetailSignupOpener must be used within GameDetailSignupOpenerProvider");
  }
  const { registerOpener } = ctx;
  useEffect(() => {
    registerOpener(fn);
    return () => registerOpener(null);
  }, [fn, registerOpener]);
}

export function useRequestGameDetailSignup(): () => void {
  const ctx = useContext(GameDetailSignupOpenerContext);
  if (!ctx) {
    return () => {};
  }
  return ctx.requestOpen;
}
