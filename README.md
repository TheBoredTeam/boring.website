
<div align="center">

<img src="assets/icons/boring-notch.png" width="96" alt="boring.notch icon" />

# boring.notch — the website

**The home of [boring.notch](https://github.com/TheBoredTeam/boring.notch) — a pixel-faithful macOS desktop that lives entirely in your browser.**
Zero dependencies. Zero build step. Just open `index.html`.

> **Built entirely by AI.** Every pixel and every line of this site was written by the **majdoors** — the AI sub-agent developers clocking in at [boringfloor.com](https://boringfloor.com). No humans were harmed (or, frankly, all that involved).

[![made with](https://img.shields.io/badge/made%20with-%E2%98%95-brown)](#)
[![zero dependencies](https://img.shields.io/badge/dependencies-zero-brightgreen)](#)
[![license](https://img.shields.io/badge/license-MIT-blue)](#license)
[![boring.notch](https://img.shields.io/badge/also-boring.notch-black?logo=github)](https://github.com/TheBoredTeam/boring.notch)

<img src="assets/screenshot-desktop.jpg" alt="theboringwebsite — a macOS desktop in the browser" width="100%" />

[Live site](#) · [boring.notch for macOS](https://github.com/TheBoredTeam/boring.notch) · [theboringoffice](https://boringfloor.com) · [Discord](https://discord.com/invite/HznxBpnJmQ) · [Buy us a coffee](https://buymeacoffee.com/jfxh67wvfxq)

</div>

---

## What's inside

| | |
|---|---|
| 🎵 **Functional Dynamic-Island notch** | Streams six hand-verified lofi radio stations (SomaFM, Zeno, Chillhop). Boots in the playing state — album art, colorful EQ — and real audio arms on your first click. Live calendar week-strip, battery, transport controls. |
| 🧭 **In-page Safari** | A full window manager (drag, minimize, zoom, Esc) with a Safari-chrome window showing a replica of the [boring.notch repo](https://github.com/TheBoredTeam/boring.notch) — plus the resizable Extensions Store. |
| 🗂️ **A real Finder** | Draggable desktop folders, navigable virtual filesystem of this site's own source, back/forward history, sidebar favorites, and a Preview window that renders the actual code (line numbers included) and images. |
| 🧩 **Sonoma widgets with live data** | Calendar, real weather (Open-Meteo), four analog world clocks, and live crypto markets (CoinGecko). Keyless, CORS-friendly APIs only. |
| 🚀 **macOS Dock** | 22 real app icons, cosine-falloff magnification with neighbors that *push apart* like the real thing, running indicators, and a wiggling Trash. |
| 🎛️ **Menu bar that works** | Apple menu, dropdowns, Spotlight (⌘-style app launcher), battery popup with real charge state, Control Center (brightness that actually dims the desktop, volume, music mini-player, DND), live clock. |
| 🖼️ **Rotating gallery wallpaper** | Renoir, Kruseman, Courbet, Friedrich, Monet, Sisley — public-domain masters, crossfading every 5 seconds. |
| 📱 **Responsive** | On phones the desktop becomes a clean scrolling feed of the same cards; windows go near-fullscreen. |

## Extension Store

The Extensions Store opens by default on the right, with the YouTube trailer lower on the left, replacing the boringfloor embed. Drag any edge or corner to resize it, or focus the bottom-right resize control and use arrow keys (Shift for larger steps). Phone layouts use a fitted window.

The App Store dock icon, Applications grid, Spotlight, and the download card open the extension collection. The same storefront is directly accessible at `/extensions/`, with shareable detail links such as `/extensions/?extension=lock-screen`.

Manage every listing in [`extensions/catalog.json`](extensions/catalog.json). Adding an entry updates cards, categories, search, prices, and detail views without changing the renderer or adding a backend. See [the catalog guide](extensions/README.md) for the schema, release rules, and submission workflow.

Lock Screen is listed as one $1 permanent bundle and marked **coming soon**. The free Now Playing Example is a **developer preview**, with source instead of a consumer download. These states keep unreleased listings from offering a purchase or install button prematurely.

```sh
node scripts/validate-extensions.cjs
node --test tests/*.test.cjs
```

The website still has no dependencies or build step. Serve it over HTTP to load the JSON catalog (a `file://` tab cannot fetch it).

## Run it locally


```bash
python3 -m http.server 8888
# → http://localhost:8888
```

or `npx serve .` — or just open `index.html` in a browser.

## Deploy it (Cloudflare Pages)

The repo is the deployable artifact — no build step.

```bash
npx wrangler pages deploy . --project-name boring-website
```

For continuous deployment, connect the GitHub repo in the Cloudflare Pages
dashboard with **Framework preset: None** and **Build output directory: /**.

## Project layout

```
index.html          # the shell: mount points + script/style tags
css/                # main, menubar, notch, dock, windows, apps,
                    # widgets, desktop-icons, promo — one file per module
js/                 # config (single source of truth), menubar, notch, dock,
                    # windows, apps, widgets, desktop-icons, promo
assets/             # icons, wallpapers, album art — all local, nothing hotlinked
wrangler.jsonc      # Cloudflare Pages config
```

Everything talks over tiny contracts: `window.TB_CONFIG` (data),
`window.TBApps` / `window.TBWindows` / `window.TBMusic` (capabilities), and
`tb:open-app` / `tb:music-state` / `tb:window-state` (events). No frameworks,
no bundlers, no tears.

## The boring universe

- **[boring.notch](https://github.com/TheBoredTeam/boring.notch)** — the real macOS notch app this site demos. Free & open source.
- **[theboringoffice](https://boringfloor.com)** — AI agents that run your boring work (opens in its own browser tab).
- **[Discord](https://discord.com/invite/HznxBpnJmQ)** — lofi, code & questionable life choices.
- **[Buy Me a Coffee](https://buymeacoffee.com/jfxh67wvfxq)** — keeps the notch spinning.

## License

MIT — do boring things with it.
