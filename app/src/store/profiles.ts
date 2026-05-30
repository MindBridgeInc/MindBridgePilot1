import type { AppSettings, CalibrationProfile } from '../core/types';
import { createDefaultProfile, migrateProfile } from '../core/calibration';

const PROFILES_KEY = 'mindbridge_profiles';
const SETTINGS_KEY = 'mindbridge_settings';
const PROFILE_VERSION = 2;

function needsMigration(profile: CalibrationProfile): boolean {
  return profile.commands.some((c) => !c.featureVector || c.featureVector.length === 0);
}

export function loadProfiles(): CalibrationProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) return [];
    const profiles = JSON.parse(raw) as CalibrationProfile[];
    const migrated = profiles.map((p) => (needsMigration(p) ? migrateProfile(p) : p));
    if (migrated.some((p, i) => p !== profiles[i])) {
      saveProfiles(migrated);
    }
    return migrated;
  } catch {
    return [];
  }
}

export function saveProfiles(profiles: CalibrationProfile[]): void {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  localStorage.setItem(`${PROFILES_KEY}_version`, String(PROFILE_VERSION));
}

export function upsertProfile(profile: CalibrationProfile): void {
  const profiles = loadProfiles();
  const idx = profiles.findIndex((p) => p.id === profile.id);
  if (idx >= 0) profiles[idx] = profile;
  else profiles.push(profile);
  saveProfiles(profiles);
}

export function deleteProfile(id: string): void {
  saveProfiles(loadProfiles().filter((p) => p.id !== id));
}

export function getProfile(id: string): CalibrationProfile | null {
  return loadProfiles().find((p) => p.id === id) ?? null;
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return { inputSource: 'simulator', autoDemo: false, noiseInjection: false, activeProfileId: null };
    }
    return JSON.parse(raw) as AppSettings;
  } catch {
    return { inputSource: 'simulator', autoDemo: false, noiseInjection: false, activeProfileId: null };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function ensureDefaultProfile(): CalibrationProfile {
  const profiles = loadProfiles();
  const named = profiles.find((p) => p.name === 'MS Demo User');
  if (named) return named;
  if (profiles.length > 0) return profiles[0];
  const demo = createDefaultProfile('MS Demo User');
  upsertProfile(demo);
  return demo;
}
