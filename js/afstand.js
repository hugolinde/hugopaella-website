/*
 * Geocoding + rijafstand-berekening voor de voorrijkosten op de
 * Tarieven-pagina. Draait volledig client-side (deze site heeft geen
 * server/build-stap), met twee gratis, CORS-vriendelijke API's:
 *
 * - PDOK Locatieserver (Kadaster/BZK) zet een postcode om naar de
 *   coördinaten van het midden van dat postcodegebied. Gratis, geen
 *   sleutel nodig. Er wordt bewust alleen om de postcode gevraagd (geen
 *   huisnummer) — voor een prijsindicatie is dat nauwkeurig genoeg, en
 *   het is voor de bezoeker anoniemer.
 * - Spaanse postcodes (alleen op de Spaanse pagina) gaan via Nominatim
 *   (OpenStreetMap), want PDOK kent alleen Nederland. Gratis, geen sleutel,
 *   CORS-vriendelijk; fair-use-regel: max. 1 aanvraag per seconde (ruim
 *   voldoende dankzij de debounce in tarieven-ui.js).
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

  // Vertrekpunten per land.
  // NL: Cornelis de Wittstraat 42, 2242LW Wassenaar.
  // ES: Carrer Joan Fuster (i Ortells) 14, 43007 Tarragona — huisnummer
  //     staat niet in OpenStreetMap, dus het midden van de straat.
  var ORIGINS = {
    nl: { lon: 4.39984657, lat: 52.14424188 },
    es: { lon: 1.272252, lat: 41.120477 },
  };
  var ORIGIN = ORIGINS.nl;

  var ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjYxMDBkYjY0NjdiMDQ5OTM4ZjNjN2RhZDJmMzZjOTQ1IiwiaCI6Im11cm11cjY0In0=";
  var ORS_URL = "https://api.heigit.org/openrouteservice/v2/directions/driving-car";
  var PDOK_URL = "https://api.pdok.nl/bzk/locatieserver/search/v3_1/free";
  var NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

  function parsePoint(wkt) {
    // "POINT(4.399846 52.144241)" -> {lon: 4.399846, lat: 52.144241}
    var match = /POINT\(([-\d.]+)\s+([-\d.]+)\)/.exec(wkt || "");
    if (!match) return null;
    return { lon: parseFloat(match[1]), lat: parseFloat(match[2]) };
  }

  // Zoekt het midden van het postcodegebied op en controleert dat de
  // gevonden postcode exact overeenkomt met de invoer — de vrije-tekst-
  // zoekopdracht van PDOK geeft anders soms de dichtstbijzijnde postcode
  // terug in plaats van een foutmelding, wat tot een misleidende
  // prijsindicatie zou leiden.
  function geocode(postcode) {
    var pc = String(postcode || "").trim();
    var q = encodeURIComponent(pc);
    var url = PDOK_URL + "?q=" + q + "&fq=type:postcode&rows=1";

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

        var point = parsePoint(doc.centroide_ll);
        if (!point) throw new Error("not-found");

        return { lon: point.lon, lat: point.lat, label: doc.weergavenaam };
      });
  }

  // Spaanse postcode (5 cijfers) -> midden van het postcodegebied via
  // Nominatim. Alleen een exact overeenkomend postcoderesultaat telt.
  function geocodeEs(postcode) {
    var pc = String(postcode || "").replace(/\s+/g, "");
    var url = NOMINATIM_URL + "?format=jsonv2&countrycodes=es&limit=1&postalcode=" + encodeURIComponent(pc);

    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error("service-error");
        return res.json();
      })
      .then(function (data) {
        var doc = data && data[0];
        if (!doc || doc.addresstype !== "postcode" || String(doc.name).replace(/\s+/g, "") !== pc) {
          throw new Error("not-found");
        }
        var lat = parseFloat(doc.lat);
        var lon = parseFloat(doc.lon);
        if (!isFinite(lat) || !isFinite(lon)) throw new Error("not-found");
        return { lon: lon, lat: lat, label: doc.display_name };
      });
  }

  function getDistanceKm(dest, origin) {
    origin = origin || ORIGIN;
    var url = ORS_URL +
      "?api_key=" + encodeURIComponent(ORS_API_KEY) +
      "&start=" + origin.lon + "," + origin.lat +
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

  // Belooft { km: <rijafstand enkele reis, in km>, label: <gevonden postcodegebied> }.
  // Verwerpt met een Error waarvan .message "not-found" is (postcode klopt
  // niet) of "service-error" (netwerk- of API-probleem).
  // country: "nl" (standaard) of "es".
  function getDistanceForAddress(postcode, country) {
    var c = country === "es" ? "es" : "nl";
    var lookup = c === "es" ? geocodeEs : geocode;
    return lookup(postcode).then(function (dest) {
      return getDistanceKm(dest, ORIGINS[c]).then(function (km) {
        return { km: km, label: dest.label };
      });
    });
  }

  global.PaellaAfstand = {
    getDistanceForAddress: getDistanceForAddress,
    ORIGIN: ORIGIN,
    ORIGINS: ORIGINS,
  };
})(typeof window !== "undefined" ? window : globalThis);
