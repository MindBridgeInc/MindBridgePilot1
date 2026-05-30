import { SENSOR_COUNT } from '../core/types';
import type { InputSource } from '../core/types';
import type { SimulatorAdapter } from '../adapters/input/SimulatorAdapter';
import type { BluetoothAdapter } from '../adapters/input/BluetoothAdapter';
import type { SerialAdapter } from '../adapters/input/SerialAdapter';
import type { InputMetrics } from '../core/types';

export interface DevicePanelCallbacks {
  onSettingsChange: (key: string, value: boolean) => void;
  onUseSimulator: () => Promise<void>;
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
  private errorMessage = '';
  private inputMetrics: InputMetrics = {
    framesPerSecond: 0,
    lastFrameAt: null,
    connected: false,
    sourceLabel: '',
    status: '',
  };

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
    this.refreshStatusBar();
  }

  setError(message: string): void {
    this.errorMessage = message;
    const el = this.root.querySelector('#device-error');
    if (el) el.textContent = message;
  }

  refresh(): void {
    this.render();
  }

  private render(): void {
    const values = this.simulator.getValues();
    const isSim = this.inputSource === 'simulator';
    const bleOn = this.bluetooth.connected;
    const serialOn = this.serial.connected;

    this.root.innerHTML = `
      <div class="devices-layout">
        <section class="panel">
          <h2>Input source</h2>
          <p class="lead">Choose where pressure readings come from. Use Chrome or Edge for hardware connections.</p>
          <div id="device-error" class="device-error">${this.errorMessage}</div>
          <div class="source-cards">
            <article class="source-card ${isSim ? 'selected' : ''}">
              <header>
                <h3>Pressure Simulator</h3>
                <span class="source-tag">Testing</span>
              </header>
              <p>For demos and development. Sliders or auto-demo generate synthetic sensor data.</p>
              <button type="button" class="btn ${isSim ? 'btn-primary' : 'btn-secondary'}" id="use-simulator" ${isSim ? 'disabled' : ''}>
                ${isSim ? 'Active' : 'Use simulator'}
              </button>
            </article>
            <article class="source-card ${this.inputSource === 'bluetooth' ? 'selected' : ''}">
              <header>
                <h3>BLE Wristband</h3>
                <span class="source-tag">Production</span>
              </header>
              <p>Web Bluetooth. Supports MindBridge GATT or Nordic UART (NUS) firmware.</p>
              <p class="source-status">${this.bluetooth.getStatus()}</p>
              <button type="button" class="btn btn-primary" id="connect-ble" ${bleOn ? 'disabled' : ''}>Connect BLE device</button>
              ${bleOn ? '<button type="button" class="btn btn-secondary btn-sm" id="disconnect-ble">Disconnect</button>' : ''}
            </article>
            <article class="source-card ${this.inputSource === 'serial' ? 'selected' : ''}">
              <header>
                <h3>Serial / USB</h3>
                <span class="source-tag">Production</span>
              </header>
              <p>Web Serial at 115200 baud. One JSON object per line from Arduino or similar.</p>
              <p class="source-status">${this.serial.getStatus()}</p>
              <button type="button" class="btn btn-primary" id="connect-serial" ${serialOn ? 'disabled' : ''}>Connect serial port</button>
              ${serialOn ? '<button type="button" class="btn btn-secondary btn-sm" id="disconnect-serial">Disconnect</button>' : ''}
            </article>
          </div>
          <div class="input-status-live" id="input-status-live"></div>
        </section>

        <section class="panel ${isSim ? '' : 'panel-muted'}">
          <h2>Simulator controls</h2>
          <p class="hint">${isSim ? 'Adjust channels manually or enable auto-demo.' : 'Switch to the simulator to use these controls.'}</p>
          <div class="toggle-row">
            <label class="toggle">
              <input type="checkbox" id="auto-demo" ${this.simulator.isAutoDemo() ? 'checked' : ''} ${isSim ? '' : 'disabled'} />
              <span>Auto-demo (cycles through gestures)</span>
            </label>
            <label class="toggle">
              <input type="checkbox" id="noise-injection" ${this.simulator.isNoiseInjection() ? 'checked' : ''} ${isSim ? '' : 'disabled'} />
              <span>Add noise (stress-test filtering)</span>
            </label>
          </div>
          <div class="slider-grid" id="slider-grid">
            ${values
              .map(
                (v, i) => `
              <label class="slider-field">
                <span>Ch ${i + 1}</span>
                <input type="range" min="0" max="100" value="${Math.round(v * 100)}" data-index="${i}" ${isSim ? '' : 'disabled'} />
                <output>${Math.round(v * 100)}%</output>
              </label>
            `
              )
              .join('')}
          </div>
        </section>

        <section class="panel">
          <h2>Packet format</h2>
          <p class="hint">Firmware must send one JSON line per reading, values 0.0–1.0:</p>
          <pre class="code-block">{"t":1717000000,"sensors":[0.12,0.08,0.31,0.05,0.19,0.11]}</pre>
          <h3>Last received packet</h3>
          <pre class="code-block" id="packet-log">${this.lastPacket || '—'}</pre>
        </section>
      </div>
    `;

    this.bindEvents();
    this.refreshStatusBar();
  }

  private bindEvents(): void {
    this.root.querySelector('#use-simulator')?.addEventListener('click', () => {
      void this.callbacks.onUseSimulator().then(() => this.render());
    });

    this.root.querySelector('#connect-ble')?.addEventListener('click', () => {
      void this.callbacks.onConnectBle().then(() => this.render()).catch((e) => {
        this.setError(e instanceof Error ? e.message : 'BLE connection failed');
      });
    });

    this.root.querySelector('#connect-serial')?.addEventListener('click', () => {
      void this.callbacks.onConnectSerial().then(() => this.render()).catch((e) => {
        this.setError(e instanceof Error ? e.message : 'Serial connection failed');
      });
    });

    this.root.querySelector('#disconnect-ble')?.addEventListener('click', () => {
      void this.callbacks.onDisconnectHardware().then(() => this.render());
    });

    this.root.querySelector('#disconnect-serial')?.addEventListener('click', () => {
      void this.callbacks.onDisconnectHardware().then(() => this.render());
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

    this.root.querySelectorAll<HTMLInputElement>('input[type="range"]').forEach((slider) => {
      slider.addEventListener('input', () => {
        this.simulator.setSlider(Number(slider.dataset.index), Number(slider.value) / 100);
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

  private refreshStatusBar(): void {
    const el = this.root.querySelector('#input-status-live');
    if (!el) return;
    const m = this.inputMetrics;
    el.innerHTML = `
      <span>${m.sourceLabel}</span>
      <span>${m.status}</span>
      <span>${m.framesPerSecond} Hz</span>
      <span class="${m.lastFrameAt && Date.now() - m.lastFrameAt < 500 ? 'status-ok' : 'status-warn'}">
        ${m.lastFrameAt && Date.now() - m.lastFrameAt < 500 ? 'Data flowing' : 'No recent data'}
      </span>
    `;
  }

  private refreshPacketLog(): void {
    const el = this.root.querySelector('#packet-log');
    if (el) el.textContent = this.lastPacket || '—';
  }

  updateSource(source: InputSource): void {
    this.inputSource = source;
    this.render();
  }
}
