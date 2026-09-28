import {
  STORAGE_KEYS,
  announce,
  createId,
  escapeHtml,
  formatShortDate,
  getSession,
  hydrateContextLinks,
  readStore,
  shuffle,
  track,
  trackOnce,
  withContext,
  writeStore,
} from "../shared/core.js";
import * as exchangeApi from "./api.js";
import { seedPostscripts } from "./seed.js";

const app = document.querySelector("#exchange-app");
const modeLabel = document.querySelector("[data-exchange-mode]");
const inboxEntry = document.querySelector("[data-inbox-entry]");
const inboxBadge = document.querySelector("[data-inbox-badge]");
const STATE_KEY = "ps_lounge_exchange_state_v1";
const DELIVERY_CACHE_KEY = "ps_lounge_exchange_delivery_v1";
const LOCAL_CONTENT_TTL_MS = 12 * 60 * 60 * 1000;
const categories = ["关系", "工作", "城市", "人生", "其他"];
const sharedMode = exchangeApi.isSharedExchangeEnabled();
const sharedModeVerified = exchangeApi.isSharedExchangeVerified();
const sharedModeName = sharedModeVerified ? "同店共享" : "共享联调";
const initialSession = getSession();
const savedValue = readStore(STATE_KEY, {});
const saved = savedValue.sessionId === initialSession.sessionId ? savedValue : {};
let serverTimeOffsetMs = Number.isFinite(savedValue.serverTimeOffsetMs)
  ? savedValue.serverTimeOffsetMs
  : 0;

function serverNowMs() {
  return Date.now() + serverTimeOffsetMs;
}

function absorbServerTime(result) {
  const observedServerTime = Date.parse(result?.serverNow ?? "");
  if (Number.isFinite(observedServerTime)) {
    serverTimeOffsetMs = observedServerTime - Date.now();
  }
  return result;
}

const legacyCredential =
  typeof savedValue.credential === "string" && typeof savedValue.credentialExpiresAt === "string"
    ? [
        {
          credential: savedValue.credential,
          expiresAt: savedValue.credentialExpiresAt,
          writeExpiresAt: savedValue.credentialExpiresAt,
          clientSessionId: savedValue.sessionId,
        },
      ]
    : [];
const savedCredentials = Array.isArray(savedValue.credentials) ? savedValue.credentials : legacyCredential;
const normalizedCredentials = savedCredentials
  .filter(
    (item) =>
      item &&
      typeof item.credential === "string" &&
      typeof item.expiresAt === "string" &&
      Date.parse(item.expiresAt) > serverNowMs(),
  )
  .map((item) => ({
    ...item,
    credentialId:
      typeof item.credentialId === "string" && item.credentialId
        ? item.credentialId
        : `credential_${item.credential.slice(-16)}`,
  }));

function clearDeliveryCache() {
  try {
    window.sessionStorage.removeItem(DELIVERY_CACHE_KEY);
  } catch (_error) {
    // A blocked sessionStorage should not prevent the exchange flow.
  }
}

function readDeliveryCache() {
  if (!sharedMode) return null;
  try {
    const raw = window.sessionStorage.getItem(DELIVERY_CACHE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    const valid =
      value &&
      typeof value.deliveryToken === "string" &&
      /^[A-Za-z0-9_-]{32,160}$/.test(value.deliveryToken) &&
      typeof value.visibleUntil === "string" &&
      Date.parse(value.visibleUntil) > serverNowMs() &&
      typeof value.credentialId === "string";
    if (!valid) {
      clearDeliveryCache();
      return null;
    }
    return value;
  } catch (_error) {
    clearDeliveryCache();
    return null;
  }
}

const cachedDeliveryValue = readDeliveryCache();
const cachedDeliveryCredential = cachedDeliveryValue
  ? normalizedCredentials.find((item) => item.credentialId === cachedDeliveryValue.credentialId) ?? null
  : null;
const cachedDelivery = cachedDeliveryCredential ? cachedDeliveryValue : null;
if (cachedDeliveryValue && !cachedDeliveryCredential) clearDeliveryCache();
const pendingSubmit = saved.pendingSubmit && typeof saved.pendingSubmit === "object" ? saved.pendingSubmit : null;
const pendingReply =
  saved.pendingReply && typeof saved.pendingReply === "object"
    ? saved.pendingReply
    : cachedDelivery?.pendingReply && typeof cachedDelivery.pendingReply === "object"
      ? cachedDelivery.pendingReply
      : null;
const pendingReport =
  saved.pendingReport && typeof saved.pendingReport === "object"
    ? saved.pendingReport
    : cachedDelivery?.pendingReport && typeof cachedDelivery.pendingReport === "object"
      ? cachedDelivery.pendingReport
      : null;
const restoredView = saved.view ?? cachedDelivery?.view;

const localViews = ["write", "receive", "reply", "share"];
const sharedViews = ["write", "receive", "reply", "inbox"];
const state = {
  view: sharedMode
    ? sharedViews.includes(restoredView)
      ? restoredView
      : "write"
    : localViews.includes(saved.view)
      ? saved.view
      : "write",
  category: categories.includes(pendingSubmit?.category)
    ? pendingSubmit.category
    : categories.includes(saved.category)
      ? saved.category
      : "其他",
  draft: typeof pendingSubmit?.content === "string" ? pendingSubmit.content : "",
  replyDraft: typeof pendingReply?.content === "string" ? pendingReply.content : "",
  submissionId: typeof saved.submissionId === "string" ? saved.submissionId : null,
  currentReceivedId: seedPostscripts.some((item) => item.id === saved.currentReceivedId)
    ? saved.currentReceivedId
    : null,
  receiveHistory: Array.isArray(saved.receiveHistory)
    ? saved.receiveHistory.filter((id) => seedPostscripts.some((item) => item.id === id))
    : [],
  remotePostscript: null,
  deliveryToken: cachedDelivery?.deliveryToken ?? null,
  deliveryCredential: cachedDeliveryCredential?.credential ?? null,
  deliveryVisibleUntil: cachedDelivery?.visibleUntil ?? null,
  replyState: cachedDelivery?.replyState ?? "eligible",
  repliedDeliveryRequestIds: Array.isArray(saved.repliedDeliveryRequestIds)
    ? saved.repliedDeliveryRequestIds.filter((id) => typeof id === "string").slice(-20)
    : [],
  remoteEmpty: false,
  receiveRemaining: Number.isFinite(saved.receiveRemaining) ? saved.receiveRemaining : null,
  inboxItems: [],
  inboxLoaded: false,
  inboxError: "",
  unreadTotal: 0,
  credentials: normalizedCredentials,
  busy: "",
  error: "",
  replyError: "",
  pageError: pendingSubmit ? "上次提交没有确认结果。点击重试不会重复留下。" : "",
  retryReceiveAllowed: true,
  bootstrapError: "",
  notice: null,
  submitRequestId: typeof pendingSubmit?.clientRequestId === "string" ? pendingSubmit.clientRequestId : null,
  receiveRequestId: typeof saved.pendingReceiveRequestId === "string" ? saved.pendingReceiveRequestId : null,
  deliveryRequestId:
    typeof saved.deliveryRequestId === "string"
      ? saved.deliveryRequestId
      : typeof cachedDelivery?.deliveryRequestId === "string"
        ? cachedDelivery.deliveryRequestId
        : null,
  replyRequestId: typeof pendingReply?.clientRequestId === "string" ? pendingReply.clientRequestId : null,
  reportRequestId: typeof pendingReport?.clientRequestId === "string" ? pendingReport.clientRequestId : null,
  shareCanvas: null,
};

let expiryTimer = null;

if (!sharedMode && !state.submissionId) state.view = "write";
if (sharedMode && pendingReply) {
  state.replyError = "上次回复没有确认结果。重试不会重复留下。";
}
if (sharedMode && pendingReport) {
  state.pageError = "上次举报没有确认结果，可以再次提交。";
}

trackOnce("exchange_view", { mode: sharedMode ? "shared" : "local-demo" });
hydrateContextLinks();

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function activeLocalRecords(key, sessionId) {
  const now = Date.now();
  return readStore(key, []).filter((record) => {
    if (!isRecord(record) || record.sessionId !== sessionId) return false;
    const expiresAt = Date.parse(record.expiresAt ?? "");
    return Number.isFinite(expiresAt) && expiresAt > now;
  });
}

if (!sharedMode) {
  writeStore(STORAGE_KEYS.postscripts, activeLocalRecords(STORAGE_KEYS.postscripts, initialSession.sessionId));
  writeStore(STORAGE_KEYS.replies, activeLocalRecords(STORAGE_KEYS.replies, initialSession.sessionId));
  writeStore(STORAGE_KEYS.reports, activeLocalRecords(STORAGE_KEYS.reports, initialSession.sessionId));
}

function currentWriteCredential() {
  const now = serverNowMs() + 30_000;
  return (
    state.credentials.find(
      (item) =>
        item.clientSessionId === initialSession.sessionId &&
        Date.parse(item.writeExpiresAt || item.expiresAt) > now &&
        Date.parse(item.expiresAt) > now,
    ) ?? null
  );
}

function readableCredentials() {
  const now = serverNowMs() + 30_000;
  return state.credentials.filter((item) => Date.parse(item.expiresAt) > now);
}

function persistDeliveryCache() {
  if (!sharedMode) return;
  const credentialRecord = state.credentials.find(
    (item) => item.credential === state.deliveryCredential,
  );
  const visibleUntil = state.remotePostscript?.visibleUntil ?? state.deliveryVisibleUntil;
  if (
    !state.deliveryToken ||
    !credentialRecord ||
    typeof visibleUntil !== "string" ||
    Date.parse(visibleUntil) <= serverNowMs()
  ) {
    clearDeliveryCache();
    return;
  }

  const cache = {
    deliveryToken: state.deliveryToken,
    visibleUntil,
    credentialId: credentialRecord.credentialId,
    deliveryRequestId: state.deliveryRequestId,
    replyState: state.replyState,
    view: state.view === "reply" ? "reply" : "receive",
    pendingReply: state.replyState === "eligible" && state.replyRequestId
      ? { clientRequestId: state.replyRequestId, content: state.replyDraft }
      : null,
    pendingReport: state.reportRequestId
      ? { clientRequestId: state.reportRequestId }
      : null,
  };
  try {
    window.sessionStorage.setItem(DELIVERY_CACHE_KEY, JSON.stringify(cache));
  } catch (_error) {
    // The active page still keeps the delivery in memory when storage is blocked.
  }
}

function persist() {
  if (sharedMode) {
    persistDeliveryCache();
    writeStore(STATE_KEY, {
      sessionId: getSession().sessionId,
      serverTimeOffsetMs,
      view: sharedViews.includes(state.view) ? state.view : "write",
      category: state.category,
      credentials: readableCredentials().slice(-4),
      pendingSubmit: state.submitRequestId
        ? { clientRequestId: state.submitRequestId, content: state.draft, category: state.category }
        : null,
      pendingReceiveRequestId: state.receiveRequestId,
      receiveRemaining: state.receiveRemaining,
      deliveryRequestId: state.deliveryRequestId,
      repliedDeliveryRequestIds: state.repliedDeliveryRequestIds.slice(-20),
      pendingReply: state.replyState === "eligible" && state.replyRequestId
        ? {
            clientRequestId: state.replyRequestId,
            content: state.replyDraft,
            deliveryRequestId: state.deliveryRequestId,
          }
        : null,
      pendingReport: state.reportRequestId
        ? { clientRequestId: state.reportRequestId, deliveryRequestId: state.deliveryRequestId }
        : null,
    });
    return;
  }

  writeStore(STATE_KEY, {
    sessionId: getSession().sessionId,
    view: state.view,
    category: state.category,
    submissionId: state.submissionId,
    currentReceivedId: state.currentReceivedId,
    receiveHistory: state.receiveHistory.slice(-20),
  });
}

function updateChrome() {
  const tableContext = initialSession.tableId ? ` · 桌 ${initialSession.tableId}` : "";
  if (modeLabel) {
    modeLabel.textContent = sharedMode
      ? `${sharedModeVerified ? "同店共享" : "共享联调"} · 12H${tableContext}`
      : `本机演示${tableContext}`;
  }
  if (inboxEntry) inboxEntry.hidden = !sharedMode;
  if (inboxBadge) {
    inboxBadge.hidden = state.unreadTotal < 1;
    inboxBadge.textContent = state.unreadTotal > 99 ? "99+" : String(state.unreadTotal);
  }
  if (inboxEntry) {
    inboxEntry.setAttribute(
      "aria-label",
      state.unreadTotal > 0 ? `我的后话，${state.unreadTotal} 条新回复` : "我的后话",
    );
  }
}

function normalizeStatus(value) {
  if (["pending", "pending_review", "queued"].includes(value)) return "pending";
  if (["active", "approved", "published"].includes(value)) return "active";
  if (["expired", "erased", "deleted"].includes(value)) return "expired";
  if (["rejected", "reported", "blocked"].includes(value)) return "rejected";
  return value || "pending";
}

function currentPostscript() {
  if (sharedMode) return state.remotePostscript;
  return seedPostscripts.find((item) => item.id === state.currentReceivedId) ?? null;
}

function validateContent(content, maxLength = 180) {
  const value = content.trim();
  if (value.length < 4) return "再多写一点点，至少 4 个字。";
  if (value.length > maxLength) return `${maxLength === 120 ? "回复" : "后话"}最多 ${maxLength} 个字。`;
  if (!/[\p{L}\p{N}]/u.test(value)) return "这句话暂时只有符号，请补充一些文字。";

  const digitsOnly = value.replace(/\D/g, "");
  const hasPhone = /1[3-9]\d{9}/.test(digitsOnly);
  const hasEmail = /\b[^\s@]+@[^\s@]+\.[a-z]{2,}\b/i.test(value);
  const hasUrl =
    /(?:https?:\/\/|www\.|[a-z0-9-]+\.(?:com|cn|net|org)\b|(?:t\.me|wa\.me|linktr\.ee|discord\.gg)\/)/i.test(
      value,
    );
  const hasAccount =
    /(?:微信|wechat|wx|vx|v信|qq|telegram|tg|line).{0,10}(?:id|号|[:：])?\s*[a-z0-9_-]{3,}/i.test(value) ||
    /(?:加|联系|私聊|找我|搜我).{0,8}(?:微信|wechat|wx|vx|v信|qq|telegram|tg|line)/i.test(value);
  if (hasPhone || hasEmail || hasUrl || hasAccount) {
    return "为了匿名安全，请不要留下手机号、邮箱、网址或其他联系方式。";
  }

  const blockedPhrases = ["约炮", "裸照", "毒品交易", "加微信"];
  if (blockedPhrases.some((phrase) => value.includes(phrase))) {
    return "这句话暂时不能公开交换，请换一种不涉及交易、骚扰或联系方式的表达。";
  }

  return "";
}

function friendlyError(error, fallback) {
  const code = error?.code ?? "";
  if (["RATE_LIMITED", "TOO_MANY_REQUESTS", "HTTP_429"].includes(code) || error?.status === 429) {
    return "今晚的操作有点快，请等一会儿再试。";
  }
  if (["SESSION_EXPIRED", "CREDENTIAL_EXPIRED", "UNAUTHORIZED"].includes(code) || error?.status === 401) {
    return "这次匿名访问已结束。不会自动换用新身份重复提交。";
  }
  if (code === "SESSION_WRITE_EXPIRED") {
    return "这一轮的提交时间已结束。请重新进入后再留下新内容。";
  }
  if (code === "SUBMISSION_REQUIRED") {
    return "这一轮可以带走的后话已经看完。再留一句，开始新的一轮。";
  }
  if (["POSTSCRIPT_EXPIRED", "DELIVERY_EXPIRED", "GONE", "HTTP_410"].includes(code) || error?.status === 410) {
    return "这句后话的 12 小时已经结束。";
  }
  if (code === "DELIVERY_NOT_FOUND") {
    return "这句后话已经结束或不再可用。";
  }
  if (["INVALID_CONTENT", "CONTENT_REJECTED", "MODERATION_REJECTED"].includes(code)) {
    return "这句话没有发布，请换一种表达后再试。";
  }
  if (["NETWORK_ERROR", "REQUEST_ABORTED", "REQUEST_TIMEOUT", "INVALID_RESPONSE"].includes(code) || error?.status >= 500) {
    return "暂时没有收到服务器确认，请稍后重试。";
  }
  return fallback;
}

function isAuthenticationError(error) {
  return error?.status === 401 || ["SESSION_EXPIRED", "CREDENTIAL_EXPIRED", "UNAUTHORIZED"].includes(error?.code);
}

function isWriteWindowError(error) {
  return error?.code === "SESSION_WRITE_EXPIRED";
}

function noticeMarkup(notice = state.notice) {
  if (!notice) return "";
  return `
    <section class="exchange-notice exchange-notice-${escapeHtml(notice.tone ?? "neutral")}" role="status">
      <strong>${escapeHtml(notice.title)}</strong>
      <p>${escapeHtml(notice.body)}</p>
    </section>
  `;
}

function errorMarkup(message, retryAction = "") {
  if (!message) return "";
  return `
    <section class="exchange-notice exchange-notice-error" role="alert">
      <strong>这次没能顺利完成</strong>
      <p>${escapeHtml(message)}</p>
      ${retryAction ? `<button class="button button-secondary" type="button" data-action="${retryAction}">重试</button>` : ""}
    </section>
  `;
}

function formatRemaining(visibleUntil) {
  const remainingMs = Date.parse(visibleUntil ?? "") - serverNowMs();
  if (!Number.isFinite(remainingMs)) return "12 小时内";
  if (remainingMs <= 0) return "已结束";
  const minutes = Math.ceil(remainingMs / 60_000);
  if (minutes < 60) return `还有约 ${minutes} 分钟`;
  return `还有约 ${Math.ceil(minutes / 60)} 小时`;
}

function remotePostIsExpired() {
  const visibleUntil = state.remotePostscript?.visibleUntil ?? state.deliveryVisibleUntil;
  if ((!state.remotePostscript && !state.deliveryToken) || !visibleUntil) return false;
  const expiresAt = Date.parse(visibleUntil);
  return Number.isFinite(expiresAt) && expiresAt <= serverNowMs();
}

function scheduleExpiryCheck() {
  window.clearTimeout(expiryTimer);
  expiryTimer = null;
  const visibleUntil = state.remotePostscript?.visibleUntil ?? state.deliveryVisibleUntil;
  if (!sharedMode || (!state.remotePostscript && !state.deliveryToken) || !visibleUntil) return;
  const remaining = Date.parse(visibleUntil) - serverNowMs();
  if (!Number.isFinite(remaining)) return;
  if (remaining <= 0) {
    expireCurrentRemotePost();
    return;
  }
  expiryTimer = window.setTimeout(expireCurrentRemotePost, Math.min(remaining + 50, 2_147_000_000));
}

function expireCurrentRemotePost() {
  if ((!state.remotePostscript && !state.deliveryToken) || !remotePostIsExpired()) return;
  state.remotePostscript = null;
  state.deliveryToken = null;
  state.deliveryCredential = null;
  state.deliveryVisibleUntil = null;
  state.deliveryRequestId = null;
  state.receiveRequestId = null;
  state.replyRequestId = null;
  state.reportRequestId = null;
  state.replyState = "closed";
  state.remoteEmpty = true;
  state.pageError = "这句后话的 12 小时已经结束。";
  persist();
  render();
  announce(state.pageError);
}

function receiveNextLocal() {
  const activeSession = getSession();
  const reports = activeLocalRecords(STORAGE_KEYS.reports, activeSession.sessionId);
  writeStore(STORAGE_KEYS.reports, reports);
  const reportedIds = new Set(reports.map((item) => item.postscriptId));
  let pool = seedPostscripts.filter(
    (item) => item.status === "active" && !reportedIds.has(item.id) && !state.receiveHistory.includes(item.id),
  );

  if (!pool.length) {
    state.receiveHistory = state.currentReceivedId ? [state.currentReceivedId] : [];
    pool = seedPostscripts.filter(
      (item) => item.status === "active" && !reportedIds.has(item.id) && item.id !== state.currentReceivedId,
    );
  }

  const next = shuffle(pool)[0] ?? null;
  state.currentReceivedId = next?.id ?? null;
  if (next) state.receiveHistory.push(next.id);
  persist();
  return next;
}

async function ensureCredential({ force = false } = {}) {
  const current = currentWriteCredential();
  if (!force && current) return current.credential;
  const readOnlyCurrent = readableCredentials().find(
    (item) => item.clientSessionId === initialSession.sessionId,
  );
  if (!force && readOnlyCurrent) {
    throw new exchangeApi.ExchangeApiError("Exchange write window has ended", {
      code: "SESSION_WRITE_EXPIRED",
      status: 403,
    });
  }
  if (force && current) {
    state.credentials = state.credentials.filter((item) => item.credential !== current.credential);
  }
  const result = absorbServerTime(
    await exchangeApi.bootstrap({
      anonymousName: initialSession.anonymousName,
      source: initialSession.source,
      tableId: initialSession.tableId || null,
      clientSessionId: initialSession.sessionId,
    }),
  );
  const credential = result?.credential;
  const expiresAt = result?.session?.expiresAt;
  const writeExpiresAt = result?.session?.writeExpiresAt ?? expiresAt;
  if (typeof credential !== "string" || !credential || typeof expiresAt !== "string") {
    throw new exchangeApi.ExchangeApiError("Bootstrap response is incomplete", {
      code: "INVALID_RESPONSE",
      retryable: true,
    });
  }
  state.credentials = [
    ...readableCredentials().filter((item) => item.credential !== credential),
    {
      credential,
      credentialId: createId("credential"),
      expiresAt,
      writeExpiresAt,
      clientSessionId: initialSession.sessionId,
    },
  ].slice(-4);
  persist();
  return credential;
}

async function withCredential(operation) {
  const credential = await ensureCredential();
  try {
    return absorbServerTime(await operation(credential));
  } catch (error) {
    if (isAuthenticationError(error)) {
      state.credentials = state.credentials.filter((item) => item.credential !== credential);
      persist();
    }
    throw error;
  }
}

async function withExistingCredential(credential, operation) {
  if (!credential) {
    throw new exchangeApi.ExchangeApiError("Delivery credential is missing", {
      code: "CREDENTIAL_REQUIRED",
    });
  }
  try {
    return absorbServerTime(await operation(credential));
  } catch (error) {
    if (isAuthenticationError(error)) {
      state.credentials = state.credentials.filter((item) => item.credential !== credential);
      persist();
    }
    throw error;
  }
}

async function resumeCachedDelivery() {
  if (!state.deliveryToken || !state.deliveryCredential) return false;
  if (remotePostIsExpired()) {
    expireCurrentRemotePost();
    return false;
  }

  try {
    const result = await withExistingCredential(state.deliveryCredential, (credential) =>
      exchangeApi.resume(credential, { deliveryToken: state.deliveryToken }),
    );
    const received = result?.postscript;
    if (!received || typeof received.content !== "string") {
      throw new exchangeApi.ExchangeApiError("Resume response is incomplete", {
        code: "INVALID_RESPONSE",
        retryable: true,
      });
    }
    const { deliveryToken, ...postscript } = received;
    state.remotePostscript = postscript;
    state.deliveryToken = deliveryToken ?? state.deliveryToken;
    state.deliveryVisibleUntil = postscript.visibleUntil ?? state.deliveryVisibleUntil;
    state.replyState = postscript.replyState ?? (postscript.canReply === false ? "closed" : state.replyState);
    state.remoteEmpty = false;
    if (state.replyState === "submitted") {
      state.replyRequestId = null;
      state.replyDraft = "";
      if (state.deliveryRequestId && !state.repliedDeliveryRequestIds.includes(state.deliveryRequestId)) {
        state.repliedDeliveryRequestIds.push(state.deliveryRequestId);
        state.repliedDeliveryRequestIds = state.repliedDeliveryRequestIds.slice(-20);
      }
      if (state.view === "reply") state.view = "receive";
    }
    persist();
    return true;
  } catch (error) {
    if (isAuthenticationError(error) || error?.code === "DELIVERY_NOT_FOUND" || error?.status === 404) {
      state.remotePostscript = null;
      state.deliveryToken = null;
      state.deliveryCredential = null;
      state.deliveryVisibleUntil = null;
      state.deliveryRequestId = null;
      state.replyRequestId = null;
      state.reportRequestId = null;
      state.replyDraft = "";
      state.remoteEmpty = true;
      state.view = "receive";
      state.notice = {
        tone: "neutral",
        title: "刚才那句已结束",
        body: "已清除本次标签页中的短期领取凭证。",
      };
      persist();
      return false;
    }
    throw error;
  }
}

function unpackInbox(result) {
  const items = Array.isArray(result?.items)
    ? result.items
    : Array.isArray(result?.postscripts)
      ? result.postscripts
      : Array.isArray(result?.inbox)
        ? result.inbox
        : [];
  const unreadFromItems = items.reduce((total, item) => total + Math.max(0, Number(item?.unreadCount) || 0), 0);
  return {
    items,
    unreadTotal: Number.isFinite(Number(result?.unreadTotal)) ? Math.max(0, Number(result.unreadTotal)) : unreadFromItems,
  };
}

async function refreshInbox({ background = false } = {}) {
  if (!sharedMode) return;
  if (!background) {
    state.busy = "inbox";
    state.inboxError = "";
    render();
  }
  try {
    const credentials = readableCredentials();
    if (!credentials.length) {
      throw new exchangeApi.ExchangeApiError("No readable exchange credential", {
        code: "CREDENTIAL_REQUIRED",
      });
    }
    const results = await Promise.allSettled(
      credentials.map((item) =>
        exchangeApi.inbox(item.credential).then((result) => ({ item, result: absorbServerTime(result) })),
      ),
    );
    const invalidCredentials = new Set(
      results
        .map((result, index) => ({ result, credential: credentials[index]?.credential }))
        .filter(
          ({ result }) =>
            result.status === "rejected" &&
            (result.reason?.status === 401 ||
              ["SESSION_EXPIRED", "CREDENTIAL_EXPIRED", "UNAUTHORIZED"].includes(result.reason?.code)),
        )
        .map(({ credential }) => credential)
        .filter(Boolean),
    );
    if (invalidCredentials.size) {
      state.credentials = state.credentials.filter((item) => !invalidCredentials.has(item.credential));
    }

    const successful = results.filter((result) => result.status === "fulfilled");
    if (!successful.length) {
      persist();
      throw results[0]?.reason;
    }

    const merged = new Map();
    let unreadTotal = 0;
    successful.forEach(({ value }) => {
      const unpacked = unpackInbox(value.result);
      unreadTotal += unpacked.unreadTotal;
      unpacked.items.forEach((item) => merged.set(item.postscriptId ?? item.id, item));
    });
    state.inboxItems = [...merged.values()].sort(
      (left, right) => Date.parse(right?.createdAt ?? "") - Date.parse(left?.createdAt ?? ""),
    );
    state.unreadTotal = unreadTotal;
    state.inboxLoaded = true;
    state.inboxError = "";
    persist();
  } catch (error) {
    if (!background) {
      state.inboxError = friendlyError(error, "暂时打不开收件箱，请稍后重试。");
    }
  } finally {
    if (!background) state.busy = "";
    updateChrome();
    if (!background || state.view === "inbox") render();
  }
}

function renderLoading(title = "正在连接这家店……", body = "请稍等一下。") {
  app.innerHTML = `
    <section class="panel exchange-loading" aria-live="polite" aria-busy="true">
      <p class="page-kicker">OTHERS · 一句话</p>
      <h1 tabindex="-1">${escapeHtml(title)}</h1>
      <p>${escapeHtml(body)}</p>
      <span class="exchange-loading-dot" aria-hidden="true"></span>
    </section>
  `;
}

function renderBootstrapError() {
  app.innerHTML = `
    <section class="panel empty-state" aria-labelledby="exchange-connect-title">
      <p class="page-kicker">${sharedModeName}暂时不可用</p>
      <h1 id="exchange-connect-title" tabindex="-1">这次没有连接上。</h1>
      <p>${escapeHtml(state.bootstrapError)}</p>
      <div class="button-row">
        <button class="button button-primary" type="button" data-action="retry-bootstrap">重新连接</button>
        <a class="button button-secondary" href="${withContext("../")}">返回数字客厅</a>
      </div>
    </section>
  `;
}

function renderWrite() {
  const submitting = state.busy === "submit";
  const sharedIntro = "通过审核后，这句话会在同一家店里停留最多 12 小时。提交之后，你可以带走陌生人的一句。";
  app.innerHTML = `
    <section aria-labelledby="exchange-title">
      <header class="page-header">
        <div>
          <p class="page-kicker">OTHERS · 一句话</p>
          <h1 id="exchange-title" tabindex="-1">留下一句，<br />带走一句。</h1>
        </div>
        <p>${sharedMode ? sharedIntro : "可以写给一个人，写给今天，也可以谁都不写。提交之后，才会收到演示内容里的一句。"}</p>
      </header>

      ${noticeMarkup()}
      ${errorMarkup(state.pageError, state.submitRequestId ? "retry-submit" : "")}

      <div class="exchange-layout">
        <form class="panel compose-panel" data-form="postscript" novalidate aria-busy="${submitting}">
          <label class="compose-label" for="postscript-content">今晚，你有什么话想留在这里？</label>
          <textarea
            id="postscript-content"
            class="text-input"
            name="content"
            rows="7"
            maxlength="180"
            placeholder="最近其实……"
            aria-describedby="content-help content-error"
            ${submitting ? "disabled" : ""}
          >${escapeHtml(state.draft)}</textarea>
          <div class="input-meta">
            <span id="content-help">${sharedMode ? "同店可见 · 审核通过前不公开" : "本机演示 · 不会上传"}</span>
            <span data-character-count>${state.draft.length}/180</span>
          </div>
          <p class="inline-error" id="content-error" ${state.error ? "" : "hidden"}>${escapeHtml(state.error)}</p>

          <fieldset class="category-fieldset" ${submitting ? "disabled" : ""}>
            <legend>这句话更接近</legend>
            <div class="category-row">
              ${categories
                .map(
                  (category) => `
                    <button
                      class="category-button"
                      type="button"
                      data-category="${category}"
                      aria-pressed="${state.category === category}"
                    >${category}</button>
                  `,
                )
                .join("")}
            </div>
          </fieldset>

          <button class="button button-primary compose-submit" type="submit" ${submitting ? "disabled" : ""}>
            ${submitting ? "正在留下……" : "留下我的后话"} <span aria-hidden="true">${submitting ? "" : "↗"}</span>
          </button>
        </form>

        <aside class="exchange-principle">
          <span class="principle-number">P.S. / 001</span>
          <p>不是公开信息流，也不是陌生人聊天软件。</p>
          <strong>${sharedMode ? "只在同一家店，<br />停留 12 小时。" : "我留下一句，<br />才获得演示里的一句。"}</strong>
          <p class="prototype-note">${
            sharedMode
              ? "审核暂时不可用时，内容会先进入待审；待审内容不会进入交换池。"
              : "本机演示：你的文字只保存在这台设备，不会被同店其他人看到，回复也不会送达作者。"
          }</p>
        </aside>
      </div>
    </section>
  `;
}

function renderReceive() {
  if (sharedMode && state.busy === "receive") {
    renderLoading("正在从这家店带来一句……", "只会选取审核通过且仍在 12 小时内的后话。");
    return;
  }

  let postscript = currentPostscript();
  if (!sharedMode && !postscript) postscript = receiveNextLocal();

  if (!postscript) {
    const emptyTitle = sharedMode ? "这家店暂时没有更多后话。" : "今晚暂时没有更多演示后话。";
    app.innerHTML = `
      <section class="panel empty-state" aria-labelledby="exchange-empty-title">
        ${noticeMarkup()}
        <p class="page-kicker">${sharedMode ? "同店交换池" : "本机演示"}</p>
        <h1 id="exchange-empty-title" tabindex="-1">${emptyTitle}</h1>
        ${errorMarkup(state.pageError, sharedMode && state.retryReceiveAllowed ? "retry-receive" : "")}
        <div class="button-row">
          ${sharedMode && !state.pageError ? '<button class="button button-primary" type="button" data-action="next-postscript">再看看</button>' : ""}
          <button class="button button-secondary" type="button" data-action="restart-exchange">再留一句</button>
          ${sharedMode ? '<button class="button button-secondary" type="button" data-action="open-inbox">我的后话</button>' : ""}
          <a class="button button-secondary" href="${withContext("../")}">返回数字客厅</a>
        </div>
      </section>
    `;
    return;
  }

  const serial = String(postscript.id ?? "").replace(/\D/g, "").slice(-3).padStart(3, "0");
  const localAlreadyReplied = !sharedMode && activeLocalRecords(STORAGE_KEYS.replies, initialSession.sessionId)
    .some((reply) => reply.postscriptId === postscript.id);
  const replyState = sharedMode ? state.replyState : localAlreadyReplied ? "submitted" : "eligible";
  const canReply = !sharedMode || (postscript.canReply !== false && replyState === "eligible" && !remotePostIsExpired());
  const replyLabel = replyState === "submitted" ? "已回过这一句" : replyState === "closed" ? "回复已结束" : "回 TA 一句";
  const metaTime = sharedMode ? formatRemaining(postscript.visibleUntil) : formatShortDate(postscript.createdAt);
  app.innerHTML = `
    <section class="receive-stage" aria-labelledby="received-title">
      ${noticeMarkup()}
      ${errorMarkup(state.pageError)}
      <header class="receive-header">
        <div>
          <p class="page-kicker">${sharedMode ? "一句来自同一家店" : "本机演示交换"}</p>
          <h1 id="received-title" tabindex="-1">现在，带走陌生人的一句。</h1>
        </div>
        <p>POSTSCRIPT / ${serial}</p>
      </header>

      <article class="received-card">
        <div class="received-card-meta">
          <span>${escapeHtml(postscript.category)}</span>
          <span>${escapeHtml(metaTime)}</span>
        </div>
        <blockquote>“${escapeHtml(postscript.content)}”</blockquote>
        <p class="received-author">—— ${escapeHtml(postscript.anonymousName)}</p>
      </article>

      <div class="receive-actions">
        <button class="button button-primary" type="button" data-action="reply" ${canReply ? "" : "disabled"}>${replyLabel}</button>
        <button class="button button-secondary" type="button" data-action="next-postscript" ${sharedMode && state.receiveRemaining === 0 ? "disabled" : ""}>${sharedMode && state.receiveRemaining === 0 ? "本轮已完成" : "换一句"}</button>
        ${sharedMode ? "" : '<button class="button button-secondary" type="button" data-action="share">做成一张卡</button>'}
        <button class="button button-secondary" type="button" data-action="restart-exchange">再留一句</button>
        <button class="button button-text report-button" type="button" data-action="report" ${state.busy === "report" ? "disabled" : ""}>${state.busy === "report" ? "正在隐藏……" : "举报这句话"}</button>
      </div>
      ${sharedMode ? '<p class="exchange-fine-print">匿名回复只停在一层；作者可以收到，但不能继续聊天。</p>' : ""}
    </section>
  `;
}

function renderReply() {
  const postscript = currentPostscript();
  if (!postscript) {
    state.view = "receive";
    renderReceive();
    return;
  }

  const submitting = state.busy === "reply";
  app.innerHTML = `
    <section class="reply-stage" aria-labelledby="reply-title">
      <header class="page-header compact-header">
        <div>
          <p class="page-kicker">只回这一句</p>
          <h1 id="reply-title" tabindex="-1">有些回应，<br />不用开始一段聊天。</h1>
        </div>
        <p>${sharedMode ? "这是一封单向匿名回信。送出后不能补充，对方也不能回复你。" : "本机演示只支持一层回复，不会真正送达作者。"}</p>
      </header>

      <blockquote class="reply-context">“${escapeHtml(postscript.content)}”</blockquote>

      <form class="panel reply-form" data-form="reply" novalidate aria-busy="${submitting}">
        <label for="reply-content">回 TA 一句</label>
        <textarea id="reply-content" class="text-input" name="content" rows="5" maxlength="120" placeholder="想对 TA 说……" ${submitting ? "disabled" : ""}>${escapeHtml(state.replyDraft)}</textarea>
        <p class="inline-error" id="reply-error" ${state.replyError ? "" : "hidden"}>${escapeHtml(state.replyError)}</p>
        <div class="button-row">
          <button class="button button-primary" type="submit" ${submitting ? "disabled" : ""}>${submitting ? "正在送出……" : "留下回复"}</button>
          <button class="button button-secondary" type="button" data-action="back-receive" ${submitting ? "disabled" : ""}>暂时不回</button>
        </div>
      </form>
    </section>
  `;
}

function inboxStatus(item) {
  const status = normalizeStatus(item?.status);
  if (status === "active") return { label: "同店可见中", tone: "active" };
  if (status === "expired") return { label: "12 小时已结束", tone: "expired" };
  if (status === "rejected") return { label: "没有发布", tone: "rejected" };
  return { label: "待审核", tone: "pending" };
}

function renderInboxItem(item) {
  const status = inboxStatus(item);
  const replies = Array.isArray(item?.replies)
    ? item.replies.filter((reply) => !reply?.status || normalizeStatus(reply.status) === "active")
    : [];
  const contentVisible = status.tone !== "expired" && typeof item?.content === "string" && item.content;
  const ownPostSummary = status.tone === "expired"
    ? "正文已停止展示。"
    : `你在「${escapeHtml(item?.category || "其他")}」里留下的一句后话。`;
  const replyMarkup = replies.length
    ? `<div class="inbox-replies">
        <p class="inbox-replies-title">收到 ${replies.length} 条匿名回复</p>
        ${replies
          .map(
            (reply) => `
              <article class="inbox-reply">
                <p>“${escapeHtml(reply.content)}”</p>
                <span>—— ${escapeHtml(reply.anonymousName || "同店的陌生人")}</span>
              </article>
            `,
          )
          .join("")}
      </div>`
    : `<p class="inbox-no-reply">${status.tone === "active" ? "暂时还没有匿名回复。" : "没有可查看的匿名回复。"}</p>`;

  return `
    <article class="panel inbox-card">
      <div class="inbox-card-meta">
        <span class="exchange-status-pill exchange-status-${status.tone}">${status.label}</span>
        <span>${escapeHtml(formatShortDate(item?.createdAt))}${item?.visibleUntil && status.tone === "active" ? ` · ${escapeHtml(formatRemaining(item.visibleUntil))}` : ""}</span>
      </div>
      ${contentVisible ? `<blockquote>“${escapeHtml(item.content)}”</blockquote>` : `<p class="inbox-content-hidden">${ownPostSummary}</p>`}
      ${status.tone === "pending" ? '<p class="inbox-pending-copy">审核通过且仍在 12 小时内，才会进入同店交换池。</p>' : replyMarkup}
    </article>
  `;
}

function renderInbox() {
  if (state.busy === "inbox" && !state.inboxLoaded) {
    renderLoading("正在打开我的后话……", "这里只有审核状态和一层匿名回复。");
    return;
  }

  app.innerHTML = `
    <section class="inbox-stage" aria-labelledby="inbox-title">
      <header class="page-header compact-header">
        <div>
          <p class="page-kicker">MY POSTSCRIPTS</p>
          <h1 id="inbox-title" tabindex="-1">我的后话。</h1>
        </div>
        <p>在本设备保留的匿名访问中，你可以查看审核状态和收到的一层回复。这里不能继续聊天。</p>
      </header>
      ${errorMarkup(state.inboxError, "refresh-inbox")}
      <div class="inbox-toolbar">
        <button class="button button-secondary" type="button" data-action="back-write">← 继续交换</button>
        <button class="button button-text" type="button" data-action="refresh-inbox" ${state.busy === "inbox" ? "disabled" : ""}>${state.busy === "inbox" ? "正在刷新……" : "刷新"}</button>
      </div>
      ${
        state.inboxItems.length
          ? `<div class="inbox-list">${state.inboxItems.map(renderInboxItem).join("")}</div>`
          : state.inboxError && !state.inboxLoaded
            ? ""
          : `<section class="panel inbox-empty">
              <p class="page-kicker">收件箱还是空的</p>
              <h2>你还没有留下后话。</h2>
              <p>留下之后，审核状态和匿名回复会出现在这里。</p>
              <button class="button button-primary" type="button" data-action="back-write">留下一句</button>
            </section>`
      }
    </section>
  `;
}

function wrapCanvasText(context, text, maxWidth) {
  const characters = Array.from(text);
  const lines = [];
  let line = "";
  characters.forEach((character) => {
    const candidate = `${line}${character}`;
    if (context.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = character;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function fitCanvasText(context, text, maxWidth, maxLines = 7) {
  let fontSize = 68;
  let lines = [];
  while (fontSize >= 34) {
    context.font = `600 ${fontSize}px Songti SC, serif`;
    lines = wrapCanvasText(context, text, maxWidth);
    if (lines.length <= maxLines) break;
    fontSize -= 4;
  }
  fontSize = Math.max(fontSize, 34);
  context.font = `600 ${fontSize}px Songti SC, serif`;
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    let finalLine = lines[maxLines - 1];
    while (finalLine && context.measureText(`${finalLine}…`).width > maxWidth) finalLine = finalLine.slice(0, -1);
    lines[maxLines - 1] = `${finalLine}…`;
  }
  return { fontSize, lineHeight: Math.round(fontSize * 1.45), lines };
}

function buildShareCanvas(postscript) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1440;
  canvas.setAttribute("aria-label", `分享卡文字：${postscript.content}`);
  const context = canvas.getContext("2d");
  if (!context) return canvas;
  context.fillStyle = "#11120e";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#d6f45b";
  context.fillRect(72, 72, 168, 168);
  context.fillStyle = "#11120e";
  context.font = "700 42px Arial";
  context.fillText("P.S.", 108, 171);
  context.fillStyle = "#f1f0e8";
  context.font = "500 38px Arial, sans-serif";
  context.fillText("POSTSCRIPT / 后话客厅", 72, 315);
  context.fillStyle = "#8f9287";
  context.font = "28px Arial, sans-serif";
  context.fillText(`一句来自 ${postscript.anonymousName}`, 72, 368);
  context.fillStyle = "#f1f0e8";
  const fittedText = fitCanvasText(context, `“${postscript.content}”`, 900);
  context.font = `600 ${fittedText.fontSize}px Songti SC, serif`;
  fittedText.lines.forEach((line, index) => context.fillText(line, 72, 540 + index * fittedText.lineHeight));
  context.strokeStyle = "rgba(241,240,232,.28)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(72, 1190);
  context.lineTo(1008, 1190);
  context.stroke();
  context.fillStyle = "#f1f0e8";
  context.font = "600 32px Arial, sans-serif";
  context.fillText("一杯酒 / 一个问题 / 一句话", 72, 1260);
  context.fillStyle = "#8f9287";
  context.font = "25px Arial, sans-serif";
  context.fillText("PostScript Digital Lounge", 72, 1310);
  context.fillText("正式发布时接入可扫描二维码", 72, 1350);
  return canvas;
}

function renderShare() {
  if (sharedMode) {
    state.view = "receive";
    renderReceive();
    return;
  }
  const postscript = currentPostscript();
  if (!postscript) {
    state.view = "receive";
    renderReceive();
    return;
  }
  app.innerHTML = `
    <section class="share-stage" aria-labelledby="share-title">
      <header class="page-header compact-header">
        <div><p class="page-kicker">Share Card · 本机演示</p><h1 id="share-title" tabindex="-1">把这一句，<br />带到店外。</h1></div>
        <p>这个导出只在本机演示模式开放，共享模式不导出陌生人的内容。</p>
      </header>
      <div class="share-layout">
        <div class="share-canvas-wrap" data-share-canvas></div>
        <div class="share-copy">
          <p class="prototype-note">当前本地预览没有固定正式域名，因此不生成伪二维码。</p>
          <p class="share-save-hint">微信或 iOS 没有弹出保存时，可以长按上方图片保存。</p>
          <div class="button-row share-buttons">
            <button class="button button-primary" type="button" data-action="save-card">保存图片</button>
            <button class="button button-secondary" type="button" data-action="back-receive">返回这句后话</button>
          </div>
        </div>
      </div>
    </section>
  `;
  state.shareCanvas = buildShareCanvas(postscript);
  const preview = new Image();
  preview.src = state.shareCanvas.toDataURL("image/png");
  preview.alt = state.shareCanvas.getAttribute("aria-label") ?? "PostScript 后话分享卡";
  app.querySelector("[data-share-canvas]")?.append(preview);
  track("generate_share_card", { postscriptId: postscript.id, mode: "local-demo" });
}

function render({ focusHeading = true } = {}) {
  updateChrome();
  window.clearTimeout(expiryTimer);
  expiryTimer = null;
  if (sharedMode && state.busy === "bootstrap") renderLoading();
  else if (sharedMode && state.bootstrapError) renderBootstrapError();
  else if (state.view === "receive") renderReceive();
  else if (state.view === "reply") renderReply();
  else if (state.view === "share") renderShare();
  else if (state.view === "inbox") renderInbox();
  else renderWrite();
  hydrateContextLinks(app);
  if (focusHeading) {
    window.requestAnimationFrame(() => app.querySelector("h1")?.focus({ preventScroll: true }));
  }
  scheduleExpiryCheck();
}

async function bootShared() {
  state.bootstrapError = "";
  state.busy = "bootstrap";
  render();
  try {
    if (state.deliveryToken && !state.remotePostscript) await resumeCachedDelivery();
    let canWrite = true;
    try {
      await ensureCredential();
    } catch (error) {
      if (!isWriteWindowError(error)) throw error;
      canWrite = false;
      state.retryReceiveAllowed = false;
      state.pageError = friendlyError(error, "这一轮的提交时间已结束。");
    }
    state.busy = "";
    const resumeView = state.view;
    if (
      canWrite &&
      !state.deliveryToken &&
      ["receive", "reply"].includes(resumeView) &&
      (state.receiveRequestId || state.deliveryRequestId)
    ) {
      if (!state.receiveRequestId) state.receiveRequestId = state.deliveryRequestId;
      await receiveNextShared({ retry: true, restoreView: resumeView });
    }
    await refreshInbox({ background: state.view !== "inbox" });
    if (canWrite && !currentWriteCredential()) await ensureCredential();
    render();
  } catch (error) {
    state.busy = "";
    state.bootstrapError = friendlyError(error, `${sharedModeName}服务暂时不可用，请稍后重试。`);
    render();
  }
}

function submitPostscriptLocal(content) {
  const activeSession = getSession();
  const postscripts = activeLocalRecords(STORAGE_KEYS.postscripts, activeSession.sessionId);
  const submission = {
    id: createId("postscript"),
    sessionId: activeSession.sessionId,
    content,
    category: state.category,
    anonymousName: activeSession.anonymousName,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + LOCAL_CONTENT_TTL_MS).toISOString(),
    status: "pending_local",
  };
  postscripts.push(submission);
  writeStore(STORAGE_KEYS.postscripts, postscripts.slice(-25));
  state.submissionId = submission.id;
  state.view = "receive";
  state.error = "";
  state.draft = "";
  receiveNextLocal();
  persist();
  track("submit_postscript", { postscriptId: submission.id, category: submission.category, mode: "local-demo" });
  track("receive_postscript", { postscriptId: state.currentReceivedId, mode: "seed-demo" });
  render();
  announce("本机演示已保存，现在收到一句示例后话");
}

async function submitPostscriptShared(content) {
  if (!state.submitRequestId) state.submitRequestId = createId("submit");
  state.busy = "submit";
  state.pageError = "";
  persist();
  render({ focusHeading: false });
  try {
    const result = await withCredential((credential) =>
      exchangeApi.submit(credential, {
        content,
        category: state.category,
        clientRequestId: state.submitRequestId,
      }),
    );
    const postscript = result?.postscript ?? result;
    const status = normalizeStatus(postscript?.status);
    if (status === "rejected") {
      state.error = "这句话没有发布，请换一种表达后再试。";
      state.busy = "";
      state.submitRequestId = null;
      persist();
      render({ focusHeading: false });
      return;
    }
    if (status === "expired") {
      state.error = "这一轮的提交时间已结束。请重新进入后再留下新内容。";
      state.busy = "";
      state.submitRequestId = null;
      persist();
      render({ focusHeading: false });
      return;
    }
    state.notice =
      status === "active"
        ? {
            tone: "success",
            title: "已经留在这家店",
            body: `通过审核。${postscript?.visibleUntil ? formatRemaining(postscript.visibleUntil) : "12 小时内"}，同店的人可能会看到它。`,
          }
        : {
            tone: "pending",
            title: "已经收下，等待审核",
            body: "它现在不会出现在交换池；审核通过且仍在 12 小时内，才会被同店的人看到。你仍然可以带走一句。",
          };
    state.busy = "";
    state.error = "";
    state.draft = "";
    state.submitRequestId = null;
    state.view = "receive";
    state.remotePostscript = null;
    state.deliveryToken = null;
    state.deliveryCredential = null;
    state.deliveryRequestId = null;
    state.remoteEmpty = false;
    state.receiveRemaining = null;
    persist();
    track("submit_postscript", { category: state.category, status, mode: "shared" });
    await receiveNextShared();
  } catch (error) {
    state.busy = "";
    if (isAuthenticationError(error) || isWriteWindowError(error)) state.submitRequestId = null;
    state.pageError = friendlyError(
      error,
      "我们还没确认这次是否提交成功。原文已保留；再次尝试不会重复留下。",
    );
    state.view = "write";
    persist();
    render({ focusHeading: false });
    announce(state.pageError);
  }
}

async function submitPostscript(form) {
  if (state.busy) return;
  const content = String(new FormData(form).get("content") ?? "").trim();
  const error = validateContent(content, 180);
  state.draft = content;
  state.error = error;
  if (error) {
    render({ focusHeading: false });
    window.requestAnimationFrame(() => app.querySelector("#postscript-content")?.focus({ preventScroll: true }));
    announce(error);
    return;
  }
  if (sharedMode) await submitPostscriptShared(content);
  else submitPostscriptLocal(content);
}

async function receiveNextShared({ retry = false, restoreView = "receive" } = {}) {
  if (state.busy) return;
  if (!retry || !state.receiveRequestId) state.receiveRequestId = createId("receive");
  state.busy = "receive";
  state.retryReceiveAllowed = true;
  state.pageError = "";
  state.view = "receive";
  persist();
  render();
  try {
    const credential = await ensureCredential();
    const result = await withExistingCredential(credential, (activeCredential) =>
      exchangeApi.receive(activeCredential, { clientRequestId: state.receiveRequestId }),
    );
    const received = result?.postscript ?? null;
    if (Number.isFinite(result?.remaining)) state.receiveRemaining = result.remaining;
    if (received) {
      state.deliveryRequestId = state.receiveRequestId;
      const { deliveryToken, ...postscript } = received;
      state.remotePostscript = postscript;
      state.deliveryToken = deliveryToken ?? result?.deliveryToken ?? null;
      state.deliveryCredential = credential;
      state.deliveryVisibleUntil = postscript.visibleUntil ?? null;
      state.replyState = state.repliedDeliveryRequestIds.includes(state.deliveryRequestId)
        ? "submitted"
        : postscript.replyState ?? (postscript.canReply === false ? "closed" : "eligible");
      state.remoteEmpty = false;
      track("receive_postscript", { mode: "shared" });
    } else {
      state.remotePostscript = null;
      state.deliveryToken = null;
      state.deliveryCredential = null;
      state.deliveryRequestId = null;
      state.replyState = "closed";
      state.remoteEmpty = true;
    }
    state.receiveRequestId = null;
    state.busy = "";
    if (received && restoreView === "reply") state.view = "reply";
    persist();
    render();
    announce(received ? "已经带来同店的一句后话" : "这家店暂时没有更多后话");
  } catch (error) {
    state.busy = "";
    if (isAuthenticationError(error) || isWriteWindowError(error) || error?.code === "SUBMISSION_REQUIRED") {
      state.receiveRequestId = null;
      state.deliveryRequestId = null;
      state.deliveryToken = null;
      state.deliveryCredential = null;
      state.retryReceiveAllowed = false;
      if (error?.code === "SUBMISSION_REQUIRED") state.receiveRemaining = 0;
    }
    state.pageError = friendlyError(error, "暂时没能带来下一句，请重试。");
    persist();
    render();
    announce(state.pageError);
  }
}

function submitReplyLocal(content) {
  const postscript = currentPostscript();
  const activeSession = getSession();
  const replies = activeLocalRecords(STORAGE_KEYS.replies, activeSession.sessionId);
  if (replies.some((reply) => reply.postscriptId === postscript.id)) {
    state.replyDraft = "";
    state.view = "receive";
    persist();
    render();
    announce("你已经回过这一句，本机演示也只保留一层回复");
    return;
  }
  const reply = {
    id: createId("reply"),
    postscriptId: postscript.id,
    sessionId: activeSession.sessionId,
    content,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + LOCAL_CONTENT_TTL_MS).toISOString(),
    status: "pending_local",
  };
  replies.push(reply);
  writeStore(STORAGE_KEYS.replies, replies.slice(-25));
  track("reply_postscript", { postscriptId: postscript.id, replyId: reply.id, mode: "local-demo" });
  state.replyDraft = "";
  state.view = "receive";
  persist();
  render();
  announce("回复只保存在当前设备，不会送达作者");
}

async function submitReplyShared(content) {
  if (!state.deliveryToken) {
    state.replyError = "这句后话已经无法回复，请换一句。";
    render({ focusHeading: false });
    return;
  }
  if (!state.replyRequestId) state.replyRequestId = createId("reply");
  state.busy = "reply";
  state.replyError = "";
  persist();
  render({ focusHeading: false });
  try {
    const result = await withExistingCredential(state.deliveryCredential, (credential) =>
      exchangeApi.reply(credential, {
        deliveryToken: state.deliveryToken,
        content,
        clientRequestId: state.replyRequestId,
      }),
    );
    const reply = result?.reply ?? result;
    const status = normalizeStatus(reply?.status);
    if (status === "rejected") {
      state.busy = "";
      state.replyState = "closed";
      state.replyDraft = "";
      state.replyError = "";
      if (state.deliveryRequestId && !state.repliedDeliveryRequestIds.includes(state.deliveryRequestId)) {
        state.repliedDeliveryRequestIds.push(state.deliveryRequestId);
        state.repliedDeliveryRequestIds = state.repliedDeliveryRequestIds.slice(-20);
      }
      state.notice = {
        tone: "neutral",
        title: "这次回复没有送达",
        body: "回复未通过审核，这句不再开放回复。",
      };
      state.view = "receive";
      persist();
      render();
      announce(state.notice.title);
      return;
    }
    if (status === "expired") {
      state.busy = "";
      state.replyState = "closed";
      state.replyDraft = "";
      state.replyRequestId = null;
      state.remotePostscript = null;
      state.deliveryToken = null;
      state.deliveryCredential = null;
      state.deliveryRequestId = null;
      state.remoteEmpty = true;
      state.notice = {
        tone: "neutral",
        title: "回复已结束",
        body: "这句后话的 12 小时已经结束。",
      };
      state.view = "receive";
      persist();
      render();
      return;
    }
    state.replyState = "submitted";
    if (state.deliveryRequestId && !state.repliedDeliveryRequestIds.includes(state.deliveryRequestId)) {
      state.repliedDeliveryRequestIds.push(state.deliveryRequestId);
      state.repliedDeliveryRequestIds = state.repliedDeliveryRequestIds.slice(-20);
    }
    state.notice =
      status === "active"
        ? {
            tone: "success",
            title: "匿名回复已送达",
            body: "作者可以在收件箱里看到。这里不会继续成为聊天。",
          }
        : {
            tone: "pending",
            title: "回复已经收下",
            body: "审核通过后，作者才能在收件箱看到它。",
          };
    state.busy = "";
    state.replyDraft = "";
    state.replyRequestId = null;
    state.view = "receive";
    persist();
    track("reply_postscript", { status, mode: "shared" });
    render();
    announce(state.notice.title);
  } catch (error) {
    state.busy = "";
    if (isAuthenticationError(error)) {
      state.replyRequestId = null;
      state.replyState = "closed";
      state.deliveryToken = null;
      state.deliveryCredential = null;
      state.deliveryRequestId = null;
      state.remotePostscript = null;
      state.remoteEmpty = true;
      state.pageError = friendlyError(error, "这次匿名访问已结束。");
      state.view = "receive";
      persist();
      render();
      announce(state.pageError);
      return;
    }
    if (["ALREADY_REPLIED", "DUPLICATE_REPLY"].includes(error?.code)) {
      state.replyState = "submitted";
      if (state.deliveryRequestId && !state.repliedDeliveryRequestIds.includes(state.deliveryRequestId)) {
        state.repliedDeliveryRequestIds.push(state.deliveryRequestId);
        state.repliedDeliveryRequestIds = state.repliedDeliveryRequestIds.slice(-20);
      }
      state.replyDraft = "";
      state.replyRequestId = null;
      state.notice = {
        tone: "neutral",
        title: "你已经回过这一句",
        body: "每位客人只能留下一次回应，这里不会继续聊天。",
      };
      state.view = "receive";
      persist();
      render();
      return;
    }
    if (
      error?.status === 410 ||
      ["POSTSCRIPT_EXPIRED", "DELIVERY_EXPIRED", "DELIVERY_NOT_FOUND", "GONE"].includes(error?.code)
    ) {
      state.replyState = "closed";
      state.replyDraft = "";
      state.replyRequestId = null;
      state.deliveryToken = null;
      state.deliveryCredential = null;
      state.deliveryRequestId = null;
      state.remotePostscript = null;
      state.remoteEmpty = true;
      state.notice = {
        tone: "neutral",
        title: "回复已结束",
        body: "这句后话的 12 小时已经结束。",
      };
      state.view = "receive";
      persist();
      render();
      return;
    }
    state.replyError = friendlyError(
      error,
      "我们还没确认回复是否送出。内容已保留；重试不会重复留下。",
    );
    persist();
    render({ focusHeading: false });
    announce(state.replyError);
  }
}

async function submitReply(form) {
  if (state.busy) return;
  const content = String(new FormData(form).get("content") ?? "").trim();
  state.replyDraft = content;
  state.replyError = validateContent(content, 120);
  if (state.replyError) {
    render({ focusHeading: false });
    window.requestAnimationFrame(() => app.querySelector("#reply-content")?.focus({ preventScroll: true }));
    announce(state.replyError);
    return;
  }
  if (sharedMode) await submitReplyShared(content);
  else submitReplyLocal(content);
}

async function reportRemotePostscript() {
  if (!state.deliveryToken || state.busy) return;
  if (!state.reportRequestId) state.reportRequestId = createId("report");
  state.busy = "report";
  state.pageError = "";
  persist();
  render({ focusHeading: false });
  try {
    await withExistingCredential(state.deliveryCredential, (credential) =>
      exchangeApi.report(credential, {
        deliveryToken: state.deliveryToken,
        clientRequestId: state.reportRequestId,
      }),
    );
    track("report_postscript", { mode: "shared" });
    state.busy = "";
    state.remotePostscript = null;
    state.deliveryToken = null;
    state.deliveryCredential = null;
    state.reportRequestId = null;
    state.receiveRequestId = null;
    state.deliveryRequestId = null;
    state.replyRequestId = null;
    state.replyDraft = "";
    persist();
    announce("已举报并隐藏这句话");
    await receiveNextShared();
  } catch (error) {
    state.busy = "";
    if (
      isAuthenticationError(error) ||
      error?.status === 410 ||
      ["POSTSCRIPT_EXPIRED", "DELIVERY_EXPIRED", "DELIVERY_NOT_FOUND", "GONE"].includes(error?.code)
    ) {
      state.remotePostscript = null;
      state.deliveryToken = null;
      state.deliveryCredential = null;
      state.reportRequestId = null;
      state.receiveRequestId = null;
      state.deliveryRequestId = null;
      state.remoteEmpty = true;
      state.retryReceiveAllowed = false;
    }
    state.pageError = friendlyError(error, "暂时没能提交举报，请稍后重试。");
    persist();
    render({ focusHeading: false });
    announce(state.pageError);
  }
}

async function saveCard() {
  try {
    if (!state.shareCanvas || sharedMode) return;
    const postscript = currentPostscript();
    if (!postscript) return;
    const blob = await new Promise((resolve) => state.shareCanvas.toBlob(resolve, "image/png"));
    if (!blob) {
      announce("图片生成失败，请稍后再试");
      return;
    }
    const filename = `postscript-${postscript.id}.png`;
    const file = typeof File === "function" ? new File([blob], filename, { type: "image/png" }) : null;
    if (file && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "PostScript 后话" });
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    announce("如果没有自动保存，请长按上方卡片图片保存");
  } catch (error) {
    if (error?.name === "AbortError") return;
    announce("未能自动保存，请长按上方卡片图片保存");
  }
}

app.addEventListener("input", (event) => {
  if (event.target.id === "postscript-content") {
    state.draft = event.target.value;
    const counter = app.querySelector("[data-character-count]");
    if (counter) counter.textContent = `${state.draft.length}/180`;
  } else if (event.target.id === "reply-content") {
    state.replyDraft = event.target.value;
  }
});

app.addEventListener("submit", (event) => {
  event.preventDefault();
  if (event.target.matches('[data-form="postscript"]')) void submitPostscript(event.target);
  if (event.target.matches('[data-form="reply"]')) void submitReply(event.target);
});

app.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button || button.disabled) return;

  if (button.dataset.category) {
    state.category = button.dataset.category;
    persist();
    render({ focusHeading: false });
    window.requestAnimationFrame(() =>
      app.querySelector(`[data-category="${state.category}"]`)?.focus({ preventScroll: true }),
    );
    return;
  }

  const action = button.dataset.action;
  if (action === "retry-bootstrap") {
    void bootShared();
  } else if (action === "retry-submit") {
    app.querySelector('[data-form="postscript"]')?.requestSubmit();
  } else if (action === "restart-exchange" || action === "back-write") {
    state.view = "write";
    state.submissionId = null;
    state.currentReceivedId = null;
    state.receiveHistory = [];
    state.remotePostscript = null;
    state.deliveryToken = null;
    state.deliveryCredential = null;
    state.submitRequestId = null;
    state.reportRequestId = null;
    state.remoteEmpty = false;
    state.receiveRemaining = null;
    state.receiveRequestId = null;
    state.deliveryRequestId = null;
    state.replyRequestId = null;
    state.error = "";
    state.replyError = "";
    state.pageError = "";
    state.notice = null;
    state.draft = "";
    state.replyDraft = "";
    persist();
    track("restart_exchange", { mode: sharedMode ? "shared" : "local-demo" });
    render();
    announce("可以再留一句新的后话");
  } else if (action === "next-postscript") {
    if (sharedMode) {
      state.remotePostscript = null;
      state.deliveryToken = null;
      state.deliveryCredential = null;
      state.reportRequestId = null;
      state.deliveryRequestId = null;
      state.replyRequestId = null;
      state.replyDraft = "";
      state.replyState = "eligible";
      state.receiveRequestId = null;
      state.pageError = "";
      void receiveNextShared();
    } else {
      track("exchange_skip", { postscriptId: state.currentReceivedId, mode: "local-demo" });
      receiveNextLocal();
      track("receive_postscript", { postscriptId: state.currentReceivedId, mode: "seed-demo" });
      render();
      announce("已经换到另一句演示后话");
    }
  } else if (action === "retry-receive") {
    void receiveNextShared({ retry: true });
  } else if (action === "reply") {
    state.view = "reply";
    state.replyError = "";
    persist();
    render();
  } else if (action === "share" && !sharedMode) {
    state.view = "share";
    persist();
    render();
  } else if (action === "back-receive") {
    state.view = "receive";
    state.replyError = "";
    persist();
    render();
  } else if (action === "report") {
    if (sharedMode) {
      void reportRemotePostscript();
    } else {
      const activeSession = getSession();
      const reports = activeLocalRecords(STORAGE_KEYS.reports, activeSession.sessionId);
      if (!reports.some((report) => report.postscriptId === state.currentReceivedId)) {
        reports.push({
          reportId: createId("report"),
          postscriptId: state.currentReceivedId,
          sessionId: activeSession.sessionId,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + LOCAL_CONTENT_TTL_MS).toISOString(),
          mode: "local-demo",
        });
      }
      writeStore(STORAGE_KEYS.reports, reports.slice(-50));
      track("report_postscript", { postscriptId: state.currentReceivedId, mode: "local-demo" });
      receiveNextLocal();
      render();
      announce("已在当前设备隐藏这句演示内容");
    }
  } else if (action === "save-card") {
    void saveCard();
  } else if (action === "open-inbox") {
    state.view = "inbox";
    persist();
    void refreshInbox();
  } else if (action === "refresh-inbox") {
    void refreshInbox();
  }
});

inboxEntry?.addEventListener("click", () => {
  if (!sharedMode || state.busy === "bootstrap") return;
  state.view = "inbox";
  persist();
  void refreshInbox();
});

async function refreshVisibleSharedState() {
  if (state.busy) return;
  try {
    if (state.deliveryToken && state.deliveryCredential) {
      await resumeCachedDelivery();
      if (state.remotePostscript && remotePostIsExpired()) expireCurrentRemotePost();
      else render({ focusHeading: false });
    }
    if (state.view === "inbox") await refreshInbox({ background: true });
  } catch (error) {
    state.pageError = friendlyError(error, "暂时没能确认这句后话的最新状态，请稍后重试。");
    persist();
    render({ focusHeading: false });
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden || !sharedMode) return;
  void refreshVisibleSharedState();
});

updateChrome();
if (sharedMode) void bootShared();
else render();
