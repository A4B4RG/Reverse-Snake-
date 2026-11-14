"use client";
import { useEffect, useState } from "react";
import { effectiveFrameRate, isMobileDevice, setSettings, useSettings, type FrameRate } from "@/lib/settings";
import { syncMusic, unlockMusic } from "@/lib/music";

export function PlaySettings() {
  const settings = useSettings();
  const [capability, setCapability] = useState({ mobile: true, ninety: false });
  useEffect(() => {
    let frame = 0, previous = 0;
    const samples: number[] = [];
    const sample = (now: number) => {
      if (previous && now - previous > 0 && now - previous < 100) samples.push(now - previous);
      previous = now;
      if (samples.length < 40) frame = requestAnimationFrame(sample);
      else { const median = [...samples].sort((a,b) => a-b)[20]; setCapability({ mobile: isMobileDevice(), ninety: median <= 1000 / 85 }); }
    };
    frame = requestAnimationFrame(sample);
    return () => cancelAnimationFrame(frame);
  }, []);
  return <details className="play-settings-panel"><summary>Play settings</summary><fieldset className="play-settings"><legend className="sr-only">Play settings</legend>
    <label>Frame rate<select aria-label="Frame rate" value={effectiveFrameRate(settings.fps, capability.mobile, capability.ninety ? 90 : 60)} onChange={e => setSettings({ fps: Number(e.target.value) as FrameRate })}>
      <option value="30">30 FPS · Base</option><option value="60">60 FPS · Smooth</option>
      <option value="90" disabled={capability.mobile && !capability.ninety}>90 FPS · {capability.mobile && !capability.ninety ? "Display support required" : "Extra smooth"}</option>
      {!capability.mobile && <option value="120">120 FPS · Desktop</option>}
    </select></label>
    <p className="settings-note">Frame rate follows your display. Game speed stays the same.</p>
    <label>Touch sensitivity <output>{settings.sensitivity}/10</output><input aria-label="Touch sensitivity" type="range" min="1" max="10" value={settings.sensitivity} onChange={e => setSettings({ sensitivity: Number(e.target.value) })}/></label>
    <label className="music-setting">Jungle music<input aria-label="Jungle music" type="checkbox" checked={settings.music} onChange={e => { setSettings({ music: e.target.checked }); unlockMusic(); }}/></label>
    <label>Music volume <output>{settings.volume}%</output><input aria-label="Music volume" type="range" min="0" max="100" value={settings.volume} onChange={e => { setSettings({ volume: Number(e.target.value) }); syncMusic(); }}/></label>
  </fieldset></details>;
}
