import { ARENAS } from "@/lib/game";

export function SnakeMark({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M12 36C3 28 8 14 18 15c9 1 0 17 10 18 9 1 11-10 6-17" stroke="currentColor" strokeWidth="7" strokeLinecap="round"/><ellipse cx="31" cy="12" rx="7" ry="9" transform="rotate(-28 31 12)" fill="currentColor"/><path d="m31 10 1 2m-6 0 1 2" stroke="var(--logo-eye, #091f25)" strokeWidth="2" strokeLinecap="round"/><path d="m14 21 4 3m-4 4 3 2m9 2 3-3" stroke="var(--logo-eye, #091f25)" strokeWidth="2"/></svg>;
}

export function JungleFruit({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M26 12c10 0 15 9 11 20-4 12-19 15-24 4C7 24 13 12 26 12Z" fill="#ffc55e"/><path d="M18 20c-5 7-3 14 1 17" stroke="#ffe7ad" strokeWidth="3" strokeLinecap="round"/><path d="m26 13 3-9" stroke="#ce9a53" strokeWidth="3" strokeLinecap="round"/><path d="M27 9c3-8 12-7 16-3-7 6-13 6-16 3Z" fill="#63ceb4"/></svg>;
}

export function GardenMap({ arena = 0 }: { arena?: number }) {
  return <svg className="garden-map" viewBox="0 0 100 100" fill="none" aria-hidden="true"><rect width="100" height="100" rx="12" fill="#123a3c"/><rect x="7" y="7" width="86" height="86" rx="4" stroke="#34766d"/>{ARENAS[arena].obstacles.map(p => <rect key={`${p.x}:${p.y}`} x={8 + p.x * 4.2} y={8 + p.y * 4.2} width="4" height="4" rx="1" fill="#709b89"/>)}<path d="M67 22h17v45H66" stroke="#dc9845" strokeWidth="6" strokeLinecap="round"/><path d="m76 43 5 4m-5 8 5 4" stroke="#805031" strokeWidth="3"/><ellipse cx="28" cy="64" rx="4" ry="6" transform="rotate(25 28 64)" fill="#ffc55e"/><path d="m30 57 4-3" stroke="#63ceb4" strokeWidth="2"/></svg>;
}
