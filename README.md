# MindBridge

Intent translation platform for assistive technology — maps wristband pressure signals to device commands.

## Run

```bash
cd app
npm install
npm run dev
```

Open http://localhost:5173 in **Chrome or Edge** (required for BLE/Serial hardware).

## Quick start

1. **Input** — connect BLE wristband, serial device, or use the simulator
2. **Calibrate** — new profile or recalibrate; confirm "Receiving sensor data"
3. **Dashboard** — live preview + confirmed commands
4. **Guide** — full operating instructions in the app

## Hardware packet

```json
{"t":1717000000,"sensors":[0.12,0.08,0.31,0.05,0.19,0.11]}
```

BLE: MindBridge GATT or Nordic UART · Serial: 115200 baud
