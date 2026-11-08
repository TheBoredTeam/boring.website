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
    office: 'https://boringproducts.xyz',
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

  /* Notch playlist — 30s Spotify previews from the "peace" playlist
     (open.spotify.com/playlist/27clTrz70vBVktAWmMl1Z7). */
  music: {
    playlist: [
      { title: "Ganesha", artist: "Henrique Camacho, Zigma", artworkUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02cfe8673c061a869e137db6af', audioUrl: 'https://p.scdn.co/mp3-preview/692ebd437b1cdbf7481491ea372411093445db4a' },
      { title: "Papi (Bhabi)", artist: "Eden Shalev", artworkUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02b492526bde302a0258ccd18a', audioUrl: 'https://p.scdn.co/mp3-preview/9d075c4d636d1661c32bde3bab1e24c564825d6a' },
      { title: "300000003", artist: "999999999", artworkUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02cb2e7dcbc78a4b5372cbeb12', audioUrl: 'https://p.scdn.co/mp3-preview/8d4af41509bb039e5809c429710e6a4c084adf4d' },
      { title: "Catalunya", artist: "Henrique Camacho", artworkUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e025dec1958055f0132d74fa4ef', audioUrl: 'https://p.scdn.co/mp3-preview/bc03bb85421b027358985b3ecd624b4012e53bca' },
      { title: "Aao Huzoor", artist: "Aatma", artworkUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e023c84f2a5cd7e71cb9dba7c48', audioUrl: 'https://p.scdn.co/mp3-preview/830e2654e0b4b68bfc28f545bbf3429e539092d2' },
      { title: "Bella Ciao - Remix", artist: "House Of Paper", artworkUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e026144f596dbf03f4eacd03249', audioUrl: 'https://p.scdn.co/mp3-preview/e8140fe0e7c1fcf0ca4d372d356ed8c3bf802f1b' },
      { title: "Chuva 2.0", artist: "Chapeleiro, Henrique Camacho", artworkUrl: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02d2675e8a2ca2ebfb2a3a20e8', audioUrl: 'https://p.scdn.co/mp3-preview/9339a8399cbe29aeed2b4675d585f98dcb4f0979' },
      { title: "50's", artist: "Henrique Camacho", artworkUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02cf60d55e16e7981e98836e20', audioUrl: 'https://p.scdn.co/mp3-preview/0b91970bb11e1d7bcae36b5e28d4412a33ffbf74' },
      { title: "Shiva Style - Berg, Phanatic Remix", artist: "Mandragora, Berg, Phanatic", artworkUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e022f710e22f368bc004d3e6af7', audioUrl: 'https://p.scdn.co/mp3-preview/03a5786f09ce59af935f5627862f3cb95fa105a8' },
      { title: "L.S.D", artist: "Invasion", artworkUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02f16dde1db0e379380898aa4c', audioUrl: 'https://p.scdn.co/mp3-preview/a68825afef1b23f6d338fc9b55c991ea3e944f60' },
      { title: "Psy & Fly", artist: "Raz", artworkUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e0231a9d421a26bd3e02a1fef49', audioUrl: 'https://p.scdn.co/mp3-preview/26e1f34860078820db3f05f1885a7bf2cd7c0ccb' },
      { title: "Psychedelic Universe", artist: "Raz", artworkUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e0231a9d421a26bd3e02a1fef49', audioUrl: 'https://p.scdn.co/mp3-preview/6d0fb097c1aa207cc186ff542177ffb8c6485c1a' },
      { title: "Rick & Morty On Acid", artist: "Raz", artworkUrl: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e020d23c7c73428aa0ac70c3422', audioUrl: 'https://p.scdn.co/mp3-preview/3e8e6814d4de823dc52ac914d0fc08e561f2e491' },
      { title: "Galiya", artist: "Sajanka, TERRA", artworkUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02b8befd510845f54f574c3a71', audioUrl: 'https://p.scdn.co/mp3-preview/6d413c94e11396b872e2357480ea9317bfd78d67' },
      { title: "Hashmal", artist: "Menumas", artworkUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02cb54d09afe01afa472138616', audioUrl: 'https://p.scdn.co/mp3-preview/ce7d78b5679a2e58b2ec8bc436b0d1f46c98513c' },
      { title: "Mangeshkar", artist: "KiLLATK", artworkUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02691ad817c2704976fec7a587', audioUrl: 'https://p.scdn.co/mp3-preview/acf0a2c94e72ee60e394f3695a45643dd8d551e8' },
      { title: "Mama India (Shantrip) Remaster", artist: "Technical Hitch", artworkUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02a1fc63e7c89b86f58c49ec68', audioUrl: 'https://p.scdn.co/mp3-preview/d5c5e41b0f19b7136ded128eabad67fd420e2e71' },
      { title: "Indian Spirit", artist: "Blastoyz, Sajanka, Liora Itzhak", artworkUrl: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02444c3a507102ba18f7e81cc3', audioUrl: 'https://p.scdn.co/mp3-preview/6dd5a30f80b92c9e009fe424cd73c9e360ed8570' },
      { title: "Ganesha Namah - Original Mix", artist: "Mad Maxx, Shivadelic", artworkUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e0213800a8119ef8c47fdb96840', audioUrl: 'https://p.scdn.co/mp3-preview/ce0e372b556d00703b4fc57c58018f793e457256' },
      { title: "TAAL", artist: "KiLLATK, Pyrokine", artworkUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e0270999bc22efdd41a4656e7a3', audioUrl: 'https://p.scdn.co/mp3-preview/0a453c2600d934f968f72856948a1c8b6eff7606' },
      { title: "High On Acid", artist: "Blastoyz", artworkUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e0226056a795fd5889acb6f5adb', audioUrl: 'https://p.scdn.co/mp3-preview/63be1398f0dd4609835c4467385a0199c69ef39f' },
      { title: "Future Kids (148 Bpm)", artist: "Fungus Funk, Kabayun, Ingrained Instincts", artworkUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02d059ccbbdd1209f7fff0e388', audioUrl: 'https://p.scdn.co/mp3-preview/99fe78800c8f7fe6bb434fbf85e720aa01b665d2' },
      { title: "Tandava - Blazy & Gottinari Remix", artist: "Shanti People, Blazy, Gottinari", artworkUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e0203e65668ea0bcefe96092f5a', audioUrl: 'https://p.scdn.co/mp3-preview/64cc87134b2cdb940795ef2edbcab62710e7fd41' },
      { title: "Great Spirit", artist: "Armin van Buuren, Vini Vici, Hilight Tribe", artworkUrl: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e0265136cbf37de99af8963793b', audioUrl: 'https://p.scdn.co/mp3-preview/6c28161f173326828d60084b50122fe1d029bce6' },
      { title: "Shankara", artist: "Hilight Tribe", artworkUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e027d0805b3de864e4a3a97d184', audioUrl: 'https://p.scdn.co/mp3-preview/e6ffd69c4af87a8717b41d61b9a233240d2b356a' },
    ],
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
