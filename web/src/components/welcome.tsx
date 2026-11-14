"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Leaf, Zap, MousePointer2, Move } from "lucide-react";
import { SnakeMark } from "./pixel-art";
import { FruitIcon } from "./appearance-picker";
import { GameMenu } from "./game-menu";
import { unlockMusic } from "@/lib/music";

export default function Welcome() {
  const [screen, setScreen] = useState<"welcome" | "choose" | "guide">("welcome");
  const [role, setRole] = useState<"food" | "hunter">("food");
  const [guideStep, setGuideStep] = useState(0);
  return <main className="welcome-page">
    <header className="welcome-header"><Link href="/" aria-label="Reverse Snake home"><SnakeMark/><span>reverse snake.</span></Link><GameMenu/></header>
    <div className="welcome-fronds" aria-hidden="true"><Leaf/><Leaf/><Leaf/><Leaf/></div>
    {screen === "welcome" ? <section className="welcome-intro">
      <div className="welcome-logo" aria-hidden="true"><SnakeMark/></div><p className="welcome-kicker">The jungle has two sides.</p>
      <h1>Reverse<br/><span>Snake.</span></h1><p>Follow your instinct. Choose your side.</p>
      <button className="primary-button welcome-start" onClick={() => { unlockMusic(); setScreen("choose"); }}>Start <ArrowRight/></button>
    </section> : screen === "choose" ? <section className="role-screen">
      <p className="welcome-kicker">Your jungle. Your instinct.</p><h1>Who will you be?</h1><p>Hunt the fruit, or make your escape.</p>
      <div className="role-options">
        <button className="role-card hunter-role" onClick={() => { setRole("hunter"); setScreen("guide"); }}>
          <span className="role-art"><SnakeMark/></span><span className="role-title">Hunter</span><span className="role-caption">Lead the chase</span>
          <svg className="wrap-snake" viewBox="0 0 300 230" aria-hidden="true"><path d="M245 190 C300 120 264 28 160 24 C48 20 10 84 33 154 C49 208 112 225 198 200 C243 188 242 121 186 104"/><ellipse cx="186" cy="104" rx="17" ry="13"/><circle cx="189" cy="99" r="2"/></svg>
        </button>
        <button className="role-card food-role" onClick={() => { setRole("food"); setScreen("guide"); }}>
          <span className="role-art"><FruitIcon skin="apple"/></span><span className="role-title">Food</span><span className="role-caption">Outsmart the hunter</span><span className="hover-apple" aria-hidden="true"><FruitIcon skin="apple"/></span>
        </button>
      </div><button className="text-button" onClick={() => setScreen("welcome")}><ArrowLeft size={16}/> Back</button>
    </section> : <section className="welcome-guide">
      <p className="welcome-kicker">{role === "food" ? "Outsmart the hunter" : "Become the hunter"}</p><h1>How to play<br/> <span>{role === "food" ? "Food" : "Hunter"}.</span></h1>
      <div className="welcome-tip-tabs" aria-label="How to play tips">{["Move", "Escape", "Jungle", "Modes"].map((tip, i) => <button key={tip} aria-pressed={guideStep === i} onClick={() => setGuideStep(i)}>{i + 1}. {role === "hunter" && i === 1 ? "Catch" : tip}</button>)}</div>
      <div className="welcome-guide-grid">
        <article data-active={guideStep === 0}><Move/><h2>Choose a direction</h2><p>{role === "food" ? "Swipe up, down, left or right to keep moving that way. On desktop, hold arrow keys or WASD." : "Swipe or press arrow keys / WASD to turn. Your snake keeps moving; you can queue two turns and cannot reverse into your neck."}</p></article>
        <article data-active={guideStep === 1}><Zap/><h2>{role === "food" ? "Make your escape" : "Catch and collect"}</h2><p>{role === "food" ? "Double-tap to dash in your last direction; desktop uses Space. Dash recharges in four seconds. A close dodge gives a speed rush and shortens the hunter." : "Catch fruit to grow and score. Lightning gives 2× speed for ten seconds. Snowflakes stun the fruit for five seconds. Avoid your body and the walls."}</p></article>
        <article data-active={guideStep === 2}><Leaf/><h2>A changing jungle</h2><p>{role === "food" ? "Hunters grow with time and can split into two. Collisions stun them; their tails become their heads and the chase continues. Neither hunter can cross the other." : "The snake grows over time. On Hard, walls can sink and emerge elsewhere without warning. Watch the water and keep an escape route."}</p></article>
        <article data-active={guideStep === 3}><MousePointer2/><h2>Choose your chase</h2><p>Levels unlock maps at their score targets while play continues. Earn stars at +100, +300 and above +700 points. Survival opens all 30 maps. Start on Easy, pause with Esc or the pause button, and adjust touch, frames and music in Menu.</p></article>
      </div><div className="welcome-guide-actions"><button className="text-button" onClick={() => setScreen("choose")}><ArrowLeft size={16}/> Choose again</button><Link className="primary-button" href={role === "food" ? "/food" : "/hunter"} onClick={unlockMusic}>Play as {role === "food" ? "Food" : "Hunter"}<ArrowRight/></Link></div>
    </section>}
  </main>;
}
