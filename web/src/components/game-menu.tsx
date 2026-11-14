"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { PlaySettings } from "./play-settings";
import { ChevronDown, Moon, Sun, X } from "lucide-react";
import { setTheme, useTheme } from "@/lib/theme";

export function GameMenu({ currentMode, onOpen, children }: { currentMode?: "fruit" | "hunter"; onOpen?: () => void; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const theme = useTheme();
  const id = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) close(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close();
      }
    };
    const focusOut = (event: FocusEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) close(false);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape, true);
    document.addEventListener("focusin", focusOut);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape, true);
      document.removeEventListener("focusin", focusOut);
    };
  }, [open, close]);
  useEffect(() => {
    if (open) closeButton.current?.focus({ preventScroll: true });
  }, [open]);

  return <div className="menu-wrapper" ref={wrapper}>
    <button className="menu-button" ref={trigger} aria-label="Open game menu" aria-expanded={open} aria-controls={id} aria-haspopup="dialog"
      onClick={() => {
        if (open) close();
        else {
          setOpen(true);
          onOpen?.();
        }
      }}>Menu <ChevronDown size={14} className={open ? "menu-chevron expanded" : "menu-chevron"} /></button>
    {open && <div className="menu-panel" id={id} role="dialog" aria-label="Game menu" onClick={event => {
      if ((event.target as HTMLElement).closest("[data-menu-close]")) close();
    }}>
      <div className="menu-heading"><span>Explore the canopy.</span><button ref={closeButton} className="icon-button" aria-label="Close menu" onClick={() => close()}><X size={18} /></button></div>
      <fieldset className="theme-option"><legend>Theme</legend><div className="theme-toggle">
        {(["light", "dark"] as const).map(value => <button key={value} aria-pressed={theme === value} onClick={() => {
          setNotice(setTheme(value) ? "" : "Theme changed for this visit. Browser storage is unavailable.");
        }}>{value === "light" ? <Sun size={17} /> : <Moon size={17} />}{value === "light" ? "Light" : "Dark"}</button>)}
      </div></fieldset>
      <PlaySettings/>
      {notice && <p className="theme-notice" role="status">{notice}</p>}
      <div className="game-menu">
        <Link href="/" onClick={() => close(false)}>Welcome screen</Link>
        {currentMode !== "fruit" && <Link href="/food" onClick={() => close(false)}>Fruit · escape the hunter</Link>}
        {currentMode !== "hunter" && <Link href="/hunter" onClick={() => close(false)}>Hunter · control the snake</Link>}
        <Link href="/challenge" onClick={() => close(false)}>Local Challenges</Link>
        <Link href="/replays" onClick={() => close(false)}>Watch saved replays</Link>
        {children}
      </div>
    </div>}
  </div>;
}
