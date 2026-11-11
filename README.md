# Košarica AI (samostojna aplikacija)

Aplikacija je PWA: deluje v brskalniku na računalniku in telefonu, jo lahko dodaš na začetni zaslon in ima brez povezave zadnje shranjene podatke. Cene dnevno zbira GitHub Actions in jih zapiše v `data/prices.json`, aplikacija jih ob odprtju sama naloži. Lastnega strežnika ne potrebuješ.

## Stanje (iskreno)
- Preizkušeno: pomožna koda zbiralnika (enote, ujemanje živil, združevanje, zgodovina; `npm test` v mapi `scraper`) in uvoz podatkov, varnostna kopija ter iskanje po črtni kodi v aplikaciji (v simuliranem brskalniku).
- **Ni preizkušeno:** moduli trgovin proti pravim spletnim stranem, delovanje GitHub Actions, namestitev na telefon in kamera. Prvi zagon (korak 3) je namenjen temu preizkusu.
- Znana omejitev: SPAR in Lidl lahko brez prilagoditev ne vrneta cen. Zaščit pred roboti ne obhajamo.
- V samostojni različici ni branja slik in besedila z umetno inteligenco (za to je potreben ključ, ki ga ne smemo dati v brskalnik). Ostaja v Claudovi različici.
- Skeniranje s kamero uporablja BarcodeDetector (Chrome na Androidu in računalniku). Na iPhonu kode vpišeš ročno.
- Še ni narejeno: skupna košarica s količinami, opozorila »pod X €«, potisna obvestila, branje računov, skupni podatki med dvema napravama. Podatki uporabnika so v napravi; za prenos uporabi gumb 💾.

## Namestitev (15 minut)
1. Na github.com ustvari **javni** repozitorij (Pages za zasebne repozitorije je plačljiv) in vanj naloži vsebino te mape (datoteke in mape znotraj `kosarica-pwa`, ne same mape).
2. Datoteko `.github/workflows/refresh.yml` ustvari v GitHubu ročno (Add file → Create new file, vsebina je v `workflow/refresh.yml`), ker skritih map povleci in spusti pogosto ne naloži. Settings → Pages → Source: **GitHub Actions**. Naslov bo `https://<uporabnik>.github.io/<repozitorij>/`.
3. Actions → »Osveži cene« → Run workflow → mode **probe**. Ko se konča, prenesi artefakt `probe-debug` (poročilo `probe-report.json` in posnetki). Pošlji mi poročilo ali ga daj Claude Code; moduli v `scraper/stores/` se prilagodijo dejanskim stranem.
4. Mercator: v `scraper/config/mercator-urls.txt` dodaj povezave do izdelkov z mercatoronline.si.
5. Nato zaženi mode **run**. Dnevni zagon ob 06:00 deluje sam. Če ga repozitorij 60 dni ni imel aktivnosti, GitHub urnik ustavi, zato ga ob obvestilu znova vključi.
6. Telefon: odpri naslov aplikacije. Android (Chrome): meni → Namesti aplikacijo. iPhone (Safari): Deli → Dodaj na začetni zaslon.

## Uporaba
- 🔄 naloži najnovejše cene zbiralnika, spodaj piše čas zadnje osvežitve in stanje vsake trgovine (✔ ali ✖).
- 📷 Skeniraj izdelek odpre kamero. Znan izdelek pokaže cene po trgovinah, neznan odpre vnos cene.
- 💾 varnostna kopija in obnovitev (kopiraj besedilo ali prenesi datoteko).

## Pravila zbiralnika
Ne izmišlja cen, ničelnih ali neuspelih branj ne zapiše, zadnje veljavne cene ne prepiše in jih po 14 dneh označi kot zastarele. Premor 2,5 s med stranmi, brez CAPTCHA in obhajanja zaščit. Pred rednim delovanjem preveri pogoje uporabe posameznih trgovin, še posebej za komercialno rabo.
