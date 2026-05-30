import './styles/main.css';
import { VirtualGloveAdapter } from './adapters/output/VirtualGloveAdapter';
import { Pipeline } from './core/pipeline';
import { InputManager } from './core/inputManager';
import type { CalibrationProfile } from './core/types';
import {
  deleteProfile,
  ensureDefaultProfile,
  loadProfiles,
  loadSettings,
  saveSettings,
  upsertProfile,
} from './store/profiles';
import { createDefaultProfile } from './core/calibration';
import { Dashboard } from './ui/dashboard';
import { CalibrationWizard } from './ui/calibrationWizard';
import { DevicePanel } from './ui/devicePanel';

type View = 'dashboard' | 'calibrate' | 'profiles' | 'devices' | 'about';

const inputManager = new InputManager();
const glove = new VirtualGloveAdapter();
const pipeline = new Pipeline(inputManager.simulator, glove);

let settings = loadSettings();
let activeProfile = ensureDefaultProfile();
if (settings.activeProfileId) {
  const found = loadProfiles().find((p) => p.id === settings.activeProfileId);
  if (found) activeProfile = found;
}
pipeline.setProfile(activeProfile);

let currentView: View = 'dashboard';
let dashboard: Dashboard | null = null;
let calibrationWizard: CalibrationWizard | null = null;
let devicePanel: DevicePanel | null = null;

const app = document.getElementById('app')!;
app.innerHTML = `
  <header class="app-header">
    <div class="brand">
      <h1>MindBridge</h1>
    </div>
    <nav class="main-nav" id="main-nav">
      <button type="button" data-view="dashboard" class="nav-btn active">Dashboard</button>
      <button type="button" data-view="calibrate" class="nav-btn">Calibrate</button>
      <button type="button" data-view="profiles" class="nav-btn">Profiles</button>
      <button type="button" data-view="devices" class="nav-btn">Input</button>
      <button type="button" data-view="about" class="nav-btn">Guide</button>
    </nav>
    <div class="header-meta">
      <span class="meta-item"><span class="meta-label">Profile</span> <strong id="header-profile">${activeProfile.name}</strong></span>
      <span class="meta-item"><span class="meta-label">Input</span> <strong id="header-input">—</strong></span>
    </div>
  </header>
  <main class="app-main" id="app-main">
    <div id="view-dashboard" class="view-pane"></div>
    <div id="view-calibrate" class="view-pane hidden"></div>
    <div id="view-profiles" class="view-pane hidden"></div>
    <div id="view-devices" class="view-pane hidden"></div>
    <div id="view-about" class="view-pane hidden"></div>
  </main>
`;

const viewPanes: Record<View, HTMLElement> = {
  dashboard: document.getElementById('view-dashboard')!,
  calibrate: document.getElementById('view-calibrate')!,
  profiles: document.getElementById('view-profiles')!,
  devices: document.getElementById('view-devices')!,
  about: document.getElementById('view-about')!,
};

function setView(view: View): void {
  currentView = view;
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.view === view);
  });
  Object.entries(viewPanes).forEach(([key, pane]) => {
    pane.classList.toggle('hidden', key !== view);
  });
  ensureViewMounted(view);
}

function mountCalibrationWizard(): void {
  calibrationWizard?.destroy();
  calibrationWizard = new CalibrationWizard(
    viewPanes.calibrate,
    pipeline,
    inputManager,
    inputManager.simulator,
    {
      getActiveProfile: () => activeProfile,
      onComplete: (profile) => {
        activeProfile = profile;
        pipeline.setProfile(profile);
        settings.activeProfileId = profile.id;
        saveSettings(settings);
        updateHeader();
      },
      onInputWarning: (msg) => {
        console.warn(msg);
      },
    }
  );
}

function mountCalibrationForProfile(profile: CalibrationProfile): void {
  mountCalibrationWizard();
  calibrationWizard?.startRecalibrate(profile);
}

function ensureViewMounted(view: View): void {
  switch (view) {
    case 'dashboard':
      if (!dashboard) {
        dashboard = new Dashboard(viewPanes.dashboard, (container) => {
          glove.setContainer(container);
          glove.renderDom();
        });
      }
      dashboard.update(pipeline.getState(), pipeline.getCommandLog(), activeProfile, pipeline.getInputMetrics());
      break;
    case 'calibrate':
      mountCalibrationWizard();
      break;
    case 'profiles':
      renderProfiles(viewPanes.profiles);
      break;
    case 'devices':
      if (!devicePanel) {
        devicePanel = new DevicePanel(
          viewPanes.devices,
          inputManager.simulator,
          inputManager.bluetooth,
          inputManager.serial,
          settings.inputSource,
          {
            onSettingsChange: (key, value) => {
              settings = { ...settings, [key]: value };
              saveSettings(settings);
            },
            onUseSimulator: async () => {
              const adapter = await inputManager.useSimulator();
              await pipeline.setInputAdapter(adapter);
              settings.inputSource = 'simulator';
              inputManager.simulator.setAutoDemo(settings.autoDemo);
              inputManager.simulator.setNoiseInjection(settings.noiseInjection);
              saveSettings(settings);
              devicePanel?.updateSource('simulator');
              updateHeader();
            },
            onConnectBle: async () => {
              inputManager.simulator.setAutoDemo(false);
              const adapter = await inputManager.connectBluetooth();
              await pipeline.setInputAdapter(adapter);
              settings.inputSource = 'bluetooth';
              saveSettings(settings);
              devicePanel?.updateSource('bluetooth');
              devicePanel?.setError('');
              updateHeader();
            },
            onConnectSerial: async () => {
              inputManager.simulator.setAutoDemo(false);
              const adapter = await inputManager.connectSerial();
              await pipeline.setInputAdapter(adapter);
              settings.inputSource = 'serial';
              saveSettings(settings);
              devicePanel?.updateSource('serial');
              devicePanel?.setError('');
              updateHeader();
            },
            onDisconnectHardware: async () => {
              await inputManager.disconnectHardware();
              const adapter = await inputManager.useSimulator();
              await pipeline.setInputAdapter(adapter);
              settings.inputSource = 'simulator';
              saveSettings(settings);
              devicePanel?.updateSource('simulator');
              updateHeader();
            },
          }
        );
      } else {
        devicePanel.refresh();
      }
      devicePanel.setInputMetrics(pipeline.getInputMetrics());
      break;
    case 'about':
      renderAbout(viewPanes.about);
      break;
  }
}

function renderProfiles(root: HTMLElement): void {
  const profiles = loadProfiles();
  root.innerHTML = `
    <section class="panel profiles-panel">
      <h2>Profiles</h2>
      <p class="lead">Each profile stores a rest baseline and trained gestures for one user. Switch profiles when a different person uses MindBridge.</p>
      <ul class="profile-list">
        ${profiles
          .map((p) => {
            const isActive = p.id === activeProfile.id;
            const trained = p.commands.filter((c) => c.id !== 'rest' && c.samples.length > 0).length;
            return `
          <li class="profile-item ${isActive ? 'active' : ''}">
            <div class="profile-info">
              <strong>${p.name}</strong>
              ${isActive ? '<span class="profile-badge">Active</span>' : ''}
              <span class="profile-detail">Gain ${p.gain.toFixed(1)}× · ${trained} gestures · ${new Date(p.updatedAt).toLocaleDateString()}</span>
            </div>
            <div class="profile-actions">
              ${!isActive ? `<button type="button" class="btn btn-secondary btn-sm" data-select="${p.id}">Activate</button>` : ''}
              <button type="button" class="btn btn-secondary btn-sm" data-recal="${p.id}">Recalibrate</button>
              <button type="button" class="btn btn-danger btn-sm" data-delete="${p.id}">Delete</button>
            </div>
          </li>`;
          })
          .join('')}
      </ul>
      <div class="wizard-actions">
        <button type="button" class="btn btn-primary" id="new-calibration">New calibration</button>
        <button type="button" class="btn btn-secondary" id="create-demo-profile">Add demo profile</button>
      </div>
    </section>
  `;

  root.querySelectorAll('[data-select]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = (btn as HTMLElement).dataset.select!;
      const profile = loadProfiles().find((p) => p.id === id);
      if (profile) {
        activateProfile(profile);
        renderProfiles(root);
      }
    });
  });

  root.querySelectorAll('[data-recal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = (btn as HTMLElement).dataset.recal!;
      const profile = loadProfiles().find((p) => p.id === id);
      if (profile) {
        activateProfile(profile);
        setView('calibrate');
        mountCalibrationForProfile(profile);
      }
    });
  });

  root.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = (btn as HTMLElement).dataset.delete!;
      if (loadProfiles().length <= 1) {
        alert('At least one profile must remain.');
        return;
      }
      if (!confirm('Delete this profile?')) return;
      deleteProfile(id);
      if (activeProfile.id === id) activateProfile(ensureDefaultProfile());
      renderProfiles(root);
    });
  });

  root.querySelector('#new-calibration')?.addEventListener('click', () => setView('calibrate'));
  root.querySelector('#create-demo-profile')?.addEventListener('click', () => {
    const profile = createDefaultProfile(`Demo ${loadProfiles().length + 1}`);
    upsertProfile(profile);
    activateProfile(profile);
    renderProfiles(root);
  });
}

function renderAbout(root: HTMLElement): void {
  root.innerHTML = `
    <article class="guide panel">
      <h2>Operating MindBridge</h2>
      <p class="lead">MindBridge reads pressure from a wristband, interprets your intended hand gesture, and sends commands to an assistive device (shown here as a virtual glove).</p>

      <section class="guide-section">
        <h3>1. Connect input</h3>
        <p>Go to <strong>Input</strong> and choose your source:</p>
        <ul>
          <li><strong>Pressure Simulator</strong> — for testing without hardware. Enable auto-demo to cycle gestures automatically.</li>
          <li><strong>BLE Wristband</strong> — pair via Web Bluetooth (Chrome/Edge). Firmware must broadcast JSON sensor packets.</li>
          <li><strong>Serial / USB</strong> — connect an Arduino or similar at 115200 baud.</li>
        </ul>
        <p>Confirm <em>Data flowing</em> appears before calibrating.</p>
      </section>

      <section class="guide-section">
        <h3>2. Calibrate</h3>
        <ol>
          <li>Open <strong>Calibrate</strong> → start a new profile or recalibrate an existing one.</li>
          <li><strong>Rest baseline</strong> — relax your hand for 6 seconds.</li>
          <li><strong>Train</strong> — hold each gesture (open hand, close hand, pinch) for 4 seconds while recording.</li>
          <li><strong>Verify</strong> — perform each gesture naturally; MindBridge scores recognition quality.</li>
        </ol>
        <p>Recalibrate whenever symptoms change or recognition drifts. Use Profiles → Recalibrate on any saved profile.</p>
      </section>

      <section class="guide-section">
        <h3>3. Operate</h3>
        <p>On the <strong>Dashboard</strong>:</p>
        <ul>
          <li><strong>Live preview</strong> — what MindBridge thinks you intend right now (drives the glove animation).</li>
          <li><strong>Command sent</strong> — a confirmed command after a stable match (debounced, sent to the assistive device).</li>
          <li>Raw and filtered sensor charts show what the algorithm sees.</li>
        </ul>
      </section>

      <section class="guide-section">
        <h3>4. Firmware packet format</h3>
        <p>Send one JSON object per line. Six sensor values, each 0.0–1.0:</p>
        <pre class="code-block">{"t":1717000000,"sensors":[0.12,0.08,0.31,0.05,0.19,0.11]}</pre>
        <p>BLE: MindBridge GATT service or Nordic UART. Serial: 115200 baud, newline-delimited.</p>
      </section>

      <section class="guide-section">
        <h3>5. Profiles</h3>
        <p>Each user needs their own profile. Activate the correct profile before a session. Demo profiles use pre-recorded patterns for presentations only.</p>
      </section>
    </article>
  `;
}

function activateProfile(profile: CalibrationProfile): void {
  activeProfile = profile;
  pipeline.setProfile(profile);
  settings.activeProfileId = profile.id;
  saveSettings(settings);
  updateHeader();
}

function updateHeader(): void {
  const profileEl = document.getElementById('header-profile');
  if (profileEl) profileEl.textContent = activeProfile.name;
  const inputEl = document.getElementById('header-input');
  if (inputEl) inputEl.textContent = inputManager.displayLabel();
}

document.getElementById('main-nav')!.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('.nav-btn') as HTMLElement | null;
  if (!btn?.dataset.view) return;
  setView(btn.dataset.view as View);
});

inputManager.bluetooth.setOnDisconnect(async () => {
  if (settings.inputSource === 'bluetooth') {
    await inputManager.useSimulator();
    await pipeline.setInputAdapter(inputManager.simulator);
    settings.inputSource = 'simulator';
    saveSettings(settings);
    devicePanel?.updateSource('simulator');
    updateHeader();
  }
});

inputManager.simulator.setAutoDemo(settings.autoDemo);
inputManager.simulator.setNoiseInjection(settings.noiseInjection);

pipeline.onUpdate((state) => {
  const metrics = pipeline.getInputMetrics();
  if (dashboard) {
    dashboard.update(state, pipeline.getCommandLog(), activeProfile, metrics);
  }
  if (devicePanel && currentView === 'devices') {
    devicePanel.setInputMetrics(metrics);
    if (inputManager.getSource() === 'simulator' && inputManager.simulator.isAutoDemo()) {
      devicePanel.refreshSliders();
    }
  }
  updateHeader();
});

async function init(): Promise<void> {
  await inputManager.useSimulator();
  await pipeline.setInputAdapter(inputManager.simulator);
  await pipeline.start();
  updateHeader();
  setView('dashboard');
}

void init();
