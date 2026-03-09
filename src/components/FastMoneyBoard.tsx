'use client';

import { FastMoneyState } from '@/lib/types';
import { useEffect, useState } from 'react';

interface FastMoneyBoardProps {
  fastMoney: FastMoneyState;
}

function AnswerRow({
  index,
  question,
  player1Answer,
  player2Answer,
  showPlayer2,
}: {
  index: number;
  question: string;
  player1Answer: { answer: string; points: number; revealed: boolean; duplicate?: boolean };
  player2Answer: { answer: string; points: number; revealed: boolean; duplicate?: boolean };
  showPlayer2: boolean;
}) {
  const [p1Animating, setP1Animating] = useState(false);
  const [p2Animating, setP2Animating] = useState(false);

  useEffect(() => {
    if (player1Answer.revealed) {
      setP1Animating(true);
      const t = setTimeout(() => setP1Animating(false), 600);
      return () => clearTimeout(t);
    }
  }, [player1Answer.revealed]);

  useEffect(() => {
    if (player2Answer.revealed) {
      setP2Animating(true);
      const t = setTimeout(() => setP2Animating(false), 600);
      return () => clearTimeout(t);
    }
  }, [player2Answer.revealed]);

  return (
    <div className="grid grid-cols-[1fr_2fr_1fr] gap-2 items-center">
      {/* Player 1 Answer */}
      <div className={`flex items-center gap-2 justify-end ${p1Animating ? 'animate-fadeInUp' : ''}`}>
        {player1Answer.revealed ? (
          <>
            <span className="font-game text-white text-sm md:text-base uppercase text-right truncate">
              {player1Answer.answer || '—'}
            </span>
            <span className={`font-display text-lg md:text-xl min-w-[40px] text-right ${
              player1Answer.points > 0 ? 'text-gold' : 'text-red-400'
            }`}>
              {player1Answer.points}
            </span>
          </>
        ) : (
          <div className="w-full h-8 bg-feud-blue/50 rounded border border-blue-400/20" />
        )}
      </div>

      {/* Question */}
      <div className="text-center">
        <div className="bg-feud-darkblue/80 rounded-lg px-3 py-1.5 border border-gold/30">
          <span className="text-gold/80 text-xs font-bold">#{index + 1}</span>
          <p className="text-white text-xs md:text-sm font-medium truncate">{question}</p>
        </div>
      </div>

      {/* Player 2 Answer */}
      <div className={`flex items-center gap-2 ${p2Animating ? 'animate-fadeInUp' : ''}`}>
        {showPlayer2 && player2Answer.revealed ? (
          <>
            <span className={`font-display text-lg md:text-xl min-w-[40px] ${
              player2Answer.duplicate ? 'text-red-400' : player2Answer.points > 0 ? 'text-gold' : 'text-red-400'
            }`}>
              {player2Answer.duplicate ? '0' : player2Answer.points}
            </span>
            <span className={`font-game text-sm md:text-base uppercase truncate ${
              player2Answer.duplicate ? 'text-red-400 line-through' : 'text-white'
            }`}>
              {player2Answer.answer || '—'}
            </span>
          </>
        ) : (
          <div className="w-full h-8 bg-feud-blue/50 rounded border border-blue-400/20" />
        )}
      </div>
    </div>
  );
}

export default function FastMoneyBoard({ fastMoney }: FastMoneyBoardProps) {
  const total = fastMoney.player1Total + fastMoney.player2Total;
  const won = total >= 200;

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="font-display text-3xl md:text-4xl text-gold mb-1" style={{ textShadow: '0 0 15px rgba(255,215,0,0.4)' }}>
          FAST MONEY
        </h2>
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <div className="text-white/60 text-xs uppercase tracking-wider">Player 1</div>
            <div className="font-display text-2xl text-gold">{fastMoney.player1Total}</div>
          </div>
          <div className="text-center">
            <div className="text-white/60 text-xs uppercase tracking-wider">Total</div>
            <div className={`font-display text-4xl ${
              won ? 'text-gold animate-celebrate gold-shimmer' : 'text-white'
            }`}>
              {total}
            </div>
            {total > 0 && (
              <div className="text-white/40 text-xs">/ 200</div>
            )}
          </div>
          <div className="text-center">
            <div className="text-white/60 text-xs uppercase tracking-wider">Player 2</div>
            <div className="font-display text-2xl text-gold">{fastMoney.player2Total}</div>
          </div>
        </div>
      </div>

      {/* Timer */}
      {fastMoney.timerRunning && (
        <div className="text-center mb-3">
          <span className={`font-display text-5xl ${
            fastMoney.timer <= 5 ? 'text-red-500 animate-pulse' : 'text-gold'
          }`}>
            {fastMoney.timer}
          </span>
        </div>
      )}

      {/* Player Labels */}
      <div className="grid grid-cols-[1fr_2fr_1fr] gap-2 mb-2 px-2">
        <div className="text-right">
          <span className="text-emerald-light font-bold text-xs uppercase tracking-wider">Player 1</span>
        </div>
        <div />
        <div>
          <span className="text-emerald-light font-bold text-xs uppercase tracking-wider">Player 2</span>
        </div>
      </div>

      {/* Answer Rows */}
      <div className="space-y-2">
        {fastMoney.questions.map((q, i) => (
          <AnswerRow
            key={i}
            index={i}
            question={q}
            player1Answer={fastMoney.player1Answers[i]}
            player2Answer={fastMoney.player2Answers[i]}
            showPlayer2={fastMoney.revealingPlayer2 || fastMoney.currentPlayer === 2}
          />
        ))}
      </div>

      {/* Win/Lose Banner */}
      {(fastMoney.player1Answers.every(a => a.revealed) && fastMoney.player2Answers.every(a => a.revealed)) && (
        <div className={`text-center mt-6 p-4 rounded-xl ${
          won
            ? 'bg-gradient-to-r from-gold-dark via-gold to-gold-light'
            : 'bg-red-900/50 border-2 border-red-500/30'
        }`}>
          <div className={`font-display text-3xl ${won ? 'text-emerald-darker' : 'text-white'}`}>
            {won ? 'WINNER! 200+ POINTS!' : `${total} Points — Better Luck Next Time!`}
          </div>
        </div>
      )}
    </div>
  );
}
