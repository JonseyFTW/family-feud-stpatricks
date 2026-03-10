'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getGameStore } from '@/lib/gameState';

export default function LobbyPage() {
  const router = useRouter();
  const [team1Name, setTeam1Name] = useState('Team Shamrock');
  const [team2Name, setTeam2Name] = useState('Team Leprechaun');
  const [hostName, setHostName] = useState('');
  const [mounted, setMounted] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleStartGame = () => {
    const store = getGameStore();
    store.setupGame(team1Name, team2Name, hostName || 'Host');
    router.push('/host');
  };

  const openDisplayBoard = () => {
    window.open('/board', '_blank', 'noopener');
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen shamrock-bg flex items-center justify-center p-4">
      {/* Decorative elements */}
      <div className="fixed top-10 left-10 text-6xl opacity-20 animate-bounce" style={{ animationDelay: '0s' }}>☘️</div>
      <div className="fixed top-20 right-20 text-4xl opacity-20 animate-bounce" style={{ animationDelay: '0.5s' }}>🌈</div>
      <div className="fixed bottom-20 left-20 text-5xl opacity-20 animate-bounce" style={{ animationDelay: '1s' }}>🍀</div>
      <div className="fixed bottom-10 right-10 text-6xl opacity-20 animate-bounce" style={{ animationDelay: '1.5s' }}>🪙</div>

      <div className="w-full max-w-lg">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="font-display text-5xl md:text-6xl text-gold mb-2" style={{ textShadow: '0 0 20px rgba(255,215,0,0.5), 0 4px 8px rgba(0,0,0,0.5)' }}>
            MOORE MANOR
          </h1>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl">☘️</span>
            <h2 className="font-game text-xl md:text-2xl text-emerald-light" style={{ textShadow: '0 0 10px rgba(0,200,83,0.3)' }}>
              Friendly Feud Edition
            </h2>
            <span className="text-3xl">☘️</span>
          </div>
          <div className="h-1 w-48 mx-auto bg-gradient-to-r from-transparent via-gold to-transparent rounded-full" />
        </div>

        {/* Setup Card */}
        <div className="bg-emerald-darker/80 backdrop-blur-sm rounded-2xl border-2 border-gold/30 shadow-2xl p-6 md:p-8">
          <div className="space-y-5">
            {/* Host Name */}
            <div>
              <label className="block text-gold font-bold text-sm mb-1.5 uppercase tracking-wider">
                Host Name
              </label>
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Enter host name"
                className="w-full px-4 py-3 bg-black/30 border-2 border-emerald/50 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition-all text-lg"
              />
            </div>

            {/* Team Names */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-emerald-light font-bold text-sm mb-1.5 uppercase tracking-wider">
                  ☘️ Team 1
                </label>
                <input
                  type="text"
                  value={team1Name}
                  onChange={(e) => setTeam1Name(e.target.value)}
                  placeholder="Team Shamrock"
                  className="w-full px-4 py-3 bg-black/30 border-2 border-emerald/50 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition-all"
                />
              </div>
              <div>
                <label className="block text-emerald-light font-bold text-sm mb-1.5 uppercase tracking-wider">
                  🍀 Team 2
                </label>
                <input
                  type="text"
                  value={team2Name}
                  onChange={(e) => setTeam2Name(e.target.value)}
                  placeholder="Team Leprechaun"
                  className="w-full px-4 py-3 bg-black/30 border-2 border-emerald/50 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition-all"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleStartGame}
                className="w-full py-4 bg-gradient-to-r from-gold-dark via-gold to-gold-light text-emerald-darker font-display text-xl rounded-xl shadow-lg hover:shadow-gold/30 hover:scale-[1.02] transition-all duration-200 active:scale-95"
              >
                START GAME
              </button>
              <button
                onClick={openDisplayBoard}
                className="w-full py-3 bg-feud-blue/80 text-white font-bold rounded-xl border-2 border-blue-400/30 hover:bg-feud-blue hover:border-blue-400/50 transition-all duration-200"
              >
                Open Display Board
              </button>
              <button
                onClick={() => router.push('/join')}
                className="w-full py-3 bg-emerald/30 text-emerald-light font-bold rounded-xl border-2 border-emerald/30 hover:bg-emerald/50 hover:border-emerald/50 transition-all duration-200"
              >
                📡 Join Remote Board
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-white/50 text-xs text-center leading-relaxed">
              Open the Display Board on your TV/projector, then start the game.
              Or use &quot;Join Remote Board&quot; to display on a different device with a session code.
            </p>
          </div>

          {/* Reset Game */}
          <div className="mt-4 pt-4 border-t border-white/10">
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-2 text-red-400/60 text-xs font-medium hover:text-red-400 transition-colors"
              >
                Reset Game Data
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-red-400 text-xs text-center font-medium">Clear all game state, scores, and used questions?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const store = getGameStore();
                      store.resetGame();
                      store.clearSession();
                      localStorage.removeItem('family-feud-questions');
                      localStorage.removeItem('family-feud-state');
                      setShowResetConfirm(false);
                      window.location.reload();
                    }}
                    className="flex-1 py-2 bg-red-700/80 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Yes, Reset Everything
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-2 bg-white/10 text-white text-xs font-bold rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          May the luck of the Irish be with ye!
        </p>
      </div>
    </div>
  );
}
