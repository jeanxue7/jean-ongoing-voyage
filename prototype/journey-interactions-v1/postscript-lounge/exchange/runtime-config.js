// Leave empty for the explicit, device-only demo. A deployment may either
// replace this value or define globalThis.__POSTSCRIPT_RUNTIME_CONFIG__ before
// loading exchange/app.js.
const fallbackApiUrl = "";
const fallbackSharedModeVerified = false;

const runtimeConfig = globalThis.__POSTSCRIPT_RUNTIME_CONFIG__;
const runtimeApiUrl = runtimeConfig?.exchangeApiUrl;

export const apiUrl = String(runtimeApiUrl ?? fallbackApiUrl).trim();
export const sharedModeVerified =
  apiUrl.length > 0 &&
  (runtimeConfig?.sharedModeVerified ??
    runtimeConfig?.sharedVerified ??
    runtimeConfig?.verifiedLaunch ??
    fallbackSharedModeVerified) === true;
