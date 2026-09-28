import { announce, getSession, hydrateContextLinks, track, trackOnce } from "../shared/core.js";

getSession();
hydrateContextLinks();
trackOnce("wine_view");

let lastResultId = null;
let lastScreenTitle = null;
let pendingFocus = null;

const controlFocusActions = new Set(["choose", "filter", "rotate"]);
const headingFocusActions = new Set([
  "start",
  "catalogue",
  "continue",
  "back",
  "restart",
  "edit-avoidance",
  "detail",
  "close-sheet",
  "dismiss-sheet",
]);

function captureResult() {
  const resultScreen = document.querySelector(".results-screen");
  if (!resultScreen) return;
  const primaryButton = resultScreen.querySelector('[data-action="detail"][data-id]');
  const drinkId = primaryButton?.dataset.id ?? null;
  if (!drinkId || drinkId === lastResultId) return;
  lastResultId = drinkId;
  track("wine_result", { recommendedWineId: drinkId });
}

function captureScreenTitle() {
  const heading = document.querySelector("#app h1");
  const title = heading?.textContent?.trim();
  const changed = Boolean(title && title !== lastScreenTitle);
  if (changed) {
    lastScreenTitle = title;
    announce(title);
  }
  return { changed, heading };
}

function syncFilterState() {
  document.querySelectorAll(".filter-button").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.classList.contains("is-active")));
  });
}

function announceControlUpdate(focusRequest) {
  if (focusRequest?.action === "filter") {
    const count = document.querySelectorAll(".catalogue-grid .drink-card").length;
    announce(`已筛选${focusRequest.value}，显示 ${count} 款酒`);
  }

  if (focusRequest?.action === "rotate") {
    const names = Array.from(document.querySelectorAll(".alternative-card strong"))
      .map((item) => item.textContent?.trim())
      .filter(Boolean);
    announce(names.length ? `已换一组推荐：${names.join("、")}` : "已换一组推荐");
  }
}

function restoreFocus({ changed, heading }) {
  const focusRequest = pendingFocus;
  pendingFocus = null;
  let target = null;

  if (focusRequest?.mode === "control") {
    const candidates = Array.from(document.querySelectorAll(`[data-action="${focusRequest.action}"]`));
    target = candidates.find(
      (candidate) =>
        (focusRequest.value === null || candidate.dataset.value === focusRequest.value) &&
        (focusRequest.id === null || candidate.dataset.id === focusRequest.id),
    );
  }

  if (!target && (focusRequest?.mode === "heading" || changed)) target = heading;
  announceControlUpdate(focusRequest);
  if (!target) return;
  if (target === heading) target.setAttribute("tabindex", "-1");

  window.requestAnimationFrame(() => {
    try {
      target.focus({ preventScroll: true });
    } catch (_error) {
      target.focus();
    }
  });
}

function captureWineState() {
  captureResult();
  syncFilterState();
  restoreFocus(captureScreenTitle());
}

document.addEventListener("click", (event) => {
  const control = event.target.closest?.("[data-action]");
  if (!control) return;
  const action = control.dataset.action;

  if (controlFocusActions.has(action)) {
    pendingFocus = {
      mode: "control",
      action,
      value: control.dataset.value ?? null,
      id: control.dataset.id ?? null,
    };
  } else if (headingFocusActions.has(action)) {
    pendingFocus = { mode: "heading" };
  }

  if (action === "start") {
    track("start_wine");
  }

  if (action === "order") {
    track("click_order", { wineId: control.dataset.id ?? null });
  }

  if (action === "restart") {
    lastResultId = null;
  }
}, true);

const app = document.querySelector("#app");
if (app) {
  const observer = new MutationObserver(captureWineState);
  observer.observe(app, { childList: true, subtree: true });
  captureWineState();
}
