import type { InputAdapter } from '../adapters/input/InputAdapter';
import type { OutputAdapter } from '../adapters/output/OutputAdapter';
import { COMMAND_LABELS } from '../data/defaultCommands';
import { CalibrationSession } from './calibration';
import { IntentEngine } from './intentEngine';
import { Preprocessor } from './preprocessor';
import { TICK_MS } from './types';
import type {
  AppSettings,
  CalibrationProfile,
  CommandEvent,
  CommandId,
  InputMetrics,
  PipelineState,
} from './types';

type PipelineListener = (state: PipelineState, events: CommandEvent[]) => void;

export class Pipeline {
  private input: InputAdapter;
  private output: OutputAdapter;
  private preprocessor = new Preprocessor();
  private intentEngine = new IntentEngine();
  private calibrationSession = new CalibrationSession();
  private profile: CalibrationProfile | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private listeners: PipelineListener[] = [];
  private commandLog: CommandEvent[] = [];
  private frameTimestamps: number[] = [];
  private lastFiredConfidence = 0;
  private state: PipelineState = {
    frame: null,
    intent: { commandId: null, label: 'Idle', confidence: 0, stable: false },
    previewCommand: 'rest',
    previewConfidence: 0,
    lastCommand: null,
    lastCommandAt: null,
    lastFiredConfidence: 0,
  };

  constructor(input: InputAdapter, output: OutputAdapter) {
    this.input = input;
    this.output = output;
  }

  getCalibrationSession(): CalibrationSession {
    return this.calibrationSession;
  }

  getInputAdapter(): InputAdapter {
    return this.input;
  }

  async setInputAdapter(adapter: InputAdapter): Promise<void> {
    if (this.input.connected) {
      await this.input.disconnect();
    }
    this.input = adapter;
    this.preprocessor.reset();
    if (!adapter.connected) {
      await adapter.connect();
    }
  }

  setProfile(profile: CalibrationProfile | null): void {
    this.profile = profile;
    this.preprocessor.reset();
    this.intentEngine.reset();
  }

  getProfile(): CalibrationProfile | null {
    return this.profile;
  }

  getIntentEngine(): IntentEngine {
    return this.intentEngine;
  }

  getCommandLog(): CommandEvent[] {
    return [...this.commandLog];
  }

  getState(): PipelineState {
    return this.state;
  }

  getInputMetrics(): InputMetrics {
    const now = Date.now();
    const recent = this.frameTimestamps.filter((t) => now - t < 1000);
    return {
      framesPerSecond: recent.length,
      lastFrameAt: this.frameTimestamps.at(-1) ?? null,
      connected: this.input.connected,
      sourceLabel: this.input.label,
      status: this.input.getStatus(),
    };
  }

  onUpdate(listener: PipelineListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  async start(): Promise<void> {
    if (!this.input.connected) await this.input.connect();
    if (!this.output.connected) await this.output.connect();
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick(): void {
    const raw = this.input.read();
    if (!raw) return;

    this.frameTimestamps.push(raw.timestamp);
    if (this.frameTimestamps.length > 60) this.frameTimestamps.shift();

    if (this.calibrationSession.isRecording()) {
      this.calibrationSession.ingestSample(raw.sensors);
    }

    const frame = this.preprocessor.process(raw, this.profile);
    const intent = this.intentEngine.evaluate(frame, this.profile);
    const previewCommand = this.intentEngine.getPreviewCommand(intent);
    const events: CommandEvent[] = [];

    this.updateGlovePreview(previewCommand, intent.confidence);

    if (this.intentEngine.shouldFire(intent, raw.timestamp) && intent.commandId) {
      const event: CommandEvent = {
        commandId: intent.commandId,
        label: COMMAND_LABELS[intent.commandId],
        confidence: intent.confidence,
        timestamp: raw.timestamp,
      };
      this.output.send(event);
      this.commandLog.unshift(event);
      if (this.commandLog.length > 50) this.commandLog.pop();
      this.intentEngine.markFired(intent.commandId, raw.timestamp);
      this.lastFiredConfidence = intent.confidence;
      events.push(event);

      this.state = {
        frame,
        intent,
        previewCommand,
        previewConfidence: intent.confidence,
        lastCommand: intent.commandId,
        lastCommandAt: raw.timestamp,
        lastFiredConfidence: intent.confidence,
      };
    } else {
      this.state = {
        ...this.state,
        frame,
        intent,
        previewCommand,
        previewConfidence: intent.confidence,
      };
    }

    for (const listener of this.listeners) {
      listener(this.state, events);
    }
  }

  private updateGlovePreview(command: CommandId, confidence: number): void {
    const glove = this.output as OutputAdapter & {
      setPreview?: (command: CommandId, confidence: number) => void;
    };
    glove.setPreview?.(command, confidence);
  }
}

export const DEFAULT_SETTINGS: AppSettings = {
  inputSource: 'simulator',
  autoDemo: false,
  noiseInjection: false,
  activeProfileId: null,
};
