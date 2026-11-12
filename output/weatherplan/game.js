/* =========================================================
   はれ？ あめ？ よていづくり ― game.js
   ---------------------------------------------------------
   先生へ: 問題を かえるときは、この すぐ下の LESSON だけを 書きかえます。
   ・漢字に ふりがなを つけるときは {漢字|よみ} と書きます（例: {日曜日|にちようび}）
   ・ことばの間には スペースを入れます（スペースの所でだけ 改行します）
   ・天気は hare（はれ）／hare-kumori（はれ ときどき くもり）／kumori（くもり）／
     kumori-ame（くもり 一時雨）／ame（あめ）の5つ。曜日は mon tue wed thu fri sat sun
   ========================================================= */
const LESSON = {
  title: 'はれ？ あめ？ よていづくり',

  /* 週間天気予報（ワークシート 1枚目・2枚目） */
  weeks: {
    1: { mon: 'hare', tue: 'hare-kumori', wed: 'kumori',     thu: 'kumori-ame', fri: 'ame',         sat: 'hare-kumori', sun: 'hare' },
    2: { mon: 'hare', tue: 'hare-kumori', wed: 'kumori-ame', thu: 'kumori',     fri: 'hare-kumori', sat: 'ame',         sun: 'hare' }
  },

  /* 用事（絵は assets/ の中。where: soto＝そと ／ naka＝なか） */
  tasks: {
    soccer:  { name: 'サッカー',          img: 'task-soccer.svg',  where: 'soto' },
    ensoku:  { name: 'えんそく',          img: 'task-ensoku.svg',  where: 'soto' },
    reading: { name: 'ほんを よむ',       img: 'task-reading.svg', where: 'naka' },
    study:   { name: 'べんきょう',        img: 'task-study.svg',   where: 'naka' },
    cafe:    { name: 'カフェで おしゃべり', img: 'task-cafe.svg',    where: 'naka' },
    piano:   { name: 'ピアノ',            img: 'task-piano.svg',   where: 'naka' },
    cinema:  { name: 'えいが',            img: 'task-cinema.svg',  where: 'naka' }
  },

  steps: [
    /* ---------------- ステップ1 ---------------- */
    {
      kind: 'weather',
      name: 'てんきマークを よもう',
      clearSub: 'てんきの マークが よめたね',
      model: {
        q: 'これは なんの てんき？', mark: 'hare',
        choices: [{ label: 'はれ', icon: 'hare' }, { label: 'あめ', icon: 'ame' }], answer: 0,
        say: 'これは はれ。おひさまの マークだよ', caption: 'はれ'
      },
      questions: [
        { q: 'これは なんの てんき？', mark: 'hare',
          choices: [{ label: 'はれ', icon: 'hare' }, { label: 'あめ', icon: 'ame' }], answer: 0,
          praise: 'よくできた！ おひさまは はれ だね',
          hint: { glow: ['sun'], grow: true },
          together: 'おひさまだから はれ だね' },
        { q: 'これは なんの てんき？', mark: 'ame',
          choices: [{ label: 'あめ', icon: 'ame' }, { label: 'はれ', icon: 'hare' }], answer: 0,
          praise: 'すごい！ かさは あめ の マークだね',
          hint: { drip: true },
          together: 'かさだから あめ だね' },
        { q: 'これは なんの てんき？', mark: 'kumori',
          choices: [{ label: 'くもり', icon: 'kumori' }, { label: 'はれ', icon: 'hare' }, { label: 'あめ', icon: 'ame' }], answer: 0,
          praise: 'そのとおり！ くもだけは くもり だね',
          hint: { float: true, pop: 'cloud' },
          together: 'くもだけだから くもり だね' },
        { q: 'おひさまと くもが いるよ。どんな てんき？', mark: 'hare-kumori',
          choices: [{ label: 'はれ と くもり', icon: 'hare-kumori' }, { label: 'あめ', icon: 'ame' }], answer: 0,
          praise: 'よくみたね！ おひさまと くもで「はれ ときどき くもり」だよ',
          hint: { seq: ['sun', 'cloud'] },
          together: 'おひさまと くもだから はれ と くもり だね' },
        { q: 'くもと かさが あるよ。あめは ふるかな？', mark: 'kumori-ame',
          choices: [{ label: 'ふるかも' }, { label: 'ふらない' }], answer: 0,
          praise: 'すばらしい！ かさが あるから あめが ふるかも だね',
          hint: { glow: ['umbrella'], dimOther: true, note: 'かさは あめの しるし' },
          together: 'かさが あるから あめが ふるかも だね' }
      ]
    },

    /* ---------------- ステップ2 ---------------- */
    {
      kind: 'sort',
      name: 'そと？ なか？ わけよう',
      clearSub: 'そとの ようじと なかの ようじを わけられたね',
      model: { q: 'ほんを よむのは どこ？', task: 'reading', answer: 'naka', say: 'ほんは いえの なかで よめるね' },
      questions: [
        { q: 'サッカーは どこで する？', task: 'soccer', answer: 'soto',
          praise: 'よくできた！ サッカーは ひろい そとで するね',
          hint: { scene: 'soto' }, together: 'ひろい ばしょで するから そと だね' },
        { q: 'ほんを よむのは どこ？', task: 'reading', answer: 'naka',
          praise: 'そのとおり！ ほんは いえの なかで よめるね',
          hint: { scene: 'naka' }, together: 'いすに すわって よむから なか だね' },
        { q: 'えんそくは どこ？', task: 'ensoku', answer: 'soto',
          praise: 'すごい！ えんそくは そとを あるくね',
          hint: { scene: 'soto' }, together: 'そとを あるくから そと だね' },
        { q: 'べんきょうは どこ？', task: 'study', answer: 'naka',
          praise: 'よくみたね！ べんきょうは へやの なかで できるね',
          hint: { scene: 'naka' }, together: 'つくえで するから なか だね' },
        { q: 'カフェで おしゃべりは どこ？', task: 'cafe', answer: 'naka',
          praise: 'すばらしい！ カフェは おみせの なかだね',
          hint: { scene: 'naka', note: 'たてもの' }, together: 'おみせの なかだから なか だね' }
      ],
      summary: {
        q: 'まとめ。そとと なかに わけたよ',
        say: 'つぎは てんきと あわせて かんがえるよ',
        soto: ['soccer', 'ensoku'], naka: ['reading', 'study', 'cafe'],
        sotoNote: 'そとの ようじは あめだと こまるね',
        nakaNote: 'なかの ようじは あめでも できるね'
      }
    },

    /* ---------------- ステップ3 ---------------- */
    /* days: 出す3つの曜日 ／ answer: 正解の曜日（'any' は どの曜日でも正解） ／ reasons: ok:true が正解 */
    {
      kind: 'plan',
      name: 'よていを たてよう',
      clearSub: 'てんきを みて よていが たてられたね',
      model: {
        week: 1, q: 'サッカーは なんようびに する？', task: 'soccer', day: 'sun',
        say: 'サッカーは そと。はれの ひが いいね', sayWhy: 'どうして？ はれだから だね',
        reasons: [{ text: 'はれだから', icon: 'weather-hare.svg', ok: true }, { text: 'あめだから', icon: 'weather-ame.svg' }]
      },
      questions: [
        { week: 1, q: 'サッカーは なんようびに する？', task: 'soccer',
          days: ['sun', 'fri', 'thu'], answer: ['sun'],
          reasons: [{ text: 'はれだから', icon: 'weather-hare.svg', ok: true }, { text: 'あめだから', icon: 'weather-ame.svg' }],
          praise: 'よくできた！ はれの にちようびに サッカー だね',
          hint: {}, togetherDay: 'はれだから にちようび だね', togetherWhy: 'はれの ひだから「はれだから」だね' },
        { week: 1, q: 'えんそくは なんようびに する？', task: 'ensoku',
          days: ['sat', 'fri', 'thu'], answer: ['sat'],
          reasons: [{ text: 'あめが ふらないから', icon: 'weather-hare-kumori.svg', ok: true }, { text: 'あめが ふるから', icon: 'weather-ame.svg' }],
          praise: 'すごい！ おひさまが いるから どようびで いいね',
          hint: { note: 'かさが ないね' }, togetherDay: 'かさが ないから どようび だね', togetherWhy: 'かさが ないから「あめが ふらないから」だね' },
        { week: 1, q: 'ピアノは なんようびに する？', task: 'piano',
          days: ['fri', 'wed', 'mon'], answer: 'any',
          reasons: [{ text: 'いえの なかで できるから', icon: 'badge-naka.svg', ok: true }, { text: 'はれだから', icon: 'weather-hare.svg' }],
          praise: 'ばっちり！ ピアノは なかだから あめの ひでも できるね',
          afterNote: 'あめの ひに なかの ようじを すると、はれの ひを そとの ようじに つかえるね',
          hint: {}, togetherWhy: 'ピアノは なかだから「いえの なかで できるから」だね' },
        { week: 2, q: 'てんきが かわったよ。えんそくは なんようび？', task: 'ensoku',
          days: ['sat', 'fri', 'wed'], answer: ['fri'], compareBefore: true,
          reasons: [{ text: 'あめが ふらないから', icon: 'weather-hare-kumori.svg', ok: true }, { text: 'あめが ふるから', icon: 'weather-ame.svg' }],
          praise: 'よくみたね！ こんどの どようびは あめ。きんようびに えんそく だね',
          hint: { note: 'かさが ないね' }, togetherDay: 'かさが ないから きんようび だね', togetherWhy: 'かさが ないから「あめが ふらないから」だね' },
        { week: 2, q: 'えいがは なんようびに みる？', task: 'cinema',
          days: ['sat', 'wed', 'mon'], answer: 'any',
          reasons: [{ text: 'たてものの なかだから', icon: 'badge-naka.svg', ok: true }, { text: 'はれだから', icon: 'weather-hare.svg' }],
          praise: 'すばらしい！ えいがかんは なかだから あめでも だいじょうぶ',
          afterNote: 'あめの ひに なかの ようじを すると、はれの ひを そとの ようじに つかえるね',
          hint: {}, togetherWhy: 'えいがかんは なかだから「たてものの なかだから」だね' }
      ],
      compare: {
        q: 'てんきが かわったよ。まえの しゅうと くらべよう',
        say: 'ひかって いる ようびの てんきが かわったよ'
      }
    }
  ],

  /* ふり返り（できたこと。クリアした ステップの分だけ 出ます） */
  result: [
    'てんきの マークが よめたね。はれ・くもり・あめ',
    'そとの ようじと なかの ようじを わけられたね',
    'そとの ようじは はれの ひに。なかの ようじは あめの ひでも できるね'
  ]
};

/* 3D の色（design.md 8章） */
const THEME = {
  page: 0xFCFAF4, cover: 0x3B5747, ink: 0x2B2F33, primary: 0x2E5E4E, tape: 0xE4C77E,
  sun: 0xE0663A, sunLight: 0xF2A57E, cloud: 0xA9AFB5, cloudLight: 0xCED2D6,
  rain: 0x3D7DBE, rainLight: 0x9CC0E4, soto: 0xA8D3E6, naka: 0xB7865A, grass: 0x8DB07A
};

/* ---- 画面サイズ（design.md 4章） ---- */
function fitApp() {
  const s = Math.min(innerWidth / 1920, innerHeight / 1080);
  document.documentElement.style.setProperty('--app-scale', s);
}
document.documentElement.classList.add('js-fit');
addEventListener('resize', fitApp); fitApp();

/* =========================================================
   ここから下は ゲームの しくみ（ふつうは 書きかえなくて よい）
   ========================================================= */
(function () {
  'use strict';

  /* ---- 3D と 音: ファイルが無くても動くよう 空の関数で代用 ---- */
  const noop = function () {};
  if (!window.Motion3D) {
    window.Motion3D = { init: noop, setScene: noop, celebrate: noop, encourage: noop,
      stepClear: function () { return Promise.resolve(); }, setReducedMotion: noop };
  }
  if (!window.Sound) window.Sound = { start: noop, stop: noop, setMuted: noop, play: noop };
  function call(objName, fn, args) {
    try {
      const o = window[objName];
      if (o && typeof o[fn] === 'function') return o[fn].apply(o, args || []);
    } catch (e) { try { console.warn('[game] ' + objName + '.' + fn, e); } catch (_) {} }
    return undefined;
  }
  const M = (fn, ...a) => call('Motion3D', fn, a);
  let scene3d = null;
  const setScene = name => { if (scene3d !== name) { scene3d = name; M('setScene', name); } };
  const S = (fn, ...a) => call('Sound', fn, a);

  /* ---- 小道具 ---- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const ASSET = 'assets/';
  const RUBY_RE = /\{([^|{}]+)\|([^{}]+)\}/g;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ruby = s => esc(s).replace(RUBY_RE, '<ruby>$1<rt>$2</rt></ruby>');
  const plain = s => String(s).replace(RUBY_RE, '$2');
  function el(tag, attrs, html) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (attrs[k] === undefined || attrs[k] === null || attrs[k] === false) continue;
      if (k === 'class') e.className = attrs[k]; else e.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    }
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  const img = (file, alt, cls) => el('img', { src: ASSET + file, alt: alt || '', class: cls });

  /* ---- 天気・曜日 ---- */
  const WEATHER = {
    'hare':        { lines: ['はれ'],               read: 'はれ',                 parts: ['sun'],              umbrella: false, desc: 'あかい まるい おひさまの マーク' },
    'hare-kumori': { lines: ['はれ と', 'くもり'],    read: 'はれ ときどき くもり',  parts: ['sun', 'cloud'],     umbrella: false, desc: 'おひさまと くもの マーク' },
    'kumori':      { lines: ['くもり'],             read: 'くもり',               parts: ['cloud'],            umbrella: false, desc: 'はいいろの くもだけの マーク' },
    'kumori-ame':  { lines: ['くもり', 'あめ かも'],  read: 'くもり いちじ あめ',    parts: ['cloud', 'umbrella'], umbrella: true,  desc: 'くもと かさの マーク' },
    'ame':         { lines: ['あめ'],               read: 'あめ',                 parts: ['umbrella', 'drops'], umbrella: true,  desc: 'かさと しずくの マーク' }
  };
  const DAYS = [
    { key: 'mon', kanji: '月', yomi: 'げつ', read: 'げつようび' },
    { key: 'tue', kanji: '火', yomi: 'か',   read: 'かようび' },
    { key: 'wed', kanji: '水', yomi: 'すい', read: 'すいようび' },
    { key: 'thu', kanji: '木', yomi: 'もく', read: 'もくようび' },
    { key: 'fri', kanji: '金', yomi: 'きん', read: 'きんようび' },
    { key: 'sat', kanji: '土', yomi: 'ど',   read: 'どようび' },
    { key: 'sun', kanji: '日', yomi: 'にち', read: 'にちようび' }
  ];
  const dayOf = k => DAYS.find(d => d.key === k);
  const wfile = w => 'weather-' + w + '.svg';

  function buildWmark(w) {
    const m = el('div', { class: 'wmark wmark--' + w, role: 'img', 'aria-label': WEATHER[w].desc });
    WEATHER[w].parts.forEach(p => m.appendChild(img('wpart-' + p + '.svg', '', 'wmark-part wmark-part--' + p)));
    return m;
  }
  /* 曜日のマス。opts: { button, keyNum, name(曜日を出す), chip(用事キー), off, cls } */
  function buildDayCell(dayKey, w, opts) {
    opts = opts || {};
    const d = dayOf(dayKey);
    const c = el(opts.button ? 'button' : 'div', { class: 'day-cell' + (opts.off ? ' is-off' : '') + (opts.cls ? ' ' + opts.cls : ''),
      'data-weather': w, 'data-day': dayKey, type: opts.button ? 'button' : null });
    if (opts.keyNum) c.appendChild(el('span', { class: 'key-num', 'aria-hidden': 'true' }, String(opts.keyNum)));
    if (opts.name !== false) c.appendChild(el('span', { class: 'day-name', 'aria-hidden': 'true' }, '<ruby>' + d.kanji + '<rt>' + d.yomi + '</rt></ruby>'));
    if (opts.markEl) c.appendChild(opts.markEl); else c.appendChild(img(wfile(w), '', 'day-mark'));
    if (opts.weather !== false) {
      const dw = el('span', { class: 'day-weather', 'aria-hidden': 'true' });
      WEATHER[w].lines.forEach(t => dw.appendChild(el('span', null, esc(t))));
      c.appendChild(dw);
    }
    const slot = el('span', { class: 'day-slot' });
    if (opts.chip) slot.appendChild(buildChip(opts.chip));
    c.appendChild(slot);
    c.appendChild(el('span', { class: 'sr-only' }, esc((opts.name === false ? '' : d.read + '、') + WEATHER[w].read + (opts.chip ? '、' + LESSON.tasks[opts.chip].name : ''))));
    return c;
  }
  function buildChip(taskKey, row) {
    const t = LESSON.tasks[taskKey];
    const c = el('span', { class: 'task-chip' + (row ? ' task-chip--row' : '') });
    c.appendChild(img(t.img, ''));
    c.appendChild(el('span', { class: 'label' }, ruby(t.name)));
    return c;
  }
  function buildTaskCard(taskKey, withBadge) {
    const t = LESSON.tasks[taskKey];
    const c = el('div', { class: 'task-card' });
    c.appendChild(img(t.img, t.name + 'の え'));
    c.appendChild(el('span', { class: 'task-name' }, ruby(t.name)));
    if (withBadge) c.appendChild(img('badge-' + t.where + '.svg', t.where === 'soto' ? 'そとで する' : 'なかで する', 'where-badge'));
    return c;
  }

  /* ---- 設定（localStorage。使えなくても動く） ---- */
  const KEY = 'weatherplan.settings.v1';
  let prefersReduced = false;
  try { prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  const settings = { sound: true, reduce: prefersReduced };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object') {
      if (typeof saved.sound === 'boolean') settings.sound = saved.sound;
      if (typeof saved.reduce === 'boolean') settings.reduce = saved.reduce;
    }
  } catch (e) {}
  const saveSettings = () => { try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (e) {} };

  /* ---- 要素 ---- */
  const topbar = $('#topbar'), stepTag = $('#step-tag'), progress = $('#progress');
  const progStep = $('#prog-step'), progQ = $('#prog-q'), progDots = $('#progress-dots');
  const btnSound = $('#btn-sound'), btnMotion = $('#btn-motion'), btnRest = $('#btn-rest'), btnBack = $('#btn-back');
  const screens = { title: $('#screen-title'), play: $('#screen-play'), clear: $('#screen-clear'), result: $('#screen-result') };
  const titlePage = $('#title-page'), stepPicker = $('#step-picker');
  const board = $('#board'), qText = $('#q-text'), btnRead = $('#btn-read'), visual = $('#visual');
  const list = $('#choice-list'), btnNext = $('#btn-next');
  const feedback = $('#feedback'), fbImg = $('#feedback img'), fbWord = $('#feedback .feedback-word');
  const speech = $('#speech'), guide = $('#guide');
  const restOverlay = $('#rest-overlay');

  /* ---- ページの並び ---- */
  const pages = [];
  LESSON.steps.forEach((st, si) => {
    if (st.model) pages.push({ type: 'model', si });
    st.questions.forEach((q, qi) => {
      if (q.compareBefore && st.compare) pages.push({ type: 'compare', si, qi });
      pages.push({ type: 'quiz', si, qi });
    });
    if (st.summary) pages.push({ type: 'summary', si });
    pages.push({ type: 'clear', si });
  });
  pages.push({ type: 'result' });
  const firstPageOf = si => pages.findIndex(p => p.si === si);

  const state = { page: -1, started: false, timers: [], token: 0, cleared: new Set(), plan: { 1: {}, 2: {} } };
  function later(fn, ms) { const tok = state.token; const t = setTimeout(() => { if (tok === state.token) fn(); }, ms); state.timers.push(t); return t; }
  function clearTimers() { state.timers.forEach(clearTimeout); state.timers = []; state.token++; }

  /* ---- 設定ボタン ---- */
  function applySettings() {
    btnSound.setAttribute('aria-pressed', String(settings.sound));
    $('img', btnSound).src = ASSET + (settings.sound ? 'icon-sound-on.svg' : 'icon-sound-off.svg');
    $('.set-state', btnSound).textContent = settings.sound ? 'あり' : 'なし';
    btnMotion.setAttribute('aria-pressed', String(settings.reduce));
    $('img', btnMotion).src = ASSET + (settings.reduce ? 'icon-motion-less.svg' : 'icon-motion.svg');
    $('.set-state', btnMotion).textContent = settings.reduce ? 'すくなめ' : 'ふつう';
    document.body.classList.toggle('reduce-motion', settings.reduce);
    M('setReducedMotion', settings.reduce);
    S('setMuted', !settings.sound);
  }
  btnSound.addEventListener('click', () => {
    settings.sound = !settings.sound; saveSettings(); applySettings();
    if (settings.sound) { if (state.started) S('start'); S('play', 'tap'); } else stopReading();
  });
  btnMotion.addEventListener('click', () => { S('play', 'tap'); settings.reduce = !settings.reduce; saveSettings(); applySettings(); });

  /* ---- おやすみ ---- */
  let restReturnFocus = null;
  function openRest() {
    S('play', 'tap'); stopReading();
    restReturnFocus = document.activeElement;
    restOverlay.classList.add('is-show');
    topbar.inert = true; Object.values(screens).forEach(s => { s.inert = true; });
    S('stop');
    $('#btn-resume').focus();
  }
  function closeRest() {
    restOverlay.classList.remove('is-show');
    topbar.inert = false; Object.values(screens).forEach(s => { s.inert = false; });
    if (state.started && settings.sound) S('start');
    S('setMuted', !settings.sound);
    S('play', 'tap');
    if (restReturnFocus && document.contains(restReturnFocus)) restReturnFocus.focus();
  }
  btnRest.addEventListener('click', openRest);
  $('#btn-resume').addEventListener('click', closeRest);

  /* ---- もどる（タイトルへ。ステップを えらぶ 画面なら もとに もどす） ---- */
  btnBack.addEventListener('click', () => {
    S('play', 'tap');
    if (state.page < 0) { if (titlePage.classList.contains('is-picking')) unpick(); return; }
    showTitle();
  });

  /* ---- よみあげ（speechSynthesis, ja-JP, rate 0.9） ---- */
  let readText = '';
  const canSpeak = 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  function stopReading() {
    if (canSpeak) { try { speechSynthesis.cancel(); } catch (e) {} }
    btnRead.classList.remove('is-reading');
  }
  function say(text, withButton) {
    if (!canSpeak || !text) return false;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(plain(text));
      u.lang = 'ja-JP'; u.rate = 0.9;
      const v = speechSynthesis.getVoices().find(v => /^ja/i.test(v.lang));
      if (v) u.voice = v;
      if (withButton) { btnRead.classList.add('is-reading'); u.onend = u.onerror = () => btnRead.classList.remove('is-reading'); }
      speechSynthesis.speak(u);
      return true;
    } catch (e) { btnRead.classList.remove('is-reading'); return false; }
  }
  btnRead.addEventListener('click', () => {
    if (btnRead.classList.contains('is-reading')) { stopReading(); return; }
    if (!say(readText, true)) setSpeech('この パソコンでは よみあげが つかえないよ');
  });

  /* ---- 画面の部品 ---- */
  function showScreen(name) {
    Object.keys(screens).forEach(k => screens[k].classList.toggle('is-active', k === name));
    const inGame = name === 'play' || name === 'clear';
    stepTag.hidden = !inGame; progress.hidden = !inGame;
  }
  function setProgress(si, label, doneCount, nowIdx) {
    const st = LESSON.steps[si], n = st.questions.length;
    stepTag.innerHTML = ruby(st.name);
    progStep.textContent = 'ステップ ' + (si + 1) + ' ／ ' + LESSON.steps.length;
    progQ.textContent = label;
    progDots.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const cls = i < doneCount ? 'dot is-done' : (i === nowIdx ? 'dot is-now' : 'dot');
      progDots.appendChild(el('li', { class: cls }));
    }
    progDots.setAttribute('aria-label', 'ぜんぶで ' + n + 'もん。' + doneCount + 'もん おわった');
  }
  function setSpeech(s) { speech.innerHTML = s ? ruby(s) : ''; }
  function setGuide(mood) {
    guide.classList.remove('is-happy', 'is-thinking');
    guide.src = ASSET + (mood === 'happy' ? 'guide-happy.svg' : mood === 'thinking' ? 'guide-thinking.svg' : 'guide.svg');
    if (mood) { void guide.offsetWidth; guide.classList.add(mood === 'happy' ? 'is-happy' : 'is-thinking'); }
  }
  function showFeedback(kind, word) {
    feedback.className = 'feedback--' + kind + ' is-show';
    fbImg.src = ASSET + (kind === 'good' ? 'stamp-good.svg' : 'stamp-retry.svg');
    fbWord.innerHTML = ruby(word);
  }
  function hideFeedback() { feedback.className = ''; fbWord.innerHTML = ''; }
  function centerOf(node) { const r = node.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
  function focusQuiet(node) { try { node.focus({ preventScroll: true }); } catch (e) {} }
  function showNext(delay) {
    later(() => { btnNext.hidden = false; focusQuiet(btnNext); }, delay || 0);
  }
  function keyChoice(btn, n) { btn.prepend(el('span', { class: 'key-num', 'aria-hidden': 'true' }, String(n))); }
  function weatherChoice(c, i, disabled) {
    const b = el('button', { class: 'choice choice--weather', type: 'button', disabled: !!disabled });
    keyChoice(b, i + 1);
    if (c.icon) b.appendChild(img(wfile(c.icon), '', 'choice-icon'));
    b.appendChild(el('span', { class: 'label' }, ruby(c.label)));
    return b;
  }
  function boxChoice(where, i, disabled) {
    const b = el('button', { class: 'choice choice--box ' + where, type: 'button', 'data-where': where, disabled: !!disabled });
    keyChoice(b, i + 1);
    b.appendChild(img('box-' + where + '.svg', '', 'box-art'));
    b.appendChild(el('span', { class: 'label' }, where === 'soto' ? 'そと' : 'なか'));
    return b;
  }
  function reasonChoice(r, i, disabled) {
    const b = el('button', { class: 'choice choice--reason', type: 'button', disabled: !!disabled });
    keyChoice(b, i + 1);
    b.appendChild(img(r.icon, '', 'choice-icon'));
    b.appendChild(el('span', { class: 'label' }, ruby(r.text)));
    return b;
  }
  function visualNote(text) { return el('p', { class: 'visual-note' }, ruby(text)); }

  /* ---- 1つの ページを 用意する（ぜんぶ きれいにしてから） ---- */
  function resetPlay(mode, wide) {
    clearTimers(); stopReading();
    showScreen('play');
    screens.play.dataset.mode = mode;
    if (wide) board.dataset.layout = 'wide'; else delete board.dataset.layout;
    visual.innerHTML = ''; list.innerHTML = ''; list.className = 'choice-list';
    btnNext.hidden = true;
    hideFeedback(); setSpeech(''); setGuide(null);
  }
  function setQuestion(text, extraRead) {
    qText.innerHTML = ruby(text);
    readText = plain(text) + (extraRead ? '。' + plain(extraRead) : '');
  }

  /* ---- まちがえたときの 共通の流れ ----
     ctx: { correct:[btn], all:[btn], onCorrect(btn), hint2(), together:'…', look(btn) } */
  function makeRound(ctx) {
    let misses = 0, done = false;
    function correct(btn, together) {
      if (done) return; done = true;
      clearTimers();
      ctx.all.forEach(b => { b.disabled = true; b.classList.remove('is-guide', 'is-retry', 'is-dimmed', 'is-look', 'is-grow'); });
      btn.classList.add('is-correct');
      S('play', 'correct');
      const [x, y] = centerOf(btn);
      M('celebrate', x, y, ctx.small ? { small: true } : undefined);
      ctx.onCorrect(btn, together);
    }
    function wrong(btn) {
      if (done) return;
      misses++;
      S('play', 'retry'); M('encourage');
      setGuide('thinking');
      btn.classList.add('is-retry');
      if (misses === 1) {
        showFeedback('retry', 'もういちど みてみよう');
        setSpeech(ctx.firstMissText ? ctx.firstMissText(btn) : 'もういちど みてみよう');
        if (ctx.look) ctx.look(btn);
      } else if (misses === 2) {
        showFeedback('retry', 'もういちど みてみよう');
        setSpeech(ctx.firstMissText ? ctx.firstMissText(btn) : 'ひかって いる ところを よく みてね');
        narrow(btn);
        if (ctx.hint2) ctx.hint2();
      } else {
        // 3回目: 正解を やさしく光らせ、いっしょに押す
        const ans = ctx.correct[0];
        ctx.all.forEach(b => { if (ctx.correct.indexOf(b) < 0) { b.classList.add('is-dimmed'); b.disabled = true; } });
        ans.classList.add('is-guide');
        showFeedback('info', 'いっしょに たしかめよう');
        setSpeech(ctx.together);
        if (settings.sound) say('いっしょに たしかめよう。' + ctx.together);
        focusQuiet(ans);
        later(() => correct(ans, true), 2600);
      }
    }
    // 2回目: 正解の候補を 2つに しぼる（3つ以上あるとき）
    function narrow(lastWrong) {
      const wrongs = ctx.all.filter(b => ctx.correct.indexOf(b) < 0 && !b.disabled);
      const keep = ctx.all.length - wrongs.length; // 正解の数
      const order = wrongs.slice().sort((a, b) => (b === lastWrong) - (a === lastWrong) || b.classList.contains('is-retry') - a.classList.contains('is-retry'));
      const stay = Math.max(0, 2 - keep);
      order.slice(0, Math.max(0, order.length - stay)).forEach(b => { b.classList.remove('is-retry'); b.classList.add('is-dimmed'); b.disabled = true; });
    }
    ctx.all.forEach(b => b.addEventListener('click', () => {
      if (b.disabled || done) return;
      S('play', 'tap');
      if (ctx.correct.indexOf(b) >= 0) correct(b, false); else wrong(b);
    }));
  }
  function afterCorrect(btn, praise) {
    $$('button', list).forEach(b => { if (b !== btn) b.hidden = true; });
    showFeedback('good', 'せいかい！');
    setSpeech(praise);
    setGuide('happy');
    showNext(1200);
  }

  /* =========================================================
     ステップ1: てんきマーク
     ========================================================= */
  function renderWeatherModel(si) {
    const m = LESSON.steps[si].model;
    resetPlay('model');
    setQuestion(m.q, m.say);
    const mark = buildWmark(m.mark);
    visual.appendChild(mark);
    const btns = m.choices.map((c, i) => weatherChoice(c, i, true));
    btns.forEach(b => list.appendChild(b));
    setSpeech(m.say);
    const ans = btns[m.answer];
    later(() => ans.classList.add('is-guide'), 1200);
    later(() => {
      S('play', 'tap');
      ans.classList.remove('is-guide'); ans.classList.add('is-correct');
      btns.forEach(b => { if (b !== ans) b.hidden = true; });
      visual.appendChild(el('span', { class: 'mark-caption' }, ruby(m.caption)));
      setGuide('happy');
    }, 2800);
    showNext(3600);
  }
  function renderWeatherQuiz(si, qi) {
    const q = LESSON.steps[si].questions[qi];
    resetPlay('quiz');
    setQuestion(q.q);
    const mark = buildWmark(q.mark);
    visual.appendChild(mark);
    const btns = q.choices.map((c, i) => weatherChoice(c, i));
    btns.forEach(b => list.appendChild(b));
    const ans = btns[q.answer];
    const part = p => $('.wmark-part--' + p, mark);
    makeRound({
      all: btns, correct: [ans], together: q.together,
      look: () => mark.classList.add('is-look'),
      hint2: () => {
        const h = q.hint || {};
        mark.classList.remove('is-look');
        if (h.glow) h.glow.forEach(p => part(p) && part(p).classList.add('is-glow'));
        if (h.dimOther) WEATHER[q.mark].parts.forEach(p => { if (!h.glow || h.glow.indexOf(p) < 0) part(p).classList.add('is-dim'); });
        if (h.grow) ans.classList.add('is-guide', 'is-grow');
        if (h.drip && part('drops')) part('drops').classList.add('is-drip');
        if (h.float && part('cloud')) part('cloud').classList.add('is-float');
        if (h.pop) { ans.appendChild(img('wpart-' + h.pop + '.svg', '', 'hint-pop')); ans.classList.add('is-guide'); }
        if (h.note) visual.appendChild(visualNote(h.note));
        if (h.seq) {
          let i = 0;
          const tick = () => {
            h.seq.forEach((p, j) => part(p) && part(p).classList.toggle('is-glow', j === i % h.seq.length));
            i++; later(tick, 2400);
          };
          tick();
        }
      },
      onCorrect: (btn) => {
        $$('.wmark-part', mark).forEach(p => p.classList.remove('is-glow', 'is-dim', 'is-drip', 'is-float'));
        mark.classList.remove('is-look');
        afterCorrect(btn, q.praise);
      }
    });
  }

  /* =========================================================
     ステップ2: そと？ なか？
     ========================================================= */
  function dropInto(box, taskKey) {
    const d = el('span', { class: 'box-drop' });
    d.appendChild(buildChip(taskKey));
    box.appendChild(d);
  }
  function renderSortModel(si) {
    const m = LESSON.steps[si].model;
    resetPlay('model');
    setQuestion(m.q, m.say);
    const card = buildTaskCard(m.task);
    visual.appendChild(card);
    const btns = ['soto', 'naka'].map((w, i) => boxChoice(w, i, true));
    btns.forEach(b => list.appendChild(b));
    setSpeech(m.say);
    const ans = btns.find(b => b.dataset.where === m.answer);
    later(() => ans.classList.add('is-guide'), 1200);
    later(() => {
      S('play', 'tap');
      ans.classList.remove('is-guide'); ans.classList.add('is-correct');
      dropInto(ans, m.task);
      btns.forEach(b => { if (b !== ans) b.hidden = true; });
      setGuide('happy');
    }, 2800);
    showNext(3600);
  }
  function renderSortQuiz(si, qi) {
    const q = LESSON.steps[si].questions[qi];
    resetPlay('quiz');
    setQuestion(q.q);
    const card = buildTaskCard(q.task);
    visual.appendChild(card);
    const btns = ['soto', 'naka'].map((w, i) => boxChoice(w, i));
    btns.forEach(b => list.appendChild(b));
    const ans = btns.find(b => b.dataset.where === q.answer);
    makeRound({
      all: btns, correct: [ans], together: q.together,
      look: () => card.classList.add('is-look'),
      hint2: () => {
        const h = q.hint || {};
        card.classList.remove('is-look');
        if (h.scene) {
          visual.insertBefore(img('box-' + h.scene + '.svg', '', 'hint-scene'), card);
          card.classList.add('is-hint-back', 'hint-' + h.scene);
        }
        if (h.note) visual.appendChild(visualNote(h.note));
      },
      onCorrect: (btn) => { card.classList.remove('is-look'); dropInto(btn, q.task); afterCorrect(btn, q.praise); }
    });
  }
  function renderSortSummary(si) {
    const s = LESSON.steps[si].summary;
    resetPlay('quiz', true);
    setQuestion(s.q, s.sotoNote + '。' + s.nakaNote);
    const wrap = el('div', { class: 'summary' });
    [['soto', s.soto, s.sotoNote], ['naka', s.naka, s.nakaNote]].forEach(([w, tasks, note]) => {
      const box = el('div', { class: 'sort-box ' + w });
      const head = el('div', { class: 'sort-head' });
      head.appendChild(img('badge-' + w + '.svg', ''));
      head.appendChild(el('span', null, w === 'soto' ? 'そと' : 'なか'));
      box.appendChild(head);
      const items = el('div', { class: 'sort-items' });
      tasks.forEach(t => items.appendChild(buildChip(t, true)));
      box.appendChild(items);
      box.appendChild(el('p', { class: 'sort-note' }, ruby(note)));
      wrap.appendChild(box);
    });
    visual.appendChild(wrap);
    setSpeech(s.say);
    showNext(800);
  }

  /* =========================================================
     ステップ3: よていを たてよう
     ========================================================= */
  function weekTag(n) { return el('span', { class: 'week-tag' }, 'しゅう' + n); }
  function buildPickPair(taskKey, dayKey, w) {
    const pair = el('div', { class: 'pick-pair' });
    const card = buildTaskCard(taskKey, true);
    pair.appendChild(card);
    const arrow = el('span', { class: 'pick-arrow', 'aria-hidden': 'true' });
    pair.appendChild(arrow);
    pair.appendChild(buildDayCell(dayKey, w, { chip: taskKey, cls: 'is-picked' }));
    return { pair, card, arrow };
  }
  function renderPlanModel(si) {
    const m = LESSON.steps[si].model;
    const week = LESSON.weeks[m.week];
    resetPlay('model');
    setQuestion(m.q, m.say);
    visual.appendChild(weekTag(m.week));
    visual.appendChild(buildTaskCard(m.task, true));
    list.className = 'choice-list choice-list--week';
    const cells = DAYS.map(d => buildDayCell(d.key, week[d.key]));
    cells.forEach(c => list.appendChild(c));
    setSpeech(m.say);
    const ans = cells[DAYS.findIndex(d => d.key === m.day)];
    later(() => ans.classList.add('is-guide'), 1200);
    later(() => { S('play', 'tap'); ans.classList.remove('is-guide'); ans.classList.add('is-correct'); }, 2800);
    later(() => {
      // どうして？
      visual.innerHTML = ''; list.innerHTML = ''; list.className = 'choice-list';
      visual.appendChild(buildPickPair(m.task, m.day, week[m.day]).pair);
      const r = m.reasons.map((x, i) => reasonChoice(x, i, true));
      r.forEach(b => list.appendChild(b));
      setQuestion('どうして ' + dayOf(m.day).read + 'に したの？');
      setSpeech('どうして？');
      const ok = r[m.reasons.findIndex(x => x.ok)];
      later(() => ok.classList.add('is-guide'), 1000);
      later(() => {
        S('play', 'tap');
        ok.classList.remove('is-guide'); ok.classList.add('is-correct');
        r.forEach(b => { if (b !== ok) b.hidden = true; });
        setSpeech(m.sayWhy); setGuide('happy');
      }, 2400);
      showNext(3200);
    }, 4200);
  }

  function renderCompare(si) {
    const c = LESSON.steps[si].compare;
    resetPlay('quiz', true);
    setQuestion(c.q, c.say);
    const w1 = LESSON.weeks[1], w2 = LESSON.weeks[2];
    const table = el('div', { class: 'week-table' });
    table.appendChild(el('span'));
    DAYS.forEach(d => table.appendChild(el('span', { class: 'wt-day' }, '<ruby>' + d.kanji + '<rt>' + d.yomi + '</rt></ruby>')));
    table.appendChild(weekTag(1));
    DAYS.forEach(d => table.appendChild(buildDayCell(d.key, w1[d.key], { name: false })));
    table.appendChild(weekTag(2));
    const changed = [];
    DAYS.forEach(d => {
      const diff = w1[d.key] !== w2[d.key];
      let markEl = null;
      if (diff && w2[d.key] === 'ame') {   // あめに なった曜日は マークが 入れかわる
        markEl = el('span', { class: 'mark-swap day-mark' });
        markEl.appendChild(img(wfile(w1[d.key]), '', 'mark-old'));
        markEl.appendChild(img(wfile(w2[d.key]), '', 'mark-new'));
      }
      const cell = buildDayCell(d.key, w2[d.key], { name: false, cls: diff ? 'is-changed' : '', markEl });
      if (diff) changed.push(cell);
      table.appendChild(cell);
    });
    table.appendChild(el('span'));
    DAYS.forEach(d => table.appendChild(el('span', { class: 'wt-note' }, w1[d.key] !== w2[d.key] ? '<span>かわった</span>' : '')));
    visual.appendChild(table);
    setSpeech(c.say);
    // かわった曜日を 1つずつ ゆっくり光らせる
    changed.forEach((cell, i) => later(() => {
      changed.forEach(x => x.classList.remove('is-guide'));
      cell.classList.add('is-guide');
    }, 600 + i * 2000));
    later(() => changed.forEach(x => x.classList.remove('is-guide')), 600 + changed.length * 2000);
    showNext(600 + changed.length * 2000);
  }

  function renderPlanQuiz(si, qi) {
    const q = LESSON.steps[si].questions[qi];
    const week = LESSON.weeks[q.week];
    const task = LESSON.tasks[q.task];
    resetPlay('quiz');
    setQuestion(q.q);
    visual.appendChild(weekTag(q.week));
    const card = buildTaskCard(q.task, true);
    visual.appendChild(card);
    list.className = 'choice-list choice-list--week';
    const btns = [];
    let n = 0;
    DAYS.forEach(d => {
      const on = q.days.indexOf(d.key) >= 0;
      const cell = buildDayCell(d.key, week[d.key], on ? { button: true, keyNum: ++n } : { off: true });
      if (on) btns.push(cell); else cell.setAttribute('aria-hidden', 'true');
      list.appendChild(cell);
    });
    const any = q.answer === 'any';
    const correctBtns = btns.filter(b => any || q.answer.indexOf(b.dataset.day) >= 0);
    makeRound({
      all: btns, correct: correctBtns, small: true, together: q.togetherDay || '',
      look: (b) => b.classList.add('is-look'),
      firstMissText: (b) => WEATHER[b.dataset.weather].umbrella && task.where === 'soto'
        ? 'かさの ひだね。そとで できるかな？' : 'もういちど みてみよう',   // 「もういちど みてみよう」は 合図の札にも出る
      hint2: () => {
        btns.forEach(b => b.classList.remove('is-look'));
        correctBtns.forEach(b => b.classList.add('is-guide'));
        if (q.hint && q.hint.note) visual.appendChild(visualNote(q.hint.note));
      },
      onCorrect: (btn) => {
        const day = btn.dataset.day;
        state.plan[q.week][day] = q.task;
        btns.forEach(b => b.classList.remove('is-look'));
        showFeedback('good', 'せいかい！');
        setGuide('happy');
        setSpeech(any ? 'せいかい！ なかの ようじは どの ひでも できるね' : 'そうだね。どうして かな？');
        later(() => renderPlanReason(si, qi, day), 1600);
      }
    });
  }
  function renderPlanReason(si, qi, day) {
    const q = LESSON.steps[si].questions[qi];
    const w = LESSON.weeks[q.week][day];
    clearTimers();
    visual.innerHTML = ''; list.innerHTML = ''; list.className = 'choice-list';
    hideFeedback(); setGuide(null); setSpeech('');
    setQuestion('どうして ' + dayOf(day).read + 'に したの？');
    const pp = buildPickPair(q.task, day, w);
    visual.appendChild(pp.pair);
    const btns = q.reasons.map((r, i) => reasonChoice(r, i));
    btns.forEach(b => list.appendChild(b));
    const ok = btns[q.reasons.findIndex(r => r.ok)];
    focusQuiet(qText);
    makeRound({
      all: btns, correct: [ok], together: q.togetherWhy,
      hint2: () => ok.classList.add('is-guide'),
      onCorrect: (btn) => {
        if (q.afterNote) {
          pp.card.remove(); pp.arrow.remove();
          visual.appendChild(visualNote(q.afterNote));
        }
        afterCorrect(btn, q.praise);
      }
    });
  }

  /* =========================================================
     ステップクリア・ふり返り・タイトル
     ========================================================= */
  async function renderClear(si) {
    clearTimers(); stopReading();
    showScreen('clear');
    const st = LESSON.steps[si];
    setProgress(si, 'クリア', st.questions.length, -1);
    state.cleared.add(si);
    $('#clear-medal').src = ASSET + 'medal-step' + (si + 1) + '.svg';
    $('#clear-medal').alt = 'ステップ' + (si + 1) + 'の シール';
    $('#clear-text').textContent = 'ステップ' + (si + 1) + ' クリア！';
    $('#clear-sub').innerHTML = ruby(st.clearSub);
    $('#clear-speech').innerHTML = ruby(si + 1 < LESSON.steps.length ? 'シールを はったよ。つぎも いっしょに やろう' : 'シールが 3まい そろったね');
    const nb = $('#btn-clear-next');
    nb.hidden = true;
    focusQuiet($('#clear-text'));
    S('play', 'clear');
    const tok = state.token;
    let p;
    try { p = M('stepClear', si + 1); } catch (e) { p = null; }
    try { await Promise.race([Promise.resolve(p), new Promise(r => setTimeout(r, 2600))]); } catch (e) {}
    await new Promise(r => setTimeout(r, 300));
    if (tok !== state.token) return;
    nb.hidden = false; focusQuiet(nb);
  }

  function renderResult() {
    clearTimers(); stopReading();
    showScreen('result');
    setScene('result');
    const ul = $('#result-list'); ul.innerHTML = '';
    LESSON.steps.forEach((st, si) => {
      if (!state.cleared.has(si) || !LESSON.result[si]) return;
      const li = el('li', { class: 'result-item' });
      li.appendChild(img('medal-step' + (si + 1) + '.svg', ''));
      li.appendChild(el('span', { class: 'label' }, ruby(LESSON.result[si])));
      ul.appendChild(li);
    });
    const t = $('#plan-table'); t.innerHTML = '';
    t.appendChild(el('span'));
    DAYS.forEach(d => t.appendChild(el('span', { class: 'wt-day' }, '<ruby>' + d.kanji + '<rt>' + d.yomi + '</rt></ruby>')));
    [1, 2].forEach(n => {
      t.appendChild(weekTag(n));
      DAYS.forEach(d => t.appendChild(buildDayCell(d.key, LESSON.weeks[n][d.key], { name: false, chip: state.plan[n][d.key] })));
    });
    focusQuiet($('#result-title'));
  }

  function renderTitleWeek() {
    const tw = $('#title-week'); tw.innerHTML = '';
    DAYS.forEach(d => tw.appendChild(buildDayCell(d.key, LESSON.weeks[1][d.key], { weather: false })));
    stepPicker.innerHTML = '';
    LESSON.steps.forEach((st, si) => {
      const b = el('button', { class: 'btn-step', type: 'button' });
      b.appendChild(el('span', { class: 'key-num', 'aria-hidden': 'true' }, String(si + 1)));
      b.appendChild(img('medal-step' + (si + 1) + '.svg', ''));
      b.appendChild(el('span', { class: 'label' }, 'ステップ' + (si + 1) + '<br>' + ruby(st.name)));
      b.addEventListener('click', () => { begin(); go(firstPageOf(si)); });
      stepPicker.appendChild(b);
    });
  }
  function unpick() { titlePage.classList.remove('is-picking'); focusQuiet($('#btn-steps')); }
  function showTitle(picking) {
    clearTimers(); stopReading();
    state.page = -1;
    showScreen('title');
    titlePage.classList.toggle('is-picking', !!picking);
    setScene('title');
    focusQuiet(picking ? $('.btn-step', stepPicker) : $('#btn-start'));
  }
  function begin() {
    S('play', 'tap');
    if (!state.started) { state.started = true; S('start'); S('setMuted', !settings.sound); }
    setScene('play');
  }
  function resetProgress() { state.cleared = new Set(); state.plan = { 1: {}, 2: {} }; }

  $('#btn-start').addEventListener('click', () => { resetProgress(); begin(); go(0); });
  $('#btn-steps').addEventListener('click', () => {
    S('play', 'tap');
    if (!state.started) { state.started = true; S('start'); S('setMuted', !settings.sound); }
    titlePage.classList.add('is-picking'); focusQuiet($('.btn-step', stepPicker));
  });
  $('#btn-again').addEventListener('click', () => { resetProgress(); begin(); go(0); });
  $('#btn-pick').addEventListener('click', () => { S('play', 'tap'); resetProgress(); showTitle(true); });
  btnNext.addEventListener('click', () => { S('play', 'tap'); go(state.page + 1); });
  $('#btn-clear-next').addEventListener('click', () => { S('play', 'tap'); go(state.page + 1); });

  /* ---- ページへ 進む ---- */
  function go(p) {
    state.page = p;
    const pg = pages[p];
    if (!pg) { showTitle(); return; }
    if (pg.type === 'result') { renderResult(); return; }
    if (pg.type === 'clear') { renderClear(pg.si); return; }
    const st = LESSON.steps[pg.si];
    const n = st.questions.length;
    if (pg.type === 'model') {
      setProgress(pg.si, 'おてほん', 0, -1);
      ({ weather: renderWeatherModel, sort: renderSortModel, plan: renderPlanModel })[st.kind](pg.si);
    } else if (pg.type === 'quiz') {
      setProgress(pg.si, (pg.qi + 1) + 'もんめ ／ ぜんぶで ' + n + 'もん', pg.qi, pg.qi);
      ({ weather: renderWeatherQuiz, sort: renderSortQuiz, plan: renderPlanQuiz })[st.kind](pg.si, pg.qi);
    } else if (pg.type === 'summary') {
      setProgress(pg.si, 'まとめ', n, -1);
      renderSortSummary(pg.si);
    } else if (pg.type === 'compare') {
      setProgress(pg.si, 'くらべよう', pg.qi, -1);
      renderCompare(pg.si);
    }
    setScene('play');
    if (!btnNext.hidden) focusQuiet(btnNext); else focusQuiet(qText);
  }

  /* ---- キーボード: 1〜4 で選択肢、Esc で おやすみを とじる ---- */
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (restOverlay.classList.contains('is-show')) {
      if (e.key === 'Escape') { e.preventDefault(); closeRest(); }
      return;
    }
    if (e.key === 'Escape' && state.page < 0 && titlePage.classList.contains('is-picking')) { e.preventDefault(); unpick(); return; }
    if (/^[1-4]$/.test(e.key)) {
      const active = $('.screen.is-active');
      const target = $$('button .key-num', active).map(k => k.parentElement)
        .find(b => b.textContent && $('.key-num', b).textContent === e.key && !b.disabled && !b.hidden && b.offsetParent !== null);
      if (target) { e.preventDefault(); target.click(); }
    }
  });

  /* ---- はじめ ---- */
  try { M('init', document.getElementById('stage3d'), { theme: THEME }); } catch (e) {}
  applySettings();
  renderTitleWeek();
  showTitle();
})();
