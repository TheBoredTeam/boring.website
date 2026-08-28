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

  /* Music: the notch embeds this Spotify playlist via Spotify's free keyless
     iframe Embed (no API keys, no OAuth — playback happens inside Spotify's
     own cross-origin player, so the site can't drive its transport). Pill
     title/artwork come from the keyless oEmbed endpoint at runtime, with a
     graceful emoji + fallbackTitle when that fetch fails (offline/blocked). */
  music: {
    playlistUrl: 'https://open.spotify.com/playlist/2iFVkT5FwlAPxDpmAZIEQr',
    embedUrl: 'https://open.spotify.com/embed/playlist/2iFVkT5FwlAPxDpmAZIEQr?utm_source=generator',
    oembedUrl: 'https://open.spotify.com/oembed?url=https://open.spotify.com/playlist/2iFVkT5FwlAPxDpmAZIEQr',
    fallbackTitle: 'Spotify Playlist',
  },
};
