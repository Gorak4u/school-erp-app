let audioCtx: AudioContext | null = null;
let ringtoneStop: (() => void) | null = null;

function getCtx(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTonePattern(
  frequencies: number[],
  pattern: { on: number; off: number; repeat: number }
): () => void {
  const ctx = getCtx();
  let stopped = false;
  let iteration = 0;
  let nodes: AudioNode[] = [];

  const playIteration = () => {
    if (stopped || (pattern.repeat > 0 && iteration >= pattern.repeat)) return;
    iteration++;

    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    nodes.push(gainNode);

    frequencies.forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.connect(gainNode);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + pattern.on / 1000);
      nodes.push(osc);
    });

    setTimeout(() => {
      nodes = [];
      if (!stopped) setTimeout(playIteration, pattern.off);
    }, pattern.on);
  };

  playIteration();

  return () => {
    stopped = true;
    nodes.forEach((n) => {
      try { (n as OscillatorNode).stop?.(); } catch (_) {}
      n.disconnect();
    });
    nodes = [];
  };
}

export function playIncomingRingtone(): () => void {
  stopRingtone();
  // Classic double-ring: two short tones then pause
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume();

  let stopped = false;
  let timeoutId: ReturnType<typeof setTimeout>;

  const ring = () => {
    if (stopped) return;
    const stop1 = playTonePattern([440, 480], { on: 400, off: 200, repeat: 1 });
    setTimeout(() => {
      stop1();
      if (stopped) return;
      const stop2 = playTonePattern([440, 480], { on: 400, off: 0, repeat: 1 });
      timeoutId = setTimeout(() => {
        stop2();
        if (!stopped) timeoutId = setTimeout(ring, 1600);
      }, 400);
    }, 600);
  };

  ring();

  ringtoneStop = () => {
    stopped = true;
    clearTimeout(timeoutId);
  };

  return ringtoneStop;
}

export function playRingbackTone(): () => void {
  stopRingtone();
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume();

  // Ringback: 1s on, 4s off
  const stop = playTonePattern([440, 480], { on: 1000, off: 4000, repeat: 0 });

  ringtoneStop = stop;
  return stop;
}

export function stopRingtone() {
  if (ringtoneStop) {
    ringtoneStop();
    ringtoneStop = null;
  }
}
