import { SENSOR_COUNT } from './types';
import type { CalibrationProfile, ProcessedFrame, SensorFrame } from './types';

export class Preprocessor {
  private rollingBuffers: number[][] = Array.from({ length: SENSOR_COUNT }, () => []);
  private readonly windowSize = 5;

  process(raw: SensorFrame, profile: CalibrationProfile | null): ProcessedFrame {
    const baseline = profile?.baseline ?? Array(SENSOR_COUNT).fill(0.05);
    const gain = profile?.gain ?? 2.5;
    const noiseThreshold = profile?.noiseThreshold ?? 0.08;
    return this.processValues(raw.timestamp, raw.sensors, baseline, gain, noiseThreshold);
  }

  /** Process a single sensor array through the full runtime pipeline (used during calibration). */
  processValues(
    timestamp: number,
    sensors: number[],
    baseline: number[],
    gain: number,
    noiseThreshold: number
  ): ProcessedFrame {
    const normalized = sensors.map((value, i) => {
      const delta = value - (baseline[i] ?? 0.05);
      return Math.max(0, delta * gain);
    });

    const filtered = normalized.map((value, i) => {
      this.rollingBuffers[i].push(value);
      if (this.rollingBuffers[i].length > this.windowSize) {
        this.rollingBuffers[i].shift();
      }
      return this.rollingBuffers[i].reduce((a, b) => a + b, 0) / this.rollingBuffers[i].length;
    });

    const spikeRejected = filtered.map((value, i) => {
      const prev = this.rollingBuffers[i].slice(-2, -1)[0] ?? value;
      return Math.abs(value - prev) > 0.4 ? prev : value;
    });

    const gated = spikeRejected.map((value) =>
      value < noiseThreshold ? 0 : value - noiseThreshold
    );

    return {
      timestamp,
      raw: sensors,
      normalized: gated,
      features: [...gated, ...gated.map((v) => (v > 0 ? 1 : 0))],
      active: gated.some((v) => v > 0.02),
    };
  }

  reset(): void {
    this.rollingBuffers = Array.from({ length: SENSOR_COUNT }, () => []);
  }
}

export function computeBaselineFromSamples(samples: number[][]): number[] {
  if (samples.length === 0) return Array(SENSOR_COUNT).fill(0.05);
  const sums = Array(SENSOR_COUNT).fill(0);
  for (const sample of samples) {
    sample.forEach((v, i) => {
      sums[i] += v;
    });
  }
  return sums.map((s) => s / samples.length);
}

export function computeGainFromSamples(baseline: number[], commandSamples: number[][]): number {
  if (commandSamples.length === 0) return 2.5;
  let maxDelta = 0;
  for (const sample of commandSamples) {
    sample.forEach((v, i) => {
      const delta = Math.abs(v - (baseline[i] ?? 0.05));
      if (delta > maxDelta) maxDelta = delta;
    });
  }
  if (maxDelta < 0.05) return 3.5;
  return Math.min(5, Math.max(1.5, 0.35 / maxDelta));
}

/**
 * Run raw calibration samples through an isolated preprocessor instance
 * so templates match the exact runtime feature path.
 */
export function buildFeatureVectorFromSamples(
  samples: number[][],
  baseline: number[],
  gain: number,
  noiseThreshold: number
): number[] {
  if (samples.length === 0) return [];

  const pre = new Preprocessor();
  const vectors = samples.map((sample, i) => {
    const padded = sample.slice(0, SENSOR_COUNT);
    while (padded.length < SENSOR_COUNT) padded.push(0.05);
    return pre.processValues(Date.now() + i, padded, baseline, gain, noiseThreshold).features;
  });

  const len = vectors[0].length;
  const avg = Array(len).fill(0);
  for (const vec of vectors) {
    vec.forEach((v, i) => {
      avg[i] += v;
    });
  }
  return avg.map((v) => v / vectors.length);
}

export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return Infinity;
  const len = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < len; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
}
