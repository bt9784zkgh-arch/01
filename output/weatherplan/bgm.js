/* =========================================================
 * bgm.js  —  てんきを みて よていを たてよう（weatherplan）
 * BGM・効果音（Web Audio API でその場で鳴らすオリジナル曲。音声ファイルなし）
 *
 * 使い方（ゲーム組立担当との決まり）
 *   Sound.start()            // BGMを小さくフェードインして開始（「はじめる」クリックの中で呼ぶ）
 *   Sound.stop()             // BGMをフェードアウトして止める（おやすみ画面など）
 *   Sound.setMuted(bool)     // おと あり／なし（BGMも効果音もまとめて消す）
 *   Sound.play('tap' | 'correct' | 'retry' | 'clear' | 'place' | 'stamp')
 *     place … ステップ4 カードをマスに おいた「ぺた」 / stamp … 答え合わせのスタンプ「ぽん」（近すぎる連打は間引く）
 *     知らない名前を渡しても何もしない（エラーにしない）
 *   （おまけ）Sound.isMuted() / Sound.isPlaying()
 *
 * 曲: 「てちょうを ひらく あさ」 ヘ長調（F major）・4/4・テンポ90・16小節ループ（約42.7秒）
 *     チェレスタ（メロディ）＋マリンバ（4分音符の分散和音）＋やわらかいパッド＋低いベース。ドラムなし。
 *     はねるリズム（付点のくりかえし）は使わず、歩くような4分音符中心。
 * 音量: BGM主音量 0.10 ／ 効果音 ピーク約0.15〜0.27（上限0.3、リミッター付き）／効果音中はBGMを約50%に下げる
 * AudioContext が使えない環境では、すべて何もしない関数になる（ゲームは止まらない）
 * ========================================================= */
(function (global) {
  'use strict';

  var NOOP = {
    start: function () {}, stop: function () {}, setMuted: function () {},
    play: function () {}, isMuted: function () { return false; }, isPlaying: function () { return false; }
  };

  var AC = global.AudioContext || global.webkitAudioContext;
  if (!AC) { global.Sound = NOOP; return; }

  /* ---------- 設定 ---------- */
  var BPM = 90;
  var BEAT = 60 / BPM;            // 約0.667秒
  var BAR = BEAT * 4;             // 約2.667秒
  var BGM_VOLUME = 0.10;          // BGM主音量（0.08〜0.12の範囲）
  var SFX_MAX = 0.28;             // 効果音の上限（0.3以下。重なっても sfxBus でこえないようにする）
  var DUCK_LEVEL = 0.5;           // 効果音中のBGMの割合
  var FADE_IN = 3.0;              // 秒
  var FADE_OUT = 1.0;             // 秒
  var LOOKAHEAD = 0.35;           // 先読みして予約する秒数
  var TICK_MS = 90;
  var STAMP_MIN_GAP = 0.22;       // stamp がこれより近い間隔で呼ばれたら鳴らさない（秒）
  var STAMP_SERIES_GAP = 1.2;     // これ以内に続いたら「同じ答え合わせの続き」とみなす（秒）

  /* ---------- 曲データ（オリジナル） ----------
   * MIDI番号: E4=64 F4=65 G4=67 A4=69 Bb4=70 C5=72 D5=74 E5=76 F5=77 G5=79
   * chord: パッドとマリンバの和音  bass: 根音  melody: [拍, 音, 長さ(拍)] */
  var SONG = [
    // A：天気予報を見て、ゆっくり手帳をひらく（1〜8小節）
    { chord: [65, 69, 72], bass: 41, melody: [[0, 72, 1.5], [1.5, 74, 0.5], [2, 72, 1], [3, 69, 1]] },   // F
    { chord: [64, 69, 72], bass: 45, melody: [[0, 76, 2], [2, 72, 1], [3, 69, 1]] },                     // Am
    { chord: [65, 70, 74], bass: 46, melody: [[0, 74, 1], [1, 77, 1], [2, 74, 1], [3, 70, 1]] },         // Bb
    { chord: [64, 67, 72], bass: 48, melody: [[0, 72, 3], [3, 67, 1]] },                                 // C
    { chord: [65, 69, 74], bass: 38, melody: [[0, 69, 1.5], [1.5, 72, 0.5], [2, 77, 1], [3, 76, 1]] },   // Dm
    { chord: [65, 70, 74], bass: 46, melody: [[0, 74, 2], [2, 70, 1], [3, 74, 1]] },                     // Bb
    { chord: [65, 67, 70], bass: 43, melody: [[0, 72, 1], [1, 70, 1], [2, 69, 1], [3, 67, 1]] },         // Gm7
    { chord: [64, 67, 70], bass: 48, melody: [[0, 64, 2], [2, 67, 1], [3, 70, 1]] },                     // C7
    // B：1週間の予定が少しずつうまっていく（9〜16小節）
    { chord: [65, 70, 74], bass: 46, melody: [[0, 74, 1.5], [1.5, 72, 0.5], [2, 74, 1], [3, 77, 1]] },   // Bb
    { chord: [64, 67, 72], bass: 48, melody: [[0, 79, 2], [2, 76, 1], [3, 72, 1]] },                     // C
    { chord: [64, 69, 72], bass: 45, melody: [[0, 76, 1], [1, 72, 1], [2, 69, 1], [3, 72, 1]] },         // Am
    { chord: [65, 69, 74], bass: 38, melody: [[0, 74, 3], [3, 77, 1]] },                                 // Dm
    { chord: [67, 70, 74], bass: 43, melody: [[0, 79, 1.5], [1.5, 77, 0.5], [2, 74, 1], [3, 70, 1]] },   // Gm
    { chord: [64, 67, 72], bass: 48, melody: [[0, 72, 1], [1, 76, 1], [2, 79, 1], [3, 76, 1]] },         // C
    { chord: [65, 69, 72], bass: 41, melody: [[0, 77, 2], [2, 76, 1], [3, 72, 1]] },                     // F
    { chord: [65, 69, 72], bass: 41, melody: [[0, 77, 3]] }                                              // F（ひと息）
  ];
  // マリンバの分散和音（拍ごとに和音の何番目を鳴らすか。-1 は1オクターブ下の根音）
  var ARP = [-1, 1, 2, 1];

  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  /* ---------- 状態 ---------- */
  var ctx = null, out = null, muteGain = null, bgmMaster = null, duckGain = null, bgmBus = null,
      sfxBus = null, reverb = null, revSend = null;
  var muted = false, playing = false, timer = null, stopTimer = null;
  var nextBarTime = 0, barIndex = 0, duckUntil = 0, duckTimer = null;
  var lastStampAt = -10, stampCount = 0;

  function safe(fn) { return function () { try { return fn.apply(null, arguments); } catch (e) { /* 音が出なくてもゲームは続ける */ } }; }

  function makeImpulse(seconds) {
    var rate = ctx.sampleRate, len = Math.floor(rate * seconds);
    var buf = ctx.createBuffer(2, len, rate);
    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    return buf;
  }

  function init() {
    if (ctx) return true;
    ctx = new AC();
    out = ctx.createDynamicsCompressor();        // 急に大きくならないように
    out.threshold.value = -18; out.ratio.value = 4;
    out.connect(ctx.destination);

    muteGain = ctx.createGain(); muteGain.gain.value = muted ? 0 : 1; muteGain.connect(out);

    bgmMaster = ctx.createGain(); bgmMaster.gain.value = 0; bgmMaster.connect(muteGain);
    duckGain = ctx.createGain(); duckGain.gain.value = 1; duckGain.connect(bgmMaster);
    var tone = ctx.createBiquadFilter();         // 高い音をまるくして耳にやさしく
    tone.type = 'lowpass'; tone.frequency.value = 3200; tone.Q.value = 0.5;
    tone.connect(duckGain);
    bgmBus = tone;

    reverb = ctx.createConvolver(); reverb.buffer = makeImpulse(2.2);
    var revOut = ctx.createGain(); revOut.gain.value = 0.35;
    reverb.connect(revOut); revOut.connect(duckGain);
    revSend = ctx.createGain(); revSend.gain.value = 1; revSend.connect(reverb);

    sfxBus = ctx.createGain(); sfxBus.gain.value = 1;
    var sfxLimit = ctx.createDynamicsCompressor();   // 重なっても SFX_MAX 付近でおさえる
    sfxLimit.threshold.value = 20 * Math.log10(SFX_MAX); sfxLimit.knee.value = 0; sfxLimit.ratio.value = 20;
    sfxLimit.attack.value = 0.002; sfxLimit.release.value = 0.1;
    sfxBus.connect(sfxLimit); sfxLimit.connect(muteGain);
    var sfxRev = ctx.createGain(); sfxRev.gain.value = 0.15; sfxBus.connect(sfxRev); sfxRev.connect(reverb);

    if (document && document.addEventListener) {
      document.addEventListener('visibilitychange', function () {
        if (!ctx) return;
        if (document.hidden) { ctx.suspend(); }
        else if (playing) { ctx.resume(); nextBarTime = Math.max(nextBarTime, ctx.currentTime + 0.1); }
      });
    }
    return true;
  }

  /* ---------- 音色 ---------- */
  // 一つの音（減衰する打楽器系）。partials: [倍音比, 音量比]
  function strike(dest, t, freq, vol, decay, partials, send) {
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    g.connect(dest);
    if (send) { var s = ctx.createGain(); s.gain.value = send; g.connect(s); s.connect(revSend); }
    for (var i = 0; i < partials.length; i++) {
      var o = ctx.createOscillator(), pg = ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq * partials[i][0];
      pg.gain.value = partials[i][1];
      // 高い倍音は早く消える
      if (i > 0) { pg.gain.setValueAtTime(partials[i][1], t); pg.gain.exponentialRampToValueAtTime(0.0001, t + decay * 0.35); }
      o.connect(pg); pg.connect(g);
      o.start(t); o.stop(t + decay + 0.05);
    }
  }
  var CELESTA = [[1, 1], [2, 0.18], [4, 0.06]];
  var MARIMBA = [[1, 1], [3.9, 0.12]];

  function celesta(dest, t, m, vol, len) { strike(dest, t, mtof(m), vol, Math.max(1.0, len * BEAT + 0.6), CELESTA, 0.6); }
  function marimba(dest, t, m, vol) { strike(dest, t, mtof(m), vol, 0.55, MARIMBA, 0.3); }

  function pad(t, notes, dur) {
    var g = ctx.createGain(), f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 900; f.Q.value = 0.3;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.07, t + 0.7);
    g.gain.setValueAtTime(0.07, t + dur - 0.4);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.5);
    f.connect(g); g.connect(bgmBus);
    var s = ctx.createGain(); s.gain.value = 0.5; g.connect(s); s.connect(revSend);
    notes.forEach(function (m) {
      [-5, 5].forEach(function (cents) {
        var o = ctx.createOscillator();
        o.type = 'triangle'; o.frequency.value = mtof(m - 12); o.detune.value = cents;
        o.connect(f); o.start(t); o.stop(t + dur + 0.6);
      });
    });
  }

  function bass(t, m, dur) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = mtof(m);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bgmBus); o.start(t); o.stop(t + dur + 0.05);
  }

  /* ---------- BGM 予約 ---------- */
  function scheduleBar(t, bar) {
    var b = SONG[bar];
    pad(t, b.chord, BAR);
    bass(t, b.bass, BEAT * 2.5);
    for (var k = 0; k < 4; k++) {
      var idx = ARP[k], note = idx < 0 ? b.chord[0] - 12 : b.chord[idx];
      marimba(bgmBus, t + k * BEAT, note, k === 0 ? 0.16 : 0.11);
    }
    b.melody.forEach(function (n) { celesta(bgmBus, t + n[0] * BEAT, n[1], 0.2, n[2]); });
  }

  function tick() {
    if (!ctx || !playing) return;
    while (nextBarTime < ctx.currentTime + LOOKAHEAD) {
      scheduleBar(nextBarTime, barIndex);
      nextBarTime += BAR;
      barIndex = (barIndex + 1) % SONG.length;
    }
  }

  /* ---------- ダッキング ---------- */
  function duck(seconds) {
    var now = ctx.currentTime, g = duckGain.gain;
    duckUntil = Math.max(duckUntil, now + seconds);
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(DUCK_LEVEL, now + 0.06);
    if (duckTimer) clearTimeout(duckTimer);
    duckTimer = setTimeout(function () {
      var n = ctx.currentTime;
      duckGain.gain.cancelScheduledValues(n);
      duckGain.gain.setValueAtTime(duckGain.gain.value, n);
      duckGain.gain.linearRampToValueAtTime(1, n + 0.6);
    }, Math.max(0, (duckUntil - now)) * 1000);
  }

  /* ---------- 効果音 ---------- */
  var SFX = {
    // ぽん：やわらかい短い音
    tap: function (t) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(700, t);
      o.frequency.exponentialRampToValueAtTime(480, t + 0.08);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.16, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 0.2);
      return 0.2;
    },
    // ピロリン：上がっていく4つの音（C5→E5→G5→C6）
    correct: function (t) {
      [72, 76, 79, 84].forEach(function (m, i) {
        strike(sfxBus, t + i * 0.085, mtof(m), i === 3 ? 0.15 : 0.11, i === 3 ? 0.9 : 0.35, CELESTA, 0);
      });
      return 0.9;
    },
    // ぽわん：やさしく下がる低めの音（サイン波のみ。ブザー音にしない）
    retry: function (t) {
      var o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
      var lfo = ctx.createOscillator(), lg = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(mtof(69), t);                     // A4
      o.frequency.exponentialRampToValueAtTime(mtof(64), t + 0.35); // E4 へゆっくり
      lfo.frequency.value = 6; lg.gain.value = 4; lfo.connect(lg); lg.connect(o.frequency);
      f.type = 'lowpass'; f.frequency.value = 1200;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.16, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      o.connect(f); f.connect(g); g.connect(sfxBus);
      o.start(t); o.stop(t + 0.6); lfo.start(t); lfo.stop(t + 0.6);
      return 0.6;
    },
    // 短いファンファーレ（ヘ長調。F→A→C と上がって、和音でしめる）
    clear: function (t) {
      var step = 0.14;
      [65, 69, 72].forEach(function (m, i) {
        strike(sfxBus, t + i * step, mtof(m), 0.13, 0.45, MARIMBA, 0);
        strike(sfxBus, t + i * step, mtof(m + 12), 0.06, 0.45, CELESTA, 0);
      });
      var tc = t + step * 3 + 0.04;
      [69, 72, 77].forEach(function (m) {
        strike(sfxBus, tc, mtof(m), 0.06, 1.4, CELESTA, 0);
        strike(sfxBus, tc, mtof(m - 12), 0.03, 0.9, MARIMBA, 0);
      });
      strike(sfxBus, tc + 0.25, mtof(84), 0.04, 1.2, CELESTA, 0);  // きらっと一つ
      return 1.9;
    },
    // ぺた：シールを はる やわらかい音（紙がふれる小さな「さっ」＋低めの丸い「ぽこ」。約0.2秒）
    place: function (t) {
      // 紙の音：短いノイズを低めのバンドパスでまるくする
      var len = Math.floor(ctx.sampleRate * 0.06), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
      var n = ctx.createBufferSource(), nf = ctx.createBiquadFilter(), ng = ctx.createGain();
      n.buffer = buf;
      nf.type = 'bandpass'; nf.frequency.value = 1400; nf.Q.value = 0.8;
      ng.gain.value = 0.07;
      n.connect(nf); nf.connect(ng); ng.connect(sfxBus); n.start(t);
      // おさえる音：少しだけ下がるサイン波
      var o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
      o.type = 'sine';
      o.frequency.setValueAtTime(420, t + 0.01);
      o.frequency.exponentialRampToValueAtTime(260, t + 0.12);
      f.type = 'lowpass'; f.frequency.value = 900;
      g.gain.setValueAtTime(0.0001, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.15, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      o.connect(f); f.connect(g); g.connect(sfxBus);
      o.start(t + 0.01); o.stop(t + 0.24);
      return 0.22;
    },
    // ぽん（スタンプ）：小さく まるい木の音。続けて押すと、ほんの少しずつ高くなる（ヘ長調の音で7つまで）
    stamp: function (t) {
      var now = ctx.currentTime;
      if (now - lastStampAt < STAMP_MIN_GAP) return -1;           // 近すぎるときは間引く
      stampCount = (now - lastStampAt <= STAMP_SERIES_GAP) ? stampCount + 1 : 0;
      lastStampAt = now;
      var SCALE = [65, 67, 69, 72, 74, 77, 79];                   // F G A C D F G
      var m = SCALE[Math.min(stampCount, SCALE.length - 1)];
      var vol = 0.09 * Math.max(0.75, 1 - stampCount * 0.04);     // 続くほど ほんの少し小さく
      strike(sfxBus, t, mtof(m), vol, 0.28, MARIMBA, 0);
      return 0.3;
    }
  };

  /* ---------- 公開する関数 ---------- */
  var Sound = {
    start: safe(function () {
      init();
      if (ctx.state === 'suspended') ctx.resume();
      if (stopTimer) { clearTimeout(stopTimer); stopTimer = null; }
      var now = ctx.currentTime, g = bgmMaster.gain;
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(BGM_VOLUME, now + FADE_IN);
      if (!playing) {
        playing = true;
        barIndex = 0;
        nextBarTime = now + 0.1;
        tick();
        timer = setInterval(tick, TICK_MS);
      }
    }),

    stop: safe(function () {
      if (!ctx || !playing) return;
      var now = ctx.currentTime, g = bgmMaster.gain;
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(0, now + FADE_OUT);
      if (stopTimer) clearTimeout(stopTimer);
      stopTimer = setTimeout(function () {
        stopTimer = null;
        playing = false;
        if (timer) { clearInterval(timer); timer = null; }
      }, FADE_OUT * 1000 + 50);
    }),

    setMuted: safe(function (m) {
      muted = !!m;
      if (!ctx) return;                         // まだ始まっていなければ、状態だけ覚える
      var now = ctx.currentTime, g = muteGain.gain;
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(muted ? 0 : 1, now + 0.3);
    }),

    play: safe(function (name) {
      if (muted || typeof name !== 'string' || !Object.prototype.hasOwnProperty.call(SFX, name)) return;
      init();
      if (ctx.state === 'suspended') ctx.resume();
      var t = ctx.currentTime + 0.01;
      var len = SFX[name](t);
      if (len > 0) duck(len + 0.1);       // 間引いたとき（-1）はダッキングもしない
    }),

    isMuted: function () { return muted; },
    isPlaying: function () { return playing; }
  };

  global.Sound = Sound;
})(window);
