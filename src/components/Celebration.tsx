'use client';

import { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  left: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
  shape: 'square' | 'circle' | 'shamrock';
}

const COLORS = ['#FFD700', '#009A44', '#006B3C', '#00C853', '#FFF4B0', '#FF6B35', '#FFFFFF'];

export default function Celebration({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (!active) {
      setPieces([]);
      return;
    }

    const newPieces: ConfettiPiece[] = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 3,
      size: 6 + Math.random() * 12,
      shape: (['square', 'circle', 'shamrock'] as const)[Math.floor(Math.random() * 3)],
    }));
    setPieces(newPieces);

    // Clean up after animation
    const timer = setTimeout(() => {
      setPieces([]);
    }, 6000);

    return () => clearTimeout(timer);
  }, [active]);

  if (!active || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.shape !== 'shamrock' ? piece.color : 'transparent',
            borderRadius: piece.shape === 'circle' ? '50%' : '2px',
            width: `${piece.size}px`,
            height: piece.shape === 'shamrock' ? 'auto' : `${piece.size}px`,
            fontSize: piece.shape === 'shamrock' ? `${piece.size * 1.5}px` : undefined,
            '--delay': `${piece.delay}s`,
            '--duration': `${piece.duration}s`,
          } as React.CSSProperties}
        >
          {piece.shape === 'shamrock' && '☘️'}
        </div>
      ))}

      {/* Golden flash overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-gold/10 via-transparent to-transparent animate-pulse" />
    </div>
  );
}
