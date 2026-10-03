"use client";

import React from "react";
import { useDemoMode } from "@/context/DemoModeContext";
import { Sparkles, ArrowRight } from "lucide-react";

export const DemoBanner: React.FC = () => {
  const { demoMode, toggleDemoMode } = useDemoMode();

  if (!demoMode) return null;

  return (
    <div className="mx-4 mt-3 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
      <div className="flex items-center gap-2 text-amber-300">
        <Sparkles className="w-3.5 h-3.5 shrink-0" />
        <span className="font-medium">Demo Mode active (Simulated Assets)</span>
      </div>
      <button
        onClick={toggleDemoMode}
        type="button"
        className="font-semibold text-amber-400 hover:text-amber-200 flex items-center gap-1 cursor-pointer transition-colors"
      >
        <span>Live</span>
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
};
