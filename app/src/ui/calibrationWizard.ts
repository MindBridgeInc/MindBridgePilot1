import { DEFAULT_COMMANDS } from '../data/defaultCommands';
import type { Pipeline } from '../core/pipeline';
import type { CalibrationProfile, CommandId } from '../core/types';
import { upsertProfile } from '../store/profiles';
import type { SimulatorAdapter } from '../adapters/input/SimulatorAdapter';
import type { InputManager } from '../core/inputManager';

type WizardStep = 'landing' | 'baseline' | 'commands' | 'validate' | 'complete';
type CalMode = 'new' | 'recalibrate';

const TRAIN_COMMANDS = DEFAULT_COMMANDS.filter((c) => c.id !== 'rest');
const RECORD_MS = 4000;
const BASELINE_MS = 6000;
const MIN_SAMPLES = 20;
const VALIDATION_THRESHOLD = 0.5;
const VALIDATION_HITS = 5;

export interface CalibrationWizardOptions {
  onComplete: (profile: CalibrationProfile) => void;
  onInputWarning: (message: string) => void;
  getActiveProfile: () => CalibrationProfile;
}

export class CalibrationWizard {
  private root: HTMLElement;
  private pipeline: Pipeline;
  private inputManager: InputManager;
  private simulator: SimulatorAdapter;
  private options: CalibrationWizardOptions;

  private step: WizardStep = 'landing';
  private mode: CalMode = 'new';
  private editingProfile: CalibrationProfile | null = null;
  private profileName = '';
  private commandIndex = 0;
  private validationIndex = 0;
  private validationHits = 0;
  private validationScores: Record<CommandId, number[]> = {
    open_hand: [],
    close_hand: [],
    pinch: [],
    rest: [],
  };

  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private validationTimer: ReturnType<typeof setInterval> | null = null;
  private recordingGeneration = 0;

  constructor(
    root: HTMLElement,
    pipeline: Pipeline,
    inputManager: InputManager,
    simulator: SimulatorAdapter,
    options: CalibrationWizardOptions
  ) {
    this.root = root;
    this.pipeline = pipeline;
    this.inputManager = inputManager;
    this.simulator = simulator;
    this.options = options;
    this.render();
  }

  /** Open recalibration for a specific profile */
  startRecalibrate(profile: CalibrationProfile): void {
    this.mode = 'recalibrate';
    this.editingProfile = profile;
    this.profileName = profile.name;
    this.resetSession();
    this.step = 'baseline';
    this.render();
  }

  destroy(): void {
    this.clearTimers();
  }

  private clearTimers(): void {
    if (this.tickTimer) clearInterval(this.tickTimer);
    if (this.validationTimer) clearInterval(this.validationTimer);
    this.tickTimer = null;
    this.validationTimer = null;
    this.recordingGeneration++;
    this.pipeline.getCalibrationSession().stopRecording();
  }

  private resetSession(): void {
    this.clearTimers();
    this.pipeline.getCalibrationSession().reset();
    this.commandIndex = 0;
    this.validationIndex = 0;
    this.validationHits = 0;
    for (const id of Object.keys(this.validationScores) as CommandId[]) {
      this.validationScores[id] = [];
    }
  }

  private isSimulatorInput(): boolean {
    return this.inputManager.getSource() === 'simulator';
  }

  private inputStatusHtml(): string {
    const receiving = this.pipeline.isReceivingData();
    const source = this.inputManager.displayLabel();
    const cls = receiving ? 'status-ok' : 'status-warn';
    const msg = receiving
      ? `Receiving sensor data from ${source}`
      : `No sensor data yet — connect your wristband under Input, or use the simulator`;
    return `<p class="input-status ${cls}">${msg}</p>`;
  }

  private render(): void {
    const session = this.pipeline.getCalibrationSession();
    const trainCmd = TRAIN_COMMANDS[this.commandIndex];
    const valCmd = TRAIN_COMMANDS[this.validationIndex];

    const steps: { id: WizardStep; label: string }[] = [
      { id: 'landing', label: 'Start' },
      { id: 'baseline', label: 'Rest' },
      { id: 'commands', label: 'Train' },
      { id: 'validate', label: 'Verify' },
      { id: 'complete', label: 'Done' },
    ];

    const stepIndex = steps.findIndex((s) => s.id === this.step);

    let body = '';

    if (this.step === 'landing') {
      const active = this.options.getActiveProfile();
      body = `
        <h2>Calibration</h2>
        <p class="lead">Calibration records your rest pressure and three hand gestures so MindBridge can recognize your intent from the wristband.</p>
        ${this.inputStatusHtml()}
        <div class="cal-choices">
          <div class="cal-choice">
            <h3>New profile</h3>
            <p>Create a calibration for a new user.</p>
            <label class="field">
              <span>Profile name</span>
              <input type="text" id="profile-name" value="${this.profileName || 'My Profile'}" placeholder="e.g. Alex" />
            </label>
            <button type="button" class="btn btn-primary" id="start-new">Start new calibration</button>
          </div>
          <div class="cal-choice">
            <h3>Recalibrate</h3>
            <p>Update the active profile <strong>${active.name}</strong> with a fresh calibration.</p>
            <button type="button" class="btn btn-secondary" id="start-recal">Recalibrate "${active.name}"</button>
          </div>
        </div>
        <p class="hint">Use Input to connect a BLE wristband or serial device before calibrating. The simulator works for testing only.</p>
      `;
    } else if (this.step === 'baseline') {
      body = `
        <h2>Step 1 — Rest baseline</h2>
        <p class="lead">Keep your hand relaxed on the wristband. Do not squeeze.</p>
        ${this.inputStatusHtml()}
        <div class="live-cal-bar" id="live-cal-bar"></div>
        <div class="progress-bar"><div class="progress-fill" id="record-progress"></div></div>
        <p class="record-meta">Samples: <strong id="sample-count">0</strong> · need at least ${MIN_SAMPLES}</p>
        <div class="wizard-actions">
          <button type="button" class="btn btn-primary" id="record-baseline">Record rest (6 sec)</button>
          <button type="button" class="btn btn-secondary" id="cancel-cal">Cancel</button>
        </div>
      `;
    } else if (this.step === 'commands') {
      body = `
        <h2>Step 2 — Train: ${trainCmd?.label ?? ''}</h2>
        <p class="lead">${trainCmd?.description ?? ''}</p>
        <p>Gesture ${this.commandIndex + 1} of ${TRAIN_COMMANDS.length}. Hold the pose while recording.</p>
        ${this.inputStatusHtml()}
        ${this.isSimulatorInput() ? '<button type="button" class="btn btn-secondary btn-sm" id="fill-demo">Fill demo pattern (simulator only)</button>' : ''}
        <div class="live-cal-bar" id="live-cal-bar"></div>
        <div class="progress-bar"><div class="progress-fill" id="record-progress"></div></div>
        <p class="record-meta">Samples: <strong id="sample-count">0</strong></p>
        <div class="wizard-actions">
          <button type="button" class="btn btn-primary" id="record-command">Record gesture (4 sec)</button>
          <button type="button" class="btn btn-secondary" id="skip-command">Skip</button>
          <button type="button" class="btn btn-secondary" id="cancel-cal">Cancel</button>
        </div>
      `;
    } else if (this.step === 'validate') {
      const scores = this.validationScores[valCmd?.id ?? 'open_hand'];
      const avg =
        scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) : 0;
      body = `
        <h2>Step 3 — Verify: ${valCmd?.label ?? ''}</h2>
        <p class="lead">Perform <strong>${valCmd?.label ?? ''}</strong> naturally. MindBridge will score each reading against your training.</p>
        <p>Gesture ${this.validationIndex + 1} of ${TRAIN_COMMANDS.length} · ${this.validationHits}/${VALIDATION_HITS} good readings</p>
        ${this.inputStatusHtml()}
        ${this.isSimulatorInput() ? '<button type="button" class="btn btn-secondary btn-sm" id="fill-demo">Show demo pattern</button>' : ''}
        <div class="validation-score">
          <div class="validation-meter"><div class="validation-fill" id="validation-fill" style="width: ${avg}%"></div></div>
          <span id="validation-score-label">${avg}% match</span>
        </div>
        <ul class="verify-list">
          ${TRAIN_COMMANDS.map((c) => {
            const s = this.validationScores[c.id];
            const a = s.length ? Math.round((s.reduce((x, y) => x + y, 0) / s.length) * 100) : null;
            const done = this.validationIndex > TRAIN_COMMANDS.findIndex((x) => x.id === c.id) || (c.id === valCmd?.id && this.validationHits >= VALIDATION_HITS);
            return `<li class="${done ? 'verify-pass' : ''}">${c.label}${a !== null ? ` — ${a}% avg` : ''}</li>`;
          }).join('')}
        </ul>
        <div class="wizard-actions">
          <button type="button" class="btn btn-primary" id="start-verify">Start verification</button>
          <button type="button" class="btn btn-secondary" id="skip-verify">Skip verification</button>
          <button type="button" class="btn btn-secondary" id="cancel-cal">Cancel</button>
        </div>
      `;
    } else if (this.step === 'complete') {
      body = `
        <h2>Calibration saved</h2>
        <p class="lead success">Profile <strong>${this.profileName}</strong> is active. Open the Dashboard to test intent detection in real time.</p>
        <div class="wizard-actions">
          <button type="button" class="btn btn-primary" id="go-dashboard">Go to Dashboard</button>
          <button type="button" class="btn btn-secondary" id="recal-again">Calibrate again</button>
        </div>
      `;
    }

    this.root.innerHTML = `
      <div class="wizard panel">
        <nav class="wizard-nav" aria-label="Calibration steps">
          ${steps
            .map(
              (s, i) =>
                `<span class="wizard-nav-item ${s.id === this.step ? 'active' : ''} ${i < stepIndex ? 'done' : ''}">${i + 1}. ${s.label}</span>`
            )
            .join('')}
        </nav>
        <div class="wizard-body">${body}</div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.root.querySelector('#start-new')?.addEventListener('click', () => {
      const nameInput = this.root.querySelector('#profile-name') as HTMLInputElement;
      this.profileName = nameInput?.value.trim() || 'My Profile';
      this.mode = 'new';
      this.editingProfile = null;
      this.resetSession();
      if (!this.pipeline.isReceivingData()) {
        this.options.onInputWarning('No sensor data detected. Connect hardware under Input, or enable the simulator.');
      }
      this.step = 'baseline';
      this.render();
    });

    this.root.querySelector('#start-recal')?.addEventListener('click', () => {
      this.startRecalibrate(this.options.getActiveProfile());
    });

    this.root.querySelector('#record-baseline')?.addEventListener('click', () => this.recordBaseline());
    this.root.querySelector('#record-command')?.addEventListener('click', () => this.recordCommand());
    this.root.querySelector('#skip-command')?.addEventListener('click', () => this.skipCommand());
    this.root.querySelector('#start-verify')?.addEventListener('click', () => this.runValidation());
    this.root.querySelector('#skip-verify')?.addEventListener('click', () => this.saveProfile());
    this.root.querySelector('#cancel-cal')?.addEventListener('click', () => this.goLanding());

    this.root.querySelector('#fill-demo')?.addEventListener('click', () => {
      const cmd =
        this.step === 'baseline'
          ? 'rest'
          : this.step === 'commands'
            ? TRAIN_COMMANDS[this.commandIndex]?.id
            : TRAIN_COMMANDS[this.validationIndex]?.id;
      if (cmd) this.simulator.applyCommandPattern(cmd);
    });

    this.root.querySelector('#go-dashboard')?.addEventListener('click', () => {
      document.querySelector<HTMLButtonElement>('[data-view="dashboard"]')?.click();
    });

    this.root.querySelector('#recal-again')?.addEventListener('click', () => this.goLanding());
  }

  private goLanding(): void {
    this.resetSession();
    this.step = 'landing';
    this.render();
  }

  private recordBaseline(): void {
    const session = this.pipeline.getCalibrationSession();
    session.startBaselineRecording();
    if (this.isSimulatorInput()) this.simulator.applyCommandPattern('rest');

    this.runRecording(BASELINE_MS, () => {
      session.stopRecording();
      const count = session.getBaselineSampleCount();
      if (count < MIN_SAMPLES) {
        alert(`Only ${count} samples captured. Check your input connection and try again.`);
        return;
      }
      this.commandIndex = 0;
      this.step = 'commands';
      this.render();
    });
  }

  private recordCommand(): void {
    const cmd = TRAIN_COMMANDS[this.commandIndex];
    if (!cmd) return;
    const session = this.pipeline.getCalibrationSession();
    if (this.isSimulatorInput()) this.simulator.applyCommandPattern(cmd.id);
    session.startCommandRecording(cmd.id);

    this.runRecording(RECORD_MS, () => {
      session.stopRecording();
      const count = session.getCommandSampleCount(cmd.id);
      if (count < MIN_SAMPLES / 2) {
        alert(`Only ${count} samples for ${cmd.label}. Hold the gesture steady and try again.`);
        return;
      }
      this.commandIndex++;
      if (this.commandIndex < TRAIN_COMMANDS.length) {
        this.step = 'commands';
        this.render();
      } else {
        this.validationIndex = 0;
        this.validationHits = 0;
        this.step = 'validate';
        this.render();
      }
    });
  }

  private skipCommand(): void {
    this.pipeline.getCalibrationSession().stopRecording();
    this.commandIndex++;
    if (this.commandIndex < TRAIN_COMMANDS.length) {
      this.render();
    } else {
      this.validationIndex = 0;
      this.step = 'validate';
      this.render();
    }
  }

  private runValidation(): void {
    if (this.validationTimer) clearInterval(this.validationTimer);
    const cmd = TRAIN_COMMANDS[this.validationIndex];
    if (!cmd) return;

    if (this.isSimulatorInput()) this.simulator.applyCommandPattern(cmd.id);
    this.validationHits = 0;
    this.validationScores[cmd.id] = [];

    this.validationTimer = setInterval(() => {
      if (this.step !== 'validate') return;

      const frame = this.pipeline.getState().frame;
      if (!frame) return;

      const draft = this.pipeline.getCalibrationSession().buildProfile('_draft', '_draft', this.editingProfile ?? undefined);
      const score = this.pipeline.getIntentEngine().scoreAgainstCommand(frame, draft, cmd.id);

      const fill = this.root.querySelector('#validation-fill') as HTMLElement | null;
      const label = this.root.querySelector('#validation-score-label');
      if (fill) fill.style.width = `${Math.round(score * 100)}%`;
      if (label) label.textContent = `${Math.round(score * 100)}% match`;

      this.validationScores[cmd.id].push(score);
      if (this.validationScores[cmd.id].length > 30) {
        this.validationScores[cmd.id].shift();
      }

      if (score >= VALIDATION_THRESHOLD) {
        this.validationHits++;
        if (this.validationHits >= VALIDATION_HITS) {
          this.advanceValidation();
        }
      }

      this.updateLiveBar();
    }, 100);
  }

  private advanceValidation(): void {
    if (this.validationTimer) clearInterval(this.validationTimer);
    this.validationTimer = null;

    const next = this.validationIndex + 1;
    if (next < TRAIN_COMMANDS.length) {
      this.validationIndex = next;
      this.validationHits = 0;
      this.render();
    } else {
      this.saveProfile();
    }
  }

  private saveProfile(): void {
    this.clearTimers();
    const session = this.pipeline.getCalibrationSession();
    const id = this.mode === 'recalibrate' && this.editingProfile ? this.editingProfile.id : `profile_${Date.now()}`;
    const profile = session.buildProfile(id, this.profileName, this.editingProfile ?? undefined);
    upsertProfile(profile);
    this.options.onComplete(profile);
    this.step = 'complete';
    this.render();
  }

  private runRecording(durationMs: number, onDone: () => void): void {
    const session = this.pipeline.getCalibrationSession();
    const start = Date.now();
    const generation = ++this.recordingGeneration;

    if (this.tickTimer) clearInterval(this.tickTimer);

    const progress = this.root.querySelector('#record-progress') as HTMLElement | null;
    if (progress) progress.style.width = '0%';

    this.tickTimer = setInterval(() => {
      if (generation !== this.recordingGeneration) return;

      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      const bar = this.root.querySelector('#record-progress') as HTMLElement | null;
      const count = this.root.querySelector('#sample-count');
      if (bar) bar.style.width = `${pct}%`;
      if (count) {
        const target = session.getRecordTarget();
        count.textContent = String(
          target === 'baseline'
            ? session.getBaselineSampleCount()
            : target
              ? session.getCommandSampleCount(target)
              : 0
        );
      }
      this.updateLiveBar();

      if (elapsed >= durationMs) {
        if (this.tickTimer) clearInterval(this.tickTimer);
        this.tickTimer = null;
        session.stopRecording();
        if (generation === this.recordingGeneration) onDone();
      }
    }, 50);
  }

  private updateLiveBar(): void {
    const bar = this.root.querySelector('#live-cal-bar');
    const frame = this.pipeline.getState().frame;
    if (!bar || !frame) return;
    bar.innerHTML = frame.raw
      .map(
        (v, i) =>
          `<div class="live-cal-cell" title="Sensor ${i + 1}"><div class="live-cal-fill" style="height: ${Math.min(100, v * 100)}%"></div></div>`
      )
      .join('');
  }
}