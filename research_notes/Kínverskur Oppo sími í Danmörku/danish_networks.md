# Danish mobile networks (Nov 2026): what an imported/Chinese-market phone needs

> Method note: research done 2026-11-08. In this session only WebSearch worked. Direct page fetches (WebFetch/curl) to kimovil.com, mastdatabase.co.uk, ing.dk, digst.dk, iot.cards, operator sites and Wikipedia were blocked by the session's network policy. All findings below therefore come from search-result summaries of the cited pages, not full reads. Treat exact figures with some caution, and verify against the primary pages where it matters. Dates of sources are given where known; older information is labelled.

## 1. Which LTE and 5G NR bands each Danish operator uses; importance of B20 (800 MHz) and n28 (700 MHz)

### Takeaway
Denmark has three radio networks: TDC NET (YouSee, Telmore, etc.), TT-Netværket (Telia + Telenor shared), and 3/Hi3G. The bands that matter most for a phone are LTE B1/B3/B7/B8/B20/B28 and NR n78, plus n28 (TDC) and n1/n3 (3, TT). B20 (800 MHz) is held only by TDC and TT-Netværket; 3 has no 800 MHz and relies on B28 (700 MHz) and B8 (900 MHz) for rural and indoor coverage. A phone missing B20 and B28 will have noticeably weaker indoor and rural coverage on every Danish network.

### Cited Findings
**Band lists (aggregator data; it conflicts in places):**
- TDC (YouSee): 5G on n28 (700 MHz), n40 (2300 MHz), n78 (3500 MHz). LTE on B1, B3, B7, B20, B28, B40. — [Kimovil frequency checker DK](https://www.kimovil.com/en/frequency-checker/DK) (via search summary)
- Telenor and Telia (TT-Netværket): 5G on n3 (1800 MHz) and n78 (3500 MHz). LTE on B1, B3, B7, B8, B20, B28, B32. — [Kimovil frequency checker DK](https://www.kimovil.com/en/frequency-checker/DK)
- 3 (Hi3G): 5G on n1 (2100 MHz), n3 (1800 MHz), n78 (3500 MHz). LTE on B1, B3, B7, B8, B28, B38 (TDD 2600). — [Kimovil frequency checker DK](https://www.kimovil.com/en/frequency-checker/DK)
- Conflict: a Wikipedia mirror of the "List of 5G NR networks" lists 3 Denmark on n28 + n78, and TDC on n40 + n78. That differs from Kimovil's n1/n3 for 3. All sources agree on n78 for every operator. — [Wikipedia mirror: List of 5G NR networks](https://ipfs.ssi.eecc.de/ipns/en.wikipedia-on-ipfs.org/wiki/List_of_5G_NR_networks); [giztop 5G bands](https://www.giztop.com/5g-network-bands)
- TT-Netværket launched 5G in June 2021 on n78 and added n3 in August 2021. — [Powertec: Telia Denmark](https://portal.powertec.com.au/industry-resources/companies/telia-denmark)
- A low-quality SEO troubleshooting site (2026) says Telenor Denmark uses LTE B3, B7 and B20, and that imported models lacking those bands may fail to register. That list leaves out B1/B8/B28, so use it only as anecdote. — [ukxiaomi.com, Aug 2026](https://www.ukxiaomi.com/2026/08/xiaomi-cannot-register-on-telenor.html)

**800 MHz (LTE B20), from the 2012 auction (older, but the licences still run to 2033):**
- TDC won four 2x5 MHz blocks (2x20 MHz) for DKK 628m. TT-Netværket (Telia/Telenor) won 2x10 MHz for DKK 111m. 3 got no 800 MHz licence. The frequencies became available from 1 Jan 2013, with coverage obligations for 207 postcodes. — [Mobilsiden: 4G til udkantsdanmark](https://mobilsiden.dk/?p=83842); [Mobile World Live](https://www.mobileworldlive.com/telenor/tdc-and-telenortelia-pick-up-danish-4g-spectrum/); [EM fact sheet 2012](https://em.dk/media/14944/23-03-12-fakta-om-800-mhz-auktionen.pdf)
- The Danish auction calendar lists 900 and 800 MHz for re-auction in 2033 and 700 MHz in 2038. — [digst.dk Auktioner og udbud](https://digst.dk/tele/frekvenser/auktioner-og-udbud/) (via search summary)

**700 MHz (LTE B28 / NR n28), from the 2019 auction:**
- 20 blocks were auctioned across 700, 900 and 2300 MHz. TDC won 14 blocks, the maximum allowed. Telia, through TT-Netværket, got 2x5 MHz at 700 MHz. Hi3G (3) won 2x10 MHz at 700 MHz and 2x10 MHz at 900 MHz. — [digitalt.tv: 700 MHz fordelt](https://digitalt.tv/700-mhz-frekvensbaandet-fordelt-til-5g-telia-og-tdc-er-blandt-de-der-erhvervet-sig-ny-plads-paa-nettet/); [3 press release: 3 køber 5G-licens](https://www.mynewsdesk.com/dk/3danmark/pressreleases/teleselskabet-3-koeber-5g-licens-2853926)
- 3 said it bought 700 MHz to increase geographic coverage in rural areas and to improve indoor coverage. — [3 press release](https://www.mynewsdesk.com/dk/3danmark/pressreleases/teleselskabet-3-koeber-5g-licens-2853926)
- TDC markets nationwide 5G on 700 MHz outside the big cities, citing wide geographic reach and strong indoor signal. TDC NET has used 700 MHz since April 2020. — [tdc.dk mobilnet](https://tdc.dk/mobilnet/) (via search summary)
- The 2018/2019 auction set coverage obligations for 212 areas, with a deadline of 4 April 2022. — (search summary of [digitalt.tv](https://digitalt.tv/700-mhz-frekvensbaandet-fordelt-til-5g-telia-og-tdc-er-blandt-de-der-erhvervet-sig-ny-plads-paa-nettet/) / [5G-handlingsplan](https://www.kefm.dk/media/6871/5g-handlingsplan_for_danmark.pdf))

### Inferences
- **B20 (800 MHz)** is a key coverage layer for TDC and TT-Netværket, and the TT customers include Telia, Telenor and their MVNOs. A phone without B20 loses the main low-band LTE layer on those networks and falls back to B8/B28 where they are deployed.
- **B28 / n28 (700 MHz)** matters most on **3**, which has no 800 MHz, so 700 and 900 MHz are its only low bands. It also matters on **TDC**, whose rural 5G runs on n28. Chinese-market phones usually support B28 (China Broadcasting Network uses n28), but some China-only SKUs leave out **B20**, and that is the band to check first.
- Chinese-market phones generally support n78 and n1/n3, and often n28. n40/B40 (2300 TDD) is common in China-market phones.

### Gaps
- No authoritative per-operator band table from Energistyrelsen/Digitaliseringsstyrelsen or mastedatabasen.dk could be read, because the fetches were blocked. Kimovil and Wikipedia disagree on whether 3 uses n28 or n1 for 5G.
- No quantified data on the share of indoor or rural traffic carried on B20/B28 in Denmark.
- TDC's exact 700 MHz holding (2x15 MHz is reported) was not confirmed from a primary source.

## 2. 3G and 2G shutdown status per operator

### Takeaway
3G is fully gone in Denmark. TT-Netværket (Telia/Telenor) and TDC NET closed theirs in 2023, and 3 was last, finishing in November 2025 (no 3G from 1 Dec 2025). As of Nov 2026 I found **no confirmed 2G shutdown by any Danish operator**. TDC NET and TT-Netværket still run 2G, and 3 has no 2G of its own that I could document. Telenor targets ending 2G "before 2030", and one 2026 source says a gradual phase-out starts "from 2026".

### Cited Findings
**3G:**
- TDC NET announced in 2022 that 3G would close in early 2023, with the last part by end of June 2023. Funen (Fyn) was reportedly the last area. — [MereMobil 2022](https://meremobil.dk/2022/08/tdc-slukker-for-3g/); [inputmag](https://www.inputmag.dk/tdc-slukker-for-3g-i-starten-af-naeste-aar/); [recordere.dk 2022](https://www.recordere.dk/2022/08/tdc-net-siger-farvel-til-3g/)
- Telenor/Telia (TT-Netværket) switched off 3G nationwide around early 2023 (sources differ: early 2023 vs April 2023). — [Telenor press release PDF](https://press.telenor.dk/pressreleases/telenor-har-slukket-for-3g-nettet-i-hele-danmark-3246759.pdf); [TelecomTalk](https://telecomtalk.info/?p=695957); [DCD](https://datacenterdynamics.com/en/news/danish-duo-telia-and-telenor-call-time-on-3g-network)
- When TT closed 3G, Telenor said 3G phones could still call because calls go over the old 2G network. — [telenor.dk farvel-3g](https://www.telenor.dk/kundeservice/farvel-3g/)
- **3 (Hi3G)** was "the last operator in Denmark" to close 3G. It shut it down gradually during November 2025 and has not supported 3G devices since 1 December 2025. — [3.dk: Vi lukker ned for 3G](https://www.3.dk/info/3g-lukker/); [3.dk business](https://www.3.dk/business/3g-lukker/); [inputmag: I dag slukker 3 for 3G](https://www.inputmag.dk/i-dag-slukker-3-for-3g-netvaerket/); [leifshows.dk, Dec 2025](https://leifshows.dk/2025/12/03/nu-er-det-helt-slut-med-3g-i-danmark/); [Flexii (3 sub-brand)](https://www.flexii.dk/3G)
- 3's own text says that a 4G phone without VoLTE ("4G-Tale") **cannot make or receive calls** after the 3G shutdown, though mobile data still works. — [3.dk: Vi lukker ned for 3G](https://www.3.dk/info/3g-lukker/) (via search summary)

**2G:**
- Digitaliseringsstyrelsen says the mobile operators have **not announced** when they might close 2G; the decision is the operators' own. It also says a phone must support and have enabled 4G calling (VoLTE) to call after any 2G closure. — [digst.dk: Mulig kommende lukning af 2G-mobilnettene](https://digst.dk/tele/nye-teknologier/mulig-kommende-lukning-af-2g-mobilnettene/) (via search summary; page date unknown)
- Telenor, Ingeniøren, March 2024: Telenor expects to say farewell to 2G **before 2030** and must remove 2G equipment from more than 4,000 masts within about six years. — [Ingeniøren 8 Mar 2024](https://ing.dk/artikel/dansk-mobiloperatoer-planlaegger-lukning-af-2g)
- ITWatch: no final date has been set for the Danish 2G networks, and Telenor clarified there was no concrete plan. — [ITWatch](https://itwatch.dk/ITNyt/Brancher/tele/article17631875.ece)
- TDC NET, 2023: "no plans to phase out" 2G as long as it serves critical societal functions. — [MereMobil May 2023](https://meremobil.dk/2023/05/hvornaar-lukker-2g-mobilnettet/)
- In 2025, there were still "no concrete plans" to close 2G in Denmark. — [Supporten.dk May 2025](https://www.supporten.dk/2025/05/05/lukker-2g-netvaerket-i-danmark/); [Telefinder](https://telefinder.dk/2g-netvaerk-lukkes-danmark/)
- M2M Nordic (about mid-2026): TDC and TT-Netværket plan a **gradual phase-out of 2G "in the coming years (from 2026 onward)"**. No dates were given. — [M2M Nordic](https://m2m.dk/vidensbank/kom-godt-i-gang/gsm-lte-teknologier/)
- Telia and Telenor share one 2G network (TT), and TDC also runs its own 2G network. — [skagenonline FAQ (outdated, said 2025)](https://www.skagenonline.dk/faq/hvornar-lukker-2g-i-danmark); [MereMobil 2023](https://meremobil.dk/2023/05/hvornaar-lukker-2g-mobilnettet/)
- After 3 closed 3G, "2G and 4G/5G remain the only active network types in Denmark". — [inputmag](https://www.inputmag.dk/i-dag-slukker-3-for-3g-netvaerket/) (via search summary)
- Not Denmark: Sweden's operators planned to close 2G and 3G by end of 2025 (Telia SE pushed 2G to 2027), Norway's Telia began phasing out 2G in Aug 2025, and Greenland's Tusass closes 3G in 2026 and 2G in 2028. — [torpare.dk](https://torpare.dk/sverige-lukker-for-2g-og-3g-mobilnetvaerk-ved-udgangen-af-2025/); [tracker.fi](https://support.tracker.fi/en/support/solutions/articles/151000216390-telia-2g-network-phase-out-in-norway); [Sermitsiaq](https://www.sermitsiaq.ag/samfund/3g-net-lukker-i-2026-2g-folger-efter-i-2028/2291998)

### Inferences
- **On 3 and its brands (Oister, Flexii, etc.):** since Dec 2025, a phone without working VoLTE on 3's network probably cannot make normal calls at all, because 3 has no 3G and I found no evidence of 2G fallback or national roaming. 3's own page states this for non-VoLTE 4G phones.
- **On TDC (YouSee, Telmore, etc.) and TT (Telia, Telenor, CBB, etc.):** a non-VoLTE phone can still call via circuit-switched fallback to 2G as of Nov 2026. That gives slow call setup, no data during calls and worse indoor coverage. It works only while 2G lives, and Telenor targets ending it before 2030, with a gradual phase-out possibly starting from 2026.

### Gaps
- No confirmed 2G shutdown date for any Danish operator, and no primary 2026 announcement from TDC NET or TT-Netværket.
- I did not find an explicit source saying whether 3 Denmark ever had its own GSM network or has national 2G roaming. Its 3G page implies it does not.
- I could not confirm whether a Telenor/TT 2G phase-out had actually begun in specific regions in 2026.

## 3. VoLTE/VoWiFi on imported phones: whitelisting, device lists, blocking rules

### Takeaway
Danish operators launched VoLTE and VoWiFi in 2016–2018 on a **per-device approved basis**. Launch lists covered only specific Samsung, Apple and Huawei models, and current operator lists could not be retrieved. VoLTE also needs a matching IMS/carrier profile in the phone firmware for the SIM's MCC/MNC. Chinese-ROM phones often lack profiles for European operators, so they can register on 4G/5G data but have no VoLTE. On 3, that means no calls. On TDC and TT it means 2G fallback calls only. I found no Danish rule blocking non-VoLTE phones, but Sweden has done exactly that from Feb 2026, and BEREC/EENA are pushing on 112 access.

### Cited Findings
**Danish operator VoLTE/VoWiFi (mostly older launch information):**
- Telenor DK opened Wi-Fi calling and VoLTE in about 2016, initially for iPhone and Samsung. — [Telenor press release](https://www.mynewsdesk.com/dk/telenor/pressreleases/telenor-har-aabnet-op-for-wifi-opkald-og-volte-2785139); [Mobilsiden](https://mobilsiden.dk/nyheder/internet-bredbaand/nu-er-telenor-klar-med-baade-wifi-opkald-og-volte/); [The Fast Mode](https://www.thefastmode.com/services-and-innovations/9601-telenor-launches-volte-wifi-calling-service-in-denmark)
- YouSee (TDC) launched VoLTE/Wi-Fi calling in 2017 for named models only: Samsung Galaxy S6/S6 edge, S7/S7 edge, S8/S8+, A3/A5 (2017) and iPhone 6–7. — [YouSee press release](https://www.mynewsdesk.com/dk/yousee/pressreleases/nu-aabner-yousee-for-wi-fi-opkald-og-volte-2039943); [Mobilsiden](https://mobilsiden.dk/nyheder/it-tele-tech/yousee-klar-med-wi-fi-opkald-og-volte-efter-to-maaneders-test/); [YouSee forum](https://forum.yousee.dk/nyheder-75/nu-kan-du-bruge-wifi-opkald-og-tale-paa-4g-med-yousee-mobil-99972)
- Telia DK was the last to launch (2018), initially for the Samsung Galaxy S8/S8+ and Huawei P20/P20 Pro/P20 Lite. — [Mobilsiden](https://mobilsiden.dk/nyheder/it-tele-tech/telia-lancerer-wi-fi-opkald-og-volte-som-sidste-selskab-i-danmark/); [MereMobil 2018](https://meremobil.dk/2018/07/telia-har-lanceret-wi-fi-opkald-i-stilhed/)
- 3 DK launched VoLTE and expanded VoWiFi in about 2017. — [Mobile Europe](https://www.mobileeurope.co.uk/3-denmark-takes-on-telenor-with-volte-launch-and-vowi-fi-expansion/); [Mobilsiden](https://mobilsiden.dk/?p=22986)
- A press article noted that which manufacturers each provider has agreements with varies. MVNO CallMe publishes a VoLTE device list and says a supported phone plus four further conditions are required. — [CallMe VoLTE page](https://www.callme.dk/netvark/volte-4g-tale-og-wifi-opkald/) (via search summary)
- Apple's EU carrier page lists VoLTE and Wi-Fi Calling support for Danish carriers on iPhone. — [Apple support 108048](https://support.apple.com/en-us/108048)
- A Danish VoLTE guide says compatibility needs three things together: a compatible phone, a supported subscription and an **operator profile**. A "yes" on the spec sheet is not enough, so check the model number. — [mybestsim.com (DA)](https://mybestsim.com/da/volte-hvad-er-det-og-hvordan-slaar-du-det-til/)

**Mechanism: carrier config / IMS profile (general, not Denmark-specific):**
- VoLTE depends on a carrier-specific modem config that the OS selects by matching the SIM's MCC/MNC. If the firmware has none for an operator, VoLTE is usually unavailable. Carriers can also block devices not on their approved list. — [xiaomi.eu forum](https://xiaomi.eu/community/threads/activation-of-volte-and-vowifi-in-xiaomi-eu-rom.63469/page-2); [XDA](https://xdaforums.com/t/volte-and-vowifi-not-working-on-xiaomi-eu.4099451/)
- Typical symptom: signal, data and SMS fine, but calls dead, because the phone lacks the operator's IMS settings. Samsung ties this to the CSC in the firmware. — [voltesim.co.uk](https://voltesim.co.uk/volte-explained-the-things-nobody-tells-you-about-4g-calling/)
- Check IMS registration and "VoLTE provisioned" status via `*#*#4636#*#*`. — [Medium: How to check VoLTE on Android](https://medium.com/@jamesdwho/how-to-check-for-working-volte-calling-on-android-8c343362ecfe)
- Example of the reverse case: a Pixel 7 Pro on China Telecom had working data but no calls until VoLTE was restored. — [blog.cheverjohn.me](https://blog.cheverjohn.me/pixel-7-pro-china-telecom-volte)

**Blocking rules and 112:**
- **Sweden (PTS):** operators Tre, Telenor and Tele2 must identify and **block phones that cannot make emergency calls over 4G/VoLTE**, starting **2 February 2026**. Affected users must change phone or move to an operator that routes 112 over 2G/3G. — [PTS](https://pts.se/en/news-and-press-releases/operators-must-ensure-access-to-112--certain-mobile-phones-will-be-blocked/); [EENA](https://eena.org/news/2g-3g-switch-off-to-block-certain-phones-from-emergency-calls-in-sweden/)
- **Australia:** handsets the carriers believe cannot call 000 have been blocked since 1 Nov 2024 (non-official source). — [scribe.rip / Medium](https://scribe.rip/@jamesdwho/the-little-known-problems-with-volte-emergency-calling-3d4cdaf0e042)
- **EU level:** BEREC issued a statement on 2 June 2026 urging that 112 access, handset-derived location and callbacks be preserved through 2G/3G phase-outs. Operators dropping both 2G and 3G must keep 112 reachable, possibly by keeping legacy networks running. EENA cites EECC Articles 108/109 and in June 2026 asked the Commission to act against non-compliant Member States. — [EENA letter / Commission response, June 2026](https://eena.org/wp-content/uploads/2026/07/2026_06_11_Response_letter_EVP_Virkkunen-1.pdf); [EENA: Delaying the 2G/3G shutdown](https://eena.org/portfolio/delaying-the-2g-3g-shutdown/)
- BEREC 2023: VoLTE standards do not ensure interoperability between networks, so VoLTE 112 is not guaranteed for roaming or foreign devices. — [BEREC BoR (23) 204](https://www.berec.europa.eu/system/files/2023-12/BoR%20(23)%20204%20BEREC%20Report%20on%20practices%20and%20challenges%20of%20the%20phasing%20out%20of%202G%20and%203G_0.pdf)
- No source described an EU-run device whitelist or certification scheme. — [search result summary; no source found]

### Inferences
- A Chinese-market Oppo/OnePlus (ColorOS China) phone is very likely to lack IMS carrier profiles for TDC, TT-Netværket and 3. China ROMs ship carrier configs for Chinese operators and, at most, a few global ones. Expected behaviour: 4G/5G data works and SMS may work (SMS over SGs/2G), but there is no VoLTE and no VoWiFi.
  - On **3/Oister/Flexii**, the phone probably cannot make or receive normal calls.
  - On **TDC/YouSee/Telmore** and **Telia/Telenor**, calls fall back to 2G (CSFB) for now, with poorer indoor coverage, slower call setup and no data during calls. This breaks when 2G is switched off (Telenor target: before 2030).
- Remedies people commonly use (general knowledge, not Denmark-verified): flash the global/EU ROM if the hardware is identical (often not possible for Oppo/OnePlus China variants without a region-change tool), or use engineering/dialer toggles and Shizuku-based "VoLTE enabler" tools on Pixel/Android-stock. None of these can conjure a missing IMS profile for a given operator.
- Denmark has no announced Swedish-style blocking. If Danish operators remove 2G, regulators will likely face the same 112 question, and non-VoLTE or non-approved phones could then be blocked or lose voice entirely.

### Gaps
- Current (2026) official VoLTE/VoWiFi device lists from YouSee, Telenor, Telia or 3 could not be retrieved, because the fetches were blocked and search showed only the 2016–2018 launch lists. I could not confirm whether Danish operators still enforce strict whitelists or now allow any device with a working IMS profile.
- No Danish regulator (Digitaliseringsstyrelsen) decision on blocking non-VoLTE or 112-incapable phones was found.
- No first-hand Reddit, XDA or Danish forum reports specifically about Chinese-ROM Oppo/OnePlus/Vivo/Xiaomi VoLTE on Danish networks were found. The only Denmark-specific items were low-quality SEO pages (ukxiaomi.com, Aug 2026) saying imported China/India Xiaomi models "may not have the required VoLTE profiles for Telenor". — [ukxiaomi.com](https://www.ukxiaomi.com/2026/08/xiaomi-volte-not-working-on-telenor.html)
- Nothing was found about whether ColorOS China includes carrier configs for European operators.

## 4. Emergency calling (112)

### Takeaway
In Denmark in Nov 2026, a phone without VoLTE can still reach 112 via the remaining 2G networks of TDC and TT (emergency calls may use any available network). A VoLTE-incapable phone or a phone with no matching IMS profile depends on 2G for 112. Even some VoLTE phones may fail VoLTE emergency calls if their firmware's emergency IMS configuration is not interoperable. EU bodies (BEREC, EENA) flag this as a real risk, and Sweden is blocking such phones.

### Cited Findings
- BEREC warns that phones unable to make emergency calls, send handset-derived location or receive callbacks create serious risks. Operators removing both 2G and 3G must ensure 112 stays reachable. — [EENA/Commission June 2026](https://eena.org/wp-content/uploads/2026/07/2026_06_11_Response_letter_EVP_Virkkunen-1.pdf)
- BEREC 2023: operators may require 2G/3G for 112, and VoLTE emergency calling is not assured across networks. — [BEREC BoR (23) 204](https://www.berec.europa.eu/system/files/2023-12/BoR%20(23)%20204%20BEREC%20Report%20on%20practices%20and%20challenges%20of%20the%20phasing%20out%20of%202G%20and%203G_0.pdf)
- EENA: some EU countries still fail to protect emergency callers. — [EENA press release](https://eena.org/press-releases/travelling-across-the-eu-some-countries-still-fail-to-protect-emergency-callers/)
- Sweden blocks phones unable to make 4G/VoLTE emergency calls from 2 Feb 2026. — [PTS](https://pts.se/en/news-and-press-releases/operators-must-ensure-access-to-112--certain-mobile-phones-will-be-blocked/)
- Digitaliseringsstyrelsen says phones must support and have 4G calling enabled to call after any 2G closure. — [digst.dk](https://digst.dk/tele/nye-teknologier/mulig-kommende-lukning-af-2g-mobilnettene/)

### Inferences
- While TDC and TT keep 2G, a Chinese-market phone in Denmark should still reach 112 via 2G, including when the user's SIM is on 3. That relies on standard limited-service emergency camping on any network, which is general GSM/3GPP behaviour and was not verified for Denmark specifically.
- Long-term risk: once Danish 2G is gone, a phone without a working VoLTE emergency configuration could fail to reach 112. That is the scenario Sweden is now handling by blocking handsets.

### Gaps
- No Danish-specific test or report of 112 behaviour on Chinese-ROM or non-whitelisted phones.
- No Danish operator statement on emergency-call handling for non-VoLTE devices after the 3G closure.
