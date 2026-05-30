import type { InputAdapter } from './InputAdapter';
import type { SensorFrame } from '../../core/types';
import { parseSerialPacket } from './packetParser';

export type PacketListener = (line: string) => void;

export class SerialAdapter implements InputAdapter {
  readonly id = 'serial';
  readonly label = 'Serial / Arduino';
  connected = false;

  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private readLoopActive = false;
  private buffer = '';
  private latestFrame: SensorFrame | null = null;
  private lastPacketLine = '';
  private packetListeners: PacketListener[] = [];

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
    if (!('serial' in navigator)) {
      throw new Error('Web Serial is not supported. Use Chrome/Edge on desktop.');
    }

    this.port = await navigator.serial.requestPort();
    await this.port.open({ baudRate: 115200 });
    this.connected = true;
    this.readLoopActive = true;
    void this.readLoop();
  }

  async disconnect(): Promise<void> {
    this.readLoopActive = false;
    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch {
        /* ignore */
      }
      this.reader = null;
    }
    if (this.port) {
      try {
        await this.port.close();
      } catch {
        /* ignore */
      }
      this.port = null;
    }
    this.connected = false;
    this.latestFrame = null;
    this.buffer = '';
  }

  read(): SensorFrame | null {
    return this.latestFrame;
  }

  getStatus(): string {
    if (!this.connected) return 'Not connected';
    return 'Connected — Serial device @ 115200 baud';
  }

  private async readLoop(): Promise<void> {
    if (!this.port?.readable) return;
    this.reader = this.port.readable.getReader();
    const decoder = new TextDecoder();

    try {
      while (this.readLoopActive && this.reader) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (!value) continue;
        this.buffer += decoder.decode(value, { stream: true });
        this.flushLines();
      }
    } catch {
      this.connected = false;
    } finally {
      this.reader?.releaseLock();
    }
  }

  private flushLines(): void {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      this.lastPacketLine = trimmed;
      for (const listener of this.packetListeners) {
        listener(trimmed);
      }
      const frame = parseSerialPacket(trimmed);
      if (frame) this.latestFrame = frame;
    }
  }
}

export { parseSerialPacket };
