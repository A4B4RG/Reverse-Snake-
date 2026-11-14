"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
export const THEME_KEY = "reverse-snake:theme:v1";
const CHANGE_EVENT = "reverse-snake:theme-change";

export function getTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#091f25" : "#f4f6ed");
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function setTheme(theme: Theme): boolean {
  applyTheme(theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
    return true;
  } catch {
    return false;
  }
}

function subscribe(onChange: () => void) {
  const storage = (event: StorageEvent) => {
    if (event.key === THEME_KEY || event.key === null) applyTheme(event.newValue === "dark" ? "dark" : "light");
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", storage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", storage);
  };
}

export function useTheme() {
  return useSyncExternalStore(subscribe, getTheme, (): Theme => "light");
}
