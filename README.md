# MindBridge

Software-first assistive technology that maps wristband pressure micro-signals into commands for assistive devices.

## Quick start

Double-click `start.bat` or:

```bash
cd app
npm install
npm run dev
```

Open http://localhost:5173 (Chrome or Edge recommended for hardware APIs).

## Demo script

1. **Profiles** — activate "MS Demo User"
2. **Devices** — select Simulator → enable **Auto-demo**
3. **Dashboard** — watch raw + filtered signals, live preview driving the glove, and sent commands separately
4. **Calibrate** — run wizard with live validation
5. **Devices** — connect BLE wristband or Serial Arduino (see hardware below)

## Hardware setup

Emit one JSON object per line (BLE notification or Serial):

```json
{ "t": 1717000000, "sensors": [0.12, 0.08, 0.31, 0.05, 0.19, 0.11] }
```

- **BLE:** MindBridge GATT service `12345678-1234-5678-1234-56789abcdef0` or Nordic UART (NUS)
- **Serial:** 115200 baud, newline-delimited JSON

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

- **Live preview:** glove follows detected intent every tick
- **Command sent:** fires after stable match (debounced) — shown separately on dashboard
- **Calibration:** samples processed through the same pipeline as runtime

## Production build

```bash
cd app
npm run build
npm run serve
```
