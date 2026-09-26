/*
 * DOM-koppeling voor de prijsindicator op de Tarieven-pagina. Werkt samen
 * met tarieven.js (de taalonafhankelijke rekenlogica) en afstand.js
 * (geocoding + rijafstand). Eén bestand voor beide talen: geef bij
 * init({lang: 'nl'|'es'}) de taal mee.
 */

(function (global) {
  "use strict";

  var ADDRESS_DEBOUNCE_MS = 600;

  var TEXT = {
    nl: {
      errors: {
        empty: "Vul het aantal gasten in.",
        range: function (min, max) {
          return "Kies een aantal tussen " + min + " en " + max + " gasten.";
        },
        addressNotFound: "Deze postcode kon ik niet vinden. Controleer of hij klopt.",
        addressGeneric: "Er ging iets mis bij het berekenen van de rijafstand. Probeer het later opnieuw, of vraag direct een offerte aan.",
      },
      placeholder: "Vul het aantal gasten en je postcode in voor een prijsindicatie.",
      addressLoading: "Bezig met de rijafstand berekenen…",
      inclLabel: "Totaal incl. 9% btw",
      exclLabel: "Totaal excl. btw",
      distanceNote: function (km) {
        return "Op basis van ca. " + formatKm(km, "nl-NL") + " km rijafstand (enkele reis) vanaf Wassenaar.";
      },
    },
    es: {
      errors: {
        empty: "Indica el número de invitados.",
        range: function (min, max) {
          return "Elige un número entre " + min + " y " + max + " invitados.";
        },
        addressNotFound: "No he podido encontrar este código postal. Comprueba que sea correcto.",
        addressGeneric: "Ha habido un problema al calcular la distancia en coche. Inténtalo de nuevo más tarde o solicita directamente un presupuesto.",
      },
      placeholder: "Indica el número de invitados y tu código postal para ver una indicación de precio.",
      addressLoading: "Calculando la distancia en coche…",
      inclLabel: "Total incl. 9% IVA",
      exclLabel: "Total sin IVA",
      distanceNote: function (km) {
        return "Basado en aprox. " + formatKm(km, "es-ES") + " km de distancia en coche (solo ida) desde Wassenaar.";
      },
    },
  };

  function formatKm(km, locale) {
    return (Math.round(km * 10) / 10).toLocaleString(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  }

  function formatEuro(value, lang, locale) {
    var rounded = Math.round(value * 100) / 100;
    var hasCents = Math.abs(rounded - Math.round(rounded)) > 0.001;
    var formatted = rounded.toLocaleString(locale, {
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: 2,
    });
    return lang === "es" ? formatted + " €" : "€ " + formatted;
  }

  function looksLikePostcode(value) {
    return /^[1-9][0-9]{3}\s?[A-Za-z]{2}$/.test(String(value || "").trim());
  }

  function init(config) {
    var lang = config.lang || "nl";
    var locale = lang === "es" ? "es-ES" : "nl-NL";
    var t = TEXT[lang];

    var els = {
      dish: document.getElementById("tar-dish"),
      gasten: document.getElementById("tar-gasten"),
      postcode: document.getElementById("tar-postcode"),
      error: document.getElementById("tar-error"),
      info: document.getElementById("tar-info"),
      results: document.getElementById("tar-results"),
      outIncl: document.getElementById("tar-out-incl"),
      outExcl: document.getElementById("tar-out-excl"),
      inclLabel: document.getElementById("tar-incl-label"),
      exclLabel: document.getElementById("tar-excl-label"),
      travelNotice: document.getElementById("tar-travel-notice"),
      placeholder: document.getElementById("tar-placeholder"),
    };

    if (!els.dish || !els.gasten || !els.postcode) return; // markup niet aanwezig op deze pagina

    if (els.inclLabel) els.inclLabel.textContent = t.inclLabel;
    if (els.exclLabel) els.exclLabel.textContent = t.exclLabel;

    var addressState = "idle"; // "idle" | "loading" | "error" | "resolved"
    var addressKey = null;
    var addressErrorMessage = "";
    var distanceKm = null;
    var debounceTimer = null;

    function showOnly(section) {
      els.error.hidden = section !== "error";
      if (els.info) els.info.hidden = section !== "info";
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
        afstandKm: distanceKm,
      };

      var result = global.PaellaTarieven.calculate(input, {
        empty: t.errors.empty,
        range: t.errors.range,
      });

      if (!result.ok) {
        if (result.reason === "needsAddress") {
          if (addressState === "loading") {
            showOnly("info");
            if (els.info) els.info.textContent = t.addressLoading;
          } else if (addressState === "error") {
            showOnly("error");
            els.error.textContent = addressErrorMessage;
          } else {
            showOnly("placeholder");
            els.placeholder.textContent = t.placeholder;
          }
        } else {
          showOnly("error");
          els.error.textContent = result.message;
        }
        return;
      }

      els.outIncl.textContent = formatEuro(result.totalIncl, lang, locale);
      els.outExcl.textContent = formatEuro(result.totalExcl, lang, locale);

      showOnly("results");

      if (els.travelNotice) {
        els.travelNotice.hidden = false;
        els.travelNotice.textContent = t.distanceNote(result.afstandKm);
      }
    }

    function resolveAddress() {
      var pc = els.postcode.value;

      if (!looksLikePostcode(pc)) {
        addressState = "idle";
        addressKey = null;
        distanceKm = null;
        recalc();
        return;
      }

      var key = pc.trim().toUpperCase().replace(/\s+/g, "");
      if (key === addressKey && (addressState === "resolved" || addressState === "loading")) {
        recalc();
        return;
      }

      addressKey = key;
      addressState = "loading";
      distanceKm = null;
      recalc();

      if (!global.PaellaAfstand) return;

      global.PaellaAfstand.getDistanceForAddress(pc).then(function (result) {
        if (addressKey !== key) return; // gebruiker heeft ondertussen iets anders ingevuld
        addressState = "resolved";
        distanceKm = result.km;
        recalc();
      }).catch(function (err) {
        if (addressKey !== key) return;
        addressState = "error";
        distanceKm = null;
        addressErrorMessage = err && err.message === "not-found" ? t.errors.addressNotFound : t.errors.addressGeneric;
        recalc();
      });
    }

    function onAddressInput() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(resolveAddress, ADDRESS_DEBOUNCE_MS);
    }

    els.dish.addEventListener("change", recalc);
    els.gasten.addEventListener("input", recalc);
    els.postcode.addEventListener("input", onAddressInput);

    recalc();
  }

  global.PaellaTarievenUI = { init: init };
})(typeof window !== "undefined" ? window : globalThis);
