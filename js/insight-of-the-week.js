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

  function injectCSS() {
    if (document.getElementById("iow-style")) return;
    var s = document.createElement("style");
    s.id = "iow-style";
    s.textContent =
      "#insightOfWeek{max-width:760px;margin:0 auto}" +
      "#insightOfWeek .iow-card{background:#fff;border:1px solid #ece7f0;border-radius:16px;padding:1.6rem 1.8rem;box-shadow:0 6px 24px rgba(60,50,70,0.07);font-family:'Montserrat',sans-serif}" +
      "#insightOfWeek .iow-head{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:0.9rem}" +
      "#insightOfWeek .iow-eyebrow{font-size:0.72rem;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#6b5b95}" +
      "#insightOfWeek .iow-week{font-size:0.72rem;color:#aaa}" +
      "#insightOfWeek .iow-hero{display:block;text-decoration:none;color:inherit;border-bottom:1px solid #f0ecf3;padding-bottom:1.1rem;margin-bottom:1rem}" +
      "#insightOfWeek .iow-chip{display:inline-block;font-size:0.66rem;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border-radius:11px;padding:2px 10px}" +
      "#insightOfWeek .iow-title{font-family:'Cormorant Garamond',serif;font-weight:600;font-size:1.5rem;line-height:1.2;color:#2c2c2c;margin:0.55rem 0 0.5rem}" +
      "#insightOfWeek .iow-hero:hover .iow-title{color:#6b5b95}" +
      "#insightOfWeek .iow-why{font-size:0.9rem;line-height:1.6;color:#555;margin:0.3rem 0 0.6rem}" +
      "#insightOfWeek .iow-why b{color:#2c2c2c;font-weight:600}" +
      "#insightOfWeek .iow-src{font-size:0.74rem;color:#999}" +
      "#insightOfWeek .iow-more{display:flex;flex-direction:column;gap:0.7rem}" +
      "#insightOfWeek .iow-item{display:flex;align-items:flex-start;gap:0.6rem;text-decoration:none;color:inherit}" +
      "#insightOfWeek .iow-item:hover .iow-item-title{color:#6b5b95}" +
      "#insightOfWeek .iow-item-body{display:flex;flex-direction:column;gap:1px}" +
      "#insightOfWeek .iow-item-title{font-size:0.86rem;font-weight:500;color:#2c2c2c;line-height:1.3}" +
      "#insightOfWeek .iow-item-src{font-size:0.72rem;color:#aaa}" +
      "@media(max-width:640px){#insightOfWeek .iow-card{padding:1.2rem 1.2rem}#insightOfWeek .iow-title{font-size:1.3rem}}";
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
      '<div class="iow-card">' +
        '<div class="iow-head"><span class="iow-eyebrow">Insight of the Week</span>' +
          (d.week_of ? '<span class="iow-week">week of ' + esc(d.week_of) + '</span>' : '') + '</div>' +
        '<a class="iow-hero" href="' + esc(h.url) + '" target="_blank" rel="noopener">' +
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
