/* Prövar uppgiftsgeneratorn i kartor.js utan webbläsare.
   node verify.mjs */
const fs = require('fs');
const vm = require('vm');
const sandbox = {};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('public/kartor.js', 'utf8'), sandbox);
const K = sandbox.KARTOR;

let fel = 0;
const FEL = (m) => { fel++; console.log('FEL: ' + m); };

/* 1. nivåtabellen */
if (K.NIVAAER.length !== 5) FEL('antal nivåer ' + K.NIVAAER.length);
K.NIVAAER.forEach((n, i) => {
  if (!n.antal || n.antal < 3) FEL('nivå ' + i + ' för få frågor');
  if (!(n.skala > 0)) FEL('nivå ' + i + ' skala');
  if (n.typ !== 'mat' && n.typ !== 'karta') FEL('nivå ' + i + ' typ');
});

/* 2. varje genererad fråga är lösbar och entydig */
const prov = 60000;
const tal = new Set();
for (let i = 0; i < prov; i++) {
  const niv = i % K.NIVAAER.length;
  const f = K.skapaFraga(niv);
  if (f.niva !== niv) FEL('fel nivå på frågan');

  if (f.typ === 'mat') {
    if (!Array.isArray(f.celler) || f.celler.length !== f.rutor + 1)
      FEL('vägens längd ' + (f.celler && f.celler.length) + ' mot rutor ' + f.rutor);
    /* sammanhängande, inga upprepade rutor, inom planen */
    const sedda = new Set();
    for (let j = 0; j < f.celler.length; j++) {
      const c = f.celler[j];
      if (c.x < 0 || c.x >= K.COLS || c.y < 0 || c.y >= K.ROWS) FEL('ruta utanför planen');
      const ny = c.x + ',' + c.y;
      if (sedda.has(ny)) FEL('ruta besökt två gånger');
      sedda.add(ny);
      if (j > 0) {
        const p = f.celler[j - 1];
        const steg = Math.abs(p.x - c.x) + Math.abs(p.y - c.y);
        if (steg !== 1) FEL('vägen hoppar ' + steg + ' rutor');
      }
    }
    if (f.rätt !== f.rutor * f.skala) FEL('rätt svar ' + f.rätt + ' != rutor*skala');
    if (f.svar.length !== 4) FEL('fyra svarsalternativ? ' + f.svar.length);
    if (new Set(f.svar).size !== 4) FEL('dubbla svarsalternativ');
    if (!f.svar.includes(f.rätt)) FEL('rätt svar saknas bland alternativen');
    f.svar.forEach((s) => { if (!(s > 0)) FEL('alternativ <= 0'); });
    /* nivå 1 är rak: bara en riktning */
    if (K.NIVAAER[niv].rak) {
      const c0 = f.celler[0], c1 = f.celler[1];
      const rak = c0.y === c1.y || c0.x === c1.x;
      if (!rak) FEL('nivå 1 är inte rak');
      const lodrät = c0.x === c1.x;
      for (let j = 1; j < f.celler.length; j++) {
        if (lodrät && f.celler[j].x !== c0.x) FEL('nivå 1 svänger');
        if (!lodrät && f.celler[j].y !== c0.y) FEL('nivå 1 svänger');
      }
    } else {
      /* minst en sväng på nivå 2–4 */
      let svängar = 0;
      for (let j = 2; j < f.celler.length; j++) {
        const a = f.celler[j - 1], b = f.celler[j], p = f.celler[j - 2];
        if ((b.x - a.x) !== (a.x - p.x) || (b.y - a.y) !== (a.y - p.y)) svängar++;
      }
      if (svängar < 1) FEL('nivå ' + niv + ' saknar sväng');
    }
    tal.add(f.rätt);
  } else {
    if (f.kort.length !== 3) FEL('tre kort? ' + f.kort.length);
    if (f.rätt < 0 || f.rätt >= f.kort.length) FEL('rätt kort utanför');
    const rättKort = f.kort[f.rätt];
    if (rättKort.rutor * f.skala !== f.avstånd) FEL('rätt kort ger fel avstånd');
    const rutor = f.kort.map((k) => k.rutor);
    if (new Set(rutor).size !== 3) FEL('två kort med samma antal rutor');
    let träff = 0;
    f.kort.forEach((k) => { if (k.rutor * f.skala === f.avstånd) träff++; });
    if (träff !== 1) FEL('fler än ett kort stämmer');
    f.kort.forEach((k) => {
      if (!k.vag || k.vag.length !== k.rutor + 1) FEL('kortets väg har fel längd');
      const s = new Set(k.vag.map((c) => c.x + ',' + c.y));
      if (s.size !== k.vag.length) FEL('kortets väg korsar sig');
      for (let j = 1; j < k.vag.length; j++) {
        const a = k.vag[j - 1], b = k.vag[j];
        if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) !== 1) FEL('kortets väg hoppar');
      }
    });
  }
}

/* 3. talorden 0–999 */
const ental = ['noll','ett','två','tre','fyra','fem','sex','sju','åtta','nio','tio','elva','tolv','tretton','fjorton','femton','sexton','sjutton','arton','nitton'];
for (let n = 0; n < 20; n++) if (K.talOrd(n) !== ental[n]) FEL('talord ' + n + ': ' + K.talOrd(n));
if (K.talOrd(20) !== 'tjugo') FEL('talord 20: ' + K.talOrd(20));
if (K.talOrd(21) !== 'tjugoett') FEL('talord 21: ' + K.talOrd(21));
if (K.talOrd(40) !== 'fyrtio') FEL('talord 40: ' + K.talOrd(40));
if (K.talOrd(100) !== 'etthundra') FEL('talord 100: ' + K.talOrd(100));
if (K.talOrd(105) !== 'etthundraochfem') FEL('talord 105: ' + K.talOrd(105));
if (K.talOrd(480) !== 'fyrahundraochåttio') FEL('talord 480: ' + K.talOrd(480));
for (let n = 0; n <= 999; n++) {
  const t = K.talOrd(n);
  if (typeof t !== 'string' || !t.length || /undefined|NaN/.test(t)) FEL('talord ' + n + ' = ' + t);
}
/* alla tal som appen kan säga (skala 100 × 6 rutor = 600) */
for (let n = 0; n <= 900; n += 5) if (K.talOrd(n).length < 3) FEL('kort talord ' + n);

/* 4. formatering */
if (K.formatera(40) !== '40 m') FEL('formatera');

console.log('Nivåer: ' + K.NIVAAER.length + ', frågor prövade: ' + prov + ', olika rätta svar: ' + tal.size);
console.log(fel === 0 ? '0 fel' : fel + ' fel');
process.exit(fel === 0 ? 0 : 1);