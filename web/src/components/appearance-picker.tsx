"use client";
import { FRUITS, SNAKES, type Appearance } from "@/lib/appearance";
import { FRUIT_COLORS } from "@/lib/fruit-art";

export const SNAKE_COLORS = {
  amber: "#dc9845",
  jade: "#3caa8b",
  coral: "#e66e78",
  midnight: "#758ad4",
};
export function AppearancePicker({ value, disabled, onChange }: {
  value: Appearance; disabled: boolean; onChange: (v: Appearance) => void;
}) {
  return <fieldset className="appearance-picker" disabled={disabled}>
    <legend>Characters</legend>
    <label>Food character<select aria-label="Food character" value={value.fruit} onChange={e => onChange({ ...value, fruit: e.target.value as Appearance["fruit"] })}>
      {FRUITS.map(f => <option key={f} value={f}>{f[0].toUpperCase() + f.slice(1)}</option>)}
    </select></label>
    <label>Snake design<select aria-label="Snake design" value={value.snake} onChange={e => onChange({ ...value, snake: e.target.value as Appearance["snake"] })}>
      {SNAKES.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
    </select></label>
  </fieldset>;
}
export function FruitIcon({ skin = "apple" }: { skin?: Appearance["fruit"] }) {
  const path =
    skin === "mango"
      ? "M25 12C40 12 42 31 31 39S9 36 12 24s7-12 13-12Z"
      : skin === "pear"
        ? "M24 10c9 0 5 10 11 15 13 17-35 17-22 0 6-5 2-15 11-15Z"
        : skin === "orange"
          ? "M38 26a14 14 0 1 1-28 0 14 14 0 1 1 28 0Z"
          : skin === "strawberry"
            ? "M24 14C46 5 43 31 24 41 5 31 2 5 24 14Z"
            : "M24 16C43 3 46 35 31 40l-7-3-7 3C2 35 5 3 24 16Z";
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path
        d={path}
        fill={FRUIT_COLORS[skin]}
        stroke="#6a4834"
        strokeWidth="1.3"
      />
      <path
        d="M16 22q-4 6 1 10"
        stroke="#fff2c7"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path d="m24 15 2-10" stroke="#745134" strokeWidth="3" />
      <path d="M26 10q3-11 15-5-7 10-15 5" fill="var(--fruit-leaf)" />
      {skin === "strawberry" && (
        <g fill="#ffe4a3">
          <ellipse cx="19" cy="22" rx="1" ry="2" />
          <ellipse cx="29" cy="26" rx="1" ry="2" />
          <ellipse cx="22" cy="32" rx="1" ry="2" />
        </g>
      )}
    </svg>
  );
}
