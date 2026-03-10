'use client';

class SoundManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private initialized = false;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    // Always resume if suspended (browsers can re-suspend after inactivity)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  async init() {
    if (this.initialized) return;
    this.initialized = true;
    const ctx = this.getContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  }

  private createOscillatorSound(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainValue = 0.3
  ): void {
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(gainValue, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  playDing() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Bright bell-like ding
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.setValueAtTime(1100, now + 0.05);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1320, now);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.6);
    osc2.stop(now + 0.6);
  }

  playBuzzer() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Harsh buzzer sound
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(123, now);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.setValueAtTime(0.35, now + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.8);
    osc2.stop(now + 0.8);
  }

  playApplause() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const duration = 2.0;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < bufferSize; i++) {
        const t = i / ctx.sampleRate;
        // Filtered noise that sounds like clapping
        const noise = (Math.random() * 2 - 1);
        const envelope = Math.sin(Math.PI * t / duration) * 0.3;
        // Add some rhythmic variation
        const rhythm = 0.5 + 0.5 * Math.sin(t * 30);
        data[i] = noise * envelope * rhythm;
      }
    }

    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = 3000;
    filter.Q.value = 0.5;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    source.start(now);
  }

  playRevealFanfare() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Short ascending fanfare
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      gain.gain.setValueAtTime(0.25, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.4);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.4);
    });
  }

  playCelebration() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Triumphant ascending melody
    const melody = [
      { freq: 523, time: 0, dur: 0.15 },
      { freq: 659, time: 0.15, dur: 0.15 },
      { freq: 784, time: 0.3, dur: 0.15 },
      { freq: 1047, time: 0.45, dur: 0.3 },
      { freq: 784, time: 0.8, dur: 0.15 },
      { freq: 1047, time: 0.95, dur: 0.5 },
    ];

    melody.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc2.type = 'triangle';
      osc2.frequency.value = freq * 1.002;
      gain.gain.setValueAtTime(0.25, now + time);
      gain.gain.exponentialRampToValueAtTime(0.01, now + time + dur);
      osc.start(now + time);
      osc.stop(now + time + dur);
      osc2.start(now + time);
      osc2.stop(now + time + dur);
    });

    // Add applause after
    setTimeout(() => this.playApplause(), 1200);
  }

  playTimerTick() {
    this.createOscillatorSound(800, 0.08, 'sine', 0.15);
  }

  playFastMoneyReveal() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.15);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  playThemeIntro() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Classic game show style intro
    const melody = [
      { freq: 392, time: 0, dur: 0.2 },     // G4
      { freq: 440, time: 0.2, dur: 0.2 },    // A4
      { freq: 494, time: 0.4, dur: 0.2 },    // B4
      { freq: 523, time: 0.6, dur: 0.4 },    // C5
      { freq: 587, time: 1.0, dur: 0.2 },    // D5
      { freq: 523, time: 1.2, dur: 0.2 },    // C5
      { freq: 494, time: 1.4, dur: 0.2 },    // B4
      { freq: 523, time: 1.6, dur: 0.6 },    // C5
    ];

    melody.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, now + time);
      gain.gain.exponentialRampToValueAtTime(0.01, now + time + dur);
      osc.start(now + time);
      osc.stop(now + time + dur);
    });
  }
}

export const soundManager = typeof window !== 'undefined' ? new SoundManager() : null;
