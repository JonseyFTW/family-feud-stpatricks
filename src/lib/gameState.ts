'use client';

import { GameState, INITIAL_GAME_STATE, DEFAULT_FAST_MONEY } from './types';

type Listener = (state: GameState) => void;

const CHANNEL_NAME = 'family-feud-sync';
const STORAGE_KEY = 'family-feud-state';

class GameStore {
  private state: GameState;
  private listeners: Set<Listener> = new Set();
  private channel: BroadcastChannel | null = null;

  constructor() {
    // Try to load from localStorage first
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          this.state = JSON.parse(saved);
        } catch {
          this.state = { ...INITIAL_GAME_STATE };
        }
      } else {
        this.state = { ...INITIAL_GAME_STATE };
      }

      // Set up BroadcastChannel for cross-tab sync
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data.type === 'STATE_UPDATE') {
            this.state = event.data.state;
            this.notify();
          } else if (event.data.type === 'REQUEST_STATE') {
            // Another tab is asking for current state
            this.broadcastState();
          }
        };
      } catch {
        // BroadcastChannel not supported, fall back to storage events
        window.addEventListener('storage', (e) => {
          if (e.key === STORAGE_KEY && e.newValue) {
            try {
              this.state = JSON.parse(e.newValue);
              this.notify();
            } catch { /* ignore */ }
          }
        });
      }
    } else {
      this.state = { ...INITIAL_GAME_STATE };
    }
  }

  getState(): GameState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l(this.state));
  }

  private persist() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    }
  }

  private broadcastState() {
    this.channel?.postMessage({ type: 'STATE_UPDATE', state: this.state });
  }

  private update(partial: Partial<GameState>) {
    this.state = { ...this.state, ...partial };
    this.notify();
    this.persist();
    this.broadcastState();
  }

  requestSync() {
    this.channel?.postMessage({ type: 'REQUEST_STATE' });
  }

  // ---- Game Setup ----

  setupGame(team1Name: string, team2Name: string, hostName: string) {
    this.update({
      ...INITIAL_GAME_STATE,
      teams: [
        { name: team1Name || 'Team Shamrock', score: 0 },
        { name: team2Name || 'Team Leprechaun', score: 0 },
      ],
      hostName,
      gameStarted: true,
      titleScreen: false,
    });
  }

  resetGame() {
    this.update({ ...INITIAL_GAME_STATE });
  }

  // ---- Round Management ----

  startNewRound(question: import('./types').Question) {
    this.update({
      currentQuestion: question,
      revealedAnswers: [],
      strikes: 0,
      roundScore: 0,
      roundPhase: 'faceoff',
      faceoffBuzzedTeam: null,
      showStrikeAnimation: false,
      lastRevealedAnswer: null,
      currentRound: this.state.currentRound + 1,
      celebration: false,
    });
  }

  buzzIn(teamIndex: 0 | 1) {
    this.update({ faceoffBuzzedTeam: teamIndex });
  }

  teamPlays(teamIndex: 0 | 1) {
    this.update({
      playingTeamIndex: teamIndex,
      controllingTeamIndex: teamIndex,
      roundPhase: 'play',
      strikes: 0,
    });
  }

  teamPasses(teamIndex: 0 | 1) {
    const otherTeam = teamIndex === 0 ? 1 : 0;
    this.update({
      playingTeamIndex: otherTeam as 0 | 1,
      controllingTeamIndex: otherTeam as 0 | 1,
      roundPhase: 'play',
      strikes: 0,
    });
  }

  revealAnswer(answerIndex: number) {
    if (!this.state.currentQuestion) return;
    if (this.state.revealedAnswers.includes(answerIndex)) return;

    const answer = this.state.currentQuestion.answers[answerIndex];
    const newRevealed = [...this.state.revealedAnswers, answerIndex];
    const newRoundScore = this.state.roundScore + answer.points;

    this.update({
      revealedAnswers: newRevealed,
      roundScore: newRoundScore,
      lastRevealedAnswer: answerIndex,
      showStrikeAnimation: false,
    });
  }

  addStrike() {
    const newStrikes = this.state.strikes + 1;

    if (newStrikes >= 3) {
      // 3 strikes - switch to steal phase
      const otherTeam = this.state.playingTeamIndex === 0 ? 1 : 0;
      this.update({
        strikes: newStrikes,
        showStrikeAnimation: true,
        roundPhase: 'steal',
        controllingTeamIndex: otherTeam as 0 | 1,
      });
    } else {
      this.update({
        strikes: newStrikes,
        showStrikeAnimation: true,
      });
    }

    // Reset animation flag after delay
    setTimeout(() => {
      this.update({ showStrikeAnimation: false });
    }, 1500);
  }

  stealSuccessful() {
    const stealingTeam = this.state.controllingTeamIndex;
    const newTeams = [...this.state.teams] as [typeof this.state.teams[0], typeof this.state.teams[1]];
    newTeams[stealingTeam] = {
      ...newTeams[stealingTeam],
      score: newTeams[stealingTeam].score + this.state.roundScore,
    };
    this.update({
      teams: newTeams,
      roundPhase: 'reveal',
      celebration: true,
    });
  }

  stealFailed() {
    const originalTeam = this.state.playingTeamIndex;
    const newTeams = [...this.state.teams] as [typeof this.state.teams[0], typeof this.state.teams[1]];
    newTeams[originalTeam] = {
      ...newTeams[originalTeam],
      score: newTeams[originalTeam].score + this.state.roundScore,
    };
    this.update({
      teams: newTeams,
      roundPhase: 'reveal',
    });
  }

  revealRemaining() {
    if (!this.state.currentQuestion) return;
    const allIndices = this.state.currentQuestion.answers.map((_, i) => i);
    this.update({
      revealedAnswers: allIndices,
    });
  }

  awardPointsToTeam(teamIndex: 0 | 1) {
    const newTeams = [...this.state.teams] as [typeof this.state.teams[0], typeof this.state.teams[1]];
    newTeams[teamIndex] = {
      ...newTeams[teamIndex],
      score: newTeams[teamIndex].score + this.state.roundScore,
    };
    this.update({
      teams: newTeams,
      celebration: true,
    });
  }

  endRound() {
    // Check if all answers are revealed, if not, award points to playing team
    if (this.state.roundPhase === 'play') {
      this.awardPointsToTeam(this.state.playingTeamIndex);
    }
    this.update({
      roundPhase: 'roundEnd',
      currentQuestion: null,
    });
    setTimeout(() => {
      this.update({ celebration: false, roundPhase: 'idle' });
    }, 3000);
  }

  // ---- Score Adjustments ----

  adjustScore(teamIndex: 0 | 1, amount: number) {
    const newTeams = [...this.state.teams] as [typeof this.state.teams[0], typeof this.state.teams[1]];
    newTeams[teamIndex] = {
      ...newTeams[teamIndex],
      score: Math.max(0, newTeams[teamIndex].score + amount),
    };
    this.update({ teams: newTeams });
  }

  // ---- Fast Money ----

  startFastMoney() {
    this.update({
      roundPhase: 'fastmoney',
      fastMoney: {
        ...DEFAULT_FAST_MONEY,
        active: true,
        questions: this.state.fastMoney.questions,
        questionData: this.state.fastMoney.questionData || [],
        player1Answers: Array(5).fill(null).map(() => ({ answer: '', points: 0, revealed: false })),
        player2Answers: Array(5).fill(null).map(() => ({ answer: '', points: 0, revealed: false })),
      },
      celebration: false,
    });
  }

  setFastMoneyAnswer(player: 1 | 2, index: number, answer: string, points: number) {
    const fm = { ...this.state.fastMoney };
    const answers = player === 1
      ? [...fm.player1Answers]
      : [...fm.player2Answers];

    answers[index] = { answer, points, revealed: false };

    if (player === 1) {
      fm.player1Answers = answers;
      fm.player1Total = answers.reduce((sum, a) => sum + a.points, 0);
    } else {
      fm.player2Answers = answers;
      fm.player2Total = answers.reduce((sum, a) => sum + a.points, 0);
    }

    this.update({ fastMoney: fm });
  }

  revealFastMoneyAnswer(player: 1 | 2, index: number) {
    const fm = { ...this.state.fastMoney };
    const answers = player === 1
      ? [...fm.player1Answers]
      : [...fm.player2Answers];

    answers[index] = { ...answers[index], revealed: true };

    if (player === 1) {
      fm.player1Answers = answers;
      fm.player1Total = answers.filter(a => a.revealed).reduce((sum, a) => sum + a.points, 0);
    } else {
      fm.player2Answers = answers;
      fm.player2Total = answers.filter(a => a.revealed).reduce((sum, a) => sum + a.points, 0);
    }

    this.update({ fastMoney: fm });
  }

  markFastMoneyDuplicate(index: number) {
    const fm = { ...this.state.fastMoney };
    const answers = [...fm.player2Answers];
    answers[index] = { ...answers[index], duplicate: true, points: 0 };
    fm.player2Answers = answers;
    fm.player2Total = answers.filter(a => a.revealed).reduce((sum, a) => sum + a.points, 0);
    this.update({ fastMoney: fm });
  }

  switchToPlayer2() {
    const fm = { ...this.state.fastMoney };
    fm.currentPlayer = 2;
    fm.timer = 25;
    this.update({ fastMoney: fm });
  }

  setFastMoneyTimer(time: number) {
    const fm = { ...this.state.fastMoney };
    fm.timer = time;
    this.update({ fastMoney: fm });
  }

  setFastMoneyTimerRunning(running: boolean) {
    const fm = { ...this.state.fastMoney };
    fm.timerRunning = running;
    this.update({ fastMoney: fm });
  }

  startRevealingPlayer2() {
    const fm = { ...this.state.fastMoney };
    fm.revealingPlayer2 = true;
    this.update({ fastMoney: fm });
  }

  endFastMoney() {
    const total = this.state.fastMoney.player1Total + this.state.fastMoney.player2Total;
    const won = total >= 200;
    this.update({
      celebration: won,
    });
  }

  updateFastMoneyQuestions(questions: string[], questionData?: import('./types').Question[]) {
    const fm = { ...this.state.fastMoney };
    fm.questions = questions;
    if (questionData) {
      fm.questionData = questionData;
    }
    this.update({ fastMoney: fm });
  }

  // ---- Display Controls ----

  setCelebration(celebrating: boolean) {
    this.update({ celebration: celebrating });
  }

  setTitleScreen(show: boolean) {
    this.update({ titleScreen: show });
  }

  endGame() {
    const winner = this.state.teams[0].score >= this.state.teams[1].score
      ? this.state.teams[0].name
      : this.state.teams[1].name;
    this.update({
      gameOver: true,
      winner,
      celebration: true,
      roundPhase: 'idle',
    });
  }
}

// Singleton
let store: GameStore | null = null;

export function getGameStore(): GameStore {
  if (!store && typeof window !== 'undefined') {
    store = new GameStore();
  }
  return store!;
}

// React hook
import { useState, useEffect } from 'react';

export function useGameState(): [GameState, GameStore] {
  const gameStore = getGameStore();
  const [state, setState] = useState<GameState>(
    gameStore?.getState() || INITIAL_GAME_STATE
  );

  useEffect(() => {
    if (!gameStore) return;
    setState(gameStore.getState());
    const unsub = gameStore.subscribe(setState);
    gameStore.requestSync();
    return unsub;
  }, [gameStore]);

  return [state, gameStore];
}
