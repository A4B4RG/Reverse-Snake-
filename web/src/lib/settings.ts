"use client";
import { useSyncExternalStore } from "react";
export type FrameRate = 30 | 60 | 90 | 120;
export type Settings = { fps: FrameRate; sensitivity: number; music: boolean; volume: number };
const KEY = "reverse-snake:settings:v1";
const DEFAULT: Settings = { fps: 30, sensitivity: 5, music: true, volume: 45 };
let cached: Settings = DEFAULT, loaded = false;
const listeners = new Set<() => void>();
export function readSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT;
  if (!loaded) {
    loaded = true;
    try {
      const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
      if (v && typeof v === "object") cached = { fps: [30,60,90,120].includes(v.fps) ? v.fps : 30, sensitivity: Number.isFinite(v.sensitivity) ? Math.max(1, Math.min(10, v.sensitivity)) : 5, music: typeof v.music === "boolean" ? v.music : true, volume: Number.isFinite(v.volume) ? Math.max(0, Math.min(100, v.volume)) : 45 };
    } catch {}
  }
  return cached;
}
export function setSettings(change: Partial<Settings>) {
  cached = { ...readSettings(), ...change };
  try { localStorage.setItem(KEY, JSON.stringify(cached)); } catch {}
  listeners.forEach(l => l());
}
function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function useSettings() { return useSyncExternalStore(subscribe, readSettings, () => DEFAULT); }
export const touchThreshold = (sensitivity: number) => 48 - Math.max(1, Math.min(10, sensitivity)) * 3.6;
export const effectiveFrameRate = (requested: FrameRate, mobile: boolean, displayHz: number): FrameRate =>
  mobile && requested > 60 ? displayHz >= 85 ? 90 : 60 : requested;
export const isMobileDevice = () => matchMedia("(pointer: coarse)").matches || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
