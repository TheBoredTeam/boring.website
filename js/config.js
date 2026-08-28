/* js/config.js — single source of truth. Owned by the MANAGER. Loaded FIRST.
   Every module reads window.TB_CONFIG; nobody else defines it. */
window.TB_CONFIG = {
  siteName: 'theboringwebsite',
  appName: 'theboringwebsite',

  /* Wallpaper rotation (public-domain classics, local assets). `wallpaper` is
     the first frame / legacy fallback; menubar.js crossfades through the list
     every wallpaperInterval ms with a wallpaperFade ms ease. */
  wallpaper: 'assets/wallpapers/renoir-boating.jpg',
  wallpapers: [
    'assets/wallpapers/renoir-boating.jpg',
    'assets/wallpapers/kruseman-winter.jpg',
    'assets/wallpapers/courbet-snow.jpg',
    'assets/wallpapers/friedrich-wanderer.jpg',
    'assets/wallpapers/monet-magpie.jpg',
    'assets/wallpapers/sisley-snow.jpg',
  ],
  wallpaperInterval: 5000,
  wallpaperFade: 1400,

  links: {
    github: 'https://github.com/TheBoredTeam/boring.notch',
    githubReleases: 'https://github.com/TheBoredTeam/boring.notch/releases',
    buymeacoffee: 'https://buymeacoffee.com/jfxh67wvfxq',
    discord: 'https://discord.com/invite/HznxBpnJmQ',
    office: 'https://office.theboring.name',
    tagsApi: 'https://api.github.com/repos/TheBoredTeam/boring.notch/tags',
  },

  /* Live latest-tag lookup for the version labels (promo card, download card,
     README badge). Cached in localStorage for 1h (GitHub allows 60 req/hr/IP);
     silently falls back to the last known tag on any failure. */
  getLatestTag: function (cb) {
    var FALLBACK = 'v2.7.3';
    var KEY = 'tb-latest-tag';
    var TTL = 3600 * 1000;
    function done(tag) { if (typeof cb === 'function') cb(tag); }
    try {
      var cached = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (cached && cached.tag && (Date.now() - cached.ts) < TTL) {
        done(cached.tag);
        return;
      }
    } catch (e) { /* no storage / corrupt cache → fetch */ }
    if (typeof fetch !== 'function') { done(FALLBACK); return; }
    var ctl = (typeof AbortController === 'function') ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, 6000) : 0;
    fetch(window.TB_CONFIG.links.tagsApi, ctl ? { signal: ctl.signal } : {})
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function (tags) {
        clearTimeout(timer);
        var tag = (tags && tags[0] && typeof tags[0].name === 'string' && tags[0].name) || FALLBACK;
        try { localStorage.setItem(KEY, JSON.stringify({ tag: tag, ts: Date.now() })); } catch (e) {}
        done(tag);
      })
      .catch(function () { clearTimeout(timer); done(FALLBACK); });
  },

  /* All stream URLs verified live (HTTP 200/206, audio/mpeg) on 2026-08-28. */
  stations: [
    {
      id: 'lofi-radio',
      name: 'Lofi Radio',
      tag: 'beats to code to · lofi',
      streamUrl: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
      emoji: '🌙',
      grad: ['#232526', '#414345'],
      art: 'assets/album-art.jpg',
    },
    {
      id: 'lofi-cafe',
      name: 'Lofi Café',
      tag: 'coffee & chill · lofi',
      streamUrl: 'https://play.streamafrica.net/lofiradio',
      emoji: '☕',
      grad: ['#b79891', '#94716b'],
    },
    {
      id: 'chillhop',
      name: 'Chillhop',
      tag: 'jazzy beats · ilovemusic',
      streamUrl: 'https://streams.ilovemusic.de/iloveradio17.mp3',
      emoji: '🎷',
      grad: ['#355c7d', '#6c5b7b'],
    },
    {
      id: 'groove-salad',
      name: 'Groove Salad',
      tag: 'ambient beats · SomaFM',
      streamUrl: 'https://ice1.somafm.com/groovesalad-128-mp3',
      emoji: '🥗',
      grad: ['#134e5e', '#71b280'],
    },
    {
      id: 'fluid',
      name: 'Fluid',
      tag: 'future soul · SomaFM',
      streamUrl: 'https://ice1.somafm.com/fluid-128-mp3',
      emoji: '🌊',
      grad: ['#1a2980', '#26d0ce'],
    },
    {
      id: 'lush',
      name: 'Lush',
      tag: 'vocal chill · SomaFM',
      streamUrl: 'https://ice1.somafm.com/lush-128-mp3',
      emoji: '🌸',
      grad: ['#c33764', '#1d2671'],
    },
  ],
};
