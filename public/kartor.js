/* Kotten och skogskartan – regler och uppgiftsgenerator.
   Ren logik utan DOM, så att verify.mjs kan pröva den utan webbläsare. */
(function (g) {
  var COLS = 6, ROWS = 4;

  function rnd(n) { return Math.floor(Math.random() * n); }
  function nyckel(c) { return c.x + ',' + c.y; }
  function inne(x, y) { return x >= 0 && x < COLS && y >= 0 && y < ROWS; }

  /* En sammanhängande väg av `steg` steg (rutor). Inga rutor besöks två gånger,
     så vägen kan inte korsa sig själv och antalet rutor är entydigt. */
  function vag(steg, rak) {
    for (var försök = 0; försök < 400; försök++) {
      var start = { x: rnd(COLS), y: rnd(ROWS) };
      var celler = [{ x: start.x, y: start.y }];
      var sedda = {}; sedda[nyckel(start)] = 1;
      var riktning = rak ? (rnd(2) ? { x: 1, y: 0 } : { x: 0, y: 1 }) : null;
      var ok = true;
      for (var i = 0; i < steg; i++) {
        var sista = celler[celler.length - 1];
        var kandidater = [];
        if (riktning) {
          kandidater.push(riktning);
        } else {
          kandidater.push({ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 });
          /* blanda */
          for (var k = kandidater.length - 1; k > 0; k--) {
            var j = rnd(k + 1), t = kandidater[k];
            kandidater[k] = kandidater[j]; kandidater[j] = t;
          }
        }
        var nästa = null;
        for (var c = 0; c < kandidater.length; c++) {
          var nx = sista.x + kandidater[c].x, ny = sista.y + kandidater[c].y;
          if (inne(nx, ny) && !sedda[nx + ',' + ny]) { nästa = { x: nx, y: ny }; break; }
        }
        if (!nästa) { ok = false; break; }
        sedda[nyckel(nästa)] = 1;
        celler.push(nästa);
      }
      if (!ok) continue;
      /* rak väg ska ha minst en sväng? nej – L2 kräver sväng, kontrolleras nedan */
      if (!rak) {
        var svängar = 0;
        for (var m = 2; m < celler.length; m++) {
          var a = celler[m - 1], b = celler[m], p = celler[m - 2];
          if ((b.x - a.x) !== (a.x - p.x) || (b.y - a.y) !== (a.y - p.y)) svängar++;
        }
        if (svängar < 1) continue;
      }
      return celler;
    }
    return null;
  }

  function blanda(lista) {
    for (var i = lista.length - 1; i > 0; i--) {
      var j = rnd(i + 1), t = lista[i]; lista[i] = lista[j]; lista[j] = t;
    }
    return lista;
  }

  /* Nivåer: en sak läggs till per nivå – först en sväng, sedan en annan skala,
     sedan en stor skala, sist vänds frågan (från meter till ruta). */
  var NIVAAER = [
    { namn: 'Rak väg', text: 'En ruta är tio meter.', skala: 10, min: 3, max: 5, rak: true, typ: 'mat', antal: 4 },
    { namn: 'Ett hörn', text: 'En ruta är tio meter.', skala: 10, min: 4, max: 7, rak: false, typ: 'mat', antal: 4 },
    { namn: 'Fem meter per ruta', text: 'En ruta är fem meter.', skala: 5, min: 6, max: 9, rak: false, typ: 'mat', antal: 4 },
    { namn: 'Hundra meter per ruta', text: 'En ruta är hundra meter.', skala: 100, min: 3, max: 6, rak: false, typ: 'mat', antal: 4 },
    { namn: 'Vilken karta passar?', text: 'En ruta är tio meter.', skala: 10, min: 3, max: 6, rak: false, typ: 'karta', antal: 3 }
  ];

  function skapaFraga(nivaIndex) {
    var niva = NIVAAER[nivaIndex];
    if (niva.typ === 'karta') {
      var rättRutor = niva.min + rnd(niva.max - niva.min + 1);
      var avstånd = rättRutor * niva.skala;
      var antal = [rättRutor - 1, rättRutor + 1];
      /* tre kort: rätt + två grannar, alla minst 2 rutor */
      var rutor = [rättRutor].concat(antal).map(function (n) { return n < 2 ? n + 3 : n; });
      rutor = rutor.filter(function (v, i, a) { return a.indexOf(v) === i; });
      while (rutor.length < 3) rutor.push(rutor[rutor.length - 1] + 2);
      var kort = rutor.map(function (n) {
        return { rutor: n, vag: vag(n, false) };
      });
      blanda(kort);
      return {
        niva: nivaIndex, typ: 'karta', skala: niva.skala, avstånd: avstånd,
        kort: kort, rätt: kort.findIndex(function (k) { return k.rutor === rättRutor; })
      };
    }
    var steg = niva.min + rnd(niva.max - niva.min + 1);
    var celler = vag(steg, niva.rak);
    if (!celler) celler = vag(steg, true);
    var rätt = steg * niva.skala;
    var fel = blanda([(steg - 1) * niva.skala, (steg + 1) * niva.skala, (steg + 2) * niva.skala]);
    var svar = [rätt];
    for (var i = 0; i < fel.length && svar.length < 4; i++) {
      if (fel[i] > 0 && svar.indexOf(fel[i]) === -1) svar.push(fel[i]);
    }
    blanda(svar);
    return {
      niva: nivaIndex, typ: 'mat', skala: niva.skala, rutor: steg, celler: celler,
      rätt: rätt, svar: svar
    };
  }

  function formatera(n) {
    return n + ' m';
  }

  /* svenska talord 0–999, för uppläsning */
  function talOrd(n) {
    var ental = ['noll','ett','två','tre','fyra','fem','sex','sju','åtta','nio','tio',
      'elva','tolv','tretton','fjorton','femton','sexton','sjutton','arton','nitton'];
    var tiotal = ['','','tjugo','trettio','fyrtio','femtio','sextio','sjuttio','åttio','nittio'];
    if (n < 20) return ental[n];
    if (n < 100) {
      var t = Math.floor(n / 10), e = n % 10;
      return tiotal[t] + (e ? ental[e] : '');
    }
    var h = Math.floor(n / 100), r = n % 100;
    var hundra = (h === 1 ? 'etthundra' : ental[h] + 'hundra');
    if (r === 0) return hundra;
    if (r < 20) return hundra + 'och' + ental[r];
    var t2 = Math.floor(r / 10), e2 = r % 10;
    return hundra + 'och' + tiotal[t2] + (e2 ? ental[e2] : '');
  }

  g.KARTOR = {
    COLS: COLS, ROWS: ROWS, NIVAAER: NIVAAER,
    skapaFraga: skapaFraga, vag: vag, formatera: formatera, talOrd: talOrd, talOrd_: talOrd
  };
})(typeof window !== 'undefined' ? window : this);