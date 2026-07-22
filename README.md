# Vezetői Válságstáb

Valós idejű, böngészőben futó vezetőképző csapatjáték a tanulmányi ügyekhez kapcsolódó erőforrás-menedzsment esetekből.

A játék megtartja az eredeti esetek **1–5 pontos kapacitásigényét**, de hozzáadja:

- a négyféle vezetői beavatkozást;
- a három, egyre szűkülő fordulót;
- a játékmester által kiosztott váratlan eseményeket;
- a csapaton belüli vezetői szerepeket;
- a döntések valós idejű Firebase-szinkronját;
- a rejtett következmények felfedését;
- a vezetői profil és a reflexiós kérdések megjelenítését.

A csomag statikus HTML/CSS/JavaScript, nincs szükség npm-re vagy build folyamatra. GitHub Pages közvetlenül kiszolgálja.

## A csomag fontos fájljai

```text
index.html                       A webalkalmazás felülete
css/style.css                    Megjelenés és mobilnézet
js/app.js                        Játéklogika és Firebase-szinkron
js/data.js                       32 eset, csapatok, események és játékszabályok
js/firebase-config.js            A már létrehozott Firebase-projekt konfigurációja
firebase.rules.json              Az ÚJ Realtime Database szabályok
JATEKMESTER_UTMUTATO.md          Részletes, 60–90 perces foglalkozásterv
JATEKOS_GYORSLAP.md              Rövid, kiosztható játékosi szabály
FEJLESZTOI_UTMUTATO.md           Testreszabás és technikai felépítés
.github/workflows/pages.yml      Automatikus GitHub Pages telepítés
```

---

# 1. Frissítés a már működő GitHub-repozitóriumban

A jelenlegi repozitóriumod várhatóan a helyi `vezk-ready` mappában van, és már tartalmazza a rejtett `.git` mappát. A biztonságos frissítésnél ezt a `.git` mappát meg kell őrizni.

## Finderes módszer macOS-en

1. Csomagold ki a letöltött ZIP-et.
2. Nyisd meg a kicsomagolt `vezk-vezetoi-jatek` mappát.
3. Jelöld ki az összes fájlt, beleértve a rejtett `.github` mappát is. A rejtett fájlok megjelenítése: `Command + Shift + .`
4. Másold át őket a jelenlegi `vezk-ready` repozitóriummappába.
5. A felülírási kérdésnél válaszd a cserét.
6. **A meglévő `vezk-ready/.git` mappát ne töröld.** A ZIP nem tartalmaz `.git` mappát, ezért normál másolással ez megmarad.

Ezután Terminalban:

```bash
cd ~/Downloads/vezk-ready
git status
git add .
git commit -m "Vezetoi Valsagstab jatekfrissites"
git push
```

Ha a repozitóriummappa máshol található, az első parancsban azt az útvonalat használd.

## Terminálos másolás

Példa, ha mindkét mappa a Letöltések között van:

```bash
cd ~/Downloads
rsync -av --exclude='.git' vezk-vezetoi-jatek/ vezk-ready/
cd vezk-ready
git status
git add .
git commit -m "Vezetoi Valsagstab jatekfrissites"
git push
```

A GitHub Actions automatikusan újratelepíti az oldalt. Az állapotot a repozitórium **Actions** lapján lehet követni.

A publikus oldal címe továbbra is:

```text
https://svedres.github.io/vezk/
```

---

# 2. Kötelező Firebase-lépés: az új szabályok publikálása

A korábbi adatbázis-szabályok csak az egyszerű kártyapozíciókat engedélyezték. Az új játék metaadatokat, szerepeket, döntéseket és fordulóállapotot ment, ezért a szabályokat frissíteni kell.

1. Nyisd meg a Firebase Console-t.
2. Válaszd a `Vezkepzo` projektet.
3. Nyisd meg: **Realtime Database → Rules**.
4. A helyi projektben nyisd meg a `firebase.rules.json` fájlt.
5. Másold ki a teljes tartalmát.
6. A Firebase szabályszerkesztőjében cseréld le a régi szabályokat.
7. Kattints a **Publish** gombra.

Az **Authentication → Sign-in method → Anonymous** szolgáltatásnak továbbra is engedélyezve kell lennie.

A csomag már tartalmazza a korábban létrehozott `vezkepzo-e4b07` Firebase webkonfigurációját. Firebase webalkalmazásoknál ezek a kliensoldali projektazonosítók nem szolgáltatásfiók-titkok. Soha ne adj a repozitóriumhoz service-account JSON fájlt vagy privát kulcsot.

---

# 3. Helyi teszt a push előtt

Terminálban, a projekt mappájában:

```bash
python3 -m http.server 8000
```

Böngészőben:

```text
http://localhost:8000
```

Ellenőrzés:

1. A jobb felső sarokban **● Online** jelenik meg.
2. Normál Chrome-ablakban lépj be egy csapatként.
3. Inkognitóablakban nyisd meg ugyanazt a címet és lépj be játékmesterként.
4. Mindkét oldalon ugyanazt a szobakódot használd.
5. Helyezz el egy ügyet egy döntési zónában.
6. A játékmester nézetében azonnal meg kell jelennie.

A helyi szerver leállítása: `Control + C`.

---

# 4. Játékmenet röviden

## Előkészítés

- 4 csapat ajánlott, csapatonként 3–6 fő.
- Minden résztvevő ugyanazt a szobakódot használja.
- Egy eszköz használható csapatonként, vagy ugyanazon csapat több eszközön is megnyitható.
- A játékmester külön eszközön vagy inkognitóablakban lép be.

## Szerepek

A csapat lehetőség szerint ossza ki:

1. Döntéshozó
2. Hallgatói szempont képviselője
3. Szabályossági felelős
4. Rendszerfelelős
5. Kommunikációs vezető

Kisebb csapatban egy személy több szerepet is vihet.

## Beavatkozási módok

| Döntés | Kapacitásköltség | Vezetői jelentés |
|---|---:|---|
| Azonnal megoldjuk | az eredeti 1–5 pont | Tartós, érdemi kezelés |
| Stabilizáljuk | az eredeti pont fele, felfelé kerekítve | Azonnali kár csökkentése, későbbi teendővel |
| Delegáljuk | 1 pont | Partner vagy más egység bevonása, koordinációs kockázattal |
| Vállaljuk a kockázatot | 0 pont | Tudatos halasztás és felhalmozott kockázat |

## Fordulók

- **1. forduló:** 12 pont alapkapacitás
- **2. forduló:** 10 pont alapkapacitás
- **3. forduló:** 8 pont alapkapacitás

A játékmesteri események ezt módosíthatják.

## Következmények

A csapatok a tervezési fázisban nem látják a modell szerinti következményeket. A játékmester a forduló végén fedi fel őket. A rendszer öt dimenziót mutat:

- hallgatói bizalom;
- méltányosság;
- működési stabilitás;
- szervezeti tanulás;
- felhalmozott kockázat.

A pontok **nem hivatalos szakmai minősítések**, hanem a megbeszélést támogató szimulációs jelzések. Egy jól megindokolt eltérő döntés fontosabb lehet, mint a modell szerinti magasabb pont.

---

# 5. Játékmesteri gyorsindítás

1. Nyisd meg az oldalt.
2. Írd be a szobakódot.
3. Válaszd a **Játékmesteri felület** gombot.
4. Az első fordulóban válassz eseményt, majd kattints az **Esemény alkalmazása** gombra.
5. Figyeld, mely csapatok véglegesítettek.
6. Kattints a **Következmények felfedése** gombra.
7. Tarts rövid megbeszélést.
8. Kattints a **Következő forduló** gombra.
9. A harmadik forduló után válaszd a **Játék lezárása** lehetőséget.

A teljes foglalkozástervet lásd a `JATEKMESTER_UTMUTATO.md` fájlban.

---

# 6. Megosztható közvetlen linkek

Játékmester:

```text
https://svedres.github.io/vezk/?room=MAIN&role=master
```

Csapatok:

```text
https://svedres.github.io/vezk/?room=MAIN&team=team1
https://svedres.github.io/vezk/?room=MAIN&team=team2
https://svedres.github.io/vezk/?room=MAIN&team=team3
https://svedres.github.io/vezk/?room=MAIN&team=team4
```

A `MAIN` helyére bármilyen 1–12 karakteres, betűből, számból, `_` vagy `-` jelből álló szobakód írható.

---

# 7. Fontos működési korlát

Ez egy bizalmi alapú képzési játék. Minden anonim Firebase-felhasználó, aki ismeri a szobakódot, technikailag hozzáférhet a szoba adataihoz, és a kliensoldali felületen kívül módosíthatja azokat. Zárt képzési alkalmakra ez megfelelő lehet. Valódi jogosultságkezeléshez játékmesteri fiók, meghívókódos csapattulajdon és megbízható backend szükséges.

---

# 8. Gyakori hibák

## Az oldal „Helyi módot” mutat

- Ellenőrizd, hogy az Anonymous Authentication engedélyezve van.
- Ellenőrizd a `js/firebase-config.js` fájlt.
- Nyisd meg a böngésző fejlesztői konzolját.
- Ellenőrizd, hogy internetkapcsolat mellett betöltődnek a Firebase CDN-fájlok.

## A döntés nem menthető

Szinte mindig a régi Firebase-szabály maradt aktív. Publikáld újra a csomag `firebase.rules.json` fájlját.

## A GitHub-oldal nem frissül

1. GitHub → repozitórium → **Actions**.
2. Nyisd meg a legutóbbi `Deploy static site to GitHub Pages` futást.
3. Várd meg a zöld pipát.
4. Frissíts keményen a böngészőben: macOS-en `Command + Shift + R`.

## Egy régi játékállapot látszik

A játékmesteri felületen kattints a **Szoba alaphelyzetbe** gombra, vagy használj új szobakódot.
