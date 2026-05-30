import { SAMPLE_HISTORY, SENSOR_COUNT } from '../core/types';
import type { CalibrationProfile, CommandEvent, InputMetrics, PipelineState } from '../core/types';

export class Dashboard {
  private root: HTMLElement;
  private canvases: HTMLCanvasElement[] = [];
  private rawCanvases: HTMLCanvasElement[] = [];
  private histories: number[][] = Array.from({ length: SENSOR_COUNT }, () => []);
  private rawHistories: number[][] = Array.from({ length: SENSOR_COUNT }, () => []);
  private intentEl!: HTMLElement;
  private confidenceEl!: HTMLElement;
  private previewEl!: HTMLElement;
  private firedEl!: HTMLElement;
  private statusEl!: HTMLElement;
  private logEl!: HTMLElement;
  private gloveContainer!: HTMLElement;
  private metricsEl!: HTMLElement;
  private inputMetricsEl!: HTMLElement;
  private onGloveMount: (container: HTMLElement) => void;
  private mounted = false;

  constructor(root: HTMLElement, onGloveMount: (container: HTMLElement) => void) {
    this.root = root;
    this.onGloveMount = onGloveMount;
    this.build();
  }

  private build(): void {
    this.root.innerHTML = `
      <div class="dashboard-grid">
        <section class="panel signals-panel">
          <h2>Live Pressure Signals</h2>
          <p class="hint">Top row: raw input · Bottom row: filtered (post baseline, gain, noise gate)</p>
          <div class="signal-grid" id="signal-grid-raw"></div>
          <div class="signal-grid signal-grid-filtered" id="signal-grid"></div>
          <div class="signal-meta" id="signal-meta"></div>
          <div class="profile-metrics" id="profile-metrics"></div>
        </section>
        <section class="panel intent-panel">
          <h2>Intent Detection</h2>
          <div class="intent-split">
            <div class="intent-block intent-preview-block">
              <span class="intent-block-label">Live preview</span>
              <div class="intent-display">
                <span class="intent-label intent-preview-label">Rest</span>
                <span class="intent-confidence intent-preview-confidence">—</span>
              </div>
              <p class="intent-block-hint" id="preview-hint">Drives glove animation in real time</p>
            </div>
            <div class="intent-block intent-fired-block">
              <span class="intent-block-label">Command sent</span>
              <div class="intent-display">
                <span class="intent-label intent-fired-label">—</span>
                <span class="intent-confidence intent-fired-confidence">—</span>
              </div>
              <p class="intent-block-hint" id="fired-hint">Fires after stable match (debounced)</p>
            </div>
          </div>
          <div class="intent-status" id="intent-status">Waiting for input…</div>
          <div class="input-metrics" id="input-metrics"></div>
        </section>
        <section class="panel glove-panel">
          <h2>Virtual Assistive Glove</h2>
          <div class="glove-wrap" id="glove-wrap"></div>
        </section>
        <section class="panel log-panel">
          <h2>Command Log</h2>
          <ul class="command-log" id="command-log"></ul>
        </section>
      </div>
    `;

    const rawGrid = this.root.querySelector('#signal-grid-raw')!;
    const grid = this.root.querySelector('#signal-grid')!;
    for (let i = 0; i < SENSOR_COUNT; i++) {
      for (const parent of [rawGrid, grid]) {
        const wrap = document.createElement('div');
        wrap.className = 'signal-cell';
        wrap.innerHTML = `<label>Sensor ${i + 1}${parent === rawGrid ? ' (raw)' : ''}</label>`;
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 40;
        wrap.appendChild(canvas);
        parent.appendChild(wrap);
        if (parent === rawGrid) this.rawCanvases.push(canvas);
        else this.canvases.push(canvas);
      }
    }

    this.intentEl = this.root.querySelector('.intent-preview-label')!;
    this.confidenceEl = this.root.querySelector('.intent-preview-confidence')!;
    this.previewEl = this.root.querySelector('.intent-preview-label')!;
    this.firedEl = this.root.querySelector('.intent-fired-label')!;
    this.statusEl = this.root.querySelector('#intent-status')!;
    this.logEl = this.root.querySelector('#command-log')!;
    this.gloveContainer = this.root.querySelector('#glove-wrap')!;
    this.metricsEl = this.root.querySelector('#profile-metrics')!;
    this.inputMetricsEl = this.root.querySelector('#input-metrics')!;

    if (!this.mounted) {
      this.onGloveMount(this.gloveContainer);
      this.mounted = true;
    }
  }

  update(
    state: PipelineState,
    log: CommandEvent[],
    profile: CalibrationProfile | null,
    inputMetrics: InputMetrics
  ): void {
    if (state.frame) {
      state.frame.raw.forEach((v, i) => {
        this.rawHistories[i].push(v);
        if (this.rawHistories[i].length > SAMPLE_HISTORY) this.rawHistories[i].shift();
        this.drawSparkline(this.rawCanvases[i], this.rawHistories[i], '#6b8cae', 1);
      });
      state.frame.normalized.forEach((v, i) => {
        this.histories[i].push(v);
        if (this.histories[i].length > SAMPLE_HISTORY) this.histories[i].shift();
        this.drawSparkline(this.canvases[i], this.histories[i], '#38bdb0', 0.5);
      });

      const meta = this.root.querySelector('#signal-meta')!;
      meta.innerHTML = `
        <span class="badge ${state.frame.active ? 'badge-active' : ''}">${state.frame.active ? 'Active signal' : 'Below threshold'}</span>
        <span>Channels: ${SENSOR_COUNT}</span>
        <span>Rate: ${inputMetrics.framesPerSecond} Hz</span>
      `;
    }

    if (profile) {
      this.metricsEl.innerHTML = `
        <div class="metric-chip"><span>Gain</span><strong>${profile.gain.toFixed(2)}×</strong></div>
        <div class="metric-chip"><span>Noise gate</span><strong>${profile.noiseThreshold.toFixed(2)}</strong></div>
        <div class="metric-chip"><span>Baseline avg</span><strong>${(profile.baseline.reduce((a, b) => a + b, 0) / profile.baseline.length).toFixed(3)}</strong></div>
      `;
    }

    this.inputMetricsEl.innerHTML = `
      <span class="badge ${inputMetrics.connected ? 'badge-active' : ''}">${inputMetrics.sourceLabel}</span>
      <span>${inputMetrics.status}</span>
    `;

    const intent = state.intent;
    const previewLabel = state.previewCommand.replace(/_/g, ' ');
    this.previewEl.textContent = previewLabel;
    this.root.querySelector('.intent-preview-confidence')!.textContent = `${Math.round(state.previewConfidence * 100)}%`;
    this.previewEl.className = `intent-label intent-preview-label ${state.previewConfidence >= 0.35 ? 'intent-stable' : ''}`;

    const firedLabelEl = this.root.querySelector('.intent-fired-label')!;
    const firedConfEl = this.root.querySelector('.intent-fired-confidence')!;
    if (state.lastCommand && state.lastCommandAt) {
      firedLabelEl.textContent = state.lastCommand.replace(/_/g, ' ');
      firedConfEl.textContent = `${Math.round(state.lastFiredConfidence * 100)}%`;
      firedLabelEl.className = 'intent-label intent-fired-label intent-fired-active';
    } else {
      firedLabelEl.textContent = '—';
      firedConfEl.textContent = '—';
      firedLabelEl.className = 'intent-label intent-fired-label';
    }

    if (intent.stable && intent.commandId && intent.commandId !== 'rest') {
      this.statusEl.textContent = `Stable match — command will send: ${intent.label}`;
    } else if (intent.commandId) {
      this.statusEl.textContent = `Matching ${intent.label}… hold steady`;
    } else {
      this.statusEl.textContent = 'Analyzing pressure pattern…';
    }

    this.logEl.innerHTML =
      log
        .slice(0, 12)
        .map(
          (e) =>
            `<li><time>${new Date(e.timestamp).toLocaleTimeString()}</time> <strong>${e.label}</strong> <span>${Math.round(e.confidence * 100)}%</span></li>`
        )
        .join('') || '<li class="empty">No commands fired yet</li>';
  }

  private drawSparkline(
    canvas: HTMLCanvasElement,
    data: number[],
    color: string,
    maxVal: number
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx || data.length === 0) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(143, 163, 184, 0.2)';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.75);
    ctx.lineTo(w, h * 0.75);
    ctx.stroke();

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = (i / Math.max(1, SAMPLE_HISTORY - 1)) * w;
      const y = h - Math.min(maxVal, v) / maxVal * (h - 4) - 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }
}
