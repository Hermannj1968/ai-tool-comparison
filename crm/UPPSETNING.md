# Uppsetning á Hetzner (fyrir Maldeka)

Leiðbeiningar til að koma Salgsassistent í loftið á þjóni hjá Hetzner. Gert er ráð fyrir Ubuntu-þjóni með Docker.

## 1. Þjónn

- **Mælt með:** sér lítill Hetzner Cloud-þjónn fyrir þetta kerfi (t.d. CX22: 2 vCPU / 4 GB, staðsettur í Falkenstein eða Nürnberg). Hann kostar nokkrar evrur á mánuði og heldur gögnum viðskiptavinarins aðskildum frá öðrum vefsíðum.
- Það er líka hægt að keyra kerfið á núverandi þjóni ef þar er Docker og laust pláss. Þá þarf annað port en 80/443, eða að núverandi vefþjónn (t.d. Plesk/nginx) áframsendi lénið á gáminn.
- Kveikið á **Hetzner Backups** fyrir þjóninn. Það kostar 20% aukalega og tekur daglega mynd af öllum þjóninum.

## 2. Lén

Búið til A-færslu, t.d. `crm.fyrirtaeki.dk` → IP-tala þjónsins.

## 3. Uppsetning

```bash
# á þjóninum
curl -fsSL https://get.docker.com | sh
git clone https://github.com/hermannj1968/ai-tool-comparison.git
cd ai-tool-comparison/crm
cp .env.example .env
nano .env          # fylla út CRM_DOMAIN, ANTHROPIC_API_KEY, ADMIN_EMAIL, ADMIN_PASSWORD
docker compose up -d --build
docker compose logs -f app
```

Caddy sækir HTTPS-skírteini sjálfkrafa þegar lénið vísar á þjóninn. Opnið síðan `https://crm.fyrirtaeki.dk` og skráið ykkur inn sem stjórnandi.

**Fyrir kynningu með prufugögnum** (aðeins á tómum gagnagrunni):

```bash
docker compose exec app node --disable-warning=ExperimentalWarning src/seed.js
# innskráning: anne@demo.dk / demo1234 (stjórnandi), lars@, sofie@, mads@demo.dk
```

Áður en raunveruleg gögn fara inn: stöðvið kerfið, eyðið `data/crm.db*` og ræsið aftur. Þá verður stjórnandinn úr `.env` til.

## 4. Afrit (backup)

Dagleg afritun gagnagrunnsins klukkan 02:15, sem geymir síðustu 14 daga í `data/backups/`:

```bash
crontab -e
15 2 * * * cd /root/ai-tool-comparison/crm && docker compose exec -T app npm run backup >> backup.log 2>&1
```

Afritin þurfa líka að vera **utan þjónsins**, t.d. á Hetzner Storage Box með `rsync`. Prófið endurheimt einu sinni: afritið er venjuleg SQLite-skrá sem kemur í stað `data/crm.db`.

## 5. Uppfærslur

```bash
cd ai-tool-comparison && git pull && cd crm && docker compose up -d --build
```

## 6. API-lykill og kostnaður

- Stofnið aðgang á console.anthropic.com, helst **á nafni fyrirtækisins** svo það greiði notkunina beint. Búið til API-lykil og setjið þakið (spend limit) á mánaðarnotkun.
- Sjálfgefið líkan er `claude-opus-5-5`. Gróft mat er um 0,3–0,7 DKK á hverja spurningu eða skráningu. 25 notendur með 5 samskipti á dag gera þá um 1.000–2.000 DKK á mánuði.
- Til að lækka kostnað má setja `CRM_MODEL=claude-sonnet-5-5` (um helmingi ódýrara) eða `CRM_EFFORT=low` í `.env`. Prófið gæðin á dönsku áður en þið skiptið.

## 7. GDPR – það sem þarf að vera á hreinu

- **Databehandleraftale** milli Maldeka (databehandler) og viðskiptavinarins (dataansvarlig).
- Undirvinnsluaðilar sem þarf að nefna: **Hetzner** (hýsing, Þýskalandi) og **Anthropic** (AI-vinnsla). Í framtíðinni bætist **Microsoft** við (Azure Speech/Entra ID).
- **Talgreining í frumgerðinni** notar innbyggðan búnað vafrans. Í Chrome og Edge er hljóðið sent til Google eða Microsoft. Það er í lagi í kynningu með prufugögnum, en fyrir raunverulegan rekstur á að skipta yfir í Azure Speech (EU), sem er fyrsta atriðið í næsta áfanga. Annar kostur á meðan er að nota hljóðnemann á lyklaborði símans.
- Gögn eru aðeins aðgengileg innskráðum starfsmönnum. Óvirkur notandi missir aðganginn strax.

## 8. Næsti áfangi (eftir kynningu)

| Verkefni | Áætlun |
|---|---|
| Innskráning með Microsoft 365 (Entra ID) | 1–2 dagar |
| Azure Speech (dönsk talgreining í EU) | 1–2 dagar |
| Innflutningur á núverandi viðskiptavinalista (Excel/CSV) | 1 dagur |
| Prufutímabil með 3–5 starfsmönnum, lagfæringar | 2–3 vikur |
