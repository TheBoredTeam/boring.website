/* js/config.js — single source of truth. Owned by the MANAGER. Loaded FIRST.
   Every module reads window.TB_CONFIG; nobody else defines it. */
window.TB_CONFIG = {
  siteName: 'boring.notch',
  appName: 'boring.notch',

  /* Wallpaper rotation (public-domain classics, local assets). `wallpaper` is
     the first frame / legacy fallback; menubar.js crossfades through the list
     every wallpaperInterval ms with a wallpaperFade ms ease. */
  wallpaper: 'assets/wallpapers/renoir-boating.jpg',
  /* Public-domain artworks with full attribution — the menubar shows a credit
     chip for the current piece and links out to its Wikimedia Commons page. */
  wallpapers: [
    { src: 'assets/wallpapers/renoir-boating.jpg', title: 'Luncheon of the Boating Party', artist: 'Pierre-Auguste Renoir', year: '1881', link: 'https://commons.wikimedia.org/wiki/File:Pierre-Auguste_Renoir_-_Luncheon_of_the_Boating_Party_-_Google_Art_Project.jpg' },
    { src: 'assets/wallpapers/courbet-snow.jpg', title: 'Effet de neige', artist: 'Gustave Courbet', year: '1866–68', link: 'https://commons.wikimedia.org/wiki/File:Gustave_Courbet_-_Effet_de_neige_(1860s).jpg' },
    { src: 'assets/wallpapers/monet-magpie.jpg', title: 'The Magpie', artist: 'Claude Monet', year: '1868–69', link: 'https://commons.wikimedia.org/wiki/File:Claude_Monet_-_The_Magpie_-_Google_Art_Project.jpg' },
    { src: 'assets/wallpapers/davinci-last-supper.jpg', title: 'The Last Supper', artist: 'Leonardo da Vinci', year: '1495–98', link: 'https://commons.wikimedia.org/wiki/File:Leonardo_da_Vinci_(1452-1519)_-_The_Last_Supper_(1495-1498).jpg' },
    { src: 'assets/wallpapers/kenzler-winter.jpg', title: 'Winter Landscape in the Sun', artist: 'Carl Kenzler', year: '', link: 'https://commons.wikimedia.org/wiki/File:Carl_Kenzler_-_Winter_Landscape_in_the_Sun.jpg' },
    { src: 'assets/wallpapers/vangogh-yellow-house.jpg', title: 'The Yellow House (The Street)', artist: 'Vincent van Gogh', year: '1888', link: 'https://commons.wikimedia.org/wiki/File:Vincent_van_Gogh_-_The_yellow_house_(%60The_street%27)_-_Google_Art_Project.jpg' },
    { src: 'assets/wallpapers/vangogh-harvest.jpg', title: 'The Harvest (De oogst)', artist: 'Vincent van Gogh', year: '1888', link: 'https://commons.wikimedia.org/wiki/File:Vincent_van_Gogh_-_De_oogst_-_Google_Art_Project.jpg' },
    { src: 'assets/wallpapers/kruseman-castle.jpg', title: 'Winterlandschap met schaatsers bij een kasteel', artist: 'Frederik Marinus Kruseman', year: '1886', link: 'https://commons.wikimedia.org/wiki/File:Frederik_Marinus_Kruseman_-_Winterlandschap_met_schaatsers_bij_een_kasteel.jpg' },
  ],
  wallpaperInterval: 15000,
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

  /* Notch now-playing. Empty audioUrl → iTunes Search 30s preview (Spotify
     Web API no longer ships preview_url; full Spotify play needs Premium SDK). */
  music: {
    id: 'indeed',
    title: 'Indeed',
    artist: 'Cheema Y',
    artworkUrl: '',
    audioUrl: '',
  },
};

/* User-changeable settings — the System Settings app writes these via its
   commit() path (mutate + persist + dispatch 'tb:settings'); consumers read
   here and listen for the event. Defaults merge under any saved state. */
window.TB_SETTINGS = Object.assign({
  wallpaperInterval: 15000,
  wallpaperSrc: 'assets/wallpapers/renoir-boating.jpg',
  dockMagnification: true,
  dockMaxScale: 1.6,
  volume: 0.8,
  brightness: 100,
}, (function () {
  try { return JSON.parse(localStorage.getItem('tb-settings') || '{}'); }
  catch (e) { return {}; }
})());
