import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          DEFAULT: '#009A44',
          dark: '#006B3C',
          darker: '#004D2C',
          light: '#00C853',
        },
        gold: {
          DEFAULT: '#FFD700',
          dark: '#DAA520',
          light: '#FFE44D',
        },
        feud: {
          blue: '#1a237e',
          darkblue: '#0d1442',
          board: '#1e3a5f',
          boardlight: '#2a5080',
        },
      },
      fontFamily: {
        display: ['Bungee', 'sans-serif'],
        game: ['Bowlby One SC', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      keyframes: {
        flipIn: {
          '0%': { transform: 'rotateX(90deg)', opacity: '0' },
          '100%': { transform: 'rotateX(0deg)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        strikeSlam: {
          '0%': { transform: 'scale(3) rotate(-15deg)', opacity: '0' },
          '50%': { transform: 'scale(1.1) rotate(5deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        shakeX: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-8px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(8px)' },
        },
        celebrate: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px #FFD700, 0 0 10px #FFD700' },
          '50%': { boxShadow: '0 0 20px #FFD700, 0 0 40px #FFD700, 0 0 60px #FFD700' },
        },
        fadeInUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        confettiDrop: {
          '0%': { transform: 'translateY(-100vh) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
        rainbow: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        scoreCount: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)', color: '#FFD700' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        flipIn: 'flipIn 0.5s ease-out forwards',
        slideDown: 'slideDown 0.4s ease-out forwards',
        slideUp: 'slideUp 0.4s ease-out forwards',
        strikeSlam: 'strikeSlam 0.4s ease-out forwards',
        shakeX: 'shakeX 0.6s ease-in-out',
        celebrate: 'celebrate 0.5s ease-in-out infinite',
        glow: 'glow 2s ease-in-out infinite',
        fadeInUp: 'fadeInUp 0.5s ease-out forwards',
        confettiDrop: 'confettiDrop 3s linear forwards',
        rainbow: 'rainbow 3s ease infinite',
        scoreCount: 'scoreCount 0.5s ease-out',
      },
    },
  },
  plugins: [],
};
export default config;
