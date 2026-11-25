# Kotten och skogskartan

## Koncept (en sak per app)
Kotten har ritat en karta över skogen. En ruta på kartan är till exempel tio meter i skogen.
Vägen till nötterna är utritad genom rutorna; barnet räknar rutorna längs vägen och räknar ut
hur långt det är i verkligheten.

- **Målgrupp:** åk 4–6 (9–12 år). Kort text i spelbilden: skalan står som en ruta med meter
  bredvid, frågan skrivs ut och läses upp.
- **Kärnmekanik:** två tryck – läs skalan, räkna rutorna, tryck på rätt avstånd bland fyra tal.
  Ingen dragning, inget tangentbord.
- **Nivåer (en sak läggs till per nivå):**
  1. Rak väg, 1 ruta = 10 m (3–5 rutor).
  2. Ett hörn, 1 ruta = 10 m (4–7 rutor) – barnet måste följa vägen, inte bara räkna bredden.
  3. 1 ruta = 5 m (6–9 rutor) – skalan byts, multiplikationen blir svårare.
  4. 1 ruta = 100 m (3–6 rutor) – stor skala, svaren i hundratal.
  5. Vänd frågan: avståndet i meter är givet ("Nötterna ligger 40 m bort") och barnet väljer
     bland tre kartor den som är ritad i rätt skala. Här tränas skalan åt andra hållet:
     meter → rutor.
- **5-minuterssession:** 19 frågor, 4 per nivå och 3 på sista.
- **Belöning barnet kan berätta om:** en stjärna per rätt svar och en nivåstjärna på slutet
  ("Alla nivåer klara! 19 stjärnor").
- **Vad barnet lär:** att en karta är en förminskning med ett fast förhållande, att en ruta
  motsvarar ett bestämt antal meter, och att avstånd på kartan räknas om till avstånd i
  verkligheten – och tvärtom.
- **Lgr22:** MA.4-6.3.4 – "Skala vid förminskning och förstoring samt användning av skala i
  elevnära situationer." (citat ur Skolverkets kursplan, Matematik åk 4–6, centralt innehåll.)
- **Varför iPad:** fyra svarsknappar på 64–150 px där tummarna redan är, kartan ritas i en SVG
  som alltid ryms (6×4 rutor), inget scroll. Fel svar kostar inget; efter två försök räknar
  appen rutorna högt och siffrorna dyker upp på kartan.

## Testplan (mätbara krav)
1. Varje fråga lösbar och entydig: `node verify.cjs` prövar 60 000 genererade frågor – vägens
   längd = antal rutor, vägen hänger ihop utan att korsa sig, rätt svar = rutor × skala, fyra
   olika alternativ, nivå 1 alltid rak, nivå 2–4 alltid minst en sväng, nivå 5 har exakt ett
   kort som stämmer.
2. Talorden 0–999 kontrollerade mot handskriven tabell (uppläsningen får aldrig säga fel).
3. Allt ryms: `scrollHeight - innerHeight == 0` och `scrollWidth - innerWidth == 0` i
   1024×768, 768×1024, 390×844, 1440×900, mätt efter att startskärmen stängts.
4. Hela rundan spelbar: alla 19 frågor till "Alla nivåer klara!".
5. Fel svar flyttar inte frågan vidare, kostar inget, och efter två försök visas räkningen.
6. Ingen inloggning, inga länkar ut, inga tredjepartsförfrågningar utom `kotten.js`.

## Validering (gate innan bygge)
`delegate_task` finns inte i den här körningens verktyg, så grinden gjordes som skriftlig
hårdkritik mot de tre frågorna:
- *(a) Spelar ett barn frivilligt i fem minuter?* Ja, om frågan är kort och svaret går att trycka
  direkt. Risken är nivå 4 (100 m per ruta) där talen blir stora; därför står skalan alltid kvar
  synlig och räkningen visas efter två försök i stället för att barnet fastnar.
- *(b) Träffar det ett verkligt kunskapskrav?* Ja. MA.4-6.3.4 är ett eget centralt innehåll, och
  ingen av katalogens 79 appar länkade till det (mätt 2026-11-25 på admin-ytan).
- *(c) Teknisk risk?* Låg: ren SVG och en generator som `verify.cjs` prövar 60 000 gånger.
  Den verkliga risken är att kartan blir för liten i stående mobil – löst med staplade kort.