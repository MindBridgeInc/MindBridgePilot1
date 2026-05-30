import type { InputAdapter } from './InputAdapter';
import type { SensorFrame } from '../../core/types';
import { parseBluetoothPacket } from './packetParser';

export const MINDBRIDGE_SERVICE_UUID = '12345678-1234-5678-1234-56789abcdef0';
export const MINDBRIDGE_SENSOR_CHAR_UUID = '12345678-1234-5678-1234-56789abcdef1';
export const NUS_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
export const NUS_RX_CHAR_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

export type PacketListener = (line: string) => void;

export class BluetoothAdapter implements InputAdapter {
  readonly id = 'bluetooth';
  readonly label = 'BLE Wristband';
  connected = false;

  private device: BluetoothDevice | null = null;
  private latestFrame: SensorFrame | null = null;
  private lineBuffer = '';
  private lastPacketLine = '';
  private packetListeners: PacketListener[] = [];
  private useNus = false;
  private onDisconnect: (() => void) | null = null;

  setOnDisconnect(cb: () => void): void {
    this.onDisconnect = cb;
  }

  onPacket(listener: PacketListener): () => void {
    this.packetListeners.push(listener);
    return () => {
      this.packetListeners = this.packetListeners.filter((l) => l !== listener);
    };
  }

  getLastPacketLine(): string {
    return this.lastPacketLine;
  }

  async connect(): Promise<void> {
    if (!('bluetooth' in navigator)) {
      throw new Error('Web Bluetooth requires Chrome or Edge on desktop.');
    }

    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [MINDBRIDGE_SERVICE_UUID, NUS_SERVICE_UUID],
    });

    this.device = device;
    device.addEventListener('gattserverdisconnected', () => {
      this.connected = false;
      this.onDisconnect?.();
    });

    const server = await device.gatt?.connect();
    if (!server) throw new Error('Could not connect to the BLE device.');

    let characteristic: BluetoothRemoteGATTCharacteristic;

    try {
      const service = await server.getPrimaryService(MINDBRIDGE_SERVICE_UUID);
      characteristic = await service.getCharacteristic(MINDBRIDGE_SENSOR_CHAR_UUID);
      this.useNus = false;
    } catch {
      const nus = await server.getPrimaryService(NUS_SERVICE_UUID);
      characteristic = await nus.getCharacteristic(NUS_RX_CHAR_UUID);
      this.useNus = true;
    }

    await characteristic.startNotifications();
    characteristic.addEventListener('characteristicvaluechanged', (event) => {
      const target = event.target as BluetoothRemoteGATTCharacteristic;
      if (!target.value) return;
      this.handleIncomingText(new TextDecoder().decode(target.value));
    });

    this.connected = true;
    this.lineBuffer = '';
  }

  async disconnect(): Promise<void> {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.connected = false;
    this.device = null;
    this.latestFrame = null;
    this.lineBuffer = '';
  }

  read(): SensorFrame | null {
    return this.latestFrame;
  }

  getStatus(): string {
    if (!this.connected) return 'Not connected';
    const name = this.device?.name ?? 'BLE device';
    return `${name}${this.useNus ? ' · Nordic UART' : ' · MindBridge GATT'}`;
  }

  private handleIncomingText(text: string): void {
    this.lineBuffer += text;
    const lines = this.lineBuffer.split(/\r?\n/);
    this.lineBuffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      this.lastPacketLine = trimmed;
      for (const listener of this.packetListeners) {
        listener(trimmed);
      }
      const frame = parseBluetoothPacket(trimmed);
      if (frame) this.latestFrame = frame;
    }

    const partial = this.lineBuffer.trim();
    if (partial.startsWith('{') && partial.endsWith('}')) {
      const frame = parseBluetoothPacket(partial);
      if (frame) {
        this.latestFrame = frame;
        this.lastPacketLine = partial;
      }
    }
  }
}
