/* =========================================================
   はれ？ あめ？ よていづくり ― game.js
   ---------------------------------------------------------
   先生へ: 問題を かえるときは、この すぐ下の LESSON だけを 書きかえます。
   ・漢字に ふりがなを つけるときは {漢字|よみ} と書きます（例: {日曜日|にちようび}）
   ・ことばの間には スペースを入れます（スペースの所でだけ 改行します）
   ・正解の位置が いつも同じに ならないよう、選択肢の順を まぜてあります
     （answer は 左から 0・1・2 と数えた番号。どうして？は ok: true が正解）
   ・天気は hare（はれ）／hare-kumori（はれ ときどき くもり）／kumori（くもり）／
     kumori-ame（くもり 一時雨）／ame（あめ）の5つ。曜日は mon tue wed thu fri sat sun
   ========================================================= */
const LESSON = {
  title: 'はれ？ あめ？ よていづくり',

  /* 先生の設定: ステップ4（ちょうせん）の むずかしさ。'やさしく' ／ 'ふつう' ／ 'ちょうせん' のどれか
     （生徒の画面には出ません。中身は 下の ステップ4 の levels） */
  challengeLevel: 'ふつう',

  /* 週間天気予報（ワークシート 1枚目・2枚目） */
  weeks: {
    1: { mon: 'hare', tue: 'hare-kumori', wed: 'kumori',     thu: 'kumori-ame', fri: 'ame',         sat: 'hare-kumori', sun: 'hare' },
    2: { mon: 'hare', tue: 'hare-kumori', wed: 'kumori-ame', thu: 'kumori',     fri: 'hare-kumori', sat: 'ame',         sun: 'hare' }
  },

  /* 用事（絵は assets/ の中。where: soto＝そと ／ naka＝なか。no: ワークシートの番号＝ステップ4の数字キー） */
  tasks: {
    soccer:  { name: 'サッカー',          img: 'task-soccer.svg',  where: 'soto', no: 8 },
    ensoku:  { name: 'えんそく',          img: 'task-ensoku.svg',  where: 'soto', no: 2 },
    reading: { name: 'ほんを よむ',       img: 'task-reading.svg', where: 'naka', no: 6 },
    study:   { name: 'べんきょう',        img: 'task-study.svg',   where: 'naka', no: 4 },
    cafe:    { name: 'カフェで おしゃべり', img: 'task-cafe.svg',    where: 'naka', no: 3 },
    piano:   { name: 'ピアノ',            img: 'task-piano.svg',   where: 'naka', no: 1 },
    cinema:  { name: 'えいが',            img: 'task-cinema.svg',  where: 'naka', no: 7 }
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
          choices: [{ label: 'はれ', icon: 'hare' }, { label: 'あめ', icon: 'ame' }], answer: 1,
          praise: 'すごい！ かさは あめ の マークだね',
          hint: { drip: true },
          together: 'かさだから あめ だね' },
        { q: 'これは なんの てんき？', mark: 'kumori',
          choices: [{ label: 'はれ', icon: 'hare' }, { label: 'あめ', icon: 'ame' }, { label: 'くもり', icon: 'kumori' }], answer: 2,
          praise: 'そのとおり！ くもだけは くもり だね',
          hint: { float: true, pop: 'cloud' },
          together: 'くもだけだから くもり だね' },
        { q: 'おひさまと くもが いるよ。どんな てんき？', mark: 'hare-kumori',
          choices: [{ label: 'あめ', icon: 'ame' }, { label: 'はれ と くもり', icon: 'hare-kumori' }], answer: 1,
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
          reasons: [{ text: 'あめが ふるから', icon: 'weather-ame.svg' }, { text: 'あめが ふらないから', icon: 'weather-hare-kumori.svg', ok: true }],
          praise: 'すごい！ おひさまが いるから どようびで いいね',
          hint: { note: 'かさが ないね' }, togetherDay: 'かさが ないから どようび だね', togetherWhy: 'かさが ないから「あめが ふらないから」だね' },
        { week: 1, q: 'ピアノは なんようびに する？', task: 'piano',
          days: ['fri', 'wed', 'mon'], answer: 'any',
          reasons: [{ text: 'はれだから', icon: 'weather-hare.svg' }, { text: 'いえの なかで できるから', icon: 'badge-naka.svg', ok: true }],
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
          reasons: [{ text: 'はれだから', icon: 'weather-hare.svg' }, { text: 'たてものの なかだから', icon: 'badge-naka.svg', ok: true }],
          praise: 'すばらしい！ えいがかんは なかだから あめでも だいじょうぶ',
          afterNote: 'あめの ひに なかの ようじを すると、はれの ひを そとの ようじに つかえるね',
          hint: {}, togetherWhy: 'えいがかんは なかだから「たてものの なかだから」だね' }
      ],
      compare: {
        q: 'てんきが かわったよ。まえの しゅうと くらべよう',
        say: 'ひかって いる ようびの てんきが かわったよ'
      }
    },

    /* ---------------- ステップ4（ちょうせん） ----------------
       用事カードを えらぶ → ようびの マスを えらぶ、で 1まいずつ おく。ぜんぶ おいたら「たしかめる」。
       正解: そとの用事（サッカー・えんそく）は おひさまの ある日（hare・hare-kumori）だけ。なかの用事は どこでも */
    {
      kind: 'challenge',
      name: 'よていひょうを つくろう',
      progName: 'ちょうせん（ステップ4）',
      pickLabel: ['ステップ4', 'ちょうせん', 'よていひょう'],
      clearSub: '1しゅうかんの よていが たてられたね',
      clearSay: 'ちょうせんの シールも はれたね',
      /* むずかしさ（上の challengeLevel で えらぶ）。[ 問1で おく用事, 問2で おく用事 ] */
      levels: {
        'やさしく':   [['ensoku', 'soccer'], ['piano', 'ensoku', 'reading', 'soccer']],
        'ふつう':     [['piano', 'ensoku', 'reading', 'soccer'], ['piano', 'ensoku', 'cafe', 'study', 'reading', 'cinema', 'soccer']],
        'ちょうせん': [['piano', 'ensoku', 'cafe', 'study', 'reading', 'cinema', 'soccer'], ['piano', 'ensoku', 'cafe', 'study', 'reading', 'cinema', 'soccer']]
      },
      /* 左はしの「てじゅん」（2行ずつ） */
      tejun: [['かさの ひを', 'さがす'], ['かさの ひには', 'なかの ようじ'], ['そとの ようじを', 'はれの ひに'], ['のこりの ひに', 'のこりの ようじ']],
      /* ステップを えらぶ から ステップ4を はじめたときだけ 出す おさらい */
      review: {
        q: 'おさらい。この 3つを おぼえて いるかな？',
        say: 'かさの マークは あめ。2と 8は そと。のこりは なか だよ',
        ame: ['かさの マークは', 'あめ'], soto: ['2 と 8 は', 'そと'], naka: ['のこりは', 'なか']
      },
      model: {
        week: 1, tasks: ['piano', 'ensoku', 'reading', 'soccer'],
        q: 'おてほん。ようじを 1しゅうかんに いれるよ',
        kasa: 'まず かさの ひを さがすよ',
        moves: [
          { say: 'ほんを よむ（6）は なか。かさの ひでも できるね', task: 'reading', to: 'fri', tejun: 2 },
          { say: 'サッカー（8）は そと。おひさまの ひに しよう', task: 'soccer', to: 'sun', tejun: 3 },
          { say: 'うごかしたい ときは、もう いちど えらべば いいよ', from: 'sun', to: 'sat' }
        ],
        check: 'ぜんぶ おいたら「たしかめる」を おすよ'
      },
      /* {n} は おく用事の数。reasons は ぜんぶ せいかいの あとの「どうして？」（ok: true が正解。正解の位置は まぜてある）
         {task} は 用事の名前、{day} は 生徒が おいた曜日に かわる。kind: 'kasa' は かさの日に 入れた用事を聞く */
      questions: [
        { week: 1, q: 'ようじを 1しゅうかんに いれよう', kasaQ: 'かさの ひを さがそう',
          praise: 'よくできた！ かさの ひに なかの ようじ。はれの ひに そとの ようじ だね',
          reasons: [
            { task: 'soccer', q: 'どうして {task}を {day}に したの？',
              choices: [{ text: 'あめが ふるから', icon: 'weather-ame.svg' }, { text: 'はれだから', icon: 'weather-hare.svg', ok: true }],
              praise: 'そのとおり！ はれだから そとで できるね',
              note: 'かさが ないね', together: 'おひさまが いるから「はれだから」だね' }
          ] },
        { week: 2, compareBefore: true, q: 'てんきが かわったよ。{n}つの ようじを いれよう', kasaQ: 'かさの ひを さがそう',
          praise: 'すばらしい！ {n}つ ぜんぶ はいったね。てんきに あわせて よていが たてられたね',
          reasons: [
            { task: 'ensoku', q: 'どうして {task}を {day}に したの？',
              choices: [{ text: 'はれだから', icon: 'weather-hare.svg', ok: true }, { text: 'なかで できるから', icon: 'badge-naka.svg' }],
              praise: 'よくみたね！ えんそくは そと。はれの ひ だね',
              note: 'えんそくは そと', glowBadge: true, together: 'えんそくは そとだから「はれだから」だね' },
            { kind: 'kasa', q: 'かさの ひには どんな ようじを いれた？',
              choices: [{ text: 'そとの ようじ', icon: 'badge-soto.svg' }, { text: 'なかの ようじ', icon: 'badge-naka.svg', ok: true }],
              praise: 'すごい！ なかの ようじは あめの ひでも できるね',
              glowBadge: true, together: 'かさの ひには なかの ようじ だね' }
          ] }
      ],
      compare: {
        q: 'てんきが かわったよ。まえの しゅうと くらべよう',
        say: 'どようびは あめに なったよ。てんきが かわると、よていも かわるね'
      },
      /* 画面に出る ことば */
      words: {
        kasaFind: 'かさの マークが ある ひを 2つ おしてね',
        kasaMiss: 'もういちど みてみよう。かさの マークは あるかな？',
        kasaFound: 'みつけたね。かさの ふだを つけたよ',
        kasaTogether: 'いっしょに たしかめよう。かさの マークが ある ひ だね',
        kasaDone: 'かさの ひには なかの ようじ が いいね',
        place: 'ようじを えらんで、ようびの マスを おしてね',
        holding: 'どの ようびに する？ マスを おしてね',
        ready: 'ぜんぶ おけたね。「たしかめる」を おそう',
        pickFirst: 'さきに ようじを えらぼう',
        left: 'あと {n}こ おこう',
        redoKasa: 'かさの ひだね。そとで できるかな？ もういちど みてみよう',
        redoKumori: 'くもりの ひだね。くもだけ。おひさまが いないね。はれの ひを さがそう',
        sunHint: 'おひさまの ある ひを みてみよう',
        together: 'いっしょに たしかめよう。{task}は そと。はれの ひ だね',
        sotoPraise: 'あめが ふらない ひ だね',
        confirm: 'ぜんぶ もどす？'
      }
    }
  ],

  /* ふり返り（できたこと。クリアした ステップの分だけ 出ます。ステップ4は 3行） */
  result: [
    'てんきの マークが よめたね。はれ・くもり・あめ',
    'そとの ようじと なかの ようじを わけられたね',
    'そとの ようじは はれの ひに。なかの ようじは あめの ひでも できるね',
    ['1しゅうかんの よていひょうが できたね', 'かさの ひには なかの ようじを いれたね', 'てんきが かわると、よていも かわるね']
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
  const progStep = $('#prog-step'), progQ = $('#prog-q'), progDots = $('#progress-dots'), progPlaced = $('#prog-placed');
  const btnSound = $('#btn-sound'), btnMotion = $('#btn-motion'), btnRest = $('#btn-rest'), btnBack = $('#btn-back');
  const screens = { title: $('#screen-title'), play: $('#screen-play'), clear: $('#screen-clear'), result: $('#screen-result') };
  const titlePage = $('#title-page'), stepPicker = $('#step-picker');
  const board = $('#board'), qText = $('#q-text'), btnRead = $('#btn-read'), visual = $('#visual');
  const list = $('#choice-list'), btnNext = $('#btn-next'), btnCheck = $('#btn-check');
  const feedback = $('#feedback'), fbImg = $('#feedback img'), fbWord = $('#feedback .feedback-word');
  const speech = $('#speech'), guide = $('#guide');
  const restOverlay = $('#rest-overlay');

  /* ---- ページの並び ---- */
  const pages = [];
  LESSON.steps.forEach((st, si) => {
    if (st.review) pages.push({ type: 'review', si });
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

  const state = { page: -1, started: false, clearPending: false, timers: [], token: 0, cleared: new Set(), plan: { 1: {}, 2: {} },
    plan4: { 1: {}, 2: {} }, s4: {}, onNext: null, reviewNeeded: false };
  function later(fn, ms) {
    const tok = state.token;
    const t = setTimeout(() => { state.timers = state.timers.filter(x => x !== t); if (tok === state.token) fn(); }, ms);
    state.timers.push(t); return t;
  }
  function clearTimers() { state.timers.forEach(clearTimeout); state.timers = []; state.token++; state.clearPending = false; }

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
  let restReturnFocus = null, restRerender = false;
  function openRest() {
    S('play', 'tap'); stopReading();
    restReturnFocus = document.activeElement;
    // 休むあいだは 後ろで 進めない（タイマーを止め、もどったら その ページを はじめから 出しなおす）
    restRerender = state.page >= 0 && (state.timers.length > 0 || state.clearPending);
    if (restRerender) clearTimers();
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
    if (restRerender) { restRerender = false; go(state.page, true); return; }
    // 「ひとやすみ」ボタンには もどさない（Enter で また ひらかないように）
    const act = $('.screen.is-active');
    const nb = act && $$('#btn-next, #btn-clear-next', act).find(b => !b.hidden && b.offsetParent);
    if (restReturnFocus && restReturnFocus !== btnRest && document.contains(restReturnFocus) && !restReturnFocus.disabled && restReturnFocus.offsetParent) focusQuiet(restReturnFocus);
    else if (nb) focusQuiet(nb);
    else if (state.page >= 0 && act === screens.play) focusQuiet(qText);
    else focusQuiet($('#btn-start'));
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
    progStep.textContent = st.progName || ('ステップ ' + (si + 1) + ' ／ ' + LESSON.steps.length);
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
    const lay = wide === true ? 'wide' : wide;
    if (lay) board.dataset.layout = lay; else delete board.dataset.layout;
    visual.innerHTML = ''; list.innerHTML = ''; list.className = 'choice-list'; list.style.flex = '';
    visual.inert = false; list.inert = false;
    btnNext.hidden = true;
    btnCheck.hidden = true; btnCheck.inert = false; btnCheck.className = 'btn-primary s4-check is-waiting';
    progPlaced.hidden = true;
    state.onNext = null; S4 = null;
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
        // 押したボタンが押せなくなったら、のこった正解の候補（光っている物）か 問題文へ
        const ae = document.activeElement;
        if (!ae || ae === document.body || ae.disabled) {
          const g = ctx.correct.find(b => b.classList.contains('is-guide') && !b.disabled);
          focusQuiet(g || qText);
        }
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
    if (!list.classList.contains('choice-list--week')) reserveNext();
    ctx.all.forEach(b => b.addEventListener('click', () => {
      if (b.disabled || done) return;
      S('play', 'tap');
      if (ctx.correct.indexOf(b) >= 0) correct(b, false); else wrong(b);
    }));
  }
  // 選択肢が つぎへ の横に おさまる幅なら、はじめから その幅で ならべる（答えたあとも 位置が ずれない）
  function reserveNext() {
    const bs = $$('button', list); if (!bs.length) return;
    const scale = (document.getElementById('app').getBoundingClientRect().width / 1920) || 1;
    const used = bs.reduce((w, b) => w + b.getBoundingClientRect().width / scale, 0) + 48 * (bs.length - 1);
    list.style.flex = used <= 1300 - 300 - 48 ? '0 0 ' + (1300 - 300 - 48) + 'px' : '';
  }
  function afterCorrect(btn, praise) {
    // のこりの選択肢を消す。つぎへ（300px）と重ならない幅なら、場所を空けたまま消して 位置を保つ
    const others = $$('button', list).filter(b => b !== btn);
    const scale = (document.getElementById('app').getBoundingClientRect().width / 1920) || 1;
    const all = [btn].concat(others);
    const used = all.reduce((w, b) => w + b.getBoundingClientRect().width / scale, 0) + 48 * (all.length - 1);
    const keepPlace = used <= 1300 - 300 - 48;
    others.forEach(b => {
      if (keepPlace) { b.style.visibility = 'hidden'; b.disabled = true; b.setAttribute('aria-hidden', 'true'); b.tabIndex = -1; }
      else b.hidden = true;
    });
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
    reserveNext();
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
     ステップ4: 1しゅうかんの よていひょう（ちょうせん）
     ・2クリックで おく（カード → マス）。ドラッグは使わない
     ・置いた結果は state.s4[問] に のこす（ひとやすみ の あとも そのまま）
     ========================================================= */
  let S4 = null;   // いま 画面に出ている ステップ4の表 { P, D, model, focusTo }
  const hasSun = w => w === 'hare' || w === 'hare-kumori';
  const okPlace = (task, w) => LESSON.tasks[task].where === 'naka' || hasSun(w);
  const byNo = (a, b) => LESSON.tasks[a].no - LESSON.tasks[b].no;
  const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (m, k) => (o && o[k] !== undefined ? o[k] : m));
  const appScale = () => (document.getElementById('app').getBoundingClientRect().width / 1920) || 1;
  function s4Words(si) { return LESSON.steps[si].words; }
  function s4LevelTasks(si, qi) {
    const st = LESSON.steps[si];
    const lv = st.levels[LESSON.challengeLevel] || st.levels['ふつう'];
    return lv[qi].filter((t, i, a) => LESSON.tasks[t] && a.indexOf(t) === i).slice(0, 7).sort(byNo);
  }
  // 新しい音（place・stamp）が 無くても 止まらない
  function sfx(name, fallback) {
    try { window.Sound.play(name); }
    catch (e) { if (fallback) S('play', fallback); }
  }
  function kumoriOrKasa(w) { return WEATHER[w].umbrella ? 'kasa' : 'kumori'; }

  function buildS4Chip(task) {
    const t = LESSON.tasks[task];
    const c = el('span', { class: 's4-chip', 'data-task': task });
    c.appendChild(img(t.img, '', 's4-chip-pic'));
    c.appendChild(el('span', { class: 's4-num', 'aria-hidden': 'true' }, String(t.no)));
    c.appendChild(img('badge-' + t.where + '.svg', '', 's4-where'));
    return c;
  }
  function buildS4Fc(dayKey, w, asButton, kasa) {
    const i = DAYS.findIndex(d => d.key === dayKey), d = DAYS[i];
    const c = el(asButton ? 'button' : 'div', { class: 'day-cell s4-fc' + (kasa ? ' has-kasa' : ''), 'data-weather': w, 'data-day': dayKey, type: asButton ? 'button' : null });
    c.appendChild(el('span', { class: 'key-num', 'aria-hidden': 'true' }, String(i + 1)));
    c.appendChild(el('span', { class: 'day-name', 'aria-hidden': 'true' }, '<ruby>' + d.kanji + '<rt>' + d.yomi + '</rt></ruby>'));
    const m = buildWmark(w); m.classList.add('wmark--s4'); m.setAttribute('aria-hidden', 'true'); m.removeAttribute('role');
    c.appendChild(m);
    const dw = el('span', { class: 'day-weather', 'aria-hidden': 'true' });
    WEATHER[w].lines.forEach(t => dw.appendChild(el('span', null, esc(t))));
    c.appendChild(dw);
    if (kasa) c.appendChild(img('kasa-tag.svg', '', 's4-kasa-tag'));
    c.appendChild(el('span', { class: 'sr-only' }, esc(d.read + '、' + WEATHER[w].read + (kasa ? '、かさの ひ' : ''))));
    return c;
  }
  function newS4(si, qi) {
    const q = LESSON.steps[si].questions[qi];
    return { si, qi, week: q.week, w: LESSON.weeks[q.week], tasks: s4LevelTasks(si, qi),
      place: {}, held: null, phase: 'kasa', kasaFound: [], kasaMiss: 0,
      misses: {}, marks: {}, hint: null, speech: '', reasonIdx: 0 };
  }
  const placedCount = P => Object.keys(P.place).length;
  const dayOfTask = (P, t) => Object.keys(P.place).find(d => P.place[d] === t);

  /* ---- 表を つくる（てじゅん・週の表・はこ・道具ボタン） ---- */
  function s4Build(P, model) {
    const st = LESSON.steps[P.si];
    const D = { fc: {}, slot: {}, card: {}, ghost: {} };
    const rail = el('aside', { class: 's4-rail', 'aria-labelledby': 's4-tejun-head' });
    rail.appendChild(el('h3', { class: 's4-tejun-head', id: 's4-tejun-head' }, 'てじゅん'));
    const ol = el('ol', { class: 's4-tejun' });
    st.tejun.forEach((t, i) => {
      const li = el('li', { class: 's4-tejun-item' });
      li.appendChild(el('span', { class: 's4-tejun-no', 'aria-hidden': 'true' }, String(i + 1)));
      li.appendChild(img('tejun-' + (i + 1) + '.svg', '', 's4-tejun-icon'));
      li.appendChild(el('span', { class: 'label' }, t.map(x => '<span>' + ruby(x) + '</span>').join('')));
      ol.appendChild(li);
    });
    rail.appendChild(ol);
    D.tejun = $$('.s4-tejun-item', ol);
    visual.appendChild(rail);

    D.week = el('div', { class: 's4-week', id: 's4-week' });
    DAYS.forEach(d => {
      const col = el('div', { class: 's4-day', 'data-day': d.key });
      const fc = buildS4Fc(d.key, P.w[d.key], false, P.kasaFound.indexOf(d.key) >= 0);
      D.fc[d.key] = fc; col.appendChild(fc);
      const slot = el('button', { class: 's4-slot', type: 'button', 'data-day': d.key });
      slot.addEventListener('click', e => s4SlotClick(d.key, e.detail === 0));
      D.slot[d.key] = slot; col.appendChild(slot);
      D.week.appendChild(col);
    });
    visual.appendChild(D.week);

    D.tray = el('div', { class: 's4-tray', id: 's4-tray', role: 'group', 'aria-label': 'ようじの はこ' });
    const lab = el('div', { class: 's4-tray-label', 'aria-hidden': 'true' });
    lab.appendChild(img('icon-box.svg', '')); lab.appendChild(document.createTextNode('はこ'));
    D.tray.appendChild(lab);
    P.tasks.forEach(tk => {
      const t = LESSON.tasks[tk];
      const b = el('button', { class: 's4-card', type: 'button', 'data-task': tk, 'aria-pressed': 'false' });
      b.appendChild(el('span', { class: 's4-num', 'aria-hidden': 'true' }, String(t.no)));
      b.appendChild(img('badge-' + t.where + '.svg', '', 's4-where'));
      b.appendChild(img(t.img, '', 's4-card-pic'));
      b.appendChild(el('span', { class: 'label' }, ruby(t.name)));
      b.appendChild(el('span', { class: 'sr-only' }, t.no + 'ばん、' + (t.where === 'soto' ? 'そとの' : 'なかの') + ' ようじ'));
      b.addEventListener('click', e => s4CardClick(tk, e.detail === 0));
      const g = el('div', { class: 's4-card-ghost', 'aria-hidden': 'true', hidden: true });
      g.appendChild(el('span', { class: 's4-num' }, String(t.no)));
      D.card[tk] = b; D.ghost[tk] = g;
      D.tray.appendChild(b); D.tray.appendChild(g);
    });
    visual.appendChild(D.tray);

    list.className = 'choice-list choice-list--s4tools';
    D.ret = el('button', { id: 'btn-s4-return', class: 'btn-secondary s4-tool', type: 'button', disabled: true });
    D.ret.appendChild(img('icon-return.svg', '')); D.ret.appendChild(el('span', { class: 'label' }, 'はこに もどす'));
    D.clr = el('button', { id: 'btn-s4-clear', class: 'btn-secondary s4-tool', type: 'button' });
    D.clr.appendChild(img('icon-return-all.svg', '')); D.clr.appendChild(el('span', { class: 'label' }, 'ぜんぶ もどす'));
    D.confirm = el('div', { class: 's4-confirm', id: 's4-confirm', role: 'group', 'aria-labelledby': 's4-confirm-q', hidden: true });
    D.confirm.appendChild(el('p', { class: 's4-confirm-q', id: 's4-confirm-q' }, ruby(st.words.confirm)));
    D.yes = el('button', { id: 'btn-s4-yes', class: 'btn-secondary', type: 'button' }, 'はい');
    D.no = el('button', { id: 'btn-s4-no', class: 'btn-primary', type: 'button' }, 'いいえ');
    D.confirm.appendChild(D.yes); D.confirm.appendChild(D.no);
    [D.ret, D.clr, D.confirm].forEach(x => list.appendChild(x));
    D.ret.addEventListener('click', s4Return);
    D.clr.addEventListener('click', s4AskClear);
    D.yes.addEventListener('click', () => s4CloseConfirm(true));
    D.no.addEventListener('click', () => s4CloseConfirm(false));

    btnCheck.hidden = false;
    progPlaced.hidden = false;
    S4 = { P, D, model: !!model, focusTo: null };
    s4Refresh();
    return D;
  }

  /* ---- 表を P（または view）に あわせる ---- */
  function s4Refresh(view) {
    if (!S4) return;
    const P = S4.P, D = S4.D;
    const place = (view && view.place) || P.place, marks = (view && view.marks) || P.marks;
    const inSlot = {};
    DAYS.forEach(d => {
      const slot = D.slot[d.key], tk = place[d.key], w = P.w[d.key];
      if (tk) inSlot[tk] = d.key;
      $$('.s4-chip, .sr-only', slot).forEach(x => x.remove());
      if (tk) slot.appendChild(buildS4Chip(tk));
      const sel = P.held && P.held.kind === 'slot' && P.held.day === d.key;
      slot.classList.toggle('is-filled', !!tk);
      slot.classList.toggle('is-selected', !!sel);
      slot.classList.toggle('is-ok', marks[d.key] === 'ok');
      slot.classList.toggle('is-redo', marks[d.key] === 'redo');
      slot.setAttribute('aria-pressed', sel ? 'true' : 'false');
      slot.appendChild(el('span', { class: 'sr-only' }, esc(d.read + '、' + WEATHER[w].read + '、' + (tk ? LESSON.tasks[tk].name : 'あいている') +
        (marks[d.key] === 'ok' ? '、できた' : marks[d.key] === 'redo' ? '、もういちど みてみよう' : ''))));
    });
    P.tasks.forEach(tk => {
      const out = !!inSlot[tk];
      const c = D.card[tk];
      c.hidden = out; D.ghost[tk].hidden = !out;
      const sel = P.held && P.held.kind === 'card' && P.held.task === tk;
      c.classList.toggle('is-selected', !!sel);
      c.setAttribute('aria-pressed', sel ? 'true' : 'false');
    });
    D.week.classList.toggle('is-holding', !!P.held);
    D.week.classList.toggle('is-kasa', P.phase === 'kasa');
    const n = Object.keys(place).length, left = P.tasks.length - n;
    progPlaced.textContent = 'おいた ようじ ' + n + ' ／ ' + P.tasks.length;
    btnCheck.classList.toggle('is-waiting', left > 0);
    $('#btn-check-left').textContent = left > 0 ? 'あと ' + left + 'こ' : '';
    $('#btn-check-left').hidden = left <= 0;
    btnCheck.setAttribute('aria-label', left > 0 ? 'たしかめる。あと ' + left + 'こ' : 'たしかめる');
    D.ret.disabled = !(P.held && P.held.kind === 'slot');
    D.clr.disabled = n === 0;
    // かさの日さがしの間は、マス・はこ・道具は さわれない
    const lock = S4.model || P.phase === 'kasa';
    D.tray.inert = lock; list.inert = lock; btnCheck.inert = lock;
    DAYS.forEach(d => { D.slot[d.key].inert = lock; });
  }
  // フォーカスが 消えたら、つぎに さわる物へ
  function s4EnsureFocus(prefer) {
    if (!S4) return;
    const ae = document.activeElement;
    if (!prefer && ae && ae !== document.body && document.contains(ae) && !ae.disabled && !ae.hidden && ae.offsetParent) return;
    const D = S4.D, P = S4.P;
    const card = P.tasks.map(t => D.card[t]).find(c => !c.hidden);
    focusQuiet(prefer || card || btnCheck);
  }
  // うごいた カードを ゆっくり 目で おえるように（FLIP）
  function s4Rects() {
    const r = {}, D = S4.D;
    Object.keys(D.card).forEach(t => { if (!D.card[t].hidden) r[t] = D.card[t].getBoundingClientRect(); });
    $$('.s4-chip', D.week).forEach(ch => { r[ch.dataset.task] = ch.getBoundingClientRect(); });
    return r;
  }
  function s4Fly(before, ms, only) {
    if (!S4 || settings.reduce || !before) return;
    const D = S4.D, s = appScale();
    Object.keys(before).forEach(t => {
      if (only && only.indexOf(t) < 0) return;
      const target = $('.s4-chip[data-task="' + t + '"]', D.week) || (D.card[t] && !D.card[t].hidden ? D.card[t] : null);
      if (!target) return;
      const a = before[t], b = target.getBoundingClientRect();
      const dx = ((a.left + a.width / 2) - (b.left + b.width / 2)) / s, dy = ((a.top + a.height / 2) - (b.top + b.height / 2)) / s;
      if (Math.abs(dx) + Math.abs(dy) < 2) return;
      target.style.transition = 'none';
      target.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      target.style.zIndex = '6';
      void target.offsetWidth;
      requestAnimationFrame(() => {
        target.style.transition = 'transform ' + ms + 'ms ease-in-out';
        target.style.transform = '';
        const end = () => { target.style.transition = ''; target.style.zIndex = ''; target.removeEventListener('transitionend', end); };
        target.addEventListener('transitionend', end);
        setTimeout(end, ms + 100);
      });
    });
  }
  function s4ClearHints() {
    if (!S4) return;
    const D = S4.D;
    DAYS.forEach(d => {
      D.fc[d.key].classList.remove('is-look', 'is-sun-hint', 'is-retry', 'is-guide');
      D.slot[d.key].classList.remove('is-guide');
    });
    $$('.wmark-part', D.week).forEach(p => p.classList.remove('is-glow'));
    Object.keys(D.card).forEach(t => D.card[t].classList.remove('is-guide', 'is-nudge'));
  }
  function s4ApplyHint(h) {
    if (!S4 || !h) return;
    const D = S4.D, P = S4.P;
    (h.look || []).forEach(d => D.fc[d].classList.add('is-look'));
    if (h.sun) DAYS.forEach(d => {
      if (!hasSun(P.w[d.key])) return;
      D.fc[d.key].classList.add('is-sun-hint');
      $$('.wmark-part--sun', D.fc[d.key]).forEach(p => p.classList.add('is-glow'));
    });
  }
  function s4Nudge(tasks) {
    const D = S4.D;
    tasks.forEach(t => { const c = D.card[t]; c.classList.remove('is-nudge'); void c.offsetWidth; c.classList.add('is-nudge'); });
    later(() => tasks.forEach(t => D.card[t] && D.card[t].classList.remove('is-nudge')), 2500);
  }

  /* ---- おく・入れかえ・もどす ---- */
  function s4Ready() { return S4 && !S4.model && S4.P.phase === 'place'; }
  function s4CardClick(tk, byKey) {
    if (!s4Ready()) return;
    const P = S4.P, W = s4Words(P.si);
    s4CloseConfirm(false, true);
    if (dayOfTask(P, tk)) return;
    S('play', 'tap');
    if (P.held && P.held.kind === 'card' && P.held.task === tk) { P.held = null; setSpeech(W.place); s4Refresh(); return; }
    P.held = { kind: 'card', task: tk };
    setSpeech(W.holding);
    s4Refresh();
    if (byKey) {   // キーボードでは、つぎに おす マス（空いた いちばん はじめ）へ
      const d = DAYS.find(x => !P.place[x.key]) || DAYS[0];
      focusQuiet(S4.D.slot[d.key]);
    }
  }
  function s4SlotClick(day, byKey) {
    if (!s4Ready()) return;
    const P = S4.P, D = S4.D, W = s4Words(P.si);
    s4CloseConfirm(false, true);
    const here = P.place[day];
    if (!P.held) {
      if (!here) {   // 先に マスを えらんだ（まちがい あつかいにしない）
        setSpeech(W.pickFirst);
        s4Nudge(P.tasks.filter(t => !dayOfTask(P, t)));
        return;
      }
      S('play', 'tap');
      P.held = { kind: 'slot', day };
      setSpeech(W.holding);
      s4Refresh();
      return;
    }
    const before = s4Rects();
    let moved = [];
    if (P.held.kind === 'card') {
      const tk = P.held.task;
      P.place[day] = tk; moved.push(tk);
      if (here) moved.push(here);       // もとの カードは はこへ
      delete P.marks[day];
    } else {
      const from = P.held.day;
      if (from === day) { S('play', 'tap'); P.held = null; setSpeech(W.place); s4Refresh(); return; }
      const tk = P.place[from];
      if (here) P.place[from] = here; else delete P.place[from];
      P.place[day] = tk;
      moved.push(tk); if (here) moved.push(here);
      delete P.marks[day]; delete P.marks[from];
    }
    P.held = null;
    sfx('place', 'tap');
    hideFeedback();
    setSpeech(placedCount(P) === P.tasks.length ? W.ready : W.place);
    s4Refresh();
    s4Fly(before, moved.length > 1 ? 1200 : 450, moved);
    if (byKey) {
      const next = P.tasks.map(t => D.card[t]).find(c => !c.hidden);
      focusQuiet(next || btnCheck);
    } else s4EnsureFocus();
  }
  function s4Return() {
    if (!s4Ready()) return;
    const P = S4.P;
    if (!P.held || P.held.kind !== 'slot') return;
    const day = P.held.day, tk = P.place[day];
    const before = s4Rects();
    delete P.place[day]; delete P.marks[day];
    P.held = null;
    S('play', 'tap');
    setSpeech(s4Words(P.si).place);
    s4Refresh();
    s4Fly(before, 450, [tk]);
    focusQuiet(S4.D.card[tk]);
  }
  function s4AskClear() {
    if (!s4Ready() || !placedCount(S4.P)) return;
    const D = S4.D;
    S('play', 'tap');
    D.ret.hidden = true; D.clr.hidden = true; D.confirm.hidden = false;
    focusQuiet(D.no);   // 消えない方に フォーカス
  }
  function s4CloseConfirm(yes, quiet) {
    if (!S4) return;
    const D = S4.D, P = S4.P;
    if (D.confirm.hidden) return;
    D.confirm.hidden = true; D.ret.hidden = false; D.clr.hidden = false;
    if (quiet) return;
    S('play', 'tap');
    if (yes) {
      P.place = {}; P.marks = {}; P.held = null; P.hint = null;
      s4ClearHints();
      hideFeedback();
      setSpeech(s4Words(P.si).place);
      s4Refresh();
      s4EnsureFocus(P.tasks.map(t => D.card[t])[0]);
    } else focusQuiet(D.clr.disabled ? (P.tasks.map(t => D.card[t]).find(c => !c.hidden) || btnCheck) : D.clr);
  }
  function s4Escape() {
    if (!S4) return false;
    const P = S4.P;
    if (!S4.D.confirm.hidden) { s4CloseConfirm(false); return true; }
    if (P.held) {
      const back = P.held.kind === 'card' ? S4.D.card[P.held.task] : S4.D.slot[P.held.day];
      P.held = null; S('play', 'tap'); setSpeech(s4Words(P.si).place); s4Refresh(); focusQuiet(back); return true;
    }
    return false;
  }
  function s4Key(n) {
    if (!S4 || S4.model) return;
    const P = S4.P, D = S4.D;
    if (!D.confirm.hidden) return;
    if (P.phase === 'kasa') { if (n <= 7) { const b = D.fc[DAYS[n - 1].key]; if (b.tagName === 'BUTTON') { focusQuiet(b); b.click(); } } return; }
    if (P.phase !== 'place') return;
    if (P.held) { if (n <= 7) s4SlotClick(DAYS[n - 1].key, true); return; }
    const tk = P.tasks.find(t => LESSON.tasks[t].no === n);
    if (tk && !dayOfTask(P, tk)) { focusQuiet(D.card[tk]); s4CardClick(tk, true); }
  }

  /* ---- かさの ひを さがそう ---- */
  function s4KasaDays(P) { return DAYS.map(d => d.key).filter(k => WEATHER[P.w[k]].umbrella); }
  function s4StartKasa(P) {
    const D = S4.D, W = s4Words(P.si), q = LESSON.steps[P.si].questions[P.qi];
    setQuestion(q.kasaQ, W.kasaFind);
    setSpeech(W.kasaFind);
    D.tejun[0].classList.add('is-now');
    DAYS.forEach(d => {
      const old = D.fc[d.key];
      const b = buildS4Fc(d.key, P.w[d.key], true, P.kasaFound.indexOf(d.key) >= 0);
      b.addEventListener('click', e => s4KasaClick(d.key, e.detail === 0));
      old.replaceWith(b); D.fc[d.key] = b;
    });
    s4Refresh();
    S4.focusTo = D.fc[DAYS[0].key];
  }
  function s4MarkKasa(day) {
    const fc = S4.D.fc[day];
    fc.classList.remove('is-retry', 'is-look', 'is-guide');
    fc.classList.add('has-kasa');
    if (!$('.s4-kasa-tag', fc)) fc.insertBefore(img('kasa-tag.svg', '', 's4-kasa-tag'), $('.sr-only', fc));
    $('.sr-only', fc).textContent = dayOf(day).read + '、' + WEATHER[S4.P.w[day]].read + '、かさの ひ';
  }
  function s4KasaClick(day, byKey) {
    if (!S4 || S4.model || S4.P.phase !== 'kasa' || S4.busyKasa) return;
    const P = S4.P, D = S4.D, W = s4Words(P.si);
    const kasa = s4KasaDays(P);
    if (P.kasaFound.indexOf(day) >= 0) { S('play', 'tap'); return; }
    if (kasa.indexOf(day) >= 0) {
      P.kasaFound.push(day);
      s4MarkKasa(day);
      S('play', 'correct');
      const [x, y] = centerOf(D.fc[day]); M('celebrate', x, y, { small: true });
      showFeedback('good', 'みつけたね');
      setSpeech(W.kasaFound);
      if (kasa.every(k => P.kasaFound.indexOf(k) >= 0)) { S4.busyKasa = true; later(() => s4EnterPlace(P, true), 1600); }
      return;
    }
    P.kasaMiss++;
    S('play', 'retry'); M('encourage');
    const fc = D.fc[day];
    fc.classList.add('is-retry');
    showFeedback('retry', 'もういちど みてみよう');
    const rest = kasa.filter(k => P.kasaFound.indexOf(k) < 0);
    if (P.kasaMiss === 1) { setSpeech(W.kasaMiss); fc.classList.add('is-look'); }
    else if (P.kasaMiss === 2) { setSpeech(W.kasaMiss); DAYS.forEach(d => D.fc[d.key].classList.remove('is-look')); rest.forEach(k => D.fc[k].classList.add('is-guide')); if (byKey) focusQuiet(D.fc[rest[0]]); }
    else {
      S4.busyKasa = true;
      rest.forEach(k => D.fc[k].classList.add('is-guide'));
      showFeedback('info', 'いっしょに たしかめよう');
      setSpeech(W.kasaTogether);
      if (settings.sound) say(W.kasaTogether);
      focusQuiet(D.fc[rest[0]]);
      later(() => {
        rest.forEach(k => { P.kasaFound.push(k); s4MarkKasa(k); });
        S('play', 'correct');
        later(() => s4EnterPlace(P, true), 1400);
      }, 2600);
    }
  }
  function s4EnterPlace(P, fromKasa) {
    const D = S4.D, W = s4Words(P.si), q = LESSON.steps[P.si].questions[P.qi];
    S4.busyKasa = false;
    P.phase = P.phase === 'kasa' ? 'place' : P.phase;
    DAYS.forEach(d => {   // 予報を div に もどす（かさの札は のこす）
      const old = D.fc[d.key];
      if (old.tagName !== 'BUTTON') return;
      const div = buildS4Fc(d.key, P.w[d.key], false, P.kasaFound.indexOf(d.key) >= 0);
      old.replaceWith(div); D.fc[d.key] = div;
    });
    D.tejun.forEach(t => t.classList.remove('is-now'));
    setQuestion(fill(q.q, { n: P.tasks.length }), W.place);
    if (fromKasa) { hideFeedback(); setSpeech(W.kasaDone); }
    s4Refresh();
    if (fromKasa) s4EnsureFocus(P.tasks.map(t => D.card[t]).find(c => !c.hidden));
  }

  /* ---- たしかめる ---- */
  function s4Check(byKey) {
    if (!s4Ready()) return;
    const P = S4.P, D = S4.D, W = s4Words(P.si);
    s4CloseConfirm(false, true);
    const left = P.tasks.length - placedCount(P);
    if (left > 0) {   // まだ ぜんぶ おいていない（まちがい あつかいにしない）
      S('play', 'tap');
      setSpeech(fill(W.left, { n: left }));
      s4Nudge(P.tasks.filter(t => !dayOfTask(P, t)));
      return;
    }
    S('play', 'tap');
    P.held = null;
    s4ClearHints();
    const pre = Object.assign({}, P.place), preMarks = Object.assign({}, P.marks);
    const filled = DAYS.map(d => d.key).filter(k => pre[k]);
    const okDays = filled.filter(k => okPlace(pre[k], P.w[k]));
    const redo = filled.filter(k => okDays.indexOf(k) < 0).map(k => {
      const tk = pre[k]; P.misses[tk] = (P.misses[tk] || 0) + 1;
      return { day: k, task: tk, n: P.misses[tk] };
    });
    // 3回目の カードは、おひさまの ある日の いちばん早い日へ（なかの用事が あれば 入れかえ）
    const autos = [];
    redo.filter(r => r.n >= 3).forEach(r => {
      const to = DAYS.map(d => d.key).find(k => hasSun(P.w[k]) && !(P.place[k] && LESSON.tasks[P.place[k]].where === 'soto'));
      if (!to) return;
      const other = P.place[to];
      P.place[to] = r.task;
      if (other) P.place[r.day] = other; else delete P.place[r.day];
      autos.push({ from: r.day, to, task: r.task });
    });
    const normal = redo.filter(r => !autos.some(a => a.task === r.task));
    P.marks = {};
    Object.keys(P.place).forEach(k => { P.marks[k] = okPlace(P.place[k], P.w[k]) ? 'ok' : 'redo'; });
    P.hint = { look: normal.filter(r => r.n === 1).map(r => r.day), sun: normal.some(r => r.n === 2) };
    const first = normal[0];
    let text = '';
    if (autos.length) text = fill(W.together, { task: LESSON.tasks[autos[0].task].name });
    else if (normal.some(r => r.n >= 2)) text = W.sunHint;
    else if (first) text = kumoriOrKasa(P.w[first.day]) === 'kasa' ? W.redoKasa : W.redoKumori;
    P.speech = text;
    P.after = Object.keys(P.marks).every(k => P.marks[k] === 'ok') ? 'good' : 'place';
    P.phase = 'busy';
    s4Refresh({ place: pre, marks: preMarks });   // （たしかめる は inert にしない。フォーカスが 消えないように）

    // 1) できた マスから 1つずつ スタンプ（すくなめ では いっせい）
    const newOk = okDays.filter(k => preMarks[k] !== 'ok');
    const shown = Object.assign({}, preMarks);
    const step = settings.reduce ? 0 : 500;
    if (settings.reduce) { newOk.forEach(k => { shown[k] = 'ok'; }); if (newOk.length) sfx('stamp'); s4Refresh({ place: pre, marks: shown }); }
    else newOk.forEach((k, i) => later(() => { shown[k] = 'ok'; sfx('stamp'); s4Refresh({ place: pre, marks: shown }); }, 300 + i * step));
    const t1 = settings.reduce ? 300 : 300 + newOk.length * step + 200;
    // 2) おきなおす マスだけ しらせる
    later(() => {
      if (!redo.length) { s4Finish(false); return; }
      redo.forEach(r => { shown[r.day] = 'redo'; });
      s4Refresh({ place: pre, marks: shown });
      S('play', 'retry'); M('encourage');
      showFeedback('retry', 'もういちど みてみよう');
      if (!autos.length) { s4Finish(byKey); return; }
      // 3) 3回目: いっしょに たしかめる（ゆっくり 動かす）
      setSpeech(text);
      if (settings.sound) say(text);
      later(() => {
        const before = s4Rects();
        const view = Object.assign({}, shown);
        autos.forEach(a => { delete view[a.from]; delete view[a.to]; });
        s4Refresh({ place: P.place, marks: view });
        autos.forEach(a => D.slot[a.to].classList.add('is-guide'));
        s4Fly(before, 1200);
        later(() => s4Finish(byKey), settings.reduce ? 900 : 1700);
      }, 1600);
    }, t1);
  }
  // たしかめた 結果を 出す（ひとやすみ の あとも ここから 同じ形に もどる）
  function s4Finish(byKey, quiet) {
    if (!S4) return;
    const P = S4.P, D = S4.D;
    P.phase = P.after || 'place';
    DAYS.forEach(d => D.slot[d.key].classList.remove('is-guide'));
    s4Refresh();
    if (P.phase === 'good') { s4AllGood(quiet); return; }
    s4ApplyHint(P.hint);
    if (quiet) showFeedback('retry', 'もういちど みてみよう');
    setSpeech(P.speech);
    const r = DAYS.map(d => d.key).find(k => P.marks[k] === 'redo');
    if (r) { if (quiet) S4.focusTo = D.slot[r]; else focusQuiet(D.slot[r]); }
  }
  function s4AllGood(quiet) {
    const P = S4.P, D = S4.D, q = LESSON.steps[P.si].questions[P.qi], W = s4Words(P.si);
    P.phase = 'good';
    s4ClearHints();
    btnCheck.hidden = true;
    state.plan4[P.week] = Object.assign({}, P.place);
    showFeedback('good', 'せいかい！');
    const praise = fill(q.praise, { n: P.tasks.length });
    const soto = DAYS.filter(d => P.place[d.key] && LESSON.tasks[P.place[d.key]].where === 'soto')
      .map(d => LESSON.tasks[P.place[d.key]].name + 'は ' + d.read).join('、');
    const sotoText = soto ? soto + '。' + W.sotoPraise : '';
    if (!quiet) {
      S('play', 'correct');
      const [x, y] = centerOf(D.week); M('celebrate', x, y);
      setSpeech(praise);
      if (sotoText) later(() => setSpeech(sotoText), 2800);
    } else setSpeech(sotoText || praise);
    state.onNext = () => s4Reason(P, 0);
    if (quiet) { btnNext.hidden = false; S4.focusTo = btnNext; } else showNext(1200);
  }

  /* ---- どうして？（ぜんぶ せいかいの あと） ---- */
  function s4ReasonList(P) {
    const q = LESSON.steps[P.si].questions[P.qi];
    return (q.reasons || []).filter(r => r.kind === 'kasa'
      ? s4KasaDays(P).some(k => P.place[k]) : !!dayOfTask(P, r.task));
  }
  function s4Reason(P, idx) {
    const rs = s4ReasonList(P);
    if (idx >= rs.length) { go(state.page + 1); return; }
    const r = rs[idx];
    P.phase = 'reason'; P.reasonIdx = idx;
    resetPlay('quiz');
    let badges = [];
    if (r.kind === 'kasa') {
      setQuestion(r.q);
      const wrap = el('div', { class: 's4-reason-days' });
      s4KasaDays(P).filter(k => P.place[k]).forEach(k => {
        const tk = P.place[k];
        const cell = buildDayCell(k, P.w[k], { chip: tk, cls: 'is-picked' });
        const b = img('badge-' + LESSON.tasks[tk].where + '.svg', '', 's4-reason-badge');
        $('.day-slot', cell).appendChild(b); badges.push(b);
        wrap.appendChild(cell);
      });
      visual.appendChild(wrap);
    } else {
      const day = dayOfTask(P, r.task);
      setQuestion(fill(r.q, { task: LESSON.tasks[r.task].name, day: dayOf(day).read }));
      const pp = buildPickPair(r.task, day, P.w[day]);
      visual.appendChild(pp.pair);
      badges = $$('.where-badge', pp.card);
    }
    const btns = r.choices.map((c, i) => reasonChoice(c, i));
    btns.forEach(b => list.appendChild(b));
    const ok = btns[r.choices.findIndex(c => c.ok)];
    makeRound({
      all: btns, correct: [ok], together: r.together,
      hint2: () => {
        ok.classList.add('is-guide');
        if (r.note) visual.appendChild(visualNote(r.note));
        if (r.glowBadge) badges.forEach(b => b.classList.add('s4-glow-img'));
      },
      onCorrect: (btn) => {
        badges.forEach(b => b.classList.remove('s4-glow-img'));
        state.onNext = idx + 1 < rs.length ? () => s4Reason(P, idx + 1) : null;
        afterCorrect(btn, r.praise);
      }
    });
    focusQuiet(qText);
  }

  /* ---- 問題（問1・問2） ---- */
  function renderS4Quiz(si, qi, resume) {
    let P = state.s4[qi];
    if (!resume || !P) P = state.s4[qi] = newS4(si, qi);
    if (P.phase === 'reason') { s4Reason(P, P.reasonIdx); return; }
    resetPlay('quiz', 'plan4');
    const q = LESSON.steps[si].questions[qi], W = s4Words(si);
    if (P.phase === 'busy') P.phase = P.after || 'place';   // たしかめる 途中で やすんだ → 結果の形で もどる
    if (P.phase === 'kasa' && s4KasaDays(P).every(k => P.kasaFound.indexOf(k) >= 0)) P.phase = 'place';
    s4Build(P);
    if (P.phase === 'kasa') { s4StartKasa(P); return; }
    setQuestion(fill(q.q, { n: P.tasks.length }), W.place);
    if (P.phase === 'good') { s4Refresh(); s4AllGood(true); return; }
    if (Object.keys(P.marks).length) { P.after = 'place'; s4Finish(false, true); return; }
    setSpeech(W.place);
    S4.focusTo = P.tasks.map(t => S4.D.card[t]).find(c => !c.hidden) || btnCheck;
  }

  /* ---- おてほん ---- */
  function renderS4Model(si) {
    const st = LESSON.steps[si], m = st.model;
    resetPlay('model', 'plan4');
    const P = { si, qi: -1, week: m.week, w: LESSON.weeks[m.week], tasks: m.tasks.slice().sort(byNo),
      place: {}, held: null, phase: 'place', kasaFound: [], marks: {} };
    setQuestion(m.q, [m.kasa].concat(m.moves.map(x => x.say), [m.check]).join('。'));
    const D = s4Build(P, true);
    visual.inert = true;
    const kasa = s4KasaDays(P);
    let t = 400;
    later(() => { D.tejun[0].classList.add('is-now'); setSpeech(m.kasa); }, t);
    kasa.forEach((k, i) => later(() => { P.kasaFound.push(k); s4MarkKasa(k); S('play', 'tap'); }, t += 1200));
    t += 800;
    m.moves.forEach(mv => {
      later(() => {
        D.tejun.forEach(x => x.classList.remove('is-now'));
        if (mv.tejun) D.tejun[mv.tejun - 1].classList.add('is-now');
        setSpeech(mv.say);
        (mv.task ? D.card[mv.task] : D.slot[mv.from]).classList.add('is-guide');
      }, t);
      later(() => {
        const src = mv.task ? D.card[mv.task] : D.slot[mv.from];
        src.classList.remove('is-guide');
        S('play', 'tap');
        P.held = mv.task ? { kind: 'card', task: mv.task } : { kind: 'slot', day: mv.from };
        s4Refresh();
        D.slot[mv.to].classList.add('is-guide');
      }, t += 1400);
      later(() => {
        const before = s4Rects();
        const tk = mv.task || P.place[mv.from];
        if (mv.from) delete P.place[mv.from];
        P.place[mv.to] = tk; P.held = null;
        sfx('place', 'tap');
        D.slot[mv.to].classList.remove('is-guide');
        s4Refresh();
        s4Fly(before, mv.from ? 1200 : 450, [tk]);
      }, t += 1400);
      t += 1400;
    });
    later(() => {
      D.tejun.forEach(x => x.classList.remove('is-now'));
      setSpeech(m.check);
      btnCheck.classList.add('is-guide');
    }, t);
    later(() => {
      btnCheck.classList.remove('is-guide'); btnCheck.hidden = true;
      btnNext.hidden = false; focusQuiet(btnNext);
    }, t += 2600);
  }

  /* ---- おさらい（ステップ4から はじめた とき） ---- */
  function renderS4Review(si) {
    const r = LESSON.steps[si].review;
    resetPlay('quiz', true);
    setQuestion(r.q, r.say);
    const wrap = el('div', { class: 's4-review' });
    const panel = (cls, arts, lines) => {
      const p = el('div', { class: 's4-review-panel ' + cls });
      const a = el('div', { class: 's4-review-art' });
      arts.forEach(x => a.appendChild(x));
      p.appendChild(a);
      p.appendChild(el('p', { class: 's4-review-text' }, lines.map(x => '<span>' + ruby(x) + '</span>').join('')));
      return p;
    };
    const keys = Object.keys(LESSON.tasks).sort(byNo);
    wrap.appendChild(panel('ame', [img('weather-ame.svg', ''), img('weather-kumori-ame.svg', '')], r.ame));
    wrap.appendChild(panel('soto', [img('badge-soto.svg', '')].concat(keys.filter(k => LESSON.tasks[k].where === 'soto').map(buildS4Chip)), r.soto));
    wrap.appendChild(panel('naka', [img('badge-naka.svg', '')].concat(keys.filter(k => LESSON.tasks[k].where === 'naka').map(buildS4Chip)), r.naka));
    visual.appendChild(wrap);
    setSpeech(r.say);
    showNext(800);
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
    // ステップ3の あと（つぎが ちょうせん）は「ちょうせんする」「ふり返りへ」の 2つ
    const nextSt = LESSON.steps[si + 1];
    const offer = !!(nextSt && nextSt.kind === 'challenge');
    $('#clear-speech').innerHTML = ruby(st.clearSay || (offer ? 'シールが 3まい そろったね。ちょうせんも できるよ'
      : si + 1 < LESSON.steps.length ? 'シールを はったよ。つぎも いっしょに やろう' : 'シールが そろったね'));
    const nb = $('#btn-clear-next'), rb = $('#btn-clear-result');
    nb.hidden = true; rb.hidden = true;
    nb.textContent = offer ? 'ちょうせんする' : 'つぎへ';
    state.clearPending = true;
    focusQuiet($('#clear-text'));
    S('play', 'clear');
    const tok = state.token;
    let p;
    try { p = M('stepClear', si + 1); } catch (e) { p = null; }
    try { await Promise.race([Promise.resolve(p), new Promise(r => setTimeout(r, 2600))]); } catch (e) {}
    await new Promise(r => setTimeout(r, 300));
    if (tok !== state.token) return;
    state.clearPending = false;
    nb.hidden = false; rb.hidden = !offer; focusQuiet(nb);
  }

  function renderResult() {
    clearTimers(); stopReading();
    showScreen('result');
    setScene('result');
    const ul = $('#result-list'); ul.innerHTML = '';
    const s4i = LESSON.steps.findIndex(st => st.kind === 'challenge');
    const has4 = s4i >= 0 && state.cleared.has(s4i);
    $('#screen-result .board--result').classList.toggle('is-s4', has4);
    LESSON.steps.forEach((st, si) => {
      const lines = LESSON.result[si];
      if (!state.cleared.has(si) || !lines) return;
      [].concat(lines).forEach((line, li0) => {
        const li = el('li', { class: 'result-item' + (li0 > 0 ? ' result-item--sub' : '') });
        if (li0 === 0) li.appendChild(img('medal-step' + (si + 1) + '.svg', ''));
        li.appendChild(el('span', { class: 'label' }, ruby(line)));
        ul.appendChild(li);
      });
    });
    const t = $('#plan-table'); t.innerHTML = '';
    t.className = 'week-table ' + (has4 ? 'week-table--plan4' : 'week-table--plan');
    $('#screen-result .plan-head').textContent = has4 ? 'きみの 1しゅうかんの よていひょうだよ' : 'きみの よていひょうが できたよ';
    t.appendChild(el('span'));
    DAYS.forEach(d => t.appendChild(el('span', { class: 'wt-day' }, '<ruby>' + d.kanji + '<rt>' + d.yomi + '</rt></ruby>')));
    [1, 2].forEach(n => {
      t.appendChild(weekTag(n));
      DAYS.forEach(d => {
        const w = LESSON.weeks[n][d.key];
        if (!has4) { t.appendChild(buildDayCell(d.key, w, { name: false, chip: state.plan[n][d.key] })); return; }
        const tk = state.plan4[n][d.key];
        const cell = buildDayCell(d.key, w, { name: false });
        if (tk) {
          $('.day-slot', cell).appendChild(buildS4Chip(tk));
          $('.sr-only', cell).textContent = d.read + '、' + WEATHER[w].read + '、' + LESSON.tasks[tk].name;
          if (LESSON.tasks[tk].where === 'soto') cell.classList.add('is-soto-plan');
        }
        t.appendChild(cell);
      });
    });
    focusQuiet($('#result-title'));
  }

  function renderTitleWeek() {
    const tw = $('#title-week'); tw.innerHTML = '';
    DAYS.forEach(d => tw.appendChild(buildDayCell(d.key, LESSON.weeks[1][d.key], { weather: false })));
    stepPicker.innerHTML = '';
    stepPicker.classList.toggle('step-picker--4', LESSON.steps.length >= 4);
    LESSON.steps.forEach((st, si) => {
      const ch = st.kind === 'challenge';
      const b = el('button', { class: 'btn-step' + (ch ? ' btn-step--challenge' : ''), type: 'button' });
      b.appendChild(el('span', { class: 'key-num', 'aria-hidden': 'true' }, String(si + 1)));
      b.appendChild(img('medal-step' + (si + 1) + '.svg', ''));
      b.appendChild(el('span', { class: 'label' }, st.pickLabel ? st.pickLabel.map(ruby).join('<br>') : 'ステップ' + (si + 1) + '<br>' + ruby(st.name)));
      b.addEventListener('click', () => { state.reviewNeeded = ch; begin(); go(firstPageOf(si)); });
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
  function resetProgress() { state.cleared = new Set(); state.plan = { 1: {}, 2: {} }; state.plan4 = { 1: {}, 2: {} }; state.s4 = {}; state.reviewNeeded = false; }

  $('#btn-start').addEventListener('click', () => { resetProgress(); begin(); go(0); });
  $('#btn-steps').addEventListener('click', () => {
    S('play', 'tap');
    if (!state.started) { state.started = true; S('start'); S('setMuted', !settings.sound); }
    titlePage.classList.add('is-picking'); focusQuiet($('.btn-step', stepPicker));
  });
  $('#btn-again').addEventListener('click', () => { resetProgress(); begin(); go(0); });
  $('#btn-pick').addEventListener('click', () => { S('play', 'tap'); resetProgress(); showTitle(true); });
  btnNext.addEventListener('click', () => {
    S('play', 'tap');
    if (state.onNext) { const f = state.onNext; state.onNext = null; f(); return; }
    go(state.page + 1);
  });
  btnCheck.addEventListener('click', (e) => { if (S4) s4Check(e.detail === 0); });
  $('#btn-clear-next').addEventListener('click', () => { S('play', 'tap'); go(state.page + 1); });
  $('#btn-clear-result').addEventListener('click', () => { S('play', 'tap'); go(pages.findIndex(p => p.type === 'result')); });

  /* ---- ページへ 進む ---- */
  function go(p, resume) {
    const pg = pages[p];
    if (pg && pg.type === 'review' && !state.reviewNeeded) { go(p + 1, resume); return; }  // おさらいは ステップ4から はじめた時だけ
    state.page = p;
    if (!pg) { showTitle(); return; }
    if (pg.type === 'result') { renderResult(); return; }
    if (pg.type === 'clear') { renderClear(pg.si); return; }
    const st = LESSON.steps[pg.si];
    const n = st.questions.length;
    if (pg.type === 'review') {
      setProgress(pg.si, 'おさらい', 0, -1);
      renderS4Review(pg.si);
    } else if (pg.type === 'model') {
      setProgress(pg.si, 'おてほん', 0, -1);
      ({ weather: renderWeatherModel, sort: renderSortModel, plan: renderPlanModel, challenge: renderS4Model })[st.kind](pg.si);
    } else if (pg.type === 'quiz') {
      setProgress(pg.si, (pg.qi + 1) + 'もんめ ／ ぜんぶで ' + n + 'もん', pg.qi, pg.qi);
      ({ weather: renderWeatherQuiz, sort: renderSortQuiz, plan: renderPlanQuiz, challenge: renderS4Quiz })[st.kind](pg.si, pg.qi, resume);
    } else if (pg.type === 'summary') {
      setProgress(pg.si, 'まとめ', n, -1);
      renderSortSummary(pg.si);
    } else if (pg.type === 'compare') {
      setProgress(pg.si, 'くらべよう', pg.qi, -1);
      renderCompare(pg.si);
    }
    setScene('play');
    if (S4 && S4.focusTo) { focusQuiet(S4.focusTo); S4.focusTo = null; }
    else if (!btnNext.hidden) focusQuiet(btnNext); else focusQuiet(qText);
  }

  /* ---- キーボード: 1〜4 で選択肢、Esc で おやすみを とじる ---- */
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (restOverlay.classList.contains('is-show')) {
      if (e.key === 'Escape') { e.preventDefault(); closeRest(); }
      return;
    }
    if (e.key === 'Escape' && state.page < 0 && titlePage.classList.contains('is-picking')) { e.preventDefault(); unpick(); return; }
    // ステップ4の 表: カードは 番号キー（1・2・3・4・6・7・8）、もっている間と かさの日さがしは 1〜7＝げつ〜にち、Esc で はなす
    if (S4 && screens.play.classList.contains('is-active') && board.dataset.layout === 'plan4') {
      if (e.key === 'Escape') { if (s4Escape()) e.preventDefault(); return; }
      if (/^[1-9]$/.test(e.key)) { e.preventDefault(); s4Key(Number(e.key)); return; }
    }
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
