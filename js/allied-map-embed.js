/* ───────────────────────────────────────────────────────────────────────────
 * Women's Allied Health Network — embedded homepage map.
 * The embed adds no gate of its own; it sits behind the homepage's existing
 * FERTOOL2026 access gate, so it is NOT public (same protection as the site).
 * Renders the Leaflet allied map into #amxMap from data/allied_points.json.
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

  var map, cluster, POINTS = [], shown = {};

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
  function render() {
    cluster.clearLayers();
    var n = 0;
    POINTS.forEach(function (p) {
      if (!shown[p.profession]) return;
      cluster.addLayer(L.marker([p.lat, p.lng], { icon: pinIcon(profMeta(p.profession).color) }).bindPopup(popup(p)));
      n++;
    });
    var c = document.getElementById('amxCount');
    if (c) c.textContent = n + ' of ' + POINTS.length + ' practitioners shown';
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
  function init() {
    map = L.map('amxMap').setView([-37.8136, 144.9631], 11);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      { attribution: '© OpenStreetMap, © CARTO', maxZoom: 19 }).addTo(map);
    cluster = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 38 });
    cluster.addTo(map);
    buildLegend(); render();
    var a = document.getElementById('amxAll'), nn = document.getElementById('amxNone');
    if (a) a.addEventListener('click', function () { setAll(true); });
    if (nn) nn.addEventListener('click', function () { setAll(false); });
    setTimeout(function () { try { map.invalidateSize(); } catch (e) {} }, 200);
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
