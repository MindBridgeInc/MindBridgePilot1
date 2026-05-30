import { COMMAND_LABELS } from '../data/defaultCommands';
import { buildFeatureVectorFromSamples, euclideanDistance } from './preprocessor';
import type { CalibrationProfile, CommandId, CommandTemplate, IntentResult, ProcessedFrame } from './types';

const CONFIDENCE_THRESHOLD = 0.5;
const STABLE_MS = 250;
const MAX_DISTANCE = 1.2;
const PREVIEW_THRESHOLD = 0.35;

export class IntentEngine {
  private stableCommand: CommandId | null = null;
  private stableSince = 0;
  private lastFired: CommandId | null = null;
  private lastFiredAt = 0;
  private readonly cooldownMs = 400;

  evaluate(frame: ProcessedFrame, profile: CalibrationProfile | null): IntentResult {
    if (!profile || profile.commands.length === 0) {
      return { commandId: null, label: 'No profile', confidence: 0, stable: false };
    }

    if (!frame.active) {
      this.stableCommand = null;
      return { commandId: 'rest', label: COMMAND_LABELS.rest, confidence: 0.95, stable: true };
    }

    const { bestId, confidence } = this.matchBest(frame.features, profile.commands);

    const now = frame.timestamp;

    if (confidence >= CONFIDENCE_THRESHOLD && bestId && bestId !== 'rest') {
      if (this.stableCommand === bestId) {
        return {
          commandId: bestId,
          label: COMMAND_LABELS[bestId],
          confidence,
          stable: now - this.stableSince >= STABLE_MS,
        };
      }
      this.stableCommand = bestId;
      this.stableSince = now;
      return {
        commandId: bestId,
        label: COMMAND_LABELS[bestId],
        confidence,
        stable: false,
      };
    }

    this.stableCommand = null;
    if (confidence >= PREVIEW_THRESHOLD && bestId) {
      return {
        commandId: bestId,
        label: COMMAND_LABELS[bestId],
        confidence,
        stable: false,
      };
    }

    return { commandId: null, label: 'Uncertain', confidence, stable: false };
  }

  /** Preview command for glove — uses lower threshold, includes rest */
  getPreviewCommand(intent: IntentResult): CommandId {
    if (intent.commandId && intent.confidence >= PREVIEW_THRESHOLD) {
      return intent.commandId;
    }
    return 'rest';
  }

  shouldFire(intent: IntentResult, timestamp: number): boolean {
    if (!intent.stable || !intent.commandId) return false;
    if (intent.commandId === 'rest') return false;
    if (this.lastFired === intent.commandId && timestamp - this.lastFiredAt < this.cooldownMs) {
      return false;
    }
    return true;
  }

  markFired(commandId: CommandId, timestamp: number): void {
    this.lastFired = commandId;
    this.lastFiredAt = timestamp;
  }

  reset(): void {
    this.stableCommand = null;
    this.stableSince = 0;
    this.lastFired = null;
    this.lastFiredAt = 0;
  }

  /** Used by validation UI to score a live frame against a specific command */
  scoreAgainstCommand(
    frame: ProcessedFrame,
    profile: CalibrationProfile,
    commandId: CommandId
  ): number {
    const cmd = profile.commands.find((c) => c.id === commandId);
    if (!cmd) return 0;
    const template = this.resolveTemplate(cmd, profile);
    if (template.length === 0) return 0;
    const dist = euclideanDistance(frame.features, template);
    return Math.max(0, Math.min(1, 1 - dist / MAX_DISTANCE));
  }

  private matchBest(
    featureVec: number[],
    commands: CommandTemplate[]
  ): { bestId: CommandId | null; confidence: number } {
    let bestId: CommandId | null = null;
    let bestDistance = Infinity;

    for (const cmd of commands) {
      if (cmd.id === 'rest') continue;
      const template = cmd.featureVector;
      if (!template || template.length === 0) continue;
      const dist = euclideanDistance(featureVec, template);
      if (dist < bestDistance) {
        bestDistance = dist;
        bestId = cmd.id;
      }
    }

    return {
      bestId,
      confidence: Math.max(0, Math.min(1, 1 - bestDistance / MAX_DISTANCE)),
    };
  }

  private resolveTemplate(cmd: CommandTemplate, profile: CalibrationProfile): number[] {
    if (cmd.featureVector && cmd.featureVector.length > 0) {
      return cmd.featureVector;
    }
    if (cmd.samples.length === 0) return [];
    return buildFeatureVectorFromSamples(
      cmd.samples,
      profile.baseline,
      profile.gain,
      profile.noiseThreshold
    );
  }
}
