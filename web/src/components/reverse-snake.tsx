"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowDownLeft, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, AudioLines, Check, ChevronLeft, ChevronRight, CornerDownLeft, Expand, Heart, MoveUpRight, Pause, Play, RotateCcw, Route, Shrink, Sprout, Trophy, VolumeX, X, Zap } from "lucide-react";
import { ARENAS, CLOSE_CALL_DURATION, DASH_COOLDOWN, DIFFICULTIES, formatTime, type Difficulty, type Direction } from "@/lib/game";
import { GameInput, keyboardSource, movementDirection } from "@/lib/input";
import { useGame } from "@/hooks/use-game";
import { GameCanvas } from "./game-canvas";
import { GardenMap, JungleFruit, SnakeMark } from "./pixel-art";
import { Modal } from "./modal";
import { GameMenu } from "./game-menu";

type Dialog = "guide" | "scores" | "about" | null;

export default function ReverseSnake() {
  const [ghostEnabled, setGhostEnabled] = useState(false);
  const { game, gameRef, directionRef, ghostRef, data, storageAvailable, start, pause, resume, dash, steer, clearDirection, configure, quit, toggleSound, clearScores } = useGame(ghostEnabled);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenNotice, setFullscreenNotice] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const arcadeRef = useRef<HTMLElement>(null);
  const input = useRef(new GameInput());
  const arena = ARENAS[game.arena];
  const active = game.phase === "running" || game.phase === "paused";
  const focusGame = useCallback(() => requestAnimationFrame(() => canvasRef.current?.focus({ preventScroll: true })), []);
  const startRound = useCallback(() => { input.current.clear(); start(); focusGame(); }, [start, focusGame]);
  const resumeRound = useCallback(() => { input.current.clear(); resume(); focusGame(); }, [resume, focusGame]);
  const pressInput = useCallback((source: string, direction: Direction) => {
    if (gameRef.current.phase !== "running") return;
    if (input.current.press(source, direction)) steer(direction);
    directionRef.current = input.current.direction;
  }, [gameRef, directionRef, steer]);
  const releaseInput = useCallback((source: string, cancelled = false) => {
    if (!input.current.release(source)) return;
    const direction = input.current.direction;
    directionRef.current = direction;
    if (direction) steer(direction);
    else if (cancelled) clearDirection();
  }, [directionRef, steer, clearDirection]);
  const openDialog = (value: Dialog) => { pause(); setDialog(value); };

  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => {
      if (dialog || document.querySelector(".menu-panel") || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement;
      const interactive = target.closest("button, input, select, textarea, a, dialog, [contenteditable='true']");
      if (event.key === "Escape" && gameRef.current.phase === "running") { event.preventDefault(); input.current.clear(); pause(); return; }
      if (interactive) return;
      if (event.key === "Enter" && !event.repeat) {
        event.preventDefault();
        if (gameRef.current.phase === "paused") resumeRound();
        else if (gameRef.current.phase !== "running") startRound();
        return;
      }
      if (gameRef.current.phase !== "running") return;
      const direction = movementDirection(event.key);
      if (direction) {
        event.preventDefault();
        pressInput(keyboardSource(event), direction);
      } else if (event.code === "Space") { event.preventDefault(); if (!event.repeat) dash(); }
      else if (event.key.toLowerCase() === "r" && !event.repeat) { event.preventDefault(); startRound(); }
    };
    const keyUp = (event: KeyboardEvent) => {
      releaseInput(keyboardSource(event));
    };
    const clear = () => { input.current.clear(); clearDirection(); };
    const visibility = () => { if (document.hidden) clear(); };
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("keydown", keyDown); window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", clear); document.removeEventListener("visibilitychange", visibility);
    };
  }, [dialog, gameRef, pause, dash, pressInput, releaseInput, clearDirection, startRound, resumeRound]);

  useEffect(() => {
    if (game.phase !== "running") input.current.clear();
  }, [game.phase]);

  useEffect(() => {
    const change = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", change);
    return () => document.removeEventListener("fullscreenchange", change);
  }, []);

  const toggleFullscreen = async () => {
    setFullscreenNotice("");
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (arcadeRef.current?.requestFullscreen) await arcadeRef.current.requestFullscreen();
      else setFullscreenNotice("Fullscreen is not supported here. Try your browser’s fullscreen option.");
    } catch { setFullscreenNotice("Fullscreen is unavailable in this browser window."); }
  };

  const nextArena = () => { configure((game.arena + 1) % ARENAS.length, game.difficulty); };
  const bestRuns = [...data.runs].sort((a, b) => b.score - a.score).slice(0, 5);
  const outcomeText = game.reason === "hunger" ? "You outlasted its appetite. A small mango, a big win." : game.reason === "body" ? "A little misdirection. A very tangled snake. Well played." : game.reason === "obstacle" ? "You took the turn. The hunter took the hedge." : "The hunter met the edge. You lived to tell the tale.";

  return <>
    <a className="skip-link" href="#play">Skip to game</a>
    <header className="site-header">
      <a className="brand" href="#" aria-label="Reverse Snake home"><SnakeMark /><span>reverse<span className="brand-second">snake<span className="brand-dot">.</span></span></span></a>
      <nav className="desktop-nav" aria-label="Main navigation">
        <a className="nav-active" href="#play"><span />The game</a>
        <button onClick={() => openDialog("guide")}>How to play <ArrowUpRight size={14} /></button>
        <button onClick={() => openDialog("scores")}>Your best runs <ArrowUpRight size={14} /></button>
      </nav>
      <GameMenu currentMode="mango" onOpen={pause}>
        <button data-menu-close onClick={() => openDialog("guide")}>How to play</button>
        <button data-menu-close onClick={() => openDialog("scores")}>Your best runs</button>
        <button data-menu-close onClick={() => openDialog("about")}>About Reverse Snake</button>
        <label className="ghost-option"><input type="checkbox" checked={ghostEnabled} disabled={active} onChange={event => setGhostEnabled(event.target.checked)} />Show the last matching mango ghost next round</label>
        <p className="score-note">Completed rounds save up to three replays locally. A ghost appears when a saved replay matches your setup.</p>
      </GameMenu>
      <button className={`sound-button ${!data.sound ? "muted" : ""}`} onClick={toggleSound} aria-label={data.sound ? "Mute sound" : "Enable sound"} aria-pressed={data.sound}>{data.sound ? <AudioLines size={17} /> : <VolumeX size={17} />}<span>Sound {data.sound ? "on" : "off"}</span></button>
    </header>

    <main className="site-main">
      <section className="hero" aria-labelledby="hero-title">
        <div><div className="hero-eyebrow"><span className="little-star">✳</span> DEEP CANOPY · A CHASE THROUGH THE WILD</div><h1 id="hero-title">Outsmart the <span>hunter<svg viewBox="0 0 290 14" fill="none" aria-hidden="true"><path d="M3 10C77 1 184 0 286 7" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/></svg></span>.</h1><p>A small mango in a hungry jungle. Dodge the hunter. Make your escape.</p></div>
        <div className="hero-sticker" aria-hidden="true"><MoveUpRight size={20} /><span>small mango.<br/>big main<br/>character energy.</span><JungleFruit /></div>
      </section>

      <div className="play-layout" id="play">
        <section className="arcade" ref={arcadeRef} aria-label="Reverse Snake arcade">
          <div className="game-hud">
            <div className="hud-stat"><span>SCORE</span><strong>{Math.floor(game.score).toString().padStart(4, "0")}<small>pts</small></strong></div>
            <div className="hud-stat"><span>{game.mode === "survival" ? "ENDLESS" : "TIME"}</span><strong>{formatTime(game.elapsed)}{game.mode === "levels" && <small className="survival-target">/ {formatTime(arena.duration)}</small>}</strong></div>
            <div className="hud-best"><Trophy size={17} /><div><span>PERSONAL BEST</span><strong>{data.best.toLocaleString()} <small>pts</small></strong></div></div>
            <div className="hud-actions"><button className="dark-icon-button" onClick={game.phase === "paused" ? resumeRound : pause} disabled={!active} aria-label={game.phase === "paused" ? "Resume game" : "Pause game"} title="Pause (Esc)">{game.phase === "paused" ? <Play size={17}/> : <Pause size={17}/>}</button><button className="dark-icon-button" onClick={toggleFullscreen} aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"} title="Fullscreen">{isFullscreen ? <Shrink size={17} /> : <Expand size={17} />}</button></div>
          </div>

          <div className={`board-stage ${game.phase === "lost" ? "board-lost" : ""} ${game.boostRemaining > 0 ? "board-boosted" : ""}`} data-phase={game.phase}>
            <GameCanvas gameRef={gameRef} canvasRef={canvasRef} ghostRef={ghostRef} />
            {game.phase === "ready" && <div className="board-overlay ready-overlay">
              <div className="overlay-tag"><span /> THE TABLES HAVE TURNED</div>
              <h2>You are<br/><span>the food.</span></h2>
              <p>Small, delicious, and absolutely<br/>not on the menu.</p>
              <button className="primary-button" onClick={startRound}>Let’s play <ArrowUpRight size={20} /></button>
              <span className="enter-hint">or press <kbd>enter ↵</kbd></span>
            </div>}
            {game.phase === "paused" && <div className="board-overlay state-overlay"><div className="overlay-icon"><Pause size={26} /></div><span className="overlay-tag">TAKE A BREATHER</span><h2>Snack break.</h2><p>Your mango is safe. The chase can wait.</p><button className="primary-button" onClick={resumeRound}>Back to the chase <Play size={18}/></button><div className="overlay-links"><button onClick={startRound}><RotateCcw size={13}/> Restart</button><button onClick={quit}><X size={13}/> End round</button></div></div>}
            {(game.phase === "won" || game.phase === "lost") && <div className={`board-overlay state-overlay ${game.phase === "won" ? "win-overlay" : ""}`}>
              <div className="overlay-icon">{game.phase === "won" ? <Trophy size={28}/> : <JungleFruit />}</div><span className="overlay-tag">{game.phase === "won" ? "FOOD: 1. FOOD CHAIN: 0." : "A LITTLE TOO DELICIOUS"}</span><h2>{game.phase === "won" ? "Sweet escape." : "Well, snack."}</h2><p>{game.phase === "won" ? outcomeText : "The hunter got this one. Every great escape starts with another try."}</p>
              <div className="result-stats"><div><strong>{Math.floor(game.score).toLocaleString()}</strong><span>POINTS</span></div><div><strong>{formatTime(game.elapsed)}</strong><span>SURVIVED</span></div></div>
              <button className="primary-button" onClick={game.phase === "won" ? nextArena : startRound}>{game.phase === "won" ? game.arena === 4 ? "Back to the jungle" : "Next arena" : "One more bite"}{game.phase === "won" ? <ArrowRight size={18}/> : <RotateCcw size={18}/>}</button>
              <button className="text-button" onClick={game.phase === "won" ? startRound : quit}>{game.phase === "won" ? "Play this arena again" : "Back to the jungle"}</button>
            </div>}
            {game.phase === "running" && game.boostRemaining > 0 && <div className="boost-status"><Zap size={16}/><div><strong>{game.closeCallFlash > 0 ? "CLOSE CALL!" : "CANOPY RUSH"}</strong><span>2× speed · {(game.boostRemaining / 1000).toFixed(1)}s</span></div><div className="boost-track"><i style={{ width: `${game.boostRemaining / CLOSE_CALL_DURATION[game.mode] * 100}%` }}/></div></div>}
          </div>

          {fullscreenNotice && <p className="fullscreen-notice" role="status">{fullscreenNotice}</p>}
          <div className="touch-controls" aria-label="Touch game controls"><div className="d-pad">{([['up', ArrowUp], ['left', ArrowLeft], ['down', ArrowDown], ['right', ArrowRight]] as const).map(([direction, Icon]) => <button key={direction} className={`direction-${direction}`} disabled={game.phase !== "running"} aria-label={`Move ${direction}`} onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); pressInput(`pointer:${event.pointerId}`, direction); focusGame(); }} onPointerUp={event => releaseInput(`pointer:${event.pointerId}`)} onPointerCancel={event => releaseInput(`pointer:${event.pointerId}`, true)} onLostPointerCapture={event => releaseInput(`pointer:${event.pointerId}`, true)} onClick={event => { if (event.detail === 0) { steer(direction); directionRef.current = input.current.direction; focusGame(); } }}><Icon size={20}/></button>)}</div><button className="touch-dash" disabled={game.phase !== "running" || game.dashCooldown > 0} onClick={() => { dash(); focusGame(); }}><Zap size={20}/>{game.dashCooldown > 0 ? `${(game.dashCooldown / 1000).toFixed(1)}s` : "Dash"}</button></div>
        </section>

        <aside className="game-sidebar" aria-label="Game setup and controls">
          <section className="mission-card"><div className="eyebrow"><span className="mini-cross">+</span> YOUR ONE JOB</div><h2>Be the one<br/>that got away.</h2><p>{game.mode === "survival" ? "Stay alive as long as you can. Every crash brings a fresh hunter. There’s always another chase." : "Bait the snake into a wall or its own tail. Outsmart it, or outlast its appetite."}</p><div className="mission-rule"><span className="apple-dot"/>You’re the mango.<span className="snake-dot"/>It’s the problem.</div><ArrowDownLeft className="mission-arrow" size={36} strokeWidth={1.2}/></section>
          <section className="mode-section"><div className="section-label"><h3>CHOOSE YOUR CHASE</h3></div><div className="difficulty-options" aria-label="Game mode"><button disabled={active} aria-pressed={game.mode === "levels"} onClick={() => configure(game.arena, game.difficulty, "levels")}>Levels</button><button disabled={active} aria-pressed={game.mode === "survival"} onClick={() => configure(game.arena, game.difficulty, "survival")}>Survival</button></div></section>
          <section className="difficulty-section"><div className="section-label"><h3>PICK YOUR PACE</h3><span>0{(['easy', 'normal', 'hard'] as Difficulty[]).indexOf(game.difficulty) + 1} / 03</span></div><div className="difficulty-options" aria-label="Difficulty">{(Object.keys(DIFFICULTIES) as Difficulty[]).map(value => <button key={value} disabled={active} aria-pressed={game.difficulty === value} onClick={() => configure(game.arena, value)}>{game.difficulty === value && <span/>}{DIFFICULTIES[value].label}</button>)}</div></section>
          <section className="arena-section"><div className="section-label"><h3>THE PLAYING FIELD</h3><span>0{game.arena + 1} / 05</span></div><div className="arena-card"><GardenMap arena={game.arena}/><div><span>ARENA 0{game.arena + 1}</span><h4>{arena.name}</h4><p>{arena.subtitle}</p></div><div className="arena-arrows"><button aria-label="Previous arena" disabled={active} onClick={() => configure((game.arena + 4) % ARENAS.length, game.difficulty)}><ChevronLeft size={16}/></button><button aria-label="Next arena" disabled={active} onClick={() => configure((game.arena + 1) % ARENAS.length, game.difficulty)}><ChevronRight size={16}/></button></div></div><div className="arena-dots" aria-label="Choose arena">{ARENAS.map((item, index) => <button key={item.name} className={index === game.arena ? "selected" : ""} aria-label={`Choose ${item.name}`} aria-pressed={index === game.arena} disabled={active} onClick={() => configure(index, game.difficulty)}/>)}</div></section>
          <section className="controls-section"><div className="section-label"><h3>A FEW HANDY MOVES</h3><CornerDownLeft size={14}/></div><div className="control-row"><div className="key-group"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><span>/</span><kbd><ArrowUp size={11}/></kbd><kbd><ArrowLeft size={11}/></kbd><kbd><ArrowDown size={11}/></kbd><kbd><ArrowRight size={11}/></kbd></div><span>Hold to move</span></div><div className="control-row"><kbd className="wide-key">space <Zap size={11}/></kbd><span>Dash <small>· 4s recharge</small></span></div><div className="control-row"><div className="key-group"><kbd className="wide-key">esc</kbd><span>Pause</span></div><div className="key-group"><kbd>R</kbd><span>Restart</span></div></div><div className={`dash-meter ${game.dashCooldown === 0 ? "charged" : ""}`}><Zap size={13}/><span>{game.dashCooldown === 0 ? "Dash ready" : "Recharging"}</span><div><i style={{ width: `${100 - (game.dashCooldown / DASH_COOLDOWN) * 100}%` }}/></div></div></section>
        </aside>
      </div>

      <section className="below-game" aria-label="Game tips"><div className="tiny-note"><span className="note-star">✳</span><span>All instinct.<br/><strong>A little strategy.</strong></span></div><div className="tip"><span className="tip-number">01</span><p><strong>Close call. Fast escape.</strong><br/>Dodge beside its head for a speed rush.</p></div><div className="tip"><span className="tip-number">02</span><p><strong>Make a sharp exit.</strong><br/>It commits to each lunge. Use that.</p></div><button className="guide-link" onClick={() => openDialog("guide")}>A little help?<ArrowUpRight size={19}/></button></section>
      <section className="mobile-links" aria-label="More about the game"><button onClick={() => openDialog("guide")}>How to play <ArrowUpRight size={14}/></button><button onClick={() => openDialog("scores")}>Your best runs <Trophy size={14}/></button></section>
      <footer className="site-footer"><span>Classic instincts. Reversed roles.</span><button onClick={() => openDialog("about")}>A small game with a twist <ArrowUpRight size={13}/></button><span>NO DOWNLOADS. JUST ONE MORE ROUND.</span></footer>
      {!storageAvailable && <p className="storage-notice" role="status">Browser storage is unavailable. Scores will last for this visit only.</p>}
    </main>

    <div className="sr-only" role="status" aria-live="polite">{game.closeCalls > 0 ? `Close call ${game.closeCalls}. Double speed for ${CLOSE_CALL_DURATION[game.mode] / 1000} seconds.` : ""}</div>
    <div className="sr-only" role="status" aria-live="polite">{game.phase === "won" ? `You won with ${Math.floor(game.score)} points. ${outcomeText}` : game.phase === "lost" ? `The snake caught you. You scored ${Math.floor(game.score)} points. Try again.` : game.phase === "paused" ? "Game paused." : game.phase === "running" ? "Game started. Hold arrow keys or WASD to move." : "Ready to play."}</div>

    {dialog === "guide" && <Modal title="A guide to staying uneaten." onClose={() => setDialog(null)}>
      <p className="modal-intro">Forget everything you know about Snake. You’re the mango now, and you’ve got places to be.</p>
      <div className="guide-steps"><div><span className="guide-icon"><JungleFruit/></span><div><h3>01. You move. It follows.</h3><p>Hold <strong>WASD or the arrow keys</strong> to move. Release to stop. On a phone, hold the direction buttons below the board. Walls and hedges stop you; touching any part of the snake ends the round.</p></div></div><div><span className="guide-icon"><Route size={26}/></span><div><h3>02. Bait. Turn. Escape.</h3><p>The snake aims at you, then commits to a straight lunge. Move away mid-lunge to lure it into a wall, hedge, or its own body. It can’t turn straight back on itself.</p></div></div><div><span className="guide-icon"><Zap size={26}/></span><div><h3>03. Keep a little in reserve.</h3><p>Press <strong>Space</strong> or tap Dash to burst three cells in your current direction. It recharges in four seconds. Dashing won’t let you pass through the snake or hedges.</p></div></div><div><span className="guide-icon"><Trophy size={26}/></span><div><h3>04. Live to see another snack.</h3><p>Make the snake crash to win, or survive until it runs out of energy. It shrinks as it gets hungry. Levels last <strong>{arena.duration / 1000} seconds</strong> in this arena. Survival is endless: the hunter keeps its length and a crash brings a new snake. Harder modes multiply your points.</p></div></div><div><span className="guide-icon"><Sprout size={26}/></span><div><h3>05. Turn a close call into a rush.</h3><p>Move safely away from a cell directly beside the snake’s head for <strong>2× movement speed</strong>: two seconds in Levels, five in Survival. Every new dodge refreshes the full timer with no cooldown. Look for the turquoise leaf trail and rush timer. Pausing freezes the boost.</p></div></div></div>
      <div className="guide-footnote"><Pause size={16}/><span><strong>Esc</strong> pauses. <strong>R</strong> restarts. Changing tabs pauses automatically.</span></div><button className="modal-primary" onClick={() => setDialog(null)}>Got it. Stay uneaten. <Check size={18}/></button>
    </Modal>}

    {dialog === "scores" && <Modal title="Your little hall of fame." onClose={() => { setDialog(null); setConfirmClear(false); }}><p className="modal-intro">Small escapes deserve big recognition. Your best runs, saved in this browser.</p><div className="lifetime-stats"><div><strong>{data.best.toLocaleString()}</strong><span>BEST SCORE</span></div><div><strong>{data.attempts}</strong><span>COMPLETED RUNS</span></div><div><strong>{data.wins}</strong><span>GREAT ESCAPES</span></div></div>{bestRuns.length ? <ol className="score-list">{bestRuns.map((run, index) => <li key={run.id}><span className="rank">0{index + 1}</span><div><strong>{ARENAS[run.arena].name}</strong><span>{run.mode === "survival" ? "Survival" : "Levels"} · {DIFFICULTIES[run.difficulty].label} · {formatTime(run.elapsed)} · {run.won ? "Escaped" : "Eaten"} · {run.closeCalls} close calls</span></div><strong>{run.score.toLocaleString()} <small>pts</small></strong>{run.won && <Trophy size={16}/>}</li>)}</ol> : <div className="empty-scores"><Trophy size={34}/><h3>Greatness starts with a first bite.</h3><p>Finish a round and your score will appear here.</p></div>}<p className="score-note">10 points per second. Level escape bonus starts at 1,000. Survival scores time.<br/>Normal earns 1.5× points. Hard earns 2× points. Abandoned rounds aren’t recorded.</p>{data.attempts > 0 && <div className="clear-scores">{confirmClear ? <><span>Clear all saved runs and your personal best?</span><div><button onClick={() => { clearScores(); setConfirmClear(false); }}>Yes, clear scores</button><button onClick={() => setConfirmClear(false)}>Keep my scores</button></div></> : <button onClick={() => setConfirmClear(true)}>Clear local scores</button>}</div>}</Modal>}

    {dialog === "about" && <Modal title="A classic, from the other side." onClose={() => setDialog(null)}><div className="about-art"><SnakeMark/><span>→</span><JungleFruit/></div><p className="modal-intro">Reverse Snake began as a Python and Kivy prototype with one question: what if you were the food?</p><p className="about-copy">This browser edition keeps the original 20 × 20 grid and turns that idea into five playable arenas. No accounts, no downloads, no grand destiny. Just a little mango refusing to be lunch.</p><p className="score-note"><a href="/third-party-notices.txt">Font and icon licence notices →</a></p><div className="about-tags"><span><Sprout size={14}/>5 arenas</span><span><Zap size={14}/>3 difficulties</span><span><Heart size={14}/>Made to play</span></div><button className="modal-primary" onClick={() => setDialog(null)}>Back to the jungle <ArrowRight size={18}/></button></Modal>}
  </>;
}
