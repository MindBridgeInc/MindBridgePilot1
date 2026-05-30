export const SENSOR_COUNT = 6;
export const TICK_MS = 50;
export const SAMPLE_HISTORY = 120;

export type CommandId = 'open_hand' | 'close_hand' | 'pinch' | 'rest';

export interface SensorFrame {
  timestamp: number;
  sensors: number[];
}

export interface ProcessedFrame {
  timestamp: number;
  raw: number[];
  normalized: number[];
  features: number[];
  active: boolean;
}

export interface CommandTemplate {
  id: CommandId;
  label: string;
  description: string;
  samples: number[][];
  /** Averaged feature vector produced by the same preprocessor path used at runtime */
  featureVector: number[];
}

export interface CalibrationProfile {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  baseline: number[];
  gain: number;
  noiseThreshold: number;
  commands: CommandTemplate[];
}

export interface IntentResult {
  commandId: CommandId | null;
  label: string;
  confidence: number;
  stable: boolean;
}

export interface PipelineState {
  frame: ProcessedFrame | null;
  intent: IntentResult;
  /** Live detected intent shown on glove preview */
  previewCommand: CommandId;
  previewConfidence: number;
  lastCommand: CommandId | null;
  lastCommandAt: number | null;
  lastFiredConfidence: number;
}

export interface CommandEvent {
  commandId: CommandId;
  label: string;
  confidence: number;
  timestamp: number;
}

export type InputSource = 'simulator' | 'bluetooth' | 'serial';

export interface AppSettings {
  inputSource: InputSource;
  autoDemo: boolean;
  noiseInjection: boolean;
  activeProfileId: string | null;
}

export interface InputMetrics {
  framesPerSecond: number;
  lastFrameAt: number | null;
  connected: boolean;
  sourceLabel: string;
  status: string;
}
