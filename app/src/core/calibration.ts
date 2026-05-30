import { buildDefaultTemplates } from '../data/defaultCommands';
import { buildFeatureVectorFromSamples, computeBaselineFromSamples, computeGainFromSamples } from './preprocessor';
import { SENSOR_COUNT } from './types';
import type { CalibrationProfile, CommandId, CommandTemplate } from './types';

export class CalibrationSession {
  private baselineSamples: number[][] = [];
  private commandSamples: Map<CommandId, number[][]> = new Map();
  private recording = false;
  private recordTarget: CommandId | 'baseline' | null = null;
  private recordStart = 0;

  startBaselineRecording(): void {
    this.baselineSamples = [];
    this.recording = true;
    this.recordTarget = 'baseline';
    this.recordStart = Date.now();
  }

  startCommandRecording(commandId: CommandId): void {
    this.recording = true;
    this.recordTarget = commandId;
    this.recordStart = Date.now();
    if (!this.commandSamples.has(commandId)) {
      this.commandSamples.set(commandId, []);
    }
  }

  stopRecording(): void {
    this.recording = false;
    this.recordTarget = null;
  }

  isRecording(): boolean {
    return this.recording;
  }

  getRecordTarget(): CommandId | 'baseline' | null {
    return this.recordTarget;
  }

  getRecordElapsed(): number {
    if (!this.recording) return 0;
    return Date.now() - this.recordStart;
  }

  ingestSample(sensors: number[]): void {
    if (!this.recording || !this.recordTarget) return;
    const sample = sensors.slice(0, SENSOR_COUNT);
    while (sample.length < SENSOR_COUNT) sample.push(0.05);

    if (this.recordTarget === 'baseline') {
      this.baselineSamples.push(sample);
    } else {
      const arr = this.commandSamples.get(this.recordTarget) ?? [];
      arr.push(sample);
      this.commandSamples.set(this.recordTarget, arr);
    }
  }

  buildProfile(id: string, name: string, existing?: CalibrationProfile): CalibrationProfile {
    const baseline =
      this.baselineSamples.length > 0
        ? computeBaselineFromSamples(this.baselineSamples)
        : existing?.baseline ?? Array(SENSOR_COUNT).fill(0.05);

    const allCommandSamples = [...this.commandSamples.values()].flat();
    const gain = computeGainFromSamples(
      baseline,
      allCommandSamples.length > 0 ? allCommandSamples : [[0.2, 0.2, 0.2, 0.2, 0.2, 0.2]]
    );
    const noiseThreshold = existing?.noiseThreshold ?? 0.08;

    const commands: CommandTemplate[] = buildDefaultTemplates().map((def) => {
      const recorded = this.commandSamples.get(def.id);
      const samples = recorded && recorded.length > 0 ? recorded : def.samples;
      const featureVector = buildFeatureVectorFromSamples(samples, baseline, gain, noiseThreshold);
      return { ...def, samples, featureVector };
    });

    const now = Date.now();
    return {
      id,
      name,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      baseline,
      gain,
      noiseThreshold,
      commands,
    };
  }

  getBaselineSampleCount(): number {
    return this.baselineSamples.length;
  }

  getCommandSampleCount(commandId: CommandId): number {
    return this.commandSamples.get(commandId)?.length ?? 0;
  }

  clearCommandSamples(commandId: CommandId): void {
    this.commandSamples.set(commandId, []);
  }

  reset(): void {
    this.baselineSamples = [];
    this.commandSamples.clear();
    this.recording = false;
    this.recordTarget = null;
  }
}

export function createDefaultProfile(name: string): CalibrationProfile {
  const session = new CalibrationSession();
  session.startBaselineRecording();
  for (let i = 0; i < 40; i++) {
    session.ingestSample([0.05, 0.06, 0.05, 0.06, 0.05, 0.05]);
  }
  session.stopRecording();

  for (const cmd of buildDefaultTemplates()) {
    session.startCommandRecording(cmd.id);
    for (const sample of cmd.samples) {
      session.ingestSample(sample);
    }
    session.stopRecording();
  }

  return session.buildProfile(`profile_${Date.now()}`, name);
}

/** Recompute feature vectors after profile fields change (migration helper) */
export function migrateProfile(profile: CalibrationProfile): CalibrationProfile {
  const commands = profile.commands.map((cmd) => ({
    ...cmd,
    featureVector: buildFeatureVectorFromSamples(
      cmd.samples,
      profile.baseline,
      profile.gain,
      profile.noiseThreshold
    ),
  }));
  return { ...profile, commands };
}
