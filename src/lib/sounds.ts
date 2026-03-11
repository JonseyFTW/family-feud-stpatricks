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
    const duration = 3.0;

    // Create multiple layered clap sources for realism
    const clapCount = 8;
    for (let c = 0; c < clapCount; c++) {
      const clapRate = 6 + Math.random() * 4; // Each "person" claps at slightly different rate
      const offset = Math.random() * 0.1; // Slight timing offset per person
      const pan = (Math.random() * 2 - 1) * 0.8; // Spread across stereo field

      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        const t = i / ctx.sampleRate;
        // Each clap is a short burst of noise
        const clapPhase = ((t + offset) * clapRate) % 1;
        // Sharp attack, quick decay for each individual clap
        const clapEnvelope = clapPhase < 0.15 ? Math.exp(-clapPhase * 25) : 0;
        // Add slight randomness to each clap's intensity
        const intensity = 0.5 + Math.random() * 0.5;
        // Overall volume envelope: swell up, sustain, fade out
        const overall = t < 0.3
          ? t / 0.3  // Ramp up
          : t > duration - 0.8
            ? (duration - t) / 0.8  // Fade out
            : 1.0;  // Sustain
        data[i] = (Math.random() * 2 - 1) * clapEnvelope * intensity * overall;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      // Bandpass filter to shape noise into clap-like timbre
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800 + Math.random() * 2400; // Vary per person
      filter.Q.value = 0.4 + Math.random() * 0.4;

      // High shelf to add crispness
      const highShelf = ctx.createBiquadFilter();
      highShelf.type = 'highshelf';
      highShelf.frequency.value = 4000;
      highShelf.gain.value = 3;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, now);

      // Stereo panning
      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(pan, now);

      source.connect(filter);
      filter.connect(highShelf);
      highShelf.connect(gain);
      gain.connect(panner);
      panner.connect(ctx.destination);

      source.start(now);
    }
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
