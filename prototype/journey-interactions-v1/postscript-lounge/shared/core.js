const STORAGE_KEYS = {
  session: "ps_lounge_session_v1",
  events: "ps_lounge_events_v1",
  postscripts: "ps_lounge_postscripts_v1",
  replies: "ps_lounge_replies_v1",
  reports: "ps_lounge_reports_v1",
};

const memoryStore = new Map();
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

const aliasBeginnings = [
  "凌晨两点的",
  "今天不太想回家的",
  "坐在窗边的",
  "刚好路过的",
  "喝到第三杯的",
  "没有说出口的",
  "今晚慢一点的",
  "把手机翻过去的",
];

const aliasEndings = [
  "蓝色沙发",
  "半片柠檬",
  "旧唱片",
  "空酒杯",
  "城市路灯",
  "小纸条",
  "晚风",
  "陌生人",
];

function storageGet(key) {
  if (memoryStore.has(key)) return memoryStore.get(key);
  try {
    return window.localStorage.getItem(key);
  } catch (_error) {
    return memoryStore.get(key) ?? null;
  }
}

function storageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
    memoryStore.delete(key);
  } catch (_error) {
    memoryStore.set(key, value);
  }
}

function storageRemove(key) {
  let removed = true;
  try {
    window.localStorage.removeItem(key);
  } catch (_error) {
    removed = false;
  }
  memoryStore.delete(key);
  return removed;
}

function sessionStorageRemove(key) {
  try {
    window.sessionStorage.removeItem(key);
    return true;
  } catch (_error) {
    return false;
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function matchesFallbackShape(value, fallback) {
  if (Array.isArray(fallback)) return Array.isArray(value);
  if (isPlainObject(fallback)) return isPlainObject(value);
  if (fallback === null || fallback === undefined) return true;
  return typeof value === typeof fallback;
}

export function readStore(key, fallback) {
  const raw = storageGet(key);
  if (!raw) return fallback;
  try {
    const value = JSON.parse(raw);
    return matchesFallbackShape(value, fallback) ? value : fallback;
  } catch (_error) {
    return fallback;
  }
}

export function writeStore(key, value) {
  storageSet(key, JSON.stringify(value));
  return value;
}

export function clearLocalData() {
  const keys = [
    ...Object.values(STORAGE_KEYS),
    "ps_lounge_cards_state_v1",
    "ps_lounge_exchange_state_v1",
  ];
  const localCleared = keys.map(storageRemove).every(Boolean);
  const deliveryCleared = sessionStorageRemove("ps_lounge_exchange_delivery_v1");
  return localCleared && deliveryCleared;
}

export function createId(prefix = "id") {
  const random = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${random}`;
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function createAlias() {
  return `${pick(aliasBeginnings)}${pick(aliasEndings)}`;
}

function cleanParam(value) {
  return String(value ?? "")
    .trim()
    .replace(/[^\p{L}\p{N}_-]/gu, "")
    .slice(0, 48);
}

export function getContext() {
  const params = new URLSearchParams(window.location.search);
  return {
    source: cleanParam(params.get("source")) || "direct",
    storeId: cleanParam(params.get("store_id")) || "postscript",
    tableId: cleanParam(params.get("table")),
  };
}

export function getSession() {
  const nowMs = Date.now();
  const now = new Date(nowMs).toISOString();
  const context = getContext();
  const savedValue = readStore(STORAGE_KEYS.session, null);
  const saved = isPlainObject(savedValue) ? savedValue : null;
  const createdAtMs = Date.parse(saved?.createdAt ?? "");
  const ageMs = nowMs - createdAtMs;
  const isSameContext =
    saved?.source === context.source && saved?.storeId === context.storeId && saved?.tableId === context.tableId;
  const isFresh =
    typeof saved?.sessionId === "string" &&
    typeof saved?.anonymousName === "string" &&
    Number.isFinite(createdAtMs) &&
    ageMs >= -5 * 60 * 1000 &&
    ageMs < SESSION_TTL_MS &&
    isSameContext;

  if (savedValue !== null && !isFresh) {
    storageSet(STORAGE_KEYS.postscripts, "[]");
    storageSet(STORAGE_KEYS.replies, "[]");
  }

  const session = isFresh
    ? { ...saved, ...context, lastVisitAt: now }
    : {
        sessionId: createId("session"),
        anonymousName: createAlias(),
        createdAt: now,
        lastVisitAt: now,
        ...context,
      };

  writeStore(STORAGE_KEYS.session, session);
  return session;
}

export function track(action, payload = {}) {
  const session = getSession();
  const events = readStore(STORAGE_KEYS.events, []).filter(isPlainObject);
  events.push({
    eventId: createId("event"),
    sessionId: session.sessionId,
    action,
    payload,
    path: window.location.pathname,
    createdAt: new Date().toISOString(),
  });
  writeStore(STORAGE_KEYS.events, events.slice(-250));
}

export function trackOnce(action, payload = {}) {
  const events = readStore(STORAGE_KEYS.events, []).filter(isPlainObject);
  const session = getSession();
  if (events.some((event) => event.sessionId === session.sessionId && event.action === action)) return;
  track(action, payload);
}

export function withContext(path) {
  const context = getContext();
  const params = new URLSearchParams();
  if (context.source && context.source !== "direct") params.set("source", context.source);
  if (context.storeId && context.storeId !== "postscript") params.set("store_id", context.storeId);
  if (context.tableId) params.set("table", context.tableId);
  const query = params.toString();
  return query ? `${path}${path.includes("?") ? "&" : "?"}${query}` : path;
}

export function hydrateContextLinks(root = document) {
  root.querySelectorAll("[data-context-link]").forEach((link) => {
    const href = link.getAttribute("href");
    if (href) link.setAttribute("href", withContext(href));
  });
}

export function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function formatShortDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "今晚";
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(date);
}

export function announce(message) {
  let region = document.querySelector("[data-live-region]");
  if (!region) {
    region = document.createElement("p");
    region.className = "sr-only";
    region.dataset.liveRegion = "";
    region.setAttribute("aria-live", "polite");
    document.body.append(region);
  }
  region.textContent = "";
  window.requestAnimationFrame(() => {
    region.textContent = message;
  });
}

export { STORAGE_KEYS };
