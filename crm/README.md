# Salgsassistent – AI-baseret CRM med tale

En enkel CRM-løsning til 25–50 medarbejdere, hvor man **taler** med systemet i stedet for at udfylde formularer.

> **Status:** Prototype / demoversion (v0.1). Klar til at vise og afprøve med en lille testgruppe.

## Hvad kan den?

**Registrere ved tale.** Lige efter et møde trykker man på mikrofonen og fortæller hvad der skete:

> *"Har lige været hos Mette fra Nordjysk VVS. De vil have tilbuddet senest fredag, og jeg skal ringe til hende på tirsdag."*

Assistenten finder kunden, opsummerer hvad den vil gemme, og efter et "ja" registrerer den mødet, opretter opfølgningsopgaven med den rigtige dato og opdaterer evt. salgsmuligheden.

**Finde information ved tale.**
- *"Hvad er status på Vendsyssel Revision?"*
- *"Hvilke opgaver har jeg i denne uge?"*
- *"Hvad har Sofie lavet hos kunderne de sidste 14 dage?"*
- *"Giv mig et overblik over pipelinen."*

**Almindelige skærme**, så alle kan slå op og rette manuelt:
- **Kunder:** søgning (også på kontaktpersoner), stamdata, kontaktpersoner med "Ring"-knap, opgaver, salgsmuligheder og komplet historik.
- **Opgaver:** mine/alle, åbne/færdige, forfaldne markeres.
- **Overblik:** nøgletal, pipeline pr. fase, egne opgaver og seneste aktivitet.
- **Brugere** (kun administrator): opret og deaktivér medarbejdere.

Alle medarbejdere ser de samme kundedata. Alt der registreres viser hvem der har gjort det og hvornår.

## Teknik i korte træk

| Del | Valg |
|---|---|
| App | Webapp, der virker på mobil og computer og kan lægges på hjemmeskærmen (ingen App Store) |
| Server | Node.js 22, ingen eksterne frameworks |
| Database | SQLite (én fil, nem backup, rigeligt til 50 brugere) |
| AI | Claude API (Anthropic) med værktøjer til at søge og registrere i CRM'et |
| Tale → tekst | Browserens indbyggede talegenkendelse på dansk (prototype) |
| Tekst → tale | Browserens indbyggede oplæsning ("Læs svar højt") |
| Hosting | Docker på egen server i EU (Hetzner), automatisk HTTPS via Caddy |

## Kør lokalt

```bash
npm install
npm run seed                       # demodata (fiktive firmaer), login: anne@demo.dk / demo1234
ANTHROPIC_API_KEY=... COOKIE_SECURE=false npm start
# åbn http://localhost:3000
npm test                           # 23 tests
```

Opsætning på server: se [UPPSETNING.md](UPPSETNING.md).

## Planlagt efter prototypen

1. **Log ind med Microsoft 365** (Entra ID) i stedet for egne adgangskoder.
2. **Azure Speech (EU)** til talegenkendelse, så lyd ikke sendes via browserens udbyder, og navne genkendes bedre.
3. Import af eksisterende kundeliste (Excel/CSV).
4. Evt. Outlook-integration: møder og mails direkte på kunden.
