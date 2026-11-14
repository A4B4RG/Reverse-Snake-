"use client";
import { ARENAS } from "@/lib/game";
import { Star } from "lucide-react";
import { starTargets, starsFor } from "@/lib/level-progress";

export function LevelScoreBar({ arena, name, score, target, cleared, running, onNext }: {
  arena: number; name: string; score: number; target: number; cleared: boolean; running: boolean; onNext?: () => void;
}) {
  const targets = starTargets(target), stars = starsFor(score, target), max = targets[2];
  return <div className="round-progress level-progress">
    <span>Level {arena + 1} · {name}</span><strong>{Math.floor(score)} pts</strong>
    <div className="star-score-track">
      <progress aria-label="Level score and stars" max={max} value={Math.min(score, max)}/>
      <i className={`unlock-marker ${cleared ? "earned" : ""}`} style={{ left: `${target / max * 100}%` }} title={`Unlock next map: ${target} points`}/>
      {targets.map((milestone, i) => <span key={milestone} className={`score-star ${stars > i ? "earned" : ""}`} style={{ left: `${milestone / max * 100}%` }} title={`${i + 1} ${i ? "stars" : "star"}: ${milestone} points`}><Star size={16} aria-hidden="true"/></span>)}
    </div>
    <span className="level-milestone" role="status">{cleared ? `${arena === ARENAS.length - 1 ? "Final map cleared" : "Next map unlocked"}${running ? " · Chase continues" : ""}` : `${arena === ARENAS.length - 1 ? "Clear map" : "Unlock next map"} at ${target} pts`} · {stars}/3 stars</span>
    <button className="level-next" disabled={!onNext} onClick={onNext}>{arena === ARENAS.length - 1 ? "Final map" : "Next map"}</button>
  </div>;
}
