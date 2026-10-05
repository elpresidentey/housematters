// Saved homes persistence. Only call from the client (effects/handlers).
import { api, getToken } from './api';

const STORAGE_KEY = 'hm:saved-homes';

export function loadSavedHomes(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function persistSavedHomes(ids: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // Storage unavailable (private mode/quota): saving works for the session only.
  }
}

// Sync saved homes with backend when logged in
export async function syncSavedHomesFromBackend(): Promise<Set<string>> {
  const token = getToken();
  if (!token) return loadSavedHomes();
  try {
    const data = await api<{ savedHomes: Array<{ id: string }> }>('/saved-homes', { token });
    const ids = new Set(data.savedHomes.map((h) => h.id));
    persistSavedHomes(ids);
    return ids;
  } catch {
    return loadSavedHomes();
  }
}

export async function saveHomeToBackend(propertyId: string): Promise<boolean> {
  const token = getToken();
  if (!token) return false;
  try {
    await api('/saved-homes', { method: 'POST', body: { propertyId }, token });
    return true;
  } catch {
    return false;
  }
}

export async function removeHomeFromBackend(propertyId: string): Promise<boolean> {
  const token = getToken();
  if (!token) return false;
  try {
    await api(`/saved-homes/${propertyId}`, { method: 'DELETE', token });
    return true;
  } catch {
    return false;
  }
}
