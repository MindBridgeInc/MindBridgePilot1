import type { InputAdapter } from '../adapters/input/InputAdapter';
import { BluetoothAdapter } from '../adapters/input/BluetoothAdapter';
import { SerialAdapter } from '../adapters/input/SerialAdapter';
import { SimulatorAdapter } from '../adapters/input/SimulatorAdapter';
import type { InputSource } from './types';

export class InputManager {
  readonly simulator = new SimulatorAdapter();
  readonly bluetooth = new BluetoothAdapter();
  readonly serial = new SerialAdapter();

  private active: InputAdapter;
  private source: InputSource = 'simulator';

  constructor() {
    this.active = this.simulator;
  }

  getActive(): InputAdapter {
    return this.active;
  }

  getSource(): InputSource {
    return this.source;
  }

  getAdapter(source: InputSource): InputAdapter {
    switch (source) {
      case 'bluetooth':
        return this.bluetooth;
      case 'serial':
        return this.serial;
      default:
        return this.simulator;
    }
  }

  async switchSource(source: InputSource): Promise<InputAdapter> {
    if (this.active.connected && this.active !== this.getAdapter(source)) {
      await this.active.disconnect();
    }
    this.source = source;
    this.active = this.getAdapter(source);
    if (!this.active.connected) {
      await this.active.connect();
    }
    return this.active;
  }

  async connectHardware(source: 'bluetooth' | 'serial'): Promise<InputAdapter> {
    if (this.active.connected) {
      await this.active.disconnect();
    }
    this.source = source;
    this.active = this.getAdapter(source);
    await this.active.connect();
    return this.active;
  }

  async disconnectAll(): Promise<void> {
    await Promise.all([
      this.simulator.disconnect().catch(() => {}),
      this.bluetooth.disconnect().catch(() => {}),
      this.serial.disconnect().catch(() => {}),
    ]);
  }
}
