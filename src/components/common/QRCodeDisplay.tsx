"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 200,
  className = "",
}) => {
  return (
    <div
      className={`p-4 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-200 ${className}`}
    >
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        includeMargin={false}
        bgColor="#FFFFFF"
        fgColor="#0A0B0E"
      />
    </div>
  );
};
