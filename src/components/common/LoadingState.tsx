"use client";

import React from "react";

export const TokenSkeleton: React.FC = () => (
  <div className="flex items-center justify-between p-4 rounded-2xl bg-[#12141A] border border-[#1E2230] animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-slate-800" />
      <div className="space-y-2">
        <div className="w-20 h-4 rounded bg-slate-800" />
        <div className="w-14 h-3 rounded bg-slate-800/60" />
      </div>
    </div>
    <div className="text-right space-y-2">
      <div className="w-16 h-4 rounded bg-slate-800 ml-auto" />
      <div className="w-12 h-3 rounded bg-slate-800/60 ml-auto" />
    </div>
  </div>
);

export const NFTSkeleton: React.FC = () => (
  <div className="rounded-2xl overflow-hidden bg-[#12141A] border border-[#1E2230] animate-pulse">
    <div className="w-full aspect-square bg-slate-800" />
    <div className="p-3.5 space-y-2">
      <div className="w-24 h-4 rounded bg-slate-800" />
      <div className="w-16 h-3 rounded bg-slate-800/60" />
    </div>
  </div>
);

export const TransactionSkeleton: React.FC = () => (
  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#12141A] border border-[#1E2230] animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-slate-800" />
      <div className="space-y-1.5">
        <div className="w-24 h-3.5 rounded bg-slate-800" />
        <div className="w-16 h-2.5 rounded bg-slate-800/60" />
      </div>
    </div>
    <div className="text-right space-y-1.5">
      <div className="w-16 h-3.5 rounded bg-slate-800 ml-auto" />
      <div className="w-12 h-2.5 rounded bg-slate-800/60 ml-auto" />
    </div>
  </div>
);
