import './styles/main.css';
import { VirtualGloveAdapter } from './adapters/output/VirtualGloveAdapter';
import { Pipeline } from './core/pipeline';
import { InputManager } from './core/inputManager';
import type { CalibrationProfile, InputSource } from './core/types';
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
      <span class="brand-mark">MB</span>
      <div>
        <h1>MindBridge</h1>
        <p class="tagline">Intent translation for assistive technology</p>
      </div>
    </div>
    <nav class="main-nav" id="main-nav">
      <button data-view="dashboard" class="nav-btn active">Dashboard</button>
      <button data-view="calibrate" class="nav-btn">Calibrate</button>
      <button data-view="profiles" class="nav-btn">Profiles</button>
      <button data-view="devices" class="nav-btn">Devices</button>
      <button data-view="about" class="nav-btn">About</button>
    </nav>
    <div class="header-status">
      <span class="status-dot" id="status-dot"></span>
      <span id="header-profile">${activeProfile.name}</span>
      <span id="header-input" class="header-input-label"></span>
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

function ensureViewMounted(view: View): void {
  switch (view) {
    case 'dashboard':
      if (!dashboard) {
        dashboard = new Dashboard(viewPanes.dashboard, (container) => {
          glove.setContainer(container);
          glove.renderDom();
        });
        dashboard.update(pipeline.getState(), pipeline.getCommandLog(), activeProfile, pipeline.getInputMetrics());
      }
      break;
    case 'calibrate':
      calibrationWizard?.destroy();
      calibrationWizard = new CalibrationWizard(
        viewPanes.calibrate,
        pipeline,
        inputManager.simulator,
        (profile) => {
          activeProfile = profile;
          pipeline.setProfile(profile);
          settings.activeProfileId = profile.id;
          saveSettings(settings);
          updateHeader();
        }
      );
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
            onInputSourceChange: (source) => void switchInputSource(source),
            onConnectBle: () => connectHardware('bluetooth'),
            onConnectSerial: () => connectHardware('serial'),
            onDisconnectHardware: () => disconnectHardware(),
          }
        );
      } else {
        devicePanel.updateSource(settings.inputSource);
      }
      devicePanel.setInputMetrics(pipeline.getInputMetrics());
      break;
    case 'about':
      renderAbout(viewPanes.about);
      break;
  }
}

async function switchInputSource(source: InputSource): Promise<void> {
  settings.inputSource = source;
  saveSettings(settings);

  if (source === 'simulator') {
    await disconnectHardware();
    await pipeline.setInputAdapter(inputManager.simulator);
    inputManager.simulator.setAutoDemo(settings.autoDemo);
    inputManager.simulator.setNoiseInjection(settings.noiseInjection);
  }

  devicePanel?.updateSource(source);
  updateHeader();
}

async function connectHardware(source: 'bluetooth' | 'serial'): Promise<void> {
  try {
    inputManager.simulator.setAutoDemo(false);
    const adapter = await inputManager.connectHardware(source);
    await pipeline.setInputAdapter(adapter);
    settings.inputSource = source;
    saveSettings(settings);
    updateHeader();
  } catch (err) {
    alert(err instanceof Error ? err.message : 'Connection failed');
  }
}

async function disconnectHardware(): Promise<void> {
  await inputManager.bluetooth.disconnect().catch(() => {});
  await inputManager.serial.disconnect().catch(() => {});
  if (settings.inputSource === 'simulator') {
    await pipeline.setInputAdapter(inputManager.simulator);
  }
  updateHeader();
}

function renderProfiles(root: HTMLElement): void {
  const profiles = loadProfiles();
  root.innerHTML = `
    <div class="profiles-layout">
      <section class="panel">
        <h2>User Profiles</h2>
        <p class="hint">Each profile stores baseline, gain, and trained command templates for a specific user.</p>
        <ul class="profile-list">
          ${profiles
            .map(
              (p) => `
            <li class="profile-item ${p.id === activeProfile.id ? 'active' : ''}">
              <div>
                <strong>${p.name}</strong>
                <span>Gain ${p.gain.toFixed(2)}× · Updated ${new Date(p.updatedAt).toLocaleDateString()}</span>
              </div>
              <div class="profile-actions">
                <button class="btn btn-secondary btn-sm" data-select="${p.id}">Activate</button>
                <button class="btn btn-danger btn-sm" data-delete="${p.id}">Delete</button>
              </div>
            </li>
          `
            )
            .join('')}
        </ul>
        <button class="btn btn-primary" id="create-demo-profile">Create demo profile</button>
      </section>
    </div>
  `;

  root.querySelectorAll('[data-select]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = (btn as HTMLElement).dataset.select!;
      const profile = loadProfiles().find((p) => p.id === id);
      if (profile) activateProfile(profile);
      renderProfiles(root);
    });
  });

  root.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = (btn as HTMLElement).dataset.delete!;
      if (loadProfiles().length <= 1) {
        alert('Keep at least one profile.');
        return;
      }
      deleteProfile(id);
      if (activeProfile.id === id) activateProfile(ensureDefaultProfile());
      renderProfiles(root);
    });
  });

  root.querySelector('#create-demo-profile')?.addEventListener('click', () => {
    const profile = createDefaultProfile(`Profile ${loadProfiles().length + 1}`);
    upsertProfile(profile);
    activateProfile(profile);
    renderProfiles(root);
  });
}

function renderAbout(root: HTMLElement): void {
  root.innerHTML = `
    <article class="about panel">
      <h2>About MindBridge</h2>
      <p>MindBridge maps wristband pressure micro-signals into commands for assistive devices — a universal compatibility layer between human intent and hardware.</p>
      <h3>Hardware setup</h3>
      <p>Firmware should emit one JSON line per reading:</p>
      <code>{ "t": 1717000000, "sensors": [0.12, 0.08, 0.31, 0.05, 0.19, 0.11] }</code>
      <p>BLE: MindBridge GATT service or Nordic UART. Serial: 115200 baud.</p>
      <h3>Demo script</h3>
      <ol>
        <li>Activate a profile under Profiles</li>
        <li>Devices → enable Auto-demo → Dashboard</li>
        <li>Watch live preview drive the glove; sent commands appear separately</li>
        <li>Calibrate → validate → save a custom profile</li>
      </ol>
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
  if (inputEl) inputEl.textContent = pipeline.getInputMetrics().sourceLabel;
  const dot = document.getElementById('status-dot');
  if (dot) {
    dot.className = `status-dot ${pipeline.getInputMetrics().connected ? 'online' : ''}`;
  }
}

document.getElementById('main-nav')!.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('.nav-btn') as HTMLElement | null;
  if (!btn?.dataset.view) return;
  setView(btn.dataset.view as View);
});

inputManager.simulator.setAutoDemo(settings.autoDemo);
inputManager.simulator.setNoiseInjection(settings.noiseInjection);

pipeline.onUpdate((state, _events) => {
  const metrics = pipeline.getInputMetrics();
  if (dashboard) {
    dashboard.update(state, pipeline.getCommandLog(), activeProfile, metrics);
  }
  if (devicePanel && currentView === 'devices') {
    devicePanel.setInputMetrics(metrics);
    if (inputManager.simulator.isAutoDemo() && settings.inputSource === 'simulator') {
      devicePanel.refreshSliders();
    }
  }
  updateHeader();
});

async function init(): Promise<void> {
  if (settings.inputSource === 'simulator') {
    await pipeline.setInputAdapter(inputManager.simulator);
  }
  await pipeline.start();
  setView('dashboard');
}

void init();
