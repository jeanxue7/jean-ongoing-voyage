const dialogueLines = [
  {
    speaker: "朋友 A",
    text: "诶，你是不是有在写自己的公众号？",
    nextPosition: "jean",
    nextLabel: "Jean 回答",
  },
  {
    speaker: "Jean",
    text: "对呀。开始只是记录生活，没想到后来有越来越多人关注。",
    nextPosition: "friend-b",
    nextLabel: "继续对话",
  },
  {
    speaker: "朋友 B",
    text: "诶？可以看看吗？",
    nextPosition: "jean",
    nextLabel: "Jean 回答",
  },
  {
    speaker: "Jean",
    text: "当然。都收在这本创作记录里，翻开看看吧。",
    nextPosition: "complete",
    nextLabel: "",
  },
];

const logbookCategories = [
  {
    id: "conversations",
    en: "FIELD CONVERSATIONS",
    zh: "原野人生",
    short: "访谈与播客",
    description: "和具体的人聊他们怎样工作、生活，又怎样作出不一样的选择。",
    stories: [
      {
        id: "article-20",
        date: "2026.02.12",
        title: "邀请函｜让我们共同测绘，这个时代的原野人生",
        url: "https://mp.weixin.qq.com/s/DZNk0CiCRvIkQHNgCT_Akw",
      },
      {
        id: "article-17",
        date: "2026.03.02",
        title: "裸辞逃离996后，我成了大理农场的「野生私厨」",
        url: "https://mp.weixin.qq.com/s/QsDsdE31nFwb9f0XJNPpTQ",
      },
      {
        id: "article-12",
        date: "2026.04.14",
        title: "在互联网大厂的确定性里，做一名即兴的「伪」艺术家",
        url: "https://mp.weixin.qq.com/s/RgzM3R_FOko_hIIMK9L1Xw",
      },
    ],
  },
  {
    id: "yearly-letters",
    en: "YEARLY LETTERS",
    zh: "写给时间的信",
    short: "年终总结",
    description: "在一年结束或生日到来时，回看那些真实、热烈、自由和生猛的时刻。",
    stories: [
      {
        id: "article-01",
        date: "2026.01.05",
        title: "二〇二五，我活的依旧真实、热烈、自由和生猛",
        url: "https://mp.weixin.qq.com/s/CqIsvabZLonRFcLf5-0Caw",
      },
      {
        id: "article-02",
        date: "2025.04.01",
        title: "我的22岁，我的2024年",
        url: "https://mp.weixin.qq.com/s/1Kqncpeu4C7LHDrlmwdXqA",
      },
      {
        id: "article-13",
        date: "2026.03.31",
        title: "24岁啦，本命年聊聊本命事",
        url: "https://mp.weixin.qq.com/s/Zmgqhn-0SE-NmNCGLiiRPw",
      },
    ],
  },
  {
    id: "living-notes",
    en: "NOTES ON LIVING",
    zh: "生活札记",
    short: "生活感悟",
    description: "把没有标准答案的生活拆开看看，再诚实地写下当时的感受。",
    stories: [
      {
        id: "article-04",
        date: "2026.06.29",
        title: "被生活推着成为了想成为的大人",
        url: "https://mp.weixin.qq.com/s/Tn3SjyLeyErKofH8g0m1_w",
      },
      {
        id: "article-21",
        date: "2026.01.31",
        title: "生活，是一场巨大的化学反应",
        url: "https://mp.weixin.qq.com/s/5N0ilIQvx5G6txE91Dx7rQ",
      },
      {
        id: "article-05",
        date: "2026.06.25",
        title: "以身入局！从女性视角聊聊Dating APP这个「游戏」",
        url: "https://mp.weixin.qq.com/s/TP7Gm9kFuxi7WoTnJH-8_w",
      },
    ],
  },
  {
    id: "travel-journals",
    en: "TRAVEL JOURNALS",
    zh: "行走记录",
    short: "旅行足迹",
    description: "山路、城市和远方。去过的地方，也在重新塑造看世界的方式。",
    stories: [
      {
        id: "article-16",
        date: "2026.03.06",
        title: "东非，我的精神故乡",
        url: "https://mp.weixin.qq.com/s/Sj2h-ITFyJmzfmXe-GRO0w",
      },
      {
        id: "article-11",
        date: "2026.04.15",
        title: "本来回大理休养，结果在寺庙禅修...",
        url: "https://mp.weixin.qq.com/s/IOfBb5Q9OUZevNnoMCw0iw",
      },
      {
        id: "article-07",
        date: "2026.05.27",
        title: "EP 9｜在喜马拉雅行走了百公里，我看见信仰、割裂和乌托邦",
        url: "https://mp.weixin.qq.com/s/NrsUxMiIaU9VMCJafgnTfw",
      },
    ],
  },
];

const places = {
  "east-africa": {
    counter: "01 / 04",
    title: "东非",
    kicker: "辽阔不是背景，它改变了我理解自由的方式。",
    body: "在草原、教室和陌生人的笑声里，我第一次感到，远方不是风景，而是另一种理解生活的方式。",
    images: [
      {
        src: "./assets/places/east-africa/savanna-acacia.jpg",
        alt: "东非草原上两棵金合欢树",
      },
      {
        src: "./assets/places/east-africa/classroom-together.jpg",
        alt: "Jean 和当地学生在教室里合影",
      },
      {
        src: "./assets/places/east-africa/meeting-hearts.jpg",
        alt: "Jean 和当地孩子用双手拼出爱心",
      },
    ],
    links: [
      {
        title: "东非，我的精神故乡",
        url: "https://mp.weixin.qq.com/s/Sj2h-ITFyJmzfmXe-GRO0w",
      },
      {
        title: "热烈、自由、割裂、混乱……我会用所有词语形容非洲，除了沉闷",
        url: "https://mp.weixin.qq.com/s/5qcpYKKFLSiATPPBtBKRXA",
      },
      {
        title: "我的感情，是非洲冬季的一场夏雨",
        url: "https://mp.weixin.qq.com/s/dS5OabjlnQ3rKGjQ1CvoSg",
      },
    ],
  },
  guangzhou: {
    counter: "02 / 04",
    title: "广州",
    kicker: "正在生活，也正在把后话客厅写进现实。",
    body: "白天继续做产品，晚上推开酒吧的门。这里装着音乐、朋友，也装着许多还没说完的后话。",
    images: [
      {
        src: "./assets/places/guangzhou/bar-shelf.jpg",
        alt: "后话客厅绿色墙面与收藏酒架",
      },
      {
        src: "./assets/places/guangzhou/friends-at-the-bar.jpg",
        alt: "朋友们在广州的后话客厅聚会",
      },
      {
        src: "./assets/places/guangzhou/singing-night.jpg",
        alt: "Jean 在后话客厅拿着麦克风唱歌",
      },
    ],
    links: [
      {
        title: "这一次，我们不再说，「那些都是后话了」",
        url: "https://mp.weixin.qq.com/s/nbNbmltQThbfAKiH9002KQ",
      },
      {
        title: "P.S. 我们留着酒，等你来聊聊后话",
        url: "https://mp.weixin.qq.com/s/KXkawGforX8ro74lmWjXuQ",
      },
    ],
  },
  beijing: {
    counter: "03 / 04",
    title: "北京",
    kicker: "在很快的城市里，慢慢找到自己的生活节奏。",
    body: "车站、园林、夜市和校园，构成我在北京的日常。它很快，也总能在缝隙里留下慢下来的理由。",
    images: [
      {
        src: "./assets/places/beijing/beijing-west.jpg",
        alt: "傍晚车流中的北京西站",
      },
      {
        src: "./assets/places/beijing/panjiyuan-night.jpg",
        alt: "灯光下热闹的潘家园夜市",
      },
      {
        src: "./assets/places/beijing/city-garden.jpg",
        alt: "湖水与古典建筑构成的北京园林景色",
      },
    ],
    links: [
      {
        title: "在北京生活的片段（一）",
        url: "https://mp.weixin.qq.com/s/A1JMpPefedi7Yj-E4C5-mA",
      },
      {
        title: "在北京生活的片段（二）",
        url: "https://mp.weixin.qq.com/s/O0S5C4uQ98SrFlBITtWgvQ",
      },
    ],
  },
  dali: {
    counter: "04 / 04",
    title: "大理",
    kicker: "有些停下来，并不是离开原来的路。",
    body: "在寺庙、农场和一桌热腾腾的饭之间，我重新理解了暂停。不是逃走，只是换一种速度继续生活。",
    images: [
      {
        src: "./assets/places/dali/bai-feast.jpg",
        alt: "大理白族酒席上围桌吃饭的人们",
      },
      {
        src: "./assets/places/dali/open-fire-cooking.jpg",
        alt: "露天灶台上正在烹饪的菜肴",
      },
      {
        src: "./assets/places/dali/back-on-the-trail.jpg",
        alt: "Jean 背着登山包站在金色山坡上",
      },
    ],
    links: [
      {
        title: "本来回大理休养，结果在寺庙禅修...",
        url: "https://mp.weixin.qq.com/s/IOfBb5Q9OUZevNnoMCw0iw",
      },
      {
        title: "裸辞逃离996后，我成了大理农场的「野生私厨」",
        url: "https://mp.weixin.qq.com/s/QsDsdE31nFwb9f0XJNPpTQ",
      },
    ],
  },
};

const scene01 = document.querySelector("#scene-01");
const scene02 = document.querySelector("#scene-02");
const scene04 = document.querySelector("#scene-04");
const lifeRevealButton = document.querySelector("[data-reveal-life-paths]");
const lifePathMenu = document.querySelector("#life-path-menu");
const lifePathButtons = [...document.querySelectorAll("[data-open-life]")];
const lifePanel = document.querySelector("#life-panel");
const lifeTabs = [...document.querySelectorAll("[data-life-tab]")];
const dialogueTab = document.querySelector("[data-dialogue-tab]");
const dialogueTabLabel = dialogueTab.querySelector(".dialogue-tab__label");
const dialoguePanel = document.querySelector(".dialogue-panel");
const dialogueSpeaker = document.querySelector(".dialogue-panel__speaker");
const dialogueLine = document.querySelector(".dialogue-panel__line");
const dialogueHint = document.querySelector(".dialogue-panel__hint");
const travelBookTrigger = document.querySelector(".travel-book-trigger");
const bookDialog = document.querySelector("#book-dialog");
const barDialog = document.querySelector("#bar-dialog");
const mapLayer = document.querySelector(".map-layer");
const siteHeader = document.querySelector(".site-header");
const openingScene = document.querySelector("#scene-opening");
const openingMedia = openingScene?.querySelector(".scene-media");
const openingVideo = openingMedia?.querySelector(".scene__video");
const openingVideoSource = openingVideo?.querySelector("source[data-src]");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const desktopVideoQuery = window.matchMedia("(min-width: 761px)");

let dialogueIndex = -1;
let activeBookCategory = 0;
let activeLifePath = "profile";
let lastLifeTrigger = lifeRevealButton;
let openingVideoVisible = true;

function canUseOpeningVideo() {
  return desktopVideoQuery.matches && !reducedMotionQuery.matches && !navigator.connection?.saveData;
}

function syncOpeningVideoPlayback() {
  if (!openingVideo) return;

  if (canUseOpeningVideo() && openingVideoVisible && !document.hidden) {
    openingVideo.play().catch(() => {});
  } else {
    openingVideo.pause();
  }
}

function loadOpeningVideo() {
  if (!openingVideo || !openingVideoSource || openingVideo.dataset.loaded === "true" || !canUseOpeningVideo()) return;

  openingVideoSource.src = openingVideoSource.dataset.src;
  openingVideo.dataset.loaded = "true";
  openingVideo.load();
}

if (openingScene && openingMedia && openingVideo) {
  openingVideo.muted = true;

  openingVideo.addEventListener(
    "canplay",
    () => {
      openingMedia.classList.add("is-video-ready");
      syncOpeningVideoPlayback();
    },
    { once: true },
  );

  openingVideo.addEventListener("error", () => {
    openingMedia.classList.remove("is-video-ready");
  });

  const openingVideoObserver = new IntersectionObserver(
    ([entry]) => {
      openingVideoVisible = entry.isIntersecting && entry.intersectionRatio >= 0.35;
      if (openingVideoVisible) loadOpeningVideo();
      syncOpeningVideoPlayback();
    },
    { threshold: [0, 0.35, 0.65] },
  );

  openingVideoObserver.observe(openingScene);
  document.addEventListener("visibilitychange", syncOpeningVideoPlayback);

  const syncOpeningVideoPreference = () => {
    if (canUseOpeningVideo()) {
      loadOpeningVideo();
    } else {
      openingMedia.classList.remove("is-video-ready");
    }
    syncOpeningVideoPlayback();
  };

  reducedMotionQuery.addEventListener?.("change", syncOpeningVideoPreference);
  desktopVideoQuery.addEventListener?.("change", syncOpeningVideoPreference);
  loadOpeningVideo();
}

function revealLifePaths({ focusFirst = true } = {}) {
  dismissPrototypeNote();
  lifePathMenu.hidden = false;
  lifePathMenu.removeAttribute("inert");
  lifePathMenu.setAttribute("aria-hidden", "false");
  lifeRevealButton.setAttribute("aria-expanded", "true");

  requestAnimationFrame(() => {
    scene01.classList.add("is-exploring");
    if (focusFirst) lifePathButtons[0].focus({ preventScroll: true });
  });
}

function renderLifePath(path, { focusView = false } = {}) {
  const validPath = ["profile", "career", "interests"].includes(path) ? path : "profile";
  activeLifePath = validPath;
  lastLifeTrigger = lifePathButtons.find((button) => button.dataset.openLife === validPath) || lastLifeTrigger;

  lifePathButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.openLife === validPath);
  });

  lifeTabs.forEach((tab) => {
    const isActive = tab.dataset.lifeTab === validPath;
    tab.setAttribute("aria-selected", String(isActive));
    tab.setAttribute("tabindex", isActive ? "0" : "-1");
  });

  document.querySelectorAll("[data-life-view]").forEach((view) => {
    const isActive = view.dataset.lifeView === validPath;
    view.hidden = !isActive;
    view.classList.toggle("is-active", isActive);
  });

  lifePathMenu.setAttribute("inert", "");
  lifePanel.removeAttribute("inert");
  lifePanel.setAttribute("aria-hidden", "false");
  scene01.classList.add("is-life-panel-open");
  if (focusView) {
    document.querySelector(`[data-life-view="${validPath}"] h4`).focus({ preventScroll: true });
  }

  lifePanel.scrollTop = 0;
  requestAnimationFrame(() => {
    lifePanel.scrollTop = 0;
  });
}

function openLifePath(button) {
  lastLifeTrigger = button;
  renderLifePath(button.dataset.openLife, { focusView: true });
}

function closeLifePanel({ restoreFocus = true } = {}) {
  scene01.classList.remove("is-life-panel-open");
  lifePanel.setAttribute("aria-hidden", "true");
  lifePanel.setAttribute("inert", "");
  lifePathMenu.removeAttribute("inert");
  if (restoreFocus && lastLifeTrigger) lastLifeTrigger.focus({ preventScroll: true });
}

function resetLifeExperience({ restoreFocus = false } = {}) {
  closeLifePanel({ restoreFocus: false });
  scene01.classList.remove("is-exploring");
  lifeRevealButton.setAttribute("aria-expanded", "false");
  lifePathMenu.setAttribute("aria-hidden", "true");
  lifePathMenu.hidden = true;
  lifePathButtons.forEach((button) => button.classList.remove("is-active"));
  if (restoreFocus) lifeRevealButton.focus({ preventScroll: true });
}

function moveLifeTabFocus(event) {
  const currentIndex = lifeTabs.indexOf(event.currentTarget);
  if (currentIndex < 0) return;

  let nextIndex = currentIndex;
  if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % lifeTabs.length;
  if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + lifeTabs.length) % lifeTabs.length;
  if (event.key === "Home") nextIndex = 0;
  if (event.key === "End") nextIndex = lifeTabs.length - 1;
  if (nextIndex === currentIndex) return;

  event.preventDefault();
  const nextTab = lifeTabs[nextIndex];
  renderLifePath(nextTab.dataset.lifeTab);
  nextTab.focus({ preventScroll: true });
}

function setDialogueTabPosition(position, label) {
  dialogueTab.classList.remove("is-at-friend-a", "is-at-jean", "is-at-friend-b", "is-complete");

  if (position === "complete") {
    dialogueTab.classList.add("is-complete");
    dialogueTab.disabled = true;
    dialogueTab.setAttribute("aria-hidden", "true");
    dialogueTab.setAttribute("tabindex", "-1");
    return;
  }

  dialogueTab.disabled = false;
  dialogueTab.setAttribute("aria-hidden", "false");
  dialogueTab.removeAttribute("tabindex");
  dialogueTab.classList.add(`is-at-${position}`);
  dialogueTabLabel.textContent = label;

  const accessiblePerson = position === "jean" ? "Jean" : position === "friend-b" ? "右边的朋友" : "左边的朋友";
  dialogueTab.setAttribute("aria-label", `点击${accessiblePerson}继续对话`);
}

function advanceDialogue() {
  if (dialogueIndex >= dialogueLines.length - 1) return;

  dismissPrototypeNote();

  dialogueIndex += 1;
  const currentLine = dialogueLines[dialogueIndex];

  dialogueSpeaker.textContent = currentLine.speaker;
  dialogueLine.textContent = currentLine.text;
  dialoguePanel.classList.add("is-open");
  dialoguePanel.setAttribute("aria-hidden", "false");
  scene02.classList.add("dialogue-active");

  setDialogueTabPosition(currentLine.nextPosition, currentLine.nextLabel);

  if (currentLine.nextPosition === "complete") {
    scene02.classList.add("dialogue-complete");
    dialogueHint.textContent = "旅行书已经亮起，去翻开创作记录。";
    travelBookTrigger.classList.add("is-ready");
    travelBookTrigger.setAttribute("aria-hidden", "false");
    travelBookTrigger.removeAttribute("tabindex");
  } else {
    dialogueHint.textContent = "继续点击场景中的对话 Tab";
  }
}

function closeDialogue() {
  dialoguePanel.classList.remove("is-open");
  dialoguePanel.setAttribute("aria-hidden", "true");
}

function renderBookCategory(index) {
  activeBookCategory = Math.max(0, Math.min(index, logbookCategories.length - 1));
  const category = logbookCategories[activeBookCategory];

  document.querySelectorAll(".book-tab").forEach((tab, tabIndex) => {
    tab.classList.toggle("is-active", tabIndex === activeBookCategory);
    tab.setAttribute("aria-selected", String(tabIndex === activeBookCategory));
  });

  document.querySelector("[data-book-category-en]").textContent = category.en;
  document.querySelector("[data-book-category-zh]").textContent = category.zh;
  document.querySelector("[data-book-category-description]").textContent = category.description;
  document.querySelector("[data-book-page-number]").textContent = String(activeBookCategory + 1).padStart(2, "0");

  document.querySelector("[data-story-list]").innerHTML = category.stories
    .map(
      (story) => `
        <a class="story-link" href="${story.url}" target="_blank" rel="noreferrer" data-story-id="${story.id}">
          <time>${story.date}</time>
          <strong>${story.title}</strong>
          <span aria-hidden="true">↗</span>
        </a>
      `,
    )
    .join("");

  document.querySelector("[data-book-prev]").disabled = activeBookCategory === 0;
  document.querySelector("[data-book-next]").disabled = activeBookCategory === logbookCategories.length - 1;
}

function buildBookTabs() {
  const bookTabs = document.querySelector(".book-tabs");
  bookTabs.innerHTML = logbookCategories
    .map(
      (category, index) => `
        <button class="book-tab${index === 0 ? " is-active" : ""}" type="button" role="tab" aria-selected="${index === 0}" data-book-category="${index}">
          <span class="book-tab__number">${String(index + 1).padStart(2, "0")}</span>
          <span class="book-tab__label">
            <strong>${category.zh}</strong>
            <small>${category.short}</small>
          </span>
          <span aria-hidden="true">→</span>
        </button>
      `,
    )
    .join("");

  bookTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-book-category]");
    if (!button) return;
    renderBookCategory(Number(button.dataset.bookCategory));
  });
}

function showBook(stage = "cover") {
  if (!bookDialog.open) bookDialog.showModal();
  const isOpen = stage === "open";
  bookDialog.classList.toggle("is-open-book", isOpen);
  document.querySelector("[data-book-cover]").hidden = isOpen;
  document.querySelector("[data-open-book-view]").hidden = !isOpen;
  document.body.classList.add("is-layer-open");
  if (isOpen) renderBookCategory(activeBookCategory);
}

function hideBook() {
  if (bookDialog.open) bookDialog.close();
  bookDialog.classList.remove("is-open-book");
}

function showBar() {
  if (!barDialog.open) barDialog.showModal();
  document.body.classList.add("is-layer-open");
}

function hideBar() {
  if (barDialog.open) barDialog.close();
}

function renderPlace(placeId) {
  const detail = document.querySelector(".place-detail");
  const counter = detail.querySelector(".place-detail__counter");
  const title = detail.querySelector(".place-detail__title");
  const kicker = detail.querySelector(".place-detail__kicker");
  const body = detail.querySelector(".place-detail__body");
  const gallery = detail.querySelector("[data-place-gallery]");
  const links = detail.querySelector(".place-detail__links");

  document.querySelectorAll("[data-map-place]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mapPlace === placeId);
  });

  if (!placeId || !places[placeId]) {
    counter.textContent = "04 PLACES UNLOCKED";
    title.textContent = "先点亮一个地点";
    kicker.textContent = "地点不是坐标，是生活改变方向的地方。";
    body.textContent = "选择地图上的光点，查看与它相连的真实记录。";
    gallery.hidden = true;
    gallery.innerHTML = "";
    links.innerHTML = "";
    return;
  }

  const place = places[placeId];
  counter.textContent = place.counter;
  title.textContent = place.title;
  kicker.textContent = place.kicker;
  body.textContent = place.body;
  gallery.hidden = false;
  gallery.innerHTML = place.images
    .map(
      (photo, index) => `
        <figure class="place-photo ${index === 0 ? "place-photo--hero" : ""}">
          <img src="${photo.src}" alt="${photo.alt}" loading="lazy" decoding="async" />
        </figure>
      `,
    )
    .join("");

  links.innerHTML = place.links.length
    ? place.links
        .map(
          (link) => `
            <a class="place-link" href="${link.url}" target="_blank" rel="noreferrer">
              <span>${link.title}</span>
              <span aria-hidden="true">↗</span>
            </a>
          `,
        )
        .join("")
    : '<p class="place-detail__empty">内容待补充</p>';
}

function showMap(placeId = null) {
  mapLayer.classList.add("is-open");
  mapLayer.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-layer-open");
  renderPlace(placeId);
}

function hideMap() {
  mapLayer.classList.remove("is-open");
  mapLayer.setAttribute("aria-hidden", "true");
}

function closeAllLayers() {
  hideBook();
  hideBar();
  hideMap();
  document.body.classList.remove("is-layer-open");
}

function getLayerStateFromHash(hash) {
  if (hash === "#my-bar" || hash.startsWith("#my-bar/")) {
    return { layer: "bar" };
  }

  if (hash === "#creative-logbook/contents") {
    return { layer: "book", stage: "open" };
  }

  if (hash === "#creative-logbook") {
    return { layer: "book", stage: "cover" };
  }

  if (hash === "#places") {
    return { layer: "map", place: null };
  }

  if (hash.startsWith("#places/")) {
    return { layer: "map", place: hash.slice("#places/".length) || null };
  }

  return { layer: null };
}

function applyHistoryState(state = {}) {
  const layer = state?.layer ?? null;

  if (layer !== "book") hideBook();
  if (layer !== "bar") hideBar();
  if (layer !== "map") hideMap();

  if (layer === "book") {
    showBook(state.stage || "cover");
  } else if (layer === "bar") {
    showBar();
  } else if (layer === "map") {
    showMap(state.place || null);
  } else {
    document.body.classList.remove("is-layer-open");
  }
}

function pushLayer(state, hash) {
  history.pushState(state, "", hash);
  applyHistoryState(state);
}

function closeCurrentLayer(expectedLayer) {
  if (expectedLayer === "bar") {
    const state = { layer: null };
    history.replaceState(state, "", "#scene-03");
    applyHistoryState(state);
    document.querySelector("#scene-03")?.scrollIntoView({ behavior: "auto" });
    return;
  }

  if (history.state?.layer === expectedLayer) {
    history.back();
  } else {
    closeAllLayers();
  }
}

function openBook() {
  dismissPrototypeNote();
  pushLayer({ layer: "book", stage: "cover" }, "#creative-logbook");
}

function openBar() {
  dismissPrototypeNote();
  pushLayer({ layer: "bar", view: "intro" }, "#my-bar");
}

function openMap(placeId = null) {
  dismissPrototypeNote();
  pushLayer({ layer: "map", place: placeId }, placeId ? `#places/${placeId}` : "#places");
}

function dismissPrototypeNote() {
  const note = document.querySelector(".prototype-note");
  note.classList.add("is-dismissed");
  note.setAttribute("aria-hidden", "true");
}

function scrollToScene(sceneId) {
  closeDialogue();
  if (sceneId !== "scene-01") resetLifeExperience();
  const scene = document.getElementById(sceneId);
  if (!scene) return;
  scene.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  history.replaceState({ layer: null }, "", `#${sceneId}`);
}

document.querySelectorAll("[data-scroll-scene]").forEach((button) => {
  button.addEventListener("click", () => scrollToScene(button.dataset.scrollScene));
});

document.querySelector("[data-scene-link]").addEventListener("click", (event) => {
  event.preventDefault();
  scrollToScene(event.currentTarget.dataset.sceneLink);
});

lifeRevealButton.addEventListener("click", () => revealLifePaths());
lifePathButtons.forEach((button) => button.addEventListener("click", () => openLifePath(button)));
lifeTabs.forEach((tab) => {
  tab.addEventListener("click", () => renderLifePath(tab.dataset.lifeTab));
  tab.addEventListener("keydown", moveLifeTabFocus);
});
document.querySelector("[data-close-life]").addEventListener("click", () => closeLifePanel());
document.querySelector("[data-close-life-exploration]").addEventListener("click", () => {
  resetLifeExperience({ restoreFocus: true });
});

dialogueTab.addEventListener("click", advanceDialogue);
document.querySelector("[data-start-dialogue]").addEventListener("click", advanceDialogue);
document.querySelector("[data-close-dialogue]").addEventListener("click", closeDialogue);
travelBookTrigger.addEventListener("click", openBook);

document.querySelector("[data-turn-cover]").addEventListener("click", () => {
  const state = { layer: "book", stage: "open" };
  history.replaceState(state, "", "#creative-logbook/contents");
  applyHistoryState(state);
});

document.querySelector("[data-close-book]").addEventListener("click", () => closeCurrentLayer("book"));
document.querySelector("[data-book-prev]").addEventListener("click", () => renderBookCategory(activeBookCategory - 1));
document.querySelector("[data-book-next]").addEventListener("click", () => renderBookCategory(activeBookCategory + 1));

document.querySelectorAll("[data-open-bar]").forEach((button) => button.addEventListener("click", openBar));
document.querySelector("[data-close-bar]").addEventListener("click", () => closeCurrentLayer("bar"));

document.querySelector("[data-reveal-balloons]").addEventListener("click", (event) => {
  dismissPrototypeNote();
  scene04.classList.add("is-exploring");
  event.currentTarget.textContent = "地点气球已经升起";
  event.currentTarget.setAttribute("aria-pressed", "true");
});

document.querySelectorAll("[data-open-place]").forEach((button) => {
  button.addEventListener("click", () => openMap(button.dataset.openPlace));
});

document.querySelector("[data-open-map]").addEventListener("click", () => openMap());
document.querySelector("[data-close-map]").addEventListener("click", () => closeCurrentLayer("map"));

document.querySelectorAll("[data-map-place]").forEach((button) => {
  button.addEventListener("click", () => {
    const place = button.dataset.mapPlace;
    history.replaceState({ layer: "map", place }, "", `#places/${place}`);
    renderPlace(place);
  });
});

[bookDialog, barDialog].forEach((dialog) => {
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeCurrentLayer(dialog === bookDialog ? "book" : "bar");
  });
});

window.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  if (scene01.classList.contains("is-life-panel-open")) {
    event.preventDefault();
    closeLifePanel();
  } else if (scene01.classList.contains("is-exploring")) {
    event.preventDefault();
    resetLifeExperience({ restoreFocus: true });
  } else if (mapLayer.classList.contains("is-open")) {
    event.preventDefault();
    closeCurrentLayer("map");
  }
});

window.addEventListener("popstate", (event) => {
  applyHistoryState(event.state || { layer: null });
});

document.querySelector("[data-dismiss-note]").addEventListener("click", () => {
  dismissPrototypeNote();
});

const sceneObserver = new IntersectionObserver(
  (entries) => {
    const visibleEntry = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visibleEntry) return;
    const activeScene = visibleEntry.target.dataset.scene;
    siteHeader.dataset.activeScene = activeScene;

    if (activeScene !== "01" && scene01.classList.contains("is-exploring")) {
      resetLifeExperience();
    }

    document.querySelectorAll(".journey-nav__item").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.scrollScene === `scene-${activeScene}`);
    });
  },
  { threshold: [0.45, 0.65, 0.85] },
);

document.querySelectorAll("[data-scene]").forEach((scene) => sceneObserver.observe(scene));

buildBookTabs();
renderBookCategory(0);
const initialState = getLayerStateFromHash(location.hash);
history.replaceState(initialState, "", location.hash || "#scene-opening");
applyHistoryState(initialState);
