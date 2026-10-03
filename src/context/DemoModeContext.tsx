"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface DemoModeContextType {
  demoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  toggleDemoMode: () => void;
}

const DemoModeContext = createContext<DemoModeContextType>({
  demoMode: true,
  setDemoMode: () => {},
  toggleDemoMode: () => {},
});

export const DemoModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [demoMode, setDemoModeState] = useState<boolean>(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("nexora_demo_mode");
      if (stored !== null) {
        setDemoModeState(stored === "true");
      } else {
        // If an authenticated account is already stored, default to Live mode (false)
        const hasAuth = localStorage.getItem("nexora_auth_account");
        const inWorldApp = typeof window !== "undefined" && Boolean((window as unknown as { WorldApp?: unknown }).WorldApp);
        if (hasAuth || inWorldApp) {
          setDemoModeState(false);
        }
      }
    } catch {
      // LocalStorage not available (e.g. strict private mode or SSR)
    }
  }, []);

  const setDemoMode = (enabled: boolean) => {
    setDemoModeState(enabled);
    try {
      localStorage.setItem("nexora_demo_mode", String(enabled));
    } catch {
      // Ignore
    }
  };

  const toggleDemoMode = () => {
    setDemoMode(!demoMode);
  };

  return (
    <DemoModeContext.Provider value={{ demoMode, setDemoMode, toggleDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  );
};

export const useDemoMode = () => useContext(DemoModeContext);
