# Wikidata sync

Pulls the public records behind the Guest List from Wikidata (CC0):

1. `python3 fetch_films.py` — every Hindi-language film since 1930 with cast, director, producers and composer → `films.json`
2. `python3 fetch_people.py` — picks the regulars (5+ acting credits, or 3+ as director/producer/composer, plus everyone the hand-checked layer mentions) and fetches spouses, parents, children, siblings, birth years and Commons photos → `people.json`
3. `python3 build_wdjs.py` — writes `assets/wd.js` (films and family links the site loads) and `assets/wd-meta.js` (Wikidata ids and photo URLs for the build)

Then `npm run faces` and `npm run world` in `tools/`.

Hand-checked gossip in `assets/site.js` always wins over Wikidata for the same pair of people.
