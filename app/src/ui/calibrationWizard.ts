import { DEFAULT_COMMANDS } from '../data/defaultCommands';
import type { Pipeline } from '../core/pipeline';
import type { CalibrationProfile, CommandId } from '../core/types';
import { upsertProfile } from '../store/profiles';
import { SimulatorAdapter } from '../adapters/input/SimulatorAdapter';

type WizardStep = 'intro' | 'baseline' | 'commands' | 'validate' | 'done';

const VALIDATION_TARGET = 3;
const VALIDATION_THRESHOLD = 0.55;

export class CalibrationWizard {
  private root: HTMLElement;
  private pipeline: Pipeline;
  private simulator: SimulatorAdapter;
  private step: WizardStep = 'intro';
  private profileName = 'New Profile';
  private commandIndex = 0;
  private validationIndex = 0;
  private validationSuccesses = 0;
  private validationResults: Record<CommandId, { pass: number; fail: number }> = {
    open_hand: { pass: 0, fail: 0 },
    close_hand: { pass: 0, fail: 0 },
    pinch: { pass: 0, fail: 0 },
    rest: { pass: 0, fail: 0 },
  };
  private onComplete: (profile: CalibrationProfile) => void;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private validationTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    root: HTMLElement,
    pipeline: Pipeline,
    simulator: SimulatorAdapter,
    onComplete: (profile: CalibrationProfile) => void
  ) {
    this.root = root;
    this.pipeline = pipeline;
    this.simulator = simulator;
    this.onComplete = onComplete;
    this.render();
  }

  destroy(): void {
    if (this.tickTimer) clearInterval(this.tickTimer);
    if (this.validationTimer) clearInterval(this.validationTimer);
  }

  private render(): void {
    const session = this.pipeline.getCalibrationSession();
    const cmd = DEFAULT_COMMANDS[this.commandIndex];
    const valCmd = DEFAULT_COMMANDS[this.validationIndex];

    const stepContent: Record<WizardStep, string> = {
      intro: `
        <p>Calibration teaches MindBridge your unique pressure patterns. You'll record a rest baseline, train each command, then validate recognition live.</p>
        <label class="field">
          <span>Profile name</span>
          <input type="text" id="profile-name" value="${this.profileName}" />
        </label>
        <button class="btn btn-primary" id="wizard-next">Start calibration</button>
      `,
      baseline: `
        <p>Relax — recording rest baseline for 5 seconds. Keep sensors at neutral pressure.</p>
        <div class="live-cal-bar" id="live-cal-bar"></div>
        <div class="progress-bar"><div class="progress-fill" id="record-progress" style="width: 0%"></div></div>
        <p class="hint">Samples captured: <strong id="sample-count">0</strong></p>
      `,
      commands: `
        <p>Train command <strong>${this.commandIndex + 1}/${DEFAULT_COMMANDS.length}</strong>: <em>${cmd.label}</em></p>
        <p class="hint">${cmd.description}</p>
        <p>Hold the pattern for 3 seconds. Pattern is applied automatically — adjust sliders if using manual mode.</p>
        <button class="btn btn-secondary" id="apply-pattern">Re-apply pattern</button>
        <div class="live-cal-bar" id="live-cal-bar"></div>
        <div class="progress-bar"><div class="progress-fill" id="record-progress" style="width: 0%"></div></div>
        <p class="hint">Samples captured: <strong id="sample-count">0</strong></p>
      `,
      validate: `
        <p>Live validation — perform: <strong>${valCmd.label}</strong> (${this.validationSuccesses}/${VALIDATION_TARGET} successes)</p>
        <p class="hint">${valCmd.description}. Match confidence must exceed ${Math.round(VALIDATION_THRESHOLD * 100)}%.</p>
        <button class="btn btn-secondary" id="apply-validation-pattern">Show demo pattern</button>
        <div class="validation-score">
          <div class="validation-meter"><div class="validation-fill" id="validation-fill" style="width: 0%"></div></div>
          <span id="validation-score-label">0%</span>
        </div>
        <ul class="trained-list" id="validation-summary">
          ${DEFAULT_COMMANDS.filter((c) => c.id !== 'rest')
            .map((c) => {
              const r = this.validationResults[c.id];
              return `<li>${c.label}: ${r.pass} pass / ${r.fail} fail <button class="btn btn-sm btn-secondary" data-retrain="${c.id}">Retrain</button></li>`;
            })
            .join('')}
        </ul>
        <div class="wizard-actions">
          <button class="btn btn-secondary" id="skip-validation">Skip to save</button>
          <button class="btn btn-primary" id="save-profile" ${this.allValidated() ? '' : 'disabled'}>Save profile</button>
        </div>
      `,
      done: `
        <p class="success">Profile saved and activated. Open Dashboard with auto-demo to test end-to-end.</p>
      `,
    };

    this.root.innerHTML = `
      <div class="wizard panel">
        <div class="wizard-steps">
          ${(['intro', 'baseline', 'commands', 'validate', 'done'] as WizardStep[])
            .map((s) => `<span class="wizard-step ${s === this.step ? 'active' : ''}">${s}</span>`)
            .join('')}
        </div>
        <div class="wizard-body">${stepContent[this.step]}</div>
      </div>
    `;

    this.bindEvents();
    if (this.step === 'validate') this.startValidationRound();
  }

  private bindEvents(): void {
    this.root.querySelector('#wizard-next')?.addEventListener('click', () => this.startBaseline());

    this.root.querySelector('#apply-pattern')?.addEventListener('click', () => {
      this.simulator.applyCommandPattern(DEFAULT_COMMANDS[this.commandIndex].id);
    });

    this.root.querySelector('#apply-validation-pattern')?.addEventListener('click', () => {
      this.simulator.applyCommandPattern(DEFAULT_COMMANDS[this.validationIndex].id);
    });

    this.root.querySelector('#save-profile')?.addEventListener('click', () => this.saveProfile());
    this.root.querySelector('#skip-validation')?.addEventListener('click', () => this.saveProfile());

    this.root.querySelector('#profile-name')?.addEventListener('input', (e) => {
      this.profileName = (e.target as HTMLInputElement).value || 'New Profile';
    });

    this.root.querySelectorAll('[data-retrain]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.retrain as CommandId;
        this.retrainCommand(id);
      });
    });
  }

  private allValidated(): boolean {
    return DEFAULT_COMMANDS.filter((c) => c.id !== 'rest').every(
      (c) => this.validationResults[c.id].pass >= 1
    );
  }

  private startBaseline(): void {
    const session = this.pipeline.getCalibrationSession();
    session.reset();
    this.simulator.applyCommandPattern('rest');
    session.startBaselineRecording();
    this.step = 'baseline';
    this.render();
    this.runRecording(5000, () => {
      session.stopRecording();
      this.commandIndex = 0;
      this.step = 'commands';
      this.render();
      this.startCommandRecord();
    });
  }

  private startCommandRecord(): void {
    const cmd = DEFAULT_COMMANDS[this.commandIndex];
    const session = this.pipeline.getCalibrationSession();
    this.simulator.applyCommandPattern(cmd.id);
    session.startCommandRecording(cmd.id as CommandId);
    this.runRecording(3000, () => {
      session.stopRecording();
      this.commandIndex++;
      if (this.commandIndex < DEFAULT_COMMANDS.length) {
        this.render();
        this.startCommandRecord();
      } else {
        this.validationIndex = 0;
        this.validationSuccesses = 0;
        this.step = 'validate';
        this.render();
      }
    });
  }

  private retrainCommand(commandId: CommandId): void {
    const session = this.pipeline.getCalibrationSession();
    session.clearCommandSamples(commandId);
    this.simulator.applyCommandPattern(commandId);
    session.startCommandRecording(commandId);
    this.step = 'commands';
    this.commandIndex = DEFAULT_COMMANDS.findIndex((c) => c.id === commandId);
    this.render();
    this.runRecording(3000, () => {
      session.stopRecording();
      this.validationResults[commandId] = { pass: 0, fail: 0 };
      this.validationIndex = DEFAULT_COMMANDS.findIndex((c) => c.id === commandId);
      this.validationSuccesses = 0;
      this.step = 'validate';
      this.render();
    });
  }

  private startValidationRound(): void {
    if (this.validationTimer) clearInterval(this.validationTimer);
    const cmd = DEFAULT_COMMANDS[this.validationIndex];
    if (cmd.id === 'rest') {
      this.advanceValidationCommand();
      return;
    }

    this.simulator.applyCommandPattern(cmd.id);
    this.validationSuccesses = 0;

    this.validationTimer = setInterval(() => {
      const state = this.pipeline.getState();
      const draftProfile = this.pipeline.getCalibrationSession().buildProfile('_tmp', '_tmp');

      const frame = state.frame;
      const fill = this.root.querySelector('#validation-fill') as HTMLElement | null;
      const label = this.root.querySelector('#validation-score-label');

      if (frame) {
        const score = this.pipeline.getIntentEngine().scoreAgainstCommand(frame, draftProfile, cmd.id);
        if (fill) fill.style.width = `${Math.round(score * 100)}%`;
        if (label) label.textContent = `${Math.round(score * 100)}%`;

        if (score >= VALIDATION_THRESHOLD) {
          this.validationSuccesses++;
          this.validationResults[cmd.id].pass++;
          if (this.validationSuccesses >= VALIDATION_TARGET) {
            this.advanceValidationCommand();
          }
        }
      }

      this.updateLiveCalBar();
    }, 100);
  }

  private advanceValidationCommand(): void {
    if (this.validationTimer) clearInterval(this.validationTimer);
    const nonRest = DEFAULT_COMMANDS.filter((c) => c.id !== 'rest');
    const currentIdx = nonRest.findIndex((c) => c.id === DEFAULT_COMMANDS[this.validationIndex].id);
    const nextIdx = currentIdx + 1;

    if (nextIdx < nonRest.length) {
      this.validationIndex = DEFAULT_COMMANDS.findIndex((c) => c.id === nonRest[nextIdx].id);
      this.validationSuccesses = 0;
      this.render();
    } else {
      const saveBtn = this.root.querySelector('#save-profile') as HTMLButtonElement | null;
      if (saveBtn) saveBtn.disabled = false;
      if (this.validationTimer) clearInterval(this.validationTimer);
    }
  }

  private runRecording(durationMs: number, onDone: () => void): void {
    const session = this.pipeline.getCalibrationSession();
    const start = Date.now();
    if (this.tickTimer) clearInterval(this.tickTimer);

    this.tickTimer = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      const progress = this.root.querySelector('#record-progress') as HTMLElement | null;
      const count = this.root.querySelector('#sample-count');
      if (progress) progress.style.width = `${pct}%`;
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
      this.updateLiveCalBar();
      if (elapsed >= durationMs) {
        if (this.tickTimer) clearInterval(this.tickTimer);
        this.tickTimer = null;
        onDone();
      }
    }, 50);
  }

  private updateLiveCalBar(): void {
    const bar = this.root.querySelector('#live-cal-bar');
    const frame = this.pipeline.getState().frame;
    if (!bar || !frame) return;
    bar.innerHTML = frame.normalized
      .map(
        (v, i) =>
          `<div class="live-cal-cell" title="Sensor ${i + 1}"><div class="live-cal-fill" style="height: ${Math.min(100, v * 200)}%"></div></div>`
      )
      .join('');
  }

  private saveProfile(): void {
    if (this.validationTimer) clearInterval(this.validationTimer);
    const session = this.pipeline.getCalibrationSession();
    const id = `profile_${Date.now()}`;
    const profile = session.buildProfile(id, this.profileName);
    upsertProfile(profile);
    this.onComplete(profile);
    this.step = 'done';
    this.render();
  }
}
