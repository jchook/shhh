// Shared audio simulation used by both InstrumentDisplay and LoudnessDiagram

export interface WaveLayer {
  freq: number;
  phase: number;
  amp: number;
}

// Seeded PRNG for deterministic randomization
export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateLayers(rng: () => number, count = 5): WaveLayer[] {
  const layers: WaveLayer[] = [];
  for (let i = 0; i < count; i++) {
    layers.push({
      freq: 8 + rng() * 30,
      phase: rng() * Math.PI * 2,
      amp: 0.15 + rng() * 0.35,
    });
  }
  return layers;
}

// Continuous organic envelope — incommensurate frequencies guarantee
// threshold crossings within ~25s without any binary switching
export function organicEnvelope(t: number): number {
  const a = Math.sin(t * 0.48) * 0.5 + 0.5;
  const b = Math.sin(t * 0.74 + 1.2) * 0.5 + 0.5;
  const c = Math.sin(t * 1.19 + 3.1) * 0.5 + 0.5;
  const d = Math.sin(t * 2.03 + 0.7) * 0.5 + 0.5;
  const e = Math.sin(t * 0.30 + 2.0) * 0.5 + 0.5;

  const blend = a * 0.30 + b * 0.25 + c * 0.20 + d * 0.10 + e * 0.15;
  const convergence = a * b * c;
  const raw = blend * 0.55 + convergence * 0.9;
  return Math.min(raw * raw * 1.8 + 0.06, 1.0);
}

// Compute a single waveform sample from wave layers at time t
export function computeLayerSample(t: number, layers: WaveLayer[]): number {
  let sum = 0;
  for (const layer of layers) {
    sum += Math.sin(t * layer.freq + layer.phase) * layer.amp;
  }
  return sum;
}

// Generate a buffer of audio-like samples at a given time using wave layers
// Used by the LoudnessDiagram to show waveform + compute RMS/Peak
export function generateAudioWindow(
  t: number,
  count: number,
  groups: { layers: WaveLayer[]; weight: number }[],
): Float32Array {
  const out = new Float32Array(count);
  const env = organicEnvelope(t);
  const windowDuration = 0.5; // 500ms window — wide enough to show wave structure
  for (let i = 0; i < count; i++) {
    const sampleT = t + (i / count) * windowDuration;
    let total = 0;
    for (const group of groups) {
      total += computeLayerSample(sampleT, group.layers) * group.weight;
    }
    out[i] = total * env;
  }
  return out;
}

export function computeRMS(data: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
  return Math.sqrt(sum / data.length);
}

export function computePeak(data: Float32Array): number {
  let max = 0;
  for (let i = 0; i < data.length; i++) {
    const a = Math.abs(data[i]);
    if (a > max) max = a;
  }
  return max;
}
