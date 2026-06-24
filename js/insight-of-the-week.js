/* ───────────────────────────────────────────────────────────────────────────
 * Insight of the Week — renders the backend /capsule into #insightOfWeek.
 * Fetches the LIVE Cloud Run /capsule (CORS-open). The SEED snapshot is rendered
 * immediately so the card is NEVER blank, and is kept as the catch-fallback if
 * the live fetch fails or is blocked. Source-tiered chips: evidence
 * (Guideline/Research/Practice) vs perspective (Perspective/Explainer).
 * data-src="live|seed" on #insightOfWeek tells you which payload is showing.
 * ─────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var CAPSULE_ENDPOINT = "https://fertility-gp-backend-532857641879.australia-southeast2.run.app/capsule";

  // Last-known-good /capsule snapshot — the catch fallback (point-in-time).
  var SEED = {
    "week_of": "2026-06-24",
    "hero": {
      "kicker": "Guideline",
      "impact": "Updated contraceptive eligibility criteria now inform safer prescribing across all methods",
      "title": "The new UK Medical Eligibility Criteria for Contraceptive Use (UKMEC) 2025: what has changed?",
      "why_it_matters": "The 2025 UKMEC refresh clarifies risk–benefit profiles for contraceptive choice in complex patients, directly affecting prescribing decisions in your clinic. <b>Review updated criteria for any patients on new medications or with evolving comorbidities to optimise contraceptive safety.</b>",
      "source": "BMJ SRH (journal)",
      "url": "http://srh.bmj.com/cgi/content/short/52/2/83?rss=1",
      "date": "2025"
    },
    "more": [
      { "category": "Research", "chip": "Pre-conception care", "title": "Women are open to receiving pre-pregnancy care invitations from general practices", "source": "BMJ SRH", "url": "https://blogs.bmj.com/bmjsrh/2024/11/13/pre-pregnancy-care/" },
      { "category": "Practice", "chip": "Safeguarding", "title": "Recognising and responding to reproductive coercion in general practice: a qualitative study", "source": "BMJ SRH (journal)", "url": "http://srh.bmj.com/cgi/content/short/52/2/101?rss=1" }
    ]
  };

  var EVIDENCE = { "Guideline": 1, "Research": 1, "Practice": 1 };
  function chipCSS(cat) {
    return EVIDENCE[cat]
      ? "background:#e7f0ea;color:#356046;"   // evidence tier — green
      : "background:#efeaf3;color:#5a4c80;";  // perspective tier — aubergine
  }
  function esc(s) {
    return (s == null ? "" : String(s)).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  // why_it_matters carries <b>…</b> from our own endpoint — escape everything,
  // then re-allow ONLY <b>/</b> (no other HTML can slip through).
  function rich(s) { return esc(s).replace(/&lt;b&gt;/g, "<b>").replace(/&lt;\/b&gt;/g, "</b>"); }

  // Decorative cellular/Voronoi watermark (blastocyst/follicle motif). Purely
  // visual — masked to the top-right corner so it never sits behind body text.
  var MOTIF =
    '<svg class="iow-motif" viewBox="0 0 240 240" fill="none" stroke="currentColor" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="120" cy="120" r="106" stroke-width="1.4"/>' +
      '<path d="M120 78 L150 92 L148 124 L118 134 L92 116 L98 86 Z" stroke-width="1"/>' +
      '<path d="M120 78 L98 86 L80 62 L106 46 L132 52 Z" stroke-width="1"/>' +
      '<path d="M120 78 L132 52 L162 58 L168 90 L150 92 Z" stroke-width="1"/>' +
      '<path d="M150 92 L168 90 L190 112 L176 140 L148 124 Z" stroke-width="1"/>' +
      '<path d="M148 124 L176 140 L166 172 L134 168 L118 134 Z" stroke-width="1"/>' +
      '<path d="M118 134 L134 168 L106 186 L84 160 L92 116 Z" stroke-width="1"/>' +
      '<path d="M92 116 L84 160 L56 146 L60 108 L80 62 L98 86 Z" stroke-width="1"/>' +
      '<circle cx="120" cy="120" r="9" stroke-width="1"/>' +
    '</svg>';

  function injectCSS() {
    if (document.getElementById("iow-style")) return;
    var s = document.createElement("style");
    s.id = "iow-style";
    s.textContent =
      "#insightOfWeek{max-width:760px;margin:0 auto}" +
      "#insightOfWeek .iow-card{position:relative;overflow:hidden;background:#fff;border-radius:20px;padding:2rem 2.1rem 1.7rem;box-shadow:0 16px 46px rgba(90,60,80,0.13);font-family:'Montserrat',sans-serif}" +
      "#insightOfWeek .iow-motif{position:absolute;top:-36px;right:-36px;width:250px;height:250px;color:#6b5b95;opacity:0.09;z-index:0;pointer-events:none;-webkit-mask-image:radial-gradient(125% 125% at 100% 0%,#000 28%,transparent 70%);mask-image:radial-gradient(125% 125% at 100% 0%,#000 28%,transparent 70%)}" +
      "#insightOfWeek .iow-head,#insightOfWeek .iow-hero,#insightOfWeek .iow-more{position:relative;z-index:1}" +
      "#insightOfWeek .iow-head{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:1.15rem}" +
      "#insightOfWeek .iow-eyebrow{font-size:0.7rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6b5b95}" +
      "#insightOfWeek .iow-week{font-size:0.7rem;color:#b3a8bd;letter-spacing:0.4px}" +
      "#insightOfWeek .iow-hero{display:block;text-decoration:none;color:inherit;border-bottom:1px solid #f0ecf3;padding-bottom:1.25rem;margin-bottom:1.15rem}" +
      "#insightOfWeek .iow-accent{display:block;width:34px;height:2px;background:#6b5b95;border-radius:2px;margin:0 0 0.95rem;opacity:0.85}" +
      "#insightOfWeek .iow-chip{display:inline-block;font-size:0.63rem;font-weight:700;text-transform:uppercase;letter-spacing:0.7px;border-radius:11px;padding:3px 11px}" +
      "#insightOfWeek .iow-title{font-family:'Cormorant Garamond',serif;font-weight:600;font-size:2.15rem;line-height:1.15;letter-spacing:0.2px;color:#241f2b;margin:0.75rem 0 0.55rem}" +
      "#insightOfWeek .iow-hero:hover .iow-title{color:#6b5b95}" +
      "#insightOfWeek .iow-why{font-size:0.92rem;line-height:1.68;color:#54505c;margin:0.45rem 0 0.8rem}" +
      "#insightOfWeek .iow-why b{color:#2c2c2c;font-weight:600}" +
      "#insightOfWeek .iow-src{font-size:0.69rem;color:#a99fb3;letter-spacing:0.6px;text-transform:uppercase}" +
      "#insightOfWeek .iow-more{display:flex;flex-direction:column;gap:0.9rem}" +
      "#insightOfWeek .iow-item{display:flex;align-items:flex-start;gap:0.65rem;text-decoration:none;color:inherit}" +
      "#insightOfWeek .iow-item:hover .iow-item-title{color:#6b5b95}" +
      "#insightOfWeek .iow-item-body{display:flex;flex-direction:column;gap:2px}" +
      "#insightOfWeek .iow-item-title{font-size:0.87rem;font-weight:500;color:#2c2c2c;line-height:1.35}" +
      "#insightOfWeek .iow-item-src{font-size:0.69rem;color:#aaa;letter-spacing:0.4px;text-transform:uppercase}" +
      "@media(max-width:640px){#insightOfWeek .iow-card{padding:1.5rem 1.35rem;border-radius:16px}#insightOfWeek .iow-title{font-size:1.62rem}#insightOfWeek .iow-motif{width:200px;height:200px;top:-28px;right:-28px;opacity:0.06}}";
    document.head.appendChild(s);
  }

  function itemHTML(m) {
    return '<a class="iow-item" href="' + esc(m.url) + '" target="_blank" rel="noopener">' +
      '<span class="iow-chip" style="' + chipCSS(m.category) + '">' + esc(m.category) + '</span>' +
      '<span class="iow-item-body"><span class="iow-item-title">' + esc(m.title) + '</span>' +
      '<span class="iow-item-src">' + esc(m.source) + '</span></span></a>';
  }

  function render(d, src) {
    var el = document.getElementById("insightOfWeek");
    if (!el || !d || !d.hero || !d.hero.title) return false;  // invalid → caller keeps prior render
    var h = d.hero;
    var more = (d.more || []).map(itemHTML).join("");
    el.setAttribute("data-src", src);
    el.innerHTML =
      '<div class="iow-card">' + MOTIF +
        '<div class="iow-head"><span class="iow-eyebrow">Insight of the Week</span>' +
          (d.week_of ? '<span class="iow-week">week of ' + esc(d.week_of) + '</span>' : '') + '</div>' +
        '<a class="iow-hero" href="' + esc(h.url) + '" target="_blank" rel="noopener">' +
          '<span class="iow-accent"></span>' +
          '<span class="iow-chip" style="' + chipCSS(h.kicker) + '">' + esc(h.kicker) + '</span>' +
          '<h3 class="iow-title">' + esc(h.title) + '</h3>' +
          (h.why_it_matters ? '<p class="iow-why">' + rich(h.why_it_matters) + '</p>' : '') +
          '<span class="iow-src">' + esc(h.source) + (h.date ? ' · ' + esc(h.date) : '') + '</span>' +
        '</a>' +
        (more ? '<div class="iow-more">' + more + '</div>' : '') +
      '</div>';
    return true;
  }

  function load() {
    if (!document.getElementById("insightOfWeek")) return;
    injectCSS();
    render(SEED, "seed");                       // immediate — the card is never blank
    fetch(CAPSULE_ENDPOINT, { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (d) { render(d, "live"); }) // upgrade to live (no-ops if payload invalid → SEED stays)
      .catch(function () { /* fetch blocked/failed — SEED already showing, never blank */ });
  }
  if (document.readyState !== "loading") load();
  else document.addEventListener("DOMContentLoaded", load);
})();
