/*
 * DOM-koppeling voor de Paella Receptencalculator. Werkt samen met
 * calculator-config.js (tabellen) en calculator.js (rekenlogica). Eén bestand
 * voor beide talen: geef bij init({lang: 'nl'|'es'}) de taal mee.
 */

(function (global) {
  "use strict";

  var TEXT = {
    nl: {
      gastenHint: function (min, max) {
        return "(" + min + " t/m " + max + ")";
      },
      errors: {
        empty: "Vul het aantal gasten in.",
        kleinMin: function (min) {
          return "Bij een kleine portie reken ik met minimaal " + min + " gasten.";
        },
        grootMax: function (max) {
          return "Bij grote porties reken ik tot maximaal " + max + " gasten.";
        },
        range: function (min, max) {
          return "Kies een aantal tussen " + min + " en " + max + " gasten.";
        },
      },
      placeholder: "Vul het aantal gasten in om je paella te berekenen.",
      pdfError: "Het maken van de PDF is niet gelukt. Probeer het opnieuw.",
      pdfBusy: "Bezig...",
      windLockedTitle: "Bij binnen reken ik altijd zonder windcorrectie.",
      status: {
        pan: {
          recommended: "Aanbevolen",
          ok: "✓ Geschikt",
          fitsBurner: "✓ Past op je brander",
          tooSmall: function (own) { return "Jouw " + own + " cm is te klein"; },
          tooLarge: function (own) { return "Jouw " + own + " cm is te groot"; },
        },
        burner: {
          minimum: function (pro) { return pro ? "Minimaal · professioneel" : "Minimaal"; },
          ok: "✓ Geschikt",
          tooSmall: function (own) { return "Minimaal · jouw " + own + " cm is te klein"; },
          notIndoor: "Professioneel · binnen",
        },
      },
      notices: {
        panOk: function () { return "Je pan is geschikt voor deze hoeveelheid."; },
        comboOk: function () { return "Je bestaande pan en brander zijn geschikt."; },
        panOutOfBand: function (n, rice) {
          return (
            "Je pan van " + n.own + " cm is te " + (n.tooSmall ? "klein" : "groot") +
            " voor " + rice + " rijst. Geschikt is " + n.bandMin + " t/m " + n.bandMax +
            " cm; ideaal is " + n.ideal + " cm. Het advies hieronder gaat uit van " + n.ideal + " cm."
          );
        },
        burnerTooSmall: function (n) {
          var lead = n.viaIdeal
            ? "Je brander van " + n.own + " cm is te klein voor de geadviseerde pan van " + n.pan + " cm."
            : n.panOk
              ? "Je pan van " + n.pan + " cm is geschikt voor deze hoeveelheid. Je brander van " + n.own + " cm is echter te klein voor deze pan."
              : "Je brander van " + n.own + " cm is te klein voor een pan van " + n.pan + " cm.";
          return lead + (n.pro
            ? " Een standaard paellabrander is voor deze pan niet geschikt; we adviseren een professionele brander van minimaal " + n.need + " cm."
            : " Voor deze combinatie adviseren we minimaal een brander van " + n.need + " cm.");
        },
        burnerFitsIdeal: function (n) {
          return "Je brander van " + n.own + " cm past wel onder de geadviseerde pan van " + n.pan + " cm.";
        },
        panAdjusted: function (n) {
          return (
            "Op je brander van " + n.own + " cm past de ideale pan van " + n.ideal +
            " cm niet goed. Een pan van " + n.pan + " cm is ook geschikt voor deze hoeveelheid en past wel."
          );
        },
        burnerOversize: function (n) {
          return (
            "Je brander van " + n.own + " cm is ruim voor een pan van " + n.pan +
            " cm. Gebruik alleen de binnenste ring(en) of stook wat lager, zodat de vlammen niet langs de rand slaan."
          );
        },
        proNeeded: function (n) {
          return (
            "Een pan van " + n.pan + " cm is te groot voor een standaard paellabrander. We adviseren een professionele brander van minimaal " +
            n.burner + " cm."
          );
        },
        unknownType: function () {
          return "We gaan voor de zekerheid uit van een standaard paellabrander.";
        },
        indoorUnsafe: function (n) {
          return (
            "Let op: een standaard paellabrander is niet bedoeld voor binnengebruik. We geven daarom geen geschiktheidsadvies voor je brander. " +
            "Binnen adviseren we een professionele, voor binnen goedgekeurde brander van minimaal " + n.burner + " cm."
          );
        },
        indoorInfo: function () {
          return "Binnen rekenen we met een professionele brander. Gebruik alleen apparatuur die voor binnengebruik is toegestaan en zorg voor goede ventilatie.";
        },
      },
    },
    es: {
      gastenHint: function (min, max) {
        return "(de " + min + " a " + max + ")";
      },
      errors: {
        empty: "Indica el número de invitados.",
        kleinMin: function (min) {
          return "Para una ración pequeña calculo con un mínimo de " + min + " invitados.";
        },
        grootMax: function (max) {
          return "Para raciones grandes calculo hasta un máximo de " + max + " invitados.";
        },
        range: function (min, max) {
          return "Elige un número entre " + min + " y " + max + " invitados.";
        },
      },
      placeholder: "Indica el número de invitados para calcular tu paella.",
      pdfError: "No se ha podido crear el PDF. Inténtalo de nuevo.",
      pdfBusy: "Un momento...",
      windLockedTitle: "En interior siempre calculo sin corrección de viento.",
      status: {
        pan: {
          recommended: "Recomendada",
          ok: "✓ Adecuada",
          fitsBurner: "✓ Encaja con tu quemador",
          tooSmall: function (own) { return "Tus " + own + " cm se quedan cortos"; },
          tooLarge: function (own) { return "Tus " + own + " cm son demasiado"; },
        },
        burner: {
          minimum: function (pro) { return pro ? "Mínimo · profesional" : "Mínimo"; },
          ok: "✓ Adecuado",
          tooSmall: function (own) { return "Mínimo · tus " + own + " cm no bastan"; },
          notIndoor: "Profesional · interior",
        },
      },
      notices: {
        panOk: function () { return "Tu paellera es adecuada para esta cantidad."; },
        comboOk: function () { return "Tu paellera y tu quemador son adecuados."; },
        panOutOfBand: function (n, rice) {
          return (
            "Tu paellera de " + n.own + " cm es demasiado " + (n.tooSmall ? "pequeña" : "grande") +
            " para " + rice + " de arroz. Lo adecuado es de " + n.bandMin + " a " + n.bandMax +
            " cm; lo ideal, " + n.ideal + " cm. El consejo de abajo parte de " + n.ideal + " cm."
          );
        },
        burnerTooSmall: function (n) {
          var lead = n.viaIdeal
            ? "Tu quemador de " + n.own + " cm es demasiado pequeño para la paellera recomendada de " + n.pan + " cm."
            : n.panOk
              ? "Tu paellera de " + n.pan + " cm es adecuada para esta cantidad. Sin embargo, tu quemador de " + n.own + " cm es demasiado pequeño para ella."
              : "Tu quemador de " + n.own + " cm es demasiado pequeño para una paellera de " + n.pan + " cm.";
          return lead + (n.pro
            ? " Un quemador de paella estándar no sirve para esta paellera; recomendamos un quemador profesional de al menos " + n.need + " cm."
            : " Para esta combinación recomendamos un quemador de al menos " + n.need + " cm.");
        },
        burnerFitsIdeal: function (n) {
          return "Tu quemador de " + n.own + " cm sí sirve para la paellera recomendada de " + n.pan + " cm.";
        },
        panAdjusted: function (n) {
          return (
            "La paellera ideal de " + n.ideal + " cm no encaja bien con tu quemador de " + n.own +
            " cm. Una paellera de " + n.pan + " cm también sirve para esta cantidad y sí encaja."
          );
        },
        burnerOversize: function (n) {
          return (
            "Tu quemador de " + n.own + " cm es amplio para una paellera de " + n.pan +
            " cm. Usa solo el anillo o los anillos interiores, o baja el fuego, para que las llamas no suban por el borde."
          );
        },
        proNeeded: function (n) {
          return (
            "Una paellera de " + n.pan + " cm es demasiado grande para un quemador estándar. Recomendamos un quemador profesional de al menos " +
            n.burner + " cm."
          );
        },
        unknownType: function () {
          return "Por seguridad partimos de un quemador de paella estándar.";
        },
        indoorUnsafe: function (n) {
          return (
            "Atención: un quemador de paella estándar no está pensado para uso en interior, así que no damos un consejo de idoneidad para tu quemador. " +
            "En interior recomendamos un quemador profesional homologado para interior de al menos " + n.burner + " cm."
          );
        },
        indoorInfo: function () {
          return "En interior calculamos con un quemador profesional. Usa solo equipos autorizados para interior y asegura una buena ventilación.";
        },
      },
    },
  };

  var NOTICE_CLASS = { ok: "calc-notice-ok", info: "calc-notice-info", warn: "calc-notice-error" };

  function formatInt(value, locale) {
    return value.toLocaleString(locale, { maximumFractionDigits: 0 });
  }

  function formatDecimal1(value, locale) {
    return value.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }

  function fillSizeSelect(select, sizes) {
    select.innerHTML = "";
    sizes.forEach(function (size) {
      var opt = document.createElement("option");
      opt.value = String(size);
      opt.textContent = size + " cm";
      select.appendChild(opt);
    });
  }

  function init(config) {
    var lang = config.lang || "nl";
    var locale = lang === "es" ? "es-ES" : "nl-NL";
    var t = TEXT[lang];
    var Calc = global.PaellaCalculator;

    var $ = function (id) { return document.getElementById(id); };
    var els = {
      dish: $("calc-dish"),
      portie: $("calc-portie"),
      gasten: $("calc-gasten"),
      gastenHint: $("calc-gasten-hint"),
      locatie: $("calc-locatie"),
      wind: $("calc-wind"),
      existing: $("calc-existing"),
      existingBlock: $("calc-existing-block"),
      ownPan: $("calc-own-pan"),
      ownPanField: $("calc-own-pan-field"),
      ownBurner: $("calc-own-burner"),
      ownBurnerField: $("calc-own-burner-field"),
      burnerType: $("calc-burner-type"),
      burnerTypeField: $("calc-burner-type-field"),
      error: $("calc-error"),
      results: $("calc-results"),
      outRijst: $("calc-out-rijst"),
      outVocht: $("calc-out-vocht"),
      outPan: $("calc-out-pan"),
      outBrander: $("calc-out-brander"),
      statusPan: $("calc-status-pan"),
      statusBrander: $("calc-status-brander"),
      notices: $("calc-notices"),
      placeholder: $("calc-placeholder"),
      pdfActions: $("calc-pdf-actions"),
      pdfBtn: $("calc-pdf-btn"),
      pdfError: $("calc-pdf-error"),
    };

    if (!els.dish || !els.gasten) return; // markup niet aanwezig op deze pagina

    fillSizeSelect(els.ownPan, Calc.PAN_SIZES);
    fillSizeSelect(els.ownBurner, Calc.BURNER_SIZES);

    var windBeforeBinnen = els.wind.value;
    var lastCalc = null; // laatst geldige berekening, voor de PDF
    var lastIdeal = null; // om de eigen-materiaal-velden zinnig voor te vullen
    var touched = { pan: false, burner: false };

    function updateGastenHint() {
      var range = Calc.GASTEN_RANGE[els.portie.value];
      els.gastenHint.textContent = t.gastenHint(range[0], range[1]);
      els.gasten.min = range[0];
      els.gasten.max = range[1];
    }

    function syncWindLock() {
      if (els.locatie.value === "binnen") {
        windBeforeBinnen = els.wind.value !== "geen" ? els.wind.value : windBeforeBinnen;
        els.wind.value = "geen";
        els.wind.disabled = true;
        els.wind.title = t.windLockedTitle;
      } else {
        els.wind.disabled = false;
        els.wind.title = "";
        if (els.wind.value === "geen" && windBeforeBinnen) els.wind.value = windBeforeBinnen;
      }
    }

    // Toon alleen de vervolgvelden die bij de gekozen optie horen. Een veld dat
    // de bezoeker nog niet zelf heeft ingesteld, vullen we voor met de maat die
    // bij de huidige berekening hoort.
    function syncExistingFields() {
      var mode = els.existing.value;
      var showPan = mode === "pan" || mode === "beide";
      var showBurner = mode === "brander" || mode === "beide";
      els.existingBlock.hidden = !(showPan || showBurner);
      els.ownPanField.hidden = !showPan;
      els.ownBurnerField.hidden = !showBurner;
      els.burnerTypeField.hidden = !showBurner;
      els.existingBlock.classList.toggle("is-pan-only", showPan && !showBurner);
      els.existingBlock.classList.toggle("is-burner-only", showBurner && !showPan);

      var ideal = lastIdeal || 60;
      if (showPan && !touched.pan) els.ownPan.value = String(ideal);
      if (showBurner && !touched.burner) {
        var profile = els.locatie.value === "binnen" ? "professional" : "standard";
        var adv = Calc.adviseBurner(showPan ? Number(els.ownPan.value) : ideal, profile);
        if (Calc.BURNER_SIZES.indexOf(adv.size) !== -1) els.ownBurner.value = String(adv.size);
      }
    }

    function showOnly(section) {
      els.error.hidden = section !== "error";
      els.results.hidden = section !== "results";
      els.placeholder.hidden = section !== "placeholder";
      if (section !== "results") els.notices.innerHTML = "";
      if (els.pdfActions) {
        els.pdfActions.hidden = section !== "results";
        if (section !== "results") {
          lastCalc = null;
          els.pdfError.hidden = true;
        }
      }
    }

    function setStatus(el, card, text, tone) {
      el.textContent = text;
      card.classList.remove("is-ok", "is-bad");
      if (tone) card.classList.add(tone);
    }

    function panStatusText(p) {
      var s = t.status.pan[p.status];
      return typeof s === "function" ? s(p.own) : s;
    }

    function burnerStatusText(b) {
      var s = t.status.burner;
      if (b.status === "minimum") return s.minimum(b.professional);
      if (b.status === "tooSmall") return s.tooSmall(b.own);
      return s[b.status];
    }

    function toneFor(status) {
      if (status === "ok" || status === "fitsBurner") return "is-ok";
      if (status === "tooSmall" || status === "tooLarge" || status === "notIndoor") return "is-bad";
      return null;
    }

    function renderNotices(result) {
      els.notices.innerHTML = "";
      var riceLabel = formatInt(result.riceGrams, locale) + " g";
      result.notices.forEach(function (n) {
        var div = document.createElement("div");
        div.className = "calc-notice " + NOTICE_CLASS[n.type];
        div.textContent = t.notices[n.code](n, riceLabel);
        els.notices.appendChild(div);
      });
    }

    function recalc() {
      updateGastenHint();

      if (els.gasten.value === "") {
        showOnly("placeholder");
        els.placeholder.textContent = t.placeholder;
        return;
      }

      var input = {
        dish: els.dish.value,
        portie: els.portie.value,
        gasten: els.gasten.value,
        buitenBinnen: els.locatie.value,
        wind: els.wind.value,
        existing: els.existing.value,
        ownPan: Number(els.ownPan.value),
        ownBurner: Number(els.ownBurner.value),
        burnerType: els.burnerType.value,
      };

      var result = Calc.calculate(input, {
        empty: t.errors.empty,
        kleinMin: t.errors.kleinMin,
        grootMax: t.errors.grootMax,
        range: t.errors.range,
      });

      if (!result.ok) {
        showOnly("error");
        els.error.textContent = result.message;
        return;
      }

      // Eerste geldige berekening na het openen van de velden: voorvullen met
      // de maten die bij deze hoeveelheid horen en direct opnieuw rekenen.
      if (lastIdeal !== result.idealPan) {
        lastIdeal = result.idealPan;
        if (els.existing.value !== "nee" && (!touched.pan || !touched.burner)) {
          syncExistingFields();
          return recalc();
        }
      }

      els.outRijst.textContent = formatInt(result.riceGrams, locale) + " g";
      els.outVocht.textContent = formatDecimal1(result.liquidLiters, locale) + " L";
      els.outPan.textContent = formatInt(result.pan.size, locale) + " cm";
      els.outBrander.textContent = formatInt(result.burner.size, locale) + " cm";
      setStatus(els.statusPan, els.statusPan.parentNode, panStatusText(result.pan), toneFor(result.pan.status));
      setStatus(els.statusBrander, els.statusBrander.parentNode, burnerStatusText(result.burner), toneFor(result.burner.status));
      renderNotices(result);

      showOnly("results");

      lastCalc = {
        dish: input.dish,
        gasten: Number(input.gasten),
        riceGrams: result.riceGrams,
        pan: result.pan.size,
        brander: result.burner.size,
        liquidLiters: result.liquidLiters,
      };
      els.pdfError.hidden = true;
    }

    els.locatie.addEventListener("change", function () {
      syncWindLock();
      syncExistingFields();
      recalc();
    });
    els.existing.addEventListener("change", function () {
      syncExistingFields();
      recalc();
    });
    els.ownPan.addEventListener("change", function () {
      touched.pan = true;
      recalc();
    });
    els.ownBurner.addEventListener("change", function () {
      touched.burner = true;
      recalc();
    });
    [els.portie, els.dish, els.wind, els.burnerType].forEach(function (el) {
      el.addEventListener("change", recalc);
    });
    els.gasten.addEventListener("input", recalc);

    if (els.pdfBtn) {
      els.pdfBtn.addEventListener("click", function () {
        if (!lastCalc || !global.PaellaRecipePDF) return;
        els.pdfError.hidden = true;
        els.pdfBtn.disabled = true;
        var originalLabel = els.pdfBtn.textContent;
        els.pdfBtn.textContent = t.pdfBusy;
        global.PaellaRecipePDF.generate({
          dish: lastCalc.dish,
          lang: lang,
          gasten: lastCalc.gasten,
          riceGrams: lastCalc.riceGrams,
          pan: lastCalc.pan,
          brander: lastCalc.brander,
          liquidLiters: lastCalc.liquidLiters,
        })
          .catch(function (err) {
            els.pdfError.hidden = false;
            els.pdfError.textContent = t.pdfError;
            if (global.console && global.console.error) global.console.error(err);
          })
          .then(function () {
            els.pdfBtn.disabled = false;
            els.pdfBtn.textContent = originalLabel;
          });
      });
    }

    syncWindLock();
    syncExistingFields();
    recalc();
  }

  global.PaellaCalculatorUI = { init: init };
})(typeof window !== "undefined" ? window : globalThis);
