import { SENSOR_COUNT } from '../core/types';
import type { InputSource } from '../core/types';
import type { SimulatorAdapter } from '../adapters/input/SimulatorAdapter';
import type { BluetoothAdapter } from '../adapters/input/BluetoothAdapter';
import type { SerialAdapter } from '../adapters/input/SerialAdapter';
import type { InputMetrics } from '../core/types';

export interface DevicePanelCallbacks {
  onSettingsChange: (key: string, value: boolean) => void;
  onInputSourceChange: (source: InputSource) => void;
  onConnectBle: () => Promise<void>;
  onConnectSerial: () => Promise<void>;
  onDisconnectHardware: () => Promise<void>;
}

export class DevicePanel {
  private root: HTMLElement;
  private simulator: SimulatorAdapter;
  private bluetooth: BluetoothAdapter;
  private serial: SerialAdapter;
  private callbacks: DevicePanelCallbacks;
  private inputSource: InputSource;
  private lastPacket = '';
  private inputMetrics: InputMetrics;

  constructor(
    root: HTMLElement,
    simulator: SimulatorAdapter,
    bluetooth: BluetoothAdapter,
    serial: SerialAdapter,
    inputSource: InputSource,
    callbacks: DevicePanelCallbacks
  ) {
    this.root = root;
    this.simulator = simulator;
    this.bluetooth = bluetooth;
    this.serial = serial;
    this.inputSource = inputSource;
    this.callbacks = callbacks;
    this.inputMetrics = {
      framesPerSecond: 0,
      lastFrameAt: null,
      connected: false,
      sourceLabel: '',
      status: '',
    };

    bluetooth.onPacket((line) => {
      this.lastPacket = line;
      this.refreshPacketLog();
    });
    serial.onPacket((line) => {
      this.lastPacket = line;
      this.refreshPacketLog();
    });

    this.render();
  }

  setInputMetrics(metrics: InputMetrics): void {
    this.inputMetrics = metrics;
    const el = this.root.querySelector('#input-status-live');
    if (el) {
      el.innerHTML = `
        <span class="badge ${metrics.connected ? 'badge-active' : ''}">${metrics.sourceLabel}</span>
        <span>${metrics.status}</span>
        <span>${metrics.framesPerSecond} Hz</span>
      `;
    }
  }

  private render(): void {
    const values = this.simulator.getValues();
    const isSimulator = this.inputSource === 'simulator';
    const hwConnected = this.bluetooth.connected || this.serial.connected;

    this.root.innerHTML = `
      <div class="devices-layout">
        <section class="panel">
          <h2>Input Source</h2>
          <div class="source-selector">
            <label class="source-option ${isSimulator ? 'active' : ''}">
              <input type="radio" name="input-source" value="simulator" ${isSimulator ? 'checked' : ''} />
              <span>Pressure Simulator</span>
            </label>
            <label class="source-option ${this.inputSource === 'bluetooth' ? 'active' : ''}">
              <input type="radio" name="input-source" value="bluetooth" ${this.inputSource === 'bluetooth' ? 'checked' : ''} />
              <span>BLE Wristband</span>
            </label>
            <label class="source-option ${this.inputSource === 'serial' ? 'active' : ''}">
              <input type="radio" name="input-source" value="serial" ${this.inputSource === 'serial' ? 'checked' : ''} />
              <span>Serial / Arduino</span>
            </label>
          </div>
          <div class="input-status-live" id="input-status-live"></div>
        </section>

        <section class="panel ${isSimulator ? '' : 'panel-disabled'}">
          <h2>Pressure Simulator</h2>
          <p class="hint">Stand-in for the MindBridge wristband. Disabled when hardware input is active.</p>
          <div class="toggle-row">
            <label class="toggle">
              <input type="checkbox" id="auto-demo" ${this.simulator.isAutoDemo() ? 'checked' : ''} ${isSimulator ? '' : 'disabled'} />
              <span>Auto-demo mode (MS-like variability)</span>
            </label>
            <label class="toggle">
              <input type="checkbox" id="noise-injection" ${this.simulator.isNoiseInjection() ? 'checked' : ''} ${isSimulator ? '' : 'disabled'} />
              <span>Inject noise (test filtering)</span>
            </label>
          </div>
          <div class="slider-grid" id="slider-grid">
            ${values
              .map(
                (v, i) => `
              <label class="slider-field">
                <span>Sensor ${i + 1}</span>
                <input type="range" min="0" max="100" value="${Math.round(v * 100)}" data-index="${i}" ${isSimulator ? '' : 'disabled'} />
                <output>${Math.round(v * 100)}%</output>
              </label>
            `
              )
              .join('')}
          </div>
        </section>

        <section class="panel">
          <h2>Hardware Connection</h2>
          <p class="hint">Connect a wristband transmitting newline-delimited JSON packets.</p>
          <div class="adapter-cards">
            <div class="adapter-card">
              <h3>BLE Wristband</h3>
              <p>${this.bluetooth.getStatus()}</p>
              <code>{ "t": 1717000000, "sensors": [0.12, 0.08, 0.31, 0.05, 0.19, 0.11] }</code>
              <p class="hint">Service UUID: MindBridge custom or Nordic UART (NUS)</p>
              <button class="btn btn-primary" id="connect-ble" ${this.bluetooth.connected ? 'disabled' : ''}>Connect BLE</button>
            </div>
            <div class="adapter-card">
              <h3>Serial / Arduino</h3>
              <p>${this.serial.getStatus()}</p>
              <code>{ "t": 1717000000, "sensors": [0.12, 0.08, 0.31, 0.05, 0.19, 0.11] }</code>
              <p class="hint">115200 baud, one JSON object per line</p>
              <button class="btn btn-primary" id="connect-serial" ${this.serial.connected ? 'disabled' : ''}>Connect Serial</button>
            </div>
          </div>
          ${hwConnected ? '<button class="btn btn-secondary" id="disconnect-hw">Disconnect hardware</button>' : ''}
          <div class="packet-inspector">
            <h3>Last packet</h3>
            <pre id="packet-log">${this.lastPacket || 'No packets received yet'}</pre>
          </div>
        </section>
      </div>
    `;

    this.bindEvents();
    this.setInputMetrics(this.inputMetrics);
  }

  private bindEvents(): void {
    this.root.querySelectorAll<HTMLInputElement>('input[name="input-source"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        if (radio.checked) {
          this.inputSource = radio.value as InputSource;
          this.callbacks.onInputSourceChange(this.inputSource);
        }
      });
    });

    this.root.querySelector('#auto-demo')?.addEventListener('change', (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      this.simulator.setAutoDemo(checked);
      this.callbacks.onSettingsChange('autoDemo', checked);
    });

    this.root.querySelector('#noise-injection')?.addEventListener('change', (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      this.simulator.setNoiseInjection(checked);
      this.callbacks.onSettingsChange('noiseInjection', checked);
    });

    this.root.querySelector('#connect-ble')?.addEventListener('click', () => {
      void this.callbacks.onConnectBle().then(() => this.render());
    });

    this.root.querySelector('#connect-serial')?.addEventListener('click', () => {
      void this.callbacks.onConnectSerial().then(() => this.render());
    });

    this.root.querySelector('#disconnect-hw')?.addEventListener('click', () => {
      void this.callbacks.onDisconnectHardware().then(() => this.render());
    });

    this.root.querySelectorAll<HTMLInputElement>('input[type="range"]').forEach((slider) => {
      slider.addEventListener('input', () => {
        const index = Number(slider.dataset.index);
        this.simulator.setSlider(index, Number(slider.value) / 100);
        const output = slider.nextElementSibling;
        if (output) output.textContent = `${slider.value}%`;
      });
    });
  }

  refreshSliders(): void {
    if (!this.root.querySelector('#slider-grid')) return;
    const values = this.simulator.getValues();
    this.root.querySelectorAll<HTMLInputElement>('input[type="range"]').forEach((slider) => {
      const index = Number(slider.dataset.index);
      if (index >= 0 && index < SENSOR_COUNT) {
        slider.value = String(Math.round(values[index] * 100));
        const output = slider.nextElementSibling;
        if (output) output.textContent = `${Math.round(values[index] * 100)}%`;
      }
    });
  }

  private refreshPacketLog(): void {
    const el = this.root.querySelector('#packet-log');
    if (el) el.textContent = this.lastPacket || 'No packets received yet';
  }

  updateSource(source: InputSource): void {
    this.inputSource = source;
    this.render();
  }
}
