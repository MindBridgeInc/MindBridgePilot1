# MindBridge

Intent translation platform for assistive technology — maps wristband pressure micro-signals to device commands (shown as a virtual glove in this pilot).

## Run

Double-click `start.bat` (Windows) or:

```bash
cd app
npm install
npm run dev
```

Open http://localhost:5173 in **Chrome or Edge** (required for Web Bluetooth / Web Serial).

## Quick start

1. **Input** — connect a BLE wristband, serial device, or use the Pressure Simulator (enable **Auto-demo** for a hands-free presentation)
2. **Calibrate** — new profile or recalibrate; confirm sensor data is flowing before training
3. **Dashboard** — live preview drives the glove; confirmed commands appear after a stable (debounced) match
4. **Guide** — full operating instructions inside the app

## Demo script

1. **Profiles** — create or activate a demo profile
2. **Input** — select Simulator → enable **Auto-demo**
3. **Dashboard** — watch raw + filtered signals, live preview, and sent commands
4. **Calibrate** — run the wizard (rest → train open/close/pinch → verify)
5. **Input** — optionally connect BLE or Serial hardware (see below)

## Hardware packet

Firmware should emit one JSON object per line (BLE notification or Serial):

```json
{"t":1717000000,"sensors":[0.12,0.08,0.31,0.05,0.19,0.11]}
```

Six sensor values, each `0.0`–`1.0`.

| Transport | Details |
|-----------|---------|
| **BLE** | MindBridge GATT service `12345678-1234-5678-1234-56789abcdef0` (char `…abcdef1`), or Nordic UART (NUS) |
| **Serial** | 115200 baud, newline-delimited JSON |

Example Arduino loop:

```cpp
// sensors[] = 6 floats 0.0–1.0 from analog inputs
Serial.print("{\"t\":");
Serial.print(millis());
Serial.print(",\"sensors\":[");
for (int i = 0; i < 6; i++) {
  if (i) Serial.print(',');
  Serial.print(sensors[i], 3);
}
Serial.println("]}");
```

## Architecture

```
InputAdapter → Preprocessor → IntentEngine → OutputAdapter
                    ↑              ↓
              CalibrationProfile   Live preview + debounced send
```

- **Inputs:** Simulator, Web Bluetooth, Web Serial (same `InputAdapter` interface)
- **Live preview:** glove follows detected intent every tick (~20 Hz)
- **Command sent:** fires after a stable match (debounced) — shown separately on the dashboard
- **Calibration:** samples run through the same pipeline as runtime

## Production build

```bash
cd app
npm run build
npm run serve
```

Serves the `dist/` build on http://localhost:5173.
