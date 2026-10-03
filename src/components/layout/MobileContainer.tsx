"use client";

import React from "react";

interface MobileContainerProps {
  children: React.ReactNode;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#06070A] flex justify-center selection:bg-[#00F293]/20 selection:text-[#00F293]">
      <main className="w-full max-w-[430px] min-h-screen bg-[#0A0B0E] border-x border-[#1A1D27]/40 flex flex-col relative pb-24 shadow-2xl">
        {children}
      </main>
    </div>
  );
};
