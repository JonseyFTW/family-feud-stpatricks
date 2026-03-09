'use client';

import { useEffect, useState } from 'react';

interface StrikeDisplayProps {
  strikes: number;
  showAnimation: boolean;
}

export default function StrikeDisplay({ strikes, showAnimation }: StrikeDisplayProps) {
  const [shake, setShake] = useState(false);
  const [visibleStrikes, setVisibleStrikes] = useState(0);

  useEffect(() => {
    if (showAnimation && strikes > visibleStrikes) {
      setShake(true);
      setVisibleStrikes(strikes);
      const timer = setTimeout(() => setShake(false), 600);
      return () => clearTimeout(timer);
    }
    if (strikes === 0) {
      setVisibleStrikes(0);
    }
  }, [strikes, showAnimation, visibleStrikes]);

  if (strikes === 0 && !showAnimation) return null;

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 pointer-events-none ${
      shake ? 'animate-shakeX' : ''
    }`}>
      <div className="bg-black/70 rounded-3xl px-16 py-12 flex gap-8">
        {Array.from({ length: strikes }).map((_, i) => (
          <div
            key={i}
            className={`text-red-600 font-display ${
              i === strikes - 1 && showAnimation ? 'strike-x' : ''
            }`}
            style={{ fontSize: '10rem', lineHeight: 1, textShadow: '0 0 30px rgba(255,0,0,0.5)' }}
          >
            X
          </div>
        ))}
      </div>
    </div>
  );
}
