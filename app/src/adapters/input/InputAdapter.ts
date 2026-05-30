import type { SensorFrame } from '../../core/types';

export interface InputAdapter {
  readonly id: string;
  readonly label: string;
  readonly connected: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  read(): SensorFrame | null;
  getStatus(): string;
}
