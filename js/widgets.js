/* js/widgets.js — Sonoma-style desktop widget column. Owned by Dev W.
   Mounts one grid container into #widgets-root (positioned and sized by
   css/main.css; the root is click-through, the grid re-enables pointer
   events). Consumes no events; dispatches 'tb:open-app' {app:'coffee'}
   from the Coffee card only. Calendar/clock are live Date math; Weather
   and Markets fetch keyless public APIs (Open-Meteo, CoinGecko) and keep
   the static content as graceful fallback; Coffee is static. */
(function () {
  'use strict';

  /* ---------- static data ---------- */

  var WEEKDAYS = [
    'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY',
    'THURSDAY', 'FRIDAY', 'SATURDAY'
  ];

  /* Fixed UTC offsets in minutes (August values, per spec). */
  var CITIES = [
    { name: 'Cupertino', offset: -420 },
    { name: 'Tokyo', offset: 540 },
    { name: 'Sydney', offset: 600 },
    { name: 'Paris', offset: 120 }
  ];

  var STOCKS = [
    { label: 'DOW', value: '53,569' },
    { label: 'S&P 500', value: '7,731' },
    { label: 'AAPL', value: '314.58' }
  ];

  var STOCK_HEADLINE =
    'Premarket movers: Gap surges 13%, PayPal jumps on earnings beat';

  /* ---------- dom helper ---------- */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined && text !== null) { node.textContent = text; }
    return node;
  }

  /* ---------- live-fetch helpers (weather + markets) ---------- */

  /* fetch JSON with a hard AbortController timeout; ok(data) on success,
     err(error) on any failure. Returns the settled chain so callers can
     release their in-flight guards. */
  function fetchJson(url, timeoutMs, ok, err) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, timeoutMs);
    return fetch(url, { signal: ctrl.signal })
      .then(function (res) {
        if (!res.ok) { throw new Error('http ' + res.status); }
        return res.json();
      })
      .then(ok)
      .catch(err)
      .then(function () { clearTimeout(timer); });
  }

  /* Failed-fetch handler factory: one console.warn per widget per session,
     pins a tiny gray "offline" badge bottom-right, removes it again on the
     next success. */
  function makeOffline(card, tag) {
    var note = null;
    var warned = false;
    return {
      fail: function (err) {
        if (!warned) {
          warned = true;
          console.warn('widgets: ' + tag + ' fetch failed', err);
        }
        if (!note) {
          note = el('div', 'tb-widget-note', 'offline');
          card.appendChild(note);
        }
      },
      ok: function () {
        if (note) {
          card.removeChild(note);
          note = null;
        }
      }
    };
  }

  /* ---------- 1. calendar ---------- */

  function renderCalendar() {
    var now = new Date();
    var card = el('section', 'tb-widget tb-widget--cal');
    card.appendChild(el('div', 'tb-cal-weekday', WEEKDAYS[now.getDay()]));
    card.appendChild(el('div', 'tb-cal-day', String(now.getDate())));
    card.appendChild(el('div', 'tb-cal-tomorrow', 'TOMORROW'));
    var row = el('div', 'tb-cal-event');
    row.appendChild(el('span', 'tb-cal-event-emoji', '🎧'));
    row.appendChild(el('span', 'tb-cal-event-text', 'lofi beats all day'));
    card.appendChild(row);
    return card;
  }

  /* Swap in a fresh calendar just after each midnight, then re-arm. */
  function armMidnightRefresh(grid) {
    var now = new Date();
    var justAfterMidnight = new Date(
      now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 2
    );
    setTimeout(function () {
      var stale = grid.querySelector('.tb-widget--cal');
      if (stale) { grid.replaceChild(renderCalendar(), stale); }
      armMidnightRefresh(grid);
    }, justAfterMidnight - now);
  }

  /* ---------- 2. weather (live Open-Meteo; static fallback) ---------- */

  /* Open-Meteo weather_code → [icon, label]. First match wins. */
  var WEATHER_COND = [
    [[0], '☀️', 'Clear'],
    [[1, 2], '⛅', 'Partly Cloudy'],
    [[3], '☁️', 'Mostly Cloudy'],
    [[45, 48], '🌫', 'Fog'],
    [[51, 53, 55], '🌦', 'Drizzle'],
    [[61, 63, 65], '🌧', 'Rain'],
    [[66, 67], '🌧', 'Icy Rain'],
    [[71, 73, 75, 77], '🌨', 'Snow'],
    [[80, 81, 82], '🌧', 'Showers'],
    [[95, 96, 99], '⛈', 'Thunderstorm']
  ];

  function weatherCondition(code) {
    for (var i = 0; i < WEATHER_COND.length; i++) {
      if (WEATHER_COND[i][0].indexOf(code) !== -1) {
        return { icon: WEATHER_COND[i][1], label: WEATHER_COND[i][2] };
      }
    }
    return { icon: '☁️', label: 'Cloudy' };
  }

  /* Static first paint; initWeather swaps in live values on success. */
  function renderWeather() {
    var card = el('section', 'tb-widget tb-widget--weather');
    card.appendChild(el('div', 'tb-weather-city', 'New Delhi'));
    card.appendChild(el('div', 'tb-weather-temp', '32°'));
    card.appendChild(el('div', 'tb-weather-icon', '☁️'));
    card.appendChild(el('div', 'tb-weather-cond', 'Mostly Cloudy'));
    card.appendChild(el('div', 'tb-weather-hilo', 'H:34° L:28°'));
    return card;
  }

  /* Geolocate once (silent fallback to New Delhi), fetch Open-Meteo with a
     6s timeout, refresh every 15 min with no overlapping requests. */
  function initWeather(card) {
    var cityEl = card.querySelector('.tb-weather-city');
    var tempEl = card.querySelector('.tb-weather-temp');
    var iconEl = card.querySelector('.tb-weather-icon');
    var condEl = card.querySelector('.tb-weather-cond');
    var hiloEl = card.querySelector('.tb-weather-hilo');
    var offline = makeOffline(card, 'weather');
    var place = { lat: 28.61, lon: 77.21, label: 'New Delhi' };
    var inFlight = false;

    function update() {
      if (inFlight || typeof fetch !== 'function') { return; }
      inFlight = true;
      var url = 'https://api.open-meteo.com/v1/forecast?latitude=' +
        place.lat + '&longitude=' + place.lon +
        '&current=temperature_2m,weather_code' +
        '&daily=temperature_2m_max,temperature_2m_min&timezone=auto';
      fetchJson(url, 6000, function (data) {
        var cur = data && data.current;
        var daily = data && data.daily;
        if (!cur || typeof cur.temperature_2m !== 'number') {
          throw new Error('bad payload');
        }
        var cond = weatherCondition(cur.weather_code);
        cityEl.textContent = place.label;
        tempEl.textContent = Math.round(cur.temperature_2m) + '°';
        iconEl.textContent = cond.icon;
        condEl.textContent = cond.label;
        if (daily && daily.temperature_2m_max && daily.temperature_2m_min &&
            typeof daily.temperature_2m_max[0] === 'number' &&
            typeof daily.temperature_2m_min[0] === 'number') {
          hiloEl.textContent = 'H:' + Math.round(daily.temperature_2m_max[0]) +
            '° L:' + Math.round(daily.temperature_2m_min[0]) + '°';
        }
        offline.ok();
      }, offline.fail).then(function () { inFlight = false; });
    }

    if (typeof navigator !== 'undefined' && navigator.geolocation &&
        navigator.geolocation.getCurrentPosition) {
      try {
        navigator.geolocation.getCurrentPosition(function (pos) {
          place = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            label: 'My Location'
          };
          update();
        }, function () { update(); }, { timeout: 5000 });
      } catch (err) { update(); }
    } else {
      update();
    }
    setInterval(update, 15 * 60 * 1000);
  }

  /* ---------- 3. world clock ---------- */

  /* City offset relative to the USER's timezone: "+3:30" / "−12:30".
     cityUTCminusLocal = cityOffsetMinutes − localOffsetMinutes. */
  function formatOffset(cityOffset) {
    var localOffset = -new Date().getTimezoneOffset();
    var diff = cityOffset - localOffset;
    var abs = Math.abs(diff);
    var sign = diff < 0 ? '−' : '+';
    var hh = Math.floor(abs / 60);
    var mm = abs % 60;
    return sign + hh + ':' + (mm < 10 ? '0' : '') + mm;
  }

  /* One city column: 64px face (12 numerals + 3 hands + dot), then
     name / Today / relative-offset labels. */
  function buildClockCity(city) {
    var col = el('div', 'tb-clock-city');
    var face = el('div', 'tb-clock-face');
    for (var n = 1; n <= 12; n++) {
      var angle = n * 30;
      var num = el('span', 'tb-clock-num', String(n));
      num.style.transform =
        'translate(-50%, -50%) rotate(' + angle + 'deg)' +
        ' translateY(-25px) rotate(' + (-angle) + 'deg)';
      face.appendChild(num);
    }
    var hour = el('div', 'tb-clock-hand tb-clock-hand--hour');
    var minute = el('div', 'tb-clock-hand tb-clock-hand--minute');
    var second = el('div', 'tb-clock-hand tb-clock-hand--second');
    face.appendChild(hour);
    face.appendChild(minute);
    face.appendChild(second);
    face.appendChild(el('div', 'tb-clock-dot'));
    col.appendChild(face);
    col.appendChild(el('div', 'tb-clock-name', city.name));
    col.appendChild(el('div', 'tb-clock-today', 'Today'));
    col.appendChild(el('div', 'tb-clock-offset', formatOffset(city.offset)));
    return {
      offset: city.offset, col: col,
      hour: hour, minute: minute, second: second
    };
  }

  function buildClock() {
    var card = el('section', 'tb-widget tb-widget--wide tb-widget--clock');
    var strip = el('div', 'tb-clock-cities');
    var faces = [];
    for (var i = 0; i < CITIES.length; i++) {
      var city = buildClockCity(CITIES[i]);
      faces.push(city);
      strip.appendChild(city.col);
    }
    card.appendChild(strip);
    return { card: card, faces: faces };
  }

  /* Epoch ms is zone-free, so Date.now() + offset (rendered via UTC
     getters) yields each city's wall time. One shared 1s interval. */
  function tickClocks(faces) {
    var nowMs = Date.now();
    for (var i = 0; i < faces.length; i++) {
      var f = faces[i];
      var d = new Date(nowMs + f.offset * 60000);
      var s = d.getUTCSeconds();
      var m = d.getUTCMinutes();
      var h = d.getUTCHours() % 12;
      f.hour.style.transform =
        'translateX(-50%) rotate(' + (h * 30 + m * 0.5) + 'deg)';
      f.minute.style.transform =
        'translateX(-50%) rotate(' + (m * 6 + s * 0.1) + 'deg)';
      f.second.style.transform =
        'translateX(-50%) rotate(' + (s * 6) + 'deg)';
    }
  }

  /* ---------- 4. markets (live CoinGecko crypto; static fallback) ---------- */

  var MARKETS = [
    { id: 'bitcoin', symbol: '₿', name: 'Bitcoin' },
    { id: 'ethereum', symbol: 'Ξ', name: 'Ethereum' },
    { id: 'solana', symbol: '◎', name: 'Solana' }
  ];

  /* Static first paint; initMarkets swaps in live crypto rows on success. */
  function renderStocks() {
    var card = el('section', 'tb-widget tb-widget--stocks');
    for (var i = 0; i < STOCKS.length; i++) {
      var row = el('div', 'tb-stocks-row');
      row.appendChild(el('span', 'tb-stocks-up', '▲'));
      row.appendChild(el('span', 'tb-stocks-label', STOCKS[i].label));
      row.appendChild(el('span', 'tb-stocks-value', STOCKS[i].value));
      card.appendChild(row);
    }
    card.appendChild(el('div', 'tb-stocks-divider'));
    card.appendChild(el('div', 'tb-stocks-source', 'Investing.com'));
    card.appendChild(el('div', 'tb-stocks-headline', STOCK_HEADLINE));
    return card;
  }

  /* Fetch CoinGecko simple/price with a 6s timeout, refresh every 5 min
     with no overlapping requests. On error the static rows stay put. */
  function initMarkets(card) {
    var offline = makeOffline(card, 'markets');
    var inFlight = false;

    function renderLive(data) {
      card.textContent = '';
      for (var i = 0; i < MARKETS.length; i++) {
        var quote = data[MARKETS[i].id];
        if (!quote || typeof quote.usd !== 'number') { continue; }
        var change = typeof quote.usd_24h_change === 'number' ?
          quote.usd_24h_change : 0;
        var up = change >= 0;
        var row = el('div', 'tb-stocks-row');
        row.appendChild(el('span', 'tb-market-symbol', MARKETS[i].symbol));
        row.appendChild(el('span', 'tb-market-name', MARKETS[i].name));
        row.appendChild(el('span', 'tb-market-price',
          Math.round(quote.usd).toLocaleString('en-US')));
        row.appendChild(el('span',
          'tb-market-change tb-market-change--' + (up ? 'up' : 'down'),
          (up ? '▲ ' : '▼ ') + Math.abs(change).toFixed(1) + '%'));
        card.appendChild(row);
      }
      card.appendChild(el('div', 'tb-stocks-divider'));
      var now = new Date();
      var hh = now.getHours();
      var mm = now.getMinutes();
      var stamp = (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;
      var meta = el('div', 'tb-market-meta');
      meta.appendChild(el('span', 'tb-stocks-source', 'CoinGecko · live'));
      meta.appendChild(el('span', 'tb-market-updated', 'updated ' + stamp));
      card.appendChild(meta);
    }

    function update() {
      if (inFlight || typeof fetch !== 'function') { return; }
      inFlight = true;
      var url = 'https://api.coingecko.com/api/v3/simple/price' +
        '?ids=bitcoin,ethereum,solana&vs_currencies=usd' +
        '&include_24hr_change=true';
      fetchJson(url, 6000, function (data) {
        if (!data || !data.bitcoin || typeof data.bitcoin.usd !== 'number') {
          throw new Error('bad payload');
        }
        renderLive(data);
        offline.ok();
      }, offline.fail).then(function () { inFlight = false; });
    }

    update();
    setInterval(update, 5 * 60 * 1000);
  }

  /* ---------- 5. coffee CTA ---------- */

  function renderCoffee() {
    var card = el('button', 'tb-widget tb-widget--coffee');
    card.type = 'button';
    card.appendChild(el('div', 'tb-coffee-icon', '☕'));
    card.appendChild(el('div', 'tb-coffee-title', 'Buy us a coffee'));
    card.appendChild(el('div', 'tb-coffee-sub', 'keeps the notch spinning'));
    card.addEventListener('click', function () {
      window.dispatchEvent(new CustomEvent('tb:open-app', {
        detail: { app: 'coffee' }
      }));
    });
    return card;
  }

  /* ---------- mount ---------- */

  function init() {
    var root = document.getElementById('widgets-root');
    if (!root) { return; }

    var grid = el('div', 'tb-widgets');
    grid.appendChild(renderCalendar());
    var weatherCard = renderWeather();
    grid.appendChild(weatherCard);

    var clock = buildClock();
    grid.appendChild(clock.card);

    var stocksCard = renderStocks();
    grid.appendChild(stocksCard);
    grid.appendChild(renderCoffee());
    root.appendChild(grid);

    tickClocks(clock.faces);
    setInterval(function () { tickClocks(clock.faces); }, 1000);
    armMidnightRefresh(grid);
    initWeather(weatherCard);
    initMarkets(stocksCard);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
