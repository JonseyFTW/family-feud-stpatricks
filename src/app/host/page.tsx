'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameState } from '@/lib/gameState';
import { DEFAULT_QUESTIONS } from '@/lib/questions';
import { Question } from '@/lib/types';
import { soundManager } from '@/lib/sounds';
import { parseCSVQuestions } from '@/lib/csvParser';
import QuestionEditor from '@/components/QuestionEditor';

export default function HostPage() {
  const [state, store] = useGameState();
  const [questions, setQuestions] = useState<Question[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('family-feud-questions');
      if (saved) {
        try { return JSON.parse(saved); } catch { /* ignore */ }
      }
    }
    return DEFAULT_QUESTIONS;
  });
  const [showEditor, setShowEditor] = useState(false);
  const [showFastMoneySetup, setShowFastMoneySetup] = useState(false);
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [csvImportMessage, setCsvImportMessage] = useState<string | null>(null);

  // Fast money input state
  const [fmAnswer, setFmAnswer] = useState('');
  const [fmPoints, setFmPoints] = useState('');
  const [fmCurrentIndex, setFmCurrentIndex] = useState(0);
  const [fmDuplicateMsg, setFmDuplicateMsg] = useState<string | null>(null);

  // Persist questions to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('family-feud-questions', JSON.stringify(questions));
    }
  }, [questions, mounted]);

  useEffect(() => {
    setMounted(true);
    soundManager?.init();
  }, []);

  // Fast money timer
  useEffect(() => {
    if (state.fastMoney.timerRunning && state.fastMoney.timer > 0) {
      timerRef.current = setInterval(() => {
        const newTime = state.fastMoney.timer - 1;
        store.setFastMoneyTimer(newTime);
        if (newTime <= 5) {
          soundManager?.playTimerTick();
        }
        if (newTime <= 0) {
          store.setFastMoneyTimerRunning(false);
          soundManager?.playBuzzer();
        }
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.fastMoney.timerRunning, state.fastMoney.timer, store]);

  const handleNewRound = useCallback((question: Question) => {
    const updated = questions.map(q =>
      q.id === question.id ? { ...q, isUsed: true } : q
    );
    setQuestions(updated);
    store.startNewRound(question);
  }, [questions, store]);

  const handleRevealAnswer = useCallback((index: number) => {
    store.revealAnswer(index);
    soundManager?.playDing();
  }, [store]);

  const handleStrike = useCallback(() => {
    store.addStrike();
    soundManager?.playBuzzer();
  }, [store]);

  const handleStealSuccessful = useCallback(() => {
    store.stealSuccessful();
    soundManager?.playRevealFanfare();
    soundManager?.playApplause();
  }, [store]);

  const handleStealFailed = useCallback(() => {
    store.stealFailed();
    soundManager?.playBuzzer();
  }, [store]);

  const handleRevealRemaining = useCallback(() => {
    store.revealRemaining();
    soundManager?.playRevealFanfare();
  }, [store]);

  const handleEndRound = useCallback(() => {
    store.endRound();
    soundManager?.playApplause();
  }, [store]);

  // Direct submit with explicit answer/points (used by clickable chips)
  const submitFmAnswer = useCallback((answerText: string, pts: number) => {
    if (!answerText.trim()) return;
    const player = state.fastMoney.currentPlayer;

    // Auto-detect duplicate for Player 2
    if (player === 2) {
      const p1Answer = state.fastMoney.player1Answers[fmCurrentIndex]?.answer;
      if (p1Answer && p1Answer.toLowerCase().trim() === answerText.toLowerCase().trim()) {
        setFmDuplicateMsg(`Duplicate! Player 1 already said "${p1Answer}" for this question. Enter a different answer.`);
        return false;
      }
    }

    store.setFastMoneyAnswer(player, fmCurrentIndex, answerText, pts);
    setFmAnswer('');
    setFmPoints('');
    setFmDuplicateMsg(null);
    if (fmCurrentIndex < 4) {
      setFmCurrentIndex(fmCurrentIndex + 1);
    }
    return true;
  }, [fmCurrentIndex, state.fastMoney.currentPlayer, state.fastMoney.player1Answers, store]);

  const handleFmSubmitAnswer = useCallback(() => {
    if (!fmAnswer.trim()) return;

    // Auto-match points from question data
    let points = parseInt(fmPoints) || 0;
    if (!fmPoints && state.fastMoney.questionData[fmCurrentIndex]) {
      const qData = state.fastMoney.questionData[fmCurrentIndex];
      const match = qData.answers.find(
        a => a.text.toLowerCase().trim() === fmAnswer.toLowerCase().trim()
      );
      if (match) {
        points = match.points;
      }
    }

    submitFmAnswer(fmAnswer, points);
  }, [fmAnswer, fmPoints, fmCurrentIndex, state.fastMoney.questionData, submitFmAnswer]);

  const handleFmReveal = useCallback((player: 1 | 2, index: number) => {
    store.revealFastMoneyAnswer(player, index);
    soundManager?.playFastMoneyReveal();
  }, [store]);

  const handleCSVUploadDirect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const imported = parseCSVQuestions(text);
      if (imported.length === 0) {
        setCsvImportMessage('No valid questions found. Format: Question, Answer1, Points1, Answer2, Points2, ...');
      } else {
        setQuestions(prev => [...prev, ...imported]);
        setCsvImportMessage(`Imported ${imported.length} question${imported.length !== 1 ? 's' : ''}`);
      }

      if (csvInputRef.current) csvInputRef.current.value = '';
      setTimeout(() => setCsvImportMessage(null), 4000);
    };
    reader.readAsText(file);
  };

  if (!mounted) return null;

  if (!state.gameStarted) {
    return (
      <div className="min-h-screen shamrock-bg flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="font-display text-3xl text-gold mb-4">Host Panel</h1>
          <p className="text-white/60 mb-4">No game in progress.</p>
          <a href="/" className="host-btn-gold">Go to Lobby</a>
        </div>
      </div>
    );
  }

  const availableQuestions = questions.filter(q => !q.isUsed);
  const currentQ = state.currentQuestion;

  return (
    <div className="min-h-screen bg-emerald-darker text-white">
      {/* Header */}
      <div className="bg-black/30 border-b border-gold/20 p-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="text-xl">☘️</span>
          <span className="font-display text-gold text-sm">HOST PANEL</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-white/40">Rd {state.currentRound}</span>
          <button onClick={() => setShowEditor(true)} className="host-btn-sm bg-white/10 text-white hover:bg-white/20 rounded">
            Edit Qs
          </button>
        </div>
      </div>

      <div className="p-3 space-y-3 max-w-lg mx-auto pb-24">
        {/* Scoreboard */}
        <div className="grid grid-cols-2 gap-2">
          {state.teams.map((team, i) => (
            <div key={i} className={`bg-black/20 rounded-xl p-3 border ${
              state.playingTeamIndex === i && state.roundPhase === 'play'
                ? 'border-gold'
                : 'border-emerald/20'
            }`}>
              <div className="text-xs text-white/50 mb-1">{i === 0 ? '☘️' : '🍀'} {team.name}</div>
              <div className="font-display text-2xl text-gold">{team.score}</div>
              <div className="flex gap-1 mt-2">
                <button
                  onClick={() => store.adjustScore(i as 0 | 1, -10)}
                  className="flex-1 py-1 bg-red-900/50 rounded text-xs font-bold hover:bg-red-800/50 active:scale-95"
                >
                  -10
                </button>
                <button
                  onClick={() => store.adjustScore(i as 0 | 1, 10)}
                  className="flex-1 py-1 bg-emerald/50 rounded text-xs font-bold hover:bg-emerald/70 active:scale-95"
                >
                  +10
                </button>
                <button
                  onClick={() => store.adjustScore(i as 0 | 1, -1)}
                  className="flex-1 py-1 bg-red-900/50 rounded text-xs font-bold hover:bg-red-800/50 active:scale-95"
                >
                  -1
                </button>
                <button
                  onClick={() => store.adjustScore(i as 0 | 1, 1)}
                  className="flex-1 py-1 bg-emerald/50 rounded text-xs font-bold hover:bg-emerald/70 active:scale-95"
                >
                  +1
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Round Status */}
        {state.roundPhase !== 'idle' && state.roundPhase !== 'fastmoney' && (
          <div className="bg-feud-darkblue/50 rounded-xl p-3 border border-blue-400/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-white/50 uppercase tracking-wider">
                Phase: {state.roundPhase}
              </span>
              <span className="text-gold font-display text-lg">
                {state.roundScore} pts
              </span>
            </div>
            {currentQ && (
              <p className="text-white font-medium text-sm">{currentQ.question}</p>
            )}
            {state.strikes > 0 && (
              <div className="flex gap-1 mt-1">
                {Array.from({ length: state.strikes }).map((_, i) => (
                  <span key={i} className="text-red-500 font-bold text-xl">X</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ====== IDLE STATE - Select Question ====== */}
        {state.roundPhase === 'idle' && !state.gameOver && (
          <div className="space-y-3">
            <h3 className="text-gold font-bold text-sm uppercase tracking-wider">Start New Round</h3>
            <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
              {availableQuestions.map((q) => (
                <button
                  key={q.id}
                  onClick={() => handleNewRound(q)}
                  className="w-full text-left p-3 bg-black/20 border border-emerald/20 rounded-lg hover:border-gold/50 hover:bg-black/30 transition-all active:scale-[0.98]"
                >
                  <p className="text-white text-sm font-medium">{q.question}</p>
                  <p className="text-white/40 text-xs mt-0.5">{q.answers.length} answers</p>
                </button>
              ))}
            </div>
            {availableQuestions.length === 0 && (
              <p className="text-white/40 text-center py-4 text-sm">No questions left! Add more or reset used questions.</p>
            )}

            {/* CSV Import Message */}
            {csvImportMessage && (
              <div className={`p-2.5 rounded-lg text-sm font-medium text-center ${
                csvImportMessage.includes('No valid') ? 'bg-red-900/50 text-red-300 border border-red-500/30' : 'bg-emerald/20 text-emerald-light border border-emerald/30'
              }`}>
                {csvImportMessage}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => csvInputRef.current?.click()}
                className="host-btn-blue"
              >
                Upload CSV
              </button>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleCSVUploadDirect}
                className="hidden"
              />
              <button
                onClick={() => setShowFastMoneySetup(true)}
                className="host-btn-gold"
              >
                Fast Money
              </button>
              <button
                onClick={() => store.endGame()}
                className="host-btn-danger"
              >
                End Game
              </button>
            </div>
          </div>
        )}

        {/* ====== FACEOFF - Buzz In ====== */}
        {state.roundPhase === 'faceoff' && (
          <div className="space-y-3">
            <h3 className="text-gold font-bold text-sm uppercase tracking-wider">Face-Off: Who Buzzed In?</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => store.buzzIn(0)}
                className={`host-btn-primary py-5 text-base ${state.faceoffBuzzedTeam === 0 ? 'ring-2 ring-gold' : ''}`}
              >
                {state.teams[0].name}
              </button>
              <button
                onClick={() => store.buzzIn(1)}
                className={`host-btn-primary py-5 text-base ${state.faceoffBuzzedTeam === 1 ? 'ring-2 ring-gold' : ''}`}
              >
                {state.teams[1].name}
              </button>
            </div>

            {/* Reveal answers during faceoff */}
            {currentQ && (
              <div className="space-y-1.5">
                <h4 className="text-white/50 text-xs uppercase">Reveal Answer</h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {currentQ.answers.map((ans, i) => (
                    <button
                      key={i}
                      onClick={() => handleRevealAnswer(i)}
                      disabled={state.revealedAnswers.includes(i)}
                      className={`text-left p-2 rounded-lg text-xs transition-all ${
                        state.revealedAnswers.includes(i)
                          ? 'bg-emerald/30 border border-emerald/50 text-emerald-light'
                          : 'bg-black/20 border border-white/10 text-white hover:border-gold/50 active:scale-95'
                      }`}
                    >
                      <span className="text-gold/70">#{i + 1}</span> {ans.text} ({ans.points})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Wrong Answer */}
            <button onClick={handleStrike} className="host-btn-danger w-full">
              Wrong Answer (Strike)
            </button>

            {/* Assign team to play */}
            {state.faceoffBuzzedTeam !== null && (
              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <h4 className="text-white/50 text-xs uppercase">Assign Control</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => store.teamPlays(0)} className="host-btn-blue">
                    {state.teams[0].name} Plays
                  </button>
                  <button onClick={() => store.teamPlays(1)} className="host-btn-blue">
                    {state.teams[1].name} Plays
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => store.teamPasses(0)} className="host-btn bg-white/10 text-white hover:bg-white/20">
                    {state.teams[0].name} Passes
                  </button>
                  <button onClick={() => store.teamPasses(1)} className="host-btn bg-white/10 text-white hover:bg-white/20">
                    {state.teams[1].name} Passes
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ====== PLAY - Main Round ====== */}
        {state.roundPhase === 'play' && currentQ && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-gold font-bold text-sm uppercase tracking-wider">
                {state.teams[state.playingTeamIndex].name} is Playing
              </h3>
              <span className="text-red-400 font-bold text-sm">
                Strikes: {state.strikes}/3
              </span>
            </div>

            {/* Reveal Answers */}
            <div className="space-y-1.5">
              <h4 className="text-white/50 text-xs uppercase">Reveal Answer</h4>
              <div className="grid grid-cols-2 gap-1.5">
                {currentQ.answers.map((ans, i) => (
                  <button
                    key={i}
                    onClick={() => handleRevealAnswer(i)}
                    disabled={state.revealedAnswers.includes(i)}
                    className={`text-left p-2 rounded-lg text-xs transition-all ${
                      state.revealedAnswers.includes(i)
                        ? 'bg-emerald/30 border border-emerald/50 text-emerald-light'
                        : 'bg-black/20 border border-white/10 text-white hover:border-gold/50 active:scale-95'
                    }`}
                  >
                    <span className="text-gold/70">#{i + 1}</span> {ans.text} ({ans.points})
                  </button>
                ))}
              </div>
            </div>

            {/* Strike */}
            <button onClick={handleStrike} className="host-btn-danger w-full text-lg py-4">
              STRIKE! ({state.strikes}/3)
            </button>

            {/* All revealed = end round */}
            {state.revealedAnswers.length === currentQ.answers.length && (
              <button onClick={handleEndRound} className="host-btn-gold w-full">
                End Round (All Revealed)
              </button>
            )}
          </div>
        )}

        {/* ====== STEAL - Steal Attempt ====== */}
        {state.roundPhase === 'steal' && (
          <div className="space-y-3">
            <div className="bg-red-900/30 rounded-xl p-4 border border-red-500/30 text-center">
              <h3 className="text-red-400 font-display text-xl mb-1">3 STRIKES!</h3>
              <p className="text-white text-sm">
                {state.teams[state.controllingTeamIndex].name} can steal for {state.roundScore} pts
              </p>
            </div>

            {/* Show answers so host can reveal correct steal answer */}
            {currentQ && (
              <div className="space-y-1.5">
                <h4 className="text-white/50 text-xs uppercase">Reveal Answer (if steal is correct)</h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {currentQ.answers.map((ans, i) => (
                    <button
                      key={i}
                      onClick={() => handleRevealAnswer(i)}
                      disabled={state.revealedAnswers.includes(i)}
                      className={`text-left p-2 rounded-lg text-xs transition-all ${
                        state.revealedAnswers.includes(i)
                          ? 'bg-emerald/30 border border-emerald/50 text-emerald-light'
                          : 'bg-black/20 border border-white/10 text-white hover:border-gold/50 active:scale-95'
                      }`}
                    >
                      <span className="text-gold/70">#{i + 1}</span> {ans.text} ({ans.points})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleStealSuccessful} className="host-btn-gold py-5 text-base">
                Steal Successful!
              </button>
              <button onClick={handleStealFailed} className="host-btn-danger py-5 text-base">
                Steal Failed!
              </button>
            </div>
          </div>
        )}

        {/* ====== REVEAL - Show Remaining ====== */}
        {state.roundPhase === 'reveal' && (
          <div className="space-y-3">
            <button onClick={handleRevealRemaining} className="host-btn-blue w-full py-4 text-base">
              Reveal Remaining Answers
            </button>
            <button onClick={() => {
              store.setCelebration(false);
              store.endRound();
            }} className="host-btn-gold w-full">
              Next Round
            </button>
          </div>
        )}

        {/* ====== ROUND END ====== */}
        {state.roundPhase === 'roundEnd' && (
          <div className="text-center py-4">
            <p className="text-gold font-display text-lg">Round Complete!</p>
          </div>
        )}

        {/* ====== FAST MONEY ====== */}
        {state.roundPhase === 'fastmoney' && (
          <div className="space-y-3">
            <h3 className="text-gold font-bold text-sm uppercase tracking-wider">
              Fast Money — Player {state.fastMoney.currentPlayer}
            </h3>

            {/* Timer Controls */}
            <div className="flex items-center gap-3 bg-black/20 rounded-xl p-3">
              <span className={`font-display text-3xl ${
                state.fastMoney.timer <= 5 ? 'text-red-500' : 'text-gold'
              }`}>
                {state.fastMoney.timer}s
              </span>
              <div className="flex-1 flex gap-2">
                {!state.fastMoney.timerRunning ? (
                  <button
                    onClick={() => store.setFastMoneyTimerRunning(true)}
                    className="host-btn-primary flex-1"
                  >
                    Start Timer
                  </button>
                ) : (
                  <button
                    onClick={() => store.setFastMoneyTimerRunning(false)}
                    className="host-btn-danger flex-1"
                  >
                    Stop Timer
                  </button>
                )}
                <button
                  onClick={() => {
                    store.setFastMoneyTimerRunning(false);
                    store.setFastMoneyTimer(
                      state.fastMoney.currentPlayer === 1
                        ? (state.fastMoney.p1Timer || 20)
                        : (state.fastMoney.p2Timer || 25)
                    );
                  }}
                  className="host-btn bg-white/10 text-white hover:bg-white/20"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Answer Input */}
            <div className="bg-black/20 rounded-xl p-3 space-y-2">
              <div className="text-xs text-white/50">
                Q{fmCurrentIndex + 1}: {state.fastMoney.questions[fmCurrentIndex]}
              </div>

              {/* Duplicate warning */}
              {fmDuplicateMsg && (
                <div className="p-2 rounded-lg text-xs font-medium text-center bg-red-900/50 text-red-300 border border-red-500/30">
                  {fmDuplicateMsg}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={fmAnswer}
                  onChange={(e) => {
                    setFmAnswer(e.target.value);
                    setFmDuplicateMsg(null);
                    // Auto-match points from question data as they type
                    if (state.fastMoney.questionData[fmCurrentIndex] && e.target.value.trim()) {
                      const qData = state.fastMoney.questionData[fmCurrentIndex];
                      const match = qData.answers.find(
                        a => a.text.toLowerCase().trim() === e.target.value.toLowerCase().trim()
                      );
                      if (match) {
                        setFmPoints(String(match.points));
                      } else {
                        setFmPoints('');
                      }
                    }
                  }}
                  placeholder="Answer..."
                  className="flex-1 px-3 py-2 bg-black/30 border border-emerald/50 rounded-lg text-white text-sm focus:outline-none focus:border-gold"
                  onKeyDown={(e) => e.key === 'Enter' && handleFmSubmitAnswer()}
                />
                <input
                  type="number"
                  value={fmPoints}
                  onChange={(e) => setFmPoints(e.target.value)}
                  placeholder="Pts"
                  className="w-16 px-2 py-2 bg-black/30 border border-emerald/50 rounded-lg text-gold text-sm text-center focus:outline-none focus:border-gold"
                  onKeyDown={(e) => e.key === 'Enter' && handleFmSubmitAnswer()}
                />
                <button onClick={handleFmSubmitAnswer} className="host-btn-primary">
                  Set
                </button>
              </div>

              {/* Clickable answer chips from question data */}
              {state.fastMoney.questionData[fmCurrentIndex] && (
                <div className="flex flex-wrap gap-1">
                  {state.fastMoney.questionData[fmCurrentIndex].answers.map((a, ai) => {
                    const currentPlayerAnswers = state.fastMoney.currentPlayer === 1
                      ? state.fastMoney.player1Answers
                      : state.fastMoney.player2Answers;
                    const alreadyUsed = currentPlayerAnswers.some(
                      pa => pa.answer && pa.answer.toLowerCase().trim() === a.text.toLowerCase().trim()
                    );
                    return (
                      <button
                        key={ai}
                        disabled={alreadyUsed}
                        onClick={() => submitFmAnswer(a.text, a.points)}
                        className={`px-2 py-1 rounded-full text-[10px] font-medium transition-all ${
                          alreadyUsed
                            ? 'bg-white/5 text-white/20 cursor-not-allowed line-through'
                            : 'bg-white/10 text-white/70 hover:bg-gold/30 hover:text-white active:scale-95'
                        }`}
                      >
                        {a.text} ({a.points})
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Question Quick Select */}
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map(i => (
                  <button
                    key={i}
                    onClick={() => { setFmCurrentIndex(i); setFmDuplicateMsg(null); }}
                    className={`flex-1 py-1 rounded text-xs font-bold transition-all ${
                      fmCurrentIndex === i ? 'bg-gold text-emerald-darker' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    Q{i + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Answers */}
            <div className="bg-black/20 rounded-xl p-3 space-y-1">
              <h4 className="text-xs text-white/50 uppercase">
                Player {state.fastMoney.currentPlayer} Answers
              </h4>
              {(state.fastMoney.currentPlayer === 1 ? state.fastMoney.player1Answers : state.fastMoney.player2Answers).map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-gold/50 w-6">#{i + 1}</span>
                  <span className={`flex-1 ${a.answer ? 'text-white' : 'text-white/20'}`}>
                    {a.answer || '(empty)'}
                  </span>
                  <span className="text-gold w-8 text-right">{a.points || '-'}</span>
                  <button
                    onClick={() => handleFmReveal(state.fastMoney.currentPlayer, i)}
                    disabled={a.revealed || !a.answer}
                    className={`text-xs px-2 py-0.5 rounded ${
                      a.revealed ? 'bg-emerald/30 text-emerald-light' : 'bg-blue-600 text-white hover:bg-blue-500'
                    }`}
                  >
                    {a.revealed ? 'Done' : 'Reveal'}
                  </button>
                  {a.duplicate && (
                    <span className="text-xs px-2 py-0.5 rounded bg-red-900/50 text-red-300">
                      DUP
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="bg-feud-darkblue/50 rounded-xl p-3 text-center">
              <div className="flex justify-around">
                <div>
                  <div className="text-xs text-white/50">P1 Total</div>
                  <div className="font-display text-xl text-gold">{state.fastMoney.player1Total}</div>
                </div>
                <div>
                  <div className="text-xs text-white/50">Combined</div>
                  <div className={`font-display text-2xl ${
                    state.fastMoney.player1Total + state.fastMoney.player2Total >= 200
                      ? 'text-gold animate-celebrate'
                      : 'text-white'
                  }`}>
                    {state.fastMoney.player1Total + state.fastMoney.player2Total}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/50">P2 Total</div>
                  <div className="font-display text-xl text-gold">{state.fastMoney.player2Total}</div>
                </div>
              </div>
            </div>

            {/* Player Switch / End */}
            <div className="grid grid-cols-2 gap-2">
              {state.fastMoney.currentPlayer === 1 ? (
                <button
                  onClick={() => {
                    store.switchToPlayer2();
                    setFmCurrentIndex(0);
                    setFmAnswer('');
                    setFmPoints('');
                  }}
                  className="host-btn-blue"
                >
                  Switch to Player 2
                </button>
              ) : (
                <button
                  onClick={() => store.startRevealingPlayer2()}
                  className="host-btn-blue"
                >
                  Reveal P2 Answers
                </button>
              )}
              <button
                onClick={() => {
                  store.endFastMoney();
                  const total = state.fastMoney.player1Total + state.fastMoney.player2Total;
                  if (total >= 200) {
                    soundManager?.playCelebration();
                  } else {
                    soundManager?.playBuzzer();
                  }
                }}
                className="host-btn-gold"
              >
                End Fast Money
              </button>
            </div>

            <button
              onClick={() => {
                store.setCelebration(false);
                store.endRound();
              }}
              className="host-btn bg-white/10 text-white hover:bg-white/20 w-full"
            >
              Back to Main Game
            </button>
          </div>
        )}

        {/* ====== GAME OVER ====== */}
        {state.gameOver && (
          <div className="text-center py-6 space-y-4">
            <h2 className="font-display text-3xl text-gold">GAME OVER!</h2>
            <p className="text-white text-xl">{state.winner} Wins!</p>
            <div className="flex justify-center gap-4">
              <div className="text-center">
                <div className="text-white/50 text-sm">{state.teams[0].name}</div>
                <div className="font-display text-2xl text-gold">{state.teams[0].score}</div>
              </div>
              <div className="text-white/30 text-2xl">vs</div>
              <div className="text-center">
                <div className="text-white/50 text-sm">{state.teams[1].name}</div>
                <div className="font-display text-2xl text-gold">{state.teams[1].score}</div>
              </div>
            </div>
            <button onClick={() => {
              store.resetGame();
              window.location.href = '/';
            }} className="host-btn-gold">
              New Game
            </button>
          </div>
        )}

        {/* Quick Actions Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-black/90 border-t border-gold/20 p-2 flex gap-2 justify-center">
          <button
            onClick={() => {
              soundManager?.playDing();
            }}
            className="host-btn-sm bg-emerald/50 text-white rounded-lg"
          >
            Ding
          </button>
          <button
            onClick={() => {
              soundManager?.playBuzzer();
            }}
            className="host-btn-sm bg-red-700/50 text-white rounded-lg"
          >
            Buzzer
          </button>
          <button
            onClick={() => {
              soundManager?.playApplause();
            }}
            className="host-btn-sm bg-blue-700/50 text-white rounded-lg"
          >
            Applause
          </button>
          <button
            onClick={() => {
              soundManager?.playThemeIntro();
            }}
            className="host-btn-sm bg-gold/50 text-emerald-darker rounded-lg"
          >
            Intro
          </button>
          <button
            onClick={() => {
              store.setCelebration(!state.celebration);
              if (!state.celebration) soundManager?.playCelebration();
            }}
            className="host-btn-sm bg-gold/50 text-emerald-darker rounded-lg"
          >
            Confetti
          </button>
        </div>
      </div>

      {/* Fast Money Setup Modal */}
      {showFastMoneySetup && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-emerald-darker border-2 border-gold/30 rounded-2xl w-full max-w-lg p-6 space-y-4 my-4">
            <h3 className="font-display text-xl text-gold">Fast Money Setup</h3>
            <p className="text-white/60 text-sm">Select 5 questions from your question bank. Answers and points will auto-populate when players respond.</p>
            {state.fastMoney.questions.map((q, i) => (
              <div key={i} className="space-y-1">
                <label className="text-gold text-xs font-bold">Q{i + 1}</label>
                <select
                  value={q}
                  onChange={(e) => {
                    const newQs = [...state.fastMoney.questions];
                    newQs[i] = e.target.value;
                    const selectedQ = questions.find(question => question.question === e.target.value);
                    const newQData = [...(state.fastMoney.questionData || [])];
                    // Ensure array is long enough
                    while (newQData.length <= i) newQData.push(null as unknown as Question);
                    newQData[i] = selectedQ || null as unknown as Question;
                    store.updateFastMoneyQuestions(newQs, newQData);
                  }}
                  className="w-full px-3 py-2 bg-black/30 border border-emerald/50 rounded-lg text-white text-sm focus:outline-none focus:border-gold"
                >
                  <option value={q}>{q}</option>
                  {questions
                    .filter(question => !state.fastMoney.questions.includes(question.question) || question.question === q)
                    .map(question => (
                      <option key={question.id} value={question.question}>
                        {question.question} ({question.answers.length} answers)
                      </option>
                    ))
                  }
                </select>
              </div>
            ))}
            {/* Custom Timer */}
            <div className="space-y-1">
              <label className="text-gold text-xs font-bold">Timer (seconds)</label>
              <div className="flex gap-2 items-center">
                <span className="text-white/50 text-xs">P1:</span>
                <input
                  type="number"
                  defaultValue={20}
                  min={5}
                  max={120}
                  id="fm-timer-p1"
                  className="w-20 px-3 py-2 bg-black/30 border border-emerald/50 rounded-lg text-gold text-sm text-center focus:outline-none focus:border-gold"
                />
                <span className="text-white/50 text-xs ml-2">P2:</span>
                <input
                  type="number"
                  defaultValue={25}
                  min={5}
                  max={120}
                  id="fm-timer-p2"
                  className="w-20 px-3 py-2 bg-black/30 border border-emerald/50 rounded-lg text-gold text-sm text-center focus:outline-none focus:border-gold"
                />
                <span className="text-white/30 text-xs">sec</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  // Auto-link all question strings to question bank data
                  const currentQs = state.fastMoney.questions;
                  const autoLinkedData: (Question | null)[] = currentQs.map((qText, i) => {
                    // If already linked from dropdown selection, keep it
                    if (state.fastMoney.questionData?.[i]) return state.fastMoney.questionData[i];
                    // Try exact match first
                    const exact = questions.find(q => q.question === qText);
                    if (exact) return exact;
                    // Try case-insensitive match
                    const lower = qText.toLowerCase().trim();
                    return questions.find(q => q.question.toLowerCase().trim() === lower) || null;
                  });
                  store.updateFastMoneyQuestions(currentQs, autoLinkedData as Question[]);

                  // Read custom timer values
                  const p1Input = document.getElementById('fm-timer-p1') as HTMLInputElement;
                  const p2Input = document.getElementById('fm-timer-p2') as HTMLInputElement;
                  const p1Time = parseInt(p1Input?.value) || 20;
                  const p2Time = parseInt(p2Input?.value) || 25;

                  store.startFastMoney(p1Time, p2Time);
                  setShowFastMoneySetup(false);
                  setFmCurrentIndex(0);
                  setFmDuplicateMsg(null);
                }}
                className="host-btn-gold flex-1"
              >
                Start Fast Money
              </button>
              <button
                onClick={() => setShowFastMoneySetup(false)}
                className="host-btn bg-white/10 text-white hover:bg-white/20"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Editor Modal */}
      {showEditor && (
        <QuestionEditor
          questions={questions}
          onSave={setQuestions}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
}
