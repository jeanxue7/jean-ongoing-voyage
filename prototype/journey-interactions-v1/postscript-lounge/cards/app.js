import {
  announce,
  escapeHtml,
  getSession,
  hydrateContextLinks,
  readStore,
  shuffle,
  track,
  trackOnce,
  writeStore,
} from "../shared/core.js";
import { questions } from "./questions.js";

const app = document.querySelector("#cards-app");
const STORAGE_KEY = "ps_lounge_cards_state_v1";
const initialSession = getSession();

const relations = [
  { id: "any", label: "不限定" },
  { id: "new", label: "刚认识" },
  { id: "friends", label: "朋友局" },
  { id: "date", label: "有点暧昧" },
  { id: "close", label: "很熟了" },
];

const depths = [
  { id: 1, label: "随便聊聊", mark: "🌱" },
  { id: 2, label: "有点东西", mark: "🍸" },
  { id: 3, label: "再深一点", mark: "🌙" },
  { id: 4, label: "今晚别装了", mark: "◆" },
];

const playerCounts = [3, 4, 5, 6];

const cardFormats = {
  question: {
    label: "轮流说",
    prompt: "让每个人把话说完。任何人都可以跳过，不需要解释。",
  },
  guess: {
    label: "互相猜",
    prompt: "先猜，再让本人揭晓。猜错也别替别人下结论；任何人都可以跳过。",
  },
  together: {
    label: "一起答",
    prompt: "这类牌可以一起答；愿意的人参与。答案不一样也没关系，不用争出一个正确答案。",
  },
  action: {
    label: "小行动",
    prompt: "愿意的人再参与。任何人都可以跳过，也不用解释。",
  },
};

const poolKeyPattern = /^(any|new|friends|date|close):(1|2|3|4):(3|4|5|6)$/;

function sanitizeSeenByPool(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key, ids]) => poolKeyPattern.test(key) && Array.isArray(ids))
      .map(([key, ids]) => [
        key,
        [...new Set(ids.filter((id) => questions.some((item) => item.id === id)))].slice(-questions.length),
      ]),
  );
}

const savedValue = readStore(STORAGE_KEY, {});
const saved = savedValue.sessionId === initialSession.sessionId ? savedValue : {};
const savedPlayerCount = playerCounts.includes(saved.playerCount) ? saved.playerCount : 4;
const hasSeenPoolSchema =
  saved.seenByPool && typeof saved.seenByPool === "object" && !Array.isArray(saved.seenByPool);
const state = {
  ownerSessionId: initialSession.sessionId,
  view: saved.view === "draw" ? "draw" : "setup",
  relationship: relations.some((item) => item.id === saved.relationship) ? saved.relationship : "any",
  depth: depths.some((item) => item.id === saved.depth) ? saved.depth : 2,
  playerCount: savedPlayerCount,
  seatIndex:
    Number.isInteger(saved.seatIndex) && saved.seatIndex >= 0 && saved.seatIndex < savedPlayerCount
      ? saved.seatIndex
      : 0,
  drawCount: Number.isInteger(saved.drawCount) ? saved.drawCount : 0,
  history: Array.isArray(saved.history) ? saved.history.filter((id) => questions.some((item) => item.id === id)) : [],
  currentId: questions.some((item) => item.id === saved.currentId) ? saved.currentId : null,
  seenByPool: sanitizeSeenByPool(saved.seenByPool),
  bag: [],
};

let migratedLegacyState = false;
if (!hasSeenPoolSchema && state.view === "draw") {
  const legacyPoolKey = `${state.relationship}:${state.depth}:${state.playerCount}`;
  const eligibleIds = new Set(
    questions
      .filter(
        (item) =>
          item.status === "active" &&
          item.depth === state.depth &&
          (item.minPlayers ?? 3) <= state.playerCount &&
          (item.maxPlayers ?? 6) >= state.playerCount &&
          (state.relationship === "any" || item.relationships.includes(state.relationship)),
      )
      .map((item) => item.id),
  );
  state.seenByPool[legacyPoolKey] = [
    ...new Set([...state.history, state.currentId].filter((id) => eligibleIds.has(id))),
  ];
  migratedLegacyState = true;
}

trackOnce("cards_view");
hydrateContextLinks();

function persist() {
  writeStore(STORAGE_KEY, {
    sessionId: state.ownerSessionId,
    view: state.view,
    relationship: state.relationship,
    depth: state.depth,
    playerCount: state.playerCount,
    seatIndex: state.seatIndex,
    drawCount: state.drawCount,
    history: state.history.slice(-questions.length),
    currentId: state.currentId,
    seenByPool: state.seenByPool,
  });
}

if (migratedLegacyState) persist();

function resetForSession(sessionId) {
  state.ownerSessionId = sessionId;
  state.view = "setup";
  state.relationship = "any";
  state.depth = 2;
  state.playerCount = 4;
  state.seatIndex = 0;
  state.drawCount = 0;
  state.history = [];
  state.currentId = null;
  state.seenByPool = {};
  state.bag = [];
}

function ensureActiveSession() {
  const activeSession = getSession();
  if (activeSession.sessionId === state.ownerSessionId) return true;
  resetForSession(activeSession.sessionId);
  persist();
  trackOnce("cards_view");
  return false;
}

function currentPoolKey() {
  return `${state.relationship}:${state.depth}:${state.playerCount}`;
}

function currentQuestion() {
  return questions.find((item) => item.id === state.currentId) ?? null;
}

function eligibleQuestions() {
  const exact = questions.filter(
    (item) =>
      item.status === "active" &&
      item.depth === state.depth &&
      (item.minPlayers ?? 3) <= state.playerCount &&
      (item.maxPlayers ?? 6) >= state.playerCount &&
      (state.relationship === "any" || item.relationships.includes(state.relationship)),
  );
  return exact;
}

function refillBag() {
  const previousId = state.currentId;
  const key = currentPoolKey();
  const eligibleIds = eligibleQuestions().map((item) => item.id);
  const seen = new Set(state.seenByPool[key] ?? []);
  let candidates = eligibleIds.filter((id) => !seen.has(id));

  if (!candidates.length) {
    state.seenByPool[key] = [];
    candidates = eligibleIds;
  }

  state.bag = shuffle(candidates);
  if (state.bag.length > 1 && state.bag[0] === previousId) {
    state.bag.push(state.bag.shift());
  }
}

function drawQuestion({ count = true } = {}) {
  if (!state.bag.length) refillBag();
  const nextId = state.bag.shift();
  if (!nextId) return;

  state.currentId = nextId;
  const key = currentPoolKey();
  const seen = state.seenByPool[key] ?? [];
  if (!seen.includes(nextId)) state.seenByPool[key] = [...seen, nextId];
  if (count) state.drawCount += 1;
  state.history.push(nextId);
  persist();

  const question = currentQuestion();
  track("draw_card", {
    questionId: nextId,
    category: question?.category,
    format: question?.format,
    sensitivity: question?.sensitivity,
    depth: state.depth,
    relationship: state.relationship,
    playerCount: state.playerCount,
    seatNumber: state.seatIndex + 1,
    drawCount: state.drawCount,
  });

  if (state.drawCount === 3) {
    trackOnce("cards_three", {
      depth: state.depth,
      relationship: state.relationship,
      playerCount: state.playerCount,
    });
  }
}

function renderSetup() {
  app.innerHTML = `
    <section aria-labelledby="cards-title">
      <header class="page-header">
        <div>
          <p class="page-kicker">US · 一个问题</p>
          <h1 id="cards-title" tabindex="-1">今晚，<br />聊点真的。</h1>
        </div>
        <p>为 3–6 人同桌设计。按这桌今晚的关系和舒服的深度来选，剩下的交给问题。</p>
      </header>

      <div class="panel cards-setup-panel">
        <div class="field-group">
          <div class="field-label">
            <strong id="player-count-label">今晚几个人？</strong>
            <span>3–6 人</span>
          </div>
          <div
            class="choice-grid player-count-grid"
            role="group"
            aria-labelledby="player-count-label"
            aria-describedby="player-count-hint"
          >
            ${playerCounts
              .map(
                (count) => `
                  <button
                    class="choice-button"
                    type="button"
                    data-player-count="${count}"
                    aria-pressed="${state.playerCount === count}"
                  >${count} 人</button>
                `,
              )
              .join("")}
          </div>
          <p class="field-hint" id="player-count-hint">拿手机的人是 1 号，其余按顺时针编号；点“聊完了”后，下一位接着读。</p>
        </div>

        <div class="field-group">
          <div class="field-label">
            <strong id="relation-label">这桌大概是什么关系？</strong>
            <span>按整体感觉选</span>
          </div>
          <div class="choice-grid relation-grid" role="group" aria-labelledby="relation-label">
            ${relations
              .map(
                (item) => `
                  <button
                    class="choice-button"
                    type="button"
                    data-relation="${item.id}"
                    aria-pressed="${state.relationship === item.id}"
                  >${item.label}</button>
                `,
              )
              .join("")}
          </div>
        </div>

        <div class="field-group">
          <div class="field-label">
            <strong id="depth-label">今晚聊到哪里？</strong>
            <span>四种深度</span>
          </div>
          <div class="choice-grid depth-grid" role="group" aria-labelledby="depth-label" aria-describedby="depth-hint">
            ${depths
              .map(
                (item) => `
                  <button
                    class="choice-button depth-choice"
                    type="button"
                    data-depth="${item.id}"
                    aria-pressed="${state.depth === item.id}"
                  ><span aria-hidden="true">${item.mark}</span><strong>${item.label}</strong></button>
                `,
              )
              .join("")}
          </div>
          <p class="field-hint" id="depth-hint">“今晚别装了”会碰到前任、钱、家庭、身体和旧伤。有点尖，但不逼答。</p>
        </div>

        <div class="button-row">
          <button class="button button-primary" type="button" data-action="start-card">
            抽第一张 <span aria-hidden="true">↗</span>
          </button>
        </div>
      </div>

      <p class="prototype-note cards-editorial-note">
        当前共 ${questions.length} 张，包含轮流说、互相猜、一起答和小行动。任何一张都可以直接换掉，不需要解释。
      </p>
    </section>
  `;
}

function renderDraw() {
  let question = currentQuestion();
  if (!question) {
    drawQuestion({ count: state.drawCount === 0 });
    question = currentQuestion();
  }

  if (!question) {
    app.innerHTML = `
      <section class="panel empty-state" aria-labelledby="empty-title">
        <p class="page-kicker">题库暂时空了</p>
        <h1 id="empty-title" tabindex="-1">换一个深度再试试。</h1>
        <button class="button button-primary" type="button" data-action="adjust">调整选择</button>
      </section>
    `;
    return;
  }

  const relationLabel = relations.find((item) => item.id === state.relationship)?.label ?? "不限定";
  const depthLabel = depths.find((item) => item.id === state.depth)?.label ?? "";
  const format = cardFormats[question.format] ?? cardFormats.question;
  const seatNumber = state.seatIndex + 1;
  const formatPrompt =
    question.format === "question"
      ? `从 ${seatNumber} 号开始，顺时针。${format.prompt}`
      : `由 ${seatNumber} 号读牌。${format.prompt}`;

  app.innerHTML = `
    <section class="draw-stage" aria-labelledby="question-title">
      <div class="draw-meta">
        <span>${escapeHtml(relationLabel)} · ${escapeHtml(depthLabel)}</span>
        <span class="draw-count">${state.playerCount} 人局 · 第 ${state.drawCount} 张</span>
      </div>

      <article class="question-card" aria-labelledby="question-title" aria-describedby="question-prompt">
        <div class="question-card-topline">
          <span>POSTSCRIPT / ${String(state.drawCount).padStart(2, "0")}</span>
          <span>${escapeHtml(format.label)} · ${escapeHtml(question.category)}</span>
        </div>
        <p class="question-mark" aria-hidden="true">“</p>
        <h1 id="question-title" tabindex="-1" aria-describedby="question-prompt">${escapeHtml(question.content)}</h1>
        <p class="question-prompt" id="question-prompt">${escapeHtml(formatPrompt)}</p>
      </article>

      <div class="draw-controls">
        <button class="button button-primary" type="button" data-action="complete-card">
          聊完了，下一张 <span aria-hidden="true">↗</span>
        </button>
        <button class="button button-secondary" type="button" data-action="skip-card">不想答，换一张</button>
        <button class="button button-text cards-adjust-button" type="button" data-action="adjust">调整人数 / 关系 / 深度</button>
      </div>
    </section>
  `;
}

function render({ focusHeading = true } = {}) {
  if (state.view === "draw") renderDraw();
  else renderSetup();
  hydrateContextLinks(app);
  if (focusHeading) {
    window.requestAnimationFrame(() => app.querySelector("h1")?.focus({ preventScroll: true }));
  }
}

app.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;

  if (!ensureActiveSession()) {
    render();
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    announce("上一次牌局已经结束，已为这一桌重新开始");
    return;
  }

  if (target.dataset.playerCount) {
    state.playerCount = Number(target.dataset.playerCount);
    state.seatIndex = 0;
    state.bag = [];
    persist();
    track("cards_player_count_select", { playerCount: state.playerCount });
    render({ focusHeading: false });
    window.requestAnimationFrame(() =>
      app.querySelector(`[data-player-count="${state.playerCount}"]`)?.focus({ preventScroll: true }),
    );
    return;
  }

  if (target.dataset.relation) {
    state.relationship = target.dataset.relation;
    state.bag = [];
    persist();
    render({ focusHeading: false });
    window.requestAnimationFrame(() =>
      app.querySelector(`[data-relation="${state.relationship}"]`)?.focus({ preventScroll: true }),
    );
    return;
  }

  if (target.dataset.depth) {
    state.depth = Number(target.dataset.depth);
    state.bag = [];
    persist();
    render({ focusHeading: false });
    window.requestAnimationFrame(() =>
      app.querySelector(`[data-depth="${state.depth}"]`)?.focus({ preventScroll: true }),
    );
    return;
  }

  if (target.dataset.action === "start-card") {
    state.view = "draw";
    state.drawCount = 0;
    state.history = [];
    state.currentId = null;
    state.bag = [];
    state.seatIndex = 0;
    track("start_card", {
      depth: state.depth,
      relationship: state.relationship,
      playerCount: state.playerCount,
    });
    drawQuestion();
    render();
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    announce("已经抽到第一张后话卡");
    return;
  }

  if (target.dataset.action === "complete-card") {
    track("card_complete", {
      questionId: state.currentId,
      playerCount: state.playerCount,
      seatNumber: state.seatIndex + 1,
    });
    state.seatIndex = (state.seatIndex + 1) % state.playerCount;
    drawQuestion();
    render();
    announce(`第 ${state.drawCount} 张后话卡，从 ${state.seatIndex + 1} 号开始`);
    return;
  }

  if (target.dataset.action === "skip-card") {
    track("card_skip", {
      questionId: state.currentId,
      playerCount: state.playerCount,
      seatNumber: state.seatIndex + 1,
    });
    drawQuestion();
    render();
    announce(`已经跳过上一张，仍从 ${state.seatIndex + 1} 号开始`);
    return;
  }

  if (target.dataset.action === "adjust") {
    track("cards_settings_adjust", {
      playerCount: state.playerCount,
      depth: state.depth,
      relationship: state.relationship,
    });
    state.view = "setup";
    persist();
    render();
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    announce("返回人数、关系与深度选择");
  }
});

render();
