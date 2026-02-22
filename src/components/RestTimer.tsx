"use client";

import { useState, useEffect, useCallback } from "react";

type Props = {
  seconds: number;
  onComplete: () => void;
  large?: boolean;
};

export default function RestTimer({ seconds, onComplete, large = false }: Props) {
  const [timeLeft, setTimeLeft] = useState(seconds);

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleComplete();
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, handleComplete]);

  const progress = timeLeft / seconds;
  const svgSize = large ? 220 : 140;
  const radius = large ? 90 : 54;
  const strokeW = large ? 14 : 10;
  const center = svgSize / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width={svgSize} height={svgSize} className="-rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={strokeW}
            fill="none"
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="url(#timerGrad)"
            strokeWidth={strokeW}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-linear"
          />
          <defs>
            <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3882ff" />
              <stop offset="100%" stopColor="#5ca4ff" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${large ? "text-6xl" : "text-4xl"} font-bold text-white`}>{timeLeft}</span>
        </div>
      </div>
      <p className="text-sm text-slate-400">Pause</p>
      <button
        type="button"
        onClick={handleComplete}
        className="text-sm text-brand-400 hover:text-brand-300 transition-colors"
      >
        Überspringen →
      </button>
    </div>
  );
}
