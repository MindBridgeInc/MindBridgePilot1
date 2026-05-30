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

  isHardwareConnected(): boolean {
    return this.bluetooth.connected || this.serial.connected;
  }

  /** Switch to simulator — disconnects hardware if needed */
  async useSimulator(): Promise<SimulatorAdapter> {
    if (this.bluetooth.connected) await this.bluetooth.disconnect().catch(() => {});
    if (this.serial.connected) await this.serial.disconnect().catch(() => {});
    this.source = 'simulator';
    this.active = this.simulator;
    if (!this.simulator.connected) await this.simulator.connect();
    return this.simulator;
  }

  async connectBluetooth(): Promise<BluetoothAdapter> {
    if (this.simulator.connected) await this.simulator.disconnect().catch(() => {});
    if (this.serial.connected) await this.serial.disconnect().catch(() => {});
    this.source = 'bluetooth';
    this.active = this.bluetooth;
    await this.bluetooth.connect();
    return this.bluetooth;
  }

  async connectSerial(): Promise<SerialAdapter> {
    if (this.simulator.connected) await this.simulator.disconnect().catch(() => {});
    if (this.bluetooth.connected) await this.bluetooth.disconnect().catch(() => {});
    this.source = 'serial';
    this.active = this.serial;
    await this.serial.connect();
    return this.serial;
  }

  async disconnectHardware(): Promise<void> {
    await this.bluetooth.disconnect().catch(() => {});
    await this.serial.disconnect().catch(() => {});
  }

  displayLabel(): string {
    if (this.source === 'simulator') return 'Pressure Simulator';
    if (this.source === 'bluetooth') {
      return this.bluetooth.connected ? 'BLE Wristband' : 'BLE Wristband (disconnected)';
    }
    return this.serial.connected ? 'Serial Device' : 'Serial Device (disconnected)';
  }
}
