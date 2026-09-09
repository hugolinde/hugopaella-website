/*
 * DOM-koppeling voor de Paella Receptencalculator. Werkt samen met
 * calculator.js (de taalonafhankelijke rekenlogica). Eén bestand voor beide
 * talen: geef bij init({lang: 'nl'|'es'}) de taal mee.
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
      prefFailed: function (requested, pan, brander) {
        return (
          "Voorkeur pangrootte lukt niet bij dit aantal gasten: ik gebruik " +
          pan +
          " cm met bijpassende brander van " +
          brander +
          " cm (in plaats van de gevraagde " +
          requested +
          " cm)."
        );
      },
      unitGram: " g",
      unitLiter: " L",
      unitCm: " cm",
      geenVoorkeurValue: "",
      windLockedTitle: "Bij binnen reken ik altijd zonder windcorrectie.",
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
      prefFailed: function (requested, pan, brander) {
        return (
          "La paellera preferida no encaja con este número de invitados: uso " +
          pan +
          " cm con el quemador correspondiente de " +
          brander +
          " cm (en lugar de los " +
          requested +
          " cm solicitados)."
        );
      },
      unitGram: " g",
      unitLiter: " L",
      unitCm: " cm",
      geenVoorkeurValue: "",
      windLockedTitle: "En interior siempre calculo sin corrección de viento.",
    },
  };

  function formatInt(value, locale) {
    return value.toLocaleString(locale, { maximumFractionDigits: 0 });
  }

  function formatDecimal1(value, locale) {
    return value.toLocaleString(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  }

  function init(config) {
    var lang = config.lang || "nl";
    var locale = lang === "es" ? "es-ES" : "nl-NL";
    var t = TEXT[lang];

    var els = {
      dish: document.getElementById("calc-dish"),
      portie: document.getElementById("calc-portie"),
      gasten: document.getElementById("calc-gasten"),
      gastenHint: document.getElementById("calc-gasten-hint"),
      locatie: document.getElementById("calc-locatie"),
      wind: document.getElementById("calc-wind"),
      voorkeurPan: document.getElementById("calc-pan"),
      error: document.getElementById("calc-error"),
      results: document.getElementById("calc-results"),
      outRijst: document.getElementById("calc-out-rijst"),
      outVocht: document.getElementById("calc-out-vocht"),
      outPan: document.getElementById("calc-out-pan"),
      outBrander: document.getElementById("calc-out-brander"),
      prefNotice: document.getElementById("calc-pref-notice"),
      placeholder: document.getElementById("calc-placeholder"),
    };

    if (!els.dish || !els.gasten) return; // markup niet aanwezig op deze pagina

    var windBeforeBinnen = els.wind.value;

    function updateGastenHint() {
      var range = global.PaellaCalculator.GASTEN_RANGE[els.portie.value];
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
        if (els.wind.value === "geen" && windBeforeBinnen) {
          els.wind.value = windBeforeBinnen;
        }
      }
    }

    function showOnly(section) {
      els.error.hidden = section !== "error";
      els.results.hidden = section !== "results";
      els.placeholder.hidden = section !== "placeholder";
      if (section !== "results") els.prefNotice.hidden = true;
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
        voorkeurPan: els.voorkeurPan.value ? Number(els.voorkeurPan.value) : null,
      };

      var result = global.PaellaCalculator.calculate(input, {
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

      els.outRijst.textContent = formatInt(result.riceGrams, locale) + t.unitGram;
      els.outVocht.textContent = formatDecimal1(result.liquidLiters, locale) + t.unitLiter;
      els.outPan.textContent = formatInt(result.pan, locale) + t.unitCm;
      els.outBrander.textContent = formatInt(result.brander, locale) + t.unitCm;

      showOnly("results");

      if (result.preferenceFailed) {
        els.prefNotice.hidden = false;
        els.prefNotice.textContent = t.prefFailed(
          els.voorkeurPan.value,
          result.pan,
          result.brander
        );
      } else {
        els.prefNotice.hidden = true;
      }
    }

    els.locatie.addEventListener("change", function () {
      syncWindLock();
      recalc();
    });
    els.portie.addEventListener("change", recalc);
    els.dish.addEventListener("change", recalc);
    els.wind.addEventListener("change", recalc);
    els.voorkeurPan.addEventListener("change", recalc);
    els.gasten.addEventListener("input", recalc);

    syncWindLock();
    recalc();
  }

  global.PaellaCalculatorUI = { init: init };
})(typeof window !== "undefined" ? window : globalThis);
