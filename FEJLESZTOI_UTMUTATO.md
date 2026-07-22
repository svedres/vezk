# Fejlesztői és testreszabási útmutató

## Technikai felépítés

A játék build nélküli ES-module webalkalmazás:

- `index.html`: nézetek és modális ablakok;
- `css/style.css`: teljes reszponzív megjelenés;
- `js/data.js`: minden szerkeszthető játékadat;
- `js/app.js`: Firebase-kapcsolat, fordulók, költségek, pontozás és UI;
- `js/firebase-config.js`: Firebase webkonfiguráció.

A Firebase Realtime Database útvonalai:

```text
games/{ROOM}/meta
games/{ROOM}/teams/team1
games/{ROOM}/teams/team2
games/{ROOM}/teams/team3
games/{ROOM}/teams/team4
```

## Eset szerkesztése

A `js/data.js` fájlban minden eset ilyen objektum:

```js
{
  id: "egyedi_azonosito",
  round: 1,
  name: "Az eset címe",
  capacity: 3,
  description: "A teljes esetleírás.",
  urgency: 2,
  fairness: 3,
  systemic: 2,
  coordination: 1,
  focus: "Vezetői fókusz vagy feldolgozási szempont."
}
```

Szabályok:

- az `id` legyen egyedi, ékezet és szóköz nélkül;
- a `round` értéke 1, 2 vagy 3;
- a `capacity` ajánlott tartománya 1–5;
- a négy játéktechnikai dimenzió 1–3 közötti szám;
- egy csapat esetazonosítója ne kerüljön át másik csapathoz folyamatban lévő játék közben.

## Kapacitás módosítása

A körök alapkerete a `ROUND_CAPACITY` objektumban található:

```js
export const ROUND_CAPACITY = { 1: 12, 2: 10, 3: 8 };
```

A Firebase-szabályok jelenleg csak a fordulószámot ellenőrzik, ezért a keret megváltoztatása nem igényel szabályfrissítést.

## Esemény hozzáadása

Az `EVENTS` tömbben új elem adható hozzá. Az alkalmazás automatikusan megjeleníti a játékmester választójában. Az alapvető `capacityModifier` azonnal működik.

A speciális hatásokhoz az `app.js` következő függvényeit kell bővíteni:

- `decisionCost()` — költséghatás;
- `outcomeFor()` — következmény- és pontszámhatás.

## Pontozási modell

Az `outcomeFor(card, modeId, event)` függvény számítja az öt dimenzió változását. A modell szándékosan egyszerű és átlátható. Képzési célra érdemes inkább az értelmező szöveget és a reflexiót fejleszteni, mint túl pontosnak látszó matematikai rendszert létrehozni.

## Firebase-szabályok

A jelenlegi szabályok:

- minden hozzáféréshez anonim vagy más Firebase Authentication szükséges;
- csak szabályos szobakód olvasható;
- csak `team1`–`team4` csapatazonosító írható;
- a metaállapot forduló- és fázisértékei ellenőrzöttek.

Ez nem erős jogosultsági modell. Ha játékmesteri hitelesítés szükséges, érdemes külön bejelentkezést, Firebase Custom Claims jogosultságot és tranzakciós írást kialakítani.

## Verziófrissítés

Módosítás után:

```bash
git add .
git commit -m "Jatek tartalmi frissites"
git push
```

A GitHub Pages workflow automatikusan telepít.
