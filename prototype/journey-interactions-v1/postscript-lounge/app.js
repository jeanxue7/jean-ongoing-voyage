import { getSession, hydrateContextLinks, trackOnce } from "./shared/core.js";

const session = getSession();

document.querySelectorAll("[data-session-alias]").forEach((element) => {
  element.textContent = session.anonymousName;
});

hydrateContextLinks();

trackOnce("scan_qr", {
  source: session.source,
  storeId: session.storeId,
  tableId: session.tableId || null,
});
trackOnce("home_view");

document.documentElement.classList.add("is-ready");
