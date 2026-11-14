"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Expand,
  Pause,
  Play,
} from "lucide-react";
import {
  ARENAS,
  DIFFICULTIES,
  formatTime,
  STEP_MS,
  type Difficulty,
  type Direction,
} from "@/lib/game";
import { CHALLENGES } from "@/lib/challenge";
import {
  applyCommand,
  createRun,
  isHunter,
  Recorder,
  saveReplay,
  readPreview,
  savePreview,
  type Replay,
  type Command,
  type RunMeta,
  type RunState,
} from "@/lib/replay";
import {
  readExtraRecords,
  recordExtra,
  type ExtraRecord,
} from "@/lib/extra-records";
import { GameInput, keyboardSource, movementDirection } from "@/lib/input";
import { SnakeMark } from "./pixel-art";
import { GameCanvas } from "./game-canvas";
import { Modal } from "./modal";
import { readLearning, saveLearning } from "@/lib/learning";
import {
  readAppearance,
  saveAppearance,
  type Appearance,
} from "@/lib/appearance";
import type { Board } from "@/lib/board";
import { displayRun } from "@/lib/run-display";
import { AppearancePicker } from "./appearance-picker";
import { GameMenu } from "./game-menu";
export default function NewGame({ mode }: { mode: "hunter" | "challenge" }) {
  const initial: RunMeta =
    mode === "hunter"
      ? { mode, arena: 0, difficulty: "normal", seed: 1 }
      : {
          mode,
          arena: CHALLENGES[0].arena,
          difficulty: CHALLENGES[0].difficulty,
          seed: CHALLENGES[0].seed,
          challenge: CHALLENGES[0].id,
        };
  const [state, setState] = useState<RunState>(() => ({
    ...createRun(initial),
    phase: "ready",
  }));
  const metaRef = useRef(initial),
    stateRef = useRef<RunState>(state);
  const displayRef = useRef(displayRun(state)),
    canvasRef = useRef<HTMLCanvasElement>(null),
    arcadeRef = useRef<HTMLElement>(null);
  const preferencesLoaded = useRef(false);
  const previewRef = useRef<Replay | null>(null);
  const recorder = useRef<Recorder | null>(null),
    input = useRef(new GameInput());
  const [meta, setMeta] = useState(initial),
    [notice, setNotice] = useState("");
  const [records, setRecords] = useState<ExtraRecord[]>([]);
  const [help, setHelp] = useState(false);
  const focus = useCallback(
    () =>
      requestAnimationFrame(() =>
        canvasRef.current?.focus({ preventScroll: true }),
      ),
    [],
  );
  const publish = useCallback((s: RunState) => {
    stateRef.current = s;
    displayRef.current = displayRun(s);
    setState(s);
  }, []);
  const complete = useCallback(
    (s: RunState) => {
      const replay = recorder.current?.finish(s);
      recorder.current = null;
      saveLearning(s.learning);
      if (replay) savePreview(replay);
      const stored = recordExtra(s, metaRef.current),
        replayStored = !replay || saveReplay(replay);
      if (!stored || !replayStored)
        setNotice(
          "Browser storage is unavailable. This result lasts for this visit.",
        );
      setRecords(readExtraRecords());
      input.current.clear();
      publish(s);
    },
    [publish],
  );
  const command = useCallback(
    (c: Command) => {
      const running = stateRef.current.phase === "running";
      recorder.current?.add(c);
      const next = applyCommand(stateRef.current, c, metaRef.current);
      publish(next);
      if (running && (next.phase === "won" || next.phase === "lost"))
        complete(next);
    },
    [publish, complete],
  );
  const loadPreferences = useCallback(() => {
    if (preferencesLoaded.current) return;
    preferencesLoaded.current = true;
    metaRef.current = {
      ...metaRef.current,
      board: stateRef.current.board,
      appearance: readAppearance(),
      learning: readLearning(),
    };
    publish({ ...createRun(metaRef.current), phase: "ready" });
  }, [publish]);
  const start = useCallback(() => {
    loadPreferences();
    input.current.clear();
    saveLearning(stateRef.current.learning);
    metaRef.current = {
      ...metaRef.current,
      board: stateRef.current.board,
      appearance: stateRef.current.appearance,
      learning: stateRef.current.learning,
    };
    recorder.current = new Recorder(metaRef.current);
    publish(createRun(metaRef.current));
    focus();
  }, [publish, focus, loadPreferences]);
  const pause = useCallback(() => {
    if (stateRef.current.phase === "running") {
      input.current.clear();
      previewRef.current =
        readPreview() ??
        recorder.current?.finish(stateRef.current, true) ??
        null;
      savePreview(recorder.current?.finish(stateRef.current, true) ?? null);
      saveLearning(stateRef.current.learning);
      command({ action: "pause" });
    }
  }, [command]);
  const resume = useCallback(() => {
    if (stateRef.current.phase === "paused") {
      input.current.clear();
      command({ action: "resume" });
      focus();
    }
  }, [command, focus]);
  const press = useCallback(
    (source: string, d: Direction) => {
      if (stateRef.current.phase !== "running") return;
      if (input.current.press(source, d))
        command({ action: "steer", direction: d });
    },
    [command],
  );
  const release = useCallback(
    (source: string, cancel = false) => {
      if (!input.current.release(source)) return;
      if (!isHunter(stateRef.current)) {
        if (input.current.direction)
          command({ action: "steer", direction: input.current.direction });
        else if (cancel) command({ action: "clear" });
      }
    },
    [command],
  );
  const dash = useCallback(
    () => command({ action: "dash", direction: input.current.direction }),
    [command],
  );
  const configure = (m: RunMeta) => {
    if (
      stateRef.current.phase === "running" ||
      stateRef.current.phase === "paused"
    )
      return;
    m = {
      ...m,
      board: stateRef.current.board,
      appearance: stateRef.current.appearance,
      learning: stateRef.current.learning,
    };
    metaRef.current = m;
    setMeta(m);
    recorder.current = null;
    publish({ ...createRun(m), phase: "ready" });
  };
  useEffect(() => {
    let frame = 0,
      previous = 0,
      accumulator = 0,
      lastUi = 0,
      loaded = false,
      lastLearningSave = 0;
    const animate = (now: number) => {
      if (!loaded) {
        loaded = true;
        setRecords(readExtraRecords());
        loadPreferences();
      }
      const delta = previous ? Math.min(200, now - previous) : 0;
      previous = now;
      if (stateRef.current.phase === "running") {
        accumulator += delta;
        while (accumulator >= STEP_MS && stateRef.current.phase === "running") {
          const c: Command = {
            action: "step",
            direction: input.current.direction,
            count: 1,
          };
          recorder.current?.add(c);
          const next = applyCommand(stateRef.current, c, metaRef.current);
          stateRef.current = next;
          displayRef.current = displayRun(next);
          accumulator -= STEP_MS;
          if (next.phase === "won" || next.phase === "lost") complete(next);
        }
        if (now - lastUi >= 80) {
          setState(stateRef.current);
          lastUi = now;
        }
      } else accumulator = 0;
      if (
        stateRef.current.phase === "running" &&
        now - lastLearningSave > 2000
      ) {
        saveLearning(stateRef.current.learning);
        lastLearningSave = now;
      }
      frame = requestAnimationFrame(animate);
    };
    const down = (e: KeyboardEvent) => {
      if (
        document.querySelector(".menu-panel") ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      )
        return;
      if ((e.target as HTMLElement).closest("dialog")) return;
      if (e.key === "Escape") {
        e.preventDefault();
        pause();
        return;
      }
      if (
        (e.target as HTMLElement).closest(
          "button,input,select,a,textarea,dialog",
        )
      )
        return;
      if (e.key === "Enter" && !e.repeat) {
        e.preventDefault();
        if (stateRef.current.phase === "paused") resume();
        else if (stateRef.current.phase !== "running") start();
        return;
      }
      if (stateRef.current.phase !== "running") return;
      const d = movementDirection(e.key);
      if (d) {
        e.preventDefault();
        press(keyboardSource(e), d);
      } else if (e.code === "Space") {
        e.preventDefault();
        if (!e.repeat && mode === "challenge") dash();
      } else if (e.key.toLowerCase() === "r" && !e.repeat) {
        e.preventDefault();
        start();
      }
    };
    const up = (e: KeyboardEvent) => release(keyboardSource(e));
    const hidden = () => {
      if (document.hidden) pause();
    };
    frame = requestAnimationFrame(animate);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      saveLearning(stateRef.current.learning);
      savePreview(recorder.current?.finish(stateRef.current, true) ?? null);
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [
    complete,
    pause,
    resume,
    start,
    press,
    release,
    dash,
    mode,
    publish,
    loadPreferences,
  ]);
  const resize = useCallback(
    (board: Board) => {
      if (
        stateRef.current.board.columns === board.columns &&
        stateRef.current.board.rows === board.rows
      )
        return;
      metaRef.current = { ...metaRef.current, board };
      command({ action: "resize", board });
    },
    [command],
  );
  const appearance = (appearance: Appearance) => {
    if (
      stateRef.current.phase === "running" ||
      stateRef.current.phase === "paused"
    )
      return;
    saveAppearance(appearance);
    metaRef.current = { ...metaRef.current, appearance };
    publish({ ...stateRef.current, appearance });
  };
  const active = state.phase === "running" || state.phase === "paused";
  const challenge = CHALLENGES.find((c) => c.id === meta.challenge);
  const matching = records.filter(
    (r) =>
      r.meta.mode === mode &&
      r.meta.arena === meta.arena &&
      r.meta.difficulty === meta.difficulty &&
      r.meta.challenge === meta.challenge,
  );
  const best = [...matching].sort((a, b) =>
    mode === "hunter"
      ? b.score - a.score
      : b.elapsed - a.elapsed || b.closeCalls - a.closeCalls,
  )[0];
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await arcadeRef.current?.requestFullscreen();
    } catch {
      setNotice("Fullscreen is unavailable in this browser window.");
    }
  };
  return (
    <>
      <header className="site-header">
        <Link href="/" className="brand">
          <SnakeMark />
          <span>
            reverse<span className="brand-second">snake.</span>
          </span>
        </Link>
        <nav className="mode-nav" aria-label="Game navigation">
          <Link href="/">Fruit</Link>
          <Link href={mode === "hunter" ? "/challenge" : "/hunter"}>
            {mode === "hunter" ? "Challenges" : "Hunter"}
          </Link>
          <Link href="/replays">Replays</Link>
        </nav>
        <GameMenu
          currentMode={mode === "hunter" ? "hunter" : undefined}
          onOpen={pause}
        >
          <AppearancePicker value={state.appearance} disabled={active} onChange={appearance}/>
          <div className="mobile-setup menu-settings">
            {mode === "hunter" ? <>
              <label>Map<select aria-label="Map" value={meta.arena} disabled={active} onChange={e => configure({ ...meta, arena: Number(e.target.value) })}>{ARENAS.map((a,i) => <option key={a.name} value={i}>{a.name}</option>)}</select></label>
              <label>Pace<select aria-label="Pace" value={meta.difficulty} disabled={active} onChange={e => configure({ ...meta, difficulty: e.target.value as Difficulty })}>{Object.entries(DIFFICULTIES).map(([id,d]) => <option key={id} value={id}>{d.label}</option>)}</select></label>
            </> : <label>Course<select aria-label="Course" value={meta.challenge} disabled={active} onChange={e => { const c = CHALLENGES.find(c => c.id === e.target.value)!; configure({ mode, arena: c.arena, difficulty: c.difficulty, seed: c.seed, challenge: c.id }); }}>{CHALLENGES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}
          </div>
          <button
            data-menu-close
            onClick={() => {
              pause();
              setHelp(true);
            }}
          >
            How to play
          </button>
        </GameMenu>
      </header>
      <main className="site-main">
        <section className="hero">
          <div>
            <h1>
              {mode === "hunter" ? "Become the " : "Take the "}
              <span>{mode === "hunter" ? "hunter." : "challenge."}</span>
            </h1>
            <p>
              {mode === "hunter"
                ? "Catch the fruit. It learns how to escape."
                : "Timed courses on your screen’s board."}
            </p>
          </div>
        </section>
        <div className="play-layout extra-layout">
          <section
            className="arcade"
            ref={arcadeRef}
            aria-label={`${mode} arcade`}
          >
            <div className="game-hud">
              <div className="hud-stat">
                <span>SCORE</span>
                <strong>{state.score}</strong>
              </div>
              <div className="hud-stat">
                <span>{mode === "challenge" ? "SURVIVE" : "TIME"}</span>
                <strong>
                  {formatTime(state.elapsed)}
                  {challenge && <small>/ {formatTime(challenge.target)}</small>}
                </strong>
              </div>
              <div className="hud-actions">
                <button
                  className="dark-icon-button"
                  disabled={!active}
                  onClick={state.phase === "paused" ? resume : pause}
                  aria-label={
                    state.phase === "paused" ? "Resume game" : "Pause game"
                  }
                >
                  {state.phase === "paused" ? (
                    <Play size={18} />
                  ) : (
                    <Pause size={18} />
                  )}
                </button>
                <button
                  className="dark-icon-button"
                  onClick={fullscreen}
                  aria-label="Toggle fullscreen"
                >
                  <Expand size={18} />
                </button>
              </div>
            </div>
            <div className="round-progress"><span>{ARENAS[meta.arena].name}</span><strong>{mode === "hunter" ? "Hunter" : "Challenge"}</strong></div>
            <div className="board-stage" data-phase={state.phase}>
              <GameCanvas
                gameRef={displayRef}
                canvasRef={canvasRef}
                previewRef={previewRef}
                onResize={resize}
                onSwipe={d => { input.current.release("swipe"); press("swipe", d); focus(); }}
                onDash={mode === "challenge" ? dash : undefined}
                ariaLabel={
                  mode === "hunter"
                    ? "Hunter playing field. Swipe or use arrow keys / WASD to turn. Escape pauses."
                    : undefined
                }
              />
              {state.phase !== "running" && (
                <div
                  className={`board-overlay state-overlay ${state.phase === "paused" ? "pause-overlay" : ""}`}
                >
                  <h2>
                    {state.phase === "ready"
                      ? mode === "hunter"
                        ? "Your hunt."
                        : challenge?.name
                      : state.phase === "paused"
                        ? "Paused."
                        : state.phase === "won"
                          ? "Sweet success."
                          : "Try another turn."}
                  </h2>
                  <p>
                    {state.phase === "ready"
                      ? mode === "hunter"
                        ? "You control the snake. Collect fruit and avoid every wall, stone and body cell."
                        : `Stay uneaten for ${challenge!.target / 1000} seconds. Dash and close calls work as in Survival.`
                      : state.phase === "paused"
                        ? "The board is frozen."
                        : `${state.score} points · ${formatTime(state.elapsed)} · ${state.reason}`}
                  </p>
                  <button
                    className="primary-button"
                    onClick={state.phase === "paused" ? resume : start}
                  >
                    {state.phase === "ready"
                      ? "Start round"
                      : state.phase === "paused"
                        ? "Resume round"
                        : "Try again"}
                    <Play size={18} />
                  </button>
                  {state.phase !== "ready" && (
                    <button
                      className="text-button"
                      onClick={() => {
                        savePreview(
                          recorder.current?.finish(stateRef.current, true) ??
                            null,
                        );
                        saveLearning(stateRef.current.learning);
                        recorder.current = null;
                        input.current.clear();
                        publish({
                          ...createRun(metaRef.current),
                          phase: "ready",
                        });
                      }}
                    >
                      Back to setup
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="game-footer">
              <span>
                {ARENAS[meta.arena].name} ·{" "}
                {mode === "hunter" ? "Player snake" : "Local challenge"}
              </span>
              <span>
                {state.board.columns} × {state.board.rows}
              </span>
            </div>

          </section>
          <aside className="game-sidebar extra-setup" aria-label="Round setup">
            {mode === "hunter" ? (
              <>
                <label>
                  Arena
                  <select
                    disabled={active}
                    value={meta.arena}
                    onChange={(e) =>
                      configure({ ...meta, arena: Number(e.target.value) })
                    }
                  >
                    {ARENAS.map((a, i) => (
                      <option key={a.name} value={i}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Difficulty
                  <select
                    disabled={active}
                    value={meta.difficulty}
                    onChange={(e) =>
                      configure({
                        ...meta,
                        difficulty: e.target.value as Difficulty,
                      })
                    }
                  >
                    {Object.entries(DIFFICULTIES).map(([id, d]) => (
                      <option key={id} value={id}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : (
              <label>
                Local course
                <select
                  disabled={active}
                  value={meta.challenge}
                  onChange={(e) => {
                    const c = CHALLENGES.find((c) => c.id === e.target.value)!;
                    configure({
                      mode,
                      arena: c.arena,
                      difficulty: c.difficulty,
                      seed: c.seed,
                      challenge: c.id,
                    });
                  }}
                >
                  {CHALLENGES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.target / 1000}s
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="extra-description">
              <p>
                {mode === "hunter"
                  ? "Arrow keys / WASD turn. The snake keeps moving. Queue up to two corners. You cannot reverse. Each fruit grows your snake and earns 100 points × difficulty. Fill the free board to win."
                  : `${DIFFICULTIES[meta.difficulty].label} · ${ARENAS[meta.arena].name}. Hold arrows / WASD to move; Space dashes. Capture loses. Reach the timer to win. Compare time, then close calls on this course.`}
              </p>
              <p>
                Esc pauses · Enter starts/resumes · R restarts. Leaving the tab
                pauses automatically.
              </p>
              <p>
                Personal best:{" "}
                {best
                  ? mode === "hunter"
                    ? `${best.score} points`
                    : `${formatTime(best.elapsed)} · ${best.closeCalls} close calls`
                  : "Finish your first run."}
              </p>
              <Link href="/replays">Watch recent completed runs →</Link>
            </div>
            <button
              className="mode-help"
              onClick={() => {
                pause();
                setHelp(true);
              }}
            >
              How to play
            </button>
          </aside>
        </div>
        {notice && (
          <p className="storage-notice" role="status">
            {notice}
          </p>
        )}
        <div className="sr-only" role="status">
          {state.phase === "running"
            ? "Round running."
            : state.phase === "paused"
              ? "Game paused."
              : state.phase === "won" || state.phase === "lost"
                ? `Round ${state.phase}. ${state.score} points.`
                : "Ready to start."}
        </div>
      </main>
      {help && (
        <Modal
          title={
            mode === "hunter" ? "Control the hunter." : "A fixed local chase."
          }
          onClose={() => setHelp(false)}
        >
          <p className="modal-intro">
            {mode === "hunter"
              ? "Use arrow keys, WASD or swipes to turn your snake. It keeps moving. Queue up to two corners; reversals are rejected. Eat fruit for one extra cell and 100 points × difficulty. Avoid walls, stones and your body. The departing tail cell is safe unless growing. Fill the available board to win."
              : `Survive ${challenge?.target ? challenge.target / 1000 : 0} seconds in ${ARENAS[meta.arena].name}. Arrow keys / WASD move your fruit; swipe up, down, left or right to keep moving in that direction. Space or a double-tap after a swipe moves three cells in your last direction. Capture loses. Snake crashes respawn a hunter. Close calls give a five-second speed boost. This local course has the same course and seed on every attempt.`}
          </p>
          <p className="modal-intro">
            Esc pauses · Enter starts/resumes · R restarts. Your round pauses
            when you leave the tab. Abandoned rounds do not count.
          </p>
          <p className="score-note">
            Personal best:{" "}
            {best
              ? mode === "hunter"
                ? `${best.score} points`
                : `${formatTime(best.elapsed)} · ${best.closeCalls} close calls`
              : "Finish your first run."}{" "}
            Results stay in this browser, separately from escape scores.
          </p>
        </Modal>
      )}
    </>
  );
}
