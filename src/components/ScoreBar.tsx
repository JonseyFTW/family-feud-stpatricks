'use client';

import { Team } from '@/lib/types';
import { useEffect, useState, useRef } from 'react';

interface ScoreBarProps {
  teams: [Team, Team];
  playingTeamIndex: 0 | 1;
  roundScore: number;
  roundPhase: string;
}

export default function ScoreBar({ teams, playingTeamIndex, roundScore, roundPhase }: ScoreBarProps) {
  const [animatingScore, setAnimatingScore] = useState<0 | 1 | null>(null);
  const prevScoresRef = useRef([teams[0].score, teams[1].score]);

  const score0 = teams[0].score;
  const score1 = teams[1].score;

  useEffect(() => {
    const prev = prevScoresRef.current;
    if (score0 !== prev[0]) {
      setAnimatingScore(0);
      setTimeout(() => setAnimatingScore(null), 500);
    }
    if (score1 !== prev[1]) {
      setAnimatingScore(1);
      setTimeout(() => setAnimatingScore(null), 500);
    }
    prevScoresRef.current = [score0, score1];
  }, [score0, score1]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      <div className="flex items-stretch gap-3">
        {/* Team 1 */}
        <div className={`flex-1 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
          playingTeamIndex === 0 && roundPhase === 'play'
            ? 'border-gold shadow-lg shadow-gold/20'
            : 'border-emerald/30'
        }`}>
          <div className="bg-gradient-to-r from-emerald-dark to-emerald p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">☘️</span>
              <span className="font-game text-white text-sm md:text-base uppercase truncate max-w-[120px] md:max-w-[200px] lg:max-w-[300px]">
                {teams[0].name}
              </span>
            </div>
            <div className={`font-display text-3xl md:text-4xl text-gold ${
              animatingScore === 0 ? 'animate-scoreCount' : ''
            }`} style={{ textShadow: '0 0 10px rgba(255,215,0,0.3)' }}>
              {teams[0].score}
            </div>
          </div>
        </div>

        {/* Round Score Center */}
        <div className="flex flex-col items-center justify-center min-w-[80px]">
          {roundPhase !== 'idle' && roundPhase !== 'fastmoney' && (
            <>
              <div className="text-white/50 text-[10px] uppercase tracking-wider font-bold">Round</div>
              <div className="font-display text-2xl text-gold animate-celebrate">
                {roundScore}
              </div>
            </>
          )}
        </div>

        {/* Team 2 */}
        <div className={`flex-1 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
          playingTeamIndex === 1 && roundPhase === 'play'
            ? 'border-gold shadow-lg shadow-gold/20'
            : 'border-emerald/30'
        }`}>
          <div className="bg-gradient-to-r from-emerald to-emerald-dark p-3 flex items-center justify-between">
            <div className={`font-display text-3xl md:text-4xl text-gold ${
              animatingScore === 1 ? 'animate-scoreCount' : ''
            }`} style={{ textShadow: '0 0 10px rgba(255,215,0,0.3)' }}>
              {teams[1].score}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-game text-white text-sm md:text-base uppercase truncate max-w-[120px] md:max-w-[200px] lg:max-w-[300px]">
                {teams[1].name}
              </span>
              <span className="text-xl">🍀</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
