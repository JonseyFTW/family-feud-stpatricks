export interface Answer {
  text: string;
  points: number;
}

export interface Question {
  id: string;
  question: string;
  answers: Answer[];
  isUsed: boolean;
}

export interface Team {
  name: string;
  score: number;
}

export interface FastMoneyAnswer {
  answer: string;
  points: number;
  revealed: boolean;
  duplicate?: boolean;
}

export interface FastMoneyState {
  active: boolean;
  questions: string[];
  questionData: Question[];
  player1Answers: FastMoneyAnswer[];
  player2Answers: FastMoneyAnswer[];
  currentPlayer: 1 | 2;
  player1Total: number;
  player2Total: number;
  timer: number;
  p1Timer: number;
  p2Timer: number;
  timerRunning: boolean;
  revealingPlayer2: boolean;
}

export type RoundPhase =
  | 'idle'
  | 'faceoff'
  | 'play'
  | 'steal'
  | 'reveal'
  | 'roundEnd'
  | 'fastmoney';

export interface GameState {
  teams: [Team, Team];
  hostName: string;
  currentRound: number;
  totalRounds: number;
  currentQuestion: Question | null;
  revealedAnswers: number[];
  strikes: number;
  playingTeamIndex: 0 | 1;
  controllingTeamIndex: 0 | 1;
  roundPhase: RoundPhase;
  fastMoney: FastMoneyState;
  roundScore: number;
  faceoffBuzzedTeam: 0 | 1 | null;
  showStrikeAnimation: boolean;
  lastRevealedAnswer: number | null;
  gameStarted: boolean;
  gameOver: boolean;
  winner: string | null;
  celebration: boolean;
  titleScreen: boolean;
}

export const DEFAULT_FAST_MONEY: FastMoneyState = {
  active: false,
  questions: [
    "Name something you'd find in Ireland",
    "Name something that brings good luck",
    "Name a word or phrase with \"luck\" in it",
    "Name a famous Irish person",
    "Name something you'd find at the end of a rainbow"
  ],
  questionData: [],
  player1Answers: Array(5).fill({ answer: '', points: 0, revealed: false }),
  player2Answers: Array(5).fill({ answer: '', points: 0, revealed: false }),
  currentPlayer: 1,
  player1Total: 0,
  player2Total: 0,
  timer: 20,
  p1Timer: 20,
  p2Timer: 25,
  timerRunning: false,
  revealingPlayer2: false,
};

export const INITIAL_GAME_STATE: GameState = {
  teams: [
    { name: 'Team Shamrock', score: 0 },
    { name: 'Team Leprechaun', score: 0 },
  ],
  hostName: '',
  currentRound: 0,
  totalRounds: 4,
  currentQuestion: null,
  revealedAnswers: [],
  strikes: 0,
  playingTeamIndex: 0,
  controllingTeamIndex: 0,
  roundPhase: 'idle',
  fastMoney: { ...DEFAULT_FAST_MONEY },
  roundScore: 0,
  faceoffBuzzedTeam: null,
  showStrikeAnimation: false,
  lastRevealedAnswer: null,
  gameStarted: false,
  gameOver: false,
  winner: null,
  celebration: false,
  titleScreen: true,
};
