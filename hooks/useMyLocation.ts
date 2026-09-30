import * as Location from 'expo-location';
import { useEffect, useSyncExternalStore } from 'react';

export type Coords = { lat: number; lng: number };
type State = { coords: Coords | null; precise: boolean; city: string | null; ready: boolean };

// One location fix shared by every map, so they all open on the user and a
// second map opens there instantly. Same strategy the finder always used: an
// IP estimate first (fast, no prompt), then last-known GPS, then a fresh fix.
let state: State = { coords: null, precise: false, city: null, ready: false };
const subscribers = new Set<() => void>();
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  subscribers.forEach((fn) => fn());
};

let started = false;
function start() {
  if (started) return;
  started = true;
  (async () => {
    try {
      const j = await fetch('https://ipwho.is/').then((r) => r.json());
      if (j?.success && j.latitude && !state.precise) set({ coords: { lat: j.latitude, lng: j.longitude }, city: j.city ?? null });
    } catch {}
    set({ ready: true });
  })();
  locatePrecisely();
}

// Asks for permission if needed and resolves with the best fix available.
export async function locatePrecisely(): Promise<Coords | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return state.coords;
    const last = await Location.getLastKnownPositionAsync();
    if (last && !state.precise) set({ coords: { lat: last.coords.latitude, lng: last.coords.longitude }, ready: true });
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    set({ coords, precise: true, ready: true });
    return coords;
  } catch {
    return state.coords;
  }
}

const subscribe = (fn: () => void) => {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
};

export function useMyLocation() {
  useEffect(start, []);
  return useSyncExternalStore(subscribe, () => state, () => state);
}
