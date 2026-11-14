"use client";
import { readSettings } from "./settings";
let track: HTMLAudioElement | null = null, unlocked = false;
export function syncMusic() {
  if (!unlocked || typeof Audio === "undefined") return;
  const settings = readSettings();
  try {
    track ??= Object.assign(new Audio("/audio/canopy-dawn.mp3"), { loop: true, preload: "none" });
    track.volume = settings.volume / 100;
    if (settings.music && !document.hidden) void track.play().catch(() => {});
    else track.pause();
  } catch {}
}
export function unlockMusic() { unlocked = true; syncMusic(); }
export function suspendMusic() { track?.pause(); }
