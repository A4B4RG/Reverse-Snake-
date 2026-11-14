# Asset manifest

| Asset | Actual source | Use / ownership |
| --- | --- | --- |
| Flexible canopy board, mossy stones, four snake patterns and leaf effects | src/lib/render-game.ts | Project-authored Canvas geometry; same renderer in all modes and replay. |
| Brand, legacy fruit icon, arena maps | src/components/pixel-art.tsx | Project-authored SVG. |
| Five full fruit sprites | src/lib/fruit-art.ts | Project-authored Canvas artwork, including transparent ghost composition. |
| Skin-selection fruit/snake icons | src/components/appearance-picker.tsx | Project-authored SVG. |
| Favicon | public/icon.svg | Project-authored SVG. |
| UI palette and leaf-shaped buttons | src/app/globals.css | Project-authored CSS. |
| UI icons | lucide-react package, exact version in lockfile | Lucide / Feather notices copied to docs/licences/Lucide.txt. |
| Body font | @fontsource-variable/dm-sans | Bundled WOFF2; source metadata identifies Google Fonts DM Sans. OFL notice retained. |
| Display font | @fontsource-variable/space-grotesk | Bundled WOFF2; source metadata identifies Space Grotesk / Google Fonts. OFL notice retained. |
| Sound effects | src/lib/audio.ts | Project-authored Web Audio synthesis; no downloaded recordings. |
| Verification screenshots | docs/screenshots/ | Automated captures of this game, not runtime assets. |

No AI-generated bitmap, external texture, commercial art pack or remote font is used in this release. Canvas/SVG assets remain editable source. Package versions and font subsets are fixed by package-lock.json and installed package metadata.
