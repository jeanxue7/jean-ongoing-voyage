import { apiUrl, sharedModeVerified } from "./runtime-config.js";

export class ExchangeApiError extends Error {
  constructor(message, { code = "UNKNOWN_ERROR", status = 0, retryable = false, details = null } = {}) {
    super(message);
    this.name = "ExchangeApiError";
    this.code = code;
    this.status = status;
    this.retryable = retryable;
    this.details = details;
  }
}

export function isSharedExchangeEnabled() {
  return Boolean(apiUrl);
}

export function isSharedExchangeVerified() {
  return Boolean(apiUrl) && sharedModeVerified;
}

function normalizeError(payload, response) {
  const source = payload?.error && typeof payload.error === "object" ? payload.error : payload;
  const status = response?.status ?? 0;
  return new ExchangeApiError("Exchange API request failed", {
    code: typeof source?.code === "string" ? source.code : `HTTP_${status || "ERROR"}`,
    status,
    retryable: typeof source?.retryable === "boolean" ? source.retryable : status === 0 || status >= 500,
    details: source?.details ?? null,
  });
}

async function request(action, payload = {}, { credential = "", signal } = {}) {
  if (!apiUrl) {
    throw new ExchangeApiError("Exchange API is not configured", {
      code: "API_NOT_CONFIGURED",
    });
  }

  const headers = { "Content-Type": "application/json" };
  if (action !== "bootstrap") {
    if (!credential) {
      throw new ExchangeApiError("Exchange credential is missing", {
        code: "CREDENTIAL_REQUIRED",
      });
    }
    headers.Authorization = `Bearer ${credential}`;
  }

  const controller = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener("abort", abortFromCaller, { once: true });
  const timeoutId = globalThis.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 15_000);

  let response;
  let text;
  try {
    response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ action, ...payload }),
      signal: controller.signal,
    });
    text = await response.text();
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new ExchangeApiError("Exchange API request was cancelled", {
        code: timedOut ? "REQUEST_TIMEOUT" : "REQUEST_ABORTED",
        retryable: true,
      });
    }
    throw new ExchangeApiError("Exchange API could not be reached", {
      code: "NETWORK_ERROR",
      retryable: true,
    });
  } finally {
    globalThis.clearTimeout(timeoutId);
    signal?.removeEventListener("abort", abortFromCaller);
  }

  let result = {};
  if (text) {
    try {
      result = JSON.parse(text);
    } catch (_error) {
      throw new ExchangeApiError("Exchange API returned invalid JSON", {
        code: "INVALID_RESPONSE",
        status: response.status,
        retryable: response.status >= 500,
      });
    }
  }

  if (!response.ok || result?.ok === false) throw normalizeError(result, response);
  return result?.data && typeof result.data === "object" ? result.data : result;
}

export function bootstrap(payload, options = {}) {
  return request("bootstrap", payload, options);
}

export function submit(credential, payload, options = {}) {
  return request("submit", payload, { ...options, credential });
}

export function receive(credential, payload, options = {}) {
  return request("receive", payload, { ...options, credential });
}

export function resume(credential, payload, options = {}) {
  return request("resume", payload, { ...options, credential });
}

export function reply(credential, payload, options = {}) {
  return request("reply", payload, { ...options, credential });
}

export function inbox(credential, options = {}) {
  return request("inbox", {}, { ...options, credential });
}

export function report(credential, { deliveryToken, clientRequestId, reason }, options = {}) {
  const payload = { deliveryToken, clientRequestId };
  if (reason) payload.reason = reason;
  return request("report", payload, { ...options, credential });
}
