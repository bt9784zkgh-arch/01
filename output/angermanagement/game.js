/* =========================================================
   いかりと なかよく なろう  ― game.js
   ---------------------------------------------------------
   【先生へ】問題を かえるときは、すぐ下の LESSON だけを書きかえてください。
   - ふりがな: {漢字|かんじ} と書くと <ruby> になり、よみあげは かなで読みます。
   - ステップ1・3 の正解は answer に、選択肢と同じことばを書きます。
   - ステップ2 は正解なし（どれを選んでも「おいたね」と受けとめます）。
   - 絵は assets/ の中のファイル名を書きます。
   ========================================================= */
const LESSON = {
  steps: [
    /* ---------------- ステップ1 ---------------- */
    {
      name: 'いかりは だれにでも ある',
      kind: 'yesno',
      model: [
        { text: 'せんせいの おはなしを きいてね',
          say: 'わたしも おこることが あるよ',
          visual: [{ img: 'face-3.svg', alt: 'まゆを よせた かお' }] },
        { text: 'おこる きもちは わるくないよ。だれにでも あるよ',
          say: 'むねの なかの {小|ちい}さな ほのお。これが いかりマーク だよ',
          visual: [{ img: 'ikari-mark.svg', alt: 'ハートの なかの 小さな ほのお（いかりマーク）' }] }
      ],
      questions: [
        { q: 'おこらない {人|ひと}は いるかな？',
          choices: [{ label: 'いる' }, { label: 'いない' }],
          answer: 'いない',
          visual: [{ img: 'people.svg', alt: 'いろいろな 人。みんなの むねに 小さな いかりマーク' }],
          praise: 'よくできた！ だれでも おこること あるね',
          hint: { say: 'せんせいも おこること あったね',
                  show: [{ img: 'face-3.svg', alt: 'おてほんの せんせいの おこった かお' }] } },
        { q: 'おこる きもちは わるい きもち？',
          choices: [{ label: 'わるい', icon: 'icon-batsu.svg' }, { label: 'わるくない', icon: 'icon-maru.svg' }],
          answer: 'わるくない',
          visual: [{ img: 'stamp-ok.svg', alt: 'OKスタンプ' }, { img: 'face-0.svg', alt: 'にこにこ がお' }],
          praise: 'そのとおり！ おこるのは わるくないね',
          hint: { say: 'おてほんで なんて {言|い}ってたかな',
                  show: [{ text: 'おこる きもちは わるくないよ。だれにでも あるよ' }] } },
        { q: 'いかりは みんなが もっている？',
          choices: [{ label: 'もっている' }, { label: 'もっていない' }],
          answer: 'もっている',
          visual: [{ img: 'people.svg', alt: 'クラスの みんな。むねに 小さな ほのお' }],
          praise: 'いいね！ みんなの なかに あるね',
          hint: { say: 'ほのおを 1{人|り}ずつ みてみよう',
                  show: [{ marks: 5 }] } },
        { q: 'いかりは じぶんで しずめられる？',
          choices: [{ label: 'しずめられる' }, { label: 'しずめられない' }],
          answer: 'しずめられる',
          visual: [{ img: 'flame-shrink.svg', alt: 'ほのおが 大きいから 小さく なる' }],
          praise: 'すごい！ いかりは {小|ちい}さく できるね',
          hint: { say: 'しんこきゅう すると ほのおが {小|ちい}さく なるよ',
                  show: [{ img: 'breath.svg', alt: 'しんこきゅう する 人。ほのおが 小さく なる' }] } }
      ],
      clearSay: 'おこる きもちは だれにでも あるね'
    },

    /* ---------------- ステップ2（正誤なし） ---------------- */
    {
      name: 'いかりの ことばと {強|つよ}さ',
      kind: 'level',
      model: [
        { text: 'いかりメーター。{下|した}は {小|ちい}さい、{上|うえ}は {大|おお}きい いかり',
          say: '「イライラ」を メーターに おいて みるね',
          word: { text: 'イライラ', img: 'moyamoya.svg' },
          demoLevel: 2,
          sayAfter: 'わたしは ここ。{人|ひと}によって ちがって いいよ' }
      ],
      questions: [
        { q: '「イライラ」は どのくらい？',
          word: { text: 'イライラ', img: 'moyamoya.svg' },
          praise: 'おいたね！ あなたの 「イライラ」は そこなんだね',
          idleSay: 'まよったら まんなかでも いいよ' },
        { q: '「ムカムカ」は どのくらい？',
          word: { text: 'ムカムカ', img: 'face-1.svg' },
          praise: '{教|おし}えてくれて ありがとう！',
          idleSay: 'まよったら まんなかでも いいよ' },
        { q: 'どっちが {強|つよ}そう？ 「イライラ」と「{爆発|ばくはつ}する」',
          pair: [{ label: 'イライラ', icon: 'moyamoya.svg' }, { label: '{爆発|ばくはつ}する', icon: 'dokan.svg' }],
          praise: 'えらべたね！ ことばで {強|つよ}さが ちがうね',
          idleSay: 'どちらを えらんでも いいよ' },
        { q: 'どっちが {強|つよ}そう？ 「{頭|あたま}にくる」と「{激怒|げきど}する」',
          pair: [{ label: '{頭|あたま}にくる', icon: 'level-1.svg' }, { label: '{激怒|げきど}する', icon: 'level-3.svg' }],
          praise: 'いいね！ じぶんの きもちに あう ことばが {見|み}つかるね',
          idleSay: 'どちらを えらんでも いいよ' }
      ],
      summary: { text: 'いかりにも {大|おお}きさが あるね。{小|ちい}さいうちに {気|き}づけると いいね',
                 say: 'えらんだ カードが メーターに ならんだね' },
      clearSay: 'いかりにも {大|おお}きさが あるね'
    },

    /* ---------------- ステップ3 ---------------- */
    {
      name: 'かえられる？ かえられない？',
      kind: 'sort',
      model: [
        { text: 'たのしみの {修学旅行|しゅうがくりょこう}に {台風|たいふう}が きた',
          card: { imgs: ['trip.svg'], text: '{台風|たいふう}', alt: '修学旅行の バスと 台風' },
          say: 'これを はこに いれて みるね',
          demoBox: 'cannot', chip: '{台風|たいふう}',
          sayAfter: '{台風|たいふう}は じぶんでは かえられないね' },
        { text: 'でも、きぶんを かえる ことは できるよ',
          card: { imgs: ['heart-change.svg'], text: 'きぶん', alt: 'ハートの いろが 赤から 青に かわる' },
          say: 'ハートの カードも いれて みるね',
          demoBox: 'can', chip: 'きぶん',
          sayAfter: 'きぶんは じぶんで かえられるよ' }
      ],
      boxes: [
        { label: 'かえられる', icon: 'icon-hand.svg', cls: 'can' },
        { label: 'かえられない', icon: 'icon-lock.svg', cls: 'cannot' }
      ],
      questions: [
        { q: 'じぶんで かえられる？ かえられない？',
          card: { imgs: ['rain.svg'], text: '{雨|あめ}の てんき', alt: '雨雲と かさ' },
          answer: 'かえられない',
          praise: 'よくできた！ てんきは かえられないね',
          hint: { say: 'おてほんの {台風|たいふう}と おなじ なかまかな',
                  show: [{ img: 'typhoon.svg', alt: '台風', label: '{台風|たいふう}' }] } },
        { q: 'じぶんで かえられる？ かえられない？',
          card: { imgs: ['quake.svg', 'typhoon.svg'], text: '{地震|じしん}や {台風|たいふう}', alt: '地震で ゆれる 家と 台風' },
          answer: 'かえられない',
          praise: 'そのとおり！ しぜんは かえられないね',
          hint: { say: 'じぶんで とめられるかな？',
                  show: [{ img: 'icon-hand.svg', alt: 'て', label: 'て で おさえても…' }, { img: 'typhoon.svg', alt: '台風', label: 'とまらない' }] } },
        { q: 'じぶんで かえられる？ かえられない？',
          card: { imgs: ['traffic.svg'], text: '{道|みち}が こんで {車|くるま}が すすまない', alt: '車が ずらっと ならぶ 道' },
          answer: 'かえられない',
          praise: 'いいね！ じぶん ひとりでは かえられないね',
          hint: { say: 'じぶんが {車|くるま}を どかせるかな？', show: [] } },
        { q: 'じぶんで かえられる？ かえられない？',
          card: { imgs: ['study.svg'], text: 'テストの てんすう', alt: '本を よむ 子と、てんすうが 上がる やじるし' },
          answer: 'かえられる',
          praise: 'すごい！ べんきょうすれば かわるね',
          hint: { say: 'べんきょう したら どうなるかな？ やじるしを みてね', show: [] } },
        { q: 'じぶんで かえられる？ かえられない？',
          card: { imgs: ['heart-change.svg'], text: 'じぶんの きぶん', alt: 'ハートが 赤から 青に かわる。おんがく・しんこきゅう' },
          answer: 'かえられる',
          praise: 'さいこう！ きぶんは じぶんで かえられるね',
          hint: { say: 'おてほんの ハートカードを もういちど みてみよう',
                  show: [{ img: 'heart-change.svg', alt: 'おてほんの ハートカード', label: 'きぶん' }] } }
      ],
      clearSay: 'かえられる ことと かえられない ことが わかったね'
    }
  ],

  /* ふり返り（できたこと 3つまで） */
  result: {
    items: [
      { img: 'medal-step1.svg', text: 'いかりは だれにでも ある、わるくない きもちだと わかったね' },
      { img: 'medal-step2.svg', text: 'いかりにも {小|ちい}さい・{大|おお}きいが あると わかったね' },
      { img: 'medal-step3.svg', text: 'かえられる ことと かえられない ことを {分|わ}けられたね' }
    ],
    note: 'かえられない ことに おこったときは、きぶんを かえて みよう（しんこきゅう・すきな ことを する）',
    say: 'さいごまで できたね。すごい！'
  },

  words: {
    retry: 'もういちど みてみよう',
    guide: 'ひかって いる ほうを いっしょに おしてみよう',
    next: 'つぎへ',
    endSub: 'おつかれさま。また いつでも あそぼうね'
  }
};

/* 3D 担当へ渡す色（design.md 8章） */
const THEME = {
  paper: 0xFBF7EF, wall: 0xE8DDC8, ink: 0x33302C, primary: 0x2F6B62, tape: 0xEBC9A8,
  lv1: 0xA9C6E3, lv2: 0xF1D88A, lv3: 0xEFAE9B,
  can: 0xF2BC85, cannot: 0xC9CCD1, skin: 0xF7E3C8
};

/* ---- 画面サイズ（design.md 4章） ---- */
function fitApp(){
  const s = Math.min(innerWidth/1920, innerHeight/1080);
  document.documentElement.style.setProperty('--app-scale', s);
}
document.documentElement.classList.add('js-fit');
addEventListener('resize', fitApp); fitApp();

/* =========================================================
   ここから下は ゲームのしくみ（ふつうは書きかえなくてよい）
   ========================================================= */
(function () {
  'use strict';

  /* ---- 3D と 音: ファイルが無くても動くよう 空の関数で代用 ---- */
  const noop = function () {};
  if (!window.Motion3D) {
    window.Motion3D = { init: noop, setScene: noop, celebrate: noop, encourage: noop,
      stepClear: function () { return Promise.resolve(); }, setReducedMotion: noop };
  }
  if (!window.Sound) {
    window.Sound = { start: noop, setMuted: noop, play: noop };
  }
  function call(objName, fn) {
    const args = Array.prototype.slice.call(arguments, 2);
    try {
      const o = window[objName];
      if (o && typeof o[fn] === 'function') return o[fn].apply(o, args);
    } catch (e) { console.warn(objName + '.' + fn, e); }
    return undefined;
  }
  const M = function () { return call.apply(null, ['Motion3D'].concat([].slice.call(arguments))); };
  const S = function () { return call.apply(null, ['Sound'].concat([].slice.call(arguments))); };

  /* ---- 小道具 ---- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const ASSET = 'assets/';
  const RUBY_RE = /\{([^|{}]+)\|([^{}]+)\}/g;
  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function ruby(s) { return esc(s).replace(RUBY_RE, '<ruby>$1<rt>$2</rt></ruby>'); }
  function plain(s) { return String(s).replace(RUBY_RE, '$2'); }
  function el(tag, attrs, html) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
    }
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function img(file, alt, cls) {
    return el('img', { src: ASSET + file, alt: alt || '', class: cls || null });
  }
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ---- 設定（localStorage。使えなくても動く） ---- */
  const KEY = 'angermanagement.settings.v1';
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
  function saveSettings() {
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (e) {}
  }

  /* ---- 要素 ---- */
  const topbar = $('#topbar'), stepTag = $('#step-tag');
  const progText = $('#progress .progress-text'), progDots = $('#progress .progress-dots');
  const btnSound = $('#btn-sound'), btnMotion = $('#btn-motion'), btnRest = $('#btn-rest'), btnBack = $('#btn-back');
  const screens = { title: $('#screen-title'), play: $('#screen-play'), clear: $('#screen-clear'), result: $('#screen-result') };
  const qText = $('#q-text'), btnRead = $('#btn-read'), visual = $('#visual'), feedback = $('#feedback');
  const choicesEl = $('#choices'), speech = $('#speech'), teacher = $('#teacher');
  const restOverlay = $('#rest-overlay');

  /* ---- ページの並び（おてほん → もんだい → (まとめ) → クリア → ふり返り） ---- */
  const pages = [];
  LESSON.steps.forEach((st, si) => {
    st.model.forEach((m, mi) => pages.push({ type: 'model', si, mi }));
    st.questions.forEach((q, qi) => pages.push({ type: 'quiz', si, qi }));
    if (st.summary) pages.push({ type: 'summary', si });
    pages.push({ type: 'clear', si });
  });
  pages.push({ type: 'result' });

  const state = {
    page: -1,           // -1 = タイトル
    misses: 0,
    locked: false,
    placed: {},         // ステップ2で置いたもの: { qi: { text, lv } }
    timers: [],
    token: 0,
    started: false
  };
  function later(fn, ms) { const t = setTimeout(fn, ms); state.timers.push(t); return t; }
  function clearTimers() { state.timers.forEach(clearTimeout); state.timers = []; }

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
    if (!restOverlay.classList.contains('is-show')) S('setMuted', !settings.sound);
  }
  btnSound.addEventListener('click', () => {
    settings.sound = !settings.sound; saveSettings(); applySettings();
    if (settings.sound) S('play', 'tap');
  });
  btnMotion.addEventListener('click', () => {
    S('play', 'tap'); settings.reduce = !settings.reduce; saveSettings(); applySettings();
  });

  /* ---- おやすみ ---- */
  let restReturnFocus = null;
  function openRest() {
    S('play', 'tap');
    stopReading();
    restReturnFocus = document.activeElement;
    restOverlay.classList.add('is-show');
    topbar.inert = true; Object.values(screens).forEach(s => { s.inert = true; });
    S('setMuted', true);
    $('#btn-resume').focus();
  }
  function closeRest() {
    restOverlay.classList.remove('is-show');
    topbar.inert = false; Object.values(screens).forEach(s => { s.inert = false; });
    S('setMuted', !settings.sound);
    S('play', 'tap');
    if (restReturnFocus && document.contains(restReturnFocus)) restReturnFocus.focus();
  }
  btnRest.addEventListener('click', openRest);
  $('#btn-resume').addEventListener('click', closeRest);

  /* ---- もどる（ひとつ前の ページへ。クリア画面はとばす） ---- */
  btnBack.addEventListener('click', () => {
    if (state.page < 0) return;
    S('play', 'tap');
    let p = state.page - 1;
    while (p >= 0 && pages[p].type === 'clear') p--;
    if (p < 0) showTitle(); else go(p);
  });

  /* ---- よみあげ（speechSynthesis, ja-JP, rate 0.9） ---- */
  let readText = '';
  const canSpeak = 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  function stopReading() {
    if (canSpeak) { try { speechSynthesis.cancel(); } catch (e) {} }
    btnRead.classList.remove('is-reading');
  }
  btnRead.addEventListener('click', () => {
    if (!canSpeak) { speech.innerHTML = ruby('この パソコンでは よみあげが つかえないよ'); return; }
    if (btnRead.classList.contains('is-reading')) { stopReading(); return; }
    stopReading();
    const u = new SpeechSynthesisUtterance(readText);
    u.lang = 'ja-JP'; u.rate = 0.9;
    try {
      const v = speechSynthesis.getVoices().find(v => /^ja/i.test(v.lang));
      if (v) u.voice = v;
    } catch (e) {}
    u.onend = u.onerror = () => btnRead.classList.remove('is-reading');
    btnRead.classList.add('is-reading');
    speechSynthesis.speak(u);
  });

  /* ---- 画面の切りかえ ---- */
  function showScreen(name) {
    Object.keys(screens).forEach(k => screens[k].classList.toggle('is-active', k === name));
    topbar.classList.toggle('is-title', name === 'title');
    btnBack.disabled = name === 'title';
  }
  function setProgress(si, label, qi) {
    const st = LESSON.steps[si];
    const n = st.questions.length;
    stepTag.innerHTML = ruby(st.name);
    progText.textContent = 'ステップ ' + (si + 1) + ' ／ ' + label;
    progDots.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const cls = qi === 'done' || (typeof qi === 'number' && i < qi) ? 'dot is-done'
        : (i === qi ? 'dot is-now' : 'dot');
      progDots.appendChild(el('li', { class: cls }));
    }
    progDots.setAttribute('aria-label', 'ぜんぶで ' + n + 'もん');
  }
  function setSpeech(target, s) { target.innerHTML = s ? ruby(s) : ''; }
  function setTeacher(cls) {
    teacher.classList.remove('is-happy', 'is-thinking');
    if (cls) teacher.classList.add(cls);
  }
  function hideFeedback() { feedback.className = ''; feedback.innerHTML = ''; }
  function showFeedback(kind, s, autoHideMs) {
    const icon = kind === 'good' ? 'stamp-hanamaru.svg' : kind === 'accept' ? 'stamp-ok.svg' : 'stamp-retry.svg';
    feedback.className = 'feedback--' + kind + ' is-show';
    feedback.innerHTML = '';
    feedback.appendChild(img(icon, ''));
    feedback.appendChild(el('span', null, ruby(s)));
    if (autoHideMs) later(hideFeedback, autoHideMs);
  }
  function centerOf(node) {
    const r = node.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  }
  function focusQuiet(node) { try { node.focus({ preventScroll: true }); } catch (e) {} }

  /* ---- 絵を つくる ---- */
  function buildVisualItem(v) {
    if (v.img) return img(v.img, v.alt, 'visual-img');
    if (v.text) return el('div', { class: 'hint-text' }, ruby(v.text));
    return null;
  }
  function buildSituationCard(card) {
    const c = el('div', { class: 'situation-card' });
    if (card.imgs.length > 1) {
      const pair = el('div', { class: 'pair', role: 'img', 'aria-label': card.alt || '' });
      card.imgs.forEach(f => pair.appendChild(img(f, '')));
      c.appendChild(pair);
    } else {
      c.appendChild(img(card.imgs[0], card.alt));
    }
    c.appendChild(el('span', null, ruby(card.text)));
    return c;
  }
  function buildWordCard(w) {
    const c = el('div', { class: 'word-card' });
    c.appendChild(img(w.img, ''));
    c.appendChild(el('span', null, ruby(w.text)));
    return c;
  }
  const LV = [
    null,
    { label: '{小|ちい}さい', svg: 'level-1.svg', face: 'face-1.svg' },
    { label: '{中|ちゅう}くらい', svg: 'level-2.svg', face: 'face-2.svg' },
    { label: '{大|おお}きい', svg: 'level-3.svg', face: 'face-3.svg' }
  ];
  function buildMeter(chips, wide) {
    const m = el('div', { id: 'meter', class: 'meter' + (wide ? ' is-wide' : ''), role: 'group', 'aria-label': 'いかりメーター' });
    const tube = el('div', { class: 'meter-tube', 'aria-hidden': 'true' });
    [3, 2, 1].forEach(lv => tube.appendChild(el('div', { class: 'lv' + lv })));
    m.appendChild(tube);
    [3, 2, 1].forEach(lv => {
      const z = el('div', { class: 'meter-zone lv' + lv, 'data-lv': lv });
      const lab = el('span', { class: 'meter-label' });
      lab.appendChild(img(LV[lv].svg, ''));
      lab.appendChild(img(LV[lv].face, '', 'face'));
      lab.appendChild(el('span', null, ruby(LV[lv].label)));
      z.appendChild(lab);
      m.appendChild(z);
    });
    (chips || []).forEach(c => addChip(m, c.text, c.lv));
    return m;
  }
  function addChip(meter, text, lv) {
    const z = meter.querySelector('.meter-zone.lv' + lv);
    if (z) z.appendChild(el('span', { class: 'word-card word-card--chip' }, ruby(text)));
  }
  function placedBefore(qi) {
    const out = [];
    Object.keys(state.placed).map(Number).sort((a, b) => a - b).forEach(k => {
      if (qi === undefined || k < qi) out.push(state.placed[k]);
    });
    return out;
  }
  function makeNextButton(onClick) {
    const b = el('button', { id: 'btn-next', class: 'btn-primary btn-next', type: 'button' }, esc(LESSON.words.next));
    b.addEventListener('click', () => { S('play', 'tap'); onClick(); });
    return b;
  }
  function nextPage() { go(state.page + 1); }

  /* ---- ページを 出す ---- */
  function resetBoard(mode) {
    clearTimers(); stopReading(); hideFeedback(); setTeacher(null);
    screens.play.setAttribute('data-mode', mode);
    visual.innerHTML = ''; visual.classList.remove('has-hint');
    choicesEl.innerHTML = ''; speech.innerHTML = '';
    state.misses = 0; state.locked = false;
    state.token++;
  }

  function go(p) {
    state.page = p;
    const pg = pages[p];
    if (pg.type === 'model') renderModel(pg);
    else if (pg.type === 'quiz') renderQuiz(pg);
    else if (pg.type === 'summary') renderSummary(pg);
    else if (pg.type === 'clear') renderClear(pg);
    else renderResult();
  }

  function renderModel(pg) {
    const st = LESSON.steps[pg.si], m = st.model[pg.mi];
    resetBoard('model');
    showScreen('play'); M('setScene', 'play');
    setProgress(pg.si, 'おてほん', -1);
    qText.innerHTML = ruby(m.text);
    setSpeech(speech, m.say);
    readText = plain(m.text) + '。' + plain(m.say || '');

    const next = makeNextButton(nextPage);

    if (st.kind === 'level') {
      const wc = buildWordCard(m.word);
      const meter = buildMeter([], false);
      visual.appendChild(wc); visual.appendChild(meter);
      next.hidden = true;
      choicesEl.appendChild(next);
      later(() => {
        wc.classList.add('is-picked');
        addChip(meter, m.word.text, m.demoLevel);
        setSpeech(speech, m.sayAfter); setTeacher('is-happy');
        readText = plain(m.text) + '。' + plain(m.sayAfter);
        S('play', 'tap');
        next.hidden = false;
      }, 1500);
    } else if (st.kind === 'sort') {
      visual.appendChild(buildSituationCard(m.card));
      const boxes = st.boxes.map(b => {
        const d = el('div', { class: 'choice choice--box ' + b.cls });
        d.appendChild(img(b.icon, '', 'choice-icon'));
        d.appendChild(el('span', null, ruby(b.label)));
        choicesEl.appendChild(d);
        return d;
      });
      next.hidden = true;
      choicesEl.appendChild(next);
      later(() => {
        const idx = st.boxes.findIndex(b => b.cls === m.demoBox);
        const box = boxes[idx];
        box.classList.add('is-selected');
        box.appendChild(el('span', { class: 'word-card word-card--chip box-chip' }, ruby(m.chip)));
        setSpeech(speech, m.sayAfter); setTeacher('is-happy');
        readText = plain(m.text) + '。' + plain(m.sayAfter);
        S('play', 'tap');
        next.hidden = false;
      }, 1500);
    } else {
      (m.visual || []).forEach(v => { const n = buildVisualItem(v); if (n) visual.appendChild(n); });
      choicesEl.appendChild(next);
    }
    focusQuiet(qText);
  }

  function renderSummary(pg) {
    const st = LESSON.steps[pg.si];
    resetBoard('model');
    showScreen('play'); M('setScene', 'play');
    setProgress(pg.si, 'まとめ', 'done');
    qText.innerHTML = ruby(st.summary.text);
    setSpeech(speech, st.summary.say); setTeacher('is-happy');
    readText = plain(st.summary.text);
    visual.appendChild(buildMeter(placedBefore(), true));
    choicesEl.appendChild(makeNextButton(nextPage));
    focusQuiet(qText);
  }

  function renderQuiz(pg) {
    const st = LESSON.steps[pg.si], q = st.questions[pg.qi];
    resetBoard('quiz');
    showScreen('play'); M('setScene', 'play');
    setProgress(pg.si, 'もんだい ' + (pg.qi + 1) + ' ／ ' + st.questions.length, pg.qi);
    qText.innerHTML = ruby(q.q);

    let opts = [];   // { label, icon, cls }
    let btnClass = '';
    if (st.kind === 'yesno') {
      opts = q.choices; btnClass = 'choice choice--yesno';
      (q.visual || []).forEach(v => { const n = buildVisualItem(v); if (n) visual.appendChild(n); });
    } else if (st.kind === 'sort') {
      opts = st.boxes; btnClass = 'choice choice--box';
      const card = buildSituationCard(q.card);
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-pressed', 'false');
      const pick = () => {
        if (state.locked) return;
        const on = !card.classList.contains('is-picked');
        card.classList.toggle('is-picked', on);
        card.setAttribute('aria-pressed', String(on));
        S('play', 'tap');
        if (on) setSpeech(speech, 'どちらの はこに いれるかな？');
      };
      card.addEventListener('click', pick);
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
      visual.appendChild(card);
    } else if (st.kind === 'level') {
      if (q.pair) {
        opts = q.pair; btnClass = 'choice choice--word';
        visual.appendChild(buildMeter(placedBefore(pg.qi), true));
      } else {
        opts = [1, 2, 3].map(lv => ({ label: LV[lv].label, icon: LV[lv].svg, cls: 'lv' + lv, lv }));
        btnClass = 'choice choice--level';
        visual.appendChild(buildWordCard(q.word));
        visual.appendChild(buildMeter(placedBefore(pg.qi), false));
      }
      if (q.idleSay) later(() => { if (!state.locked) setSpeech(speech, q.idleSay); }, 10000);
    }

    const buttons = opts.map((o, i) => {
      const b = el('button', { class: btnClass + (o.cls ? ' ' + o.cls : ''), type: 'button', 'data-index': i });
      b.appendChild(el('span', { class: 'key-num', 'aria-hidden': 'true' }, String(i + 1)));
      if (o.icon) b.appendChild(img(o.icon, '', 'choice-icon'));
      b.appendChild(el('span', null, ruby(o.label)));
      b.addEventListener('click', () => choose(pg, i, buttons, opts));
      choicesEl.appendChild(b);
      return b;
    });

    readText = (q.card ? plain(q.card.text) + '。' : '') + plain(q.q) + '。' +
      opts.map(o => plain(o.label)).join('、');
    focusQuiet(qText);
  }

  function choose(pg, i, buttons, opts) {
    if (state.locked) return;
    const btn = buttons[i];
    if (btn.classList.contains('is-dimmed')) return;
    const st = LESSON.steps[pg.si], q = st.questions[pg.qi];
    const tok = state.token;
    stopReading();

    /* ステップ2: 正誤なし。どれでも受けとめる */
    if (st.kind === 'level') {
      state.locked = true;
      const label = q.pair ? opts[i].label : q.word.text;
      const lv = q.pair ? 3 : opts[i].lv;
      state.placed[pg.qi] = { text: label, lv };
      const meter = $('#meter', visual);
      if (meter) addChip(meter, label, lv);
      btn.classList.add('is-placed');
      buttons.forEach(b => { b.disabled = true; if (b !== btn) b.hidden = true; });
      showFeedback('accept', q.praise, 2200);
      setSpeech(speech, q.praise); setTeacher('is-happy');
      S('play', 'correct');
      const c = centerOf(btn); M('celebrate', c[0], c[1]);
      afterAnswer(tok);
      return;
    }

    const correct = plain(opts[i].label) === plain(q.answer);
    if (correct) {
      state.locked = true;
      btn.classList.remove('is-retry', 'is-guide');
      btn.classList.add('is-correct');
      buttons.forEach(b => { b.disabled = true; if (b !== btn) b.hidden = true; });
      const card = $('.situation-card', visual); if (card) card.classList.remove('is-picked');
      showFeedback('good', q.praise, 2200);
      setSpeech(speech, q.praise); setTeacher('is-happy');
      S('play', 'correct');
      const c = centerOf(btn); M('celebrate', c[0], c[1]);
      afterAnswer(tok);
      return;
    }

    /* まちがえたとき（失点なし） */
    state.misses++;
    S('play', 'retry'); M('encourage');
    btn.classList.add('is-retry');
    setTeacher('is-thinking');
    later(() => { if (state.token === tok && !state.locked) setTeacher(null); }, 1800);
    const answerIdx = opts.findIndex(o => plain(o.label) === plain(q.answer));

    if (state.misses === 1) {
      showFeedback('retry', LESSON.words.retry, 1800);
      setSpeech(speech, LESSON.words.retry);
      visual.querySelectorAll('.visual-img, .situation-card img, .situation-card .pair, .word-card')
        .forEach(n => n.classList.add('hint-glow'));
    } else if (state.misses === 2) {
      showFeedback('retry', LESSON.words.retry, 1800);
      showHint(q.hint);
      /* 候補を2つに しぼる（3つ以上あるとき） */
      if (buttons.length > 2) {
        const keep = buttons.findIndex((b, k) => k !== answerIdx && k !== i);
        buttons.forEach((b, k) => {
          if (k !== answerIdx && k !== (keep >= 0 ? keep : i)) { b.classList.add('is-dimmed'); b.setAttribute('aria-disabled', 'true'); }
        });
      }
    } else {
      /* 3回目から: 正解をやさしく光らせ、いっしょに押す */
      hideFeedback();
      setSpeech(speech, LESSON.words.guide);
      buttons.forEach((b, k) => {
        if (k === answerIdx) { b.classList.remove('is-dimmed', 'is-retry'); b.classList.add('is-guide'); b.removeAttribute('aria-disabled'); }
        else { b.classList.add('is-dimmed'); b.setAttribute('aria-disabled', 'true'); }
      });
      focusQuiet(buttons[answerIdx]);
    }
  }

  function showHint(hint) {
    if (!hint) return;
    setSpeech(speech, hint.say);
    const items = hint.show || [];
    if (items.length) visual.classList.add('has-hint');
    items.forEach(h => {
      if (h.marks) {
        const wrap = el('div', { class: 'hint-marks', role: 'img', 'aria-label': 'みんなの むねの ほのお' });
        const marks = [];
        for (let k = 0; k < h.marks; k++) { const im = img('ikari-mark.svg', ''); wrap.appendChild(im); marks.push(im); }
        visual.appendChild(wrap);
        marks.forEach((im, k) => later(() => im.classList.add('hint-glow'), 500 + k * 700));
      } else if (h.text) {
        visual.appendChild(el('div', { class: 'hint-text hint-glow' }, ruby(h.text)));
      } else if (h.img) {
        const it = el('div', { class: 'hint-item' });
        const im = img(h.img, h.alt, 'hint-glow');
        it.appendChild(im);
        if (h.label) it.appendChild(el('span', null, ruby(h.label)));
        visual.appendChild(it);
      }
    });
  }

  function afterAnswer(tok) {
    later(() => {
      if (state.token !== tok) return;
      const next = makeNextButton(nextPage);
      choicesEl.appendChild(next);
      focusQuiet(next);
    }, 1200);
  }

  async function renderClear(pg) {
    clearTimers(); stopReading();
    state.token++;
    const tok = state.token;
    const n = pg.si + 1;
    showScreen('clear'); M('setScene', 'play');
    setProgress(pg.si, 'クリア', 'done');
    const scr = screens.clear;
    $('#clear-medal').src = ASSET + 'medal-step' + n + '.svg';
    $('#clear-medal').alt = 'ステップ' + n + ' クリアの メダル';
    const txt = $('.clear-text', scr);
    txt.textContent = 'ステップ' + n + ' クリア！';
    setSpeech($('.speech', scr), LESSON.steps[pg.si].clearSay);
    const nb = $('#btn-clear-next');
    nb.hidden = true;
    focusQuiet(txt);
    S('play', 'clear');
    let p;
    try { p = M('stepClear', n); } catch (e) { p = null; }
    await Promise.race([Promise.resolve(p).catch(() => {}), sleep(2600)]);
    if (state.token !== tok) return;
    nb.hidden = false;
    focusQuiet(nb);
  }
  $('#btn-clear-next').addEventListener('click', () => { S('play', 'tap'); nextPage(); });

  function renderResult() {
    clearTimers(); stopReading();
    state.token++;
    showScreen('result'); M('setScene', 'result');
    stepTag.textContent = 'きょう できたこと';
    progText.textContent = 'ぜんぶ おわったよ';
    progDots.innerHTML = '';
    const scr = screens.result;
    const list = $('.result-list', scr);
    list.innerHTML = '';
    LESSON.result.items.slice(0, 3).forEach(it => {
      const li = el('li', { class: 'result-item' });
      li.appendChild(img(it.img, ''));
      li.appendChild(el('span', null, ruby(it.text)));
      list.appendChild(li);
    });
    $('.result-note', scr).innerHTML = ruby(LESSON.result.note);
    setSpeech($('.speech', scr), LESSON.result.say);
    focusQuiet(list);
  }

  function showTitle(ended) {
    clearTimers(); stopReading();
    state.token++;
    state.page = -1;
    showScreen('title'); M('setScene', 'title');
    if (ended) $('.title-sub').innerHTML = ruby(LESSON.words.endSub);
    focusQuiet($('#btn-start'));
  }

  function startGame() {
    state.placed = {};
    $('.title-sub').textContent = 'こころの おんどけいを しらべよう';
    go(0);
  }

  $('#btn-start').addEventListener('click', () => {
    if (!state.started) {
      state.started = true;
      S('start');
    }
    applySettings();
    S('play', 'tap');
    startGame();
  });
  $('#btn-again').addEventListener('click', () => { S('play', 'tap'); startGame(); });
  $('#btn-end').addEventListener('click', () => { S('play', 'tap'); showTitle(true); });

  /* ---- キーボード: 1〜4 で選択肢（Tab / Enter / スペースは ボタンの ふつうの動き） ---- */
  document.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (restOverlay.classList.contains('is-show')) {
      if (e.key === 'Escape') closeRest();
      return;
    }
    const k = e.key;
    if (k < '1' || k > '4' || k.length !== 1) return;
    if (!screens.play.classList.contains('is-active')) return;
    if (screens.play.getAttribute('data-mode') !== 'quiz' || state.locked) return;
    const list = Array.from(choicesEl.querySelectorAll('button.choice')).filter(b => !b.hidden);
    const b = list[Number(k) - 1];
    if (b) { e.preventDefault(); focusQuiet(b); b.click(); }
  });

  /* ---- はじめの じゅんび ---- */
  try { M('init', document.getElementById('stage3d'), { theme: THEME }); } catch (e) {}
  applySettings();
  M('setScene', 'title');
  showTitle(false);
})();
