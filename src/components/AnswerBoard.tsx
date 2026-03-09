'use client';

import { Question } from '@/lib/types';
import { useEffect, useState } from 'react';

interface AnswerBoardProps {
  question: Question;
  revealedAnswers: number[];
  lastRevealedAnswer: number | null;
}

function AnswerSlot({
  index,
  answer,
  points,
  isRevealed,
  isJustRevealed,
  totalSlots,
}: {
  index: number;
  answer: string;
  points: number;
  isRevealed: boolean;
  isJustRevealed: boolean;
  totalSlots: number;
}) {
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isJustRevealed) {
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isJustRevealed]);

  return (
    <div className={`flip-card w-full ${totalSlots <= 6 ? 'h-[4.5rem]' : 'h-[3.8rem]'}`}>
      <div className={`flip-card-inner relative w-full h-full ${isRevealed ? 'flipped' : ''}`}>
        {/* Front - Hidden */}
        <div className="flip-card-front absolute inset-0 flex items-center rounded-lg overflow-hidden border-2 border-blue-400/30 bg-gradient-to-r from-feud-blue to-feud-boardlight shadow-lg">
          <div className="w-12 h-full flex items-center justify-center bg-gold/90 text-feud-darkblue font-display text-xl">
            {index + 1}
          </div>
          <div className="flex-1 h-full flex items-center justify-center">
            <div className="w-full h-full flex items-center justify-center bg-feud-board/80">
              <div className="text-blue-300/30 font-display text-2xl tracking-widest">???</div>
            </div>
          </div>
        </div>

        {/* Back - Revealed */}
        <div className={`flip-card-back absolute inset-0 flex items-center rounded-lg overflow-hidden border-2 shadow-lg ${
          animating ? 'border-gold animate-glow' : 'border-emerald/50'
        } bg-gradient-to-r from-emerald-dark to-emerald`}>
          <div className="w-12 h-full flex items-center justify-center bg-gold text-emerald-darker font-display text-xl">
            {index + 1}
          </div>
          <div className="flex-1 px-4 flex items-center justify-between">
            <span className={`font-game text-white uppercase tracking-wide ${
              totalSlots <= 6 ? 'text-lg md:text-xl' : 'text-sm md:text-lg'
            }`} style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              {answer}
            </span>
            <span className={`font-display text-gold ml-2 ${
              totalSlots <= 6 ? 'text-2xl' : 'text-xl'
            }`}>
              {points}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnswerBoard({ question, revealedAnswers, lastRevealedAnswer }: AnswerBoardProps) {
  const totalSlots = Math.max(question.answers.length, 5);
  const slots = Array.from({ length: totalSlots }, (_, i) => ({
    answer: question.answers[i]?.text || '',
    points: question.answers[i]?.points || 0,
    exists: i < question.answers.length,
  }));

  // Split into two columns for display
  const midpoint = Math.ceil(totalSlots / 2);
  const leftColumn = slots.slice(0, midpoint);
  const rightColumn = slots.slice(midpoint);

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Question */}
      <div className="text-center mb-6">
        <div className="inline-block bg-feud-darkblue/90 border-2 border-gold/50 rounded-xl px-8 py-3 shadow-lg">
          <h2 className="font-game text-gold text-xl md:text-2xl lg:text-3xl" style={{ textShadow: '0 0 10px rgba(255,215,0,0.3)' }}>
            {question.question}
          </h2>
        </div>
      </div>

      {/* Answer Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-4">
        {/* Left Column */}
        <div className="space-y-2">
          {leftColumn.map((slot, i) => (
            slot.exists ? (
              <AnswerSlot
                key={i}
                index={i}
                answer={slot.answer}
                points={slot.points}
                isRevealed={revealedAnswers.includes(i)}
                isJustRevealed={lastRevealedAnswer === i}
                totalSlots={totalSlots}
              />
            ) : (
              <div key={i} className={`${totalSlots <= 6 ? 'h-[4.5rem]' : 'h-[3.8rem]'} rounded-lg border-2 border-blue-900/30 bg-feud-darkblue/30`} />
            )
          ))}
        </div>

        {/* Right Column */}
        <div className="space-y-2">
          {rightColumn.map((slot, i) => {
            const actualIndex = midpoint + i;
            return slot.exists ? (
              <AnswerSlot
                key={actualIndex}
                index={actualIndex}
                answer={slot.answer}
                points={slot.points}
                isRevealed={revealedAnswers.includes(actualIndex)}
                isJustRevealed={lastRevealedAnswer === actualIndex}
                totalSlots={totalSlots}
              />
            ) : (
              <div key={actualIndex} className={`${totalSlots <= 6 ? 'h-[4.5rem]' : 'h-[3.8rem]'} rounded-lg border-2 border-blue-900/30 bg-feud-darkblue/30`} />
            );
          })}
        </div>
      </div>
    </div>
  );
}
