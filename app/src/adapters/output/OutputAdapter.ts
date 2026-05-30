import type { CommandEvent } from '../../core/types';

export interface OutputAdapter {
  readonly id: string;
  readonly label: string;
  readonly connected: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(event: CommandEvent): void;
  getStatus(): string;
}
