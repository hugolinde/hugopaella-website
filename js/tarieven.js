/*
 * Taalonafhankelijke rekenlogica voor de prijsindicator op de Tarieven-pagina.
 * Werkt samen met tarieven-ui.js (DOM-koppeling + NL/ES-teksten).
 *
 * Prijzen per gast zijn inclusief 9% btw, zelfde bedragen als de prijstabel:
 * Paella Valenciana € 18, Paella de Marisco € 20, Paella de Verduras € 16,
 * Fideuà € 18. Voorrijkosten binnen de Randstad: € 100 (inclusief btw),
 * ook conform de bestaande prijsinformatie. Buiten de Randstad zijn de
 * voorrijkosten op aanvraag en worden niet meegerekend.
 */

(function (global) {
  "use strict";

  var PRICE_PER_GUEST = {
    valencia: 18,
    marisco: 20,
    verduras: 16,
    fideua: 18,
  };

  var CALLOUT_FEE_RANDSTAD = 100;
  var VAT_RATE = 0.09;
  var MIN_GUESTS = 1;
  var MAX_GUESTS = 50;

  function calculate(input, messages) {
    var dish = input.dish;
    var randstad = input.randstad === "ja";

    if (input.gasten === "" || input.gasten === null || typeof input.gasten === "undefined") {
      return { ok: false, message: messages.empty };
    }

    var guests = Number(input.gasten);

    if (!isFinite(guests) || !Number.isInteger(guests)) {
      return { ok: false, message: messages.range(MIN_GUESTS, MAX_GUESTS) };
    }

    if (guests < MIN_GUESTS || guests > MAX_GUESTS) {
      return { ok: false, message: messages.range(MIN_GUESTS, MAX_GUESTS) };
    }

    var perGuest = PRICE_PER_GUEST[dish];
    if (typeof perGuest === "undefined") {
      return { ok: false, message: messages.range(MIN_GUESTS, MAX_GUESTS) };
    }

    var subtotal = perGuest * guests;
    var callout = randstad ? CALLOUT_FEE_RANDSTAD : 0;
    var totalIncl = subtotal + callout;
    var totalExcl = totalIncl / (1 + VAT_RATE);

    return {
      ok: true,
      totalIncl: totalIncl,
      totalExcl: totalExcl,
      travelIncluded: randstad,
      calloutFee: callout,
    };
  }

  global.PaellaTarieven = {
    calculate: calculate,
    MIN_GUESTS: MIN_GUESTS,
    MAX_GUESTS: MAX_GUESTS,
    PRICE_PER_GUEST: PRICE_PER_GUEST,
    CALLOUT_FEE_RANDSTAD: CALLOUT_FEE_RANDSTAD,
    VAT_RATE: VAT_RATE,
  };
})(typeof window !== "undefined" ? window : globalThis);
