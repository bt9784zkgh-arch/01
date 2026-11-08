/* =========================================================================
   motion3d.js ― いかりと なかよく なろう（3D演出）
   チーム02 3Dモーション担当

   読み込み順: lib/three.min.js → motion3d.js → game.js（どれも普通の <script>）
   使い方:
     Motion3D.init(document.getElementById('stage3d'), { theme: THEME })
     Motion3D.setScene('title' | 'play' | 'result')
     Motion3D.celebrate(x, y)          // 画面座標(px)。getBoundingClientRect() の値そのまま
     Motion3D.encourage()
     await Motion3D.stepClear(n)       // n = 1〜3。2秒以内に resolve
     Motion3D.setReducedMotion(bool)

   守っていること
   - 問題中（play）は #board の上で何も動かさない。常に動く物は出さない
   - 点滅なし・画面全体のフラッシュなし・カメラの揺れなし
   - うごき すくなめ / prefers-reduced-motion: 回転・飛び出しを止め、ふわっと出すだけ
   - WebGLが使えない／three.min.js が無い → 何もしない関数に切りかえる（ゲームは止めない）
   - 物体は同時に300個まで。影を落とすライトは使わない（トゥーンの陰影だけ）
   ========================================================================= */
(function () {
  'use strict';

  /* ---------- 何もしない版（WebGLが無いときなど） ---------- */
  var NOOP = {
    available: false,
    init: function () { return NOOP; },
    setScene: function () {},
    celebrate: function () {},
    encourage: function () {},
    stepClear: function () { return Promise.resolve(); },
    setReducedMotion: function () {}
  };

  var api = {
    available: false,
    init: init,
    setScene: function (s) { safe(function () { setScene(s); }); },
    celebrate: function (x, y) { safe(function () { celebrate(x, y); }); },
    encourage: function () { safe(encourage); },
    stepClear: function (n) {
      try { return stepClear(n); } catch (e) { fail(e); return Promise.resolve(); }
    },
    setReducedMotion: function (b) { userReduced = !!b; if (alive) wakeAll(); }
  };
  window.Motion3D = api;

  function safe(fn) { try { if (alive) fn(); } catch (e) { fail(e); } }
  function fail(e) {
    if (window.console) console.warn('[Motion3D] 3D演出を止めました:', e);
    shutdown();
  }
  function shutdown() {
    alive = false;
    try { if (renderer) { renderer.domElement.remove(); renderer.dispose(); } } catch (e) {}
    for (var k in NOOP) api[k] = NOOP[k];
    flushPending();
  }

  /* ---------- 状態 ---------- */
  var THREE = window.THREE;
  var alive = false, renderer, scene, camera, container, gradientMap;
  var W = 1, H = 1, ppu = 1;               // ppu: 画面1pxあたり … world 1 = ppu px
  var CAM_Z = 20, FOV = 30;
  var userReduced = false, osReduced = false;
  var currentScene = 'none';
  var actors = [];                          // 動いている物（update(t) が false を返すと消える）
  var titleGroup = null, resultGroup = null;
  var rafId = 0, lastNow = 0;
  var pending = [];                         // stepClear の resolve
  var C = {};                               // 色
  var MAX_OBJECTS = 300;

  var DEFAULT_THEME = {
    paper: 0xFBF7EF, wall: 0xE8DDC8, ink: 0x33302C, primary: 0x2F6B62, tape: 0xEBC9A8,
    lv1: 0xA9C6E3, lv2: 0xF1D88A, lv3: 0xEFAE9B,
    can: 0xF2BC85, cannot: 0xC9CCD1, skin: 0xF7E3C8
  };

  function reduced() { return userReduced || osReduced; }

  /* ---------- イージング ---------- */
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOutCubic(t) { t = clamp01(t); return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { t = clamp01(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeInQuad(t) { t = clamp01(t); return t * t; }
  function easeOutBack(t) { t = clamp01(t); var c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
  // ばね: 0→1 に行きすぎて戻る（減衰）
  function spring(t, k) { t = Math.max(0, t); k = k || 7; return 1 - Math.exp(-k * t) * Math.cos(k * 1.35 * t); }
  // バウンド（ボールが落ちて小さくはねる）
  function easeOutBounce(t) {
    t = clamp01(t); var n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375;
    return n * (t -= 2.625 / d) * t + .984375;
  }

  /* =======================================================================
     init
     ======================================================================= */
  function init(el, opts) {
    if (alive) return api;
    try {
      THREE = window.THREE;
      if (!THREE || !el) throw new Error('three.min.js か 入れ物 が ありません');
      if (!webglOK()) throw new Error('WebGL が 使えません');
      container = el;
      var theme = (opts && opts.theme) || {};
      for (var k in DEFAULT_THEME) C[k] = (theme[k] != null ? theme[k] : DEFAULT_THEME[k]);
      C.heart = 0xF6D9CF;

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.shadowMap.enabled = false;
      var cv = renderer.domElement;
      cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;';
      cv.setAttribute('aria-hidden', 'true');
      if (getComputedStyle(el).position === 'static') el.style.position = 'fixed';
      el.style.pointerEvents = 'none';
      el.appendChild(cv);
      cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); shutdown(); });

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(FOV, 1, 1, 60);
      camera.position.set(0, 0, CAM_Z);
      camera.lookAt(0, 0, 0);

      // やわらかい光: 空と床の色（紙・かべ）＋ななめ上から1灯（影は落とさない）
      scene.add(new THREE.HemisphereLight(0xFFFFFF, C.wall, 0.9));
      var sun = new THREE.DirectionalLight(0xFFFFFF, 1.6);
      sun.position.set(-4, 6, 8);
      scene.add(sun);

      gradientMap = makeGradient();

      if (window.matchMedia) {
        var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        osReduced = mq.matches;
        var onMq = function () { osReduced = mq.matches; };
        if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq);
      }

      resize();
      window.addEventListener('resize', function () { resize(); wakeAll(); });
      // おやすみ画面が出ている間は 3D を隠す（ループが止まっていても効くように）
      setInterval(function () {
        if (!alive) return;
        var rest = document.getElementById('rest-overlay');
        var v = (rest && rest.classList.contains('is-show')) ? 'hidden' : 'visible';
        if (renderer.domElement.style.visibility !== v) renderer.domElement.style.visibility = v;
      }, 250);
      if (window.ResizeObserver) new ResizeObserver(resize).observe(el);

      alive = true;
      api.available = true;
      renderer.render(scene, camera);
    } catch (e) {
      fail(e);
    }
    return api;
  }

  function webglOK() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  function resize() {
    if (!renderer) return;
    W = container.clientWidth || window.innerWidth;
    H = container.clientHeight || window.innerHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    var visH = 2 * CAM_Z * Math.tan(FOV * Math.PI / 360);
    ppu = H / visH;
    kick();
  }

  /* ---------- 座標 ---------- */
  // #app は 1920×1080 を拡大縮小している。その倍率（無ければ画面の高さから）
  function appRect() {
    var a = document.getElementById('app');
    var r = a && a.getBoundingClientRect();
    if (r && r.width > 0) return r;
    var s = Math.min(W / 1920, H / 1080);
    return { left: (W - 1920 * s) / 2, top: (H - 1080 * s) / 2, width: 1920 * s, height: 1080 * s };
  }
  function appScale() { return appRect().width / 1920; }
  // 画面座標(px) → world（z=0 の面）
  function toWorld(sx, sy) { return { x: (sx - W / 2) / ppu, y: -(sy - H / 2) / ppu }; }
  // #app の中の座標(1920×1080基準) → world
  function appToWorld(ax, ay) {
    var r = appRect();
    return toWorld(r.left + ax * r.width / 1920, r.top + ay * r.height / 1080);
  }
  // 1920基準で 100px の大きさ → world の長さ（物の大きさの単位）
  function unit() { return 100 * appScale() / ppu; }
  function rectOf(id) {
    var e = typeof id === 'string' ? document.getElementById(id) : id;
    if (!e) return null;
    var r = e.getBoundingClientRect();
    return (r.width > 0 && r.height > 0) ? r : null;
  }

  /* =======================================================================
     素材（トゥーン質感・輪郭）
     ======================================================================= */
  function makeGradient() {
    // 3段階のトゥーン（暗・中・明）。紙らしく、暗い段もあまり暗くしない
    var data = new Uint8Array([150, 150, 150, 255, 210, 210, 210, 255, 255, 255, 255, 255]);
    var tex = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
    tex.minFilter = tex.magFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    return tex;
  }
  function toon(color, extra) {
    var o = { color: color, gradientMap: gradientMap, transparent: true, opacity: 1 };
    if (extra) for (var k in extra) o[k] = extra[k];
    return new THREE.MeshToonMaterial(o);
  }
  // 少し太めの輪郭: 裏面だけを ink 色で ひとまわり大きく描く（インバーテッド・ハル）
  function withOutline(geo, mat, thick, mats) {
    var g = new THREE.Group();
    var m = new THREE.Mesh(geo, mat);
    var lineMat = new THREE.MeshBasicMaterial({ color: C.ink, side: THREE.BackSide, transparent: true, opacity: 1 });
    var o = new THREE.Mesh(geo, lineMat);
    o.scale.setScalar(1 + (thick || 0.06));
    g.add(o); g.add(m);
    if (mats) { mats.push(lineMat); if (Array.isArray(mat)) mats.push.apply(mats, mat); else mats.push(mat); }
    g.userData.body = m;
    return g;
  }
  function setOpacity(mats, a) { for (var i = 0; i < mats.length; i++) mats[i].opacity = a; }
  function disposeTree(obj) {
    obj.traverse(function (o) {
      if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
      if (o.material) {
        var ms = Array.isArray(o.material) ? o.material : [o.material];
        ms.forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); });
      }
    });
  }

  /* ---------- 形 ---------- */
  var GEO = {};
  function shared(g) { g.userData.shared = true; return g; }

  function heartGeo() {
    if (GEO.heart) return GEO.heart;
    var s = new THREE.Shape();
    s.moveTo(0, -0.5);
    s.bezierCurveTo(-0.28, -0.3, -0.56, -0.08, -0.52, 0.2);
    s.bezierCurveTo(-0.48, 0.42, -0.26, 0.5, -0.12, 0.46);
    s.bezierCurveTo(-0.05, 0.43, -0.01, 0.37, 0, 0.3);
    s.bezierCurveTo(0.01, 0.37, 0.05, 0.43, 0.12, 0.46);
    s.bezierCurveTo(0.26, 0.5, 0.48, 0.42, 0.52, 0.2);
    s.bezierCurveTo(0.56, -0.08, 0.28, -0.3, 0, -0.5);
    var g = new THREE.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 2, curveSegments: 10 });
    g.center();
    return (GEO.heart = shared(g));
  }
  // しずくの形（下が丸く、上が細い）。ほのお／しずく 共通
  function dropGeo() {
    if (GEO.drop) return GEO.drop;
    var pts = [], N = 14;
    for (var i = 0; i <= N; i++) {
      var t = i / N;                       // 0=上の先 → 1=下
      var a = t * Math.PI;
      var r = Math.sin(a) * (0.12 + 0.2 * t);   // 下ほど太い
      var y = 0.42 - t * 0.72 - (t > .7 ? (t - .7) * 0.15 : 0);
      pts.push(new THREE.Vector2(Math.max(0.0001, r), y));
    }
    pts.reverse();                         // 下→上の順にして 面を外向きに
    var g = new THREE.LatheGeometry(pts, 18);
    return (GEO.drop = shared(g));
  }
  function confettiGeo() {
    if (GEO.conf) return GEO.conf;
    return (GEO.conf = shared(new THREE.PlaneGeometry(0.08, 0.12)));
  }

  /* ---------- こころの温度計（主役） ---------- */
  function makeThermometer(mats) {
    var g = new THREE.Group();
    var glassMat = toon(C.paper);
    // くだ（上は半球でふた）
    var tube = withOutline(new THREE.CylinderGeometry(0.18, 0.18, 1.6, 20, 1, true), glassMat, 0.07, mats);
    tube.position.y = 0.35;
    var cap = withOutline(new THREE.SphereGeometry(0.18, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), glassMat, 0.07, mats);
    cap.position.y = 0.35 + 0.8;
    // 玉（下）: いつも lv1（おちついた色）
    var bulb = withOutline(new THREE.SphereGeometry(0.35, 22, 16), toon(C.lv1), 0.06, mats);
    bulb.position.y = -0.62;
    g.add(tube, cap, bulb);
    // 中の液 3段（下 lv1・中 lv2・上 lv3）
    var segH = 1.5 / 3, liquids = [];
    [C.lv1, C.lv2, C.lv3].forEach(function (col, i) {
      var m = toon(col); mats.push(m);
      var mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, segH, 14), m);
      mesh.userData.base = -0.4 + i * segH;    // 段の下はし
      mesh.position.z = 0.03;
      g.add(mesh); liquids.push(mesh);
    });
    // 目もり（短い線を3本）
    for (var i = 0; i < 3; i++) {
      var lm = new THREE.MeshBasicMaterial({ color: C.ink, transparent: true }); mats.push(lm);
      var tick = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.025, 0.02), lm);
      tick.position.set(-0.3, -0.4 + (i + 1) * segH - 0.02, 0);
      g.add(tick);
    }
    // level: 0〜1（液の高さ）
    g.userData.setLevel = function (lv) {
      for (var i = 0; i < 3; i++) {
        var f = clamp01(lv * 3 - i);
        var m = liquids[i];
        m.visible = f > 0.01;
        m.scale.y = Math.max(f, 0.01);
        m.position.y = m.userData.base + segH * f / 2;
      }
    };
    g.userData.setLevel(0.33);
    return g;
  }

  /* ---------- ハート（いかりマーク）＋中の小さなほのお ---------- */
  function makeHeart(mats, withFlame) {
    var g = new THREE.Group();
    var h = withOutline(heartGeo(), toon(C.heart), 0.06, mats);
    g.add(h);
    if (withFlame) {
      var fm = toon(C.lv3); mats.push(fm);
      var flame = new THREE.Mesh(dropGeo(), fm);
      flame.scale.setScalar(0.55);
      flame.position.set(0, -0.02, 0.2);
      g.add(flame);
      g.userData.flame = flame; g.userData.flameMat = fm;
    }
    return g;
  }
  function makeDrop(mats, color) {
    var g = withOutline(dropGeo(), toon(color != null ? color : C.lv1), 0.08, mats);
    g.rotation.z = Math.PI;   // ほのおを さかさ → しずく
    return g;
  }

  /* ---------- メダル（1 ハート／2 温度計／3 て） ---------- */
  var MEDAL_ART = {
    1: function (c) {
      c.fillStyle = '#F6D9CF'; c.strokeStyle = '#33302C'; c.lineWidth = 5;
      var p = new Path2D('M120 172 C 92 152, 66 132, 68 104 C 70 84, 88 74, 102 76 C 110 78, 116 84, 120 92 C 124 84, 130 78, 140 76 C 154 74, 172 84, 172 104 C 172 132, 148 152, 120 172 Z');
      c.fill(p); c.stroke(p); num(c, '1', 120, 70);
    },
    2: function (c) {
      c.strokeStyle = '#33302C'; c.lineWidth = 5;
      rr(c, 106, 58, 28, 96, 14); c.fillStyle = '#F1D88A'; c.fill(); c.stroke();
      c.fillStyle = '#A9C6E3'; c.fillRect(109, 118, 22, 34);
      c.beginPath(); c.arc(120, 164, 22, 0, Math.PI * 2); c.fill(); c.stroke();
      num(c, '2', 168, 92);
    },
    3: function (c) {
      c.save(); c.translate(70, 66); c.scale(.85, .85);
      c.fillStyle = '#F2BC85'; c.strokeStyle = '#33302C'; c.lineWidth = 6; c.lineJoin = 'round';
      var p = new Path2D('M38 64 L 36 30 C 36 22, 47 22, 47 30 L 48 56 L 49 20 C 49 12, 60 12, 60 20 L 61 54 L 63 24 C 63 16, 74 16, 74 24 L 74 58 L 77 34 C 78 27, 88 28, 87 35 L 85 74 C 84 96, 72 108, 56 108 C 42 108, 32 100, 26 88 L 14 66 C 11 59, 20 54, 25 60 Z');
      c.fill(p); c.stroke(p); c.restore(); num(c, '3', 178, 92);
    }
  };
  function num(c, t, x, y) {
    c.fillStyle = '#2F6B62'; c.font = '700 26px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillText(t, x, y);
  }
  function rr(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function medalTexture(n, back) {
    var cv = document.createElement('canvas'); cv.width = cv.height = 256;
    var c = cv.getContext('2d');
    c.scale(256 / 240, 256 / 240);
    c.fillStyle = '#FBF7EF'; c.fillRect(0, 0, 240, 240);
    c.strokeStyle = '#2F6B62'; c.lineWidth = 3; c.setLineDash([6, 8]);
    c.beginPath(); c.arc(120, 120, 84, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
    if (!back && MEDAL_ART[n]) MEDAL_ART[n](c);
    var t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function makeMedal(n, mats) {
    var g = new THREE.Group();
    var R = 0.6, T = 0.08;
    // ふち（primary）
    var rimMat = toon(C.primary);
    var rim = withOutline(new THREE.CylinderGeometry(R, R, T, 40), rimMat, 0.035, mats);
    rim.rotation.x = Math.PI / 2;
    g.add(rim);
    // 表と裏（紙の色＋絵）。少しだけ前に出す
    // 表と裏は 紙の色そのまま（陰で灰色にならないよう 光の計算なし）
    var front = new THREE.MeshBasicMaterial({ map: medalTexture(n, false), transparent: true }); mats.push(front);
    var back = new THREE.MeshBasicMaterial({ map: medalTexture(n, true), transparent: true }); mats.push(back);
    var fm = new THREE.Mesh(new THREE.CircleGeometry(R * 0.9, 40), front);
    fm.position.z = T / 2 + 0.004;
    var bm = new THREE.Mesh(new THREE.CircleGeometry(R * 0.9, 40), back);
    bm.position.z = -T / 2 - 0.004; bm.rotation.y = Math.PI;
    g.add(fm, bm);
    // ふり返りで「やわらかく明るくなる」ための 後ろの光の輪（ふだんは見えない）
    var haloMat = new THREE.MeshBasicMaterial({ color: 0xFFF3C9, transparent: true, opacity: 0, depthWrite: false });
    var halo = new THREE.Mesh(new THREE.CircleGeometry(R * 1.35, 40), haloMat);
    halo.position.z = -T;
    g.add(halo);
    g.userData.haloMat = haloMat;
    return g;
  }

  /* =======================================================================
     ループ（動く物があるときだけ回す）
     ======================================================================= */
  function addActor(obj, update, mats, onEnd) {
    if (countObjects() + countTree(obj) > MAX_OBJECTS) { disposeTree(obj); if (onEnd) onEnd(); return null; }
    var a = { obj: obj, update: update, mats: mats || [], start: performance.now(), onEnd: onEnd };
    scene.add(obj);
    actors.push(a);
    kick();
    return a;
  }
  function removeActor(a) {
    var i = actors.indexOf(a);
    if (i >= 0) actors.splice(i, 1);
    if (a.obj.parent) a.obj.parent.remove(a.obj);
    disposeTree(a.obj);
    if (a.onEnd) { var f = a.onEnd; a.onEnd = null; f(); }
  }
  function countTree(o) { var n = 0; o.traverse(function (x) { if (x.isMesh) n += x.isInstancedMesh ? x.count : 1; }); return n; }
  function countObjects() { var n = 0; for (var i = 0; i < actors.length; i++) n += countTree(actors[i].obj); return n; }

  function kick() {
    if (!alive || rafId) return;
    lastNow = performance.now();
    rafId = requestAnimationFrame(frame);
  }
  function frame(now) {
    rafId = 0;
    if (!alive) return;
    var dt = Math.min(0.05, (now - lastNow) / 1000); lastNow = now;
    try {
      for (var i = actors.length - 1; i >= 0; i--) {
        var a = actors[i];
        var t = (now - a.start) / 1000;
        if (a.update(t, dt) === false) removeActor(a);
      }
      renderer.render(scene, camera);
    } catch (e) { fail(e); return; }
    for (var j = 0; j < actors.length; j++) if (!actors[j].sleeping) { rafId = requestAnimationFrame(frame); break; }
  }

  /* =======================================================================
     場面
     ======================================================================= */
  function setScene(name) {
    if (name === currentScene) return;
    currentScene = name;
    clearScene();
    if (name === 'title') buildTitle();
    else if (name === 'result') buildResult();
    // 'play': 何も置かない（#board の上で何も動かさない）
    kick();
  }
  function clearScene() {
    for (var i = actors.length - 1; i >= 0; i--) {
      var a = actors[i];
      if (a.persistent) removeActor(a);
    }
    titleGroup = resultGroup = null;
  }
  function wakeAll() { for (var i = 0; i < actors.length; i++) actors[i].sleeping = false; kick(); }

  /* ---------- タイトル ----------
     ハート（中に小さなほのお）と しずく が ポスターの右の空間に 奥から飛び出し、
     ゆっくり回りながら浮かぶ。まとまりごと少し回り込む。
     （温度計は SVG の .title-ondokei があるので 3D では出さない）
     置き場所: #app 1920基準で 中心 (1580, 345)。上はしは 浮き・回り込み・飛び出しの行きすぎを入れても
     y≒240 より下（設定ボタンの帯 y≦164 から 70px 以上あける）。下はしは y≒440 で、
     せんせい（y520〜）・SVG温度計（y500〜）・「はじめる」（ポスターの中）にかからない。
     ほのおが 大きく赤く → 小さく青く（いかりは 下げられる）。1周 9秒 */
  var TITLE_CENTER = { x: 1580, y: 345 };
  function buildTitle() {
    var mats = [];
    var root = new THREE.Group();
    var pivot = new THREE.Group(); root.add(pivot);
    var heart = makeHeart(mats, true);
    var drop = makeDrop(mats, C.lv1);
    var items = [
      { o: heart, x: -0.35, y: 0.05, z: 0.3, s: 1.45, delay: 0.0, spin: 0.35 },
      { o: drop, x: 1.5, y: -0.2, z: 0.2, s: 1.0, delay: 0.35, spin: 0.3, isDrop: true }
    ];
    items.forEach(function (it) { pivot.add(it.o); });
    var flameCol = new THREE.Color();
    var cHot = new THREE.Color(C.lv3), cCool = new THREE.Color(C.lv1);

    var a = addActor(root, function (t) {
      var R = reduced();
      // 位置（画面サイズが変わっても追従）
      var c = appToWorld(TITLE_CENTER.x, TITLE_CENTER.y), u = unit();
      root.position.set(c.x, c.y, 0);
      root.scale.setScalar(u);
      // まとまりの回り込み（とてもゆっくり、±0.28rad）
      pivot.rotation.y = R ? 0 : Math.sin(t * 0.35) * 0.28;
      pivot.rotation.x = R ? 0 : Math.sin(t * 0.23) * 0.05;

      items.forEach(function (it, i) {
        var o = it.o, e;
        if (R) {
          o.position.set(it.x, it.y, it.z);
          o.scale.setScalar(it.s);
          o.rotation.set(0, 0, it.isDrop ? Math.PI : 0);
        } else {
          e = easeOutBack((t - it.delay) / 1.3);           // 奥(-14)から飛び出す
          var tt = Math.max(0, t - it.delay - 1.3);
          o.position.set(it.x, it.y + Math.sin(tt * 0.9 + i * 2) * 0.1 * clamp01(tt), lerp(-14, it.z, e));
          o.scale.setScalar(it.s * Math.max(0.001, lerp(0.4, 1, easeOutCubic((t - it.delay) / 1.0))));
          o.rotation.y = (1 - easeOutCubic((t - it.delay) / 1.6)) * Math.PI * 1.5 + Math.sin(tt * it.spin + i) * 0.45;
          if (it.isDrop) o.rotation.z = Math.PI;
        }
      });
      // 全体のフェードイン
      var fade = clamp01(t / (R ? 0.8 : 0.5));
      setOpacity(mats, fade);

      // いかりの大きさ: 上がる → しばらく → 下がる（いかりは 下げられる）
      var cyc = ((t - 1.8) % 9 + 9) % 9, hot;
      if (t < 1.8) hot = 0;
      else if (cyc < 3) hot = easeInOut(cyc / 3);
      else if (cyc < 4.5) hot = 1;
      else if (cyc < 7.5) hot = 1 - easeInOut((cyc - 4.5) / 3);
      else hot = 0;
      if (R) hot = 0;
      if (R && t > 1 && a) a.sleeping = true;   // うごき すくなめ: 表示が終わったら止める
      // ほのお: 小さく青い ⇔ 大きく やさしい赤（ハートの中に おさまる大きさ）
      heart.userData.flame.scale.setScalar(0.34 + 0.34 * hot);
      heart.userData.flame.position.y = -0.04 + 0.04 * hot;
      flameCol.copy(cCool).lerp(cHot, hot);
      heart.userData.flameMat.color.copy(flameCol);
      return true;
    }, mats);
    if (a) { a.persistent = true; titleGroup = root; }
  }

  /* ---------- ふり返り ----------
     .result-item の メダル画像に 重ねて 3D メダルが並び（1つずつ ふわっと着地）、
     そのあと 1つずつ順に やわらかく明るくなる（1.4秒おき、1つ1回だけ。点滅にしない） */
  function buildResult() {
    var root = new THREE.Group();
    var medals = [], mats = [];
    for (var n = 1; n <= 3; n++) {
      var mm = [];
      var m = makeMedal(n, mm);
      root.add(m);
      medals.push({ o: m, mats: mm, halo: m.userData.haloMat });
      mats.push.apply(mats, mm);
    }
    var a = addActor(root, function (t) {
      var R = reduced(), u = unit();
      var imgs = document.querySelectorAll('#screen-result .result-item img');
      medals.forEach(function (md, i) {
        var r = imgs[i] ? imgs[i].getBoundingClientRect() : null, p, size;
        if (r && r.width > 0) { p = toWorld(r.left + r.width / 2, r.top + r.height / 2); size = (r.width / ppu) / 1.2; }
        else { p = appToWorld(1600, 330 + i * 200); size = u * 1.4; }   // 画像が無いとき: 右の列にたてに並べる
        var d = 0.25 + i * 0.35;                        // 1つずつ
        var k = (t - d) / 0.9;
        var o = md.o;
        if (R) {
          o.position.set(p.x, p.y, 0); o.rotation.set(0, 0, 0); o.scale.setScalar(size);
        } else {
          o.position.set(p.x, p.y + (1 - easeOutBounce(k)) * 1.2 * u, 0);
          o.rotation.set(0, (1 - easeOutCubic(k)) * Math.PI * 2, 0);
          o.scale.setScalar(size * Math.max(0.001, spring(k * 0.9, 6)));
        }
        var op = clamp01((t - d) / 0.4);
        if (a && a.fadeFrom != null) op *= 1 - clamp01((t - a.fadeFrom) / 0.4);
        setOpacity(md.mats, op);
        // 順番に光る: 2.2秒後から 1.4秒おき。1つにつき 1回だけ、1.2秒かけて ゆっくり明るく→戻る
        var g = 0;
        if (!R) {
          var gs = 2.2 + i * 1.4, gt = (t - gs) / 1.2;
          if (gt > 0 && gt < 1) g = Math.sin(gt * Math.PI);
          o.position.z = g * 0.4;   // 光るとき 少し手前に
          o.scale.multiplyScalar(1 + g * 0.08);
        }
        md.halo.opacity = 0.85 * g * op;
      });
      // すべて光り終わったら ループを止める（物は残す。画面サイズが変わったら起こして置き直す）
      if (t > 7 && a) a.sleeping = true;
      return true;
    }, mats);
    if (a) { a.persistent = true; resultGroup = root; }
  }

  /* =======================================================================
     せいかい celebrate(x, y)  1.3秒
     紙ふぶき（40枚）＋小さなハート5つが ふわっと広がる。ほのおは使わない。
     #teacher の上に ハートが1つ ぴょんと はねる（キャラのジャンプに合わせる）
     ======================================================================= */
  var CONF_COLORS;
  function celebrate(sx, sy) {
    if (sx == null || sy == null || isNaN(sx)) { sx = W / 2; sy = H / 2; }
    var p = toWorld(sx, sy), u = unit(), R = reduced();
    if (!CONF_COLORS) CONF_COLORS = [C.paper, C.lv1, C.lv2, C.can, C.primary].map(function (c) { return new THREE.Color(c); });

    var root = new THREE.Group();
    root.position.set(p.x, p.y, 0.5);
    root.scale.setScalar(u);
    var mats = [];
    var DUR = 1.3;

    // 紙ふぶき（InstancedMesh 1つ）
    var N = R ? 0 : 40, conf = null, parts = [];
    if (N) {
      var cm = new THREE.MeshToonMaterial({ gradientMap: gradientMap, side: THREE.DoubleSide, transparent: true });
      mats.push(cm);
      conf = new THREE.InstancedMesh(confettiGeo(), cm, N);
      conf.frustumCulled = false;
      for (var i = 0; i < N; i++) {
        var ang = Math.random() * Math.PI * 2, sp = 1.4 + Math.random() * 1.6;
        parts.push({
          vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp * 0.8 + 1.2, vz: (Math.random() - .5) * 1.5,
          rx: Math.random() * 6, ry: Math.random() * 6, wr: 4 + Math.random() * 5, s: 1.2 + Math.random() * 0.9
        });
        conf.setColorAt(i, CONF_COLORS[i % CONF_COLORS.length]);
      }
      conf.instanceColor.needsUpdate = true;
      root.add(conf);
    }
    // 小さなハート
    var hearts = [], HN = 5;
    for (var h = 0; h < HN; h++) {
      var hm = [];
      var hg = makeHeart(hm, false);
      mats.push.apply(mats, hm);
      var ha = (h / HN) * Math.PI * 2 + 0.3;
      hearts.push({ o: hg, dx: Math.cos(ha) * 1.1, dy: Math.sin(ha) * 0.8 + 0.25, rot: (Math.random() - .5) * 0.6 });
      root.add(hg);
    }
    var m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();

    addActor(root, function (t) {
      var k = t / DUR;
      if (k >= 1) return false;
      if (conf) {
        for (var i = 0; i < N; i++) {
          var pp = parts[i];
          // 空気抵抗つきで広がり、少し落ちる（ひらひら）
          var dr = (1 - Math.exp(-2.4 * t)) / 2.4;
          v.set(pp.vx * dr + Math.sin(t * pp.wr) * 0.05, pp.vy * dr - 0.9 * t * t, pp.vz * dr);
          e3.set(pp.rx + t * pp.wr, pp.ry + t * pp.wr * 0.7, 0);
          q.setFromEuler(e3);
          sc.setScalar(pp.s * (k < 0.08 ? k / 0.08 : 1));
          m4.compose(v, q, sc);
          conf.setMatrixAt(i, m4);
        }
        conf.instanceMatrix.needsUpdate = true;
      }
      hearts.forEach(function (hh, i) {
        var e = R ? 1 : spring(t * 1.1, 6);
        hh.o.position.set(hh.dx * e * (R ? 0.9 : 1), hh.dy * e + (R ? 0 : t * 0.25), 0.2);
        hh.o.scale.setScalar(0.32 * (R ? easeOutCubic(k * 4) : Math.max(0.001, e)));
        hh.o.rotation.set(0, R ? 0 : Math.sin(t * 3 + i) * 0.5, hh.rot);
      });
      // 終わりの 35% で ふわっと消える
      setOpacity(mats, R ? Math.sin(clamp01(k) * Math.PI) : (k < 0.65 ? 1 : 1 - (k - 0.65) / 0.35));
      return true;
    }, mats);

    teacherHop();
  }
  function teacherHop() {
    var r = rectOf('teacher');
    if (!r) return;
    var R = reduced(), mats = [];
    var hg = makeHeart(mats, false);
    var base = toWorld(r.left + r.width * 0.5, r.top + r.height * 0.02);
    var u = unit();
    addActor(hg, function (t) {
      var D = 1.2, k = t / D;
      if (k >= 1) return false;
      var hop = R ? 0 : Math.sin(clamp01(k / 0.5) * Math.PI) * 0.7 * u;  // ぴょん
      hg.position.set(base.x, base.y + 0.2 * u + hop, 1);
      var s = 0.45 * u * (R ? 1 : (k < 0.5 ? spring(t * 2, 7) : 1));
      // 着地で少しつぶれる
      var squash = (!R && k > 0.5 && k < 0.65) ? 1 - Math.sin((k - 0.5) / 0.15 * Math.PI) * 0.18 : 1;
      hg.scale.set(s / squash, s * squash, s);
      setOpacity(mats, R ? Math.sin(k * Math.PI) : (k < 0.75 ? clamp01(k / 0.08) : 1 - (k - 0.75) / 0.25));
      return true;
    }, mats);
  }

  /* =======================================================================
     まちがい encourage()  1.4秒
     せんせいの頭の上に しずくが1つ。ぽとんと落ちて 小さくはね、消える。
     赤・×・ゆれは使わない（せんせいの首かしげは CSS の .is-thinking）
     ======================================================================= */
  function encourage() {
    var r = rectOf('teacher'), R = reduced(), u = unit();
    var start = r ? toWorld(r.left + r.width * 0.78, r.top - 10 * appScale()) : appToWorld(1650, 560);
    var mats = [];
    var d = makeDrop(mats, C.lv1);
    var D = R ? 1.2 : 1.4;
    addActor(d, function (t) {
      var k = t / D;
      if (k >= 1) return false;
      var s = 0.45 * u, y = start.y, sq = 1;
      if (!R) {
        var fall = clamp01((k - 0.2) / 0.45);        // 0.2〜0.65 で落ちる
        y = start.y + 0.35 * u - easeOutBounce(fall) * 0.6 * u;
        s *= k < 0.2 ? easeOutBack(k / 0.2) : 1;
        if (fall > 0.33 && fall < 0.5) sq = 1 - Math.sin((fall - .33) / .17 * Math.PI) * 0.2; // ぽとん
      }
      d.position.set(start.x, y, 1);
      d.scale.set(s / sq, s * sq, s);
      setOpacity(mats, R ? Math.sin(k * Math.PI) : (k < 0.12 ? k / 0.12 : k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1));
      return true;
    }, mats);
  }

  /* =======================================================================
     ステップクリア stepClear(n)  1.9秒（Promise）
     メダル（1 ハート／2 温度計／3 て）が 上から くるっと回って おりてきて、
     #clear-medal の位置に 紙へ「ポン」と押される（つぶれて もどる）。
     そのあと まわりに 紙ふぶきが少し広がり、ふわっと消えて 下の画像（medal-step{n}.svg）に つながる
     ======================================================================= */
  function stepClear(n) {
    n = Math.max(1, Math.min(3, parseInt(n, 10) || 1));
    var R = reduced();
    var D = R ? 1.2 : 1.9;
    return new Promise(function (resolve) {
      var done = false;
      var finish = function () { if (done) return; done = true; var i = pending.indexOf(finish); if (i >= 0) pending.splice(i, 1); resolve(); };
      pending.push(finish);
      // rAF が止まっても（タブが裏など）必ず終わる
      setTimeout(finish, D * 1000 + 150);
      if (!alive) { finish(); return; }

      var mats = [];
      var medal = makeMedal(n, mats);
      var shadowMat = new THREE.MeshBasicMaterial({ color: C.ink, transparent: true, opacity: 0, depthWrite: false });
      mats.push(shadowMat);
      var shadow = new THREE.Mesh(new THREE.CircleGeometry(0.62, 32), shadowMat);  // 紙に落ちる やわらかい影
      var root = new THREE.Group();
      root.add(shadow, medal);
      var burstDone = false;

      addActor(root, function (t) {
        var k = t / D;
        if (k >= 1) return false;
        var r = rectOf('clear-medal'), p, size;
        if (r) { p = toWorld(r.left + r.width / 2, r.top + r.height / 2); size = (r.width / ppu) / 1.2; }
        else { var a = appRect(); p = toWorld(a.left + a.width * 0.36, a.top + a.height * 0.5); size = unit() * 2.5; }
        root.position.set(p.x, p.y, 0);
        shadow.position.set(0.06 * size, -0.08 * size, -0.2);
        shadow.scale.setScalar(size);

        if (R) {
          medal.position.set(0, 0, 0); medal.rotation.set(0, 0, 0); medal.scale.setScalar(size);
          var op = k < 0.3 ? k / 0.3 : k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1;
          setOpacity(mats, op); shadowMat.opacity = 0;
          return true;
        }
        // 0〜0.95秒: 上・手前から くるっと（Y 2回転）回りながら おりる
        var T1 = 0.95, T2 = 1.15, T3 = 1.5;
        var z, sx = 1, sy = 1, sz = 1, rotY;
        if (t < T1) {
          var e = easeOutCubic(t / T1);
          z = lerp(7, 0.9, e);
          medal.position.y = lerp(1.2, 0, e) * size;
          rotY = (1 - e) * Math.PI * 4;
          medal.rotation.x = (1 - e) * -0.5;
        } else if (t < T2) {
          // ポン: 紙に押しつける
          var e2 = easeInQuad((t - T1) / (T2 - T1));
          z = lerp(0.9, 0, e2); medal.position.y = 0; rotY = 0; medal.rotation.x = 0;
        } else {
          // 押されて つぶれ → ばねで もどる
          z = 0; medal.position.y = 0; rotY = 0;
          var s = spring((t - T2) * 1.0, 9);
          var squash = 1 - (1 - s) * 0.5;    // 0.5 → 1
          sx = sy = 1 + (1 - squash) * 0.35; sz = squash;
          if (!burstDone) { burstDone = true; ring(p, size); }
        }
        medal.position.z = z * size;
        medal.rotation.y = rotY;
        medal.scale.set(size * sx, size * sy, size * sz);
        shadowMat.opacity = 0.18 * clamp01(1 - z / 7) * (k > 0.8 ? 1 - (k - 0.8) / 0.2 : 1);
        var opm = t < 0.15 ? t / 0.15 : t > T3 ? 1 - (t - T3) / (D - T3) : 1;
        setOpacity(mats.filter(function (m) { return m !== shadowMat; }), opm);
        return true;
      }, mats, finish);
    });
  }
  // メダルが押されたときの 紙ふぶきの輪（小さめ・0.9秒）
  function ring(p, size) {
    if (!CONF_COLORS) CONF_COLORS = [C.paper, C.lv1, C.lv2, C.can, C.primary].map(function (c) { return new THREE.Color(c); });
    var N = 28, mats = [];
    var cm = new THREE.MeshToonMaterial({ gradientMap: gradientMap, side: THREE.DoubleSide, transparent: true });
    mats.push(cm);
    var inst = new THREE.InstancedMesh(confettiGeo(), cm, N);
    inst.frustumCulled = false;
    var ps = [];
    for (var i = 0; i < N; i++) {
      var a = i / N * Math.PI * 2 + Math.random() * 0.2;
      ps.push({ a: a, sp: 0.8 + Math.random() * 0.4, r: Math.random() * 6, w: 3 + Math.random() * 4 });
      inst.setColorAt(i, CONF_COLORS[i % CONF_COLORS.length]);
    }
    inst.instanceColor.needsUpdate = true;
    var g = new THREE.Group(); g.add(inst);
    g.position.set(p.x, p.y, 0.3); g.scale.setScalar(size);
    var m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3(1.6, 1.6, 1.6);
    addActor(g, function (t) {
      var k = t / 0.9;
      if (k >= 1) return false;
      var d = 0.62 + easeOutCubic(k) * 0.55;
      for (var i = 0; i < N; i++) {
        var pp = ps[i];
        v.set(Math.cos(pp.a) * d * pp.sp, Math.sin(pp.a) * d * pp.sp - k * k * 0.15, 0.1);
        e3.set(pp.r + t * pp.w, pp.r * 0.5 + t * pp.w, 0); q.setFromEuler(e3);
        m4.compose(v, q, sc); inst.setMatrixAt(i, m4);
      }
      inst.instanceMatrix.needsUpdate = true;
      setOpacity(mats, k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4);
      return true;
    }, mats);
  }

  function flushPending() {
    var p = pending.slice(); pending = [];
    p.forEach(function (f) { try { f(); } catch (e) {} });
  }

})();
