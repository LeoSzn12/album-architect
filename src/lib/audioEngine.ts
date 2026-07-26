// Web Audio API Synth Engine for Album Architect UI Sound Effects and Audio Previews

let audioCtx: AudioContext | null = null;
let lastHoverTime = 0;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playHoverSound(enabled = true) {
  if (!enabled) return;
  const nowMs = Date.now();
  if (nowMs - lastHoverTime < 60) return; // 60ms throttle
  lastHoverTime = nowMs;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch {
    // Ignore audio autoplay restrictions
  }
}

export function playDraftLockSound(enabled = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // 1. Sub-bass kick
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();

    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(150, now);
    subOsc.frequency.exponentialRampToValueAtTime(40, now + 0.25);

    subGain.gain.setValueAtTime(0.3, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);

    subOsc.start(now);
    subOsc.stop(now + 0.25);

    // 2. Lock chime
    const chimeOsc = ctx.createOscillator();
    const chimeGain = ctx.createGain();

    chimeOsc.type = 'sine';
    chimeOsc.frequency.setValueAtTime(523.25, now + 0.05); // C5
    chimeOsc.frequency.setValueAtTime(659.25, now + 0.12); // E5
    chimeOsc.frequency.setValueAtTime(783.99, now + 0.2); // G5

    chimeGain.gain.setValueAtTime(0.12, now + 0.05);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    chimeOsc.connect(chimeGain);
    chimeGain.connect(ctx.destination);

    chimeOsc.start(now + 0.05);
    chimeOsc.stop(now + 0.4);
  } catch {
    // Ignore audio restrictions
  }
}

export function playRerollSound(enabled = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  } catch {}
}

export function playDraftCompleteFanfare(enabled = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.15, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.5);
    });
  } catch {}
}

let activePreviewNodes: { stop: () => void; timerId?: NodeJS.Timeout } | null = null;

export function stopSongPreview() {
  if (activePreviewNodes) {
    if (activePreviewNodes.timerId) {
      clearTimeout(activePreviewNodes.timerId);
    }
    activePreviewNodes.stop();
    activePreviewNodes = null;
  }
}

export function playSongPreview(baseFreq = 440, durationSec = 4, enabled = true): (() => void) | null {
  stopSongPreview();
  if (!enabled) return null;

  const ctx = getAudioContext();
  if (!ctx) return null;

  try {
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(baseFreq, now);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(baseFreq / 2, now); // Sub-bass

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(3000, now + 1);
    filter.frequency.exponentialRampToValueAtTime(600, now + durationSec);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    let isStopped = false;

    osc1.start(now);
    osc2.start(now);

    osc1.stop(now + durationSec);
    osc2.stop(now + durationSec);

    const stopFn = () => {
      if (isStopped) return;
      isStopped = true;
      try {
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        const timer = setTimeout(() => {
          try {
            osc1.stop();
            osc2.stop();
          } catch {}
        }, 100);
        if (activePreviewNodes) {
          activePreviewNodes.timerId = timer;
        }
      } catch {}
    };

    activePreviewNodes = { stop: stopFn };
    return stopFn;
  } catch {
    return null;
  }
}
