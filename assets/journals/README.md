# Journal logos — typographic placeholders

These SVGs are **typographic placeholders**, not official journal logos.
Each file renders the journal's common abbreviation in a neutral serif
(Georgia / Cormorant Garamond) using the Fertool palette — deep green,
burgundy, navy, charcoal, muted gold. They deliberately do not attempt
to reproduce any publisher's brand identity, colors, or trademarks.

## Why placeholders?

Reproducing the real logos of scholarly journals requires licensing or
permission from the publisher. Until that's in place, the safe default
is to use typographic placeholders that communicate the journal name
without imitating its visual identity.

## Replacing a placeholder with an official logo

If you have confirmed licensing (e.g. written permission from the
publisher, or an open-access journal with a CC-licensed logo), you can
replace any `.svg` in this directory with the official artwork.

Requirements for a replacement:
- Filename must match the one mapped in `index.html` (`JOURNAL_LOGOS`).
- Viewbox should be roughly `0 0 120 48` so it fits the card layout.
- Transparent background.
- Prefer SVG; PNG also works if you swap the filename + extension.

## Files

| Filename | Journal | Palette |
|---|---|---|
| `fertility-sterility.svg` | Fertility and Sterility | deep green |
| `human-reproduction.svg` | Human Reproduction / Hum Reprod Update | navy |
| `rbm-online.svg` | Reproductive BioMedicine Online | burgundy |
| `jarg.svg` | J Assisted Reproduction and Genetics | charcoal |
| `nejm.svg` | New England Journal of Medicine | burgundy |
| `lancet.svg` | The Lancet | burgundy |
| `bmj.svg` | British Medical Journal | navy |
| `jama.svg` | JAMA | navy |
| `jama-network-open.svg` | JAMA Network Open | navy |
| `ajog.svg` | American Journal of Obstetrics and Gynecology | deep green |
| `obstet-gynecol.svg` | Obstetrics and Gynecology ("Green Journal") | deep green |
| `journal.svg` | Generic fallback for unmapped journals | muted gold |
