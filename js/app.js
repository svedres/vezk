// ============================================================
//  Mana Clash — app logic (views, drag & drop, mana, realtime)
// ============================================================
import { firebaseConfig } from "./firebase-config.js";
import { GAME_TITLE, TEAMS, MANA_LIMIT, CARDS } from "./cards.js";

const $ = (sel) => document.querySelector(sel);
const params = new URLSearchParams(location.search);

const normalizeRoom = (value) => {
  const cleaned = String(value || "MAIN")
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 12);
  return cleaned || "MAIN";
};

let room   = normalizeRoom(params.get("room"));
let role   = params.get("role");           // "master" or null
let teamId = params.get("team");           // "team1".. or null

// ---- flat lookup of every card's metadata by id ----
const cardById = {};
for (const t of TEAMS) for (const c of (CARDS[t.id] || [])) cardById[c.id] = { ...c, team: t.id };
const cardMana = (id) => cardById[id]?.mana || 0;
const usedMana = (state) => Object.keys(state?.cards || {}).reduce((s, id) => s + cardMana(id), 0);

// ============================================================
//  STORE — realtime abstraction (Firebase online, else local)
// ============================================================
const FIREBASE_SDK_VERSION = "12.16.0";
const REQUIRED_CONFIG_KEYS = ["apiKey", "authDomain", "databaseURL", "projectId", "appId"];
const configValid = REQUIRED_CONFIG_KEYS.every((key) => {
  const value = firebaseConfig[key];
  return value && !String(value).includes("YOUR_");
});
let store;

async function initStore() {
  if (configValid) {
    try {
      const sdkBase = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;
      const { initializeApp } = await import(`${sdkBase}/firebase-app.js`);
      const { getAuth, signInAnonymously } = await import(`${sdkBase}/firebase-auth.js`);
      const { getDatabase, ref, set, onValue } = await import(`${sdkBase}/firebase-database.js`);

      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      if (!auth.currentUser) await signInAnonymously(auth);

      const db = getDatabase(app);
      store = {
        mode: "online",
        write: (room, team, state) => set(ref(db, `games/${room}/teams/${team}`), state),
        subscribe: (room, team, cb) => onValue(
          ref(db, `games/${room}/teams/${team}`),
          (snapshot) => cb(snapshot.val()),
          (error) => {
            console.error("Firebase subscription failed.", error);
            showToast("Online sync lost. Check Firebase rules and config.");
          },
        ),
      };
      return;
    } catch (err) {
      console.error("Firebase failed to initialize — using local mode instead.", err);
    }
  }
  // ---- Local fallback: localStorage + BroadcastChannel (same browser) ----
  const bc = "BroadcastChannel" in window ? new BroadcastChannel("mana-clash") : null;
  const listeners = {};
  const keyOf = (room, team) => `manaclash:${room}:${team}`;
  const notify = (k, state) => (listeners[k] || []).forEach((cb) => cb(state));
  if (bc) bc.onmessage = (e) => notify(e.data.k, e.data.state);
  window.addEventListener("storage", (e) => {
    if (e.key && e.key.startsWith("manaclash:")) notify(e.key, e.newValue ? JSON.parse(e.newValue) : null);
  });
  store = {
    mode: "local",
    write(room, team, state) {
      const k = keyOf(room, team);
      localStorage.setItem(k, JSON.stringify(state));
      if (bc) bc.postMessage({ k, state });
      notify(k, state);
      return Promise.resolve();
    },
    subscribe(room, team, cb) {
      const k = keyOf(room, team);
      (listeners[k] ||= []).push(cb);
      const raw = localStorage.getItem(k);
      cb(raw ? JSON.parse(raw) : null);
      return () => { listeners[k] = listeners[k].filter((f) => f !== cb); };
    },
  };
}

// ============================================================
//  VIEW ROUTING
// ============================================================
let currentRender = null; // called on window resize to reflow the active view

function showView(id) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  $("#" + id).classList.add("active");
}

function goHome() {
  teardownPlayer();
  teardownMaster();
  currentRender = null;
  showView("view-home");
}

// ============================================================
//  CARD ELEMENT BUILDER
// ============================================================
function makeCardEl(card, readonly) {
  const el = document.createElement("div");
  el.className = "card";
  el.dataset.id = card.id;

  const img = document.createElement("img");
  img.src = card.image;
  img.alt = card.name;
  img.draggable = false;
  img.addEventListener("error", () => el.classList.add("no-img"));

  const fb = document.createElement("div");
  fb.className = "card-fallback";
  fb.innerHTML =
    `<div class="cf-mana">${card.mana}</div>` +
    `<div class="cf-name">${card.name}</div>` +
    `<div class="cf-desc">${card.description || ""}</div>`;

  el.append(img, fb);
  if (!readonly) el.addEventListener("pointerdown", (e) => startDrag(e, el, card.id));
  return el;
}

function positionInField(el, pos, rect) {
  const cw = el.offsetWidth || 120;
  const ch = el.offsetHeight || 168;
  let left = pos.x * rect.width - cw / 2;
  let top = pos.y * rect.height - ch / 2;
  left = Math.max(0, Math.min(rect.width - cw, left));
  top = Math.max(0, Math.min(rect.height - ch, top));
  el.style.position = "absolute";
  el.style.left = left + "px";
  el.style.top = top + "px";
}

// ============================================================
//  PLAYER GAME
// ============================================================
let myState = { cards: {} };
let mySub = null;
let cardEls = {};
let zTop = 10;

function startGame(tid) {
  teamId = tid;
  const team = TEAMS.find((t) => t.id === tid);
  $("#gameTeamName").textContent = `${team.name} · Room ${room}`;
  $("#gameTeamName").style.color = team.color;
  $("#manaMax").textContent = MANA_LIMIT;

  // build this team's hand once, reuse the elements
  cardEls = {};
  $("#hand").innerHTML = "";
  $("#field").querySelectorAll(".card").forEach((c) => c.remove());
  for (const c of CARDS[tid] || []) {
    const el = makeCardEl(cardById[c.id], false);
    cardEls[c.id] = el;
    $("#hand").appendChild(el);
  }

  if (mySub) mySub();
  mySub = store.subscribe(room, tid, (state) => {
    if (dragActive) return;                 // don't yank a card out mid-drag
    myState = state && state.cards ? { cards: { ...state.cards } } : { cards: {} };
    renderPlayer();
  });

  currentRender = renderPlayer;
  showView("view-game");
}

function teardownPlayer() {
  if (mySub) { mySub(); mySub = null; }
}

function renderPlayer() {
  const field = $("#field");
  const rect = field.getBoundingClientRect();
  for (const id in cardEls) {
    const el = cardEls[id];
    const placed = myState.cards[id];
    if (placed) {
      el.classList.add("placed");
      field.appendChild(el);
      positionInField(el, placed, rect);
    } else {
      el.classList.remove("placed");
      el.style.cssText = ""; // back into normal hand flow
      $("#hand").appendChild(el);
    }
  }
  $("#manaLeft").textContent = MANA_LIMIT - usedMana(myState);
}

function commitPlayer() {
  store.write(room, teamId, { cards: myState.cards, used: usedMana(myState) })
    .catch((error) => {
      console.error("Could not save the board.", error);
      showToast("Could not save. Check your Firebase rules.");
    });
}

// ---- Free drag anywhere on the page ----
let drag = null;
let dragActive = false;

function startDrag(e, el, id) {
  e.preventDefault();
  dragActive = true;
  const r = el.getBoundingClientRect();
  drag = { el, id, offX: e.clientX - r.left, offY: e.clientY - r.top };
  try { el.setPointerCapture(e.pointerId); } catch (_) {}
  el.classList.add("dragging");
  document.body.appendChild(el);
  el.style.position = "fixed";
  el.style.zIndex = 9999;
  el.style.margin = "0";
  moveDrag(e.clientX, e.clientY);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
}
function moveDrag(x, y) {
  drag.el.style.left = x - drag.offX + "px";
  drag.el.style.top = y - drag.offY + "px";
}
function onMove(e) { if (drag) moveDrag(e.clientX, e.clientY); }
function onUp() {
  if (!drag) return;
  window.removeEventListener("pointermove", onMove);
  window.removeEventListener("pointerup", onUp);
  window.removeEventListener("pointercancel", onUp);
  const { el, id } = drag;
  el.classList.remove("dragging");

  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const fr = $("#field").getBoundingClientRect();
  const inField = cx >= fr.left && cx <= fr.right && cy >= fr.top && cy <= fr.bottom;

  drag = null;
  dragActive = false;

  if (inField) {
    const already = !!myState.cards[id];
    if (!already && usedMana(myState) + cardMana(id) > MANA_LIMIT) {
      flashMana(`Not enough mana for ${cardById[id].name} (costs ${cardMana(id)})`);
    } else {
      myState.cards[id] = {
        x: (cx - fr.left) / fr.width,
        y: (cy - fr.top) / fr.height,
      };
      el.style.zIndex = ++zTop;
      commitPlayer();
    }
  } else if (myState.cards[id]) {
    delete myState.cards[id]; // dropped off the field → back to the hand
    commitPlayer();
  }
  renderPlayer();
}

// ============================================================
//  GAME MASTER
// ============================================================
let masterSubs = [];
let masterStates = {};
let masterView = "all";
let masterCardEls = {};

function goMaster() {
  $("#masterRoom").textContent = room;

  // build read-only card elements for every team once
  masterCardEls = {};
  for (const t of TEAMS) {
    masterCardEls[t.id] = {};
    for (const c of CARDS[t.id] || []) masterCardEls[t.id][c.id] = makeCardEl(cardById[c.id], true);
  }

  masterView = teamId && TEAMS.some((team) => team.id === teamId) ? teamId : "all";
  buildMasterTabs();

  teardownMaster();
  for (const t of TEAMS) {
    const unsub = store.subscribe(room, t.id, (state) => {
      masterStates[t.id] = state || { cards: {} };
      if (isActive("view-master")) renderMaster();
    });
    masterSubs.push(unsub);
  }

  currentRender = renderMaster;
  showView("view-master");
  renderMaster();
}

function teardownMaster() {
  masterSubs.forEach((u) => u && u());
  masterSubs = [];
}

function buildMasterTabs() {
  const tabs = $("#masterTabs");
  tabs.innerHTML = "";
  const opts = [{ id: "all", name: "All teams" }, ...TEAMS];
  for (const o of opts) {
    const b = document.createElement("button");
    b.className = "tab" + (o.id === masterView ? " active" : "");
    b.textContent = o.name;
    b.dataset.tab = o.id;
    b.onclick = () => {
      masterView = o.id;
      tabs.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === o.id));
      renderMaster();
    };
    tabs.appendChild(b);
  }
}

function renderMaster() {
  const content = $("#masterContent");
  content.className = "master-content " + (masterView === "all" ? "grid" : "single");
  content.innerHTML = "";

  const teams = masterView === "all" ? TEAMS : TEAMS.filter((t) => t.id === masterView);
  for (const t of teams) {
    const state = masterStates[t.id] || { cards: {} };
    const wrap = document.createElement("div");
    wrap.className = "master-team";

    const head = document.createElement("div");
    head.className = "master-team-head";
    head.innerHTML =
      `<span style="color:${t.color}">${t.name}</span>` +
      `<span class="mana-pill">${usedMana(state)} / ${MANA_LIMIT} mana used</span>`;

    const field = document.createElement("div");
    field.className = "field master-field";

    wrap.append(head, field);
    content.appendChild(wrap);

    // place cards after the field has layout
    const rect = field.getBoundingClientRect();
    for (const id in state.cards) {
      const el = masterCardEls[t.id]?.[id];
      if (!el) continue;
      field.appendChild(el);
      positionInField(el, state.cards[id], rect);
    }
    if (Object.keys(state.cards).length === 0) {
      const empty = document.createElement("div");
      empty.className = "field-label";
      empty.textContent = "No cards placed yet";
      field.appendChild(empty);
    }
  }
}

// ============================================================
//  UI HELPERS
// ============================================================
const isActive = (id) => $("#" + id).classList.contains("active");
let toastTimer = null;
function flashMana(msg) {
  $(".mana-box")?.classList.add("flash");
  setTimeout(() => $(".mana-box")?.classList.remove("flash"), 500);
  showToast(msg);
}
function showToast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

function buildTeamSelect() {
  const box = $("#teamButtons");
  box.innerHTML = "";
  for (const t of TEAMS) {
    const b = document.createElement("button");
    b.className = "team-btn";
    b.textContent = t.name;
    b.style.setProperty("--team-color", t.color);
    b.onclick = () => startGame(t.id);
    box.appendChild(b);
  }
}

function updateBadge() {
  const badge = $("#rtBadge");
  if (store.mode === "online") {
    badge.textContent = "● Online";
    badge.classList.add("online");
  } else {
    badge.textContent = "● Local only";
    badge.classList.add("local");
    badge.title = "Add your Firebase config to play across devices (see README).";
  }
}

// ============================================================
//  INIT
// ============================================================
function readRoom() {
  const normalized = normalizeRoom($("#roomInput").value);
  $("#roomInput").value = normalized;
  return normalized;
}

async function main() {
  $("#gameTitle").textContent = GAME_TITLE;
  document.title = GAME_TITLE;
  $("#roomInput").value = room;

  $("#startBtn").onclick = () => { room = readRoom(); buildTeamSelect(); showView("view-team"); };
  $("#masterBtn").onclick = () => { room = readRoom(); goMaster(); };
  document.querySelectorAll("[data-back]").forEach((b) => (b.onclick = goHome));
  window.addEventListener("resize", () => currentRender && currentRender());

  await initStore();
  updateBadge();

  // Deep links: ?room=CODE&role=master  or  ?room=CODE&team=team1
  if (role === "master") goMaster();
  else if (teamId && CARDS[teamId]) startGame(teamId);
  else showView("view-home");
}

main();
