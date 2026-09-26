/*
 * Taalonafhankelijke rekenlogica voor de prijsindicator op de Tarieven-pagina.
 * Werkt samen met tarieven-ui.js (DOM-koppeling + NL/ES-teksten) en
 * afstand.js (geocoding + rijafstand via PDOK/OpenRouteService).
 *
 * Prijzen per gast zijn inclusief 9% btw, zelfde bedragen als de prijstabel:
 * Paella Valenciana € 18, Paella de Marisco € 20, Paella de Verduras € 16,
 * Fideuà € 18.
 *
 * De voorrijkosten bestaan uit een vast basisbedrag plus een bedrag per
 * kilometer, gebaseerd op de automatisch berekende rijafstand (enkele reis)
 * tussen Hugo's vertrekpunt en het opgegeven adres:
 *   voorrijkosten = CALLOUT_FEE_BASE + (afstandKm * 2 * PRICE_PER_KM)
 * De "* 2" is omdat er heen én terug gereden wordt.
 */

(function (global) {
  "use strict";

  var PRICE_PER_GUEST = {
    valencia: 18,
    marisco: 20,
    verduras: 16,
    fideua: 18,
  };

  var CALLOUT_FEE_BASE = 75;
  var PRICE_PER_KM = 0.45;
  var VAT_RATE = 0.09;
  var MIN_GUESTS = 1;
  var MAX_GUESTS = 50;

  function calculate(input, messages) {
    var dish = input.dish;

    if (input.gasten === "" || input.gasten === null || typeof input.gasten === "undefined") {
      return { ok: false, reason: "emptyGuests", message: messages.empty };
    }

    var guests = Number(input.gasten);

    if (!isFinite(guests) || !Number.isInteger(guests) || guests < MIN_GUESTS || guests > MAX_GUESTS) {
      return { ok: false, reason: "guestsRange", message: messages.range(MIN_GUESTS, MAX_GUESTS) };
    }

    var perGuest = PRICE_PER_GUEST[dish];
    if (typeof perGuest === "undefined") {
      return { ok: false, reason: "guestsRange", message: messages.range(MIN_GUESTS, MAX_GUESTS) };
    }

    if (typeof input.afstandKm !== "number" || !isFinite(input.afstandKm) || input.afstandKm < 0) {
      // Gasten/gerecht zijn geldig, maar er is nog geen (geldige) rijafstand
      // bekend — de UI-laag bepaalt zelf of dit een placeholder, laad- of
      // foutstatus moet tonen.
      return { ok: false, reason: "needsAddress" };
    }

    var subtotal = perGuest * guests;
    var voorrijkosten = CALLOUT_FEE_BASE + (input.afstandKm * 2 * PRICE_PER_KM);
    var totalIncl = subtotal + voorrijkosten;
    var totalExcl = totalIncl / (1 + VAT_RATE);

    return {
      ok: true,
      totalIncl: totalIncl,
      totalExcl: totalExcl,
      voorrijkosten: voorrijkosten,
      afstandKm: input.afstandKm,
    };
  }

  global.PaellaTarieven = {
    calculate: calculate,
    MIN_GUESTS: MIN_GUESTS,
    MAX_GUESTS: MAX_GUESTS,
    PRICE_PER_GUEST: PRICE_PER_GUEST,
    CALLOUT_FEE_BASE: CALLOUT_FEE_BASE,
    PRICE_PER_KM: PRICE_PER_KM,
    VAT_RATE: VAT_RATE,
  };
})(typeof window !== "undefined" ? window : globalThis);
