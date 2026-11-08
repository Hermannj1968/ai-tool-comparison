# Danish digital-life apps on an imported Chinese-market Android phone (Oppo / ColorOS China), status as of Nov 2026

Research note on method: research date 2026-11-08. Most findings come from web-search snippets. Direct page fetches were blocked by this session's network policy for mitid.dk, borger.dk, help.vippsmobilepay.com, discuss.grapheneos.org, notebookcheck.net and tech.sportskeeda.com, so the official pages could not be read in full. Snippet-derived claims are marked where it matters. Dates are given wherever the source showed one.

## Q0. Baseline: what an imported ColorOS China phone looks like to Google and to apps

### Takeaway
China-SKU Oppo phones ship without Google Mobile Services (GMS) set up. GMS/Play Store can usually be switched on or sideloaded, but the device is often not "Play Protect certified", or is flagged as a China SKU. That status is what the Danish apps' integrity checks key on.

### Cited Findings
- On OPPO ColorOS (China) you can reportedly enable Google Mobile Services in Settings (search "Google Mobile Services"), then install the Play Store from the local app store and sign in. Other users report Play Services failing to connect, so nothing Google-based works. — [Smartprix guide](https://www.smartprix.com/bytes/how-to-get-google-play-store-working-on-chinese-roms/)
- Google: "only Play Protect certified devices are eligible to include Google apps, like the Google Play Store app". Turning off Play Protect does not fix a "Device is not certified" status. — [Google Android Help: Check & fix Play Protect certification](https://support.google.com/android/answer/7165974); [Google uncertified-device page](https://www.google.com/android/uncertified/warningauto)
- A PhoneArena reviewer using the China-only Oppo Find X8 Ultra (summer 2025) wrote that it "will never work 100% as intended outside of China". — [PhoneArena](https://www.phonearena.com/news/I-tried-using-Chinas-best-flagship-phone-but-it-fought-me-every-step-of-the-way_id171990)
- Global Find X8/X8 Pro editions were listed as Google Play Certified (leak via Play Console). This applies to global builds, not Chinese builds. — [Notebookcheck](https://www.notebookcheck.net/Oppo-Find-X8-and-X8-Pro-spotted-as-global-smartphones-in-pre-launch-leak.918558.0.html)
- Google tightened the Play Integrity "MEETS_STRONG_INTEGRITY" verdict in 2025 (Android 13+). It now requires a security patch from the last 12 months, otherwise the device is downgraded to DEVICE integrity. — [Android Developers: Improved verdicts](https://developer.android.com/google/play/integrity/improvements?authuser=1); [Microsoft Intune support tip](https://techcommunity.microsoft.com/t5/intune-customer-success/support-tip-changes-to-google-play-strong-integrity-for-android/ba-p/4435130)

### Inferences
- The decisive variable is not "Chinese phone" as such. It is whether the phone (a) has working GMS/Play Store, (b) passes Play Integrity DEVICE (and for some apps STRONG) verdicts, (c) is not rooted or bootloader-unlocked, and (d) since mid-2026 is not flagged as a "CN SKU" by Google Play Services (see Q3). A ColorOS-China phone with GMS enabled may pass DEVICE integrity on some models, because Oppo's Chinese builds use locked bootloaders and OEM-signed firmware. However, not being on Google's certified list is a common failure mode.
- Flashing a global/EEA ColorOS ROM, where the hardware supports it, or buying the global variant is the most reliable way around all of this.

### Gaps
- I found no source testing an Oppo ColorOS China device against Play Integrity verdicts (BASIC/DEVICE/STRONG) in 2026.
- Whether specific China-SKU Oppo models appear as "certified" in Play Store settings after GMS is enabled is unverified.

## Q1. What the key Danish apps require (Android version, GMS, Play Integrity, root detection, Play Store install)

### Takeaway
Nearly all of the important Danish apps (MitID, MobilePay, bank apps, and very likely the government apps that build on MitID) use Google Play Integrity and/or root detection. They need Google Play Services and a recent Android version (Android 10+ for MitID and the Kørekort app as of 2025). An uncertified or GMS-less phone should be expected to fail activation of MitID and MobilePay.

### Cited Findings
**MitID app**
- Minimum OS: a Danish parliamentary answer (2024–25 session) says Android 10+ / iOS 16+. Android 9 support ended 10 Dec 2024 (no new app version in Play for Android 9). About 37,000 Android-9 users lost access from 12 Aug 2025. — [Folketinget answer (PDF)](https://www.ft.dk/samling/20241/almdel/diu/spm/120/svar/2153007/3050532.pdf); [Mobilsiden: 37.000 danskere mister adgang](https://mobilsiden.dk/nyheder/apps-sociale-medier/37-000-danskere-mister-adgang-til-mitid/); [Dansk Erhverv, May 2025](https://www.danskerhverv.dk/presse-og-nyheder/nyheder/2025/maj/bruger-du-android-fra-den-12.-august-kan-du-ikke-langere-tjekke-mitid); [Ældre Sagen on 10 Dec 2024 update](https://www.aeldresagen.dk/frivilligportalen/nyt-paa-frivilligportalen/alle-nyheder/opdatering-af-mitid-appen-den-10-december-2024)
- MitID statement quoted on the GrapheneOS forum (2025): the app uses Google Play Integrity on Android (and Apple's equivalent on iOS) to confirm it comes from an official store. — [GrapheneOS forum, MitID thread post 288](https://discuss.grapheneos.org/d/1520-status-of-mitid-app/288) (snippet only; page fetch blocked)
- 2025 user reports: activating a new MitID authenticator on GrapheneOS fails with a "rooted or compromised" message, while existing installs keep working. Merely having Play Services present "no longer suffices". — [GrapheneOS forum post 287](https://discuss.grapheneos.org/d/1520-status-of-mitid-app/287); [post 284](https://discuss.grapheneos.org/d/1520-status-of-mitid-app/284)
- Older (2023) reports: Google Play Services was needed to activate MitID but could be removed afterwards. These are outdated. — [GrapheneOS forum post 161 ff.](https://discuss.grapheneos.org/d/1520-status-of-mitid-app/161)

**MobilePay (Vipps MobilePay)**
- Official help-centre text (via search snippet; page fetch blocked): the app "requires Google Play Integrity verification" and relies on Google Play Services for other critical functionality, including push notifications. On GrapheneOS it works only with a locked bootloader, sandboxed Google Play Services + Play Store, and MobilePay installed via the Google Play Store. — [Vipps MobilePay help: can't find app in app store](https://help.vippsmobilepay.com/en-DK/articles/cant-find-app-in-appstore)
- Users report the error "Security check failed. MobilePay can't be used on a 'rooted' device" on GrapheneOS. On /e/OS, MobilePay fails, and the device does not even pass BASIC integrity. — [GrapheneOS forum: MobilePay (Danish) not working](https://discuss.grapheneos.org/d/5391-mobilepay-danish-not-working/67); [/e/ community: MobilePay issues continued](https://community.e.foundation/t/mobilepay-issues-continued/83138?page=3)

**Bank apps**
- Nordea Mobile (DK/NO): GrapheneOS users saw "malicious software running" warnings (triggered by accessibility services). The app uses the RootBeer root-detection library and likely the Play Integrity API. — [GrapheneOS forum: Nordea Mobile Danish](https://discuss.grapheneos.org/d/13006-nordea-mobile-danish-claims-malicious-software-running)
- Danske Bank (Mobilbank DK) is listed among apps with reported issues in a (2022-era) banking-app compatibility list. The list notes that the SafetyNet→Play Integrity migration "may cause your banking app to suddenly stop working after an update". — [privsec.dev mirror: Banking apps compatibility with GrapheneOS](https://git.hackliberty.org/Git-Mirrors/privsec.dev/blame/commit/8708b6c53a8ca5bd6391b78738991d7835cea987/content/posts/android/Banking%20Applications%20compatibility%20with%20GrapheneOS.md) (older, 2022)
- An XDA moderator (general, non-Danish) says banking apps now require Play Integrity. With a Xiaomi.eu ROM "everything works except [the] quite rare" apps that use STRONG integrity. — [XDA: banking app can't be accessed](https://xdaforums.com/t/banking-app-cant-be-accessed.4691272/)
- All Danish bank apps also depend on MitID for login/approval, so a phone that cannot run MitID is limited for banking even if the bank app itself opens. (MitID is the national login used by banks; see Q2.) — [borger.dk MitID help](https://www.borger.dk/hjaelp-og-vejledning/hvad-har-du-brug-for-hjaelp-til/mitid)

**Government apps (Digitaliseringsstyrelsen)**
- Kørekort-app: needs MitID, a valid Danish licence, and a passport or chip ID card scanned via NFC. Requires Android 10+ and NFC. — [borger.dk: Kørekort-app](https://www.borger.dk/hjaelp-og-vejledning/hvad-har-du-brug-for-hjaelp-til/koerekort-app); [Life in Denmark: Driving licence app](https://lifeindenmark.borger.dk/travel-and-transport/driving-licence/driving-licence-app) (search snippets)
- Sundhedskortet app (package dk.digst.hc): needs MitID and a Danish address. Minimum listed as Android 9.0 (this may be outdated relative to the Kørekort-app's Android 10). — [Life in Denmark: Health insurance card app](https://lifeindenmark.borger.dk/healthcare/health-insurance/health-insurance-card-app); [Similarweb listing](https://similarweb.com/app/google/dk.digst.hc)
- Digital Post / borger.dk / sundhed.dk (MinSundhed) are also usable through a web browser with MitID. Only the MitID approval step depends on the phone (or a code display/chip). — [borger.dk MitID help](https://www.borger.dk/hjaelp-og-vejledning/hvad-har-du-brug-for-hjaelp-til/mitid)

**Rejsekort / Rejseplanen**
- The plastic Rejsekort is being phased out (FynBus area: fully phased out 28 May 2026) and replaced by the Rejsekort app. A non-app "Basiskort" exists for people who cannot or will not use an app. — [FynBus: Rejsekort app](https://en.fynbus.dk/tickets/rejsekort-app)
- The Rejsekort app (dk.rejsekort.digitalrejsekort) is on Google Play. Its store metadata shows an update on 20 May 2026. — [AppGoblin listing](https://appgoblin.info/apps/dk.rejsekort.digitalrejsekort); [The Local DK, Apr 2024](https://www.thelocal.dk/20240409/how-to-get-and-use-denmarks-new-rejsekort-app)

### Inferences
- Expected outcome on an uncertified ColorOS-China phone:
  - MitID new activation: likely blocked, because Play Integrity is used at activation.
  - MobilePay: likely blocked, since Play Integrity is required and the app must be installed from Play.
  - Bank apps: mixed; many open but block on integrity/root checks, and all need MitID for approvals.
  - Kørekort and Sundhedskort apps: unknown integrity behaviour, but they need MitID to set up.
  - Rejsekort: unknown.
- If the phone does pass Play Integrity DEVICE with GMS enabled and is not rooted, most of these apps may work, except anything that demands STRONG integrity.

### Gaps
- I found no official statement from Danske Bank, Jyske Bank, Nykredit, Sydbank, Lunar or Arbejdernes Landsbank on Play Integrity, root, or Play-certified requirements. No Danish-language bank help page was found.
- I found no source on whether the Kørekort-app, Sundhedskort-app, Rejsekort or Rejseplanen apps use Play Integrity or root detection.
- I could not read mitid.dk directly to confirm the current (Nov 2026) minimum Android version or any official wording on rooted or uncertified devices.

## Q2. MitID app specifics: supported devices, phones sold outside the EU, and alternatives

### Takeaway
MitID publishes OS-version requirements (Android 10+ as of 2025), not a device whitelist. It enforces Play Integrity and root checks instead. No source mentions region-of-sale restrictions as such. If the app won't activate, the official fallbacks are the MitID code display (kodeviser), the audio code reader (kodeoplæser), and the MitID chip. These need no smartphone, or only NFC/USB.

### Cited Findings
- Requirements are expressed as OS minimums (Android 10+, iOS 16+). Phones on older OS versions were cut off in Dec 2024 and Aug 2025. — [Folketinget answer](https://www.ft.dk/samling/20241/almdel/diu/spm/120/svar/2153007/3050532.pdf); [Mobilsiden](https://mobilsiden.dk/nyheder/apps-sociale-medier/37-000-danskere-mister-adgang-til-mitid/)
- Play Integrity is used to verify the app's origin, and new activations fail on non-Google-certified OSes (GrapheneOS reports, 2025). Workarounds reported: activating on another device before wiping, or falling back to a hardware token. — [GrapheneOS forum post 288](https://discuss.grapheneos.org/d/1520-status-of-mitid-app/288); [post 282](https://discuss.grapheneos.org/d/1520-status-of-mitid-app/282)
- Kodeviser: a small electronic device showing a one-time code, for people who cannot use the app. Kodeoplæser: a large screen plus read-aloud, for the visually impaired. If you already have the MitID app you can order these on MitID.dk; otherwise you must go to Borgerservice. You can hold both the app and a kodeviser/kodeoplæser. — [borger.dk MitID help](https://www.borger.dk/hjaelp-og-vejledning/hvad-har-du-brug-for-hjaelp-til/mitid); [Skagen Online FAQ](https://www.skagenonline.dk/faq/hvordan-bruger-man-mitid-uden-app)
- MitID chip: connects via USB, Bluetooth or NFC. Costs DKK 143.60, one active chip at a time. Ordered on MitID.dk and activated either with passport/foreign ID in the MitID app or at Borgerservice. — [mitid.dk: MitID chip](https://www.mitid.dk/en-gb/get-started-with-mitid/how-to-use-mitid/mitid-chip/) (snippet)
- MitID also works for the Faroe Islands and has English info for foreign residents. — [Rigsombudsmanden: What is MitID](https://en.rigsombudsmanden.fo/fields-of-responsibility/mitid/what-is-mitid-and-what-can-it-be-used-for/)

### Inferences
- "Sold outside the EU" is not itself a disqualifier in any source found. The practical blockers are Play Integrity, GMS, and OS version.
- A newcomer whose phone fails MitID activation should get a kodeviser at Borgerservice. That restores access to borger.dk, Digital Post, sundhed.dk and bank web banking. A kodeviser cannot set up the Kørekort or Sundhedskort apps on an incompatible phone, and it cannot make MobilePay work.

### Gaps
- No official mitid.dk text on rooted, uncertified or non-EU devices could be retrieved.
- Whether the kodeviser is free for first issue in 2026 was not confirmed.

## Q3. MobilePay and Google Wallet (Dankort/Visa contactless) in Denmark

### Takeaway
MobilePay requires Play Integrity and Play-Store installation, so on an uncertified Chinese phone it is likely unusable. In-store, Vipps MobilePay payments are done in-app (QR/box), and phone contactless in Denmark generally goes through Google Wallet. Since Google Play Services v26.28 (summer 2026), Google has been reported to disable Google Wallet tap-to-pay on phones detected as Chinese SKUs (Vivo, Xiaomi, Oppo, OnePlus China firmware), even when GMS and Wallet are installed manually.

### Cited Findings
- MobilePay requires Play Integrity verification and Google Play Services (including for push notifications). On GrapheneOS it needs a locked bootloader and installation from the Play Store. — [Vipps MobilePay help](https://help.vippsmobilepay.com/en-DK/articles/cant-find-app-in-appstore) (snippet)
- Google Play Services 26.28 began disabling contactless payments on phones running Chinese firmware, including imported units used abroad. XDA log analysis showed Play Services 26.28.63 detecting a Vivo X200 Ultra as a "CN SKU" and disabling the TapAndPay HCE service. — [Notebookcheck (Aug 2026)](https://www.notebookcheck.net/Google-Pay-suddenly-stops-working-Major-problem-with-Chinese-phones-from-Xiaomi-Vivo-Oppo-OnePlus-and-others.1358219.0.html); [TuttoAndroid, 10 Aug 2026](https://www.tuttoandroid.net/news/2026/08/10/smartphone-rom-cinese-google-pay-1166742/); [Gizchina](https://www.gizchina.com/google-2/google-pay-outage-hit-xiaomi-vivo-oppo-china-phones); [Börse Express: Play Services 26.28.33 NFC payments blocked on China devices](https://www.boerse-express.com/news/articles/google-play-services-262833-nfc-zahlungen-auf-china-geraeten-blockiert-934851)
- Reported workarounds: rolling back Play Services via ADB (which forces a full Wallet reinstall) or leaving Play beta programs. Notebookcheck later updated that the problem was "solved for now" but that a permanent fix was "not in sight". — [Notebookcheck](https://www.notebookcheck.net/Google-Pay-suddenly-stops-working-Major-problem-with-Chinese-phones-from-Xiaomi-Vivo-Oppo-OnePlus-and-others.1358219.0.html) (via search summary)
- Google Wallet on Android 13+ reportedly wants STRONG integrity for contactless, and DEVICE integrity on Android 12 and lower. This is community testing, not official Google documentation. — [r/Magisk Strong Play Integrity guide, Jul 2025](https://libreddit.winscloud.net/r/Magisk/comments/1m77cxd/strong_play_integrity_guide/nefsfw2); contradicted by an older claim that Wallet needs only DEVICE integrity: [GrapheneOS forum](https://discuss.grapheneos.org/d/18118-play-integrity-meets-device-integrity/8)
- Rooted devices show "your device doesn't meet the requirements for contactless payments" in Wallet. — [r/Magisk](https://redlib.ssps.io/r/Magisk/comments/1lmus3p/help_google_wallet_still_detects_root_while/n0h9xgk/?context=3)
- Dankort in mobile wallets: Nets required all Danish banks to enable the Dankort part of cards in Apple Pay/Google Pay by the turn of 2024/2025. Several banks missed the deadline, and most targeted 1 Jan 2025 or during 2025. Existing users often had to add the Dankort part manually. — [Ingeniøren, 26 Sep 2024](https://ing.dk/artikel/it-problemer-spaender-ben-dankortet-banker-overskrider-nye-krav); [Finextra: Danish banks add Dankort to mobile wallets](https://finextra.com/newsarticle/30346/danish-banks-add-dankort-payments-to-mobile-wallets); [Mobilsiden: Dankort i Apple Pay og Google Pay](https://mobilsiden.dk/?p=220703)
- An (undated, possibly old) FAQ says Danske Bank allowed Mastercard but not Visa/Dankort in Google Pay. — [Skagen Online FAQ](https://www.skagenonline.dk/faq/hvilke-kort-kan-bruges-i-google-wallet) (likely outdated)

### Inferences
- MobilePay itself does not need NFC or Google Wallet for P2P transfers or for paying in shops via MobilePay QR/box. But it does need Play Integrity, so the integrity check, not NFC, is the blocker.
- For contactless card payment on a Chinese-SKU Oppo, Google Wallet should be considered unreliable or blocked as of late 2026, even if Danish banks support Wallet. A physical card, or a smartwatch with its own wallet (e.g. Garmin Pay / Fitbit-type) if the bank supports it, are the fallbacks.

### Gaps
- I found no current (2026) authoritative list of which Danish banks support Google Wallet, or which support Dankort vs Visa/Mastercard in Wallet. Bank-by-bank pages could not be retrieved.
- Whether the v26.28 CN-SKU block specifically hit Oppo ColorOS China units (as opposed to Vivo, the confirmed test device) is not directly confirmed. Notebookcheck's headline lists Oppo/OnePlus, but the test case was Vivo.
- No official Google statement on the CN-SKU block was found.

## Q4. Real-world reports (Danish and Nordic) of Chinese-ROM phones with MitID, Danish banks, MobilePay

### Takeaway
I found no Danish-language (Reddit r/Denmark, Mobilsiden forum) report specifically about MitID, MobilePay or Danish banks on an Oppo/Xiaomi/Vivo China-ROM phone. The closest evidence comes from de-Googled/custom-ROM users (GrapheneOS, /e/OS) and from global Chinese-ROM Wallet reports. Both point consistently to Play Integrity failures blocking activation. Nordic analogues (Norwegian BankID, Vipps, DNB) show the same pattern.

### Cited Findings
- Danish users on GrapheneOS (2025): new MitID activations blocked ("rooted or compromised"). — [GrapheneOS MitID thread](https://discuss.grapheneos.org/d/1520-status-of-mitid-app/287)
- Danish users on /e/OS: MobilePay not working; device fails BASIC integrity. — [/e/ community](https://community.e.foundation/t/mobilepay-issues-continued/83138?page=3)
- Norway: BankID's "Raskere BankID" (passwordless) uses Play Integrity at sign-up and never worked on GrapheneOS. A later thread reports that BankID stopped working entirely after a version update. Users fall back to the code chip. — [GrapheneOS: Raskere BankID](https://discuss.grapheneos.org/d/18418-raskere-bankid-bankid-norway-bans-passwordless-sign-in-on-grapheneos/18); [GrapheneOS: BankID stopped working after v4.77](https://discuss.grapheneos.org/d/22932-bankid-stopped-working-possibly-after-version-477)
- Norwegian Vipps and DNB apps have similar GrapheneOS compatibility threads. — [GrapheneOS: Vipps](https://discuss.grapheneos.org/d/23243-vipps-norwegian-banking-app/27); [GrapheneOS: DNB](https://discuss.grapheneos.org/d/25060-dnb-norwegian-banking-app)
- Xiaomi users report banking apps failing even with Play Integrity Checker showing STRONG and Play Store certified (Xiaomi 17, rooted global ROM). Traces of Xiaomi.eu integrity fixes reportedly break other ROMs. — [xiaomi.eu: Xiaomi 17 Wallet & banking fix](https://xiaomi.eu/community/goto/post?id=756362); [xiaomi.eu: Play Integrity modification traces, Oct 2023](https://www.xiaomi.eu/community/threads/about-modification-on-play-integrity-and-its-traces.73110)
- A GSMArena comment thread asks whether banking apps and Google Wallet work with Chinese ROMs, without a clear answer. — [GSMArena comments](https://m.gsmarena.com/newscomm-66730.php)

### Inferences
- Even without direct Danish Chinese-ROM reports, the mechanism is the same: Danish apps check Play Integrity, and China-SKU phones often fail certification or, since 2026, are detected as CN SKUs. The realistic expectation is that MitID activation and MobilePay will fail or be fragile. Wallet tap-to-pay is likely blocked. Bank apps vary.
- Note that GrapheneOS failures are a different cause (no Google certification by design). They are evidence of how the Danish apps behave, not of Oppo's behaviour specifically.

### Gaps
- No Danish Reddit or Mobilsiden report of an Oppo/Xiaomi/Vivo China-ROM phone with MitID, MobilePay or Danish bank apps was found, positive or negative.
- No Huawei-specific (HMS, no GMS) MitID report was found. Given the Play Services requirement, MitID and MobilePay would not be expected to install from AppGallery or work without GMS, but this is inference, not a sourced finding.
