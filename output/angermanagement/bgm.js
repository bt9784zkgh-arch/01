/* =========================================================
 * bgm.js  —  いかりの きもち と つきあおう（angermanagement）
 * BGM・効果音（Web Audio API でその場で鳴らすオリジナル曲。音声ファイルなし）
 *
 * 使い方（ゲーム組立担当との決まり）
 *   Sound.start()            // BGMを小さくフェードインして開始（「はじめる」クリックの中で呼ぶ）
 *   Sound.stop()             // BGMをフェードアウトして止める
 *   Sound.setMuted(bool)     // おと あり／なし（効果音もまとめて消す）
 *   Sound.play('tap' | 'correct' | 'retry' | 'clear')
 *   （おまけ）Sound.isMuted() / Sound.isPlaying()
 *
 * 曲: 「保健室で ほっと する」 ヘ長調（F major）・4/4・テンポ84・16小節ループ（約45.7秒）
 *     オルゴール（メロディ）＋木琴（ベース）＋やわらかいパッド（和音）。ドラムなし。
 * 音量: BGM主音量 0.10 ／ 効果音 0.22〜0.26（上限0.3）／効果音中はBGMを約55%に下げる
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
  var BPM = 84;
  var BEAT = 60 / BPM;            // 約0.714秒
  var BAR = BEAT * 4;             // 約2.857秒
  var BGM_VOLUME = 0.10;          // BGM主音量（0.08〜0.12の範囲）
  var SFX_VOLUME = 0.26;          // 効果音の上限（0.3以下）
  var DUCK_LEVEL = 0.55;          // 効果音中のBGMの割合
  var FADE_IN = 2.5;              // 秒
  var FADE_OUT = 0.8;             // 秒

  /* ---------- 曲データ（オリジナル） ----------
   * MIDI番号: F4=65 G4=67 A4=69 Bb4=70 C5=72 D5=74 E5=76 F5=77 G5=79 A5=81
   * melody: [拍, 音, 長さ(拍)]  chord: パッドの和音  bass: [根音, 5度]  */
  var SONG = [
    // A（1〜8小節）
    { chord: [65, 69, 72], bass: [41, 48], melody: [[0, 69, 1], [1, 72, 1], [2, 77, 2]] },               // F
    { chord: [64, 67, 72], bass: [40, 48], melody: [[0, 76, 1.5], [1.5, 74, 0.5], [2, 72, 2]] },         // C/E
    { chord: [62, 65, 69], bass: [38, 45], melody: [[0, 74, 1], [1, 77, 1], [2, 81, 1], [3, 79, 1]] },   // Dm
    { chord: [62, 65, 70], bass: [46, 41], melody: [[0, 77, 3], [3, 74, 1]] },                           // Bb
    { chord: [65, 69, 72], bass: [41, 48], melody: [[0, 72, 1], [1, 69, 1], [2, 72, 1], [3, 77, 1]] },   // F
    { chord: [62, 67, 70], bass: [43, 50], melody: [[0, 79, 1.5], [1.5, 77, 0.5], [2, 74, 2]] },         // Gm
    { chord: [64, 67, 72], bass: [48, 43], melody: [[0, 76, 1], [1, 79, 1], [2, 76, 1], [3, 72, 1]] },   // C
    { chord: [64, 67, 70], bass: [48, 43], melody: [[0, 74, 2], [2, 76, 2]] },                           // C7
    // B（9〜16小節）
    { chord: [62, 65, 70], bass: [46, 41], melody: [[0, 77, 1], [1, 74, 1], [2, 70, 2]] },               // Bb
    { chord: [65, 69, 72], bass: [45, 48], melody: [[0, 72, 1], [1, 69, 1], [2, 72, 2]] },               // F/A
    { chord: [62, 67, 70], bass: [43, 50], melody: [[0, 74, 1], [1, 70, 1], [2, 67, 1], [3, 70, 1]] },   // Gm
    { chord: [64, 67, 72], bass: [48, 43], melody: [[0, 72, 3]] },                                       // C
    { chord: [62, 65, 69], bass: [38, 45], melody: [[0, 69, 1], [1, 74, 1], [2, 77, 1.5], [3.5, 76, 0.5]] }, // Dm
    { chord: [62, 65, 70], bass: [46, 41], melody: [[0, 74, 2], [2, 77, 2]] },                           // Bb
    { chord: [64, 67, 70], bass: [48, 43], melody: [[0, 76, 1.5], [1.5, 74, 0.5], [2, 76, 1], [3, 79, 1]] }, // C7
    { chord: [65, 69, 72], bass: [41, 48], melody: [[0, 77, 3]] }                                        // F
  ];

  /* ---------- 状態 ---------- */
  var ctx = null, master = null, musicBus = null, sfxBus = null, echoIn = null;
  var session = null;     // いま鳴っているBGMの出口（start ごとに新しく作る）
  var timer = null, nextBarTime = 0, barIndex = 0;
  var muted = false, playing = false, duckUntil = 0;

  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function init() {
    if (ctx) return true;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 1;

      // 耳にやさしく: 高音を少し丸め、急な大きい音をおさえる
      var soften = ctx.createBiquadFilter();
      soften.type = 'lowpass'; soften.frequency.value = 6500; soften.Q.value = 0.5;
      var comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18; comp.knee.value = 12; comp.ratio.value = 4;
      comp.attack.value = 0.005; comp.release.value = 0.25;
      master.connect(soften); soften.connect(comp); comp.connect(ctx.destination);

      musicBus = ctx.createGain(); musicBus.gain.value = 1; musicBus.connect(master);
      sfxBus = ctx.createGain(); sfxBus.gain.value = SFX_VOLUME; sfxBus.connect(master);

      // ほんのりした残響（やわらかいエコー）
      echoIn = ctx.createGain(); echoIn.gain.value = 0.2;
      var delay = ctx.createDelay(1.0); delay.delayTime.value = BEAT * 0.75;
      var fb = ctx.createGain(); fb.gain.value = 0.28;
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
      echoIn.connect(delay); delay.connect(lp); lp.connect(fb); fb.connect(delay);
      lp.connect(musicBus);

      document.addEventListener('visibilitychange', function () {
        if (!ctx) return;
        try {
          if (document.hidden) ctx.suspend();
          else ctx.resume();
        } catch (e) {}
      });
      return true;
    } catch (e) {
      ctx = null;
      return false;
    }
  }

  /* ---------- 音色 ---------- */
  // 音のエンベロープ（クリック音が出ないように 0 から始めて 0 へ）
  function env(g, t, peak, attack, decay) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }
  function osc(type, freq, t, end, dest) {
    var o = ctx.createOscillator();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    o.connect(dest); o.start(t); o.stop(end + 0.05);
    return o;
  }

  // オルゴール: 基音（サイン）＋ きらっとした高い倍音（すぐ消える）
  function musicBox(dest, midi, t, durBeats, vol) {
    var f = mtof(midi);
    var len = Math.max(1.2, durBeats * BEAT + 0.8);
    var g = ctx.createGain(); env(g, t, vol, 0.004, len); g.connect(dest);
    osc('sine', f, t, t + len, g);
    var g2 = ctx.createGain(); env(g2, t, vol * 0.22, 0.002, 0.25); g2.connect(dest);
    osc('sine', f * 4.01, t, t + 0.3, g2);
  }

  // 木琴: 短く「ぽこっ」
  function marimba(dest, midi, t, vol) {
    var f = mtof(midi);
    var g = ctx.createGain(); env(g, t, vol, 0.005, 0.6); g.connect(dest);
    osc('sine', f, t, t + 0.7, g);
    var g2 = ctx.createGain(); env(g2, t, vol * 0.25, 0.002, 0.08); g2.connect(dest);
    osc('sine', f * 3.9, t, t + 0.12, g2);
  }

  // やわらかいパッド: ゆっくりふくらんで、ゆっくり消える
  function pad(dest, notes, t, len, vol) {
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.9);
    g.gain.setValueAtTime(vol, t + len - 0.6);
    g.gain.linearRampToValueAtTime(0.0001, t + len + 0.4);
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 0.3;
    lp.connect(g); g.connect(dest);
    for (var i = 0; i < notes.length; i++) {
      var f = mtof(notes[i]);
      osc('triangle', f * 0.998, t, t + len + 0.45, lp);
      osc('triangle', f * 1.002, t, t + len + 0.45, lp);
    }
  }

  /* ---------- BGM の予約（小節ごとに少し先まで） ---------- */
  function scheduleBar(dest, bar, t) {
    pad(dest, bar.chord, t, BAR, 0.035);
    marimba(dest, bar.bass[0], t, 0.32);
    marimba(dest, bar.bass[1], t + BEAT * 2, 0.22);
    for (var i = 0; i < bar.melody.length; i++) {
      var n = bar.melody[i];
      musicBox(dest, n[1], t + n[0] * BEAT, n[2], 0.30);
    }
  }
  function tick() {
    if (!playing || !ctx || !session) return;
    while (nextBarTime < ctx.currentTime + 0.4) {
      scheduleBar(session, SONG[barIndex], nextBarTime);
      nextBarTime += BAR;
      barIndex = (barIndex + 1) % SONG.length;
    }
  }

  /* ---------- 公開する関数 ---------- */
  function start() {
    try {
      if (!init()) return;
      if (ctx.state === 'suspended') ctx.resume();
      if (playing) return;
      playing = true;
      session = ctx.createGain();
      var t = ctx.currentTime;
      session.gain.setValueAtTime(0.0001, t);
      session.gain.linearRampToValueAtTime(BGM_VOLUME, t + FADE_IN);
      session.connect(musicBus);
      session.connect(echoIn);   // BGMにだけ、ほんのり残響
      nextBarTime = t + 0.15;
      barIndex = 0;
      tick();
      timer = setInterval(tick, 100);
    } catch (e) {}
  }

  function stop() {
    try {
      if (!ctx || !playing) return;
      playing = false;
      if (timer) { clearInterval(timer); timer = null; }
      var old = session; session = null;
      var t = ctx.currentTime;
      old.gain.cancelScheduledValues(t);
      old.gain.setValueAtTime(old.gain.value, t);
      old.gain.linearRampToValueAtTime(0.0001, t + FADE_OUT);
      setTimeout(function () { try { old.disconnect(); } catch (e) {} }, (FADE_OUT + 0.2) * 1000);
    } catch (e) {}
  }

  function setMuted(flag) {
    muted = !!flag;
    try {
      if (!ctx) return;   // まだ始まっていなければ、覚えておくだけ
      var t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(muted ? 0 : 1, t + 0.25);
    } catch (e) {}
  }

  // 効果音中は BGM を少し下げる（ダッキング）
  function duck(seconds) {
    var t = ctx.currentTime;
    var end = t + seconds;
    musicBus.gain.cancelScheduledValues(t);
    musicBus.gain.setValueAtTime(musicBus.gain.value, t);
    musicBus.gain.linearRampToValueAtTime(DUCK_LEVEL, t + 0.06);
    if (end < duckUntil) end = duckUntil;
    duckUntil = end;
    musicBus.gain.setValueAtTime(DUCK_LEVEL, end);
    musicBus.gain.linearRampToValueAtTime(1, end + 0.5);
  }

  var SFX = {
    // 選んだ「ぽん」: 短く小さめ
    tap: function (t) {
      var g = ctx.createGain(); env(g, t, 0.55, 0.004, 0.12); g.connect(sfxBus);
      var o = osc('sine', 880, t, t + 0.15, g);
      o.frequency.exponentialRampToValueAtTime(620, t + 0.08);
      return 0.15;
    },
    // 正解「ピロリン」: 上がっていく3音（C6→E6→G6）＋最後にきらっ
    correct: function (t) {
      var seq = [84, 88, 91];
      for (var i = 0; i < seq.length; i++) {
        musicBox(sfxBus, seq[i], t + i * 0.09, 0.6, 0.75);
      }
      musicBox(sfxBus, 96, t + 0.27, 0.6, 0.25);
      return 0.8;
    },
    // まちがい「ぽわん」: やわらかく、少し下がる低めの音（ブザーにしない）
    retry: function (t) {
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1200;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.6, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      lp.connect(g); g.connect(sfxBus);
      var o = osc('sine', mtof(65), t, t + 0.75, lp);      // F4 から
      o.frequency.linearRampToValueAtTime(mtof(62), t + 0.45); // D4 へ ふわっと下がる
      var lfo = ctx.createOscillator(); lfo.frequency.value = 6;
      var lg = ctx.createGain(); lg.gain.value = 4;
      lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + 0.75);
      var o2 = osc('triangle', mtof(53), t, t + 0.75, lp);  // 1オクターブ下を少し
      o2.frequency.linearRampToValueAtTime(mtof(50), t + 0.45);
      return 0.75;
    },
    // ステップクリア: 短いファンファーレ（ド・ミ・ソ → 和音）約1.5秒
    clear: function (t) {
      var s = 0.13;
      musicBox(sfxBus, 77, t, 0.5, 0.6);
      musicBox(sfxBus, 81, t + s, 0.5, 0.6);
      musicBox(sfxBus, 84, t + s * 2, 0.5, 0.6);
      var h = t + s * 3.2;
      musicBox(sfxBus, 89, h, 2, 0.6);
      musicBox(sfxBus, 84, h, 2, 0.35);
      musicBox(sfxBus, 81, h, 2, 0.3);
      pad(sfxBus, [65, 69, 72], h, 1.0, 0.18);
      marimba(sfxBus, 53, h, 0.6);
      return 1.6;
    }
  };

  function play(name) {
    try {
      if (!SFX[name]) return;
      if (!init()) return;
      if (ctx.state === 'suspended') ctx.resume();
      if (muted) return;
      var t = ctx.currentTime + 0.01;
      var len = SFX[name](t);
      if (playing) duck(len);
    } catch (e) {}
  }

  global.Sound = {
    start: start,
    stop: stop,
    setMuted: setMuted,
    play: play,
    isMuted: function () { return muted; },
    isPlaying: function () { return playing; }
  };
})(window);
