'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (code.length !== 4) {
      setError('Please enter a 4-digit code');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/session/${code}`);
      if (!response.ok) {
        setError('Session not found. Check the code and try again.');
        setLoading(false);
        return;
      }
      router.push(`/board?session=${code}`);
    } catch {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen shamrock-bg flex items-center justify-center p-4">
      {/* Decorative elements */}
      <div className="fixed top-10 left-10 text-6xl opacity-20 animate-bounce" style={{ animationDelay: '0s' }}>☘️</div>
      <div className="fixed bottom-20 right-20 text-5xl opacity-20 animate-bounce" style={{ animationDelay: '1s' }}>🍀</div>

      <div className="w-full max-w-sm text-center">
        {/* Title */}
        <h1 className="font-display text-4xl md:text-5xl text-gold mb-2" style={{ textShadow: '0 0 20px rgba(255,215,0,0.5), 0 4px 8px rgba(0,0,0,0.5)' }}>
          JOIN GAME
        </h1>
        <div className="h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-gold to-transparent rounded-full mb-6" />
        <p className="text-white/60 text-sm mb-6">
          Enter the 4-digit session code shown on the host&apos;s screen
        </p>

        <div className="bg-emerald-darker/80 backdrop-blur-sm rounded-2xl border-2 border-gold/30 shadow-2xl p-6">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, '').slice(0, 4));
              setError(null);
            }}
            placeholder="0000"
            className="w-full px-6 py-4 bg-black/30 border-2 border-emerald/50 rounded-xl text-gold text-center font-display text-5xl tracking-[0.5em] placeholder-white/20 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition-all"
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            autoFocus
          />

          {error && (
            <p className="text-red-400 text-sm mt-3">{error}</p>
          )}

          <button
            onClick={handleJoin}
            disabled={loading || code.length !== 4}
            className="w-full mt-4 py-4 bg-gradient-to-r from-gold-dark via-gold to-gold-light text-emerald-darker font-display text-xl rounded-xl shadow-lg hover:shadow-gold/30 hover:scale-[1.02] transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Connecting...' : 'JOIN'}
          </button>
        </div>

        <a href="/" className="inline-block text-white/40 text-sm mt-6 hover:text-white/60 transition-colors">
          ← Back to Lobby
        </a>
      </div>
    </div>
  );
}
