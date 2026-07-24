import { useCallback, useRef } from 'react';

// Every sound is synthesized directly via the Web Audio API -- no audio
// asset files, so nothing to source, license, or ship as binary weight.
export type SoundName =
  | 'tap'
  | 'rotate'
  | 'swap'
  | 'match'
  | 'solved'
  | 'click'
  | 'countdownTick'
  | 'countdownGo';

export type SoundStyle = 'bowl' | 'wood' | 'glass' | 'arcade';

interface ToneOpts {
  filterFreq?: number;
  wet?: number;
}

export function useSoundEffects(enabled: boolean, style: SoundStyle = 'wood', volume: number = 1) {
  const ctxRef = useRef<AudioContext | null>(null);
  const reverbRef = useRef<ConvolverNode | null>(null);

  // Browsers refuse to run an AudioContext until a real user gesture has
  // happened on the page -- created lazily on first actual play() call
  // (always triggered by a tap/click) rather than on mount, and resumed
  // every time in case the tab suspended it (e.g. after being backgrounded).
  const getContext = useCallback((): AudioContext | null => {
    if (!ctxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return null;
      const ctx = new AudioContextClass();
      ctxRef.current = ctx;
      reverbRef.current = buildReverb(ctx);
      reverbRef.current.connect(ctx.destination);
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  // Synthesized impulse response (exponentially-decaying noise) instead
  // of a recorded IR file -- every "bowl"/"wood"/"glass" tone fades into
  // this same shared space rather than cutting off dry.
  function buildReverb(c: AudioContext): ConvolverNode {
    const seconds = 2.8;
    const rate = c.sampleRate;
    const length = rate * seconds;
    const impulse = c.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
      }
    }
    const convolver = c.createConvolver();
    convolver.buffer = impulse;
    return convolver;
  }

  // Arcade: dry, unfiltered oscillator "blip" -- the original character.
  const arcadeTone = (
    ctx: AudioContext,
    freq: number,
    startTime: number,
    duration: number,
    peak: number,
    type: OscillatorType,
    attack: number = 0.01
  ) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(peak * volume, startTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  };

  // Bowl: lowpass-filtered sine split to a quiet dry path and a wetter
  // send into the shared reverb -- the warm, relaxed base texture.
  const warmTone = (
    ctx: AudioContext,
    freq: number,
    startTime: number,
    duration: number,
    peak: number,
    attack: number,
    opts: ToneOpts = {}
  ) => {
    const filterFreq = opts.filterFreq ?? 1100;
    const wet = opts.wet ?? 0.55;
    const reverb = reverbRef.current;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 0.7;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(peak * volume, startTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    const dryGain = ctx.createGain();
    dryGain.gain.value = 1 - wet;
    const wetGain = ctx.createGain();
    wetGain.gain.value = wet;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dryGain);
    gain.connect(wetGain);
    dryGain.connect(ctx.destination);
    if (reverb) wetGain.connect(reverb);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  };

  const noiseBurst = (ctx: AudioContext, duration: number): AudioBuffer => {
    const rate = ctx.sampleRate;
    const length = Math.max(1, Math.floor(rate * duration));
    const buffer = ctx.createBuffer(1, length, rate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
    }
    return buffer;
  };

  // Wood: a brief filtered noise "strike" transient (the mallet contact)
  // layered under the same warm resonant body as warmTone, but with a
  // much faster attack -- something being struck, not swelling in.
  const woodHit = (
    ctx: AudioContext,
    freq: number,
    startTime: number,
    duration: number,
    peak: number,
    opts: ToneOpts = {}
  ) => {
    const wet = opts.wet ?? 0.5;
    const filterFreq = opts.filterFreq ?? 900;
    const reverb = reverbRef.current;

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBurst(ctx, 0.035);
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = filterFreq * 1.4;
    noiseFilter.Q.value = 1.1;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(peak * 0.8 * volume, startTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.045);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSource.start(startTime);
    noiseSource.stop(startTime + 0.05);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 0.8;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(peak * volume, startTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    const dryGain = ctx.createGain();
    dryGain.gain.value = 1 - wet;
    const wetGain = ctx.createGain();
    wetGain.gain.value = wet;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dryGain);
    gain.connect(wetGain);
    dryGain.connect(ctx.destination);
    if (reverb) wetGain.connect(reverb);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  };

  // Glass: warmTone's fundamental plus a soft, slightly inharmonic upper
  // partial (a non-integer ratio, the way a real bell/glass overtone
  // sits slightly off from a pure harmonic) for a brighter shimmer.
  const glassTone = (
    ctx: AudioContext,
    freq: number,
    startTime: number,
    duration: number,
    peak: number,
    attack: number,
    opts: ToneOpts = {}
  ) => {
    warmTone(ctx, freq, startTime, duration, peak, attack, opts);
    const partialOpts: ToneOpts = { ...opts, filterFreq: (opts.filterFreq ?? 1400) * 1.3 };
    warmTone(ctx, freq * 2.42, startTime + 0.008, duration * 0.65, peak * 0.32, attack + 0.015, partialOpts);
  };

  const play = useCallback(
    (sound: SoundName) => {
      if (!enabled) return;
      const ctx = getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (style === 'arcade') {
        switch (sound) {
          case 'tap':
            arcadeTone(ctx, 720, now, 0.07, 0.1, 'sine');
            break;
          case 'rotate':
            arcadeTone(ctx, 480, now, 0.08, 0.11, 'triangle');
            arcadeTone(ctx, 640, now + 0.05, 0.08, 0.09, 'triangle');
            break;
          case 'swap':
            arcadeTone(ctx, 500, now, 0.09, 0.12, 'sine');
            arcadeTone(ctx, 700, now + 0.06, 0.11, 0.12, 'sine');
            break;
          case 'match':
            arcadeTone(ctx, 880, now, 0.12, 0.13, 'sine');
            arcadeTone(ctx, 1108.73, now + 0.07, 0.16, 0.11, 'sine');
            break;
          case 'solved': {
            const notes = [523.25, 659.25, 783.99, 1046.5];
            notes.forEach((freq, i) => {
              arcadeTone(ctx, freq, now + i * 0.12, i === notes.length - 1 ? 0.35 : 0.15, 0.16, 'sine');
            });
            break;
          }
          case 'click':
            arcadeTone(ctx, 600, now, 0.05, 0.08, 'sine');
            break;
          case 'countdownTick':
            arcadeTone(ctx, 440, now, 0.1, 0.14, 'square');
            break;
          case 'countdownGo':
            arcadeTone(ctx, 880, now, 0.25, 0.16, 'square');
            break;
        }
        return;
      }

      if (style === 'wood') {
        switch (sound) {
          case 'tap':
            woodHit(ctx, 300, now, 0.4, 0.07, { filterFreq: 700, wet: 0.35 });
            break;
          case 'rotate':
            woodHit(ctx, 261.63, now, 0.5, 0.065, { filterFreq: 650, wet: 0.4 });
            break;
          case 'swap':
            woodHit(ctx, 233.08, now, 0.55, 0.065, { filterFreq: 620, wet: 0.4 });
            woodHit(ctx, 293.66, now + 0.05, 0.5, 0.055, { filterFreq: 660, wet: 0.4 });
            break;
          case 'match':
            woodHit(ctx, 349.23, now, 1.1, 0.06, { filterFreq: 850, wet: 0.55 });
            woodHit(ctx, 440.0, now + 0.06, 1.0, 0.05, { filterFreq: 900, wet: 0.55 });
            break;
          case 'solved':
            [130.81, 164.81, 196.0, 261.63].forEach((f, i) =>
              woodHit(ctx, f, now + i * 0.09, 1.8, 0.06, { filterFreq: 600, wet: 0.6 })
            );
            break;
          case 'click':
            woodHit(ctx, 392.0, now, 0.25, 0.04, { filterFreq: 650, wet: 0.3 });
            break;
          case 'countdownTick':
            woodHit(ctx, 220, now, 0.4, 0.06, { filterFreq: 550, wet: 0.35 });
            break;
          case 'countdownGo':
            woodHit(ctx, 392.0, now, 0.7, 0.07, { filterFreq: 700, wet: 0.45 });
            break;
        }
        return;
      }

      if (style === 'glass') {
        switch (sound) {
          case 'tap':
            glassTone(ctx, 392.0, now, 0.45, 0.045, 0.03, { filterFreq: 1500, wet: 0.4 });
            break;
          case 'rotate':
            glassTone(ctx, 349.23, now, 0.55, 0.045, 0.04, { filterFreq: 1450, wet: 0.45 });
            break;
          case 'swap':
            glassTone(ctx, 329.63, now, 0.6, 0.045, 0.05, { filterFreq: 1400, wet: 0.5 });
            glassTone(ctx, 415.3, now + 0.03, 0.55, 0.035, 0.06, { filterFreq: 1500, wet: 0.5 });
            break;
          case 'match':
            glassTone(ctx, 523.25, now, 1.4, 0.05, 0.08, { filterFreq: 1800, wet: 0.6 });
            glassTone(ctx, 659.25, now + 0.05, 1.3, 0.04, 0.1, { filterFreq: 1900, wet: 0.6 });
            break;
          case 'solved':
            [261.63, 329.63, 392.0].forEach((f, i) =>
              glassTone(ctx, f, now + i * 0.06, 2.2, 0.055, 0.15, { filterFreq: 1700, wet: 0.6 })
            );
            break;
          case 'click':
            glassTone(ctx, 466.16, now, 0.25, 0.035, 0.025, { filterFreq: 1500, wet: 0.35 });
            break;
          case 'countdownTick':
            glassTone(ctx, 293.66, now, 0.4, 0.05, 0.04, { filterFreq: 1300, wet: 0.4 });
            break;
          case 'countdownGo':
            glassTone(ctx, 523.25, now, 0.8, 0.06, 0.06, { filterFreq: 1700, wet: 0.5 });
            break;
        }
        return;
      }

      // Bowl (default fallback)
      switch (sound) {
        case 'tap':
          warmTone(ctx, 330, now, 0.5, 0.055, 0.05, { filterFreq: 750, wet: 0.4 });
          break;
        case 'rotate':
          warmTone(ctx, 293.66, now, 0.65, 0.05, 0.07, { filterFreq: 700, wet: 0.45 });
          break;
        case 'swap':
          warmTone(ctx, 261.63, now, 0.8, 0.05, 0.08, { filterFreq: 650, wet: 0.5 });
          warmTone(ctx, 329.63, now + 0.03, 0.75, 0.04, 0.09, { filterFreq: 700, wet: 0.5 });
          break;
        case 'match':
          warmTone(ctx, 392.0, now, 1.6, 0.05, 0.12, { filterFreq: 900, wet: 0.6 });
          warmTone(ctx, 395.0, now, 1.6, 0.04, 0.12, { filterFreq: 900, wet: 0.6 });
          break;
        case 'solved':
          [130.81, 164.81, 196.0].forEach((f) =>
            warmTone(ctx, f, now, 2.6, 0.06, 0.25, { filterFreq: 600, wet: 0.65 })
          );
          break;
        case 'click':
          warmTone(ctx, 349.23, now, 0.3, 0.035, 0.04, { filterFreq: 700, wet: 0.35 });
          break;
        case 'countdownTick':
          warmTone(ctx, 220, now, 0.5, 0.05, 0.06, { filterFreq: 600, wet: 0.4 });
          break;
        case 'countdownGo':
          warmTone(ctx, 349.23, now, 0.9, 0.065, 0.1, { filterFreq: 750, wet: 0.5 });
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabled, style, volume, getContext]
  );

  return play;
}
