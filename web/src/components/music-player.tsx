"use client";
import { useEffect } from "react";
import { useSettings } from "@/lib/settings";
import { syncMusic, suspendMusic } from "@/lib/music";
export function MusicPlayer() {
  const settings = useSettings();
  useEffect(() => { syncMusic(); }, [settings]);
  useEffect(() => { const changed = () => document.hidden ? suspendMusic() : syncMusic(); document.addEventListener("visibilitychange", changed); return () => document.removeEventListener("visibilitychange", changed); }, []);
  return null;
}
