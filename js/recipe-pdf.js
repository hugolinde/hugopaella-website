/*
 * Hugo Paella — "Maak PDF van dit recept" / "Crear PDF de esta receta".
 *
 * Genereert client-side (met jsPDF, geladen via CDN in de pagina) een PDF
 * van het gekozen recept, met de ingrediëntenlijst geschaald naar de
 * huidige calculator-invoer. Layout is gemodelleerd naar
 * "Calculator Recept Valenciaanse Paella NL.docx" (de enige van de 4
 * templates die al een volledig ingevulde ingrediëntentabel had).
 *
 * Afhankelijkheden (moeten vóór dit bestand geladen zijn):
 *  - jsPDF (window.jspdf.jsPDF)
 *  - recipe-data.js (window.PaellaRecipeData)
 */

(function (global) {
  "use strict";

  var PAGE_W = 210;
  var PAGE_H = 297;
  var MARGIN = 18;
  var CONTENT_W = PAGE_W - MARGIN * 2;
  var BOTTOM_LIMIT = PAGE_H - 16;

  var COLOR_BG = [255, 245, 230];
  var COLOR_TEXT = [36, 33, 31];
  var COLOR_TEXT_SOFT = [93, 87, 82];
  var COLOR_ACCENT = [241, 90, 36];
  var COLOR_ACCENT_DARK = [194, 67, 26];

  var LOGO_URL = "/assets/img/pdf-logo.png";
  var LOGO_NATURAL_W = 1007;
  var LOGO_NATURAL_H = 374;
  var LOGO_DISPLAY_W = 62;
  var LOGO_DISPLAY_H = (LOGO_DISPLAY_W * LOGO_NATURAL_H) / LOGO_NATURAL_W;

  // ---- Helpers: getallen, afronding, eenheden --------------------------

  function roundToStep(value, step) {
    if (!step || !isFinite(step)) step = 1;
    return Math.round(value / step) * step;
  }

  function decimalsOf(step) {
    var s = String(step);
    var i = s.indexOf(".");
    return i === -1 ? 0 : s.length - i - 1;
  }

  function formatNumber(value, decimals, locale) {
    return value.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  function unitLabel(unitNl, quantity, lang) {
    if (lang !== "es") return unitNl;
    var map = global.PaellaRecipeData.UNIT_ES;
    var entry = map[unitNl];
    if (!entry) return unitNl;
    return quantity === 1 ? entry.one : entry.many;
  }

  // Bouwt de geschaalde, afgeronde ingrediëntenlijst voor één recept.
  // scaleFactor = riceGrams / 100 (zelfde grootheid als de rijst/fideuà-
  // regel zelf, zie "Aantallen gerelateerd aan 100 gram rijst/fideuà" in de
  // Excel-specificatie).
  //
  // Het vocht-ingrediënt (Water / Visbouillon / Groentebouillon, gemarkeerd
  // met isLiquid) schaalt NIET met dezelfde simpele scaleFactor: de
  // calculator past daar nog een correctie op toe voor windsterkte/binnen
  // (zie computeLiquidLiters in calculator.js). Om te voorkomen dat die
  // regel iets anders toont dan het "Bouillon"-veld in het rekenresultaat,
  // gebruiken we voor die ene regel altijd het al berekende en afgeronde
  // result.liquidLiters uit de calculator, in plaats van dish.amount * scale.
  function buildIngredientRows(dish, scaleFactor, lang, liquidLiters) {
    var locale = global.PaellaRecipeData.TEXT[lang].numberLocale;
    return dish.ingredients.map(function (ing) {
      if (ing.isLiquid && typeof liquidLiters === "number") {
        return {
          name: ing.name[lang],
          amountText: formatNumber(liquidLiters, 1, locale),
          unitText: unitLabel(ing.unit, liquidLiters, lang),
          note: ing.note[lang],
        };
      }
      var step = typeof ing.round === "number" ? ing.round : 1;
      var exact = ing.amount * scaleFactor;
      var rounded = roundToStep(exact, step);
      // Nooit 0 tonen (kan alleen bij extreme randgevallen voorkomen).
      if (rounded <= 0) rounded = step;
      var decimals = decimalsOf(step);
      var amountText = formatNumber(rounded, decimals, locale);
      return {
        name: ing.name[lang],
        amountText: amountText,
        unitText: unitLabel(ing.unit, rounded, lang),
        note: ing.note[lang],
      };
    });
  }

  function formatDate(lang) {
    var locale = global.PaellaRecipeData.TEXT[lang].dateLocale;
    return new Date().toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function loadLogoImage() {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        resolve(img);
      };
      img.onerror = function () {
        reject(new Error("Kon PDF-logo niet laden: " + LOGO_URL));
      };
      img.src = LOGO_URL;
    });
  }

  // ---- Tekenlogica --------------------------------------------------

  function drawPageBackground(doc) {
    doc.setFillColor(COLOR_BG[0], COLOR_BG[1], COLOR_BG[2]);
    doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  }

  function drawLogo(doc, logoImg, y) {
    var x = (PAGE_W - LOGO_DISPLAY_W) / 2;
    doc.addImage(logoImg, "PNG", x, y, LOGO_DISPLAY_W, LOGO_DISPLAY_H);
    return y + LOGO_DISPLAY_H;
  }

  function newPage(doc, logoImg) {
    doc.addPage();
    drawPageBackground(doc);
    return drawLogo(doc, logoImg, 12) + 10;
  }

  function ensureSpace(doc, logoImg, y, needed) {
    if (y + needed > BOTTOM_LIMIT) {
      return newPage(doc, logoImg);
    }
    return y;
  }

  function drawByline(doc, T, dateStr, y) {
    var mid1 = "HUGO";
    var mid2 = " PAELLA ";
    var suffix = "· " + dateStr;

    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    var wPrefix = doc.getTextWidth(T.bylinePrefix);
    doc.setFont("helvetica", "bolditalic");
    var wMid1 = doc.getTextWidth(mid1);
    var wMid2 = doc.getTextWidth(mid2);
    doc.setFont("helvetica", "italic");
    var wSuffix = doc.getTextWidth(suffix);

    var total = wPrefix + wMid1 + wMid2 + wSuffix;
    var x = (PAGE_W - total) / 2;

    doc.setTextColor(COLOR_TEXT_SOFT[0], COLOR_TEXT_SOFT[1], COLOR_TEXT_SOFT[2]);
    doc.setFont("helvetica", "italic");
    doc.text(T.bylinePrefix, x, y);
    x += wPrefix;

    doc.setFont("helvetica", "bolditalic");
    doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
    doc.text(mid1, x, y);
    x += wMid1;

    doc.setTextColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
    doc.text(mid2, x, y);
    x += wMid2;

    doc.setFont("helvetica", "italic");
    doc.setTextColor(COLOR_TEXT_SOFT[0], COLOR_TEXT_SOFT[1], COLOR_TEXT_SOFT[2]);
    doc.text(suffix, x, y);
  }

  function drawSectionHeading(doc, text, y) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12.5);
    doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
    doc.text(text, MARGIN, y);
    var w = doc.getTextWidth(text);
    doc.setDrawColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
    doc.setLineWidth(0.25);
    doc.line(MARGIN, y + 1.2, MARGIN + w, y + 1.2);
    return y + 7;
  }

  // Kolombreedtes van de ingrediëntentabel (som = CONTENT_W). COL_UNIT is
  // breed genoeg voor het langste eenheidswoord ("unidades"/"ramitas" in
  // het Spaans), anders loopt het over in de Bijzonderheden-kolom.
  var COL_NAME = 40;
  var COL_AMOUNT = 14;
  var COL_UNIT = 20;
  var COL_NOTE = CONTENT_W - COL_NAME - COL_AMOUNT - COL_UNIT;
  var ROW_LINE_H = 4.6;
  var ROW_PAD = 2.2;

  function drawTableHeader(doc, T, y) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
    doc.text(T.tableIngredient, MARGIN, y);
    doc.text(T.tableAantal, MARGIN + COL_NAME, y);
    doc.text(T.tableBijzonderheden, MARGIN + COL_NAME + COL_AMOUNT + COL_UNIT, y);
    var lineY = y + 1.6;
    doc.setDrawColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
    doc.setLineWidth(0.35);
    doc.line(MARGIN, lineY, MARGIN + CONTENT_W, lineY);
    return y + 6;
  }

  function drawIngredientRows(doc, logoImg, T, rows, y) {
    y = drawTableHeader(doc, T, y);
    doc.setFontSize(9.5);

    rows.forEach(function (row) {
      var nameLines = doc.splitTextToSize(row.name, COL_NAME - 2);
      var noteLines = doc.splitTextToSize(row.note, COL_NOTE - 2);
      var lineCount = Math.max(nameLines.length, noteLines.length, 1);
      var rowH = lineCount * ROW_LINE_H + ROW_PAD;

      if (y + rowH > BOTTOM_LIMIT) {
        y = newPage(doc, logoImg);
        y = drawTableHeader(doc, T, y);
        doc.setFontSize(9.5);
      }

      var textY = y;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
      doc.text(nameLines, MARGIN, textY);

      doc.text(row.amountText, MARGIN + COL_NAME + COL_AMOUNT - 2, textY, { align: "right" });
      doc.text(row.unitText, MARGIN + COL_NAME + COL_AMOUNT + 1.5, textY);

      doc.setTextColor(COLOR_TEXT_SOFT[0], COLOR_TEXT_SOFT[1], COLOR_TEXT_SOFT[2]);
      doc.text(noteLines, MARGIN + COL_NAME + COL_AMOUNT + COL_UNIT, textY);

      y += rowH;
    });

    return y + 3;
  }

  function drawSteps(doc, logoImg, steps, y) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    var textIndent = MARGIN + 5.5;
    var textWidth = CONTENT_W - 5.5;

    steps.forEach(function (step) {
      var lines = doc.splitTextToSize(step, textWidth);
      var stepH = lines.length * 4.7 + 2;

      if (y + stepH > BOTTOM_LIMIT) {
        y = newPage(doc, logoImg);
      }

      doc.setFillColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
      doc.circle(MARGIN + 1, y - 1.3, 0.8, "F");

      doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
      doc.text(lines, textIndent, y);

      y += stepH;
    });

    return y;
  }

  function drawClosing(doc, text, y) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
    doc.text(text, PAGE_W / 2, y, { align: "center" });
    return y + 8;
  }

  // ---- Publieke functie -------------------------------------------------

  /**
   * @param {Object} opts
   * @param {'valencia'|'marisco'|'verduras'|'fideua'} opts.dish
   * @param {'nl'|'es'} opts.lang
   * @param {number} opts.gasten
   * @param {number} opts.riceGrams     resultaat.riceGrams uit PaellaCalculator.calculate()
   * @param {number} opts.pan           resultaat.pan (cm)
   * @param {number} opts.brander       resultaat.brander (cm)
   * @param {number} opts.liquidLiters  resultaat.liquidLiters (al gecorrigeerd voor wind/binnen)
   * @returns {Promise<void>}
   */
  function generate(opts) {
    var jspdfNs = global.jspdf;
    if (!jspdfNs || !jspdfNs.jsPDF) {
      return Promise.reject(new Error("jsPDF is niet geladen."));
    }
    var data = global.PaellaRecipeData;
    if (!data) {
      return Promise.reject(new Error("PaellaRecipeData is niet geladen."));
    }

    var lang = opts.lang === "es" ? "es" : "nl";
    var T = data.TEXT[lang];
    var dish = data.DISHES[opts.dish];
    if (!dish) {
      return Promise.reject(new Error("Onbekend gerecht: " + opts.dish));
    }

    var scaleFactor = opts.riceGrams / 100;
    var rows = buildIngredientRows(dish, scaleFactor, lang, opts.liquidLiters);
    var dateStr = formatDate(lang);

    return loadLogoImage().then(function (logoImg) {
      var JsPDFCtor = jspdfNs.jsPDF;
      var doc = new JsPDFCtor({ unit: "mm", format: "a4" });

      drawPageBackground(doc);
      var y = drawLogo(doc, logoImg, 12) + 9;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(19);
      doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
      doc.text(dish.title[lang], PAGE_W / 2, y, { align: "center" });
      y += 7.5;

      doc.setFont("helvetica", "italic");
      doc.setFontSize(11.5);
      doc.text(T.subtitle(opts.gasten, opts.pan, opts.brander), PAGE_W / 2, y, { align: "center" });
      y += 6.5;

      drawByline(doc, T, dateStr, y);
      y += 11;

      y = drawSectionHeading(doc, T.ingredientenHeading, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.7);
      doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
      var introLines = doc.splitTextToSize(T.ingredientenIntro, CONTENT_W);
      doc.text(introLines, MARGIN, y);
      y += introLines.length * 4.3 + 6;

      y = ensureSpace(doc, logoImg, y, 20);
      y = drawIngredientRows(doc, logoImg, T, rows, y);

      y = ensureSpace(doc, logoImg, y, 14);
      y = drawSectionHeading(doc, T.bereidingHeading, y + 2);
      y = drawSteps(doc, logoImg, dish.steps[lang], y);

      y = ensureSpace(doc, logoImg, y, 16);
      drawClosing(doc, T.closing, y + 6);

      var filename =
        (lang === "es" ? "receta-" : "recept-") +
        dish.slug +
        "-hugopaella-" +
        opts.gasten +
        (lang === "es" ? "p" : "p") +
        ".pdf";
      doc.save(filename);
    });
  }

  global.PaellaRecipePDF = { generate: generate };
})(typeof window !== "undefined" ? window : globalThis);
