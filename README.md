# Mana Clash — Firebase + GitHub Pages ready

A no-build, browser-based card game. Players on different phones or computers
can share a room through **Firebase Realtime Database**, while the static site
is served free through **GitHub Pages**.

## What is already prepared

- Valid static `index.html`, CSS, and ES-module JavaScript.
- Firebase JavaScript SDK `12.16.0` loaded from Firebase's CDN.
- Anonymous Firebase Authentication before database access.
- Realtime Database rules in [`firebase.rules.json`](firebase.rules.json).
- A GitHub Pages deployment workflow in
  [`.github/workflows/pages.yml`](.github/workflows/pages.yml).
- Local-only fallback when Firebase has not been configured or cannot connect.

> The last account-level steps cannot be performed from the source code alone:
> you must sign in to your own Firebase and GitHub accounts. Follow the steps
> below once; no paid plan or build tooling is required.

---

## 1. Test the webpage locally

JavaScript modules must be served over HTTP rather than opened with `file://`.

```bash
cd vezk-ready
python3 -m http.server 8000
```

Open `http://localhost:8000`. Until Firebase is configured, the top-right badge
shows **● Local only** and multiple tabs in the same browser can still sync.

---

## 2. Create the free Firebase project

### A. Create and register the web app

1. Open the Firebase Console: <https://console.firebase.google.com/>.
2. Select **Create a project**.
3. Enter a project name. Google Analytics is not required for this game.
4. On the project overview, select the **Web** icon (`</>`).
5. Enter an app nickname such as `mana-clash-web` and select **Register app**.
6. Firebase displays a `firebaseConfig` object. Keep this page open.

### B. Create Realtime Database

1. In the Firebase sidebar, open **Build → Realtime Database**.
2. Select **Create Database**.
3. Choose the database location closest to most players.
4. Choose **Locked mode**. The rules supplied in this repository will replace
   the locked defaults.

### C. Enable anonymous sign-in

1. Open **Build → Authentication**.
2. Select **Get started** if prompted.
3. Open **Sign-in method**.
4. Select **Anonymous**, enable it, and save.

This lets the app obtain a temporary Firebase identity without asking players
for an email address. The database rules require an authenticated identity.

### D. Paste the Firebase config

Open [`js/firebase-config.js`](js/firebase-config.js) and replace the entire
placeholder object with the exact object Firebase gave you. It will look like:

```js
export const firebaseConfig = {
  apiKey: "...",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-database-url...",
  projectId: "your-project",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "...",
  appId: "...",
};
```

The exact `databaseURL` varies by database location, so copy it rather than
constructing it manually. A Firebase web API key is not a server secret; do not
put service-account JSON or private keys into this repository.

### E. Publish the database rules

1. Return to **Realtime Database → Rules**.
2. Replace the editor contents with the complete contents of
   [`firebase.rules.json`](firebase.rules.json).
3. Select **Publish**.

The supplied rules:

- deny all access by default;
- require Firebase Authentication;
- allow only room codes containing 1–12 letters, numbers, `_`, or `-`;
- validate card IDs, mana, and card coordinates.

This remains a casual trust-based game: an authenticated player who knows a
room and team ID could overwrite that team's board. Strong team ownership would
require a claim/invite flow or a trusted backend.

### F. Verify online mode

Restart the local server and reload the page. The top-right badge should show
**● Online**. Test with two different browsers or an ordinary window plus a
private/incognito window; local-only mode cannot sync those, but Firebase can.

If it still says **Local only**, open browser developer tools and check the
Console. The usual causes are:

- a placeholder remains in `js/firebase-config.js`;
- `databaseURL` is missing or incorrect;
- Anonymous Authentication was not enabled;
- the database rules were not published;
- a network/content blocker prevented Firebase CDN requests.

---

## 3. Push the project to GitHub

### A. Create the repository

1. Sign in at <https://github.com/> and create a new repository.
2. On GitHub Free, make it **Public** to use GitHub Pages.
3. Do not add a README, `.gitignore`, or license during repository creation;
   this folder already contains the project files.

### B. Push from a terminal

Run these commands inside the project folder, replacing the remote URL:

```bash
cd vezk-ready
git init
git add .
git commit -m "Deploy Mana Clash with Firebase realtime sync"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

GitHub may ask you to authenticate in a browser or use a personal access token,
depending on your Git setup.

---

## 4. Enable GitHub Pages

A ready-to-use GitHub Actions workflow is included.

1. In the GitHub repository, open **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Open the **Actions** tab and select the workflow named
   **Deploy static site to GitHub Pages**.
4. If the first push happened before Pages was enabled, select **Run workflow**.
5. When the deployment completes, its URL appears in the workflow and in
   **Settings → Pages**.

The site URL is normally:

```text
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/
```

Every later push to `main` deploys automatically.

---

## 5. Play and share

- Home → enter the same room code on every device → **Let's Start**.
- Each player selects a team and drags cards onto the battlefield.
- The Game Master enters the same room code and selects
  **I'm the Game Master**.

Shareable links:

```text
Player: https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/?room=MAIN&team=team1
Master: https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/?room=MAIN&role=master
```

---

## Customize the game

Edit [`js/cards.js`](js/cards.js):

- `GAME_TITLE` changes the title.
- `MANA_LIMIT` changes the budget.
- `TEAMS` changes team names and colors.
- `CARDS` changes card data and image paths.

Add card artwork under `cards/`; see [`cards/README.md`](cards/README.md).
Missing images automatically use the built-in styled placeholder.

### Important rule update when changing the mana limit

The current database rules cap `used` mana at `10`. If you change
`MANA_LIMIT`, update this line in `firebase.rules.json` to the same maximum:

```json
".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 10"
```

Then republish the rules in Firebase.
