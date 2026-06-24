/* ───────────────────────────────────────────────────────────────────────────
 * Confluence (formerly "Women's Allied Health Network") — embedded homepage map.
 * The embed adds no gate of its own; it sits behind the homepage's existing
 * FERTOOL2026 access gate, so it is NOT public (same protection as the site).
 * Renders the Leaflet allied map into #amxMap from data/allied_points.json, plus
 * a free-text search, a clickable result list, and an "Add your practice" modal.
 * Fully namespaced (IIFE + amx- ids/classes) so it can't collide with the rest
 * of index.html. Popups: name · profession · clinic · suburb. No ratings, no
 * verification — public professional listings only.
 * ─────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var PROFESSIONS = {
    'pelvic-physio': { label: 'Pelvic-health physiotherapist', color: '#dd7a2a' },
    'womens-health-physio': { label: "Women's health physiotherapist", color: '#e0a93b' },
    'psychologist': { label: 'Psychologist', color: '#c2548a' },
    'chinese-med': { label: 'Chinese medicine / acupuncture', color: '#8a6d3b' },
    'dietitian': { label: 'Dietitian (APD)', color: '#5c8a4e' },
    'exercise-physiologist': { label: 'Exercise physiologist', color: '#2e8b8b' },
    'lactation-consultant': { label: 'Lactation consultant', color: '#d4546b' },
    'continence-nurse': { label: 'Continence nurse', color: '#6b8e9e' },
    'ot': { label: 'Occupational therapist', color: '#7c3aed' },
    'social-worker': { label: 'Social worker', color: '#2b6cb0' },
    'genetic-counsellor': { label: 'Genetic counsellor', color: '#0a8f5c' },
    'diabetes-educator': { label: 'Diabetes educator', color: '#c0392b' },
    'naturopath': { label: 'Naturopath', color: '#6a8d2f' },
    'doula': { label: 'Doula / birth educator', color: '#b5651d' },
    'yoga-pilates': { label: 'Yoga / Pilates', color: '#9a6dd7' },
    'sexual-health-counsellor': { label: 'Sexual health counsellor', color: '#b04a8a' },
    'other-allied': { label: 'Other allied', color: '#9aa0a6' }
  };
  function profMeta(code) { return PROFESSIONS[code] || { label: code || 'Other', color: '#9aa0a6' }; }
  function esc(s) {
    return (s == null ? '' : String(s)).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  var map, cluster, POINTS = [], shown = {}, searchQuery = '', currentMarkers = {};

  function pinIcon(color) {
    return L.divIcon({
      className: '', html: '<div class="amx-pin" style="background:' + color + '"></div>',
      iconSize: [14, 14], iconAnchor: [7, 7], popupAnchor: [0, -8]
    });
  }
  function popup(p) {
    var m = profMeta(p.profession);
    return '<strong>' + esc(p.name) + '</strong>' +
      '<br><span style="color:' + m.color + ';font-weight:500;">' + esc(m.label) + '</span>' +
      (p.clinic ? '<br><span style="color:#666;">' + esc(p.clinic) + '</span>' : '') +
      (p.suburb ? '<br><span style="color:#888;font-size:0.78rem;">' + esc(p.suburb) + '</span>' : '');
  }
  // Normalise a (possibly array / missing) field to a searchable/displayable string.
  function field(p, k) {
    var v = p[k];
    if (v == null) return '';
    return Array.isArray(v) ? v.join(', ') : String(v);
  }
  function splitList(s) {
    return (s || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
  }
  function providerKey(p) {
    if (!p.__key) p.__key = p.name + '|' + p.lat + '|' + p.lng;
    return p.__key;
  }
  // Free-text filter: every token must appear in services + suburb + languages
  // (+ name + clinic, so it's useful on the current data). Case-insensitive AND.
  function matchesSearch(p) {
    if (!searchQuery) return true;
    var hay = (field(p, 'services') + ' ' + field(p, 'suburb') + ' ' + field(p, 'languages') +
               ' ' + field(p, 'name') + ' ' + field(p, 'clinic')).toLowerCase();
    return searchQuery.toLowerCase().split(/\s+/).filter(Boolean).every(function (t) {
      return hay.indexOf(t) !== -1;
    });
  }
  // Single source of truth: profession checkboxes AND the search box.
  function visibleProviders() {
    return POINTS.filter(function (p) { return shown[p.profession] && matchesSearch(p); });
  }
  function render() {
    cluster.clearLayers();
    currentMarkers = {};
    var vis = visibleProviders();
    vis.forEach(function (p) {
      var marker = L.marker([p.lat, p.lng], { icon: pinIcon(profMeta(p.profession).color) }).bindPopup(popup(p));
      currentMarkers[providerKey(p)] = marker;
      cluster.addLayer(marker);
    });
    var c = document.getElementById('amxCount');
    if (c) c.textContent = vis.length + ' of ' + POINTS.length + ' practitioners shown';
    renderList(vis);
  }
  function buildCard(p) {
    var m = profMeta(p.profession);
    var svc = field(p, 'services'), langs = field(p, 'languages');
    return '<div class="amx-card" data-key="' + esc(providerKey(p)) + '">' +
      '<div class="amx-card-name">' + esc(p.name) + '</div>' +
      (svc ? '<div class="amx-card-svc">' + esc(svc) + '</div>' : '') +
      '<div class="amx-card-meta"><span class="amx-card-dot" style="background:' + m.color + '"></span>' +
        esc(m.label) + (p.suburb ? ' · ' + esc(p.suburb) : '') + '</div>' +
      (langs ? '<div class="amx-card-lang">' + esc(langs) + '</div>' : '') +
      (p.telehealth === true ? '<span class="amx-tele">Telehealth</span>' : '') +
      '</div>';
  }
  function renderList(vis) {
    var box = document.getElementById('amxList');
    if (!box) return;
    box.innerHTML = vis.length
      ? vis.map(buildCard).join('')
      : '<div class="amx-list-empty">No practitioners match.</div>';
    Array.prototype.forEach.call(box.querySelectorAll('.amx-card'), function (card) {
      card.addEventListener('click', function () { flyToProvider(card.getAttribute('data-key')); });
    });
  }
  // Card click → fly the map to the pin and open its popup (de-clustering as needed).
  function flyToProvider(key) {
    var marker = currentMarkers[key];
    if (!marker) return;
    cluster.zoomToShowLayer(marker, function () { marker.openPopup(); });
  }
  function buildLegend() {
    var counts = {};
    POINTS.forEach(function (p) { counts[p.profession] = (counts[p.profession] || 0) + 1; });
    var order = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
    document.getElementById('amxLegend').innerHTML = order.map(function (code) {
      var m = profMeta(code);
      return '<label class="amx-leg"><input type="checkbox" data-p="' + code + '" checked>' +
        '<span class="amx-dot" style="background:' + m.color + '"></span>' + esc(m.label) +
        '<span class="amx-n">' + counts[code] + '</span></label>';
    }).join('');
    order.forEach(function (c) { shown[c] = true; });
    Array.prototype.forEach.call(document.querySelectorAll('#amxLegend input'), function (cb) {
      cb.addEventListener('change', function () { shown[cb.getAttribute('data-p')] = cb.checked; render(); });
    });
  }
  function setAll(v) {
    Array.prototype.forEach.call(document.querySelectorAll('#amxLegend input'), function (cb) {
      cb.checked = v; shown[cb.getAttribute('data-p')] = v;
    });
    render();
  }
  // Search box + "Add your practice" modal. Additive — does not alter the
  // checkbox/All-None handlers; the search simply calls the same render() path.
  function wireExtras() {
    var s = document.getElementById('amxSearch');
    if (s) s.addEventListener('input', function () { searchQuery = s.value || ''; render(); });

    var back = document.getElementById('amxModalBack');
    var openBtn = document.getElementById('amxAddBtn');
    var closeBtn = document.getElementById('amxModalClose');
    var form = document.getElementById('amxForm');
    var profSel = document.getElementById('amxF-prof');
    if (profSel) {
      profSel.innerHTML = Object.keys(PROFESSIONS).map(function (code) {
        return '<option value="' + esc(code) + '">' + esc(PROFESSIONS[code].label) + '</option>';
      }).join('');
    }
    function showNote(msg) {
      var n = document.getElementById('amxNote');
      if (!n) return;
      n.textContent = msg || '';
      n.style.display = msg ? 'block' : 'none';
    }
    function open() { showNote(''); if (back) back.classList.add('open'); }
    function close() { if (back) back.classList.remove('open'); }
    if (openBtn) openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (back) back.addEventListener('click', function (e) { if (e.target === back) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var suburb = (fd.get('suburb') || '').trim();
      // Shaped to match a providers-array entry so a future endpoint can append it
      // directly (services/languages as arrays; lat/lng geocoded below from suburb).
      var payload = {
        name: (fd.get('name') || '').trim(),
        profession: fd.get('profession') || '',
        suburb: suburb,
        clinic: (fd.get('name') || '').trim(),
        services: splitList(fd.get('services')),
        languages: splitList(fd.get('languages')),
        telehealth: fd.get('telehealth') === 'on',
        lat: null,
        lng: null
      };
      showNote('');
      if (!suburb) { showNote('Please enter a suburb so we can place you on the map.'); return; }

      // Geocode the suburb (free Nominatim, no API key) so the new entry is pinnable.
      var submitBtn = form.querySelector('.amx-submit');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Looking up suburb…'; }
      var url = 'https://nominatim.openstreetmap.org/search?format=json&countrycodes=au&q=' +
        encodeURIComponent(suburb + ' Victoria');
      fetch(url, { headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.json(); })
        .then(function (results) {
          if (!results || !results.length) {
            showNote('Couldn’t find “' + suburb + '” — check the spelling or try a nearby suburb.');
            return;  // keep the modal open
          }
          payload.lat = parseFloat(results[0].lat);
          payload.lng = parseFloat(results[0].lon);
          console.log('[Confluence] add-practice submission:', payload);
          // TODO: wire to backend store — POST `payload` to append it to the providers array.
          close();
          form.reset();
          showNote('');
          alert('Thanks! Your practice has been submitted for review.');
        })
        .catch(function () {
          showNote('Couldn’t look up that suburb right now — please try again.');
        })
        .finally(function () {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit listing'; }
        });
    });
  }
  function init() {
    map = L.map('amxMap').setView([-37.8136, 144.9631], 11);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      { attribution: '© OpenStreetMap, © CARTO', maxZoom: 19 }).addTo(map);
    cluster = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 38 });
    cluster.addTo(map);
    buildLegend(); render(); wireExtras();
    var a = document.getElementById('amxAll'), nn = document.getElementById('amxNone');
    if (a) a.addEventListener('click', function () { setAll(true); });
    if (nn) nn.addEventListener('click', function () { setAll(false); });
    // Fix 2 — the section now lives in a flex column; Leaflet can cache a stale
    // container width if init runs before the layout settles, and there was no
    // resize handler at all. Recompute now, next frame, after late reflows
    // (fonts/below-fold), after load (whether or not it already fired), and on
    // resize — so the map always fits its column and never bleeds past the edge.
    function fitMap() { try { map.invalidateSize(); } catch (e) {} }
    fitMap();
    requestAnimationFrame(fitMap);
    setTimeout(fitMap, 200);
    setTimeout(fitMap, 600);
    if (document.readyState === 'complete') { setTimeout(fitMap, 0); }
    else { window.addEventListener('load', fitMap); }
    var _rt;
    window.addEventListener('resize', function () { clearTimeout(_rt); _rt = setTimeout(fitMap, 150); });
  }
  document.addEventListener('DOMContentLoaded', function () {
    if (typeof L === 'undefined' || !document.getElementById('amxMap')) return;  // Leaflet/section absent — no-op
    fetch('data/allied_points.json')
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) {
        POINTS = d.points || [];
        if (d.professions) { for (var k in d.professions) { PROFESSIONS[k] = d.professions[k]; } }
        init();
      })
      .catch(function (e) {
        var el = document.getElementById('amxMap');
        if (el) el.innerHTML = '<p style="padding:1.5rem;color:#a13b3b;">Could not load map data: ' + e.message + '</p>';
      });
  });
})();
