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

    // Diameters buitenste branderring (cm) in de keuzelijst "Diameter
    // buitenste branderring". 45 wordt getoond als "45/46 cm" (Garcima 45,
    // Flames 46). Een maat die niet in een profiel hieronder staat, wordt
    // behandeld als de eerstvolgende kleinere maat van dat profiel.
    BURNER_SIZES: [20, 25, 30, 35, 38, 40, 45, 50, 55, 60, 65, 70, 80, 90, 120],
    BURNER_SIZE_LABELS: { 45: "45/46" },

    // Branderprofielen: per brandermaat de grootste pan (panMax, cm) die de
    // volle brander nog goed verwarmt, volgens de fabrikanten. Een grotere
    // pan -> brander te klein.
    //   advice   brandermaten die de calculator zelf mag adviseren
    //            ("gangbare maten"); advies = kleinste daarvan met panMax >= pan
    // Bron: inventarisatie Garcima / Flames / Vaello (26-09-2026).
    BURNER_PROFILES: {
      // Standaard paellabrander (buiten). Basis: Garcima x00-serie.
      // Pannen groter dan de grootste panMax (90 cm) -> professionele brander.
      standard: {
        advice: [20, 30, 40, 45, 50, 60, 70],
        burners: [
          { burner: 20, panMax: 36 }, // Garcima 200, Vaello
          { burner: 25, panMax: 38 }, // Garcima 250
          { burner: 30, panMax: 46 }, // Garcima 300
          { burner: 35, panMax: 50 }, // Garcima 350
          { burner: 38, panMax: 60 }, // Flames T-380
          { burner: 40, panMax: 55 }, // Garcima 400
          { burner: 45, panMax: 65 }, // Garcima 450-3
          { burner: 50, panMax: 70 }, // Garcima 500
          { burner: 55, panMax: 75 }, // Garcima 550
          { burner: 60, panMax: 80 }, // Garcima 600
          { burner: 65, panMax: 85 }, // Garcima 650
          { burner: 70, panMax: 90 }, // Garcima 700
        ],
      },
      // Professionele / binnen-geschikte brander. Voorzichtig gemiddelde van
      // Garcima P en L-PROF, Flames TT/GT en Vaello (binnen).
      professional: {
        advice: [20, 30, 40, 50, 60, 70, 80, 90],
        burners: [
          { burner: 20, panMax: 40 }, // Garcima L-20 PROF
          { burner: 25, panMax: 50 }, // Flames GT-250
          { burner: 30, panMax: 55 }, // Garcima L-30 PROF (30-P: 36-46)
          { burner: 38, panMax: 60 }, // Flames TT-380
          { burner: 40, panMax: 65 }, // Garcima 40-P / L-40 PROF
          { burner: 45, panMax: 80 }, // Flames TT-460
          { burner: 50, panMax: 80 }, // Garcima L-50 PROF, Flames TT-500
          { burner: 60, panMax: 90 }, // Flames TT-600, Garcima L-60 PROF
          { burner: 70, panMax: 100 }, // Garcima L-70 PROF (Flames TT-700: 90-115)
          { burner: 80, panMax: 115 }, // Garcima 80-P, Vaello 7080
          { burner: 90, panMax: 130 }, // Flames TT-900, Vaello 7090
          { burner: 120, panMax: 200 }, // Flames O-1200
        ],
      },
    },

    // "Te groot": de brander moet onder de BODEM van de pan passen, met een
    // marge rondom, anders verhit de vlam vooral de schuine rand. De opgegeven
    // pandiameter is die van de bovenrand.
    //   maximale brander = bodemdiameter - marge
    // Marge per brandertype; bij "Weet ik niet" geldt de professionele
    // (strengste) marge.
    BURNER_MARGIN_CM: { standard: 5, professional: 10 },

    // Pandiameter (bovenrand, cm) -> geschatte bodemdiameter (cm). Inschatting
    // Hugo, 26-09-2026. Niet in de lijst: pandiameter x PAN_BOTTOM_RATIO.
    PAN_BOTTOM: {
      40: 36, 42: 37, 46: 42, 50: 45, 55: 48, 60: 53, 65: 60, 70: 64,
      75: 69, 80: 73, 85: 77, 90: 81, 100: 91, 115: 104, 130: 114, 150: 137,
    },
    PAN_BOTTOM_RATIO: 0.9,

    // Welk profiel de calculator gebruikt bij een eigen advies (Bereiding).
    PROFILE_BY_LOCATION: { buiten: "standard", binnen: "professional" },
  };
})(typeof window !== "undefined" ? window : globalThis);
