import { SENSOR_COUNT } from '../../core/types';
import type { InputAdapter } from './InputAdapter';
import type { SensorFrame } from '../../core/types';

export class SimulatorAdapter implements InputAdapter {
  readonly id = 'simulator';
  readonly label = 'Pressure Simulator';
  connected = false;

  private values: number[] = Array(SENSOR_COUNT).fill(0.05);
  private autoDemo = false;
  private noiseInjection = false;
  private demoPhase = 0;
  private demoCommand: 'open_hand' | 'close_hand' | 'pinch' | 'rest' = 'rest';
  private demoTimer = 0;

  setSlider(index: number, value: number): void {
    if (index >= 0 && index < SENSOR_COUNT) {
      this.values[index] = Math.max(0, Math.min(1, value));
    }
  }

  getValues(): number[] {
    return [...this.values];
  }

  setAutoDemo(enabled: boolean): void {
    this.autoDemo = enabled;
    if (!enabled) {
      this.demoPhase = 0;
      this.demoTimer = 0;
    }
  }

  isAutoDemo(): boolean {
    return this.autoDemo;
  }

  setNoiseInjection(enabled: boolean): void {
    this.noiseInjection = enabled;
  }

  isNoiseInjection(): boolean {
    return this.noiseInjection;
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.autoDemo = false;
  }

  getStatus(): string {
    if (!this.connected) return 'Disconnected';
    if (this.autoDemo) return 'Connected — Auto-demo active';
    return 'Connected — Manual control';
  }

  read(): SensorFrame | null {
    if (!this.connected) return null;

    if (this.autoDemo) {
      this.updateAutoDemo();
    }

    const sensors = this.values.map((v, i) => {
      let val = v;
      if (this.noiseInjection) {
        val += (Math.random() - 0.5) * 0.15;
      }
      val += (Math.random() - 0.5) * 0.02;
      return Math.max(0, Math.min(1, val));
    });

    return { timestamp: Date.now(), sensors };
  }

  /** Apply a command pattern for calibration recording */
  applyCommandPattern(commandId: string): void {
    const patterns: Record<string, number[]> = {
      open_hand: [0.08, 0.35, 0.42, 0.38, 0.12, 0.08],
      close_hand: [0.45, 0.48, 0.52, 0.5, 0.44, 0.42],
      pinch: [0.55, 0.1, 0.52, 0.08, 0.12, 0.1],
      rest: [0.05, 0.06, 0.05, 0.06, 0.05, 0.05],
    };
    this.values = [...(patterns[commandId] ?? patterns.rest)];
  }

  private updateAutoDemo(): void {
    this.demoTimer += TICK_MS;
    const cycleMs = 4000;

    if (this.demoTimer >= cycleMs) {
      this.demoTimer = 0;
      const sequence: typeof this.demoCommand[] = ['rest', 'close_hand', 'rest', 'open_hand', 'rest', 'pinch'];
      const idx = sequence.indexOf(this.demoCommand);
      this.demoCommand = sequence[(idx + 1) % sequence.length];
    }

    const target = this.getTargetPattern(this.demoCommand);
    const progress = Math.min(1, this.demoTimer / 800);
    const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    this.values = target.map((t, i) => {
      const base = 0.05;
      const wobble = Math.sin(this.demoPhase + i * 0.7) * 0.03;
      return base + (t - base) * ease + wobble;
    });

    this.demoPhase += 0.08;
  }

  private getTargetPattern(commandId: string): number[] {
    const patterns: Record<string, number[]> = {
      open_hand: [0.08, 0.32, 0.4, 0.36, 0.1, 0.08],
      close_hand: [0.42, 0.45, 0.48, 0.46, 0.4, 0.38],
      pinch: [0.5, 0.08, 0.48, 0.07, 0.1, 0.08],
      rest: [0.05, 0.06, 0.05, 0.06, 0.05, 0.05],
    };
    return patterns[commandId] ?? patterns.rest;
  }
}

const TICK_MS = 50;

export { TICK_MS };
