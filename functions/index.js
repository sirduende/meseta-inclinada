/**
 * Firebase Cloud Functions — Proxy seguro para Google Places API
 * Meseta Inclinada
 *
 * La API key se almacena como Firebase Secret (nunca en el código fuente).
 * El browser llama a estas funciones; las funciones llaman a Google con la key.
 *
 * Deploy:
 *   firebase functions:secrets:set GOOGLE_MAPS_API_KEY
 *   firebase deploy --only functions
 */

const { defineSecret } = require('firebase-functions/params');
const { onRequest }    = require('firebase-functions/v2/https');
const { logger }       = require('firebase-functions');

const googleMapsApiKey = defineSecret('GOOGLE_MAPS_API_KEY');

// Opciones compartidas: secret inyectado, CORS abierto, límite de instancias
const fnOptions = {
    secrets:      [googleMapsApiKey],
    cors:         true,
    invoker:      'public',
    maxInstances: 10,       // control de costes en plan Blaze
    region:       'europe-west1'  // más cercano a España que us-central1
};

// ── Places Autocomplete ───────────────────────────────────────────────────────
// Parámetros query: ?input=<texto>
// Devuelve: { predictions: [...], status: "OK" }
exports.placesautocomplete = onRequest(fnOptions, async (req, res) => {
    try {
        const apiKey = googleMapsApiKey.value();
        const input  = req.query.input;

        if (!input) {
            res.status(400).json({ error: 'input requerido' });
            return;
        }

        const url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json'
            + `?input=${encodeURIComponent(input)}`
            + `&types=establishment`     // restaurantes, bares, cafeterías…
            + `&language=es`
            + `&components=country:es`   // restringido a España
            + `&key=${apiKey}`;

        const response = await fetch(url);
        const data     = await response.json();
        res.json(data);
    } catch (error) {
        logger.error('placesautocomplete error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── Place Details ─────────────────────────────────────────────────────────────
// Parámetros query: ?placeId=<place_id>
// Devuelve: { result: { name, formatted_address, geometry: { location: { lat, lng } } }, status: "OK" }
exports.placedetails = onRequest(fnOptions, async (req, res) => {
    try {
        const apiKey  = googleMapsApiKey.value();
        const placeId = req.query.placeId;

        if (!placeId) {
            res.status(400).json({ error: 'placeId requerido' });
            return;
        }

        const url = 'https://maps.googleapis.com/maps/api/place/details/json'
            + `?place_id=${encodeURIComponent(placeId)}`
            + `&fields=name,formatted_address,geometry,address_components`
            + `&language=es`
            + `&key=${apiKey}`;

        const response = await fetch(url);
        const data     = await response.json();
        res.json(data);
    } catch (error) {
        logger.error('placedetails error:', error);
        res.status(500).json({ error: error.message });
    }
});
