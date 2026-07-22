import { firebaseConfig } from "./firebase-config.js";
import {
  GAME_TITLE,
  TOTAL_ROUNDS,
  ROUND_CAPACITY,
  METRIC_LABELS,
  ROLE_LABELS,
  DECISION_MODES,
  EVENTS,
  TEAMS,
  CASES,
  ALL_CASES,
} from "./data.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const params = new URLSearchParams(location.search);

const normalizeRoom = (value) => {
  const cleaned = String(value || "MAIN")
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 12);
  return cleaned || "MAIN";
};

const clone = (value) => JSON.parse(JSON.stringify(value));
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const teamById = (id) => TEAMS.find((team) => team.id === id);
const modeById = (id) => DECISION_MODES.find((mode) => mode.id === id);
const eventById = (id) => EVENTS.find((event) => event.id === id) || EVENTS[0];

let room = normalizeRoom(params.get("room"));
let role = params.get("role");
let teamId = params.get("team");
let store;
let toastTimer;
let draggedCardId = null;

const defaultMeta = () => ({
  round: 1,
  phase: "planning",
  events: { 1: "none" },
  updatedAt: Date.now(),
});

const defaultTeamState = () => ({
  roles: Object.fromEntries(ROLE_LABELS.map((roleItem) => [roleItem.id, ""])),
  note: "",
  decisions: {},
  submitted: {},
  updatedAt: Date.now(),
});

const normalizeMeta = (value) => ({
  ...defaultMeta(),
  ...(value || {}),
  events: { ...(value?.events || {}) },
});

const normalizeTeamState = (value) => ({
  ...defaultTeamState(),
  ...(value || {}),
  roles: { ...defaultTeamState().roles, ...(value?.roles || {}) },
  decisions: { ...(value?.decisions || {}) },
  submitted: { ...(value?.submitted || {}) },
});

// ============================================================
// REALTIME STORE — Firebase, vagy helyi tartalék mód
// ============================================================
const FIREBASE_SDK_VERSION = "12.16.0";
const REQUIRED_CONFIG_KEYS = ["apiKey", "authDomain", "databaseURL", "projectId", "appId"];
const configValid = REQUIRED_CONFIG_KEYS.every((key) => {
  const value = firebaseConfig[key];
  return value && !String(value).includes("YOUR_");
});

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
        set(path, value) {
          return set(ref(db, path), value);
        },
        subscribe(path, callback) {
          return onValue(
            ref(db, path),
            (snapshot) => callback(snapshot.val()),
            (error) => {
              console.error("Firebase subscription failed", error);
              showToast("A valós idejű kapcsolat megszakadt. Ellenőrizd a Firebase-szabályokat.", "error");
            },
          );
        },
      };
      return;
    } catch (error) {
      console.error("Firebase initialization failed; local mode is used.", error);
    }
  }

  const channel = "BroadcastChannel" in window ? new BroadcastChannel("vezetoi-valsagstab") : null;
  const listeners = {};
  const keyOf = (path) => `vezetoi-valsagstab:${path}`;
  const notify = (key, value) => (listeners[key] || []).forEach((callback) => callback(value));

  if (channel) channel.onmessage = (event) => notify(event.data.key, event.data.value);
  window.addEventListener("storage", (event) => {
    if (!event.key?.startsWith("vezetoi-valsagstab:")) return;
    notify(event.key, event.newValue ? JSON.parse(event.newValue) : null);
  });

  store = {
    mode: "local",
    set(path, value) {
      const key = keyOf(path);
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(value));
      channel?.postMessage({ key, value });
      notify(key, value);
      return Promise.resolve();
    },
    subscribe(path, callback) {
      const key = keyOf(path);
      (listeners[key] ||= []).push(callback);
      const raw = localStorage.getItem(key);
      callback(raw ? JSON.parse(raw) : null);
      return () => {
        listeners[key] = (listeners[key] || []).filter((item) => item !== callback);
      };
    },
  };
}

// ============================================================
// JÁTÉKLOGIKA
// ============================================================
function currentEvent(meta, round = meta.round) {
  return eventById(meta.events?.[round] || "none");
}

function availableCapacity(meta) {
  return Math.max(0, (ROUND_CAPACITY[meta.round] || 0) + currentEvent(meta).capacityModifier);
}

function decisionCost(card, modeId, event) {
  let cost;
  if (modeId === "resolve") cost = card.capacity;
  else if (modeId === "stabilize") cost = Math.max(1, Math.ceil(card.capacity / 2));
  else if (modeId === "delegate") cost = 1;
  else cost = 0;

  if (event.id === "partner_offer" && modeId === "delegate") cost = 0;
  if (event.id === "system_window" && modeId === "resolve" && card.systemic >= 2) cost = Math.max(1, cost - 1);
  if (event.id === "legal_review" && ["resolve", "stabilize"].includes(modeId) && card.fairness >= 2) cost += 1;
  return cost;
}

function roundCases(team, round) {
  return (CASES[team] || []).filter((card) => card.round === round);
}

function roundDecisions(state, round) {
  return Object.entries(state.decisions || {})
    .filter(([, decision]) => Number(decision.round) === Number(round))
    .map(([cardId, decision]) => ({ cardId, ...decision }));
}

function usedCapacity(state, meta, round = meta.round) {
  const event = currentEvent(meta, round);
  return roundDecisions(state, round).reduce((sum, decision) => {
    const card = ALL_CASES[decision.cardId];
    return card ? sum + decisionCost(card, decision.mode, event) : sum;
  }, 0);
}

function outcomeFor(card, modeId, event) {
  const delta = { trust: 0, fairness: 0, stability: 0, learning: 0, risk: 0 };
  let text = "";

  if (modeId === "resolve") {
    delta.trust += card.fairness >= 2 ? 2 : 1;
    delta.fairness += card.fairness >= 2 ? 2 : 1;
    delta.stability += card.urgency >= 2 ? 2 : 1;
    delta.learning += card.systemic >= 2 ? 1 : 0;
    delta.risk -= 2;
    text = card.systemic >= 2
      ? "Érdemi beavatkozás történt, és a csapat a kiváltó okot is kezelni kezdte. Ez erősíti a bizalmat és csökkenti a visszatérés esélyét."
      : "Az ügy gyors, érdemi kezelést kapott. A közvetlen kár és a határidős kockázat jelentősen csökkent."
  } else if (modeId === "stabilize") {
    delta.trust += card.urgency >= 3 ? 1 : 0;
    delta.fairness += card.fairness >= 3 ? 1 : 0;
    delta.stability += 1;
    delta.risk += card.systemic >= 2 ? 1 : 0;
    text = card.systemic >= 2
      ? "A legsürgősebb következményt sikerült fékezni, de a rendszerszintű ok megmaradt. A kérdés egy későbbi fordulóban vagy a valós működésben visszatérhet."
      : "A csapat időt nyert és csökkentette az azonnali kárt, de a végleges megoldás és annak felelőse még nincs teljesen rendezve."
  } else if (modeId === "delegate") {
    delta.fairness += card.fairness >= 3 ? -1 : 0;
    delta.stability += card.coordination <= 1 ? 1 : 0;
    delta.learning += card.systemic >= 3 ? -1 : 0;
    delta.risk += card.urgency >= 3 ? 2 : 1;
    text = card.coordination >= 3
      ? "A bevont partner szakértelmet hozhat, de a sokszereplős koordináció miatt nőtt a gazdátlanság és a határidőcsúszás veszélye."
      : "A delegálás tehermentesítette a csapatot. Az eredmény azon múlik, hogy a felelősség, a határidő és a visszacsatolás egyértelmű-e."
  } else {
    delta.trust -= card.fairness >= 2 ? 2 : 1;
    delta.fairness -= card.fairness >= 2 ? 2 : 1;
    delta.stability -= card.urgency >= 2 ? 2 : 1;
    delta.learning -= card.systemic >= 2 ? 1 : 0;
    delta.risk += card.urgency + card.systemic >= 5 ? 3 : 2;
    text = card.urgency >= 3
      ? "A beavatkozás elmaradt egy sürgős ügyben. A csapat megőrizte a kapacitását, de nőtt a visszafordíthatatlan kár és a bizalomvesztés esélye."
      : "A csapat tudatosan más ügyeket helyezett előre. A halasztás rövid távon ingyenes volt, de felhalmozott kockázatot hagyott maga után."
  }

  const additions = [];
  if (event.id === "public_attention" && modeId === "defer") {
    delta.trust -= 1;
    additions.push("A nyilvánosság miatt a bizalomvesztés erősebb lett.");
  }
  if (event.id === "deadline_wave" && card.urgency >= 3 && modeId !== "resolve") {
    delta.risk += 1;
    additions.push("A közelgő határidők tovább növelték a kockázatot.");
  }
  if (event.id === "partner_offer" && modeId === "delegate") {
    delta.risk -= 1;
    additions.push("A felajánlott partner csökkentette a koordinációs kockázatot.");
  }
  if (event.id === "system_window" && modeId === "resolve" && card.systemic >= 2) {
    delta.learning += 1;
    additions.push("A fejlesztési ablak extra szervezeti tanulást tett lehetővé.");
  }
  if (event.id === "legal_review" && ["resolve", "stabilize"].includes(modeId) && card.fairness >= 2) {
    delta.fairness += 1;
    additions.push("A részletes dokumentálás erősítette a méltányosságot és az indokolhatóságot.");
  }

  delta.risk = Math.max(-2, delta.risk);
  return { delta, text: `${text}${additions.length ? ` ${additions.join(" ")}` : ""}` };
}

function revealedRounds(meta) {
  const rounds = [];
  for (let round = 1; round < meta.round; round += 1) rounds.push(round);
  if (["reveal", "finished"].includes(meta.phase)) rounds.push(meta.round);
  return rounds;
}

function calculateMetrics(state, meta) {
  const metrics = { trust: 5, fairness: 5, stability: 5, learning: 5, risk: 0 };
  const details = [];
  const rounds = new Set(revealedRounds(meta));

  Object.entries(state.decisions || {}).forEach(([cardId, decision]) => {
    if (!rounds.has(Number(decision.round))) return;
    const card = ALL_CASES[cardId];
    if (!card) return;
    const event = currentEvent(meta, Number(decision.round));
    const outcome = outcomeFor(card, decision.mode, event);
    Object.entries(outcome.delta).forEach(([key, value]) => { metrics[key] += value; });
    details.push({ card, decision, event, outcome });
  });

  ["trust", "fairness", "stability", "learning"].forEach((key) => {
    metrics[key] = clamp(metrics[key], 0, 10);
  });
  metrics.risk = Math.max(0, metrics.risk);
  return { metrics, details };
}

function phaseLabel(phase) {
  if (phase === "reveal") return "Következmények";
  if (phase === "finished") return "Lezárva";
  return "Tervezés";
}

// ============================================================
// NÉZETEK ÉS KÖZÖS UI
// ============================================================
let currentView = "view-home";
function showView(id) {
  $$(".view").forEach((view) => view.classList.remove("active"));
  $(`#${id}`).classList.add("active");
  currentView = id;
  window.scrollTo({ top: 0, behavior: "auto" });
}

function goHome() {
  teardownPlayer();
  teardownMaster();
  closeModal();
  showView("view-home");
}

function showToast(message, type = "") {
  const toast = $("#toast");
  toast.textContent = message;
  toast.className = `toast show ${type}`.trim();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.className = "toast"; }, 2600);
}

function updateBadge() {
  const badge = $("#rtBadge");
  badge.className = `rt-badge ${store.mode === "online" ? "online" : "local"}`;
  badge.textContent = store.mode === "online" ? "● Online" : "● Helyi mód";
  badge.title = store.mode === "online"
    ? "Firebase valós idejű kapcsolat aktív."
    : "A játék csak ezen a böngészőn belül szinkronizál. Ellenőrizd a Firebase-konfigurációt.";
}

function readRoom() {
  room = normalizeRoom($("#roomInput").value);
  $("#roomInput").value = room;
  return room;
}

function renderEventBanner(element, event) {
  element.innerHTML = "";
  const title = document.createElement("strong");
  title.textContent = `Esemény: ${event.name}`;
  const description = document.createElement("p");
  description.textContent = event.description;
  const effect = document.createElement("span");
  effect.className = "event-effect";
  effect.textContent = event.effect;
  element.append(title, description, effect);
}

function openRules() {
  $("#rulesModal").classList.add("open");
  $("#rulesModal").setAttribute("aria-hidden", "false");
}
function closeRules() {
  $("#rulesModal").classList.remove("open");
  $("#rulesModal").setAttribute("aria-hidden", "true");
}

// ============================================================
// CSAPATJÁTÉKOS NÉZET
// ============================================================
let playerMeta = defaultMeta();
let playerState = defaultTeamState();
let playerUnsubs = [];

function teardownPlayer() {
  playerUnsubs.forEach((unsubscribe) => unsubscribe?.());
  playerUnsubs = [];
}

async function startGame(selectedTeamId) {
  teardownPlayer();
  teamId = selectedTeamId;
  const team = teamById(teamId);
  if (!team) return;

  $("#gameTeamName").textContent = team.name;
  $("#gameTeamName").style.color = team.color;
  $("#playerRoomLabel").textContent = `Szoba: ${room}`;
  buildRoleFields();

  playerUnsubs.push(store.subscribe(`games/${room}/meta`, (value) => {
    playerMeta = normalizeMeta(value);
    renderPlayer();
  }));
  playerUnsubs.push(store.subscribe(`games/${room}/teams/${teamId}`, (value) => {
    playerState = normalizeTeamState(value);
    renderPlayer();
  }));

  showView("view-game");
  renderPlayer();
}

function buildRoleFields() {
  const box = $("#roleFields");
  box.innerHTML = "";
  ROLE_LABELS.forEach((roleItem) => {
    const label = document.createElement("label");
    label.className = "role-field";
    label.textContent = roleItem.label;
    const input = document.createElement("input");
    input.id = `role-${roleItem.id}`;
    input.maxLength = 60;
    input.placeholder = "Név vagy becenév";
    const hint = document.createElement("small");
    hint.textContent = roleItem.hint;
    label.append(input, hint);
    box.appendChild(label);
  });
}

function syncRoleFields() {
  ROLE_LABELS.forEach((roleItem) => {
    const input = $(`#role-${roleItem.id}`);
    if (input && document.activeElement !== input) input.value = playerState.roles?.[roleItem.id] || "";
  });
  if (document.activeElement !== $("#teamNote")) $("#teamNote").value = playerState.note || "";
}

async function saveRoles() {
  playerState.roles = Object.fromEntries(ROLE_LABELS.map((roleItem) => [
    roleItem.id,
    $(`#role-${roleItem.id}`).value.trim(),
  ]));
  playerState.note = $("#teamNote").value.trim();
  playerState.updatedAt = Date.now();
  await savePlayerState("A szerepek és a döntési elv elmentve.");
}

function playerEditable() {
  return playerMeta.phase === "planning" && !playerState.submitted?.[playerMeta.round];
}

function currentTeamColor() {
  return teamById(teamId)?.color || "#8b5cf6";
}

function makeCaseCard(card, compact = false) {
  const article = document.createElement("article");
  article.className = `case-card${playerEditable() ? "" : " locked"}`;
  article.style.setProperty("--team-color", currentTeamColor());
  article.draggable = playerEditable();
  article.dataset.cardId = card.id;

  const top = document.createElement("div");
  top.className = "card-top";
  const cost = document.createElement("div");
  cost.className = "cost-orb";
  cost.textContent = card.capacity;
  const titleWrap = document.createElement("div");
  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = card.name;
  const round = document.createElement("span");
  round.className = "card-round";
  round.textContent = `${card.round}. forduló · érdemi kezelés: ${card.capacity} pont`;
  titleWrap.append(title, round);
  top.append(cost, titleWrap);

  const description = document.createElement("p");
  description.textContent = compact && card.description.length > 180
    ? `${card.description.slice(0, 177)}…`
    : card.description;

  const tags = document.createElement("div");
  tags.className = "card-tags";
  [
    `Sürgősség ${card.urgency}/3`,
    `Méltányosság ${card.fairness}/3`,
    `Rendszerhatás ${card.systemic}/3`,
  ].forEach((text) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = text;
    tags.appendChild(tag);
  });

  const action = document.createElement("button");
  action.className = "card-action";
  action.type = "button";
  action.textContent = playerEditable() ? "Részletek és döntés →" : "Részletek →";
  action.addEventListener("click", (event) => {
    event.stopPropagation();
    openCaseModal(card.id);
  });

  article.append(top, description, tags, action);
  article.addEventListener("click", () => openCaseModal(card.id));
  article.addEventListener("dragstart", (event) => {
    if (!playerEditable()) return event.preventDefault();
    draggedCardId = card.id;
    article.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", card.id);
  });
  article.addEventListener("dragend", () => {
    article.classList.remove("dragging");
    draggedCardId = null;
  });
  return article;
}

function makeZoneCard(card, decision) {
  const element = document.createElement("div");
  element.className = "zone-card";
  element.style.setProperty("--team-color", currentTeamColor());
  element.tabIndex = 0;
  const event = currentEvent(playerMeta);
  const cost = decisionCost(card, decision.mode, event);
  const title = document.createElement("strong");
  title.textContent = card.name;
  const meta = document.createElement("span");
  meta.textContent = `${cost} kapacitáspont · kattints a módosításhoz`;
  element.append(title, meta);
  element.addEventListener("click", () => openCaseModal(card.id));
  element.addEventListener("keydown", (keyboardEvent) => {
    if (["Enter", " "].includes(keyboardEvent.key)) {
      keyboardEvent.preventDefault();
      openCaseModal(card.id);
    }
  });
  return element;
}

function renderDecisionBoard() {
  const board = $("#decisionBoard");
  board.innerHTML = "";
  const event = currentEvent(playerMeta);
  const decisions = playerState.decisions || {};

  DECISION_MODES.forEach((mode) => {
    const zone = document.createElement("section");
    zone.className = "decision-zone";
    zone.dataset.mode = mode.id;

    const cards = roundCases(teamId, playerMeta.round)
      .filter((card) => decisions[card.id]?.mode === mode.id);
    const zoneCost = cards.reduce((sum, card) => sum + decisionCost(card, mode.id, event), 0);

    const head = document.createElement("div");
    head.className = "zone-head";
    const titleWrap = document.createElement("div");
    titleWrap.className = "zone-title";
    const icon = document.createElement("span");
    icon.className = "zone-icon";
    icon.textContent = mode.icon;
    const texts = document.createElement("div");
    const title = document.createElement("b");
    title.textContent = mode.label;
    const short = document.createElement("small");
    short.textContent = mode.short;
    texts.append(title, short);
    titleWrap.append(icon, texts);
    const costLabel = document.createElement("span");
    costLabel.className = "zone-cost";
    costLabel.textContent = `${zoneCost} pont`;
    head.append(titleWrap, costLabel);

    const list = document.createElement("div");
    list.className = "zone-cards";
    if (cards.length) cards.forEach((card) => list.appendChild(makeZoneCard(card, decisions[card.id])));
    else {
      const empty = document.createElement("div");
      empty.className = "zone-empty";
      empty.textContent = playerEditable() ? "Húzz ide egy ügyet" : "Nincs ide helyezett ügy";
      list.appendChild(empty);
    }

    zone.append(head, list);
    zone.addEventListener("dragover", (dragEvent) => {
      if (!playerEditable()) return;
      dragEvent.preventDefault();
      zone.classList.add("drag-over");
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
    zone.addEventListener("drop", (dropEvent) => {
      if (!playerEditable()) return;
      dropEvent.preventDefault();
      zone.classList.remove("drag-over");
      const cardId = dropEvent.dataTransfer.getData("text/plain") || draggedCardId;
      if (cardId) moveDecision(cardId, mode.id);
    });
    board.appendChild(zone);
  });
}

function renderCaseHand() {
  const hand = $("#caseHand");
  hand.innerHTML = "";
  const undecided = roundCases(teamId, playerMeta.round)
    .filter((card) => !playerState.decisions?.[card.id]);

  if (!undecided.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = playerEditable()
      ? "Minden aktuális ügy döntési zónába került. Ellenőrizzétek a teljes portfóliót, majd véglegesítsetek."
      : "Ebben a fordulóban minden ügyhöz tartozik döntés.";
    hand.appendChild(empty);
  } else {
    undecided.forEach((card) => hand.appendChild(makeCaseCard(card, true)));
  }

  hand.ondragover = (event) => {
    if (playerEditable()) event.preventDefault();
  };
  hand.ondrop = (event) => {
    if (!playerEditable()) return;
    event.preventDefault();
    const cardId = event.dataTransfer.getData("text/plain") || draggedCardId;
    if (cardId) removeDecision(cardId);
  };
}

function renderPlayer() {
  if (currentView !== "view-game") return;
  const team = teamById(teamId);
  if (!team) return;

  $("#roundNumber").textContent = `${playerMeta.round}.`;
  $("#phaseLabel").textContent = phaseLabel(playerMeta.phase);
  const max = availableCapacity(playerMeta);
  const used = usedCapacity(playerState, playerMeta);
  $("#capacityMax").textContent = max;
  $("#capacityLeft").textContent = Math.max(0, max - used);
  renderEventBanner($("#eventBanner"), currentEvent(playerMeta));
  syncRoleFields();
  renderCaseHand();
  renderDecisionBoard();

  const submitted = Boolean(playerState.submitted?.[playerMeta.round]);
  const status = $("#submitStatus");
  status.textContent = submitted ? "✓ Véglegesítve" : "Még szerkeszthető";
  status.className = `status-chip${submitted ? " ready" : ""}`;

  const over = used > max;
  const capacityMessage = $("#capacityMessage");
  capacityMessage.textContent = over
    ? `A döntési csomag ${used - max} ponttal túllépi a keretet.`
    : `${used} pont felhasználva · ${Math.max(0, max - used)} pont maradt.`;
  capacityMessage.className = `capacity-message${over ? " over" : ""}`;

  $("#submitBtn").classList.toggle("hidden", submitted || playerMeta.phase !== "planning");
  $("#submitBtn").disabled = over;
  $("#unsubmitBtn").classList.toggle("hidden", !submitted || playerMeta.phase !== "planning");
  $("#saveRolesBtn").disabled = playerMeta.phase === "finished";

  renderOutcomePanel();
}

function renderOutcomePanel() {
  const panel = $("#outcomePanel");
  const visible = ["reveal", "finished"].includes(playerMeta.phase);
  panel.classList.toggle("hidden", !visible);
  if (!visible) return;

  const { metrics, details } = calculateMetrics(playerState, playerMeta);
  const currentDetails = details.filter((item) => Number(item.decision.round) === Number(playerMeta.round));
  panel.innerHTML = "";

  const eyebrow = document.createElement("span");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = playerMeta.phase === "finished" ? "Játék végi profil" : "Felfedett következmények";
  const heading = document.createElement("h2");
  heading.textContent = playerMeta.phase === "finished"
    ? "A csapat vezetői lenyomata"
    : `${playerMeta.round}. forduló: mit eredményezett a döntési portfólió?`;
  const intro = document.createElement("p");
  intro.className = "helper";
  intro.textContent = "A mutatók és szövegek vitaindító modellként szolgálnak. Nem helyettesítik a résztvevők szakmai érvelését, és nem jelentenek egyetlen kötelezően helyes választ.";

  const metricsBox = document.createElement("div");
  metricsBox.className = "metrics-grid";
  Object.entries(METRIC_LABELS).forEach(([key, label]) => {
    const card = document.createElement("div");
    card.className = `metric-card${key === "risk" ? " risk" : ""}`;
    const name = document.createElement("span");
    name.textContent = label;
    const value = document.createElement("b");
    value.textContent = key === "risk" ? metrics[key] : `${metrics[key]}/10`;
    card.append(name, value);
    metricsBox.appendChild(card);
  });

  const list = document.createElement("div");
  list.className = "outcome-list";
  (playerMeta.phase === "finished" ? details : currentDetails).forEach((item) => {
    const row = document.createElement("article");
    row.className = "outcome-item";
    const title = document.createElement("b");
    title.textContent = `${item.card.name} — ${modeById(item.decision.mode)?.label || item.decision.mode}`;
    const text = document.createElement("p");
    text.textContent = item.outcome.text;
    row.append(title, text);
    list.appendChild(row);
  });

  const reflection = document.createElement("div");
  reflection.className = "reflection-box";
  reflection.innerHTML = `
    <b>Reflexiós kérdések</b>
    <ul>
      <li>Melyik döntést tudjátok a legjobban megindokolni az érintettek előtt?</li>
      <li>Hol választottatok gyors stabilizálást tartós megoldás helyett?</li>
      <li>Melyik felhalmozott kockázatot vállaltátok tudatosan, és miért?</li>
      <li>Mit változtatnátok meg, ha még 2 kapacitáspontotok lenne — és mit, ha kettővel kevesebb?</li>
    </ul>`;

  panel.append(eyebrow, heading, intro, metricsBox, list, reflection);
}

async function savePlayerState(successMessage = "") {
  playerState.updatedAt = Date.now();
  try {
    await store.set(`games/${room}/teams/${teamId}`, clone(playerState));
    if (successMessage) showToast(successMessage, "success");
  } catch (error) {
    console.error(error);
    showToast("A döntést nem sikerült menteni. Ellenőrizd a Firebase-szabályokat.", "error");
  }
}

async function moveDecision(cardId, modeId) {
  if (!playerEditable()) return showToast("A forduló jelenleg nem szerkeszthető.", "error");
  const card = ALL_CASES[cardId];
  if (!card || card.round !== playerMeta.round || !(CASES[teamId] || []).some((item) => item.id === cardId)) return;

  const draft = clone(playerState);
  draft.decisions[cardId] = { mode: modeId, round: playerMeta.round };
  const projected = usedCapacity(draft, playerMeta);
  if (projected > availableCapacity(playerMeta)) {
    return showToast(`Ehhez a döntéshez még ${projected - availableCapacity(playerMeta)} kapacitáspont hiányzik.`, "error");
  }

  playerState = draft;
  closeModal();
  renderPlayer();
  await savePlayerState();
}

async function removeDecision(cardId) {
  if (!playerEditable() || !playerState.decisions?.[cardId]) return;
  delete playerState.decisions[cardId];
  closeModal();
  renderPlayer();
  await savePlayerState();
}

async function submitTeam() {
  if (playerMeta.phase !== "planning") return;
  const draft = clone(playerState);
  roundCases(teamId, playerMeta.round).forEach((card) => {
    if (!draft.decisions[card.id]) draft.decisions[card.id] = { mode: "defer", round: playerMeta.round };
  });
  if (usedCapacity(draft, playerMeta) > availableCapacity(playerMeta)) {
    return showToast("A döntési csomag túllépi a kapacitáskeretet.", "error");
  }
  draft.submitted[playerMeta.round] = true;
  playerState = draft;
  renderPlayer();
  await savePlayerState("A döntési portfólió véglegesítve. Várjátok meg a játékmestert!");
}

async function unsubmitTeam() {
  if (playerMeta.phase !== "planning") return;
  playerState.submitted[playerMeta.round] = false;
  renderPlayer();
  await savePlayerState("A döntések ismét szerkeszthetők.");
}

function openCaseModal(cardId) {
  const card = ALL_CASES[cardId];
  if (!card) return;
  const current = playerState.decisions?.[cardId];
  const editable = playerEditable() && card.round === playerMeta.round;
  const event = currentEvent(playerMeta);
  const body = $("#modalBody");
  body.innerHTML = "";

  const head = document.createElement("div");
  head.className = "modal-case-head";
  const orb = document.createElement("div");
  orb.className = "cost-orb";
  orb.style.setProperty("--team-color", currentTeamColor());
  orb.textContent = card.capacity;
  const titleWrap = document.createElement("div");
  const eyebrow = document.createElement("span");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = `${card.round}. forduló · eredeti kapacitásigény`;
  const title = document.createElement("h2");
  title.id = "modalTitle";
  title.textContent = card.name;
  titleWrap.append(eyebrow, title);
  head.append(orb, titleWrap);

  const description = document.createElement("p");
  description.className = "modal-description";
  description.textContent = card.description;
  const focus = document.createElement("div");
  focus.className = "focus-box";
  focus.innerHTML = `<b>Vezetői fókusz</b><br>${card.focus}`;
  body.append(head, description, focus);

  const tags = document.createElement("div");
  tags.className = "card-tags";
  [
    `Sürgősség ${card.urgency}/3`,
    `Méltányosság ${card.fairness}/3`,
    `Rendszerhatás ${card.systemic}/3`,
    `Koordináció ${card.coordination}/3`,
  ].forEach((text) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = text;
    tags.appendChild(tag);
  });
  body.appendChild(tags);

  if (editable) {
    const options = document.createElement("div");
    options.className = "mode-options";
    DECISION_MODES.forEach((mode) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mode-option";
      const cost = decisionCost(card, mode.id, event);
      button.innerHTML = `<strong><span>${mode.icon} ${mode.label}</span><span class="mode-cost">${cost} pont</span></strong><span>${mode.description}</span>`;
      button.addEventListener("click", () => moveDecision(card.id, mode.id));
      options.appendChild(button);
    });
    body.appendChild(options);

    if (current) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "secondary-btn remove-decision";
      remove.textContent = "Visszateszem a még el nem döntött ügyek közé";
      remove.addEventListener("click", () => removeDecision(card.id));
      body.appendChild(remove);
    }
  } else if (current) {
    const selected = document.createElement("div");
    selected.className = "focus-box";
    selected.textContent = `Aktuális döntés: ${modeById(current.mode)?.label || current.mode}`;
    body.appendChild(selected);
  }

  $("#caseModal").classList.add("open");
  $("#caseModal").setAttribute("aria-hidden", "false");
}

function closeModal() {
  $("#caseModal").classList.remove("open");
  $("#caseModal").setAttribute("aria-hidden", "true");
}

// ============================================================
// JÁTÉKMESTER NÉZET
// ============================================================
let masterMeta = defaultMeta();
let masterStates = Object.fromEntries(TEAMS.map((team) => [team.id, defaultTeamState()]));
let masterUnsubs = [];
let masterView = "all";

function teardownMaster() {
  masterUnsubs.forEach((unsubscribe) => unsubscribe?.());
  masterUnsubs = [];
}

async function goMaster() {
  teardownMaster();
  $("#masterRoom").textContent = room;
  buildEventSelect();
  buildMasterTabs();

  let metaInitialized = false;
  masterUnsubs.push(store.subscribe(`games/${room}/meta`, async (value) => {
    masterMeta = normalizeMeta(value);
    if (!value && !metaInitialized) {
      metaInitialized = true;
      await store.set(`games/${room}/meta`, masterMeta);
    }
    renderMaster();
  }));

  TEAMS.forEach((team) => {
    masterUnsubs.push(store.subscribe(`games/${room}/teams/${team.id}`, (value) => {
      masterStates[team.id] = normalizeTeamState(value);
      renderMaster();
    }));
  });

  showView("view-master");
  renderMaster();
}

function buildEventSelect() {
  const select = $("#eventSelect");
  select.innerHTML = "";
  EVENTS.forEach((event) => {
    const option = document.createElement("option");
    option.value = event.id;
    option.textContent = event.name;
    select.appendChild(option);
  });
}

function buildMasterTabs() {
  const tabs = $("#masterTabs");
  tabs.innerHTML = "";
  [{ id: "all", name: "Összes csapat" }, ...TEAMS].forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `tab${masterView === item.id ? " active" : ""}`;
    button.textContent = item.name;
    button.addEventListener("click", () => {
      masterView = item.id;
      buildMasterTabs();
      renderMasterContent();
    });
    tabs.appendChild(button);
  });
}

function teamRoundStats(teamIdValue) {
  const state = masterStates[teamIdValue] || defaultTeamState();
  const decisions = roundDecisions(state, masterMeta.round);
  const counts = Object.fromEntries(DECISION_MODES.map((mode) => [mode.id, 0]));
  decisions.forEach((decision) => { if (counts[decision.mode] !== undefined) counts[decision.mode] += 1; });
  return {
    state,
    decisions,
    counts,
    used: usedCapacity(state, masterMeta),
    ready: Boolean(state.submitted?.[masterMeta.round]),
  };
}

function renderMaster() {
  if (currentView !== "view-master") return;
  $("#masterRound").textContent = `${masterMeta.round}.`;
  $("#masterPhase").textContent = phaseLabel(masterMeta.phase);
  $("#eventSelect").value = currentEvent(masterMeta).id;
  renderEventBanner($("#masterEventBanner"), currentEvent(masterMeta));

  const planning = masterMeta.phase === "planning";
  const reveal = masterMeta.phase === "reveal";
  const finished = masterMeta.phase === "finished";
  $("#eventSelect").disabled = !planning;
  $("#applyEventBtn").disabled = !planning;
  $("#revealBtn").classList.toggle("hidden", !planning);
  $("#nextRoundBtn").classList.toggle("hidden", !(reveal || finished));
  $("#nextRoundBtn").textContent = masterMeta.round < TOTAL_ROUNDS ? "Következő forduló" : "Játék lezárása";
  $("#nextRoundBtn").disabled = finished;
  $("#masterHint").textContent = planning
    ? "Várd meg a csapatok véglegesítését, majd fedd fel a következményeket. A rendszer nem tiltja a korábbi felfedést: a játékmester dönt a tempóról."
    : reveal
      ? "Beszéljétek meg a döntések hatását, majd lépjetek tovább a következő fordulóra."
      : "A játék lezárult. Használd a csapatfüleket az összegzéshez és a feldolgozáshoz.";

  renderMasterSummary();
  renderMasterContent();
}

function renderMasterSummary() {
  const box = $("#masterSummary");
  box.innerHTML = "";
  TEAMS.forEach((team) => {
    const stats = teamRoundStats(team.id);
    const { metrics } = calculateMetrics(stats.state, masterMeta);
    const card = document.createElement("article");
    card.className = "summary-card";
    card.style.borderColor = `color-mix(in srgb, ${team.color} 48%, var(--line))`;
    const name = document.createElement("strong");
    name.textContent = team.short;
    name.style.color = team.color;
    const ready = document.createElement("div");
    ready.className = `ready-line${stats.ready ? " ready" : ""}`;
    ready.textContent = stats.ready ? "✓ Döntések véglegesítve" : "○ Még dolgozik";
    const numbers = document.createElement("div");
    numbers.className = "summary-numbers";
    [
      ["Kapacitás", `${stats.used}/${availableCapacity(masterMeta)}`],
      ["Bizalom", `${metrics.trust}/10`],
      ["Kockázat", metrics.risk],
    ].forEach(([label, value]) => {
      const item = document.createElement("span");
      const valueElement = document.createElement("b");
      valueElement.textContent = value;
      item.append(valueElement, document.createTextNode(label));
      numbers.appendChild(item);
    });
    card.append(name, ready, numbers);
    card.addEventListener("click", () => {
      masterView = team.id;
      buildMasterTabs();
      renderMasterContent();
    });
    box.appendChild(card);
  });
}

function renderMasterContent() {
  const content = $("#masterContent");
  content.innerHTML = "";
  const teams = masterView === "all" ? TEAMS : TEAMS.filter((team) => team.id === masterView);
  const grid = document.createElement("div");
  grid.className = masterView === "all" ? "master-grid" : "";
  teams.forEach((team) => grid.appendChild(makeMasterTeamCard(team, masterView !== "all")));
  content.appendChild(grid);
}

function makeMasterTeamCard(team, detailed) {
  const stats = teamRoundStats(team.id);
  const { metrics, details } = calculateMetrics(stats.state, masterMeta);
  const card = document.createElement("article");
  card.className = "master-team-card";

  const head = document.createElement("div");
  head.className = "master-team-head";
  const titleWrap = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = team.name;
  title.style.color = team.color;
  const subtitle = document.createElement("small");
  subtitle.textContent = `${stats.used}/${availableCapacity(masterMeta)} kapacitás · ${stats.ready ? "véglegesítve" : "szerkesztés alatt"}`;
  titleWrap.append(title, subtitle);
  const risk = document.createElement("span");
  risk.className = "status-chip";
  risk.textContent = `Kockázat: ${metrics.risk}`;
  head.append(titleWrap, risk);

  const list = document.createElement("div");
  list.className = "master-decision-list";
  const cards = detailed
    ? (CASES[team.id] || []).filter((caseItem) => stats.state.decisions?.[caseItem.id])
    : roundCases(team.id, masterMeta.round);

  cards.forEach((caseItem) => {
    const decision = stats.state.decisions?.[caseItem.id];
    const row = document.createElement("div");
    row.className = "master-decision";
    const label = document.createElement("b");
    label.textContent = caseItem.name;
    const desc = document.createElement("span");
    if (!decision) desc.textContent = "Még nincs döntés";
    else {
      const cost = decisionCost(caseItem, decision.mode, currentEvent(masterMeta, Number(decision.round)));
      desc.textContent = `${decision.round}. kör · ${modeById(decision.mode)?.label || decision.mode} · ${cost} pont`;
    }
    row.append(label, desc);

    const revealedDetail = details.find((item) => item.card.id === caseItem.id);
    if (revealedDetail) {
      const outcome = document.createElement("span");
      outcome.textContent = revealedDetail.outcome.text;
      outcome.style.marginTop = "7px";
      outcome.style.color = "var(--text)";
      row.appendChild(outcome);
    }
    list.appendChild(row);
  });

  card.append(head, list);

  if (stats.state.note) {
    const note = document.createElement("p");
    note.className = "master-note";
    note.textContent = `Döntési elv: ${stats.state.note}`;
    card.appendChild(note);
  }

  if (detailed) {
    const roles = Object.entries(stats.state.roles || {}).filter(([, name]) => name);
    if (roles.length) {
      const note = document.createElement("p");
      note.className = "master-note";
      note.textContent = `Szerepek: ${roles.map(([id, name]) => `${ROLE_LABELS.find((roleItem) => roleItem.id === id)?.label || id}: ${name}`).join(" · ")}`;
      card.appendChild(note);
    }

    const metricsBox = document.createElement("div");
    metricsBox.className = "metrics-grid";
    Object.entries(METRIC_LABELS).forEach(([key, label]) => {
      const metric = document.createElement("div");
      metric.className = `metric-card${key === "risk" ? " risk" : ""}`;
      const metricName = document.createElement("span");
      metricName.textContent = label;
      const metricValue = document.createElement("b");
      metricValue.textContent = key === "risk" ? metrics[key] : `${metrics[key]}/10`;
      metric.append(metricName, metricValue);
      metricsBox.appendChild(metric);
    });
    card.appendChild(metricsBox);
  }

  return card;
}

async function saveMeta(nextMeta, message = "") {
  masterMeta = normalizeMeta(nextMeta);
  masterMeta.updatedAt = Date.now();
  try {
    await store.set(`games/${room}/meta`, clone(masterMeta));
    if (message) showToast(message, "success");
  } catch (error) {
    console.error(error);
    showToast("A játékmesteri beállítást nem sikerült menteni.", "error");
  }
}

async function applyEvent() {
  if (masterMeta.phase !== "planning") return;
  const next = clone(masterMeta);
  next.events ||= {};
  next.events[next.round] = $("#eventSelect").value;
  await saveMeta(next, "Az esemény minden csapatnál megjelent.");
}

async function revealConsequences() {
  if (masterMeta.phase !== "planning") return;
  const missing = TEAMS.filter((team) => !masterStates[team.id]?.submitted?.[masterMeta.round]);
  if (missing.length && !confirm(`${missing.length} csapat még nem véglegesített. Biztosan felfeded a következményeket?`)) return;
  const next = clone(masterMeta);
  next.phase = "reveal";
  await saveMeta(next, "A következmények felfedve.");
}

async function nextRound() {
  if (masterMeta.phase === "finished") return;
  const next = clone(masterMeta);
  if (next.round < TOTAL_ROUNDS) {
    next.round += 1;
    next.phase = "planning";
    next.events ||= {};
    if (!next.events[next.round]) next.events[next.round] = "none";
    await saveMeta(next, `${next.round}. forduló elindítva.`);
  } else {
    next.phase = "finished";
    await saveMeta(next, "A játék lezárult. Kezdődhet az összegzés.");
  }
}

async function resetRoom() {
  if (!confirm("Biztosan törlöd a szoba összes döntését, szerepét és eredményét? Ez nem vonható vissza.")) return;
  await Promise.all([
    store.set(`games/${room}/meta`, defaultMeta()),
    ...TEAMS.map((team) => store.set(`games/${room}/teams/${team.id}`, null)),
  ]);
  masterView = "all";
  buildMasterTabs();
  showToast("A szoba alaphelyzetbe került.", "success");
}

// ============================================================
// KEZDŐKÉPERNYŐ ÉS INDÍTÁS
// ============================================================
function buildTeamSelect() {
  const box = $("#teamButtons");
  box.innerHTML = "";
  TEAMS.forEach((team, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "team-btn";
    button.style.setProperty("--team-color", team.color);
    button.innerHTML = `<span>${index + 1}. csapat</span><b>${team.name}</b><small>8 eset · 3 forduló · saját döntési portfólió</small>`;
    button.addEventListener("click", () => startGame(team.id));
    box.appendChild(button);
  });
}

async function main() {
  document.title = GAME_TITLE;
  $("#gameTitle").textContent = GAME_TITLE;
  $("#roomInput").value = room;

  $("#startBtn").addEventListener("click", () => {
    readRoom();
    buildTeamSelect();
    showView("view-team");
  });
  $("#masterBtn").addEventListener("click", () => {
    readRoom();
    goMaster();
  });
  $("#rulesBtn").addEventListener("click", openRules);
  $$('[data-close-rules]').forEach((item) => item.addEventListener("click", closeRules));
  $$('[data-close-modal]').forEach((item) => item.addEventListener("click", closeModal));
  $$('[data-back]').forEach((button) => button.addEventListener("click", goHome));
  $("#saveRolesBtn").addEventListener("click", saveRoles);
  $("#submitBtn").addEventListener("click", submitTeam);
  $("#unsubmitBtn").addEventListener("click", unsubmitTeam);
  $("#applyEventBtn").addEventListener("click", applyEvent);
  $("#revealBtn").addEventListener("click", revealConsequences);
  $("#nextRoundBtn").addEventListener("click", nextRound);
  $("#resetBtn").addEventListener("click", resetRoom);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
      closeRules();
    }
  });

  await initStore();
  updateBadge();

  if (role === "master") {
    await goMaster();
  } else if (teamId && CASES[teamId]) {
    await startGame(teamId);
  } else {
    showView("view-home");
  }
}

main();
