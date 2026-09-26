/*
 * Geocoding + rijafstand-berekening voor de voorrijkosten op de
 * Tarieven-pagina. Draait volledig client-side (deze site heeft geen
 * server/build-stap), met twee gratis, CORS-vriendelijke API's:
 *
 * - PDOK Locatieserver (Kadaster/BZK) zet een postcode + huisnummer om
 *   naar coördinaten. Gratis, geen sleutel nodig.
 * - OpenRouteService (gehost via HeiGIT) berekent de rijafstand over de
 *   weg vanaf Hugo's vaste vertrekpunt naar die coördinaten. Gebruikt een
 *   gratis API-sleutel (2000 aanvragen/dag, geen betaalmethode gekoppeld).
 *
 * Let op: de sleutel hieronder staat zichtbaar in de website-code (er is
 * geen server om 'm te verbergen). Bij misbruik is het risico beperkt tot
 * het opraken van het gratis dagquotum — dan vraagt Hugo een nieuwe sleutel
 * aan op openrouteservice.org.
 */

(function (global) {
  "use strict";

  // Vertrekpunt: Cornelis de Wittstraat 42, 2242LW Wassenaar.
  var ORIGIN = { lon: 4.39984657, lat: 52.14424188 };

  var ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjYxMDBkYjY0NjdiMDQ5OTM4ZjNjN2RhZDJmMzZjOTQ1IiwiaCI6Im11cm11cjY0In0=";
  var ORS_URL = "https://api.heigit.org/openrouteservice/v2/directions/driving-car";
  var PDOK_URL = "https://api.pdok.nl/bzk/locatieserver/search/v3_1/free";

  function parsePoint(wkt) {
    // "POINT(4.399846 52.144241)" -> {lon: 4.399846, lat: 52.144241}
    var match = /POINT\(([-\d.]+)\s+([-\d.]+)\)/.exec(wkt || "");
    if (!match) return null;
    return { lon: parseFloat(match[1]), lat: parseFloat(match[2]) };
  }

  // Zoekt het adres op en controleert dat de gevonden postcode én het
  // huisnummer exact overeenkomen met de invoer — de vrije-tekst-zoekopdracht
  // van PDOK geeft anders soms het dichtstbijzijnde adres terug in plaats
  // van een foutmelding, wat tot een misleidende prijsindicatie zou leiden.
  function geocode(postcode, huisnummer) {
    var pc = String(postcode || "").trim();
    var hn = String(huisnummer || "").trim();
    var q = encodeURIComponent(pc + " " + hn);
    var url = PDOK_URL + "?q=" + q + "&fq=type:adres&rows=1";

    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error("service-error");
        return res.json();
      })
      .then(function (data) {
        var doc = data.response && data.response.docs && data.response.docs[0];
        if (!doc) throw new Error("not-found");

        var wantedPostcode = pc.replace(/\s+/g, "").toUpperCase();
        var actualPostcode = String(doc.postcode || "").replace(/\s+/g, "").toUpperCase();
        if (wantedPostcode && actualPostcode && wantedPostcode !== actualPostcode) {
          throw new Error("not-found");
        }

        var wantedNumber = parseInt(hn, 10);
        if (isFinite(wantedNumber) && doc.huisnummer !== wantedNumber) {
          throw new Error("not-found");
        }

        var point = parsePoint(doc.centroide_ll);
        if (!point) throw new Error("not-found");

        return { lon: point.lon, lat: point.lat, label: doc.weergavenaam };
      });
  }

  function getDistanceKm(dest) {
    var url = ORS_URL +
      "?api_key=" + encodeURIComponent(ORS_API_KEY) +
      "&start=" + ORIGIN.lon + "," + ORIGIN.lat +
      "&end=" + dest.lon + "," + dest.lat;

    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error("service-error");
        return res.json();
      })
      .then(function (data) {
        var feature = data.features && data.features[0];
        var meters = feature && feature.properties && feature.properties.summary &&
          feature.properties.summary.distance;
        if (typeof meters !== "number") throw new Error("service-error");
        return meters / 1000;
      });
  }

  // Belooft { km: <rijafstand enkele reis, in km>, label: <gevonden adres> }.
  // Verwerpt met een Error waarvan .message "not-found" is (adres/huisnummer
  // klopt niet) of "service-error" (netwerk- of API-probleem).
  function getDistanceForAddress(postcode, huisnummer) {
    return geocode(postcode, huisnummer).then(function (dest) {
      return getDistanceKm(dest).then(function (km) {
        return { km: km, label: dest.label };
      });
    });
  }

  global.PaellaAfstand = {
    getDistanceForAddress: getDistanceForAddress,
    ORIGIN: ORIGIN,
  };
})(typeof window !== "undefined" ? window : globalThis);
