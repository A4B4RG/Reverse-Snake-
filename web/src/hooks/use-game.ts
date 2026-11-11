"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createGame, dash as dashGame, STEP_MS, step, steer as steerGame, type Difficulty, type Direction, type GameMode, type GameState } from "@/lib/game";
import { DEFAULT_DATA, readSavedData, recordRun, saveData, type SavedData } from "@/lib/storage";
import { GameAudio } from "@/lib/audio";

export function useGame() {
  const gameRef = useRef<GameState>(createGame());
  const directionRef = useRef<Direction | null>(null);
  const dataRef = useRef<SavedData>(DEFAULT_DATA);
  const audioRef = useRef<GameAudio | null>(null);
  const [game, setGame] = useState<GameState>(createGame);
  const [data, setData] = useState<SavedData>(DEFAULT_DATA);
  const [storageAvailable, setStorageAvailable] = useState(true);

  const commit = useCallback((next: GameState) => {
    gameRef.current = next;
    setGame(next);
  }, []);

  const persist = useCallback((next: SavedData) => {
    dataRef.current = next;
    setData(next);
    setStorageAvailable(saveData(next));
  }, []);

  const endRound = useCallback((next: GameState) => {
    directionRef.current = null;
    // Publish the outcome before optional side effects can fail.
    setGame(next);
    audioRef.current?.play(next.phase === "won" ? "won" : "lost");
    try { persist(recordRun(dataRef.current, next)); }
    catch { setStorageAvailable(false); }
  }, [persist]);

  useEffect(() => {
    const audio = new GameAudio();
    audioRef.current = audio;
    let frame = 0;
    let previous = 0;
    let accumulator = 0;
    let lastUi = 0;
    const animate = (now: number) => {
      if (!previous) {
        const saved = readSavedData();
        dataRef.current = saved;
        setData(saved);
        audio.enabled = saved.sound;
        commit(createGame(0, saved.difficulty));
        previous = now;
      }
      const delta = Math.min(200, now - previous);
      previous = now;
      if (gameRef.current.phase === "running") {
        accumulator += delta;
        while (accumulator >= STEP_MS && gameRef.current.phase === "running") {
          const next = step(gameRef.current, directionRef.current);
          gameRef.current = next;
          accumulator -= STEP_MS;
          if (next.phase === "won" || next.phase === "lost") {
            endRound(next);
            setGame(next);
          }
        }
        if (now - lastUi > 80) { setGame(gameRef.current); lastUi = now; }
      } else accumulator = 0;
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    const suspend = () => {
      directionRef.current = null;
      if (gameRef.current.phase === "running") commit({ ...gameRef.current, pendingDirection: null, phase: "paused" });
    };
    const visibility = () => { if (document.hidden) suspend(); };
    window.addEventListener("blur", suspend);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("blur", suspend);
      document.removeEventListener("visibilitychange", visibility);
      audio.close();
      audioRef.current = null;
    };
  }, [commit, endRound]);

  const start = useCallback(() => {
    audioRef.current?.unlock();
    audioRef.current?.play("start");
    directionRef.current = null;
    commit({ ...createGame(gameRef.current.arena, gameRef.current.difficulty, gameRef.current.mode), phase: "running" });
  }, [commit]);

  const pause = useCallback(() => {
    if (gameRef.current.phase !== "running") return;
    directionRef.current = null;
    commit({ ...gameRef.current, pendingDirection: null, phase: "paused" });
  }, [commit]);

  const resume = useCallback(() => {
    if (gameRef.current.phase !== "paused") return;
    directionRef.current = null;
    commit({ ...gameRef.current, pendingDirection: null, phase: "running" });
  }, [commit]);

  const dash = useCallback(() => {
    const previous = gameRef.current;
    const next = dashGame(previous, directionRef.current);
    if (next === previous) return;
    audioRef.current?.play("dash");
    commit(next);
    if (next.phase === "lost") endRound(next);
  }, [commit, endRound]);

  const configure = useCallback((arena: number, difficulty: Difficulty, mode: GameMode = gameRef.current.mode) => {
    if (gameRef.current.phase === "running" || gameRef.current.phase === "paused") return;
    directionRef.current = null;
    commit(createGame(arena, difficulty, mode));
    persist({ ...dataRef.current, difficulty });
  }, [commit, persist]);

  const steer = useCallback((direction: Direction) => {
    if (gameRef.current.phase !== "running") return;
    directionRef.current = direction;
    const next = steerGame(gameRef.current, direction);
    commit(next);
  }, [commit]);

  const clearDirection = useCallback(() => {
    directionRef.current = null;
    gameRef.current = { ...gameRef.current, pendingDirection: null };
  }, []);

  const clearScores = useCallback(() => {
    persist({ ...dataRef.current, runs: [], attempts: 0, wins: 0, best: 0 });
  }, [persist]);

  const quit = useCallback(() => {
    directionRef.current = null;
    commit(createGame(gameRef.current.arena, gameRef.current.difficulty, gameRef.current.mode));
  }, [commit]);

  const toggleSound = useCallback(() => {
    const enabled = !dataRef.current.sound;
    if (audioRef.current) {
      audioRef.current.enabled = enabled;
      if (enabled) { audioRef.current.unlock(); audioRef.current.play("click"); }
    }
    persist({ ...dataRef.current, sound: enabled });
  }, [persist]);

  return { game, gameRef, directionRef, data, storageAvailable, start, pause, resume, dash, steer, clearDirection, configure, quit, toggleSound, clearScores };
}
