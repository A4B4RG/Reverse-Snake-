"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createGame,
  resizeGame,
  dash as dashGame,
  STEP_MS,
  step,
  steer as steerGame,
  type Difficulty,
  type Direction,
  type GameMode,
  type GameState,
} from "@/lib/game";
import {
  DEFAULT_DATA,
  readSavedData,
  recordRun,
  saveData,
  type SavedData,
} from "@/lib/storage";
import { GameAudio } from "@/lib/audio";
import {
  Recorder,
  ReplayCursor,
  compatibleGhost,
  readReplays,
  saveReplay,
  readPreview,
  savePreview,
  type Replay,
} from "@/lib/replay";

import { readLearning, saveLearning } from "@/lib/learning";
import {
  readAppearance,
  saveAppearance,
  type Appearance,
} from "@/lib/appearance";
import type { Board } from "@/lib/board";

export function useGame(ghostEnabled = false) {
  const gameRef = useRef<GameState>(createGame());
  const directionRef = useRef<Direction | null>(null);
  const dataRef = useRef<SavedData>(DEFAULT_DATA);
  const audioRef = useRef<GameAudio | null>(null);
  const recorderRef = useRef<Recorder | null>(null);
  const ghostCursor = useRef<ReplayCursor | null>(null);
  const previewRef = useRef<Replay | null>(null);
  const ghostRef = useRef<GameState | null>(null);
  const loadedRef = useRef(false);
  const [game, setGame] = useState<GameState>(createGame);
  const [data, setData] = useState<SavedData>(DEFAULT_DATA);
  const [storageAvailable, setStorageAvailable] = useState(true);

  const loadSaved = useCallback(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    const saved = readSavedData();
    dataRef.current = saved;
    gameRef.current = createGame(
      0,
      saved.difficulty,
      "levels",
      gameRef.current.board,
      readLearning(),
      readAppearance(),
    );
  }, []);

  const commit = useCallback((next: GameState) => {
    gameRef.current = next;
    setGame(next);
  }, []);

  const persist = useCallback((next: SavedData) => {
    dataRef.current = next;
    setData(next);
    setStorageAvailable(saveData(next));
  }, []);

  const endRound = useCallback(
    (next: GameState) => {
      directionRef.current = null;
      // Publish the outcome before optional side effects can fail.
      setGame(next);
      const replay = recorderRef.current?.finish(next);
      recorderRef.current = null;
      if (replay) {
        saveReplay(replay);
        savePreview(replay);
      }
      saveLearning(next.learning);
      audioRef.current?.play(next.phase === "won" ? "won" : "lost");
      try {
        persist(recordRun(dataRef.current, next));
      } catch {
        setStorageAvailable(false);
      }
    },
    [persist],
  );

  useEffect(() => {
    loadSaved();
    const audio = new GameAudio();
    audio.enabled = dataRef.current.sound;
    audioRef.current = audio;
    let frame = 0;
    let previous = 0;
    let accumulator = 0;
    let lastUi = 0;
    let lastLearningSave = 0;
    const animate = (now: number) => {
      if (!previous) {
        // The first frame must publish current state, never overwrite a round
        // that was started while initial rendering/storage loading was pending.
        setData(dataRef.current);
        setGame(gameRef.current);
        previous = now;
      }
      const delta = Math.min(200, now - previous);
      previous = now;
      if (gameRef.current.phase === "running") {
        accumulator += delta;
        while (accumulator >= STEP_MS && gameRef.current.phase === "running") {
          recorderRef.current?.add({
            action: "step",
            direction: directionRef.current,
            count: 1,
          });
          const next = step(gameRef.current, directionRef.current);
          gameRef.current = next;
          if (ghostCursor.current) {
            const state = ghostCursor.current.advance();
            ghostRef.current =
              "player" in state && !ghostCursor.current.done ? state : null;
          }
          accumulator -= STEP_MS;
          if (next.phase === "won" || next.phase === "lost") {
            endRound(next);
            setGame(next);
          }
        }
        if (now - lastUi > 80) {
          setGame(gameRef.current);
          lastUi = now;
        }
      } else accumulator = 0;
      if (
        gameRef.current.phase === "running" &&
        now - lastLearningSave > 2000
      ) {
        saveLearning(gameRef.current.learning);
        lastLearningSave = now;
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    const suspend = () => {
      directionRef.current = null;
      if (gameRef.current.phase === "running") {
        previewRef.current =
          readPreview() ??
          recorderRef.current?.finish(gameRef.current, true) ??
          null;
        savePreview(recorderRef.current?.finish(gameRef.current, true) ?? null);
        saveLearning(gameRef.current.learning);
        recorderRef.current?.add({ action: "pause" });
        commit({ ...gameRef.current, pendingDirection: null, phase: "paused" });
      }
    };
    const visibility = () => {
      if (document.hidden) suspend();
    };
    window.addEventListener("blur", suspend);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      saveLearning(gameRef.current.learning);
      savePreview(recorderRef.current?.finish(gameRef.current, true) ?? null);
      cancelAnimationFrame(frame);
      window.removeEventListener("blur", suspend);
      document.removeEventListener("visibilitychange", visibility);
      audio.close();
      audioRef.current = null;
    };
  }, [commit, endRound, loadSaved]);

  const start = useCallback(() => {
    loadSaved();
    audioRef.current?.unlock();
    audioRef.current?.play("start");
    directionRef.current = null;
    saveLearning(gameRef.current.learning);
    const meta = {
      mode: gameRef.current.mode,
      arena: gameRef.current.arena,
      difficulty: gameRef.current.difficulty,
      seed: 0,
      board: gameRef.current.board,
      learning: gameRef.current.learning,
      appearance: gameRef.current.appearance,
    };
    recorderRef.current = new Recorder(meta);
    const ghost = ghostEnabled
      ? readReplays().find((r) => compatibleGhost(r, meta))
      : null;
    ghostCursor.current = ghost ? new ReplayCursor(ghost) : null;
    ghostRef.current = null;
    commit({
      ...createGame(
        meta.arena,
        meta.difficulty,
        meta.mode,
        meta.board,
        meta.learning,
        meta.appearance,
      ),
      phase: "running",
    });
  }, [commit, ghostEnabled, loadSaved]);

  const pause = useCallback(() => {
    if (gameRef.current.phase !== "running") return;
    previewRef.current =
      readPreview() ??
      recorderRef.current?.finish(gameRef.current, true) ??
      null;
    savePreview(recorderRef.current?.finish(gameRef.current, true) ?? null);
    saveLearning(gameRef.current.learning);
    recorderRef.current?.add({ action: "pause" });
    directionRef.current = null;
    commit({ ...gameRef.current, pendingDirection: null, phase: "paused" });
  }, [commit]);

  const resume = useCallback(() => {
    if (gameRef.current.phase !== "paused") return;
    recorderRef.current?.add({ action: "resume" });
    directionRef.current = null;
    commit({ ...gameRef.current, pendingDirection: null, phase: "running" });
  }, [commit]);

  const dash = useCallback(() => {
    const previous = gameRef.current;
    const next = dashGame(previous, directionRef.current);
    if (next === previous) return;
    recorderRef.current?.add({
      action: "dash",
      direction: directionRef.current,
    });
    audioRef.current?.play("dash");
    commit(next);
    if (next.phase === "lost") endRound(next);
  }, [commit, endRound]);

  const configure = useCallback(
    (
      arena: number,
      difficulty: Difficulty,
      mode: GameMode = gameRef.current.mode,
    ) => {
      loadSaved();
      if (
        gameRef.current.phase === "running" ||
        gameRef.current.phase === "paused"
      )
        return;
      directionRef.current = null;
      commit(
        createGame(
          arena,
          difficulty,
          mode,
          gameRef.current.board,
          gameRef.current.learning,
          gameRef.current.appearance,
        ),
      );
      persist({ ...dataRef.current, difficulty });
    },
    [commit, persist, loadSaved],
  );

  const steer = useCallback(
    (direction: Direction) => {
      if (gameRef.current.phase !== "running") return;
      recorderRef.current?.add({ action: "steer", direction });
      directionRef.current = direction;
      const next = steerGame(gameRef.current, direction);
      commit(next);
    },
    [commit],
  );

  const clearDirection = useCallback(() => {
    recorderRef.current?.add({ action: "clear" });
    directionRef.current = null;
    gameRef.current = { ...gameRef.current, pendingDirection: null };
  }, []);

  const clearScores = useCallback(() => {
    loadSaved();
    persist({ ...dataRef.current, runs: [], attempts: 0, wins: 0, best: 0 });
  }, [persist, loadSaved]);

  const quit = useCallback(() => {
    savePreview(recorderRef.current?.finish(gameRef.current, true) ?? null);
    saveLearning(gameRef.current.learning);
    recorderRef.current = null;
    ghostCursor.current = null;
    ghostRef.current = null;
    directionRef.current = null;
    commit(
      createGame(
        gameRef.current.arena,
        gameRef.current.difficulty,
        gameRef.current.mode,
        gameRef.current.board,
        gameRef.current.learning,
        gameRef.current.appearance,
      ),
    );
  }, [commit]);

  const toggleSound = useCallback(() => {
    loadSaved();
    const enabled = !dataRef.current.sound;
    if (audioRef.current) {
      audioRef.current.enabled = enabled;
      if (enabled) {
        audioRef.current.unlock();
        audioRef.current.play("click");
      }
    }
    persist({ ...dataRef.current, sound: enabled });
  }, [persist, loadSaved]);

  const resize = useCallback(
    (board: Board) => {
      const next = resizeGame(gameRef.current, board);
      if (next === gameRef.current) return;
      recorderRef.current?.add({ action: "resize", board });
      ghostCursor.current = null;
      ghostRef.current = null;
      commit(next);
    },
    [commit],
  );
  const appearance = useCallback(
    (appearance: Appearance) => {
      if (
        gameRef.current.phase === "running" ||
        gameRef.current.phase === "paused"
      )
        return;
      saveAppearance(appearance);
      commit({ ...gameRef.current, appearance });
    },
    [commit],
  );
  return {
    resize,
    appearance,
    previewRef,
    game,
    gameRef,
    directionRef,
    ghostRef,
    data,
    storageAvailable,
    start,
    pause,
    resume,
    dash,
    steer,
    clearDirection,
    configure,
    quit,
    toggleSound,
    clearScores,
  };
}
