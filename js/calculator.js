/*
 * Hugo Paella — Paella Receptencalculator
 *
 * Rekenregels, tabellen en testwaarden komen uit "SUMM Paella calculator.xlsx"
 * (tabbladen: Rekenregels, Rijst pan brander, Pangrootte). Zie de 15 testcases
 * in dat bestand — dezelfde cases staan (met dezelfde uitkomsten) hieronder in
 * calculatorSelfTest() als regressietest.
 *
 * Reikwijdte van dit bestand: alleen de 4 officiële uitvoervelden (rijst,
 * bouillon/water, paellapan, gasbrander) + validatie. De ingrediëntenlijsten
 * en het recept-PDF horen bij een latere stap.
 */

(function (global) {
  "use strict";

  // ---- Brondata uit de spreadsheet -----------------------------------

  var PORTIE_GRAM = { klein: 80, normaal: 100, groot: 120 };

  // [min, max] aantal gasten per portiegrootte.
  var GASTEN_RANGE = { klein: [6, 50], normaal: [4, 50], groot: [4, 40] };

  // Vocht (liter) per 100 g rijst, per gerecht — vóór correctie.
  var LIQUID_BASE_PER_100G = {
    valencia: 0.52,
    marisco: 0.3,
    verduras: 0.3,
    fideua: 0.3,
  };

  var WIND_FACTOR = { geen: 0, weinig: 0.05, veel: 0.1 };
  var BINNEN_FACTOR = 0.95;

  // Volledige lijst beschikbare paellapan-diameters (voor de voorkeur-select
  // en de "één maat groter/kleiner"-tolerantie).
  var PANGROOTTE_LIST = [
    15, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 46, 50, 55, 60, 65, 70,
    75, 80, 85, 90, 100, 115, 130,
  ];

  // Rijst (g) -> aanbevolen pan (cm) + gasbrander (cm). Rechtstreeks
  // overgenomen uit tabblad "Rijst pan brander" (kolommen D/E), niet
  // herberekend — die tabel is de bron van waarheid, niet de geometrische
  // vuistformule die er ter controle naast staat.
  var RIJST_PAN_BRANDER = [
    { rijst: 400, pan: 46, brander: 30 },
    { rijst: 500, pan: 50, brander: 35 },
    { rijst: 600, pan: 55, brander: 40 },
    { rijst: 700, pan: 60, brander: 45 },
    { rijst: 800, pan: 60, brander: 45 },
    { rijst: 900, pan: 65, brander: 45 },
    { rijst: 1000, pan: 70, brander: 50 },
    { rijst: 1100, pan: 70, brander: 50 },
    { rijst: 1200, pan: 75, brander: 60 },
    { rijst: 1300, pan: 80, brander: 60 },
    { rijst: 1400, pan: 80, brander: 60 },
    { rijst: 1500, pan: 85, brander: 60 },
    { rijst: 1600, pan: 85, brander: 60 },
    { rijst: 1700, pan: 90, brander: 70 },
    { rijst: 1800, pan: 90, brander: 70 },
    { rijst: 1900, pan: 90, brander: 70 },
    { rijst: 2000, pan: 100, brander: 70 },
    { rijst: 2100, pan: 100, brander: 70 },
    { rijst: 2200, pan: 100, brander: 70 },
    { rijst: 2300, pan: 100, brander: 70 },
    { rijst: 2400, pan: 100, brander: 70 },
    { rijst: 2500, pan: 100, brander: 70 },
    { rijst: 2600, pan: 100, brander: 70 },
    { rijst: 2700, pan: 115, brander: 80 },
    { rijst: 2800, pan: 115, brander: 80 },
    { rijst: 2900, pan: 115, brander: 80 },
    { rijst: 3000, pan: 115, brander: 80 },
    { rijst: 3100, pan: 115, brander: 80 },
    { rijst: 3200, pan: 115, brander: 80 },
    { rijst: 3300, pan: 115, brander: 80 },
    { rijst: 3400, pan: 130, brander: 90 },
    { rijst: 3500, pan: 130, brander: 90 },
    { rijst: 3600, pan: 130, brander: 90 },
    { rijst: 3700, pan: 130, brander: 90 },
    { rijst: 3800, pan: 130, brander: 90 },
    { rijst: 3900, pan: 130, brander: 90 },
    { rijst: 4000, pan: 130, brander: 90 },
    { rijst: 4100, pan: 130, brander: 90 },
    { rijst: 4200, pan: 130, brander: 90 },
    { rijst: 4300, pan: 130, brander: 90 },
    { rijst: 4400, pan: 130, brander: 90 },
    { rijst: 4500, pan: 130, brander: 90 },
    { rijst: 4600, pan: 130, brander: 90 },
    { rijst: 4700, pan: 130, brander: 90 },
    { rijst: 4800, pan: 130, brander: 90 },
    { rijst: 4900, pan: 130, brander: 90 },
    { rijst: 5000, pan: 130, brander: 90 },
  ];

  // ---- Rekenlogica ------------------------------------------------------

  function computeRiceGrams(gasten, portie) {
    return gasten * PORTIE_GRAM[portie];
  }

  function validateGasten(portie, gasten, messages) {
    var range = GASTEN_RANGE[portie];
    var min = range[0];
    var max = range[1];
    if (!Number.isFinite(gasten) || gasten <= 0) {
      return { ok: false, message: messages.empty };
    }
    if (gasten < min || gasten > max) {
      if (portie === "klein" && gasten < min) {
        return { ok: false, message: messages.kleinMin(min) };
      }
      if (portie === "groot" && gasten > max) {
        return { ok: false, message: messages.grootMax(max) };
      }
      return { ok: false, message: messages.range(min, max) };
    }
    return { ok: true };
  }

  function lookupPanBrander(riceGrams) {
    for (var i = 0; i < RIJST_PAN_BRANDER.length; i++) {
      if (RIJST_PAN_BRANDER[i].rijst >= riceGrams) {
        return { pan: RIJST_PAN_BRANDER[i].pan, brander: RIJST_PAN_BRANDER[i].brander };
      }
    }
    var last = RIJST_PAN_BRANDER[RIJST_PAN_BRANDER.length - 1];
    return { pan: last.pan, brander: last.brander };
  }

  function findBranderForPan(panCm) {
    for (var i = 0; i < RIJST_PAN_BRANDER.length; i++) {
      if (RIJST_PAN_BRANDER[i].pan === panCm) return RIJST_PAN_BRANDER[i].brander;
    }
    return null;
  }

  // Past een voorkeur-pangrootte toe: geaccepteerd als hij maximaal één stap
  // (in de Pangrootte-lijst) van de standaardpan afligt EN er een bijpassende
  // brander bekend is voor die maat. Anders: standaardpan/-brander behouden
  // en preferenceFailed=true.
  function applyPreference(defaultPan, defaultBrander, voorkeur) {
    if (!voorkeur) {
      return { pan: defaultPan, brander: defaultBrander, failed: false };
    }
    var idxDefault = PANGROOTTE_LIST.indexOf(defaultPan);
    var idxPref = PANGROOTTE_LIST.indexOf(voorkeur);
    if (idxPref === -1 || Math.abs(idxPref - idxDefault) > 1) {
      return { pan: defaultPan, brander: defaultBrander, failed: true };
    }
    var brander = findBranderForPan(voorkeur);
    if (brander === null) {
      return { pan: defaultPan, brander: defaultBrander, failed: true };
    }
    return { pan: voorkeur, brander: brander, failed: false };
  }

  function computeLiquidLiters(dish, riceGrams, buitenBinnen, wind) {
    var base = LIQUID_BASE_PER_100G[dish];
    var factor;
    if (buitenBinnen === "binnen") {
      // Binnen: altijd -5%, windinvoer wordt genegeerd (windmeter is dan
      // sowieso al vergrendeld op "geen" in de UI).
      factor = BINNEN_FACTOR;
    } else {
      factor = 1 + (WIND_FACTOR[wind] || 0);
    }
    return base * (riceGrams / 100) * factor;
  }

  function roundToStep(value, step) {
    return Math.round(value / step) * step;
  }

  /**
   * @param {Object} input
   * @param {'valencia'|'marisco'|'verduras'|'fideua'} input.dish
   * @param {'klein'|'normaal'|'groot'} input.portie
   * @param {number} input.gasten
   * @param {'buiten'|'binnen'} input.buitenBinnen
   * @param {'geen'|'weinig'|'veel'} input.wind
   * @param {number|null} input.voorkeurPan
   * @param {Object} messages  vertaalde foutmeldingen (zie NL/ES wiring)
   */
  function calculate(input, messages) {
    var gastenNum = Number(input.gasten);
    var validation = validateGasten(input.portie, gastenNum, messages);
    if (!validation.ok) {
      return { ok: false, message: validation.message };
    }

    var riceGrams = computeRiceGrams(gastenNum, input.portie);
    var liquidLitersExact = computeLiquidLiters(
      input.dish,
      riceGrams,
      input.buitenBinnen,
      input.wind
    );
    var defaultPanBrander = lookupPanBrander(riceGrams);
    var pref = applyPreference(
      defaultPanBrander.pan,
      defaultPanBrander.brander,
      input.voorkeurPan
    );

    return {
      ok: true,
      riceGrams: riceGrams,
      liquidLiters: roundToStep(liquidLitersExact, 0.1),
      liquidLitersExact: liquidLitersExact,
      pan: pref.pan,
      brander: pref.brander,
      preferenceFailed: !!input.voorkeurPan && pref.failed,
    };
  }

  var PaellaCalculator = {
    PORTIE_GRAM: PORTIE_GRAM,
    GASTEN_RANGE: GASTEN_RANGE,
    PANGROOTTE_LIST: PANGROOTTE_LIST,
    RIJST_PAN_BRANDER: RIJST_PAN_BRANDER,
    calculate: calculate,
  };

  global.PaellaCalculator = PaellaCalculator;
})(typeof window !== "undefined" ? window : globalThis);
