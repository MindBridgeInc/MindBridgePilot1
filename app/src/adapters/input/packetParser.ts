import { SENSOR_COUNT } from '../../core/types';
import type { SensorFrame } from '../../core/types';

export function parseBluetoothPacket(json: string): SensorFrame | null {
  return parseSensorPacket(json);
}

export function parseSerialPacket(line: string): SensorFrame | null {
  return parseSensorPacket(line.trim());
}

function parseSensorPacket(raw: string): SensorFrame | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as { t?: number; sensors?: number[] };
    if (!Array.isArray(data.sensors) || data.sensors.length === 0) return null;
    const sensors = data.sensors.slice(0, SENSOR_COUNT).map((v) => Math.max(0, Math.min(1, Number(v))));
    while (sensors.length < SENSOR_COUNT) sensors.push(0.05);
    return {
      timestamp: data.t ?? Date.now(),
      sensors,
    };
  } catch {
    return null;
  }
}
