/*
 * DOM-koppeling voor de prijsindicator op de Tarieven-pagina. Werkt samen
 * met tarieven.js (de taalonafhankelijke rekenlogica). Eén bestand voor
 * beide talen: geef bij init({lang: 'nl'|'es'}) de taal mee.
 */

(function (global) {
  "use strict";

  var TEXT = {
    nl: {
      errors: {
        empty: "Vul het aantal gasten in.",
        range: function (min, max) {
          return "Kies een aantal tussen " + min + " en " + max + " gasten.";
        },
      },
      placeholder: "Vul het aantal gasten in voor een prijsindicatie.",
      inclLabel: "Totaal incl. 9% btw",
      exclLabel: "Totaal excl. btw",
      outsideRandstadNote: "Aanvullende voorrijkosten voor buiten de Randstad zijn op aanvraag en zitten niet in dit bedrag.",
    },
    es: {
      errors: {
        empty: "Indica el número de invitados.",
        range: function (min, max) {
          return "Elige un número entre " + min + " y " + max + " invitados.";
        },
      },
      placeholder: "Indica el número de invitados para ver una indicación de precio.",
      inclLabel: "Total incl. 9% IVA",
      exclLabel: "Total sin IVA",
      outsideRandstadNote: "Los gastos de desplazamiento adicionales fuera del Randstad son bajo consulta y no están incluidos en este importe.",
    },
  };

  function formatEuro(value, lang, locale) {
    var rounded = Math.round(value * 100) / 100;
    var hasCents = Math.abs(rounded - Math.round(rounded)) > 0.001;
    var formatted = rounded.toLocaleString(locale, {
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: 2,
    });
    return lang === "es" ? formatted + " €" : "€ " + formatted;
  }

  function init(config) {
    var lang = config.lang || "nl";
    var locale = lang === "es" ? "es-ES" : "nl-NL";
    var t = TEXT[lang];

    var els = {
      dish: document.getElementById("tar-dish"),
      gasten: document.getElementById("tar-gasten"),
      randstad: document.getElementById("tar-randstad"),
      error: document.getElementById("tar-error"),
      results: document.getElementById("tar-results"),
      outIncl: document.getElementById("tar-out-incl"),
      outExcl: document.getElementById("tar-out-excl"),
      inclLabel: document.getElementById("tar-incl-label"),
      exclLabel: document.getElementById("tar-excl-label"),
      travelNotice: document.getElementById("tar-travel-notice"),
      placeholder: document.getElementById("tar-placeholder"),
    };

    if (!els.dish || !els.gasten) return; // markup niet aanwezig op deze pagina

    if (els.inclLabel) els.inclLabel.textContent = t.inclLabel;
    if (els.exclLabel) els.exclLabel.textContent = t.exclLabel;

    function showOnly(section) {
      els.error.hidden = section !== "error";
      els.results.hidden = section !== "results";
      els.placeholder.hidden = section !== "placeholder";
      if (section !== "results" && els.travelNotice) els.travelNotice.hidden = true;
    }

    function recalc() {
      if (els.gasten.value === "") {
        showOnly("placeholder");
        els.placeholder.textContent = t.placeholder;
        return;
      }

      var input = {
        dish: els.dish.value,
        gasten: els.gasten.value,
        randstad: els.randstad.value,
      };

      var result = global.PaellaTarieven.calculate(input, {
        empty: t.errors.empty,
        range: t.errors.range,
      });

      if (!result.ok) {
        showOnly("error");
        els.error.textContent = result.message;
        return;
      }

      els.outIncl.textContent = formatEuro(result.totalIncl, lang, locale);
      els.outExcl.textContent = formatEuro(result.totalExcl, lang, locale);

      showOnly("results");

      if (els.travelNotice) {
        els.travelNotice.hidden = !result.outsideRandstad;
        els.travelNotice.textContent = result.outsideRandstad ? t.outsideRandstadNote : "";
      }
    }

    els.dish.addEventListener("change", recalc);
    els.randstad.addEventListener("change", recalc);
    els.gasten.addEventListener("input", recalc);

    recalc();
  }

  global.PaellaTarievenUI = { init: init };
})(typeof window !== "undefined" ? window : globalThis);
