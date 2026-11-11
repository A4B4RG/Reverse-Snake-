/** Tiny synthesized arcade sounds: no downloaded audio, tracking, or autoplay. */
export class GameAudio {
  private context: AudioContext | null = null;
  enabled = true;
  unlock() {
    if (!this.enabled) return;
    try {
      this.context ??= new AudioContext();
      if (this.context.state === "suspended") void this.context.resume().catch(() => {});
    } catch { /* Audio is optional on browsers without Web Audio. */ }
  }
  play(kind: "start" | "dash" | "won" | "lost" | "click") {
    if (!this.enabled || !this.context) return;
    try {
    const notes = { start: [330, 440, 660], dash: [220, 660], won: [392, 494, 587, 784], lost: [220, 165, 110], click: [440] }[kind];
    const context = this.context;
    notes.forEach((frequency, i) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + i * 0.085;
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.07, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.2);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    });
    } catch { /* Optional audio must never interrupt input or a terminal event. */ }
  }
  close() { void this.context?.close().catch(() => {}); }
}
