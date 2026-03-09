'use client';

import { useEffect, useState } from 'react';
import { useGameState } from '@/lib/gameState';
import { soundManager } from '@/lib/sounds';
import AnswerBoard from '@/components/AnswerBoard';
import ScoreBar from '@/components/ScoreBar';
import StrikeDisplay from '@/components/StrikeDisplay';
import FastMoneyBoard from '@/components/FastMoneyBoard';
import Celebration from '@/components/Celebration';

export default function BoardPage() {
  const [state] = useGameState();
  const [mounted, setMounted] = useState(false);
  const [prevRevealedCount, setPrevRevealedCount] = useState(0);
  const [prevStrikes, setPrevStrikes] = useState(0);

  useEffect(() => {
    setMounted(true);
    soundManager?.init();
  }, []);

  // Sound effects on state changes
  useEffect(() => {
    if (!mounted) return;

    // New answer revealed
    if (state.revealedAnswers.length > prevRevealedCount) {
      soundManager?.playDing();
    }
    setPrevRevealedCount(state.revealedAnswers.length);
  }, [state.revealedAnswers.length, prevRevealedCount, mounted]);

  useEffect(() => {
    if (!mounted) return;

    // Strike added
    if (state.strikes > prevStrikes && state.strikes > 0) {
      soundManager?.playBuzzer();
    }
    setPrevStrikes(state.strikes);
  }, [state.strikes, prevStrikes, mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (state.celebration) {
      soundManager?.playCelebration();
    }
  }, [state.celebration, mounted]);

  if (!mounted) return null;

  // Title Screen
  if (state.titleScreen || !state.gameStarted) {
    return (
      <div className="board-container shamrock-bg flex items-center justify-center" onClick={() => soundManager?.init()}>
        <div className="text-center">
          <div className="mb-6">
            <span className="text-8xl block mb-4">☘️</span>
          </div>
          <h1
            className="font-display text-6xl md:text-8xl text-gold mb-4"
            style={{ textShadow: '0 0 30px rgba(255,215,0,0.5), 0 6px 12px rgba(0,0,0,0.5)' }}
          >
            FAMILY FEUD
          </h1>
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-1 w-24 bg-gradient-to-r from-transparent to-gold rounded-full" />
            <h2 className="font-game text-2xl md:text-4xl text-emerald-light" style={{ textShadow: '0 0 15px rgba(0,200,83,0.4)' }}>
              St. Patrick&apos;s Day Edition
            </h2>
            <div className="h-1 w-24 bg-gradient-to-l from-transparent to-gold rounded-full" />
          </div>
          <div className="flex items-center justify-center gap-8 text-4xl opacity-60">
            <span>🌈</span>
            <span>🍀</span>
            <span>🪙</span>
            <span>🎩</span>
            <span>🌈</span>
          </div>
          <p className="text-white/30 text-sm mt-8">Waiting for host to start the game...</p>
        </div>
      </div>
    );
  }

  // Game Over Screen
  if (state.gameOver) {
    return (
      <div className="board-container shamrock-bg flex items-center justify-center relative">
        <Celebration active={state.celebration} />
        <div className="text-center z-10">
          <h1 className="font-display text-5xl md:text-7xl text-gold mb-6 gold-shimmer" style={{ WebkitTextFillColor: 'initial', textShadow: '0 0 30px rgba(255,215,0,0.5)' }}>
            GAME OVER!
          </h1>
          <div className="mb-8">
            <p className="font-game text-3xl md:text-5xl text-white mb-4">
              {state.winner} Wins!
            </p>
          </div>
          <div className="flex items-center justify-center gap-12">
            <div className="text-center">
              <div className="font-game text-xl text-emerald-light mb-2">{state.teams[0].name}</div>
              <div className="font-display text-5xl text-gold">{state.teams[0].score}</div>
            </div>
            <div className="text-white/30 font-display text-3xl">VS</div>
            <div className="text-center">
              <div className="font-game text-xl text-emerald-light mb-2">{state.teams[1].name}</div>
              <div className="font-display text-5xl text-gold">{state.teams[1].score}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="board-container board-gradient flex flex-col relative" onClick={() => soundManager?.init()}>
      <Celebration active={state.celebration} />

      {/* Strike Display Overlay */}
      {state.showStrikeAnimation && (
        <StrikeDisplay strikes={state.strikes} showAnimation={state.showStrikeAnimation} />
      )}

      {/* Top Bar - Scores */}
      <div className="py-3">
        <ScoreBar
          teams={state.teams}
          playingTeamIndex={state.playingTeamIndex}
          roundScore={state.roundScore}
          roundPhase={state.roundPhase}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center px-4 pb-4">
        {/* Idle State */}
        {state.roundPhase === 'idle' && (
          <div className="text-center">
            <span className="text-6xl block mb-4">☘️</span>
            <h2 className="font-display text-3xl text-gold/50">
              Round {state.currentRound > 0 ? state.currentRound : ''}
            </h2>
            <p className="text-white/30 mt-2 font-game text-lg">Waiting for next round...</p>
          </div>
        )}

        {/* Round End */}
        {state.roundPhase === 'roundEnd' && (
          <div className="text-center">
            <h2 className="font-display text-4xl text-gold animate-celebrate">
              Round Complete!
            </h2>
            <div className="flex items-center justify-center gap-12 mt-6">
              <div className="text-center">
                <div className="font-game text-lg text-emerald-light">{state.teams[0].name}</div>
                <div className="font-display text-4xl text-gold">{state.teams[0].score}</div>
              </div>
              <div className="text-white/20 text-xl">vs</div>
              <div className="text-center">
                <div className="font-game text-lg text-emerald-light">{state.teams[1].name}</div>
                <div className="font-display text-4xl text-gold">{state.teams[1].score}</div>
              </div>
            </div>
          </div>
        )}

        {/* Face-off / Play / Steal / Reveal - Show Answer Board */}
        {state.currentQuestion && ['faceoff', 'play', 'steal', 'reveal'].includes(state.roundPhase) && (
          <div className="w-full">
            {/* Phase indicator */}
            {state.roundPhase === 'faceoff' && (
              <div className="text-center mb-3">
                <span className="bg-gold/20 text-gold font-game text-sm px-4 py-1 rounded-full border border-gold/30">
                  FACE-OFF
                </span>
              </div>
            )}
            {state.roundPhase === 'play' && (
              <div className="text-center mb-3">
                <span className="bg-emerald/20 text-emerald-light font-game text-sm px-4 py-1 rounded-full border border-emerald/30">
                  {state.teams[state.playingTeamIndex].name} is Playing
                </span>
                {state.strikes > 0 && (
                  <div className="flex items-center justify-center gap-2 mt-1">
                    {Array.from({ length: state.strikes }).map((_, i) => (
                      <span key={i} className="text-red-500 font-display text-2xl">X</span>
                    ))}
                  </div>
                )}
              </div>
            )}
            {state.roundPhase === 'steal' && (
              <div className="text-center mb-3">
                <span className="bg-red-900/50 text-red-400 font-game text-sm px-4 py-1 rounded-full border border-red-500/30 animate-pulse">
                  STEAL ATTEMPT — {state.teams[state.controllingTeamIndex].name}
                </span>
              </div>
            )}

            <AnswerBoard
              question={state.currentQuestion}
              revealedAnswers={state.revealedAnswers}
              lastRevealedAnswer={state.lastRevealedAnswer}
            />
          </div>
        )}

        {/* Fast Money */}
        {state.roundPhase === 'fastmoney' && (
          <FastMoneyBoard fastMoney={state.fastMoney} />
        )}
      </div>

      {/* Bottom decorative bar */}
      <div className="h-2 bg-gradient-to-r from-emerald-dark via-gold to-emerald-dark" />
    </div>
  );
}
