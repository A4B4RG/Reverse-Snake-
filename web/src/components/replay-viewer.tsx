"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createGame, formatTime } from "@/lib/game";
import { readReplays, ReplayCursor, type Replay } from "@/lib/replay";
import { GameCanvas } from "./game-canvas";
import { displayRun } from "./new-game";
import { SnakeMark } from "./pixel-art";

export default function ReplayViewer() {
  const [replays, setReplays] = useState<Replay[]>([]),
    [playing, setPlaying] = useState(false),
    [status, setStatus] = useState("Choose a completed local run."),
    [elapsed, setElapsed] = useState(0);
  const cursor = useRef<ReplayCursor | null>(null),
    playRef = useRef(false),
    selected = useRef(0);
  const [selection, setSelection] = useState(0);
  const gameRef = useRef(createGame()),
    canvasRef = useRef<HTMLCanvasElement>(null);
  const choose = useCallback((replay: Replay, index: number) => {
    selected.current = index;
    setSelection(index);
    cursor.current = new ReplayCursor(replay);
    gameRef.current = displayRun(cursor.current.state);
    playRef.current = false;
    setPlaying(false);
    setElapsed(0);
    setStatus("Ready. Play this recorded run.");
  }, []);
  useEffect(() => {
    let frame = 0,
      previous = 0,
      accumulator = 0,
      lastUi = 0,
      loaded = false;
    const animate = (now: number) => {
      if (!loaded) {
        loaded = true;
        const saved = readReplays();
        setReplays(saved);
        if (saved[0]) choose(saved[0], 0);
      }
      const delta = previous ? Math.min(200, now - previous) : 0;
      previous = now;
      if (playRef.current && cursor.current) {
        accumulator += delta;
        while (accumulator >= 20 && !cursor.current.done) {
          gameRef.current = displayRun(cursor.current.advance());
          accumulator -= 20;
        }
        if (cursor.current.done) {
          setElapsed(cursor.current.state.elapsed);
          playRef.current = false;
          setPlaying(false);
          setStatus(
            cursor.current.valid
              ? "Replay complete. Final state verified."
              : "Replay mismatch. This run cannot be verified.",
          );
        }
        if (now - lastUi > 80) {
          setElapsed(cursor.current.state.elapsed);
          lastUi = now;
        }
      } else accumulator = 0;
      frame = requestAnimationFrame(animate);
    };
    const pause = () => {
      playRef.current = false;
      setPlaying(false);
    };
    const hidden = () => {
      if (document.hidden) pause();
    };
    frame = requestAnimationFrame(animate);
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [choose]);
  const toggle = () => {
    if (!cursor.current) return;
    if (cursor.current.done)
      choose(replays[selected.current], selected.current);
    playRef.current = !playRef.current;
    setPlaying(playRef.current);
  };
  return (
    <>
      <header className="site-header">
        <Link className="brand" href="/">
          <SnakeMark />
          <span>
            reverse<span className="brand-second">snake.</span>
          </span>
        </Link>
        <nav className="mode-nav" aria-label="Game navigation">
          <Link href="/">Mango</Link>
          <Link href="/hunter">Hunter</Link>
          <Link href="/challenge">Challenges</Link>
        </nav>
      </header>
      <main className="site-main">
        <section className="hero">
          <h1>
            One more <span>look.</span>
          </h1>
        </section>
        <div className="play-layout extra-layout">
          <section className="arcade" aria-label="Replay viewer">
            <div className="game-hud">
              <div className="hud-stat">
                <span>REPLAY TIME</span>
                <strong>{formatTime(elapsed)}</strong>
              </div>
              <div className="hud-actions">
                <button
                  className="primary-button"
                  disabled={!replays.length}
                  onClick={toggle}
                >
                  {playing ? "Pause replay" : "Play replay"}
                </button>
              </div>
            </div>
            <div className="board-stage">
              <GameCanvas
                gameRef={gameRef}
                canvasRef={canvasRef}
                ariaLabel="Recorded run. Playback does not accept movement inputs."
              />
              {!replays.length && (
                <div className="board-overlay state-overlay">
                  <h2>Your next run.</h2>
                  <p>Finish a round in any mode to save a replay here.</p>
                  <Link className="primary-button" href="/">
                    Play a round →
                  </Link>
                </div>
              )}
            </div>
            <div className="game-footer" role="status">
              {status}
            </div>
          </section>
          <aside className="game-sidebar extra-setup">
            <label>
              Completed local run
              <select
                disabled={!replays.length}
                value={selection}
                onChange={(e) =>
                  choose(
                    replays[Number(e.target.value)],
                    Number(e.target.value),
                  )
                }
              >
                {replays.map((r, i) => (
                  <option key={i} value={i}>
                    {r.meta.mode} · {formatTime(r.elapsed)} ·{" "}
                    {Math.floor(r.score)} pts
                  </option>
                ))}
              </select>
            </label>
            <div className="extra-description">
              <p>
                The last three completed runs stay in this browser. Compatible
                recordings use the same rules and ordered inputs. Playback
                freezes when you leave the tab.
              </p>
              <p>
                For a mango ghost, enable the option in the main game menu
                before starting a matching round.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
