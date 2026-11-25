# Inskick – Kotten och skogskartan

| Fält | Värde |
|---|---|
| Titel | Kotten och skogskartan |
| Kort beskrivning | Kotten har ritat en karta över skogen. En ruta på kartan är tio meter i skogen – räkna rutorna längs vägen och räkna ut hur långt det är fram till nötterna. Fem nivåer: rak väg, ett hörn, fem meter per ruta, hundra meter per ruta, och sist det omvända – avståndet är givet och du väljer den karta som passar. |
| URL | https://skogskartan.shipholm.dev |
| Ämne / årskurs / typ / enhet | Matte / 3–6 / Spel / Alla enheter |
| Lgr22 | MA.4-6.3.4 – ”Skala vid förminskning och förstoring samt användning av skala i elevnära situationer.” (+ MA.4-6.3.2 – ”Jämförelse, uppskattning och mätning av längd … samt enhetsbyten i samband med detta.”) |
| Kortbild | `public/kort.png` (1200×900, nivå 2 med sju rutor och ett hörn) |
| Repo | github.com/magnusfroste/skogskartan |
| Katalograd | pending `a8175bc4-8824-4a7b-bdc8-2fc99f1bf919`, bild `/images/dee24000…png` |

## Vad som tränas
Att en karta är en förminskning med ett fast förhållande: en ruta motsvarar ett bestämt antal
meter, och en väg på kartan räknas om till en längd i verkligheten – och tvärtom. Nivå 1 rak väg
(10 m/ruta), nivå 2 ett hörn, nivå 3 fem meter per ruta, nivå 4 hundra meter per ruta, nivå 5
omvänt (avståndet givet, välj rätt karta). 19 frågor, 19 stjärnor.

## Testresultat (2026-11-25)
- `node verify.cjs` – 60 000 genererade frågor, **0 fel**: vägens längd = antal rutor, vägen
  hänger ihop och korsar sig aldrig, rätt svar = rutor × skala, fyra olika svarsalternativ,
  nivå 1 alltid rak, nivå 2–4 alltid minst en sväng, nivå 5 har exakt ett kort som stämmer
  (räknat om ur kortens egen rutföljd). Talorden 0–999 kontrollerade mot handskriven tabell.
- **Hel runda på den driftsatta adressen**: alla 19 frågor från nivå 1 till ”Alla nivåer klara!
  19 stjärnor”, alla fem nivåövergångar.
- **Fel svar kostar inget:** två avsiktliga fel flyttade inte frågan vidare; efter andra felet
  dök räkningen upp (siffrorna 1–4 längs vägen) och rätt knapp började pulsera.
- **0 px scroll** i 1024×768, 768×1024, 390×844 och 1440×900, mätt efter att startskärmen
  stängts. Svarsknappar 266×151 px (iPad liggande), 368×80 (iPad stående), 181×76 (390 px).
- **Kortbilden kontrollerad i pixlarna**: 1200×900, 10 266 färger, Kotten i första rutan,
  korgen i sista, stigen mellan dem.
- `check_app`: 15/15, 0 varningar.

## Iteration efter test
Kartkorten på nivå 5 var 110×73 px i stående läge (rutorna 18 px, omöjliga att skilja) – nu
staplas de tre korten i stående läge och blir 370×213 (telefon) respektive 560×291 (iPad stående).

## Kvar
Ingenting i appen. Granskning och godkännande gör granskningsjobbet.