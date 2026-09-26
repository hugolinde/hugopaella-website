/*
 * Hugo Paella — Paella Receptencalculator (rekenlogica)
 *
 * Taalonafhankelijk: dit bestand rekent en geeft statuscodes terug; de
 * teksten staan in calculator-ui.js. Alle tabellen en grenswaarden komen uit
 * calculator-config.js (window.PaellaCalculatorConfig).
 *
 * Volgorde van de berekening:
 *   gasten × gram rijst p.p. -> rijst -> ideale standaard panmaat
 *   -> (eventueel toetsen aan bestaande pan en/of brander) -> branderadvies.
 *
 * Bestaand materiaal (input.existing):
 *   "nee"     pan berekenen, brander adviseren
 *   "pan"     pan controleren (ideaal ± tolerantie), brander adviseren bij die pan
 *   "brander" binnen de panbandbreedte een pan zoeken die op de brander past
 *             (niet te klein, niet te groot); pas als geen enkele past volgt
 *             een advies voor een andere brander
 *   "beide"   A: hoeveelheid <-> pan en B: pan <-> brander afzonderlijk
 */

(function (global) {
  "use strict";

  var C = global.PaellaCalculatorConfig;

  // ---- Recept: rijst en vocht --------------------------------------------

  function validateGasten(portie, gasten, messages) {
    var range = C.GASTEN_RANGE[portie];
    var min = range[0];
    var max = range[1];
    if (!Number.isFinite(gasten) || gasten <= 0) {
      return { ok: false, message: messages.empty };
    }
    if (gasten < min || gasten > max) {
      if (portie === "klein" && gasten < min) return { ok: false, message: messages.kleinMin(min) };
      if (portie === "groot" && gasten > max) return { ok: false, message: messages.grootMax(max) };
      return { ok: false, message: messages.range(min, max) };
    }
    return { ok: true };
  }

  function computeLiquidLiters(dish, riceGrams, buitenBinnen, wind) {
    var base = C.LIQUID_BASE_PER_100G[dish];
    // Binnen: altijd -5%, wind wordt genegeerd (de UI zet wind dan op "geen").
    var factor = buitenBinnen === "binnen" ? C.BINNEN_FACTOR : 1 + (C.WIND_FACTOR[wind] || 0);
    return base * (riceGrams / 100) * factor;
  }

  function roundToStep(value, step) {
    return Math.round(value / step) * step;
  }

  // ---- Pan ---------------------------------------------------------------

  function idealPanFor(riceGrams) {
    for (var i = 0; i < C.RICE_TO_PAN.length; i++) {
      if (C.RICE_TO_PAN[i].riceMax >= riceGrams) return C.RICE_TO_PAN[i].pan;
    }
    return C.RICE_TO_PAN[C.RICE_TO_PAN.length - 1].pan;
  }

  // Toegestane panmaten: ideaal ± PAN_TOLERANCE_STEPS posities in PAN_SIZES.
  function panBand(idealPan) {
    var sizes = C.PAN_SIZES;
    var idx = sizes.indexOf(idealPan);
    var lo = Math.max(0, idx - C.PAN_TOLERANCE_STEPS);
    var hi = Math.min(sizes.length - 1, idx + C.PAN_TOLERANCE_STEPS);
    return sizes.slice(lo, hi + 1);
  }

  // ---- Brander -----------------------------------------------------------

  // Regel uit een profiel voor een bestaande brandermaat. Staat de maat er
  // niet in, dan geldt de eerstvolgende kleinere maat (voorzichtige kant).
  function burnerRow(size, profile) {
    var rows = C.BURNER_PROFILES[profile].burners;
    var best = null;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].burner <= size && (!best || rows[i].burner > best.burner)) best = rows[i];
    }
    return best || rows[0];
  }

  // Kleinste gangbare brander ("advice") van een profiel die niet te klein
  // (panMax >= pan) en niet te groot (<= bodem - marge) is; null als geen
  // enkele brander van dit profiel de pan aankan.
  function adviceInProfile(pan, profile, marginKey) {
    var prof = C.BURNER_PROFILES[profile];
    var max = maxBurnerFor(pan, marginKey || profile);
    var pick = function (onlyAdvice, respectMax) {
      var best = null;
      prof.burners.forEach(function (row) {
        if (onlyAdvice && prof.advice.indexOf(row.burner) === -1) return;
        if (row.panMax < pan || (respectMax && row.burner > max)) return;
        if (!best || row.burner < best.burner) best = row;
      });
      return best;
    };
    // Alleen gangbare maten; past er geen netjes, dan de kleinste gangbare
    // maat die niet te klein is. Pas daarna (in de praktijk nooit) overige maten.
    return pick(true, true) || pick(true, false) || pick(false, true) || pick(false, false);
  }

  // Branderadvies voor een pan. Past de pan niet op het standaardprofiel, dan
  // wordt een professionele brander geadviseerd (geen fictieve grotere
  // standaardbrander).
  function adviseBurner(pan, profile, marginKey) {
    var row = adviceInProfile(pan, profile, marginKey);
    if (row) return { size: row.burner, profile: profile, forcedPro: false };
    var pro = adviceInProfile(pan, "professional");
    var proRows = C.BURNER_PROFILES.professional.burners;
    var size = pro ? pro.burner : proRows[proRows.length - 1].burner;
    return { size: size, profile: "professional", forcedPro: profile !== "professional" };
  }

  // Bodemdiameter van een pan (de opgegeven pandiameter is die van de bovenrand).
  function panBottom(pan) {
    if (C.PAN_BOTTOM[pan]) return C.PAN_BOTTOM[pan];
    return Math.round(pan * C.PAN_BOTTOM_RATIO);
  }

  // Grootste brander die nog onder de bodem past: bodem - marge van het type.
  function maxBurnerFor(pan, marginKey) {
    return panBottom(pan) - C.BURNER_MARGIN_CM[marginKey];
  }

  // Past een bestaande brander onder een pan?
  //   tooSmall  pan > panMax van de brander (fabrikantgegevens)
  //   tooLarge  brander > bodem - marge: de vlam komt tegen de schuine rand
  //   fits      geen van beide
  // profile   bepaalt panMax (standard | professional)
  // marginKey bepaalt de marge onder de bodem (standard | professional)
  function checkBurner(pan, burnerSize, profile, marginKey) {
    var row = burnerRow(burnerSize, profile);
    var max = maxBurnerFor(pan, marginKey || profile);
    var tooSmall = pan > row.panMax;
    var tooLarge = burnerSize > max;
    return {
      fits: !tooSmall && !tooLarge,
      tooSmall: tooSmall,
      tooLarge: tooLarge,
      maxBurner: max,
      advice: adviseBurner(pan, profile),
    };
  }

  // ---- Hoofdberekening ---------------------------------------------------

  /**
   * @param {Object} input
   * @param {'valencia'|'marisco'|'verduras'|'fideua'} input.dish
   * @param {'klein'|'normaal'|'groot'} input.portie
   * @param {number} input.gasten
   * @param {'buiten'|'binnen'} input.buitenBinnen
   * @param {'geen'|'weinig'|'veel'} input.wind
   * @param {'nee'|'pan'|'brander'|'beide'} [input.existing]
   * @param {number} [input.ownPan]         diameter bestaande pan (cm)
   * @param {number} [input.ownBurner]      diameter buitenste branderring (cm)
   * @param {'standaard'|'professioneel'|'onbekend'} [input.burnerType]
   * @param {Object} messages  vertaalde validatiemeldingen (zie calculator-ui.js)
   *
   * Resultaat (ok=true):
   *   riceGrams, liquidLiters, idealPan, band[]
   *   pan:     { size, status, own }   status: recommended | ok | fitsBurner | tooSmall | tooLarge
   *   burner:  { size, status, own, professional }
   *                                    status: minimum | ok | tooSmall | tooLarge | needsPro | notIndoor
   *   notices: [{ code, type: ok|info|warn, ...data }]
   *   pan.size en burner.size zijn de uiteindelijk te gebruiken maten (ook voor de PDF).
   */
  function calculate(input, messages) {
    var gasten = Number(input.gasten);
    var validation = validateGasten(input.portie, gasten, messages);
    if (!validation.ok) return { ok: false, message: validation.message };

    var riceGrams = gasten * C.PORTIE_GRAM[input.portie];
    var liquidExact = computeLiquidLiters(input.dish, riceGrams, input.buitenBinnen, input.wind);

    var existing = input.existing || "nee";
    var usesPan = existing === "pan" || existing === "beide";
    var usesBurner = existing === "brander" || existing === "beide";
    var binnen = input.buitenBinnen === "binnen";

    var idealPan = idealPanFor(riceGrams);
    var band = panBand(idealPan);
    var adviceProfile = C.PROFILE_BY_LOCATION[input.buitenBinnen] || "standard";

    var notices = [];
    var pan = { size: idealPan, status: "recommended", own: null };
    var burner = null;

    // -- Pan: controle A (hoeveelheid <-> pan) --
    var panOk = true;
    if (usesPan) {
      var ownPan = Number(input.ownPan);
      panOk = band.indexOf(ownPan) !== -1;
      if (panOk) {
        pan = { size: ownPan, status: "ok", own: ownPan };
      } else {
        pan = { size: idealPan, status: ownPan < idealPan ? "tooSmall" : "tooLarge", own: ownPan };
        notices.push({
          code: "panOutOfBand",
          type: "warn",
          own: ownPan,
          ideal: idealPan,
          bandMin: band[0],
          bandMax: band[band.length - 1],
          tooSmall: ownPan < idealPan,
        });
      }
    }

    // -- Brander --
    if (!usesBurner) {
      var adv = adviseBurner(pan.size, adviceProfile);
      burner = { size: adv.size, status: "minimum", own: null, professional: adv.profile === "professional" };
      if (adv.forcedPro) notices.push({ code: "proNeeded", type: "info", pan: pan.size, burner: adv.size });
      if (usesPan && panOk) notices.push({ code: "panOk", type: "ok", own: pan.size });
    } else {
      var ownBurner = Number(input.ownBurner);
      var type = input.burnerType || "onbekend";
      // Profiel voor "te klein" (panMax) en marge voor "te groot". "Weet ik
      // niet" rekent als standaardbrander; daarnaast een waarschuwing als hij
      // te groot zou zijn voor het geval het een vlakke/professionele brander is.
      var ownProfile = type === "professioneel" ? "professional" : "standard";
      var ownMargin = ownProfile;
      var ownIsPro = ownProfile === "professional";
      var unknownType = type === "onbekend";
      var maybeLargeNotice = function (forPan) {
        var proMax = maxBurnerFor(forPan, "professional");
        if (unknownType && ownBurner > proMax) {
          notices.push({ code: "unknownMaybeLarge", type: "info", own: ownBurner, pan: forPan, max: proMax });
        }
      };

      if (type === "onbekend") notices.push({ code: "unknownType", type: "info" });

      // Kaart en melding voor een brander die niet past onder een pan.
      var rejectBurner = function (chk, forPan, context) {
        if (chk.tooLarge) {
          burner = { size: chk.advice.size, status: "tooLarge", own: ownBurner, professional: chk.advice.profile === "professional" };
          notices.push({
            code: "burnerTooLarge", type: "warn", own: ownBurner, pan: forPan, max: chk.maxBurner,
            panOk: context.panOk, viaIdeal: context.viaIdeal,
          });
          return;
        }
        var needsPro = chk.advice.profile === "professional" && !ownIsPro;
        burner = { size: chk.advice.size, status: needsPro ? "needsPro" : "tooSmall", own: ownBurner, professional: chk.advice.profile === "professional" };
        notices.push({
          code: "burnerTooSmall", type: "warn", own: ownBurner, pan: forPan, need: chk.advice.size,
          pro: needsPro, panOk: context.panOk, viaIdeal: context.viaIdeal,
        });
      };

      if (binnen && !ownIsPro) {
        // Binnen + (mogelijk) buitenbrander: geen positief geschiktheidsadvies.
        var proAdv = adviseBurner(pan.size, "professional");
        burner = { size: proAdv.size, status: "notIndoor", own: ownBurner, professional: true };
        notices.push({ code: "indoorUnsafe", type: "warn", burner: proAdv.size, pan: pan.size });
      } else if (existing === "brander") {
        // Zoek binnen de bandbreedte de pan waar de brander niet te klein en
        // niet te groot voor is en die het dichtst bij ideaal ligt.
        // Bij "Weet ik niet" liefst een pan waar hij ook als vlakke brander
        // niet te groot voor is.
        var best = null;
        band.forEach(function (size) {
          if (!checkBurner(size, ownBurner, ownProfile, ownMargin).fits) return;
          var penalty = unknownType && ownBurner > maxBurnerFor(size, "professional") ? 1000 : 0;
          var dist = penalty + Math.abs(size - idealPan);
          if (!best || dist < best.dist) best = { size: size, dist: dist };
        });
        if (best) {
          pan = { size: best.size, status: best.size === idealPan ? "recommended" : "fitsBurner", own: null };
          burner = { size: ownBurner, status: "ok", own: ownBurner, professional: ownIsPro };
          if (best.size !== idealPan) {
            notices.push({ code: "panAdjusted", type: "info", pan: best.size, ideal: idealPan, own: ownBurner });
          }
          maybeLargeNotice(best.size);
        } else {
          rejectBurner(checkBurner(idealPan, ownBurner, ownProfile, ownMargin), idealPan, { panOk: false, viaIdeal: false });
        }
      } else {
        // "beide" — controle B (pan <-> brander). Is de eigen pan niet geschikt,
        // dan toetsen we de brander aan de geadviseerde pan: daar gaat hij
        // immers op staan.
        var chkB = checkBurner(pan.size, ownBurner, ownProfile, ownMargin);
        if (chkB.fits) {
          burner = { size: ownBurner, status: "ok", own: ownBurner, professional: ownIsPro };
          var warned = unknownType && ownBurner > maxBurnerFor(pan.size, "professional");
          maybeLargeNotice(pan.size);
          if (!warned) {
            if (panOk) notices.push({ code: "comboOk", type: "ok" });
            else notices.push({ code: "burnerFitsIdeal", type: "info", own: ownBurner, pan: pan.size });
          }
        } else {
          rejectBurner(chkB, pan.size, { panOk: panOk, viaIdeal: !panOk });
        }
      }
    }

    var hasIndoorWarning = notices.some(function (n) { return n.code === "indoorUnsafe"; });
    if (binnen && !hasIndoorWarning) notices.push({ code: "indoorInfo", type: "info" });

    return {
      ok: true,
      riceGrams: riceGrams,
      liquidLiters: roundToStep(liquidExact, 0.1),
      liquidLitersExact: liquidExact,
      idealPan: idealPan,
      band: band,
      pan: pan,
      burner: burner,
      notices: notices,
    };
  }

  global.PaellaCalculator = {
    config: C,
    GASTEN_RANGE: C.GASTEN_RANGE,
    PAN_SIZES: C.PAN_SIZES,
    BURNER_SIZES: C.BURNER_SIZES,
    idealPanFor: idealPanFor,
    panBand: panBand,
    burnerRow: burnerRow,
    panBottom: panBottom,
    maxBurnerFor: maxBurnerFor,
    adviseBurner: adviseBurner,
    checkBurner: checkBurner,
    calculate: calculate,
  };
})(typeof window !== "undefined" ? window : globalThis);
