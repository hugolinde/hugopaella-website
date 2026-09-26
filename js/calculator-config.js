/*
 * Hugo Paella — configuratie Paella Receptencalculator
 *
 * Alle tabellen en grenswaarden waarmee de calculator rekent staan in dit ene
 * bestand, zodat ze aangepast kunnen worden zonder de reken- of UI-logica aan
 * te raken. calculator.js leest deze waarden; calculator-ui.js bouwt er de
 * keuzelijsten (panmaten, brandermaten) mee op.
 *
 * Bron: "paella-calculator-specificatie FINAL.xlsx" (rijst -> pan) en
 * "Input voor aanpassing paellareceptencalculator v1" (branderprofielen,
 * tolerantie bestaand materiaal).
 */

(function (global) {
  "use strict";

  global.PaellaCalculatorConfig = {
    // Gram droge rijst per persoon.
    PORTIE_GRAM: { klein: 80, normaal: 100, groot: 120 },

    // [min, max] aantal gasten per portiegrootte.
    GASTEN_RANGE: { klein: [6, 50], normaal: [4, 50], groot: [4, 40] },

    // Vocht (liter) per 100 g rijst, per gerecht — vóór correctie.
    LIQUID_BASE_PER_100G: { valencia: 0.52, marisco: 0.3, verduras: 0.3, fideua: 0.3 },

    // Extra vocht bij wind (buiten) en correctie bij binnen koken.
    WIND_FACTOR: { geen: 0, weinig: 0.05, veel: 0.1 },
    BINNEN_FACTOR: 0.95,

    // Standaard verkrijgbare paellapannen (cm), oplopend. Deze lijst vult ook
    // de keuzelijst "Diameter van je paellapan".
    PAN_SIZES: [
      15, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 46, 50, 55, 60, 65, 70,
      75, 80, 85, 90, 100, 115, 130,
    ],

    // Tolerantie voor een bestaande pan: aantal posities in PAN_SIZES dat een
    // pan kleiner of groter mag zijn dan de ideale maat (1 = ideaal ± 1 maat).
    PAN_TOLERANCE_STEPS: 1,

    // Rijst (g, tot en met) -> ideale panmaat (cm). Tabblad "Rijst pan brander".
    RICE_TO_PAN: [
      { riceMax: 400, pan: 46 },
      { riceMax: 500, pan: 50 },
      { riceMax: 600, pan: 55 },
      { riceMax: 800, pan: 60 },
      { riceMax: 900, pan: 65 },
      { riceMax: 1100, pan: 70 },
      { riceMax: 1200, pan: 75 },
      { riceMax: 1400, pan: 80 },
      { riceMax: 1600, pan: 85 },
      { riceMax: 1900, pan: 90 },
      { riceMax: 2600, pan: 100 },
      { riceMax: 3300, pan: 115 },
      { riceMax: 5000, pan: 130 },
    ],

    // Ondersteunde diameters buitenste branderring (cm). Vult de keuzelijst
    // "Diameter buitenste branderring".
    BURNER_SIZES: [20, 30, 35, 40, 45, 50, 60, 70, 80, 90],

    // Pan (cm, tot en met) -> brander (cm), per branderprofiel.
    //   burner    = geadviseerde brandermaat
    //   minBurner = kleinste nog acceptabele maat bij een bestaande brander
    //               (alleen nodig waar de staffel een bereik noemt, bijv. 45–50)
    // Een pan groter dan de laatste panMax past niet op dat profiel: bij het
    // standaardprofiel wordt dan een professionele brander geadviseerd.
    BURNER_PROFILES: {
      standard: [
        { panMax: 36, burner: 20 },
        { panMax: 46, burner: 30 },
        { panMax: 55, burner: 40 },
        { panMax: 65, burner: 50, minBurner: 45 },
        { panMax: 80, burner: 60 },
        { panMax: 90, burner: 70 },
      ],
      professional: [
        { panMax: 40, burner: 20 },
        { panMax: 55, burner: 30 },
        { panMax: 65, burner: 40 },
        { panMax: 80, burner: 50 },
        { panMax: 90, burner: 60 },
        { panMax: 115, burner: 80, minBurner: 70 },
        { panMax: 130, burner: 90 },
      ],
    },

    // Welk profiel de calculator gebruikt bij een eigen advies (Bereiding).
    PROFILE_BY_LOCATION: { buiten: "standard", binnen: "professional" },

    // Een bestaande brander die meer dan zoveel cm groter is dan het advies
    // krijgt een tip om alleen de binnenste ring(en) te gebruiken.
    BURNER_OVERSIZE_CM: 10,
  };
})(typeof window !== "undefined" ? window : globalThis);
