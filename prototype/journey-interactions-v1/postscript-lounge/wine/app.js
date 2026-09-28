(function () {
  "use strict";

  const drinks = Array.isArray(window.DRINKS) ? window.DRINKS : [];
  const app = document.querySelector("#app");

  const flavorGroups = {
    fruit: ["柑橘", "酸甜", "莓果", "青苹果", "柠檬", "热带", "果香", "橘子香", "青柠", "可乐", "菠萝", "芒果", "百香果", "西柚"],
    floral: ["花香", "花茶", "茉莉", "薰衣草", "玫瑰", "接骨木花", "洛神花"],
    teaHerbal: ["茶香", "伯爵茶", "伯爵", "绿茶", "红茶", "抹茶", "咖啡", "植物", "紫苏", "花茶"],
    smokyWood: ["烟熏", "木质调", "木质", "威士忌", "谷物", "比特酒"],
    spice: ["香料", "姜味", "辛香", "藤椒", "姜", "肉桂", "杜松子", "奎宁苦味"],
    creamy: ["奶香", "红豆", "奶油", "牛奶", "乳清"],
  };

  const answerLabels = {
    alcohol: { alcohol: "来杯小酒！", none: "尝尝无酒精～", any: "都可以" },
    flavors: {
      fruit: "清爽果香",
      floral: "花香轻盈",
      teaHerbal: "茶香草本",
      smokyWood: "烟熏木质",
      spice: "香料辛香",
      creamy: "奶香甜润",
    },
    feeling: {
      easy: "清爽好入口",
      layered: "平衡有层次",
      bold: "大胆、有记忆点",
      rich: "浓郁慢慢喝",
      featured: "喝代表作！",
    },
    avoids: {
      dairy: "奶制品",
      caffeine: "咖啡因",
      spicy: "辛香",
      tea: "茶味",
      herbal: "草本",
      none: "无忌口",
    },
    budget: { 48: "¥48", 58: "¥58", 68: "¥68", any: "价格不重要" },
  };

  const questions = [
    {
      key: "alcohol",
      title: "今晚想喝什么？",
      note: "",
      layout: "list",
      options: [
        { id: "alcohol", label: "来杯小酒！", mark: "酒" },
        { id: "none", label: "尝尝无酒精～", mark: "0" },
        { id: "any", label: "都可以", mark: "随" },
      ],
    },
    {
      key: "flavors",
      title: "今晚想试试哪种味道？",
      note: "最多选两个",
      layout: "grid",
      multiple: true,
      maxSelections: 2,
      options: [
        { id: "fruit", label: "清爽果香", mark: "果" },
        { id: "floral", label: "花香轻盈", mark: "花" },
        { id: "teaHerbal", label: "茶香草本", mark: "茶" },
        { id: "smokyWood", label: "烟熏木质", mark: "木" },
        { id: "spice", label: "香料辛香", mark: "辛" },
        { id: "creamy", label: "奶香甜润", mark: "奶" },
      ],
    },
    {
      key: "feeling",
      title: "今晚更想要什么感觉？",
      note: "",
      layout: "feeling",
      options: [
        { id: "easy", label: "清爽好入口" },
        { id: "layered", label: "平衡有层次" },
        { id: "bold", label: "大胆、有记忆点" },
        { id: "rich", label: "浓郁慢慢喝" },
        { id: "featured", label: "喝代表作！", featured: true },
      ],
    },
    {
      key: "avoids",
      title: "有什么忌口吗？",
      note: "可多选",
      layout: "avoid",
      multiple: true,
      exclusiveId: "none",
      options: [
        { id: "dairy", label: "奶制品" },
        { id: "caffeine", label: "咖啡因" },
        { id: "spicy", label: "辛香" },
        { id: "tea", label: "茶味" },
        { id: "herbal", label: "草本" },
        { id: "none", label: "无忌口" },
      ],
    },
    {
      key: "budget",
      title: "预算",
      note: "",
      layout: "price",
      options: [
        { id: "48", label: "¥48" },
        { id: "58", label: "¥58" },
        { id: "68", label: "¥68" },
        { id: "any", label: "价格不重要" },
      ],
    },
  ];

  const state = {
    view: "welcome",
    questionIndex: 0,
    answers: createEmptyAnswers(),
    results: [],
    selectedDrink: null,
    detailOrigin: "catalogue",
    catalogueFilter: "全部",
    rotation: 0,
    sheetDrink: null,
  };

  function createEmptyAnswers() {
    return { alcohol: null, flavors: [], feeling: null, avoids: [], budget: null };
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setView(view, options = {}) {
    state.view = view;
    Object.assign(state, options);
    render();
    window.scrollTo({ top: 0, behavior: "auto" });
    document.querySelector(".app-shell")?.scrollTo({ top: 0, behavior: "auto" });
  }

  function renderShell(content, shellClass = "") {
    app.innerHTML = `
      <div class="page-stage">
        <main class="app-shell ${shellClass}" aria-label="后话客厅选酒助手">
          ${content}
        </main>
      </div>
    `;
  }

  function renderWelcome() {
    renderShell(
      `
        <section class="screen welcome-screen">
          <div class="welcome-photo">
            <img class="welcome-doodle-image" src="./assets/cover-doodle.jpg" alt="朋友们围桌举杯的手绘插画" fetchpriority="high" />
          </div>
          <div class="welcome-content">
            <div class="welcome-kicker"><span></span><p class="brand-name">后话客厅</p></div>
            <h1>今晚，<br />喝点什么？</h1>
            <p class="lead">不用懂酒。用 5 个简单选择，找到真正适合今晚的一杯。</p>
            <div class="welcome-meta" aria-label="答题说明">
              <span>约 30 秒</span><span>15 款酒饮</span><span>忌口优先</span>
            </div>
            <div class="welcome-actions">
              <button class="primary-button" data-action="start">开始选酒 <span aria-hidden="true">↗</span></button>
              <button class="text-button" data-action="catalogue">先看看全部酒款</button>
            </div>
          </div>
        </section>
      `,
      "welcome-shell",
    );
  }

  function isQuestionAnswered(question) {
    const answer = state.answers[question.key];
    return question.multiple ? Array.isArray(answer) && answer.length > 0 : Boolean(answer);
  }

  function isSelected(question, id) {
    const answer = state.answers[question.key];
    return question.multiple ? answer.includes(id) : answer === id;
  }

  function renderProgress() {
    return `
      <div class="progress-block" aria-label="第 ${state.questionIndex + 1} 题，共 ${questions.length} 题">
        <span class="progress-fraction">0${state.questionIndex + 1}<i>/</i>0${questions.length}</span>
        <span class="progress-track" aria-hidden="true">
          ${questions.map((_, index) => `<i class="${index <= state.questionIndex ? "is-complete" : ""}"></i>`).join("")}
        </span>
      </div>
    `;
  }

  function choiceMarkup(question, option) {
    const selected = isSelected(question, option.id);
    const classes = [
      "choice-button",
      selected ? "is-selected" : "",
      option.featured ? "choice-featured" : "",
    ].filter(Boolean).join(" ");

    return `
      <button class="${classes}" data-action="choose" data-value="${option.id}" aria-pressed="${selected}">
        ${option.mark ? `<span class="choice-mark" aria-hidden="true">${option.mark}</span>` : ""}
        <span class="choice-copy">
          <strong>${escapeHtml(option.label)}</strong>
          ${option.description ? `<small>${escapeHtml(option.description)}</small>` : ""}
        </span>
        ${question.layout === "list" || question.layout === "feeling" ? `<span class="choice-radio" aria-hidden="true"></span>` : ""}
        ${question.layout === "avoid" ? `<span class="choice-check" aria-hidden="true">✓</span>` : ""}
      </button>
    `;
  }

  function renderChoices(question) {
    return question.options.map((option) => choiceMarkup(question, option)).join("");
  }

  function getFlavorAvoidanceConflict() {
    const conflictMap = {
      creamy: ["dairy"],
      teaHerbal: ["tea", "herbal"],
      spice: ["spicy"],
    };
    const conflicts = [];
    state.answers.flavors.forEach((flavor) => {
      (conflictMap[flavor] || []).forEach((avoid) => {
        if (state.answers.avoids.includes(avoid)) {
          conflicts.push(`${answerLabels.flavors[flavor]} × ${answerLabels.avoids[avoid]}`);
        }
      });
    });
    return [...new Set(conflicts)];
  }

  function renderQuestionNotice(question) {
    if (question.key !== "avoids") return "";
    const conflicts = getFlavorAvoidanceConflict();
    return `
      ${conflicts.length ? `
        <div class="priority-notice" role="status">
          <span aria-hidden="true">!</span>
          <p><strong>已按忌口优先</strong>${escapeHtml(conflicts.join("、"))} 有冲突，相关酒款不会进入推荐。</p>
        </div>
      ` : ""}
      <p class="safety-note">严重过敏请告诉吧台，制作过程可能存在交叉接触。</p>
    `;
  }

  function renderQuestion() {
    const question = questions[state.questionIndex];
    const isLast = state.questionIndex === questions.length - 1;
    renderShell(`
      <section class="screen question-screen question-${question.key}">
        <header class="question-header">
          <button class="icon-button" data-action="back" aria-label="返回">←</button>
          ${renderProgress()}
        </header>
        <div class="question-copy">
          <p class="question-kicker">TASTE PROFILE</p>
          <h1>${escapeHtml(question.title)}</h1>
          ${question.note ? `<p class="question-note">${escapeHtml(question.note)}</p>` : ""}
        </div>
        <div class="choices choices-${question.layout}">${renderChoices(question)}</div>
        <div class="question-notices">${renderQuestionNotice(question)}</div>
        <footer class="sticky-action">
          <button class="primary-button" data-action="continue" ${isQuestionAnswered(question) ? "" : "disabled"}>
            ${isLast ? "看看今晚的一杯" : "继续"} <span aria-hidden="true">→</span>
          </button>
        </footer>
      </section>
    `);
  }

  function drinkFlavorMatch(drink, group) {
    const terms = flavorGroups[group] || [];
    const haystack = `${drink.flavors.join(" ")} ${drink.ingredients}`;
    return terms.some((term) => haystack.includes(term));
  }

  function activeAvoidances() {
    return state.answers.avoids.filter((item) => item !== "none");
  }

  function isDrinkEligible(drink) {
    if (state.answers.alcohol === "alcohol" && drink.alcoholType !== "含酒精") return false;
    if (state.answers.alcohol === "none" && drink.alcoholType !== "无酒精") return false;
    const tags = Array.isArray(drink.avoidTags) ? drink.avoidTags : [];
    return !activeAvoidances().some((avoid) => tags.includes(avoid));
  }

  function scoreFeeling(drink, feeling) {
    if (feeling === "easy") {
      return drink.metrics.bubbles * 3.5 + (drink.metrics.body <= 2 ? 7 : 0) + (drink.metrics.sweetness <= 3 ? 3 : 0) + (drink.metrics.alcohol <= 2 ? 2 : 0);
    }
    if (feeling === "layered") {
      return Math.max(0, 14 - Math.abs(drink.metrics.sweetness - drink.metrics.acidity) * 3) + (drink.metrics.body >= 2 ? 5 : 1) + Math.min(drink.flavors.length, 3);
    }
    if (feeling === "bold") {
      return drink.metrics.acidity * 2 + drink.metrics.body * 2 + drink.metrics.alcohol * 1.5 + (drinkFlavorMatch(drink, "spice") || drinkFlavorMatch(drink, "smokyWood") ? 8 : 0) + (drink.id === "si-zai-gao-chao" ? 5 : 0);
    }
    if (feeling === "rich") {
      return drink.metrics.body * 4 + drink.metrics.sweetness * 1.5 + (drink.metrics.bubbles === 0 ? 7 : 0) + (drinkFlavorMatch(drink, "creamy") || drinkFlavorMatch(drink, "smokyWood") ? 5 : 0);
    }
    if (feeling === "featured") {
      if (drink.featuredRole === "signature") return 34;
      if (drink.featuredRole === "signature-zero") return 32;
      if (drink.featuredRole === "fallback-alcohol" || drink.featuredRole === "fallback-zero") return 17;
    }
    return 0;
  }

  function scoreBudget(drink, budget) {
    if (budget === "any") return 0;
    const difference = Math.abs(drink.price - Number(budget));
    if (difference === 0) return 13;
    if (difference === 10) return 4;
    return -3;
  }

  function scoreDrink(drink) {
    if (!isDrinkEligible(drink)) return null;
    const { alcohol, flavors, feeling, budget } = state.answers;
    let score = alcohol === "any" ? 0 : 10;
    flavors.forEach((group) => { score += drinkFlavorMatch(drink, group) ? 20 : -3; });
    score += scoreFeeling(drink, feeling);
    score += scoreBudget(drink, budget);
    if (feeling !== "featured") {
      if (drink.featuredRole === "signature") score += 5;
      if (drink.featuredRole === "signature-zero") score += 4;
      if (drink.featuredRole === "fallback-alcohol" || drink.featuredRole === "fallback-zero") score += 2;
    }
    return score;
  }

  function buildResults() {
    const ranked = drinks
      .map((drink, index) => ({ drink, score: scoreDrink(drink), index }))
      .filter((entry) => entry.score !== null)
      .sort((a, b) => b.score - a.score || a.index - b.index);
    if (ranked.length <= 1) return ranked.map((entry) => entry.drink);
    const primary = ranked[0];
    const pool = ranked.slice(1);
    const offset = (state.rotation * 3) % pool.length;
    const rotatedPool = [...pool.slice(offset), ...pool.slice(0, offset)];
    return [primary, ...rotatedPool].map((entry) => entry.drink);
  }

  function getMatchReason(drink) {
    const pieces = [];
    const { flavors, feeling, budget } = state.answers;
    const feelReasons = {
      easy: drink.metrics.bubbles >= 2 ? "气泡明亮，入口轻松" : "味道轻松，不压口",
      layered: "甜酸和香气有层次",
      bold: "个性鲜明，记忆点很足",
      rich: "风味饱满，适合慢慢喝",
      featured: drink.featuredRole?.startsWith("signature") ? "这是后话的代表作之一" : "它最能接住你今晚的选择",
    };
    pieces.push(feelReasons[feeling]);
    const matchedFlavors = flavors.filter((group) => drinkFlavorMatch(drink, group));
    if (matchedFlavors.length) pieces.push(`带着你选的${matchedFlavors.map((group) => answerLabels.flavors[group]).join("、")}`);
    if (budget !== "any") {
      const target = Number(budget);
      if (drink.price === target) pieces.push(`也刚好在 ¥${drink.price}`);
      else if (Math.abs(drink.price - target) === 10) pieces.push("价格与预算只差 ¥10");
    }
    return `${pieces.filter(Boolean).slice(0, 3).join("；") || "今晚可以从这一杯开始"}。`;
  }

  function getPreferenceChips() {
    const values = [
      answerLabels.alcohol[state.answers.alcohol],
      ...state.answers.flavors.map((item) => answerLabels.flavors[item]),
      answerLabels.feeling[state.answers.feeling],
      answerLabels.budget[state.answers.budget],
      ...activeAvoidances().map((item) => `避开·${answerLabels.avoids[item]}`),
    ];
    return values.filter(Boolean).map((label) => `<span>${escapeHtml(label)}</span>`).join("");
  }

  function getFilteredCount() {
    const relevant = drinks.filter((drink) => {
      if (state.answers.alcohol === "alcohol") return drink.alcoholType === "含酒精";
      if (state.answers.alcohol === "none") return drink.alcoholType === "无酒精";
      return true;
    });
    return relevant.filter((drink) => {
      const tags = Array.isArray(drink.avoidTags) ? drink.avoidTags : [];
      return activeAvoidances().some((avoid) => tags.includes(avoid));
    }).length;
  }

  function renderLoading() {
    renderShell(`
      <section class="screen loading-screen">
        <div class="loading-monogram" aria-hidden="true">后</div>
        <div class="loading-copy">
          <p class="question-kicker">MATCHING YOUR NIGHT</p>
          <h1>正在找今晚的一杯</h1>
          <p>先避开不适合的，再把风味、感觉和价格放在一起。</p>
        </div>
        <div class="loading-meter" aria-hidden="true"><span></span></div>
      </section>
    `);
  }

  function renderResults() {
    if (state.results.length === 0) {
      renderShell(`
        <section class="screen empty-screen">
          <p class="question-kicker">NO SAFE MATCH</p>
          <h1>这组条件下，暂时没有合适的酒</h1>
          <p>忌口不会被放宽。你可以回去调整避开项，或直接告诉吧台你的需要。</p>
          <button class="primary-button" data-action="edit-avoidance">调整忌口</button>
          <button class="text-button" data-action="restart">重新选择</button>
        </section>
      `);
      return;
    }

    const primary = state.results[0];
    const alternatives = state.results.slice(1, 4);
    const filteredCount = getFilteredCount();
    const isFeatured = state.answers.feeling === "featured" && primary.featuredRole?.startsWith("signature");
    renderShell(`
      <section class="screen results-screen">
        <header class="top-bar results-bar">
          <button class="icon-button" data-action="back" aria-label="返回">←</button>
          <p class="result-header-label">YOUR DRINK TONIGHT</p>
          <span class="top-bar-spacer" aria-hidden="true"></span>
        </header>
        <div class="result-intro">
          <p>${filteredCount ? `已优先避开 ${filteredCount} 款不合适的酒饮` : "按今晚的口味与感觉，为你排好了顺序"}</p>
          <div class="preference-chips" aria-label="你的选择">${getPreferenceChips()}</div>
        </div>
        <article class="primary-result">
          <div class="primary-result-photo">
            <img src="${primary.image}" alt="${escapeHtml(primary.name)}" />
            <span class="result-number" aria-hidden="true">01</span>
            <span class="recommend-label">${isFeatured ? "后话代表作" : "最适合你"}</span>
          </div>
          <div class="primary-result-content">
            <p class="result-category">${escapeHtml(primary.category)} · ¥${primary.price}</p>
            <h1>${escapeHtml(primary.name)}</h1>
            <p class="flavor-line">${primary.flavors.map(escapeHtml).join("　")}</p>
            <p class="match-reason">${escapeHtml(getMatchReason(primary))}</p>
            <button class="result-detail-button" data-action="detail" data-id="${primary.id}">
              <span>看看这一杯</span><span aria-hidden="true">↗</span>
            </button>
          </div>
        </article>
        ${alternatives.length ? `
          <div class="alternatives-heading">
            <div><span>02—04</span><h2>也可以试试</h2></div>
            ${state.results.length > 4 ? `<button class="text-button text-button-small" data-action="rotate">换一组</button>` : ""}
          </div>
          <div class="alternative-list">
            ${alternatives.map((drink, index) => `
              <button class="alternative-card" data-action="detail" data-id="${drink.id}">
                <span class="alternative-index">0${index + 2}</span>
                <img src="${drink.image}" alt="${escapeHtml(drink.name)}" loading="lazy" />
                <span class="alternative-card-copy">
                  <strong>${escapeHtml(drink.name)}</strong>
                  <small>${escapeHtml(drink.flavors.slice(0, 2).join(" · "))}</small>
                </span>
                <b>¥${drink.price}</b>
              </button>
            `).join("")}
          </div>
        ` : ""}
        <div class="result-footer-actions">
          <button class="quiet-restart" data-action="restart">重新回答</button>
          <button class="quiet-restart" data-action="catalogue">查看全部酒款</button>
        </div>
      </section>
    `);
  }

  function storyMarkup(drink) {
    if (!drink.story.length) return `<p class="story-placeholder">这款经典鸡尾酒暂时没有故事说明，先从它的风味开始认识。</p>`;
    return drink.story.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  }

  function renderDetail() {
    const drink = state.selectedDrink;
    if (!drink) {
      setView("catalogue");
      return;
    }
    const notes = [
      drink.dairy === "有" ? "含奶制品" : null,
      drink.caffeine === "有" ? "含咖啡因" : null,
      drink.spice !== "无" ? drink.spice : null,
    ].filter(Boolean);
    renderShell(`
      <section class="screen detail-screen">
        <div class="detail-photo">
          <img src="${drink.image}" alt="${escapeHtml(drink.name)}" />
          <button class="floating-back" data-action="back" aria-label="返回">←</button>
          <span class="detail-category">${escapeHtml(drink.category)}</span>
        </div>
        <div class="detail-content">
          <div class="detail-title-row">
            <div><p class="question-kicker">THE STORY IN YOUR GLASS</p><h1>${escapeHtml(drink.name)}</h1></div>
            <strong>¥${drink.price}</strong>
          </div>
          <p class="detail-flavors">${drink.flavors.map(escapeHtml).join("　")}</p>
          <dl class="taste-stats">
            <div><dt>酒感</dt><dd>${drink.metrics.alcohol}<small>/3</small></dd></div>
            <div><dt>甜度</dt><dd>${drink.metrics.sweetness}<small>/5</small></dd></div>
            <div><dt>酸度</dt><dd>${drink.metrics.acidity}<small>/5</small></dd></div>
            <div><dt>气泡</dt><dd>${drink.metrics.bubbles}<small>/3</small></dd></div>
          </dl>
          <div class="story-block"><h2>这一杯的故事</h2>${storyMarkup(drink)}</div>
          <details class="ingredients-disclosure">
            <summary>配方与饮用提示 <span aria-hidden="true">＋</span></summary>
            <p>${escapeHtml(drink.ingredients)}</p>
            ${notes.length ? `<p class="ingredient-note">提示：${notes.map(escapeHtml).join("、")}</p>` : ""}
            <p class="cross-contact-note">严重过敏请提前告诉吧台，制作过程可能存在交叉接触。</p>
          </details>
        </div>
        <footer class="order-action">
          <button class="primary-button" data-action="order" data-id="${drink.id}">去小程序下单 <span aria-hidden="true">↗</span></button>
          <p>将打开「后话客厅 PostScript」小程序</p>
        </footer>
      </section>
      ${state.sheetDrink ? renderOrderSheet(state.sheetDrink) : ""}
    `);
  }

  function renderOrderSheet(drink) {
    return `
      <div class="sheet-backdrop" data-action="close-sheet" role="presentation">
        <section class="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
          <div class="sheet-handle" aria-hidden="true"></div>
          <p class="question-kicker">WECHAT MINI PROGRAM</p>
          <h2 id="sheet-title">去微信下单</h2>
          <p>已准备好「${escapeHtml(drink.name)}」的小程序口令。复制后回到微信粘贴，即可打开对应商品。</p>
          <button class="primary-button" data-action="copy-path" data-id="${drink.id}">复制小程序口令</button>
          <button class="text-button" data-action="dismiss-sheet">关闭</button>
        </section>
      </div>
    `;
  }

  function renderCatalogue() {
    const categories = ["全部", "含酒精特调", "无酒精", "经典鸡尾酒"];
    const visible = state.catalogueFilter === "全部" ? drinks : drinks.filter((drink) => drink.category === state.catalogueFilter);
    renderShell(`
      <section class="screen catalogue-screen">
        <header class="top-bar catalogue-bar">
          <button class="icon-button" data-action="back" aria-label="返回">←</button>
          <div><p class="brand-name">后话客厅</p><h1>全部酒款</h1></div>
          <span class="top-bar-spacer" aria-hidden="true"></span>
        </header>
        <div class="filter-row" aria-label="酒款分类">
          ${categories.map((category) => `
            <button class="filter-button ${state.catalogueFilter === category ? "is-active" : ""}" data-action="filter" data-value="${category}">
              ${category === "经典鸡尾酒" ? "经典" : category}
            </button>
          `).join("")}
        </div>
        <div class="catalogue-grid">
          ${visible.map((drink, index) => `
            <button class="drink-card" data-action="detail" data-id="${drink.id}">
              <span class="drink-card-index">${String(index + 1).padStart(2, "0")}</span>
              <img src="${drink.image}" alt="${escapeHtml(drink.name)}" loading="lazy" />
              <span class="drink-card-copy">
                <strong>${escapeHtml(drink.name)}</strong>
                <small>${escapeHtml(drink.flavors.slice(0, 2).join("　"))}</small>
                <b>¥${drink.price}</b>
              </span>
            </button>
          `).join("")}
        </div>
      </section>
    `);
  }

  function render() {
    if (drinks.length === 0) {
      renderShell(`<section class="screen empty-screen"><h1>酒单加载失败</h1><p>请刷新页面后重试。</p><button class="primary-button" data-action="reload">刷新页面</button></section>`);
      return;
    }
    if (state.view === "welcome") renderWelcome();
    if (state.view === "question") renderQuestion();
    if (state.view === "loading") renderLoading();
    if (state.view === "results") renderResults();
    if (state.view === "detail") renderDetail();
    if (state.view === "catalogue") renderCatalogue();
  }

  function chooseOption(value) {
    const question = questions[state.questionIndex];
    if (!question.multiple) {
      state.answers[question.key] = value;
      render();
      return;
    }
    const current = state.answers[question.key];
    if (question.exclusiveId && value === question.exclusiveId) {
      state.answers[question.key] = current.includes(value) ? [] : [value];
      render();
      return;
    }
    if (current.includes(value)) {
      state.answers[question.key] = current.filter((item) => item !== value);
    } else {
      const next = current.filter((item) => item !== question.exclusiveId);
      if (question.maxSelections && next.length >= question.maxSelections) {
        showToast(`最多选择 ${question.maxSelections} 个`);
        return;
      }
      state.answers[question.key] = [...next, value];
    }
    render();
  }

  function goBack() {
    if (state.sheetDrink) {
      state.sheetDrink = null;
      render();
      return;
    }
    if (state.view === "question") {
      if (state.questionIndex > 0) state.questionIndex -= 1;
      else state.view = "welcome";
      render();
      return;
    }
    if (state.view === "detail") {
      state.view = state.detailOrigin === "results" ? "results" : "catalogue";
      render();
      return;
    }
    if (state.view === "results") {
      state.view = "question";
      state.questionIndex = questions.length - 1;
      render();
      return;
    }
    state.view = "welcome";
    render();
  }

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (error) {
      const input = document.createElement("textarea");
      input.value = value;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      const copied = document.execCommand("copy");
      input.remove();
      return copied;
    }
  }

  function showToast(message) {
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.textContent = message;
    document.querySelector(".app-shell")?.appendChild(toast);
    window.setTimeout(() => toast.remove(), 2200);
  }

  app.addEventListener("click", async (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    if (action === "start") { state.questionIndex = 0; setView("question"); }
    if (action === "catalogue") setView("catalogue");
    if (action === "choose") chooseOption(target.dataset.value);
    if (action === "continue") {
      if (target.disabled) return;
      if (state.questionIndex < questions.length - 1) {
        state.questionIndex += 1;
        render();
      } else {
        state.view = "loading";
        render();
        window.setTimeout(() => {
          state.rotation = 0;
          state.results = buildResults();
          state.view = "results";
          render();
        }, 720);
      }
    }
    if (action === "back") goBack();
    if (action === "restart") {
      state.answers = createEmptyAnswers();
      state.results = [];
      state.rotation = 0;
      state.questionIndex = 0;
      setView("question");
    }
    if (action === "edit-avoidance") {
      state.questionIndex = questions.findIndex((question) => question.key === "avoids");
      setView("question");
    }
    if (action === "rotate") { state.rotation += 1; state.results = buildResults(); render(); }
    if (action === "detail") {
      const drink = drinks.find((item) => item.id === target.dataset.id);
      if (drink) setView("detail", { selectedDrink: drink, detailOrigin: state.view });
    }
    if (action === "filter") { state.catalogueFilter = target.dataset.value; render(); }
    if (action === "order") {
      const drink = drinks.find((item) => item.id === target.dataset.id);
      if (!drink) return;
      if (/^(https?:|weixin:)/.test(drink.miniProgramPath)) window.location.assign(drink.miniProgramPath);
      else { state.sheetDrink = drink; render(); }
    }
    if (action === "copy-path") {
      const drink = drinks.find((item) => item.id === target.dataset.id);
      if (!drink) return;
      const copied = await copyText(drink.miniProgramPath);
      showToast(copied ? "小程序口令已复制" : "复制失败，请长按口令复制");
    }
    if (action === "close-sheet") {
      if (event.target.closest(".bottom-sheet")) return;
      state.sheetDrink = null;
      render();
    }
    if (action === "dismiss-sheet") { state.sheetDrink = null; render(); }
    if (action === "reload") window.location.reload();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.sheetDrink) {
      state.sheetDrink = null;
      render();
    }
  });

  render();
})();
