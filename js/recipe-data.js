/*
 * Hugo Paella — Receptdata voor de "Maak PDF van dit recept"-knop van de
 * Paella Receptencalculator.
 *
 * Ingrediënten (naam, hoeveelheid per 100 g rijst/fideuà, eenheid, afronding)
 * komen 1-op-1 uit "paella-calculator-specificatie FINAL.xlsx", tabbladen
 * Ingr_Valenciaans / Ingr_Marisco / Ingr_Verduras / Ingr_Fideua. De eenheid
 * per ingrediënt is bewust vast (niet dynamisch enkelvoud/meervoud) zoals in
 * die tabbladen zelf, voor NL. Voor ES wordt de eenheid wél vertaald en waar
 * relevant verbogen (enkelvoud/meervoud) — zie UNIT_ES in recipe-pdf.js.
 *
 * Bijzondere afspraak "Knoflook" in Ingr_Valenciaans: de afrondingskolom
 * bevat daar geen getal maar de tekst "veranderd bij meer of minder rijst
 * en/of gasten" (Hugo's eigen aantekening dat knoflook niet zomaar lineair
 * meeschaalt). Er stond geen concrete regel bij, dus recipe-pdf.js behandelt
 * dit ingrediënt voorlopig als: gewoon lineair meeschalen met de rest, maar
 * afronden op hele tenen (round: 1), met een minimum van 1 teen. Check dit
 * bij Hugo zodra hij een preciezere regel heeft.
 *
 * Bereidingsteksten NL komen uit de Word-documenten in "Calculator recepten"
 * (korte versie). De Spaanse vertalingen zijn een eigen, kwalitatieve
 * vertaling (niet machinaal), in dezelfde directe, informele toon als de
 * rest van de Spaanse site.
 */

(function (global) {
  "use strict";

  var TEXT = {
    en: {
      ingredientenHeading: "Ingredients",
      ingredientenIntro:
        "Shopping list based on a normal portion size. Use fresh ingredients wherever possible. Feel free to replace ingredients with locally available alternatives.",
      tableIngredient: "Ingredient",
      tableAantal: "Quantity",
      tableBijzonderheden: "Notes",
      bereidingHeading: "Method (short version)",
      closing: "¡Buen provecho!",
      byline: function (dateStr) {
        return "Paella Recipe Calculator by HUGO PAELLA · " + dateStr;
      },
      bylinePrefix: "Paella Recipe Calculator by ",
      subtitle: function (gasten, pan, brander) {
        return (
          gasten +
          " people · paella pan Ø " +
          pan +
          " cm · gas burner Ø " +
          brander +
          " cm"
        );
      },
      buttonLabel: "Create a PDF of this recipe",
      dateLocale: "en-GB",
      numberLocale: "en-GB",
    },
    nl: {
      ingredientenHeading: "Ingrediënten",
      ingredientenIntro:
        "Boodschappenlijst op basis van een normale portiegrootte. Gebruik zoveel mogelijk verse ingrediënten. Voel je vrij ingrediënten te vervangen met lokaal beschikbare alternatieven.",
      tableIngredient: "Ingrediënt",
      tableAantal: "Aantal",
      tableBijzonderheden: "Bijzonderheden",
      bereidingHeading: "Bereiding (korte versie)",
      closing: "¡Buen provecho!",
      byline: function (dateStr) {
        return "Paella Receptencalculator van HUGO PAELLA · " + dateStr;
      },
      bylinePrefix: "Paella Receptencalculator van ",
      subtitle: function (gasten, pan, brander) {
        return (
          gasten +
          " personen · paellapan Ø " +
          pan +
          " cm · gasbrander Ø " +
          brander +
          " cm"
        );
      },
      buttonLabel: "Maak PDF van dit recept",
      dateLocale: "nl-NL",
      numberLocale: "nl-NL",
    },
    es: {
      ingredientenHeading: "Ingredientes",
      ingredientenIntro:
        "Lista de la compra basada en una ración normal. Utiliza ingredientes frescos siempre que sea posible. No dudes en sustituir ingredientes por alternativas disponibles localmente.",
      tableIngredient: "Ingrediente",
      tableAantal: "Cantidad",
      tableBijzonderheden: "Observaciones",
      bereidingHeading: "Elaboración (versión breve)",
      closing: "¡Buen provecho!",
      byline: function (dateStr) {
        return "Calculadora de Recetas de Paella de HUGO PAELLA · " + dateStr;
      },
      bylinePrefix: "Calculadora de Recetas de Paella de ",
      subtitle: function (gasten, pan, brander) {
        return (
          gasten +
          " personas · paellera Ø " +
          pan +
          " cm · quemador Ø " +
          brander +
          " cm"
        );
      },
      buttonLabel: "Crear PDF de esta receta",
      dateLocale: "es-ES",
      numberLocale: "es-ES",
    },
  };

  // Vaste NL-eenheid (uit de Excel) -> ES-vertaling, met enkelvoud/meervoud.
  var UNIT_ES = {
    g: { one: "g", many: "g" },
    l: { one: "l", many: "l" },
    ml: { one: "ml", many: "ml" },
    mg: { one: "mg", many: "mg" },
    stuk: { one: "unidad", many: "unidades" },
    stuks: { one: "unidad", many: "unidades" },
    teen: { one: "diente", many: "dientes" },
    takje: { one: "ramita", many: "ramitas" },
    takjes: { one: "ramita", many: "ramitas" },
  };

  // Vaste NL-eenheid (uit de Excel) -> EN-vertaling, met enkelvoud/meervoud.
  var UNIT_EN = {
    g: { one: "g", many: "g" },
    l: { one: "l", many: "l" },
    ml: { one: "ml", many: "ml" },
    mg: { one: "mg", many: "mg" },
    stuk: { one: "piece", many: "pieces" },
    stuks: { one: "piece", many: "pieces" },
    teen: { one: "clove", many: "cloves" },
    takje: { one: "sprig", many: "sprigs" },
    takjes: { one: "sprig", many: "sprigs" },
  };

  var DISHES = {
    valencia: {
      slug: "valenciana",
      title: { nl: "Valenciaanse Paella", es: "Paella Valenciana", en: "Paella Valenciana" },
      ingredients: [
        { name: { nl: "Bomba rijst", es: "Arroz bomba", en: "Bomba rice" }, amount: 100, unit: "g", round: 5,
          note: { nl: "D.O.P. Arroz de Valencia (zoals Bomba, Senia of Albufera)", es: "D.O.P. Arroz de Valencia (como Bomba, Senia o Albufera)", en: "D.O.P. Arroz de Valencia (such as Bomba, Senia or Albufera)" } },
        { name: { nl: "Water", es: "Agua", en: "Water" }, amount: 0.52, unit: "l", round: 0.1, isLiquid: true,
          note: { nl: "Kraanwater", es: "Agua del grifo", en: "Tap water" } },
        { name: { nl: "Kip", es: "Pollo", en: "Chicken" }, amount: 125, unit: "g", round: 10,
          note: { nl: "Vers van de poelier, in stukken, met bot", es: "Fresco, cortado en trozos con hueso", en: "Fresh from the poulterer, in pieces, on the bone" } },
        { name: { nl: "Konijn", es: "Conejo", en: "Rabbit" }, amount: 100, unit: "g", round: 10,
          note: { nl: "Vers van de slager, in stukken, met bot", es: "Fresco, cortado en trozos con hueso", en: "Fresh from the butcher, in pieces, on the bone" } },
        { name: { nl: "Slakken", es: "Caracoles", en: "Snails" }, amount: 3, unit: "stuks", round: 1,
          note: { nl: "Optioneel, bij voorkeur Valenciaanse vaquetes.", es: "Opcional; preferiblemente vaquetes valencianas", en: "Optional, preferably Valencian vaquetes." } },
        { name: { nl: "Snijbonen", es: "Judía verde", en: "Flat green beans" }, amount: 75, unit: "g", round: 5,
          note: { nl: "Brede, platte snijbonen, zoals de Valenciaanse ferraura", es: "Judía verde ancha y plana, como la ferraura valenciana", en: "Wide, flat green beans, such as the Valencian ferraura" } },
        { name: { nl: "Garrofó", es: "Garrofó", en: "Garrofó" }, amount: 30, unit: "g", round: 5,
          note: { nl: "Gedroogd. Verkrijgbaar bij Spaanse speciaalzaken", es: "Seco. Disponible en tiendas españolas especializadas", en: "Dried. Available from Spanish specialist shops" } },
        { name: { nl: "Artisjokharten", es: "Corazones de alcachofa", en: "Artichoke hearts" }, amount: 50, unit: "g", round: 5,
          note: { nl: "Traditioneel, vooral wanneer artisjokken in het seizoen zijn", es: "Tradicional, especialmente cuando la alcachofa está de temporada", en: "Traditional, especially when artichokes are in season" } },
        { name: { nl: "Tomaten", es: "Tomates", en: "Tomatoes" }, amount: 70, unit: "g", round: 5,
          note: { nl: "Rijpe, smaakvolle tomaten, bij voorkeur peertomaten", es: "Maduros y sabrosos, preferiblemente tomates de pera", en: "Ripe, flavourful tomatoes, preferably plum tomatoes" } },
        { name: { nl: "Knoflook", es: "Ajo", en: "Garlic" }, amount: 1, unit: "teen", round: 1, roundNote: "special",
          note: { nl: "Om de temperatuur van de olijfolie te testen.", es: "Para comprobar la temperatura del aceite de oliva", en: "To test the temperature of the olive oil." } },
        { name: { nl: "Paprikapoeder", es: "Pimentón", en: "Paprika" }, amount: 1.5, unit: "g", round: 0.5,
          note: { nl: "Spaanse zoete paprika (pimentón dulce), niet gerookt.", es: "Pimentón dulce español, no ahumado", en: "Spanish sweet paprika (pimentón dulce), not smoked." } },
        { name: { nl: "Saffraan", es: "Azafrán", en: "Saffron" }, amount: 25, unit: "mg", round: 5,
          note: { nl: "Azafrán de La Mancha D.O.P.", es: "Azafrán de La Mancha D.O.P.", en: "Azafrán de La Mancha D.O.P." } },
        { name: { nl: "Rozemarijn", es: "Romero", en: "Rosemary" }, amount: 1, unit: "g", round: 1,
          note: { nl: "Vers, om kort te laten meetrekken.", es: "Fresco, para infusionar brevemente", en: "Fresh, to infuse briefly." } },
        { name: { nl: "Zout", es: "Sal", en: "Salt" }, amount: 5, unit: "g", round: 1,
          note: { nl: "Fijn zeezout (Middellandse Zee)", es: "Sal marina fina (mar Mediterráneo)", en: "Fine sea salt (Mediterranean)" } },
        { name: { nl: "Olijfolie", es: "Aceite de oliva", en: "Olive oil" }, amount: 25, unit: "ml", round: 5,
          note: { nl: "Extra vierge olijfolie (AOVE), bij voorkeur Valenciaans", es: "Aceite de oliva virgen extra (AOVE), preferiblemente valenciano", en: "Extra virgin olive oil (AOVE), preferably Valencian" } },
      ],
      steps: {
        nl: [
          "Leg de gedroogde garrofó (of gedroogde witte bonen) een dag van tevoren in een ruime pan met water en laat een nacht weken.",
          "Snijdt de kip en het konijn (met bot) in stukken. Maak de groenten schoon. Snijdt de snijbonen in stukken van ca. 3 cm. Gebruik je verse artisjokken, verwijder dan de harde buitenste bladeren, maak ze schoon tot aan het hart en snijd dit in vieren. Bewaar de stukken tot gebruik in water met een beetje citroen om verkleuring tegen te gaan. Halveer de tomaten en rasp het vruchtvlees op een grove rasp.",
          "Zorg dat de brander en paellapan waterpas staan.",
          "Zet de wijn alvast klaar voor de gasten en een biertje voor de kok.",
          "Zet de paellapan op de brander en giet de olijfolie in het midden van de pan. Verwarm de olie.",
          "Bak de stukken kip en konijn op middel- tot hoog vuur in ca. 20 – 25 min zodat ze aan alle kanten mooi goudbruin worden.",
          "Bak de snijbonen en artisjok ongeveer 5 minuten mee, totdat ze wat kleur beginnen te krijgen. Voeg daarna de garrofó toe.",
          "Bak dan de tomaat rustig in de olijfolie (tot een geconcentreerde sofrito ontstaat).",
          "Roer kort de zoete paprikapoeder door de tomaat en olie en voeg vrijwel direct daarna het water toe (bewaar het resterend water, indien aan het eind nodig kan je altijd nog wat toevoegen).",
          "Zet het vuur hoger. Voeg het zout en de saffraan toe. En laat ca. 25 tot 30 min rustig doorkoken. Gebruik je slakken, voeg deze dan toe.",
          "Voeg de rijst gelijkmatig over de pan toe. Kook eerste 7 à 8 minuten op hoog vuur, daarna nog ongeveer 8 tot 10 minuten op middelhoog vuur. Leg tijdens het garen de takjes rozemarijn kort op de paella, zo'n 5 minuten.",
          "Zet het vuur aan het einde kort iets hoger voor een goede socarrat.",
          "Zet het vuur uit en laat de paella nu 5 à 10 min met rust.",
          "Zet de paellapan midden op tafel. Traditioneel wordt paella gezamenlijk gegeten, rechtstreeks uit de pan, waarbij iedereen vanuit zijn eigen deel van de pan eet. Maar op een bord scheppen mag natuurlijk ook. Uiteindelijk is het belangrijkste onderdeel van paella dat je hem samen eet.",
        ],
        es: [
          "Pon el garrofó seco (o alubias blancas secas) en remojo el día anterior, en un recipiente amplio con agua, y déjalo toda la noche.",
          "Corta el pollo y el conejo (con hueso) en trozos. Limpia las verduras. Corta la judía verde en trozos de unos 3 cm. Si usas alcachofas frescas, retira las hojas exteriores duras, límpialas hasta el corazón y córtalo en cuartos; consérvalas en agua con un poco de limón para que no se oscurezcan. Corta los tomates por la mitad y rállalos con un rallador grueso.",
          "Asegúrate de que el quemador y la paellera estén bien nivelados.",
          "Prepara el vino para los invitados y una cerveza para el cocinero.",
          "Pon la paellera sobre el quemador y vierte el aceite de oliva en el centro. Calienta el aceite.",
          "Dora los trozos de pollo y conejo a fuego medio-alto durante unos 20-25 minutos, hasta que queden bien dorados por todos los lados.",
          "Añade la judía verde y la alcachofa y sofríe unos 5 minutos, hasta que empiecen a coger color. Incorpora entonces el garrofó.",
          "Sofríe el tomate con calma en el aceite hasta obtener un sofrito concentrado.",
          "Añade el pimentón dulce, remueve brevemente con el tomate y el aceite, y añade casi de inmediato el agua (reserva el agua restante; si hace falta, siempre puedes añadir más al final).",
          "Sube el fuego. Añade la sal y el azafrán, y deja cocer con calma unos 25-30 minutos. Si usas caracoles, añádelos ahora.",
          "Añade el arroz repartiéndolo de forma uniforme por la paellera. Cuece los primeros 7-8 minutos a fuego alto y luego otros 8-10 minutos a fuego medio. Durante la cocción, coloca las ramitas de romero sobre la paella unos 5 minutos.",
          "Al final, sube un poco el fuego para conseguir un buen socarrat.",
          "Apaga el fuego y deja reposar la paella entre 5 y 10 minutos.",
          "Pon la paellera en el centro de la mesa. Tradicionalmente la paella se come en compañía, directamente de la paellera, cada uno desde su propia parte. Pero servir en plato individual también está muy bien. Al fin y al cabo, lo más importante de la paella es comerla en compañía.",
        ],
        en: [
          "Put the dried garrofó (or dried white beans) in a large pan of water the day before and leave to soak overnight.",
          "Cut the chicken and rabbit (on the bone) into pieces. Clean the vegetables. Cut the green beans into pieces of about 3 cm. If you're using fresh artichokes, remove the tough outer leaves, trim them down to the heart and cut it into quarters. Keep the pieces in water with a little lemon until use to prevent discolouration. Halve the tomatoes and grate the flesh on a coarse grater.",
          "Make sure the burner and paella pan are level.",
          "Get the wine ready for the guests and a beer for the cook.",
          "Put the paella pan on the burner and pour the olive oil into the centre of the pan. Heat the oil.",
          "Fry the pieces of chicken and rabbit over medium to high heat for about 20–25 minutes, until they are nicely golden brown on all sides.",
          "Fry the green beans and artichoke along with them for about 5 minutes, until they start to take on some colour. Then add the garrofó.",
          "Then gently fry the tomato in the olive oil (until a concentrated sofrito forms).",
          "Briefly stir the sweet paprika through the tomato and oil and add the water almost immediately afterwards (keep the remaining water; if needed at the end, you can always add a little more).",
          "Turn up the heat. Add the salt and saffron. Let it simmer gently for about 25 to 30 minutes. If you're using snails, add them now.",
          "Spread the rice evenly over the pan. Cook for the first 7–8 minutes on high heat, then for about another 8 to 10 minutes on medium-high heat. While it cooks, place the sprigs of rosemary briefly on the paella, for about 5 minutes.",
          "At the end, turn the heat up a little for a moment to get a good socarrat.",
          "Turn off the heat and now leave the paella to rest for 5–10 minutes.",
          "Place the paella pan in the middle of the table. Traditionally, paella is eaten together, straight from the pan, with everyone eating from their own section of the pan. But serving it on plates is fine too, of course. In the end, the most important part of paella is that you eat it together.",
        ],
      },
    },

    marisco: {
      slug: "marisco",
      title: { nl: "Paella de Marisco (Zeevruchten Paella)", es: "Paella de Marisco", en: "Paella de Marisco (Seafood Paella)" },
      ingredients: [
        { name: { nl: "Bomba rijst", es: "Arroz bomba", en: "Bomba rice" }, amount: 100, unit: "g", round: 5,
          note: { nl: "D.O.P. Arroz de Valencia (zoals Bomba, Senia of Albufera)", es: "D.O.P. Arroz de Valencia (como Bomba, Senia o Albufera)", en: "D.O.P. Arroz de Valencia (such as Bomba, Senia or Albufera)" } },
        { name: { nl: "Visbouillon", es: "Caldo de pescado", en: "Fish stock" }, amount: 0.3, unit: "l", round: 0.1, isLiquid: true,
          note: { nl: "Zelfgetrokken, of een goede kant-en-klare variant", es: "Casero, o uno bueno ya preparado", en: "Homemade, or a good ready-made one" } },
        { name: { nl: "Langoustines", es: "Cigalas", en: "Langoustines" }, amount: 1, unit: "stuk", round: 1,
          note: { nl: "Vers, heel gelaten in de schaal", es: "Frescas, enteras y sin pelar", en: "Fresh, left whole in their shells" } },
        { name: { nl: "Gamba's", es: "Gambas", en: "Prawns" }, amount: 2, unit: "stuk", round: 1,
          note: { nl: "Vers, heel gelaten in de schaal", es: "Frescas, enteras y sin pelar", en: "Fresh, left whole in their shells" } },
        { name: { nl: "Inktvis", es: "Sepia o calamar", en: "Cuttlefish or squid" }, amount: 75, unit: "g", round: 5,
          note: { nl: "Vers, schoongemaakt en in ringen of stukken gesneden", es: "Fresco, limpio y cortado en aros o trozos", en: "Fresh, cleaned and cut into rings or pieces" } },
        { name: { nl: "Mosselen", es: "Mejillones", en: "Mussels" }, amount: 100, unit: "g", round: 10,
          note: { nl: "Vers, goed gespoeld; verwijder kapotte exemplaren", es: "Frescos, bien enjuagados; retira los que estén rotos", en: "Fresh, well rinsed; discard any broken ones" } },
        { name: { nl: "Venusschelpen", es: "Almejas", en: "Clams" }, amount: 60, unit: "g", round: 5,
          note: { nl: "Vers, goed gespoeld; verwijder kapotte exemplaren", es: "Frescas, bien enjuagadas; retira las que estén rotas", en: "Fresh, well rinsed; discard any broken ones" } },
        { name: { nl: "Snijbonen", es: "Judía verde", en: "Flat green beans" }, amount: 75, unit: "g", round: 5,
          note: { nl: "Brede, platte snijbonen, zoals de Valenciaanse ferraura", es: "Judía verde ancha y plana, como la ferraura valenciana", en: "Wide, flat green beans, such as the Valencian ferraura" } },
        { name: { nl: "Tomaten", es: "Tomates", en: "Tomatoes" }, amount: 70, unit: "g", round: 5,
          note: { nl: "Rijpe, smaakvolle tomaten, bij voorkeur peertomaten", es: "Maduros y sabrosos, preferiblemente tomates de pera", en: "Ripe, flavourful tomatoes, preferably plum tomatoes" } },
        { name: { nl: "Citroen", es: "Limón", en: "Lemon" }, amount: 0.25, unit: "stuk", round: 0.25,
          note: { nl: "Voor het garneren bij het serveren", es: "Para decorar al servir", en: "To garnish when serving" } },
        { name: { nl: "Knoflook", es: "Ajo", en: "Garlic" }, amount: 1, unit: "g", round: 1,
          note: { nl: "Fijngehakt, voor de sofrito", es: "Picado fino, para el sofrito", en: "Finely chopped, for the sofrito" } },
        { name: { nl: "Paprikapoeder", es: "Pimentón", en: "Paprika" }, amount: 1.5, unit: "g", round: 0.5,
          note: { nl: "Spaanse zoete paprika (pimentón dulce), niet gerookt.", es: "Pimentón dulce español, no ahumado", en: "Spanish sweet paprika (pimentón dulce), not smoked." } },
        { name: { nl: "Saffraan", es: "Azafrán", en: "Saffron" }, amount: 25, unit: "mg", round: 5,
          note: { nl: "Azafrán de La Mancha D.O.P.", es: "Azafrán de La Mancha D.O.P.", en: "Azafrán de La Mancha D.O.P." } },
        { name: { nl: "Zout", es: "Sal", en: "Salt" }, amount: 5, unit: "g", round: 1,
          note: { nl: "Fijn zeezout (Middellandse Zee)", es: "Sal marina fina (mar Mediterráneo)", en: "Fine sea salt (Mediterranean)" } },
        { name: { nl: "Olijfolie", es: "Aceite de oliva", en: "Olive oil" }, amount: 25, unit: "ml", round: 5,
          note: { nl: "Extra vierge olijfolie (AOVE), bij voorkeur Valenciaans", es: "Aceite de oliva virgen extra (AOVE), preferiblemente valenciano", en: "Extra virgin olive oil (AOVE), preferably Valencian" } },
      ],
      steps: {
        nl: [
          "Maak eerst alle vis en zeevruchten schoon. Spoel de mosselen en venusschelpen goed onder koud stromend water. Verwijder kapotte schelpen. Snijd de schoongemaakte inktvis in ringen of kleine stukken. Laat de langoustine en gamba's heel en in de schaal.",
          "Maak de snijbonen schoon en snijd ze in stukken van ca. 3 cm. Halveer de tomaten en rasp het vruchtvlees op een grove rasp. Hak de knoflook fijn.",
          "Verwarm de visbouillon in een aparte pan en houd deze warm.",
          "Zorg dat de brander en paellapan waterpas staan.",
          "Zet de wijn alvast klaar voor de gasten en een biertje voor de kok.",
          "Zet de paellapan op de brander en giet de olijfolie in midden van de pan. Verwarm de olie.",
          "Bak de langoustine en gamba's kort op middel- tot hoog vuur, totdat ze wat kleur krijgen. Haal ze daarna uit de pan en leg ze apart. Ze garen later verder op de paella.",
          "Bak de inktvis vervolgens ongeveer 2 tot 3 minuten in de olijfolie. Voeg de snijbonen toe en bak deze enkele minuten mee, totdat ze wat kleur beginnen te krijgen.",
          "Voeg de knoflook toe en bak deze kort mee zonder hem bruin te laten worden. Voeg daarna de geraspte tomaat toe en bak deze rustig in de olijfolie totdat het vocht grotendeels is verdampt en een geconcentreerde sofrito ontstaat.",
          "Roer kort de zoete paprikapoeder door de tomaat en olie en voeg vrijwel direct daarna de warme visbouillon toe. Voeg de saffraan met het weekvocht en het zout toe.",
          "Zet het vuur hoger en breng de bouillon goed aan de kook. Proef de bouillon en corrigeer indien nodig met een beetje zout.",
          "Voeg de rijst gelijkmatig over de pan toe en verdeel deze één keer goed. Roer de rijst daarna niet meer. Kook de eerste 7 à 8 minuten op hoog vuur en daarna nog ongeveer 8 tot 10 minuten op middelhoog tot laag vuur.",
          "Verdeel na ongeveer 8 tot 10 minuten de mosselen en venusschelpen over de paella. Leg de langoustine en gamba's terug op de paella. Laat alles verder garen totdat de rijst gaar is, de bouillon vrijwel volledig is opgenomen en de schelpen zijn geopend. Verwijder schelpen die tijdens het garen gesloten blijven.",
          "Zet het vuur aan het einde kort iets hoger voor een goede socarrat.",
          "Zet het vuur uit en laat de paella nu 5 à 10 minuten met rust.",
          "Garneer met de citroen en zet de paellapan midden op tafel. Traditioneel wordt paella gezamenlijk gegeten, rechtstreeks uit de pan, waarbij iedereen vanuit zijn eigen deel van de pan eet. Maar op een bord scheppen mag natuurlijk ook. Uiteindelijk is het belangrijkste onderdeel van paella dat je hem samen eet.",
        ],
        es: [
          "Limpia primero todo el pescado y el marisco. Enjuaga bien los mejillones y las almejas bajo agua fría corriente y retira los que estén rotos. Corta la sepia o el calamar limpio en aros o trozos pequeños. Deja las cigalas y las gambas enteras y sin pelar.",
          "Limpia la judía verde y córtala en trozos de unos 3 cm. Corta los tomates por la mitad y rállalos con un rallador grueso. Pica el ajo fino.",
          "Calienta el caldo de pescado en una olla aparte y mantenlo caliente.",
          "Asegúrate de que el quemador y la paellera estén bien nivelados.",
          "Prepara el vino para los invitados y una cerveza para el cocinero.",
          "Pon la paellera sobre el quemador y vierte el aceite de oliva en el centro. Calienta el aceite.",
          "Dora brevemente las cigalas y las gambas a fuego medio-alto, hasta que cojan algo de color. Retíralas de la paellera y resérvalas; terminarán de hacerse más tarde sobre la paella.",
          "Saltea la sepia o el calamar unos 2-3 minutos en el aceite. Añade la judía verde y sofríela unos minutos más, hasta que empiece a coger color.",
          "Añade el ajo y sofríelo brevemente sin que llegue a dorarse. Incorpora después el tomate rallado y sofríelo con calma hasta que el líquido se haya evaporado en gran parte y quede un sofrito concentrado.",
          "Añade el pimentón dulce, remueve brevemente con el tomate y el aceite, y añade casi de inmediato el caldo de pescado caliente. Incorpora el azafrán (con su agua de remojo) y la sal.",
          "Sube el fuego y deja que el caldo rompa bien a hervir. Prueba el caldo y corrige de sal si hace falta.",
          "Añade el arroz repartiéndolo de forma uniforme por la paellera y remuévelo una sola vez. No lo vuelvas a remover después. Cuece los primeros 7-8 minutos a fuego alto y luego otros 8-10 minutos a fuego medio-bajo.",
          "Pasados unos 8-10 minutos, reparte los mejillones y las almejas por la paella. Vuelve a colocar las cigalas y las gambas sobre el arroz. Deja que todo termine de cocerse hasta que el arroz esté en su punto, el caldo se haya absorbido casi por completo y las conchas se hayan abierto. Retira las que sigan cerradas al final de la cocción.",
          "Al final, sube un poco el fuego para conseguir un buen socarrat.",
          "Apaga el fuego y deja reposar la paella entre 5 y 10 minutos.",
          "Decora con el limón y pon la paellera en el centro de la mesa. Tradicionalmente la paella se come en compañía, directamente de la paellera, cada uno desde su propia parte. Pero servir en plato individual también está muy bien. Al fin y al cabo, lo más importante de la paella es comerla en compañía.",
        ],
        en: [
          "First clean all the fish and seafood. Rinse the mussels and clams well under cold running water. Discard any broken shells. Cut the cleaned cuttlefish into rings or small pieces. Leave the langoustines and prawns whole and in their shells.",
          "Clean the green beans and cut them into pieces of about 3 cm. Halve the tomatoes and grate the flesh on a coarse grater. Finely chop the garlic.",
          "Heat the fish stock in a separate pan and keep it warm.",
          "Make sure the burner and paella pan are level.",
          "Get the wine ready for the guests and a beer for the cook.",
          "Put the paella pan on the burner and pour the olive oil into the centre of the pan. Heat the oil.",
          "Briefly fry the langoustines and prawns over medium to high heat until they take on some colour. Then take them out of the pan and set them aside. They will finish cooking on the paella later.",
          "Next, fry the cuttlefish in the olive oil for about 2 to 3 minutes. Add the green beans and fry them for a few minutes, until they start to take on some colour.",
          "Add the garlic and fry it briefly without letting it brown. Then add the grated tomato and fry it gently in the olive oil until most of the liquid has evaporated and a concentrated sofrito forms.",
          "Briefly stir the sweet paprika through the tomato and oil and add the warm fish stock almost immediately afterwards. Add the saffron with its soaking liquid and the salt.",
          "Turn up the heat and bring the stock to a good boil. Taste the stock and adjust with a little salt if needed.",
          "Spread the rice evenly over the pan and distribute it well once. Don't stir the rice after that. Cook for the first 7–8 minutes on high heat, then for about another 8 to 10 minutes on medium to low heat.",
          "After about 8 to 10 minutes, spread the mussels and clams over the paella. Put the langoustines and prawns back on the paella. Let everything cook until the rice is done, the stock has been almost completely absorbed and the shells have opened. Discard any shells that stay closed during cooking.",
          "At the end, turn the heat up a little for a moment to get a good socarrat.",
          "Turn off the heat and now leave the paella to rest for 5–10 minutes.",
          "Garnish with the lemon and place the paella pan in the middle of the table. Traditionally, paella is eaten together, straight from the pan, with everyone eating from their own section of the pan. But serving it on plates is fine too, of course. In the end, the most important part of paella is that you eat it together.",
        ],
      },
    },

    verduras: {
      slug: "verduras",
      title: { nl: "Paella de Verduras (groentepaella)", es: "Paella de Verduras", en: "Paella de Verduras (Vegetable Paella)" },
      ingredients: [
        { name: { nl: "Bomba rijst", es: "Arroz bomba", en: "Bomba rice" }, amount: 100, unit: "g", round: 5,
          note: { nl: "D.O.P. Arroz de Valencia (zoals Bomba, Senia of Albufera)", es: "D.O.P. Arroz de Valencia (como Bomba, Senia o Albufera)", en: "D.O.P. Arroz de Valencia (such as Bomba, Senia or Albufera)" } },
        { name: { nl: "Groentebouillon", es: "Caldo de verduras", en: "Vegetable stock" }, amount: 0.3, unit: "l", round: 0.1, isLiquid: true,
          note: { nl: "Zelfgetrokken, of een goede kant-en-klare variant", es: "Casero, o uno bueno ya preparado", en: "Homemade, or a good ready-made one" } },
        { name: { nl: "Snijbonen", es: "Judía verde", en: "Flat green beans" }, amount: 75, unit: "g", round: 5,
          note: { nl: "Brede, platte snijbonen, zoals de Valenciaanse ferraura", es: "Judía verde ancha y plana, como la ferraura valenciana", en: "Wide, flat green beans, such as the Valencian ferraura" } },
        { name: { nl: "Garrofó", es: "Garrofó", en: "Garrofó" }, amount: 30, unit: "g", round: 5,
          note: { nl: "Gedroogd. Verkrijgbaar bij Spaanse speciaalzaken", es: "Seco. Disponible en tiendas españolas especializadas", en: "Dried. Available from Spanish specialist shops" } },
        { name: { nl: "Artisjokharten", es: "Corazones de alcachofa", en: "Artichoke hearts" }, amount: 50, unit: "g", round: 5,
          note: { nl: "Traditioneel, vooral wanneer artisjokken in het seizoen zijn", es: "Tradicional, especialmente cuando la alcachofa está de temporada", en: "Traditional, especially when artichokes are in season" } },
        { name: { nl: "Tuinbonen", es: "Habas", en: "Broad beans" }, amount: 60, unit: "g", round: 5,
          note: { nl: "Vers of diepvries, gedopt", es: "Frescas o congeladas, desgranadas", en: "Fresh or frozen, shelled" } },
        { name: { nl: "Broccoli", es: "Brócoli", en: "Broccoli" }, amount: 25, unit: "g", round: 5,
          note: { nl: "In kleine roosjes verdeeld", es: "Separado en ramilletes pequeños", en: "Divided into small florets" } },
        { name: { nl: "Spinazie", es: "Espinacas", en: "Spinach" }, amount: 35, unit: "g", round: 5,
          note: { nl: "Vers, grof gesneden", es: "Frescas, picadas en trozos grandes", en: "Fresh, roughly chopped" } },
        { name: { nl: "Erwten", es: "Guisantes", en: "Peas" }, amount: 60, unit: "g", round: 5,
          note: { nl: "Vers of diepvries", es: "Frescos o congelados", en: "Fresh or frozen" } },
        { name: { nl: "Ui", es: "Cebolla", en: "Onion" }, amount: 0.25, unit: "stuk", round: 0.25,
          note: { nl: "Fijngesneden", es: "Picada fina", en: "Finely chopped" } },
        { name: { nl: "Tomaten", es: "Tomates", en: "Tomatoes" }, amount: 70, unit: "g", round: 5,
          note: { nl: "Rijpe, smaakvolle tomaten, bij voorkeur peertomaten", es: "Maduros y sabrosos, preferiblemente tomates de pera", en: "Ripe, flavourful tomatoes, preferably plum tomatoes" } },
        { name: { nl: "Citroen", es: "Limón", en: "Lemon" }, amount: 0.25, unit: "stuk", round: 0.25,
          note: { nl: "Voor het garneren bij het serveren", es: "Para decorar al servir", en: "To garnish when serving" } },
        { name: { nl: "Knoflook", es: "Ajo", en: "Garlic" }, amount: 3, unit: "teen", round: 1,
          note: { nl: "Fijngehakt, voor de sofrito", es: "Picado fino, para el sofrito", en: "Finely chopped, for the sofrito" } },
        { name: { nl: "Paprikapoeder", es: "Pimentón", en: "Paprika" }, amount: 1.5, unit: "g", round: 0.5,
          note: { nl: "Spaanse zoete paprika (pimentón dulce), niet gerookt.", es: "Pimentón dulce español, no ahumado", en: "Spanish sweet paprika (pimentón dulce), not smoked." } },
        { name: { nl: "Saffraan", es: "Azafrán", en: "Saffron" }, amount: 25, unit: "mg", round: 5,
          note: { nl: "Azafrán de La Mancha D.O.P.", es: "Azafrán de La Mancha D.O.P.", en: "Azafrán de La Mancha D.O.P." } },
        { name: { nl: "Rozemarijn", es: "Romero", en: "Rosemary" }, amount: 1, unit: "g", round: 1,
          note: { nl: "Vers, om kort te laten meetrekken.", es: "Fresco, para infusionar brevemente", en: "Fresh, to infuse briefly." } },
        { name: { nl: "Zout", es: "Sal", en: "Salt" }, amount: 5, unit: "g", round: 5,
          note: { nl: "Fijn zeezout (Middellandse Zee)", es: "Sal marina fina (mar Mediterráneo)", en: "Fine sea salt (Mediterranean)" } },
        { name: { nl: "Olijfolie", es: "Aceite de oliva", en: "Olive oil" }, amount: 25, unit: "ml", round: 5,
          note: { nl: "Extra vierge olijfolie (AOVE), bij voorkeur Valenciaans", es: "Aceite de oliva virgen extra (AOVE), preferiblemente valenciano", en: "Extra virgin olive oil (AOVE), preferably Valencian" } },
      ],
      steps: {
        nl: [
          "Leg de gedroogde garrofó een dag van tevoren in een ruime pan met water en laat een nacht weken. Kook de geweekte garrofó vervolgens vooraf gaar en laat uitlekken.",
          "Maak de groenten schoon. Snijd de snijbonen in stukken van ca. 3 cm. Verdeel de artisjokharten in parten en de broccoli in kleine roosjes. Dop indien nodig de tuinbonen. Snijd de ui fijn. Halveer de tomaten en rasp het vruchtvlees op een grove rasp. Hak de knoflook fijn.",
          "Verwarm de groentebouillon in een aparte pan en houd deze warm.",
          "Zorg dat de brander en paellapan waterpas staan.",
          "Zet de wijn alvast klaar voor de gasten en een biertje voor de kok.",
          "Zet de paellapan op de brander en giet de olijfolie in midden van de pan. Verwarm de olie.",
          "Bak de snijbonen en artisjok op middel- tot hoog vuur totdat ze wat kleur beginnen te krijgen. Voeg de broccoli en tuinbonen toe en bak deze nog enkele minuten mee.",
          "Voeg de ui toe en bak deze rustig mee totdat hij zacht begint te worden. Voeg daarna de knoflook toe en bak deze kort mee zonder hem bruin te laten worden.",
          "Voeg de geraspte tomaat toe en bak deze rustig in de olijfolie totdat het vocht grotendeels is verdampt en een geconcentreerde sofrito ontstaat.",
          "Roer kort de zoete paprikapoeder door de tomaat en olie en voeg vrijwel direct daarna de warme groentebouillon toe. Voeg de saffraan en het zout toe.",
          "Voeg de garrofó toe. Zet het vuur hoger en breng de bouillon goed aan de kook. Proef de bouillon en corrigeer indien nodig met een beetje zout.",
          "Voeg de rijst gelijkmatig over de pan toe en verdeel deze één keer goed. Roer de rijst daarna niet meer. Kook de eerste 7 à 8 minuten op hoog vuur en daarna nog ongeveer 8 tot 10 minuten op middelhoog tot laag vuur.",
          "Verdeel na ongeveer 8 tot 10 minuten de erwten en spinazie over de paella. Laat de spinazie vanzelf slinken en de groenten verder met de rijst garen. Leg tijdens het garen de rozemarijn kort op de paella, ongeveer 5 minuten, en verwijder deze daarna weer.",
          "Laat alles verder garen totdat de rijst gaar is en de bouillon vrijwel volledig is opgenomen.",
          "Zet het vuur aan het einde kort iets hoger voor een goede socarrat.",
          "Zet het vuur uit en laat de paella nu 5 à 10 minuten met rust.",
          "Garneer met de citroen en zet de paellapan midden op tafel. Traditioneel wordt paella gezamenlijk gegeten, rechtstreeks uit de pan, waarbij iedereen vanuit zijn eigen deel van de pan eet. Maar op een bord scheppen mag natuurlijk ook. Uiteindelijk is het belangrijkste onderdeel van paella dat je hem samen eet.",
        ],
        es: [
          "Pon el garrofó seco en remojo el día anterior, en un recipiente amplio con agua, y déjalo toda la noche. Cuece después el garrofó remojado hasta que esté tierno y escúrrelo.",
          "Limpia las verduras. Corta la judía verde en trozos de unos 3 cm. Corta los corazones de alcachofa en gajos y el brócoli en ramilletes pequeños. Desgrana las habas si hace falta. Pica la cebolla fina. Corta los tomates por la mitad y rállalos con un rallador grueso. Pica el ajo fino.",
          "Calienta el caldo de verduras en una olla aparte y mantenlo caliente.",
          "Asegúrate de que el quemador y la paellera estén bien nivelados.",
          "Prepara el vino para los invitados y una cerveza para el cocinero.",
          "Pon la paellera sobre el quemador y vierte el aceite de oliva en el centro. Calienta el aceite.",
          "Sofríe la judía verde y la alcachofa a fuego medio-alto hasta que empiecen a coger color. Añade el brócoli y las habas y sofríe unos minutos más.",
          "Añade la cebolla y sofríela con calma hasta que empiece a ablandarse. Incorpora entonces el ajo y sofríelo brevemente sin que llegue a dorarse.",
          "Añade el tomate rallado y sofríelo con calma hasta que el líquido se haya evaporado en gran parte y quede un sofrito concentrado.",
          "Añade el pimentón dulce, remueve brevemente con el tomate y el aceite, y añade casi de inmediato el caldo de verduras caliente. Incorpora el azafrán y la sal.",
          "Añade el garrofó. Sube el fuego y deja que el caldo rompa bien a hervir. Prueba el caldo y corrige de sal si hace falta.",
          "Añade el arroz repartiéndolo de forma uniforme por la paellera y remuévelo una sola vez. No lo vuelvas a remover después. Cuece los primeros 7-8 minutos a fuego alto y luego otros 8-10 minutos a fuego medio-bajo.",
          "Pasados unos 8-10 minutos, reparte los guisantes y las espinacas por la paella. Deja que las espinacas se ablanden y que las verduras terminen de cocerse con el arroz. Durante la cocción, coloca el romero sobre la paella unos 5 minutos y retíralo después.",
          "Deja que todo termine de cocerse hasta que el arroz esté en su punto y el caldo se haya absorbido casi por completo.",
          "Al final, sube un poco el fuego para conseguir un buen socarrat.",
          "Apaga el fuego y deja reposar la paella entre 5 y 10 minutos.",
          "Decora con el limón y pon la paellera en el centro de la mesa. Tradicionalmente la paella se come en compañía, directamente de la paellera, cada uno desde su propia parte. Pero servir en plato individual también está muy bien. Al fin y al cabo, lo más importante de la paella es comerla en compañía.",
        ],
        en: [
          "Put the dried garrofó in a large pan of water the day before and leave to soak overnight. Then cook the soaked garrofó in advance until tender and drain.",
          "Clean the vegetables. Cut the green beans into pieces of about 3 cm. Cut the artichoke hearts into wedges and divide the broccoli into small florets. Shell the broad beans if necessary. Finely chop the onion. Halve the tomatoes and grate the flesh on a coarse grater. Finely chop the garlic.",
          "Heat the vegetable stock in a separate pan and keep it warm.",
          "Make sure the burner and paella pan are level.",
          "Get the wine ready for the guests and a beer for the cook.",
          "Put the paella pan on the burner and pour the olive oil into the centre of the pan. Heat the oil.",
          "Fry the green beans and artichoke over medium to high heat until they start to take on some colour. Add the broccoli and broad beans and fry for a few more minutes.",
          "Add the onion and fry it gently until it starts to soften. Then add the garlic and fry it briefly without letting it brown.",
          "Add the grated tomato and fry it gently in the olive oil until most of the liquid has evaporated and a concentrated sofrito forms.",
          "Briefly stir the sweet paprika through the tomato and oil and add the warm vegetable stock almost immediately afterwards. Add the saffron and the salt.",
          "Add the garrofó. Turn up the heat and bring the stock to a good boil. Taste the stock and adjust with a little salt if needed.",
          "Spread the rice evenly over the pan and distribute it well once. Don't stir the rice after that. Cook for the first 7–8 minutes on high heat, then for about another 8 to 10 minutes on medium to low heat.",
          "After about 8 to 10 minutes, spread the peas and spinach over the paella. Let the spinach wilt by itself and the vegetables cook further with the rice. While it cooks, place the rosemary briefly on the paella, for about 5 minutes, then remove it again.",
          "Let everything cook until the rice is done and the stock has been almost completely absorbed.",
          "At the end, turn the heat up a little for a moment to get a good socarrat.",
          "Turn off the heat and now leave the paella to rest for 5–10 minutes.",
          "Garnish with the lemon and place the paella pan in the middle of the table. Traditionally, paella is eaten together, straight from the pan, with everyone eating from their own section of the pan. But serving it on plates is fine too, of course. In the end, the most important part of paella is that you eat it together.",
        ],
      },
    },

    fideua: {
      slug: "fideua",
      title: { nl: "Fideuà", es: "Fideuà", en: "Fideuà" },
      ingredients: [
        { name: { nl: "Fideuà (pasta)", es: "Fideos para fideuà", en: "Fideuà (pasta)" }, amount: 100, unit: "g", round: 5,
          note: { nl: "Korte, dunne fideuà-pasta (nr. 2), niet voorgekookt", es: "Fideos finos y cortos para fideuà (n.º 2), sin precocer", en: "Short, thin fideuà pasta (no. 2), not pre-cooked" } },
        { name: { nl: "Visbouillon", es: "Caldo de pescado", en: "Fish stock" }, amount: 0.3, unit: "l", round: 0.1, isLiquid: true,
          note: { nl: "Zelfgetrokken, of een goede kant-en-klare variant", es: "Casero, o uno bueno ya preparado", en: "Homemade, or a good ready-made one" } },
        { name: { nl: "Langoustines", es: "Cigalas", en: "Langoustines" }, amount: 1, unit: "stuk", round: 1,
          note: { nl: "Vers, heel gelaten in de schaal", es: "Frescas, enteras y sin pelar", en: "Fresh, left whole in their shells" } },
        { name: { nl: "Gamba's", es: "Gambas", en: "Prawns" }, amount: 2, unit: "stuk", round: 1,
          note: { nl: "Vers, heel gelaten in de schaal", es: "Frescas, enteras y sin pelar", en: "Fresh, left whole in their shells" } },
        { name: { nl: "Inktvis", es: "Sepia o calamar", en: "Cuttlefish or squid" }, amount: 75, unit: "g", round: 5,
          note: { nl: "Vers, schoongemaakt en in ringen of stukken gesneden", es: "Fresco, limpio y cortado en aros o trozos", en: "Fresh, cleaned and cut into rings or pieces" } },
        { name: { nl: "Mosselen", es: "Mejillones", en: "Mussels" }, amount: 100, unit: "g", round: 10,
          note: { nl: "Vers, goed gespoeld; verwijder kapotte exemplaren", es: "Frescos, bien enjuagados; retira los que estén rotos", en: "Fresh, well rinsed; discard any broken ones" } },
        { name: { nl: "Snijbonen", es: "Judía verde", en: "Flat green beans" }, amount: 75, unit: "g", round: 5,
          note: { nl: "Brede, platte snijbonen, zoals de Valenciaanse ferraura", es: "Judía verde ancha y plana, como la ferraura valenciana", en: "Wide, flat green beans, such as the Valencian ferraura" } },
        { name: { nl: "Tomaten", es: "Tomates", en: "Tomatoes" }, amount: 70, unit: "g", round: 5,
          note: { nl: "Rijpe, smaakvolle tomaten, bij voorkeur peertomaten", es: "Maduros y sabrosos, preferiblemente tomates de pera", en: "Ripe, flavourful tomatoes, preferably plum tomatoes" } },
        { name: { nl: "Citroen", es: "Limón", en: "Lemon" }, amount: 0.25, unit: "stuk", round: 0.25,
          note: { nl: "Voor het garneren bij het serveren", es: "Para decorar al servir", en: "To garnish when serving" } },
        { name: { nl: "Knoflook", es: "Ajo", en: "Garlic" }, amount: 1, unit: "teen", round: 1,
          note: { nl: "Fijngehakt, voor de sofrito", es: "Picado fino, para el sofrito", en: "Finely chopped, for the sofrito" } },
        { name: { nl: "Paprikapoeder", es: "Pimentón", en: "Paprika" }, amount: 1.5, unit: "g", round: 0.5,
          note: { nl: "Spaanse zoete paprika (pimentón dulce), niet gerookt.", es: "Pimentón dulce español, no ahumado", en: "Spanish sweet paprika (pimentón dulce), not smoked." } },
        { name: { nl: "Saffraan", es: "Azafrán", en: "Saffron" }, amount: 25, unit: "mg", round: 5,
          note: { nl: "Azafrán de La Mancha D.O.P.", es: "Azafrán de La Mancha D.O.P.", en: "Azafrán de La Mancha D.O.P." } },
        { name: { nl: "Zout", es: "Sal", en: "Salt" }, amount: 5, unit: "g", round: 1,
          note: { nl: "Fijn zeezout (Middellandse Zee)", es: "Sal marina fina (mar Mediterráneo)", en: "Fine sea salt (Mediterranean)" } },
        { name: { nl: "Aioli", es: "Alioli", en: "Aioli" }, amount: 30, unit: "g", round: 5,
          note: { nl: "Zelfgemaakt of kant-en-klaar, apart te serveren bij de fideuà", es: "Casero o ya preparado, para servir aparte con la fideuà", en: "Homemade or ready-made, served separately with the fideuà" } },
        { name: { nl: "Olijfolie", es: "Aceite de oliva", en: "Olive oil" }, amount: 25, unit: "ml", round: 5,
          note: { nl: "Extra vierge olijfolie (AOVE), bij voorkeur Valenciaans", es: "Aceite de oliva virgen extra (AOVE), preferiblemente valenciano", en: "Extra virgin olive oil (AOVE), preferably Valencian" } },
      ],
      steps: {
        nl: [
          "Maak eerst alle vis en zeevruchten schoon. Spoel de mosselen goed onder koud stromend water en verwijder kapotte schelpen. Snijd de schoongemaakte inktvis in ringen of kleine stukken. Laat de langoustine en gamba's heel en in de schaal.",
          "Maak de snijbonen schoon en snijd ze in stukken van ca. 3 cm. Halveer de tomaten en rasp het vruchtvlees op een grove rasp. Hak de knoflook fijn.",
          "Verwarm de visbouillon in een aparte pan en houd deze warm.",
          "Zorg dat de brander en paellapan waterpas staan.",
          "Zet de wijn alvast klaar voor de gasten en een biertje voor de kok.",
          "Zet de paellapan op de brander en giet de olijfolie in midden van de pan. Verwarm de olie.",
          "Bak de langoustine en gamba's kort op middel- tot hoog vuur, totdat ze wat kleur krijgen. Haal ze daarna uit de pan en leg ze apart. Ze garen later verder op de fideuà.",
          "Bak de inktvis vervolgens ongeveer 2 tot 3 minuten in de olijfolie. Voeg de snijbonen toe en bak deze enkele minuten mee, totdat ze wat kleur beginnen te krijgen.",
          "Voeg de knoflook toe en bak deze kort mee zonder hem bruin te laten worden. Voeg daarna de geraspte tomaat toe en bak deze rustig in de olijfolie totdat het vocht grotendeels is verdampt en een geconcentreerde sofrito ontstaat.",
          "Roer kort de zoete paprikapoeder door de tomaat en olie en voeg vrijwel direct daarna de warme visbouillon toe. Voeg de saffraan en het zout toe.",
          "Zet het vuur hoger en breng de bouillon goed aan de kook. Proef de bouillon en corrigeer indien nodig met een beetje zout.",
          "Voeg de fideuà gelijkmatig over de pan toe en verdeel goed. Zorg dat de pasta zoveel mogelijk met de bouillon in contact komt. Roer daarna niet meer.",
          "Laat de fideuà eerst enkele minuten op hoog vuur koken en zet het vuur daarna middelhoog. De exacte gaartijd is afhankelijk van de dikte en het type fideuà, houd de aangegeven kooktijd op de verpakking aan.",
          "Verdeel halverwege de gaartijd de mosselen over de pan en leg de langoustine en gamba's terug op de fideuà. Laat alles verder garen totdat de pasta gaar is, de bouillon vrijwel volledig is opgenomen en de mosselen zijn geopend. Verwijder mosselen die tijdens het garen gesloten blijven.",
          "Houd tijdens de laatste minuten de fideuà goed in de gaten. De bedoeling is dat de bouillon volledig wordt opgenomen en de bodem licht aanbakt, zonder dat de pasta verbrandt.",
          "Zet het vuur uit en laat de fideuà ongeveer 5 minuten met rust.",
          "Garneer met de citroen en serveer de aioli apart bij de fideuà. Zet de paellapan midden op tafel en eet de fideuà gezamenlijk uit de pan of schep hem op borden.",
        ],
        es: [
          "Limpia primero todo el pescado y el marisco. Enjuaga bien los mejillones bajo agua fría corriente y retira los que estén rotos. Corta la sepia o el calamar limpio en aros o trozos pequeños. Deja las cigalas y las gambas enteras y sin pelar.",
          "Limpia la judía verde y córtala en trozos de unos 3 cm. Corta los tomates por la mitad y rállalos con un rallador grueso. Pica el ajo fino.",
          "Calienta el caldo de pescado en una olla aparte y mantenlo caliente.",
          "Asegúrate de que el quemador y la paellera estén bien nivelados.",
          "Prepara el vino para los invitados y una cerveza para el cocinero.",
          "Pon la paellera sobre el quemador y vierte el aceite de oliva en el centro. Calienta el aceite.",
          "Dora brevemente las cigalas y las gambas a fuego medio-alto, hasta que cojan algo de color. Retíralas de la paellera y resérvalas; terminarán de hacerse más tarde sobre la fideuà.",
          "Saltea la sepia o el calamar unos 2-3 minutos en el aceite. Añade la judía verde y sofríela unos minutos más, hasta que empiece a coger color.",
          "Añade el ajo y sofríelo brevemente sin que llegue a dorarse. Incorpora después el tomate rallado y sofríelo con calma hasta que el líquido se haya evaporado en gran parte y quede un sofrito concentrado.",
          "Añade el pimentón dulce, remueve brevemente con el tomate y el aceite, y añade casi de inmediato el caldo de pescado caliente. Incorpora el azafrán y la sal.",
          "Sube el fuego y deja que el caldo rompa bien a hervir. Prueba el caldo y corrige de sal si hace falta.",
          "Añade la fideuà repartiéndola de forma uniforme por la paellera. Procura que la pasta quede bien en contacto con el caldo. No la remuevas después.",
          "Deja que la fideuà cueza primero unos minutos a fuego alto y baja después a fuego medio. El tiempo exacto depende del grosor y el tipo de fideos: sigue el tiempo de cocción indicado en el envase.",
          "A mitad de la cocción, reparte los mejillones por la paellera y vuelve a colocar las cigalas y las gambas sobre la fideuà. Deja que todo termine de cocerse hasta que la pasta esté en su punto, el caldo se haya absorbido casi por completo y los mejillones se hayan abierto. Retira los que sigan cerrados.",
          "Durante los últimos minutos, vigila bien la fideuà: el caldo debe absorberse del todo y el fondo debe agarrarse ligeramente, sin que la pasta llegue a quemarse.",
          "Apaga el fuego y deja reposar la fideuà unos 5 minutos.",
          "Decora con el limón y sirve el alioli aparte. Pon la paellera en el centro de la mesa y come la fideuà en compañía, directamente de la paellera o servida en platos.",
        ],
        en: [
          "First clean all the fish and seafood. Rinse the mussels well under cold running water and discard any broken shells. Cut the cleaned cuttlefish into rings or small pieces. Leave the langoustines and prawns whole and in their shells.",
          "Clean the green beans and cut them into pieces of about 3 cm. Halve the tomatoes and grate the flesh on a coarse grater. Finely chop the garlic.",
          "Heat the fish stock in a separate pan and keep it warm.",
          "Make sure the burner and paella pan are level.",
          "Get the wine ready for the guests and a beer for the cook.",
          "Put the paella pan on the burner and pour the olive oil into the centre of the pan. Heat the oil.",
          "Briefly fry the langoustines and prawns over medium to high heat until they take on some colour. Then take them out of the pan and set them aside. They will finish cooking on the fideuà later.",
          "Next, fry the cuttlefish in the olive oil for about 2 to 3 minutes. Add the green beans and fry them for a few minutes, until they start to take on some colour.",
          "Add the garlic and fry it briefly without letting it brown. Then add the grated tomato and fry it gently in the olive oil until most of the liquid has evaporated and a concentrated sofrito forms.",
          "Briefly stir the sweet paprika through the tomato and oil and add the warm fish stock almost immediately afterwards. Add the saffron and the salt.",
          "Turn up the heat and bring the stock to a good boil. Taste the stock and adjust with a little salt if needed.",
          "Spread the fideuà evenly over the pan and distribute it well. Make sure the pasta is in contact with the stock as much as possible. Don't stir after that.",
          "Let the fideuà boil on high heat for a few minutes first, then turn the heat down to medium-high. The exact cooking time depends on the thickness and type of fideuà; follow the cooking time stated on the packet.",
          "Halfway through the cooking time, spread the mussels over the pan and put the langoustines and prawns back on the fideuà. Let everything cook until the pasta is done, the stock has been almost completely absorbed and the mussels have opened. Discard any mussels that stay closed during cooking.",
          "Keep a close eye on the fideuà during the last few minutes. The idea is that the stock is fully absorbed and the bottom lightly caramelises, without the pasta burning.",
          "Turn off the heat and leave the fideuà to rest for about 5 minutes.",
          "Garnish with the lemon and serve the aioli separately with the fideuà. Place the paella pan in the middle of the table and eat the fideuà together straight from the pan, or serve it on plates.",
        ],
      },
    },
  };

  global.PaellaRecipeData = { TEXT: TEXT, DISHES: DISHES, UNIT_ES: UNIT_ES, UNIT_EN: UNIT_EN };
})(typeof window !== "undefined" ? window : globalThis);
