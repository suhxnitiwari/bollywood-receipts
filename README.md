# Bollywood Receipts

Bollywood has a long memory. We kept the receipts.

Bollywood gossip, sorted by how solid the receipt actually is. Every story is stamped:

- **RECEIPT ✓**: on the record (interviews, court filings, announcements)
- **ALLEGED ?**: credibly reported, but disputed or never confirmed
- **RUMOR ~**: repeated around town without real confirmation
- **CAP ✕**: the available evidence contradicts it

## Pages

- `index.html`: the front page (lead story, Spotted, receipts, the connector, the Reel, the Web, Khandaan, the archive, Watch next)
- `receipts.html`: every receipt, filed by drawer, with search (`?f=feud`, `?q=Ranbir`)
- `guest-list.html`: the flagship. The Guest List: all of Bollywood on one full-screen map, seated by khandaan and circle. Pull the thread between any two people and watch the chain reveal itself, open anyone's little black book, filter by family, love, friends, feuds or films, and read every receipt without leaving the room
- `rishta.html`: redirects to the Guest List, so old `?a=…&b=…` links still work
- `the-web.html`: the quick connector, the bridges leaderboard and the case files
- `people.html`: Khandaan family trees (`?k=kapoor`) and Stars A–Z
- `features.html`: long reads (a century of the sexy heroine, how 50 stars got in, the school pipeline, the inheritance board)
- `watch.html`: the full Reel and what to stream next
- `web.html`: Six Degrees of Bollywood, the whole board in 3D

Shared code lives in `assets/`: `world.js` and `world.css` (the Guest List), `world-data.js` and `faces/` (built offline, see below), `site.css` (styles), `site.js` (data, masthead, nav, ticker, search and every section's logic) and `web3d.js` (the 3D corkboard webs).

## Rebuilding the Guest List

The map's seating and portraits are built offline so the browser never runs physics or pulls full-size photos. After changing the data in `site.js`, `movies.js` or `casefiles.js`:

```
cd tools && npm install
npm run faces   # crops new portraits into assets/faces (skips ones already built)
npm run world   # lays out the room into assets/world-data.js
```

Live site: https://suhxnitiwari.github.io/bollywood-receipts/

Gossip is gossip. Anything marked ALLEGED or RUMOR is not fact.
