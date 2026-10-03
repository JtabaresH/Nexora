"use client";

import React from "react";
import { Home, Image as ImageIcon, ArrowLeftRight, Clock, Settings } from "lucide-react";

export type NavTab = "HOME" | "NFTS" | "ACTIVITY" | "SETTINGS";

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenSendReceive: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenSendReceive,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
      <div className="w-full max-w-[430px] px-4 pb-4 pt-1 pointer-events-auto">
        <div className="bg-[#101219]/95 backdrop-blur-xl border border-[#1E2333] rounded-3xl p-1.5 shadow-[0_10px_35px_rgba(0,0,0,0.6)] flex items-center justify-between">
          {/* 1. Home */}
          <button
            onClick={() => onTabChange("HOME")}
            type="button"
            className={`flex-1 py-2 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all cursor-pointer ${
              activeTab === "HOME"
                ? "text-[#00F293]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight">Home</span>
          </button>

          {/* 2. NFTs */}
          <button
            onClick={() => onTabChange("NFTS")}
            type="button"
            className={`flex-1 py-2 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all cursor-pointer ${
              activeTab === "NFTS"
                ? "text-[#00F293]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ImageIcon className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight">NFTs</span>
          </button>

          {/* Central Main Quick Action: Send / Receive */}
          <div className="px-1">
            <button
              onClick={onOpenSendReceive}
              type="button"
              title="Send or Receive"
              className="w-12 h-12 rounded-2xl world-glow-btn flex items-center justify-center text-[#06070A] shadow-lg cursor-pointer transform active:scale-95 transition-transform"
            >
              <ArrowLeftRight className="w-6 h-6 stroke-[2.2]" />
            </button>
          </div>

          {/* 3. Activity */}
          <button
            onClick={() => onTabChange("ACTIVITY")}
            type="button"
            className={`flex-1 py-2 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all cursor-pointer ${
              activeTab === "ACTIVITY"
                ? "text-[#00F293]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight">Activity</span>
          </button>

          {/* 4. Settings */}
          <button
            onClick={() => onTabChange("SETTINGS")}
            type="button"
            className={`flex-1 py-2 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all cursor-pointer ${
              activeTab === "SETTINGS"
                ? "text-[#00F293]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight">Settings</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
