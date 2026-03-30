// Ringtone utility — Web Audio API with WAV blob fallback for autoplay policy compliance

let audioCtx: AudioContext | null = null;
let activeStopFn: (() => void) | null = null;
let fallbackAudio: HTMLAudioElement | null = null;

// Call this on ANY user interaction to ensure AudioContext is unlocked
export function unlockAudio() {
  if (typeof window === 'undefined') return;
  try {
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  } catch {}
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

// Generate a WAV blob as fallback when AudioContext is blocked
function generateWavBlob(freqs: number[], durationSec: number): string {
  const sampleRate = 8000;
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  const wStr = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  wStr(0, 'RIFF'); view.setUint32(4, 36 + numSamples * 2, true);
  wStr(8, 'WAVE'); wStr(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  wStr(36, 'data'); view.setUint32(40, numSamples * 2, true);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const amp = freqs.reduce((s, f) => s + Math.sin(2 * Math.PI * f * t), 0) / freqs.length;
    // Fade in/out to avoid clicks
    const env = Math.min(i / 200, 1, (numSamples - i) / 200);
    view.setInt16(44 + i * 2, Math.round(amp * env * 16383), true);
  }
  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

let ringToneUrl: string | null = null;
let ringbackUrl: string | null = null;

function getRingToneUrl(): string {
  if (!ringToneUrl) ringToneUrl = generateWavBlob([480, 440], 0.4);
  return ringToneUrl;
}
function getRingbackUrl(): string {
  if (!ringbackUrl) ringbackUrl = generateWavBlob([440, 480], 1.0);
  return ringbackUrl;
}

function playWebAudioPattern(
  freqs: number[], onMs: number, offMs: number, repeats = 0, volume = 0.25
): () => void {
  const ctx = getCtx();
  if (!ctx || ctx.state !== 'running') return () => {};

  let stopped = false;
  let count = 0;
  let timeoutId: ReturnType<typeof setTimeout>;
  let gainNode: GainNode | null = null;
  let oscs: OscillatorNode[] = [];

  const playOnce = () => {
    if (stopped || (repeats > 0 && count >= repeats)) return;
    count++;
    gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.setValueAtTime(volume, ctx.currentTime + onMs / 1000 - 0.02);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + onMs / 1000);
    gainNode.connect(ctx.destination);
    oscs = freqs.map(f => {
      const o = ctx.createOscillator();
      o.type = 'sine'; o.frequency.value = f;
      o.connect(gainNode!); o.start(); return o;
    });
    timeoutId = setTimeout(() => {
      oscs.forEach(o => { try { o.stop(); o.disconnect(); } catch {} });
      gainNode?.disconnect(); gainNode = null; oscs = [];
      if (!stopped && (repeats === 0 || count < repeats)) timeoutId = setTimeout(playOnce, offMs);
    }, onMs);
  };

  playOnce();
  return () => {
    stopped = true; clearTimeout(timeoutId);
    oscs.forEach(o => { try { o.stop(); o.disconnect(); } catch {} });
    gainNode?.disconnect();
  };
}

function playFallbackLoop(url: string, loop = true): () => void {
  try {
    if (fallbackAudio) { fallbackAudio.pause(); fallbackAudio = null; }
    const audio = new Audio(url);
    audio.loop = loop;
    audio.volume = 0.4;
    audio.play().catch(() => {});
    fallbackAudio = audio;
    return () => { audio.pause(); audio.currentTime = 0; fallbackAudio = null; };
  } catch {
    return () => {};
  }
}

export function playIncomingRingtone(): () => void {
  stopRingtone();
  const ctx = getCtx();

  // Try Web Audio API first
  if (ctx?.state === 'running') {
    let stopped = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    let s1: (() => void) | null = null;

    const ring = () => {
      if (stopped) return;
      s1 = playWebAudioPattern([480, 440], 400, 200, 1);
      timeoutId = setTimeout(() => {
        s1?.(); s1 = null;
        if (stopped) return;
        s1 = playWebAudioPattern([480, 440], 400, 0, 1);
        timeoutId = setTimeout(() => {
          s1?.(); s1 = null;
          if (!stopped) timeoutId = setTimeout(ring, 1800);
        }, 400);
      }, 600);
    };

    ring();
    activeStopFn = () => { stopped = true; clearTimeout(timeoutId); s1?.(); };
    return activeStopFn;
  }

  // Fallback: WAV blob audio element
  activeStopFn = playFallbackLoop(getRingToneUrl(), true);
  return activeStopFn;
}

export function playRingbackTone(): () => void {
  stopRingtone();
  const ctx = getCtx();

  if (ctx?.state === 'running') {
    const stop = playWebAudioPattern([440, 480], 1000, 4000, 0, 0.2);
    activeStopFn = stop;
    return stop;
  }

  activeStopFn = playFallbackLoop(getRingbackUrl(), false);
  return activeStopFn;
}

export function stopRingtone() {
  if (activeStopFn) { activeStopFn(); activeStopFn = null; }
  if (fallbackAudio) { fallbackAudio.pause(); fallbackAudio.currentTime = 0; fallbackAudio = null; }
}
