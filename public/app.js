/* Kotten och skogskartan – läs skalan, räkna rutorna, räkna ut avståndet.
   Allt ritas i kod (SVG), ingen bildfil, ingen tredjepartsförfrågan utom kotten.js. */
(function () {
  'use strict';

  var K = window.KARTOR;
  var F = K.formatera;
  var $ = function (id) { return document.getElementById(id); };

  var S = {
    niva: 0, fraga: -1, fragaData: null, svar: 0, ratt: 0,
    stjarnor: 0, antalRatt: 0, antalFel: 0, last: false,
    ljud: true, hind: null, raknat: false, klar: false
  };

  var el = {
    spel: $('spel'), start: $('startskarm'), niva: $('niva'), stjarnor: $('stjarnor'),
    fraga: $('fraga'), fragetext: $('fragetext'), skaltext: $('skaltext'),
    brada: $('brada'), svar: $('svar'), overlay: $('overlay'),
    ovTitel: $('ov-titel'), ovStjarnor: $('ov-stjarnor'), ovNasta: $('ov-nasta'),
    ovOm: $('ov-om'), ovKotte: $('ov-kotte'), ljud: $('ljud'), ljudikon: $('ljudikon')
  };

  /* ---------------- ljud och tal ---------------- */
  var ac = null;
  function ljud() {
    if (S.ljud === false) return;
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
    } catch (e) { return; }
  }
  function blipp(frekvens, langd, typ) {
    if (!S.ljud) return;
    ljud();
    if (!ac) return;
    try {
      var o = ac.createOscillator(), g2 = ac.createGain();
      o.type = typ || 'sine';
      o.frequency.value = frekvens;
      g2.gain.setValueAtTime(0.0001, ac.currentTime);
      g2.gain.exponentialRampToValueAtTime(0.13, ac.currentTime + 0.02);
      g2.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + (langd || 0.18));
      o.connect(g2); g2.connect(ac.destination);
      o.start(); o.stop(ac.currentTime + (langd || 0.18) + 0.02);
    } catch (e) {}
  }
  var senasteTal = 0;
  function sag(text) {
    if (!S.ljud || !('speechSynthesis' in window)) return;
    try {
      var nu = Date.now();
      if (nu - senasteTal < 220) return;
      senasteTal = nu;
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'sv-SE'; u.rate = 0.98; u.pitch = 1.05;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }
  function ritaLjudikon() {
    el.ljudikon.innerHTML = S.ljud
      ? '<path d="M4 9h3l5-4v14l-5-4H4z" fill="currentColor" stroke="none"/><path d="M16 8.5a5 5 0 0 1 0 7"/><path d="M18.5 6a8.5 8.5 0 0 1 0 12"/>'
      : '<path d="M4 9h3l5-4v14l-5-4H4z" fill="currentColor" stroke="none"/><path d="M16 9l5 6M21 9l-5 6"/>';
    el.ljud.setAttribute('aria-label', S.ljud ? 'Stäng av ljudet' : 'Sätt på ljudet');
  }

  /* ---------------- Kotten som SVG ---------------- */
  function kottenSVG(cx, cy, r, glad) {
    var s = '';
    s += '<g transform="translate(' + cx + ',' + cy + ')">';
    s += '<ellipse cx="0" cy="' + (r * 0.98) + '" rx="' + (r * 0.62) + '" ry="' + (r * 0.2) + '" fill="rgba(90,70,50,.13)"/>';
    /* kropp */
    s += '<ellipse cx="0" cy="0" rx="' + (r * 0.62) + '" ry="' + (r * 0.68) + '" fill="#8a5a3b"/>';
    for (var rad = -2; rad <= 2; rad++) {
      var yy = rad * r * 0.24, half = Math.sqrt(Math.max(0, 1 - Math.pow(rad * 0.32, 2))) * r * 0.56;
      for (var k = -1; k <= 1; k++) {
        s += '<path d="M' + (k * half * 0.52 - half * 0.2) + ',' + yy + ' q' + (half * 0.2) + ',' + (half * 0.16) + ' ' + (half * 0.4) + ',0" ' +
             'fill="none" stroke="rgba(255,255,255,.22)" stroke-width="' + (r * 0.035) + '" stroke-linecap="round"/>';
      }
    }
    /* ansikte */
    var fy = -r * 0.19;
    s += '<ellipse cx="0" cy="' + fy + '" rx="' + (r * 0.45) + '" ry="' + (r * 0.34) + '" fill="#c89a6d"/>';
    [-1, 1].forEach(function (sid) {
      var ex = sid * r * 0.2;
      s += '<circle cx="' + ex + '" cy="' + (fy - r * 0.06) + '" r="' + (r * 0.13) + '" fill="#fffaf2"/>';
      s += '<circle cx="' + (ex + sid * r * 0.012) + '" cy="' + (fy - r * 0.02) + '" r="' + (r * 0.068) + '" fill="#2f231a"/>';
    });
    if (glad) {
      s += '<path d="M' + (-r * 0.15) + ',' + (fy + r * 0.1) + ' q' + (r * 0.15) + ',' + (r * 0.2) + ' ' + (r * 0.3) + ',0" fill="none" stroke="#6f4526" stroke-width="' + (r * 0.05) + '" stroke-linecap="round"/>';
    } else {
      s += '<path d="M' + (-r * 0.12) + ',' + (fy + r * 0.14) + ' q' + (r * 0.12) + ',' + (r * 0.09) + ' ' + (r * 0.24) + ',0" fill="none" stroke="#6f4526" stroke-width="' + (r * 0.05) + '" stroke-linecap="round"/>';
    }
    /* tofs */
    s += '<ellipse cx="0" cy="' + (-r * 0.72) + '" rx="' + (r * 0.1) + '" ry="' + (r * 0.09) + '" fill="#6f4526"/>';
    s += '</g>';
    return s;
  }

  /* kotten som egen bildfil (för startskärm/overlay används png) */
  function kottenPNG() {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">' +
      '<rect width="200" height="200" rx="44" fill="#f1ece1"/>' + kottenSVG(100, 106, 68, true) + '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  /* ---------------- kartan ---------------- */
  function notIKorg(cx, cy, r) {
    return '<g transform="translate(' + cx + ',' + cy + ')">' +
      '<path d="M' + (-r) + ',0 a' + r + ',' + r + ' 0 0 0 ' + (2 * r) + ',0 z" fill="#c89a6d" stroke="#8a5a3b" stroke-width="' + (r * 0.14) + '"/>' +
      '<circle cx="' + (-r * 0.4) + '" cy="' + (-r * 0.25) + '" r="' + (r * 0.3) + '" fill="#8a5a3b"/>' +
      '<circle cx="' + (r * 0.35) + '" cy="' + (-r * 0.3) + '" r="' + (r * 0.26) + '" fill="#a06b45"/>' +
      '<path d="M' + (-r * 1.1) + ',0 h' + (2.2 * r) + '" stroke="#8a5a3b" stroke-width="' + (r * 0.16) + '" stroke-linecap="round"/>' +
      '</g>';
  }

  function trad(cx, cy, r) {
    return '<g transform="translate(' + cx + ',' + cy + ')">' +
      '<rect x="' + (-r * 0.1) + '" y="' + (r * 0.3) + '" width="' + (r * 0.2) + '" height="' + (r * 0.8) + '" rx="' + (r * 0.06) + '" fill="#9b7a52"/>' +
      '<circle cx="0" cy="0" r="' + r + '" fill="#8fae74"/><circle cx="' + (-r * 0.4) + '" cy="' + (-r * 0.3) + '" r="' + (r * 0.38) + '" fill="#9dbb82"/>' +
      '<circle cx="' + (r * 0.42) + '" cy="' + (-r * 0.15) + '" r="' + (r * 0.32) + '" fill="#7fa164"/>' +
      '</g>';
  }

  var CELL = 100;
  var TRAD = [[0.35, 0.3], [3.4, 2.62], [5.45, 0.4], [1.35, 3.4], [4.3, 3.45], [2.4, 0.28], [5.5, 2.7], [0.3, 2.3]];

  function kartaSVG(celler, opts) {
    opts = opts || {};
    var bredd = K.COLS * CELL, hojd = K.ROWS * CELL;
    var v = '<svg class="karta" viewBox="0 0 ' + bredd + ' ' + hojd + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' +
      (opts.etikett || 'Karta över skogen med en väg att mäta') + '">';
    v += '<rect x="0" y="0" width="' + bredd + '" height="' + hojd + '" rx="22" fill="#e8ecdd"/>';
    /* rutnät */
    var i;
    for (i = 1; i < K.COLS; i++) v += '<line x1="' + (i * CELL) + '" y1="0" x2="' + (i * CELL) + '" y2="' + hojd + '" stroke="#cfd6bf" stroke-width="2"/>';
    for (i = 1; i < K.ROWS; i++) v += '<line x1="0" y1="' + (i * CELL) + '" x2="' + bredd + '" y2="' + (i * CELL) + '" stroke="#cfd6bf" stroke-width="2"/>';
    /* träd som dekoration, aldrig på vägen */
    var upptagna = {};
    (celler || []).forEach(function (c) { upptagna[c.x + ',' + c.y] = 1; });
    TRAD.forEach(function (t) {
      var cx = t[0] * CELL, cy = t[1] * CELL;
      var ruta = Math.floor(cx / CELL) + ',' + Math.floor(cy / CELL);
      if (upptagna[ruta]) return;
      v += trad(cx, cy, opts.sma ? CELL * 0.13 : CELL * 0.17);
    });

    if (celler && celler.length) {
      var d = '';
      celler.forEach(function (c, idx) {
        var x = c.x * CELL + CELL / 2, y = c.y * CELL + CELL / 2;
        d += (idx === 0 ? 'M' : 'L') + x + ',' + y + ' ';
      });
      v += '<path d="' + d + '" fill="none" stroke="#cbb894" stroke-width="' + (CELL * 0.3) + '" stroke-linecap="round" stroke-linejoin="round"/>';
      v += '<path d="' + d + '" fill="none" stroke="#a98a5e" stroke-width="' + (CELL * 0.075) + '" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="' + (CELL * 0.16) + ' ' + (CELL * 0.14) + '"/>';

      var sist = celler[celler.length - 1];
      v += notIKorg(sist.x * CELL + CELL / 2, sist.y * CELL + CELL / 2 - CELL * 0.04, CELL * 0.19);

      var forsta = celler[0];
      v += kottenSVG(forsta.x * CELL + CELL / 2, forsta.y * CELL + CELL / 2 + CELL * 0.02, CELL * 0.28, true);

      if (opts.rakna) {
        celler.forEach(function (c, idx) {
          if (idx === 0) return;
          var x = c.x * CELL + CELL / 2, y = c.y * CELL + CELL / 2;
          v += '<circle cx="' + x + '" cy="' + y + '" r="' + (CELL * 0.19) + '" fill="#fffaf2" stroke="#8a5a3b" stroke-width="' + (CELL * 0.03) + '"/>';
          v += '<text x="' + x + '" y="' + (y + CELL * 0.075) + '" text-anchor="middle" font-size="' + (CELL * 0.24) + '" font-weight="800" fill="#8a5a3b" font-family="inherit">' + idx + '</text>';
        });
      }
    }
    v += '</svg>';
    return v;
  }

  /* ---------------- nivå och fråga ---------------- */
  function ritaNiva() {
    var v = '';
    for (var i = 0; i < K.NIVAAER.length; i++) {
      v += '<i class="' + (i < S.niva ? 'klar' : '') + '"></i>';
    }
    el.niva.innerHTML = v;
  }
  function ritaStjarnor() {
    var stj = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3 6.6 7 .9-5.1 4.8 1.4 7L12 17.9 5.7 21.3l1.4-7L2 9.5l7-.9z"/></svg>';
    el.stjarnor.innerHTML = stj + '<span>' + S.stjarnor + '</span>';
  }

  function nyFraga() {
    var niva = K.NIVAAER[S.niva];
    S.fraga++;
    S.antalFel = 0; S.last = false; S.raknat = false;
    if (S.hind) { clearTimeout(S.hind); S.hind = null; }
    S.fragaData = K.skapaFraga(S.niva);
    var fd = S.fragaData;

    el.skaltext.textContent = '1 ruta = ' + fd.skala + ' m';

    if (fd.typ === 'karta') {
      el.fragetext.textContent = 'Nötterna ligger ' + fd.avstånd + ' m bort. Vilken karta passar?';
      ritaKort();
    } else {
      el.fragetext.textContent = 'Hur långt är vägen?';
      ritaBrada();
      ritaSvar();
    }
    el.brada.classList.toggle('kort-lage', fd.typ === 'karta');
    el.svar.classList.toggle('kort-svar', false);
    el.svar.hidden = fd.typ === 'karta';

    var sagText = fd.typ === 'karta'
      ? ('Nötterna ligger ' + K.talOrd(fd.avstånd) + ' meter bort. En ruta är ' + K.talOrd(fd.skala) + ' meter. Vilken karta passar?')
      : ('En ruta är ' + K.talOrd(fd.skala) + ' meter. Hur långt är vägen?');
    setTimeout(function () { sag(sagText); }, 350);
    if (window.skolappar && window.skolappar.event) {
      try { window.skolappar.event('level', S.niva + 1); } catch (e) {}
    }
  }

  function ritaBrada() {
    el.brada.innerHTML = kartaSVG(S.fragaData.celler, { rakna: S.raknat });
  }
  function ritaKort() {
    var v = '';
    S.fragaData.kort.forEach(function (kort, i) {
      v += '<button class="kortknapp" data-kort="' + i + '" aria-label="Karta ' + (i + 1) + '">' +
        kartaSVG(kort.vag, { sma: true, etikett: 'Karta ' + (i + 1) + ' med en väg' }) + '</button>';
    });
    el.brada.innerHTML = v;
    Array.prototype.forEach.call(el.brada.querySelectorAll('.kortknapp'), function (b) {
      b.addEventListener('click', function () { svara(parseInt(b.dataset.kort, 10), true); });
    });
  }
  function ritaSvar() {
    var v = '';
   	S.fragaData.svar.forEach(function (n, i) {
      v += '<button class="svar-knapp" data-svar="' + n + '" aria-label="' + F(n) + '">' + F(n) + '</button>';
    });
    el.svar.hidden = false;
    el.svar.innerHTML = v;
    Array.prototype.forEach.call(el.svar.querySelectorAll('.svar-knapp'), function (b) {
      b.addEventListener('click', function () { svara(parseInt(b.dataset.svar, 10), false); });
    });
  }

  /* ---------------- svar ---------------- */
  function svara(varde, arKort) {
    if (S.last) return;
    var fd = S.fragaData;
    var ratt = arKort ? fd.rätt : fd.rätt;
    var knappar = arKort ? el.brada.querySelectorAll('.kortknapp') : el.svar.querySelectorAll('.svar-knapp');
    var denna = arKort ? el.brada.querySelector('[data-kort="' + varde + '"]') : el.svar.querySelector('[data-svar="' + varde + '"]');

    if (varde === ratt) {
      S.last = true; S.antalRatt++; S.stjarnor++;
      denna.classList.add('ratt'); denna.classList.remove('andar');
      blipp(660, 0.12); setTimeout(function () { blipp(880, 0.16); }, 120);
      var svarText = arKort
        ? ('Rätt! ' + fd.kort[ratt].rutor + ' rutor gånger ' + fd.skala + ' meter är ' + fd.avstånd + ' meter.')
        : (K.talOrd(fd.rätt) + ' meter. Rätt!');
      sag(svarText);
      el.fragetext.textContent = arKort
        ? 'Rätt! ' + fd.kort[ratt].rutor + ' rutor × ' + fd.skala + ' m = ' + fd.avstånd + ' m'
        : 'Rätt! ' + fd.rutor + ' rutor × ' + fd.skala + ' m = ' + fd.rätt + ' m';
      if (!arKort) { S.raknat = true; ritaBrada(); }
      setTimeout(nasta, 1300);
    } else {
      S.antalFel++;
      denna.classList.add('fel');
      blipp(220, 0.16, 'triangle');
      sag('Inte riktigt. Försök igen.');
      if (window.skolappar && window.skolappar.event) {
        try { window.skolappar.event('hint'); } catch (e) {}
      }
      if (S.antalFel >= 2) visaRakning(arKort);
    }
  }

  /* efter två försök: appen räknar rutorna tillsammans med barnet */
  function visaRakning(arKort) {
    var fd = S.fragaData;
    if (arKort) {
      var rattKort = el.brada.querySelector('[data-kort="' + fd.rätt + '"]');
      if (rattKort) rattKort.classList.add('andar');
      sag('Rätt karta är den med ' + fd.kort[fd.rätt].rutor + ' rutor.');
      return;
    }
    S.raknat = true;
    ritaBrada();
    sag('Vi räknar rutorna tillsammans. ' + K.talOrd(fd.rutor) + ' rutor.');
    setTimeout(function () {
      var rattKnapp = el.svar.querySelector('[data-svar="' + fd.rätt + '"]');
      if (rattKnapp) rattKnapp.classList.add('andar');
      S.hind = setTimeout(function () {
        if (S.hind) { clearTimeout(S.hind); S.hind = null; }
      }, 9000);
    }, 900);
  }

  function nasta() {
    var niva = K.NIVAAER[S.niva];
    if (S.fraga + 1 >= niva.antal) {
      S.niva++;
      if (S.niva >= K.NIVAAER.length) { slut(); return; }
      visaNivaKlar();
    } else {
      nyFraga();
    }
  }

  function visaNivaKlar() {
    S.fraga = -1;
    S.klar = true;
    var niva = K.NIVAAER[S.niva - 1];
    el.ovKotte.src = kottenPNG();
    el.ovStjarnor.innerHTML = '';
    for (var i = 0; i < K.NIVAAER.length; i++) {
      el.ovStjarnor.innerHTML += '<i class="' + (i < S.niva ? '' : 'tom') + '"></i>';
    }
    el.ovTitel.textContent = 'Nivå ' + S.niva + ' klar!';
    el.ovNasta.textContent = 'Nästa nivå';
    el.ovNasta.hidden = false;
    el.ovOm.hidden = true;
    el.overlay.hidden = false;
    blipp(660, 0.1); setTimeout(function () { blipp(880, 0.1); }, 110);
    setTimeout(function () { blipp(1100, 0.22); }, 230);
    sag('Nivå ' + K.talOrd(S.niva) + ' klar!');
  }

  function slut() {
    S.klar = true;
    el.ovKotte.src = kottenPNG();
    el.ovStjarnor.innerHTML = '';
    el.ovTitel.textContent = 'Alla nivåer klara! ' + S.stjarnor + ' stjärnor';
    el.ovNasta.hidden = true;
    el.ovOm.hidden = false;
    el.overlay.hidden = false;
    blipp(660, 0.1); setTimeout(function () { blipp(880, 0.1); }, 110);
    setTimeout(function () { blipp(1100, 0.22); }, 230);
    sag('Alla nivåer klara! Du fick ' + K.talOrd(S.stjarnor) + ' stjärnor.');
    if (window.skolappar && window.skolappar.event) {
      try {
        var procent = Math.round(100 * S.stjarnor / (K.NIVAAER.reduce(function (a, n) { return a + n.antal; }, 0)));
        window.skolappar.event('round_done', procent);
      } catch (e) {}
    }
  }

  /* ---------------- start ---------------- */
  function startaOm() {
    S.niva = 0; S.fraga = -1; S.stjarnor = 0; S.antalRatt = 0; S.klar = false;
    el.overlay.hidden = true;
    ritaNiva(); ritaStjarnor();
    nyFraga();
  }

  function starta() {
    el.start.hidden = true;
    el.spel.hidden = false;
    ritaLjudikon();
    startaOm();
    if (window.skolappar && window.skolappar.event) {
      try { window.skolappar.event('round_start'); } catch (e) {}
    }
  }

  $('spela').addEventListener('click', function () { ljud(); starta(); });
  el.ovNasta.addEventListener('click', function () {
    el.overlay.hidden = true; S.klar = false;
    ritaNiva(); ritaStjarnor();
    S.fraga = -1;
    nyFraga();
  });
  el.ovOm.addEventListener('click', function () {
    el.overlay.hidden = true;
    startaOm();
  });
  el.ljud.addEventListener('click', function () {
    S.ljud = !S.ljud;
    if (!S.ljud) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
      if (window.skolappar && window.skolappar.event) {
        try { window.skolappar.event('sound_off'); } catch (e) {}
      }
    }
    ritaLjudikon();
  });

  window.__spel = { S: S, K: K, starta: starta, nyFraga: nyFraga, svara: svara, nasta: nasta };
})();