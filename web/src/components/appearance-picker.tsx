"use client";
import { FRUITS, SNAKES, type Appearance } from "@/lib/appearance";
import { FRUIT_COLORS } from "@/lib/fruit-art";

export const SNAKE_COLORS = {
  amber: "#dc9845",
  jade: "#3caa8b",
  coral: "#e66e78",
  midnight: "#758ad4",
};
export function AppearancePicker({
  value,
  disabled,
  onChange,
}: {
  value: Appearance;
  disabled: boolean;
  onChange: (v: Appearance) => void;
}) {
  return (
    <fieldset className="appearance-picker" disabled={disabled}>
      <legend>YOUR LOOK</legend>
      <div className="skin-row" role="group" aria-label="Fruit skin">
        {FRUITS.map((f) => (
          <button
            key={f}
            type="button"
            aria-label={`${f[0].toUpperCase() + f.slice(1)} fruit`}
            aria-pressed={value.fruit === f}
            title={f}
            onClick={() => onChange({ ...value, fruit: f })}
          >
            <FruitIcon skin={f} />
          </button>
        ))}
      </div>
      <div className="skin-row" role="group" aria-label="Snake design">
        {SNAKES.map((s) => (
          <button
            key={s}
            type="button"
            aria-label={`${s[0].toUpperCase() + s.slice(1)} snake`}
            aria-pressed={value.snake === s}
            title={s}
            onClick={() => onChange({ ...value, snake: s })}
          >
            <svg viewBox="0 0 40 32" aria-hidden="true">
              <path
                d="M7 23h16c13 0 13-14 0-14H10"
                fill="none"
                stroke={SNAKE_COLORS[s]}
                strokeWidth="9"
                strokeLinecap="round"
              />
              {s === "jade" ? (
                <path d="M15 5v8m8 6v8" stroke="#164d45" strokeWidth="3" />
              ) : s === "coral" ? (
                <g fill="#85384b">
                  <circle cx="17" cy="9" r="2" />
                  <circle cx="24" cy="23" r="2" />
                </g>
              ) : s === "midnight" ? (
                <path
                  d="m14 7 5 4 5-4"
                  stroke="#d7d9ff"
                  fill="none"
                  strokeWidth="2"
                />
              ) : (
                <path d="m17 6 3 3-3 3-3-3Z" fill="#805031" />
              )}
              <circle cx="8" cy="8" r="1" fill="#152e2b" />
            </svg>
          </button>
        ))}
      </div>
    </fieldset>
  );
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
