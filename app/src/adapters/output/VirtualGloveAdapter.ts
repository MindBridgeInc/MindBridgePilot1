import type { OutputAdapter } from './OutputAdapter';
import type { CommandEvent, CommandId } from '../../core/types';

export type GloveState = CommandId;

const POSES: Record<GloveState, { fingers: number[]; thumb: number }> = {
  rest: { fingers: [0, 0, 0, 0], thumb: 20 },
  open_hand: { fingers: [75, 80, 78, 72], thumb: 45 },
  close_hand: { fingers: [8, 8, 8, 8], thumb: 55 },
  pinch: { fingers: [5, 5, 60, 55], thumb: 70 },
};

function lerpPose(from: GloveState, to: GloveState, t: number): { fingers: number[]; thumb: number } {
  const a = POSES[from];
  const b = POSES[to];
  return {
    fingers: a.fingers.map((v, i) => v + (b.fingers[i] - v) * t),
    thumb: a.thumb + (b.thumb - a.thumb) * t,
  };
}

export class VirtualGloveAdapter implements OutputAdapter {
  readonly id = 'virtual_glove';
  readonly label = 'Virtual Assistive Glove';
  connected = false;

  private previewCommand: GloveState = 'rest';
  private previewConfidence = 0;
  private firedCommand: GloveState | null = null;
  private firedAt = 0;
  private lastEvent: CommandEvent | null = null;
  private container: HTMLElement | null = null;
  private onStateChange: ((state: GloveState, event: CommandEvent | null) => void) | null = null;

  /** Smooth visual blend between poses */
  private displayPose = { fingers: [...POSES.rest.fingers], thumb: POSES.rest.thumb };
  private animFrame: number | null = null;

  setContainer(el: HTMLElement): void {
    this.container = el;
    this.renderDom();
  }

  setOnStateChange(cb: (state: GloveState, event: CommandEvent | null) => void): void {
    this.onStateChange = cb;
  }

  getPreviewCommand(): GloveState {
    return this.previewCommand;
  }

  getLastEvent(): CommandEvent | null {
    return this.lastEvent;
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.previewCommand = 'rest';
    this.firedCommand = null;
  }

  /** Live intent preview — updates every pipeline tick */
  setPreview(command: CommandId, confidence: number): void {
    if (!this.connected) return;
    this.previewCommand = command;
    this.previewConfidence = confidence;
    this.animateTowardTarget();
  }

  send(event: CommandEvent): void {
    if (!this.connected) return;
    this.firedCommand = event.commandId;
    this.firedAt = Date.now();
    this.lastEvent = event;
    this.onStateChange?.(event.commandId, event);
    this.animateTowardTarget();
  }

  getStatus(): string {
    return this.connected
      ? `Preview: ${this.previewCommand.replace('_', ' ')}`
      : 'Disconnected';
  }

  renderDom(): void {
    if (!this.container) return;
    if (this.container.querySelector('.glove-svg')) {
      this.updateSvgPaths();
      return;
    }

    this.container.innerHTML = `
      <div class="glove-stage">
        <svg viewBox="0 0 160 140" class="glove-svg" aria-label="Virtual assistive glove">
          <path class="glove-palm" d="M 30 100 Q 80 115 130 100 L 125 55 Q 80 40 35 55 Z" fill="var(--surface-2)" stroke="currentColor" stroke-width="2"/>
          <path class="glove-finger" data-finger="0" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
          <path class="glove-finger" data-finger="1" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
          <path class="glove-finger" data-finger="2" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
          <path class="glove-finger" data-finger="3" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
          <path class="glove-thumb" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
        </svg>
        <div class="glove-fired-ring" aria-hidden="true"></div>
      </div>
      <div class="glove-legend">
        <span class="glove-legend-preview">Preview: <strong id="glove-preview-label">Rest</strong></span>
        <span class="glove-legend-fired">Sent: <strong id="glove-fired-label">—</strong></span>
      </div>
    `;
    this.updateSvgPaths();
  }

  private animateTowardTarget(): void {
    if (this.animFrame !== null) return;

    const step = () => {
      const targetPose = POSES[this.previewCommand];
      const blend = 0.08 + this.previewConfidence * 0.12;
      let settled = true;

      this.displayPose.fingers = this.displayPose.fingers.map((v, i) => {
        const next = v + (targetPose.fingers[i] - v) * blend;
        if (Math.abs(next - targetPose.fingers[i]) > 0.5) settled = false;
        return next;
      });
      const thumbNext = this.displayPose.thumb + (targetPose.thumb - this.displayPose.thumb) * blend;
      if (Math.abs(thumbNext - targetPose.thumb) > 0.5) settled = false;
      this.displayPose.thumb = thumbNext;

      this.updateSvgPaths();

      const firedRing = this.container?.querySelector('.glove-fired-ring') as HTMLElement | null;
      if (firedRing && this.firedCommand && Date.now() - this.firedAt < 500) {
        firedRing.classList.add('pulse');
      } else if (firedRing) {
        firedRing.classList.remove('pulse');
      }

      const previewLabel = this.container?.querySelector('#glove-preview-label');
      if (previewLabel) {
        previewLabel.textContent = this.previewCommand.replace(/_/g, ' ');
      }
      const firedLabel = this.container?.querySelector('#glove-fired-label');
      if (firedLabel && this.lastEvent) {
        firedLabel.textContent = `${this.lastEvent.label} (${Math.round(this.lastEvent.confidence * 100)}%)`;
      }

      if (!settled) {
        this.animFrame = requestAnimationFrame(step);
      } else {
        this.animFrame = null;
      }
    };

    this.animFrame = requestAnimationFrame(step);
  }

  private updateSvgPaths(): void {
    if (!this.container) return;
    const pose = this.displayPose;

    for (let i = 0; i < 4; i++) {
      const el = this.container.querySelector(`[data-finger="${i}"]`) as SVGPathElement | null;
      if (!el) continue;
      const x = 48 + i * 22;
      const curl = pose.fingers[i];
      const tipY = 30 + curl * 0.55;
      const midY = 55 + curl * 0.35;
      el.setAttribute('d', `M ${x} 95 Q ${x - 4} ${midY} ${x} ${tipY}`);
    }

    const thumb = this.container.querySelector('.glove-thumb') as SVGPathElement | null;
    if (thumb) {
      const thumbX = 18 + pose.thumb * 0.15;
      const thumbY = 70 - pose.thumb * 0.2;
      thumb.setAttribute('d', `M 28 88 Q ${thumbX} ${thumbY} 42 52`);
    }
  }
}
