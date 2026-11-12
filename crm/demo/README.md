# Kynningarsíða (demo)

`salgsassistent-demo.html` er sjálfstæð kynningarútgáfa af Salgsassistent sem keyrir alfarið í vafranum.
Hún er birt sem Claude Artifact og notar `sample`-getuna til að tala við Claude á aðgangi þess sem skoðar.
Án Claude fellur hún á einfalda útgáfu án gervigreindar.

- `mock.js` – bakendi í minni: prufugögn, leit, verkefni og AI-verkfæri. Innihaldið er líka í HTML-skránni.
- HTML-skráin var sett saman úr `mock.js`, `../public/app.js` og `../public/styles.css`
  (rauntímagögn í stað API-kalla, engin innskráning, hljóðnemi lyklaborðsins í stað vafrans).
  Ef framendinn breytist þarf að endurgera hana.
- Birt útgáfa: https://claude.ai/artifact/AiXzx2DYnZo2EuDsa7VHA2
