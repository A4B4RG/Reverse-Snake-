import type { Metadata, Viewport } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/space-grotesk";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reverse Snake — Outsmart the hunter.",
  description: "A small mango in a hungry jungle. Dodge, dash and earn close-call speed boosts in five arenas or endless survival.",
  applicationName: "Reverse Snake",
  icons: { icon: "/icon.svg" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

// Runs as the head is parsed, before the page can paint the saved palette.
const themeBootstrap = `(function(){var t="light";try{if(localStorage.getItem("reverse-snake:theme:v1")==="dark")t="dark"}catch(e){}document.documentElement.dataset.theme=t;var m=document.createElement("meta");m.name="theme-color";m.content=t==="dark"?"#091f25":"#f4f6ed";document.head.appendChild(m);})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-theme="light" suppressHydrationWarning><head><script id="theme-bootstrap" dangerouslySetInnerHTML={{ __html: themeBootstrap }} /></head><body>{children}</body></html>;
}
