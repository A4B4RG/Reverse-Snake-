export function SnakeMark({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M6 5h27v11H17v8h16v11H6V5Z" fill="currentColor" /><path d="M6 5h10v10H6zM23 24h10v11H23z" fill="currentColor"/><path d="M25 8h4v4h-4z" fill="var(--logo-eye, #f4f4eb)"/></svg>;
}

export function PixelApple({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M23 5h4v11h-4z" fill="#536d3c"/><path d="M27 6h9v5h-9zM31 3h6v5h-6z" fill="#779845"/><path d="M10 15h10v3h8v-3h10v5h4v19h-5v5H13v-5H8V20h2z" fill="#f77c65"/><path d="M13 21h5v11h-5z" fill="#ffb396"/><path d="M13 39h24v5H13z" fill="#dc6453"/></svg>;
}

export function GardenMap({ arena = 0 }: { arena?: number }) {
  const paths = ["M15 45h25V20h24v29h22", "M14 22h23v44h26V28h23", "M12 62h26V22h28v39h20", "M15 24h21v44h31V25h19", "M13 68h24V20h23v31h25"];
  return <svg className="garden-map" viewBox="0 0 100 90" fill="none" aria-hidden="true"><defs><pattern id={`mini-grid-${arena}`} width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10 0H0V10" stroke="#476441" strokeWidth=".5"/></pattern></defs><rect width="100" height="90" rx="7" fill="#244530"/><rect x="5" y="5" width="90" height="80" fill={`url(#mini-grid-${arena})`}/><path d={paths[arena]} stroke="#ceea88" strokeWidth="8" strokeLinecap="square" strokeLinejoin="round"/><rect x="81" y={arena === 0 ? 45 : 24} width="9" height="9" rx="2" fill="#e0f598"/><path d="M19 67h9v10h-9z" fill="#ff977b"/><path d="M23 64h2v4h-2z" fill="#d5dfb5"/></svg>;
}
