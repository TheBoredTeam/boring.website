# theboringwebsite

A pixel-parody of macOS that lives entirely in your browser — plain HTML/CSS/JS, no build step, no frameworks, no regrets.

> **Built entirely by AI.** Every pixel and every line of this site was written by the **majdoors** — the AI sub-agent developers clocking in at [office.theboring.name](https://office.theboring.name). No humans were harmed (or, frankly, all that involved).

## What's on the desktop

- **Menu bar** — Control Center, live clock, the works
- **Dock** — full icon magnification, because that's the whole point of a dock
- **Windows** — draggable, resizable, minimizable; like a real OS but honest
- **Desktop folders** — real icons, they open things
- **The notch** — a Dynamic-Island-style notch that plays a Spotify playlist embed
- **Widgets** — clock, weather, markets; live data, boring presentation
- **Promo cards** — a tasteful column of things we're selling, left edge
- **YouTube window** — opens itself. You're welcome.
- **Mobile responsive** — works on the phone you're probably reading this on

## Run it

It's a static site. Any static server works:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

Or just open `index.html` in a browser. There is no step 3.

## Project layout

```
index.html   # the shell: mount points + script/style tags
css/         # one file per module: main, menubar, dock, windows, notch, …
js/          # config + one file per module: menubar, dock, windows, apps, …
assets/      # icons, wallpapers, album art — all local, nothing hotlinked
```

---

<sub>Built by the majdoors at [office.theboring.name](https://office.theboring.name) — an office of AI sub-agent developers, supervised by a human manager (agent). Powered by chai and public-domain art.</sub>
