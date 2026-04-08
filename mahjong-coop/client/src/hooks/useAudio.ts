import { useCallback, useEffect, useRef } from "react";

type SoundName =
  | "click"
  | "flip"
  | "noMatch"
  | "match"
  | "victory"
  | "join"
  | "locked"
  | "deselect"
  | "shuffle"
  | "undo";

function createOscillator(
  ctx: AudioContext,
  type: OscillatorType,
  freq: number,
  gainValue: number,
  startTime: number,
  duration: number,
  destination: AudioNode
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  gain.gain.setValueAtTime(gainValue, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

function playClick(ctx: AudioContext, master: GainNode) {
  createOscillator(ctx, "sine", 880, 0.15, ctx.currentTime, 0.08, master);
  createOscillator(ctx, "sine", 1100, 0.08, ctx.currentTime + 0.04, 0.06, master);
}

function playFlip(ctx: AudioContext, master: GainNode) {
  const t = ctx.currentTime;
  createOscillator(ctx, "triangle", 440, 0.2, t, 0.1, master);
  createOscillator(ctx, "sine", 660, 0.12, t + 0.05, 0.12, master);
}

function playNoMatch(ctx: AudioContext, master: GainNode) {
  const t = ctx.currentTime;
  createOscillator(ctx, "sine", 350, 0.18, t, 0.15, master);
  createOscillator(ctx, "sine", 280, 0.18, t + 0.18, 0.2, master);
}

function playMatch(ctx: AudioContext, master: GainNode) {
  const t = ctx.currentTime;
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    createOscillator(ctx, "sine", freq, 0.22, t + i * 0.07, 0.25, master);
    createOscillator(ctx, "triangle", freq * 2, 0.06, t + i * 0.07, 0.2, master);
  });
}

function playVictory(ctx: AudioContext, master: GainNode) {
  const t = ctx.currentTime;
  const melody = [
    { freq: 523, time: 0.0, dur: 0.2 },
    { freq: 659, time: 0.2, dur: 0.2 },
    { freq: 784, time: 0.4, dur: 0.2 },
    { freq: 1047, time: 0.6, dur: 0.4 },
    { freq: 784, time: 1.0, dur: 0.15 },
    { freq: 1047, time: 1.15, dur: 0.6 },
  ];
  melody.forEach(({ freq, time, dur }) => {
    createOscillator(ctx, "sine", freq, 0.25, t + time, dur + 0.1, master);
    createOscillator(ctx, "triangle", freq / 2, 0.1, t + time, dur, master);
  });
}

function playJoin(ctx: AudioContext, master: GainNode) {
  const t = ctx.currentTime;
  createOscillator(ctx, "sine", 523, 0.15, t, 0.15, master);
  createOscillator(ctx, "sine", 784, 0.15, t + 0.18, 0.2, master);
}

function playLocked(ctx: AudioContext, master: GainNode) {
  const t = ctx.currentTime;
  createOscillator(ctx, "sawtooth", 180, 0.08, t, 0.12, master);
  createOscillator(ctx, "sawtooth", 160, 0.06, t + 0.07, 0.1, master);
}

function playDeselect(ctx: AudioContext, master: GainNode) {
  const t = ctx.currentTime;
  createOscillator(ctx, "sine", 440, 0.1, t, 0.08, master);
  createOscillator(ctx, "sine", 330, 0.08, t + 0.06, 0.1, master);
}

function playShuffle(ctx: AudioContext, master: GainNode) {
  const t = ctx.currentTime;
  const freqs = [330, 392, 440, 523, 440, 392, 330];
  freqs.forEach((freq, i) => {
    createOscillator(ctx, "triangle", freq, 0.1, t + i * 0.04, 0.1, master);
  });
}

function playUndo(ctx: AudioContext, master: GainNode) {
  const t = ctx.currentTime;
  createOscillator(ctx, "sine", 523, 0.12, t, 0.1, master);
  createOscillator(ctx, "sine", 440, 0.12, t + 0.12, 0.1, master);
  createOscillator(ctx, "sine", 392, 0.12, t + 0.24, 0.15, master);
}

const BPM = 160;
const Q  = 60 / BPM;
const E  = Q / 2;
const H  = Q * 2;
const DQ = Q * 1.5;

type NoteEvent = [number | null, number];

const MELODY: NoteEvent[] = [

  [293.7, E], [349.2, E], [587.3, Q],

  [587.3, E], [523.3, E], [440.0, Q],

  [293.7, E], [349.2, E], [587.3, Q],

  [587.3, E], [523.3, E], [440.0, Q],

  [392.0, E], [440.0, E], [523.3, E], [466.2, E], [440.0, E], [392.0, E],

  [349.2, DQ], [392.0, E],

  [440.0, E], [392.0, E], [349.2, E], [329.6, E], [293.7, E], [null, E],

  [293.7, H], [null, Q],

  [587.3, E], [659.3, E], [784.0, Q],

  [784.0, E], [698.5, E], [659.3, E], [587.3, E], [523.3, E], [466.2, E],

  [440.0, E], [523.3, E], [587.3, Q],

  [587.3, E], [523.3, E], [466.2, E], [440.0, E], [392.0, E], [349.2, E],

  [392.0, E], [440.0, E], [523.3, E], [587.3, E], [523.3, E], [466.2, E],

  [440.0, DQ], [392.0, E],

  [349.2, E], [329.6, E], [293.7, E], [329.6, E], [349.2, E], [392.0, E],

  [293.7, H], [null, Q],
];

const BASS_LOOP: NoteEvent[] = [
  [146.8, E], [220.0, E], [146.8, E],
  [174.6, E], [220.0, E], [293.7, E],
];

const CHORD_LOOP: NoteEvent[][] = [
  [[293.7, Q], [349.2, Q], [440.0, Q]],   
  [[440.0, Q], [523.3, Q], [659.3, Q]],   
  [[392.0, Q], [466.2, Q], [587.3, Q]], 
  [[293.7, Q], [349.2, Q], [440.0, Q]],   
];

function createReverb(ctx: AudioContext, destination: AudioNode): AudioNode {
  const wet = ctx.createGain();
  wet.gain.value = 0.3;

  const delay1 = ctx.createDelay(1.0);
  delay1.delayTime.value = 0.055;
  const fb1 = ctx.createGain();
  fb1.gain.value = 0.3;
  delay1.connect(fb1);
  fb1.connect(delay1);

  const delay2 = ctx.createDelay(2.0);
  delay2.delayTime.value = 0.2;
  const fb2 = ctx.createGain();
  fb2.gain.value = 0.2;
  delay2.connect(fb2);
  fb2.connect(delay2);

  wet.connect(delay1);
  wet.connect(delay2);
  delay1.connect(destination);
  delay2.connect(destination);

  return wet;
}

function scheduleNote(
  ctx: AudioContext,
  destination: AudioNode,
  type: OscillatorType,
  freq: number,
  time: number,
  duration: number,
  volume: number,
  filterFreq = 2000
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, time);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(filterFreq, time);
  filter.Q.value = 0.7;

  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(volume, time + 0.018);
  gain.gain.setValueAtTime(volume * 0.8, time + duration * 0.6);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(destination);

  osc.start(time);
  osc.stop(time + duration + 0.04);
}

export function useAudio() {
  const ctxRef            = useRef<AudioContext | null>(null);
  const masterRef         = useRef<GainNode | null>(null);
  const musicGainRef      = useRef<GainNode | null>(null);
  const musicTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMutedRef        = useRef(false);
  const volumeRef         = useRef(0.7);
  const isMusicPlayingRef = useRef(false);

  const melodyIdxRef   = useRef(0);
  const bassIdxRef     = useRef(0);
  const chordIdxRef    = useRef(0);
  const chordNoteRef   = useRef(0);
  const melodyTimeRef  = useRef(0);
  const bassTimeRef    = useRef(0);
  const chordTimeRef   = useRef(0);

  const getCtx = useCallback((): { ctx: AudioContext; master: GainNode } | null => {
    if (!ctxRef.current) {
      try {
        const ctx = new AudioContext();
        const master = ctx.createGain();
        master.gain.setValueAtTime(volumeRef.current, ctx.currentTime);
        master.connect(ctx.destination);
        ctxRef.current = ctx;
        masterRef.current = master;
      } catch {
        console.warn("Web Audio API no disponible");
        return null;
      }
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return { ctx: ctxRef.current, master: masterRef.current! };
  }, []);

  const play = useCallback(
    (sound: SoundName) => {
      if (isMutedRef.current) return;
      const audio = getCtx();
      if (!audio) return;
      const { ctx, master } = audio;
      switch (sound) {
        case "click":    playClick(ctx, master);    break;
        case "flip":     playFlip(ctx, master);     break;
        case "noMatch":  playNoMatch(ctx, master);  break;
        case "match":    playMatch(ctx, master);    break;
        case "victory":  playVictory(ctx, master);  break;
        case "join":     playJoin(ctx, master);     break;
        case "locked":   playLocked(ctx, master);   break;
        case "deselect": playDeselect(ctx, master); break;
        case "shuffle":  playShuffle(ctx, master);  break;
        case "undo":     playUndo(ctx, master);     break;
      }
    },
    [getCtx]
  );

  const tick = useCallback(function tick() {
    if (!isMusicPlayingRef.current) return;

    const audio = getCtx();
    if (!audio) return;
    const { ctx } = audio;

    const musicGain = musicGainRef.current;
    if (!musicGain) return;

    const now = ctx.currentTime;

    if (now >= melodyTimeRef.current - 0.01) {
      const [freq, dur] = MELODY[melodyIdxRef.current]!;
      if (freq !== null) {
        scheduleNote(ctx, musicGain, "triangle", freq, melodyTimeRef.current, dur * 0.9, 0.11, 1800);
        scheduleNote(ctx, musicGain, "sine", freq * 2, melodyTimeRef.current, dur * 0.6, 0.022, 3200);
      }
      melodyTimeRef.current += dur;
      melodyIdxRef.current = (melodyIdxRef.current + 1) % MELODY.length;
    }

    if (now >= bassTimeRef.current - 0.01) {
      const [bFreq, bDur] = BASS_LOOP[bassIdxRef.current]!;
      if (bFreq !== null) {
        scheduleNote(ctx, musicGain, "triangle", bFreq, bassTimeRef.current, bDur * 0.82, 0.07, 600);
        scheduleNote(ctx, musicGain, "sine",     bFreq, bassTimeRef.current, bDur * 0.78, 0.04, 400);
      }
      bassTimeRef.current += bDur;
      bassIdxRef.current = (bassIdxRef.current + 1) % BASS_LOOP.length;
    }

    if (now >= chordTimeRef.current - 0.01) {
      const chord = CHORD_LOOP[chordIdxRef.current % CHORD_LOOP.length]!;
      const [cFreq, cDur] = chord[chordNoteRef.current]!;
      if (cFreq !== null) {
        scheduleNote(ctx, musicGain, "sine", cFreq, chordTimeRef.current, cDur * 0.72, 0.028, 2500);
      }
      chordTimeRef.current += cDur;
      chordNoteRef.current++;
      if (chordNoteRef.current >= chord.length) {
        chordNoteRef.current = 0;
        chordIdxRef.current = (chordIdxRef.current + 1) % CHORD_LOOP.length;
      }
    }

    const nextEvent = Math.min(melodyTimeRef.current, bassTimeRef.current, chordTimeRef.current);
    const waitMs = Math.max(0, (nextEvent - ctx.currentTime) * 1000 - 10);
    musicTimerRef.current = setTimeout(tick, waitMs);
  }, [getCtx]);

  const startMusic = useCallback(() => {
    if (isMusicPlayingRef.current) return;

    const audio = getCtx();
    if (!audio) return;
    const { ctx, master } = audio;

    const musicGain = ctx.createGain();
    musicGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    musicGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 1.5);
    musicGainRef.current = musicGain;

    const reverbIn = createReverb(ctx, master);
    musicGain.connect(reverbIn);
    musicGain.connect(master);

    const start = ctx.currentTime + 0.05;
    melodyIdxRef.current  = 0;
    bassIdxRef.current    = 0;
    chordIdxRef.current   = 0;
    chordNoteRef.current  = 0;
    melodyTimeRef.current = start;
    bassTimeRef.current   = start;
    chordTimeRef.current  = start;

    isMusicPlayingRef.current = true;
    tick();
  }, [getCtx, tick]);

  const stopMusic = useCallback(() => {
    isMusicPlayingRef.current = false;
    if (musicTimerRef.current) {
      clearTimeout(musicTimerRef.current);
      musicTimerRef.current = null;
    }
    if (musicGainRef.current && ctxRef.current) {
      musicGainRef.current.gain.linearRampToValueAtTime(
        0,
        ctxRef.current.currentTime + 1.2
      );
    }
  }, []);

  const setVolume = useCallback((value: number) => {
    volumeRef.current = Math.max(0, Math.min(1, value));
    if (masterRef.current && ctxRef.current) {
      masterRef.current.gain.setValueAtTime(volumeRef.current, ctxRef.current.currentTime);
    }
  }, []);

  const toggle = useCallback(() => {
    isMutedRef.current = !isMutedRef.current;
    if (masterRef.current && ctxRef.current) {
      masterRef.current.gain.setValueAtTime(
        isMutedRef.current ? 0 : volumeRef.current,
        ctxRef.current.currentTime
      );
    }
    return !isMutedRef.current;
  }, []);

  const isMuted = useCallback(() => isMutedRef.current, []);

  useEffect(() => {
    return () => {
      stopMusic();
      ctxRef.current?.close();
    };
  }, [stopMusic]);

  return { play, startMusic, stopMusic, setVolume, toggle, isMuted };
}
