/* =========================================================================
   motion3d.js ― はれ？ あめ？ よていづくり（3D演出）
   チーム02 3Dモーション担当

   読み込み順: lib/three.min.js → motion3d.js → game.js（どれも普通の <script>）
   使い方:
     Motion3D.init(document.getElementById('stage3d'), { theme: THEME })
     Motion3D.setScene('title' | 'play' | 'result')
     Motion3D.celebrate(x, y)          // 画面座標(px)。getBoundingClientRect() の値そのまま
                                       // （3つめに { small: true } で紙ふぶき少なめ。
                                       //   押した所が .day-cell なら 自動で少なめ）
     Motion3D.encourage()
     await Motion3D.stepClear(n)       // n = 1〜4。1.75秒で resolve（2秒以内）
                                       //   4 は 四角い手帳の シール（design.md 12-11）
     Motion3D.setReducedMotion(bool)

   ふり返り（setScene('result')）の上の帯のシール
     - 1〜3 は今までどおり いつも出す（x260・420・580）
     - 4 は x740。ステップ4を クリアしたときだけ出す。決め方:
         1) setScene('result', { medals: [1,2,3,4] }) のように渡されたら その番号だけ
         2) 渡されないときは ふり返り画面を見て決める:
            .board--result.is-s4 がある か、
            #result-list .result-item の img が medal-step4 なら 出す
            （game.js が setScene('result') のあとに リストを作っても 間に合うよう、
              4つめが出る前（1.2秒）まで 毎フレーム たしかめる）

   守っていること（design.md 8章）
   - タイトルの3Dは #app 1920基準の x1100–1580・y240–960 の中だけ。
     物の置き場所に余白をとったうえで、さらに その四角の外は描かない（はさみ切り＝scissor）。
     左の手帳のページ・右上の #settings・右下のせんぱい には かからない
   - 問題中（play）は何も置かない。ずっと動く物はない
   - 点滅なし・画面全体のフラッシュなし・カメラの揺れなし
   - うごき すくなめ / prefers-reduced-motion: 回転・飛び出し・紙ふぶきを止め、ふわっと出すだけ
   - WebGLが使えない／three.min.js が無い → 何もしない関数に切りかえる（ゲームは止めない）
   - 物体は同時に300個まで。影を落とすライトは使わない（トゥーンの陰影＋紙に落ちる うすい影の板）
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
    setScene: function (s, o) { safe(function () { setScene(s, o); }); },
    celebrate: function (x, y, o) { safe(function () { celebrate(x, y, o); }); },
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
  var rafId = 0, lastNow = 0;
  var pending = [];                         // stepClear の resolve
  var C = {};                               // 色
  var MAX_OBJECTS = 300;

  // タイトルの3Dを出してよい四角（#app 1920×1080 基準）
  var TITLE_AREA = { x1: 1100, y1: 240, x2: 1580, y2: 960 };

  var DEFAULT_THEME = {
    page: 0xFCFAF4, cover: 0x3B5747, ink: 0x2B2F33, primary: 0x2E5E4E, tape: 0xE4C77E,
    sun: 0xE0663A, sunLight: 0xF2A57E, cloud: 0xA9AFB5, cloudLight: 0xCED2D6,
    rain: 0x3D7DBE, rainLight: 0x9CC0E4, soto: 0xA8D3E6, naka: 0xB7865A, grass: 0x8DB07A
  };

  function reduced() { return userReduced || osReduced; }

  /* ---------- イージング ---------- */
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOutCubic(t) { t = clamp01(t); return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { t = clamp01(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeInQuad(t) { t = clamp01(t); return t * t; }
  function easeOutBack(t, s) { t = clamp01(t); var c1 = s || 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
  // ばね: 0→1 に行きすぎて戻る（減衰）
  function spring(t, k) { t = Math.max(0, t); k = k || 7; return 1 - Math.exp(-k * t) * Math.cos(k * 1.35 * t); }
  // バウンド
  function easeOutBounce(t) {
    t = clamp01(t); var n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375;
    return n * (t -= 2.625 / d) * t + .984375;
  }
  // ふわっと出て ふわっと消える（0〜1 の k に対して）
  function fadeInOut(k, a, b) { return k < a ? clamp01(k / a) : k > b ? clamp01(1 - (k - b) / (1 - b)) : 1; }

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

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.shadowMap.enabled = false;
      renderer.autoClear = false;
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

      // やわらかい光: 空（白）と床（紙の色）＋ななめ上から1灯（影は落とさない）
      scene.add(new THREE.HemisphereLight(0xFFFFFF, C.page, 0.95));
      var key = new THREE.DirectionalLight(0xFFFFFF, 1.5);
      key.position.set(-4, 6, 8);
      scene.add(key);

      gradientMap = makeGradient();
      preloadMedals();

      if (window.matchMedia) {
        var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        osReduced = mq.matches;
        var onMq = function () { osReduced = mq.matches; wakeAll(); };
        if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq);
      }

      resize();
      window.addEventListener('resize', function () { resize(); wakeAll(); });
      // おやすみ画面が出ている間は 3D を隠す
      setInterval(function () {
        if (!alive) return;
        var rest = document.getElementById('rest-overlay');
        var v = (rest && rest.classList.contains('is-show')) ? 'hidden' : 'visible';
        if (renderer.domElement.style.visibility !== v) renderer.domElement.style.visibility = v;
      }, 250);
      if (window.ResizeObserver) new ResizeObserver(function () { resize(); wakeAll(); }).observe(el);

      alive = true;
      api.available = true;
      draw();
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
  function appToScreen(ax, ay) { var r = appRect(); return { x: r.left + ax * r.width / 1920, y: r.top + ay * r.height / 1080 }; }
  function appToWorld(ax, ay) { var s = appToScreen(ax, ay); return toWorld(s.x, s.y); }
  // 1920基準で 100px → world の長さ
  function unit() { return 100 * appScale() / ppu; }
  function rectOf(id) {
    var e = typeof id === 'string' ? document.getElementById(id) : id;
    if (!e) return null;
    var r = e.getBoundingClientRect();
    return (r.width > 0 && r.height > 0) ? r : null;
  }
  // 奥（z<0）・手前（z>0）に置いても、画面の上では (wx, wy) に見える位置
  function atDepth(wx, wy, z) { var f = (CAM_Z - z) / CAM_Z; return { x: wx * f, y: wy * f, z: z }; }

  /* =======================================================================
     素材（トゥーン質感・輪郭）
     ======================================================================= */
  function makeGradient() {
    // 3段のトゥーン。紙らしく、暗い段も あまり暗くしない
    var data = new Uint8Array([165, 165, 165, 255, 220, 220, 220, 255, 255, 255, 255, 255]);
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
  // 手描きの線: 裏面だけを ink 色で ひとまわり大きく描く
  function outlined(geo, mat, thick, mats) {
    var g = new THREE.Group();
    var line = new THREE.MeshBasicMaterial({ color: C.ink, side: THREE.BackSide, transparent: true, opacity: 1 });
    var o = new THREE.Mesh(geo, line);
    o.scale.setScalar(1 + (thick || 0.06));
    var m = new THREE.Mesh(geo, mat);
    g.add(o, m);
    if (mats) { mats.push(line); mats.push(mat); }
    g.userData.body = m;
    return g;
  }
  function setOpacity(mats, a) { for (var i = 0; i < mats.length; i++) mats[i].opacity = a; }
  function disposeTree(obj) {
    obj.traverse(function (o) {
      if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
      if (o.material) {
        var ms = Array.isArray(o.material) ? o.material : [o.material];
        ms.forEach(function (m) { if (m.map && !m.map.userData.shared) m.map.dispose(); m.dispose(); });
      }
    });
  }

  /* ---------- 形（使い回す） ---------- */
  var GEO = {};
  function shared(g) { g.userData.shared = true; return g; }
  function G(name, make) { return GEO[name] || (GEO[name] = shared(make())); }

  function dropGeo() {
    return G('drop', function () {
      var pts = [], N = 14;
      for (var i = 0; i <= N; i++) {
        var t = i / N;                         // 0=上の先 → 1=下
        var r = Math.sin(t * Math.PI) * (0.1 + 0.22 * t);
        var y = 0.4 - t * 0.7;
        pts.push(new THREE.Vector2(Math.max(0.0001, r), y));
      }
      pts.reverse();
      return new THREE.LatheGeometry(pts, 16);
    });
  }

  /* ---------- おひさま（主役1）: つぶした球＋まわりに光の点8つ ---------- */
  function makeSun(mats) {
    var g = new THREE.Group();
    var body = outlined(G('sunBody', function () { return new THREE.SphereGeometry(0.5, 28, 18); }), toon(C.sun), 0.06, mats);
    body.scale.z = 0.6;
    g.add(body);
    // ハイライト（左上に sunLight の小さな板）
    var hm = toon(C.sunLight); mats.push(hm);
    var hl = new THREE.Mesh(G('sunHl', function () { return new THREE.SphereGeometry(0.13, 14, 10); }), hm);
    hl.scale.set(1.1, 0.7, 0.3);
    hl.position.set(-0.2, 0.22, 0.27);
    hl.rotation.z = 0.6;
    g.add(hl);
    var rays = new THREE.Group();
    var rg = G('ray', function () { return new THREE.SphereGeometry(0.11, 12, 8); });
    var rayMat = toon(C.sun);
    var rayLine = new THREE.MeshBasicMaterial({ color: C.ink, side: THREE.BackSide, transparent: true });
    mats.push(rayMat, rayLine);
    for (var i = 0; i < 8; i++) {
      var a = i / 8 * Math.PI * 2;
      var o = new THREE.Mesh(rg, rayLine); o.scale.setScalar(1.14);
      var m = new THREE.Mesh(rg, rayMat);
      o.position.set(Math.cos(a) * 0.85, Math.sin(a) * 0.85, 0);
      m.position.copy(o.position);
      rays.add(o, m);
    }
    g.add(rays);
    g.userData.rays = rays;
    return g;
  }

  /* ---------- くも（主役2）: 球を5つ重ね、下を平らに ---------- */
  function makeCloud(mats) {
    var g = new THREE.Group();
    var inner = new THREE.Group();
    var sg = G('cloudBall', function () { return new THREE.SphereGeometry(1, 22, 14); });
    var body = toon(C.cloud);
    var line = new THREE.MeshBasicMaterial({ color: C.ink, side: THREE.BackSide, transparent: true });
    mats.push(body, line);
    var balls = [[-0.72, -0.05, 0.3], [-0.3, 0.18, 0.42], [0.18, 0.24, 0.45], [0.6, 0.02, 0.34], [-0.05, -0.08, 0.38]];
    balls.forEach(function (b) {
      var o = new THREE.Mesh(sg, line); o.scale.setScalar(b[2] * 1.07); o.position.set(b[0], b[1], 0);
      var m = new THREE.Mesh(sg, body); m.scale.setScalar(b[2]); m.position.set(b[0], b[1], 0);
      inner.add(o, m);
    });
    // 上に cloudLight の小さな球（ハイライト）
    var lm = toon(C.cloudLight); mats.push(lm);
    [[-0.32, 0.36, 0.16], [0.12, 0.44, 0.14]].forEach(function (b) {
      var m = new THREE.Mesh(sg, lm); m.scale.set(b[2] * 1.3, b[2] * 0.8, b[2] * 0.6);
      m.position.set(b[0], b[1], 0.34);
      inner.add(m);
    });
    inner.scale.set(1, 0.8, 0.75);              // 下を平らぎみに
    g.add(inner);
    return g;
  }

  /* ---------- かさ（主役3）: 8面の半球（1面おきに rain / rainLight）＋J の え ---------- */
  function makeUmbrella(mats) {
    var g = new THREE.Group();
    var canopy = new THREE.Group();
    var mA = toon(C.rain, { side: THREE.DoubleSide }), mB = toon(C.rainLight, { side: THREE.DoubleSide });
    var line = new THREE.MeshBasicMaterial({ color: C.ink, side: THREE.BackSide, transparent: true });
    mats.push(mA, mB, line);
    for (var i = 0; i < 8; i++) {
      var geo = G('canopy' + i, (function (i) {
        return function () { return new THREE.SphereGeometry(0.7, 3, 6, i * Math.PI / 4, Math.PI / 4, 0, Math.PI / 2); };
      })(i));
      var o = new THREE.Mesh(geo, line); o.scale.setScalar(1.05);
      canopy.add(o, new THREE.Mesh(geo, i % 2 ? mB : mA));
    }
    canopy.scale.y = 0.72;
    g.add(canopy);
    var inkMat = toon(C.ink); mats.push(inkMat);
    var tip = new THREE.Mesh(G('uTip', function () { return new THREE.SphereGeometry(0.07, 10, 8); }), inkMat);
    tip.position.y = 0.55;
    var stick = new THREE.Mesh(G('uStick', function () { return new THREE.CylinderGeometry(0.035, 0.035, 1.25, 8); }), inkMat);
    stick.position.y = -0.1;
    var hook = new THREE.Mesh(G('uHook', function () { return new THREE.TorusGeometry(0.13, 0.035, 8, 16, Math.PI); }), inkMat);
    hook.rotation.z = Math.PI;                  // 下向きの半円 → J の形
    hook.position.set(-0.13, -0.72, 0);
    g.add(tip, stick, hook);
    return g;
  }

  function makeDrop(mats) {
    var g = outlined(dropGeo(), toon(C.rainLight), 0.1, mats);
    return g;
  }

  /* ---------- クリアのシール（medal-step{n}.svg を表に貼る） ---------- */
  var MEDAL_SVG = /* assets/medal-step1〜4.svg と同じもの（file:// でも貼れるように中に入れた） */
    {"1":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 240 240\" role=\"img\" aria-label=\"ステップ1 クリアの シール（おひさま）\"> <path d=\"M224.6 120.3 C224.7 123.6 222.7 126.8 221.2 129.9 C219.7 133 216.3 135.7 215.7 138.9 C215.1 142.2 217.3 145.8 217.4 149.4 C217.6 153 218 157.4 216.8 160.4 C215.5 163.5 212.4 165.2 209.8 167.5 C207.3 169.9 203.4 171.7 201.5 174.5 C199.5 177.3 199.3 180.9 198.2 184.2 C197 187.6 196.6 192 194.3 194.4 C192.1 196.8 187.8 197.4 184.5 198.6 C181.2 199.7 177.2 199.3 174.3 201.1 C171.5 203 169.8 207.1 167.5 209.8 C165.1 212.5 163.5 216.1 160.5 217.3 C157.4 218.6 152.7 217.6 149.1 217.3 C145.5 217.1 142.1 215.3 138.9 216 C135.6 216.7 132.8 219.8 129.7 221.3 C126.6 222.8 123.5 225.3 120.3 225.3 C117 225.3 113.2 222.9 110 221.4 C106.7 219.8 103.9 216.9 100.7 216.2 C97.5 215.4 94.2 216.8 90.7 216.9 C87.2 217 82.8 218 79.7 216.7 C76.7 215.4 74.8 211.8 72.4 209.3 C70 206.7 68 203.1 65.3 201.3 C62.5 199.5 59 199.7 55.7 198.6 C52.5 197.4 48.1 196.9 45.8 194.5 C43.4 192.1 42.9 187.5 41.7 184.2 C40.5 180.8 40.5 176.9 38.5 174.2 C36.6 171.4 32.9 169.9 30.3 167.6 C27.6 165.2 23.8 163.1 22.7 160.1 C21.5 157.1 23 153.1 23.2 149.6 C23.3 146.1 24.2 142.2 23.6 138.9 C22.9 135.6 20.6 133.2 19.1 130 C17.6 126.8 14.6 123 14.6 119.7 C14.6 116.4 17.6 113.2 19 110.1 C20.5 107 22.9 104.4 23.5 101.1 C24.2 97.8 22.8 94.2 22.7 90.6 C22.6 87 21.7 82.8 23 79.7 C24.4 76.6 28.3 74.4 30.8 72.1 C33.4 69.7 36.6 68.3 38.5 65.6 C40.3 62.9 40.6 59.3 41.8 56 C43.1 52.7 43.6 48.2 46 45.8 C48.3 43.4 52.5 42.8 55.8 41.6 C59.1 40.5 63.2 40.8 65.9 38.9 C68.7 37 70 32.9 72.4 30.3 C74.7 27.6 76.9 24.1 79.9 22.9 C82.9 21.8 86.9 22.9 90.3 23.1 C93.8 23.3 97.4 24.7 100.7 24.1 C103.9 23.4 106.8 20.4 110 18.9 C113.3 17.5 116.8 15.1 120.2 15.2 C123.5 15.3 127.1 18 130.3 19.4 C133.5 20.8 136.1 23.1 139.4 23.7 C142.6 24.3 146.1 23 149.6 22.9 C153.1 22.7 157.5 21.7 160.5 23 C163.6 24.2 165.4 27.5 167.7 30.1 C170 32.7 171.7 36.7 174.4 38.5 C177.2 40.4 180.9 40.1 184.2 41.2 C187.5 42.4 191.9 43 194.2 45.4 C196.6 47.8 197 52.2 198.2 55.6 C199.4 58.9 199.5 62.8 201.4 65.6 C203.3 68.3 207 69.8 209.5 72.1 C212.1 74.4 215.4 76.3 216.7 79.4 C218 82.6 217.3 87.4 217.2 90.9 C217 94.5 215.3 97.5 215.9 100.8 C216.6 104 219.4 107 220.9 110.2 C222.3 113.5 224.6 117 224.6 120.3 Z\" fill=\"#FCFAF4\" stroke=\"#FCFAF4\" stroke-width=\"24\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M224.6 120.3 C224.7 123.6 222.7 126.8 221.2 129.9 C219.7 133 216.3 135.7 215.7 138.9 C215.1 142.2 217.3 145.8 217.4 149.4 C217.6 153 218 157.4 216.8 160.4 C215.5 163.5 212.4 165.2 209.8 167.5 C207.3 169.9 203.4 171.7 201.5 174.5 C199.5 177.3 199.3 180.9 198.2 184.2 C197 187.6 196.6 192 194.3 194.4 C192.1 196.8 187.8 197.4 184.5 198.6 C181.2 199.7 177.2 199.3 174.3 201.1 C171.5 203 169.8 207.1 167.5 209.8 C165.1 212.5 163.5 216.1 160.5 217.3 C157.4 218.6 152.7 217.6 149.1 217.3 C145.5 217.1 142.1 215.3 138.9 216 C135.6 216.7 132.8 219.8 129.7 221.3 C126.6 222.8 123.5 225.3 120.3 225.3 C117 225.3 113.2 222.9 110 221.4 C106.7 219.8 103.9 216.9 100.7 216.2 C97.5 215.4 94.2 216.8 90.7 216.9 C87.2 217 82.8 218 79.7 216.7 C76.7 215.4 74.8 211.8 72.4 209.3 C70 206.7 68 203.1 65.3 201.3 C62.5 199.5 59 199.7 55.7 198.6 C52.5 197.4 48.1 196.9 45.8 194.5 C43.4 192.1 42.9 187.5 41.7 184.2 C40.5 180.8 40.5 176.9 38.5 174.2 C36.6 171.4 32.9 169.9 30.3 167.6 C27.6 165.2 23.8 163.1 22.7 160.1 C21.5 157.1 23 153.1 23.2 149.6 C23.3 146.1 24.2 142.2 23.6 138.9 C22.9 135.6 20.6 133.2 19.1 130 C17.6 126.8 14.6 123 14.6 119.7 C14.6 116.4 17.6 113.2 19 110.1 C20.5 107 22.9 104.4 23.5 101.1 C24.2 97.8 22.8 94.2 22.7 90.6 C22.6 87 21.7 82.8 23 79.7 C24.4 76.6 28.3 74.4 30.8 72.1 C33.4 69.7 36.6 68.3 38.5 65.6 C40.3 62.9 40.6 59.3 41.8 56 C43.1 52.7 43.6 48.2 46 45.8 C48.3 43.4 52.5 42.8 55.8 41.6 C59.1 40.5 63.2 40.8 65.9 38.9 C68.7 37 70 32.9 72.4 30.3 C74.7 27.6 76.9 24.1 79.9 22.9 C82.9 21.8 86.9 22.9 90.3 23.1 C93.8 23.3 97.4 24.7 100.7 24.1 C103.9 23.4 106.8 20.4 110 18.9 C113.3 17.5 116.8 15.1 120.2 15.2 C123.5 15.3 127.1 18 130.3 19.4 C133.5 20.8 136.1 23.1 139.4 23.7 C142.6 24.3 146.1 23 149.6 22.9 C153.1 22.7 157.5 21.7 160.5 23 C163.6 24.2 165.4 27.5 167.7 30.1 C170 32.7 171.7 36.7 174.4 38.5 C177.2 40.4 180.9 40.1 184.2 41.2 C187.5 42.4 191.9 43 194.2 45.4 C196.6 47.8 197 52.2 198.2 55.6 C199.4 58.9 199.5 62.8 201.4 65.6 C203.3 68.3 207 69.8 209.5 72.1 C212.1 74.4 215.4 76.3 216.7 79.4 C218 82.6 217.3 87.4 217.2 90.9 C217 94.5 215.3 97.5 215.9 100.8 C216.6 104 219.4 107 220.9 110.2 C222.3 113.5 224.6 117 224.6 120.3 Z\" fill=\"#E4C77E\" stroke=\"#2B2F33\" stroke-width=\"6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M198 120.5 C197.9 126.7 196.5 132.2 194.9 138.1 C193.4 144 191.4 150.5 188.6 156 C185.8 161.6 182.1 166.9 178.2 171.5 C174.3 176.2 170.1 180.4 165.1 184.1 C160 187.8 153.7 191.4 147.8 193.7 C141.9 195.9 135.7 197 129.6 197.6 C123.5 198.2 117.5 197.8 111.1 197.2 C104.8 196.5 97.5 195.8 91.6 193.7 C85.7 191.5 80.9 187.9 75.7 184.3 C70.6 180.7 65.1 176.8 60.9 172.1 C56.8 167.5 53.6 161.9 50.7 156.5 C47.9 151 45.4 145.5 43.9 139.3 C42.4 133.2 41.6 126 41.8 119.6 C42 113.2 43.4 106.9 44.9 100.9 C46.4 94.9 47.7 89.3 50.6 83.7 C53.5 78.2 58.3 72.2 62.4 67.7 C66.5 63.1 70.3 59.7 75.2 56.3 C80.1 52.8 85.7 49.2 91.7 46.9 C97.6 44.7 104.7 43.7 111.1 42.9 C117.4 42.1 123.7 41.3 129.9 42 C136.1 42.6 142.5 44.5 148.3 46.8 C154.1 49.1 159.7 52.2 164.8 55.8 C169.9 59.3 175 63.7 179 68.2 C183 72.8 185.9 77.8 188.7 83.2 C191.5 88.6 194.2 94.4 195.7 100.6 C197.3 106.8 198.1 114.2 198 120.5 Z\" fill=\"#FCFAF4\" stroke=\"#2B2F33\" stroke-width=\"5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><g transform=\"translate(52 52) scale(.68)\"><path d=\"M143.6 99.2 C143.5 102 143.9 105.1 143.4 108.1 C142.9 111.2 141.8 114.6 140.3 117.6 C138.8 120.5 136.5 123.4 134.5 125.9 C132.5 128.4 130.6 130.7 128.3 132.5 C126.1 134.4 123.5 135.4 121 137.1 C118.5 138.8 116.3 141.6 113.4 142.6 C110.5 143.6 106.6 142.7 103.7 143.1 C100.7 143.5 98.6 145.1 95.7 144.8 C92.9 144.6 89.3 142.9 86.6 141.6 C83.8 140.3 81.7 138.6 79.1 137 C76.6 135.4 74 134.2 71.4 132.2 C68.8 130.2 65.6 127.2 63.5 124.9 C61.5 122.7 60.6 121.3 59.3 118.7 C58.1 116.1 56.7 112.5 56.2 109.3 C55.7 106.2 56.2 103 56.3 99.7 C56.5 96.4 56.7 92.9 57.1 89.8 C57.5 86.8 57.5 84 58.7 81.4 C60 78.8 62.9 76.3 64.8 74 C66.7 71.6 67.9 69.6 70.1 67.5 C72.3 65.4 75.1 62.9 77.9 61.4 C80.7 59.9 84.3 59.5 87.1 58.6 C89.9 57.8 91.9 56.7 94.8 56.4 C97.7 56.2 101.4 56.9 104.7 57.1 C107.9 57.3 111.1 57 114.1 57.6 C117.2 58.3 120.6 59.3 123.2 61 C125.7 62.7 127.3 65.7 129.2 67.9 C131.2 70.1 133.1 71.7 134.8 74.1 C136.4 76.5 137.6 79.7 139.1 82.5 C140.6 85.3 142.9 88.3 143.7 91 C144.4 93.8 143.6 96.3 143.6 99.2 Z\" fill=\"#FCFAF4\" stroke=\"#FCFAF4\" stroke-width=\"20\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M111.5 23.8 C111.5 25.3 110.9 27.4 110.1 28.9 C109.4 30.3 108.2 31.5 107 32.5 C105.7 33.6 104.4 34.9 102.9 35.3 C101.3 35.7 99.2 35.3 97.5 34.9 C95.8 34.5 93.8 33.8 92.6 32.8 C91.4 31.9 90.8 30.9 90.3 29.4 C89.7 27.8 89.4 25.4 89.4 23.7 C89.3 22.1 89.4 20.8 90 19.4 C90.5 18 91.4 16.5 92.6 15.4 C93.8 14.3 95.6 13.1 97.2 12.8 C98.7 12.5 100.4 13.2 101.9 13.6 C103.5 14 105.1 14.1 106.4 15.1 C107.7 16.1 108.9 18.2 109.8 19.7 C110.6 21.1 111.4 22.2 111.5 23.8 Z\" fill=\"#FCFAF4\" stroke=\"#FCFAF4\" stroke-width=\"20\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M164.2 46.2 C164.2 48 164.3 50 163.7 51.5 C163.2 53 162.3 54.4 161 55.3 C159.7 56.2 157.6 56.5 155.9 56.9 C154.3 57.2 152.5 57.9 151.1 57.4 C149.7 57 148.7 55.6 147.4 54.4 C146.2 53.3 144.3 52.1 143.4 50.7 C142.6 49.3 142.3 47.8 142.4 46.2 C142.5 44.7 143.3 42.6 143.9 41.2 C144.6 39.8 145.1 38.5 146.3 37.6 C147.5 36.6 149.4 35.9 151.1 35.6 C152.9 35.3 155.2 35.4 156.7 35.8 C158.3 36.1 159.4 36.9 160.6 37.8 C161.8 38.7 163.3 39.6 163.9 41 C164.5 42.4 164.3 44.4 164.2 46.2 Z\" fill=\"#FCFAF4\" stroke=\"#FCFAF4\" stroke-width=\"20\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M187.5 100.3 C187.5 101.9 187.2 103.8 186.4 105.1 C185.6 106.5 184.1 107.5 182.7 108.5 C181.3 109.4 179.6 110.6 178 110.9 C176.4 111.2 174.6 110.7 173 110.2 C171.5 109.8 170 109.2 168.8 108.2 C167.6 107.2 166.6 105.7 165.9 104.2 C165.2 102.8 164.4 101.1 164.4 99.6 C164.4 98.1 164.9 96.4 165.6 95.1 C166.3 93.8 167.2 92.9 168.6 91.8 C169.9 90.8 172.1 89.3 173.7 88.9 C175.3 88.4 176.6 88.7 178.2 89.1 C179.7 89.4 181.3 89.8 182.7 90.9 C184.1 92.1 185.5 94.3 186.3 95.8 C187.1 97.4 187.5 98.8 187.5 100.3 Z\" fill=\"#FCFAF4\" stroke=\"#FCFAF4\" stroke-width=\"20\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M164.7 153.7 C164.6 155.1 163.9 156.6 163.2 158 C162.4 159.4 161.5 161.1 160.4 162.1 C159.3 163.1 158.2 163.6 156.6 164.1 C155 164.5 152.3 165.4 150.7 165 C149.1 164.6 148.1 163.1 146.9 161.9 C145.8 160.7 144.6 159.2 143.9 157.9 C143.2 156.7 142.7 155.8 142.8 154.3 C142.8 152.9 143.6 150.8 144.3 149.2 C144.9 147.6 145.5 146 146.6 145 C147.7 144 149.3 143.6 150.9 143.3 C152.5 143.1 154.6 143.1 156.2 143.4 C157.8 143.6 159.1 143.8 160.4 144.8 C161.7 145.8 163.3 148.1 164 149.5 C164.7 151 164.8 152.3 164.7 153.7 Z\" fill=\"#FCFAF4\" stroke=\"#FCFAF4\" stroke-width=\"20\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M111.4 176.4 C111.5 177.9 111.1 179.7 110.3 181.1 C109.5 182.4 107.9 183.8 106.5 184.6 C105.2 185.5 103.9 185.9 102.3 186.2 C100.7 186.5 98.6 186.7 97 186.5 C95.4 186.2 93.9 185.8 92.9 184.8 C91.8 183.9 91.2 182.1 90.6 180.7 C90.1 179.3 89.5 178.2 89.5 176.6 C89.5 175 90.1 172.7 90.6 171.1 C91.2 169.5 91.7 168.1 92.8 167.1 C93.9 166 95.6 165.1 97.2 164.9 C98.8 164.7 100.9 165.3 102.6 165.8 C104.3 166.2 106 166.4 107.3 167.4 C108.5 168.3 109.4 170.1 110.1 171.6 C110.8 173.1 111.4 174.8 111.4 176.4 Z\" fill=\"#FCFAF4\" stroke=\"#FCFAF4\" stroke-width=\"20\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M56.8 153.9 C56.9 155.7 57.2 157.5 56.7 158.9 C56.1 160.2 54.8 161.3 53.4 162.3 C52 163.3 50 164.4 48.3 164.8 C46.7 165.2 45 165.3 43.6 164.8 C42.2 164.4 41.2 163.2 40 162.2 C38.7 161.3 37 160.5 36.2 159 C35.5 157.6 35.6 155.1 35.5 153.3 C35.5 151.6 35.2 149.9 35.9 148.5 C36.6 147.2 38.6 146.4 39.9 145.5 C41.1 144.7 41.8 143.8 43.4 143.4 C45 143 47.7 142.9 49.3 143.2 C50.9 143.5 51.9 144.3 52.9 145.2 C54 146.1 55.1 146.9 55.7 148.4 C56.4 149.8 56.6 152.2 56.8 153.9 Z\" fill=\"#FCFAF4\" stroke=\"#FCFAF4\" stroke-width=\"20\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M35.6 100.2 C35.6 101.9 34.7 103.8 33.9 105.3 C33.1 106.8 32 108.2 30.8 109 C29.6 109.9 28.4 110.1 26.8 110.4 C25.3 110.6 22.9 110.8 21.3 110.5 C19.6 110.2 18.1 109.7 16.8 108.7 C15.6 107.7 14.5 106 13.8 104.7 C13.1 103.3 12.5 102.1 12.6 100.5 C12.6 98.9 13.1 96.6 13.9 95.2 C14.7 93.7 16 92.8 17.2 91.9 C18.5 91 19.9 90.2 21.5 89.8 C23 89.3 24.9 89.1 26.4 89.3 C28 89.5 29.7 89.9 30.9 90.8 C32.1 91.7 33.1 93.3 33.8 94.8 C34.6 96.4 35.5 98.4 35.6 100.2 Z\" fill=\"#FCFAF4\" stroke=\"#FCFAF4\" stroke-width=\"20\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M56.7 46.6 C56.6 48.1 56.3 49.6 55.8 51 C55.2 52.4 54.6 53.9 53.4 54.9 C52.2 55.9 50.1 56.6 48.5 57 C46.9 57.4 45.5 57.7 43.9 57.3 C42.3 57 40.2 56 38.9 54.9 C37.6 53.8 36.6 52.2 36 50.8 C35.5 49.3 35.5 47.8 35.6 46.3 C35.6 44.8 35.7 43.2 36.4 41.8 C37.1 40.4 38.6 38.6 39.9 37.6 C41.2 36.5 42.5 35.8 43.9 35.5 C45.4 35.2 47.2 35.4 48.7 35.8 C50.2 36.1 51.8 36.7 53.1 37.7 C54.3 38.7 55.5 40.5 56.1 42 C56.7 43.5 56.7 45.1 56.7 46.6 Z\" fill=\"#FCFAF4\" stroke=\"#FCFAF4\" stroke-width=\"20\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M143.6 99.2 C143.5 102 143.9 105.1 143.4 108.1 C142.9 111.2 141.8 114.6 140.3 117.6 C138.8 120.5 136.5 123.4 134.5 125.9 C132.5 128.4 130.6 130.7 128.3 132.5 C126.1 134.4 123.5 135.4 121 137.1 C118.5 138.8 116.3 141.6 113.4 142.6 C110.5 143.6 106.6 142.7 103.7 143.1 C100.7 143.5 98.6 145.1 95.7 144.8 C92.9 144.6 89.3 142.9 86.6 141.6 C83.8 140.3 81.7 138.6 79.1 137 C76.6 135.4 74 134.2 71.4 132.2 C68.8 130.2 65.6 127.2 63.5 124.9 C61.5 122.7 60.6 121.3 59.3 118.7 C58.1 116.1 56.7 112.5 56.2 109.3 C55.7 106.2 56.2 103 56.3 99.7 C56.5 96.4 56.7 92.9 57.1 89.8 C57.5 86.8 57.5 84 58.7 81.4 C60 78.8 62.9 76.3 64.8 74 C66.7 71.6 67.9 69.6 70.1 67.5 C72.3 65.4 75.1 62.9 77.9 61.4 C80.7 59.9 84.3 59.5 87.1 58.6 C89.9 57.8 91.9 56.7 94.8 56.4 C97.7 56.2 101.4 56.9 104.7 57.1 C107.9 57.3 111.1 57 114.1 57.6 C117.2 58.3 120.6 59.3 123.2 61 C125.7 62.7 127.3 65.7 129.2 67.9 C131.2 70.1 133.1 71.7 134.8 74.1 C136.4 76.5 137.6 79.7 139.1 82.5 C140.6 85.3 142.9 88.3 143.7 91 C144.4 93.8 143.6 96.3 143.6 99.2 Z\" fill=\"#E0663A\" stroke=\"#2B2F33\" stroke-width=\"6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M111.5 23.8 C111.5 25.3 110.9 27.4 110.1 28.9 C109.4 30.3 108.2 31.5 107 32.5 C105.7 33.6 104.4 34.9 102.9 35.3 C101.3 35.7 99.2 35.3 97.5 34.9 C95.8 34.5 93.8 33.8 92.6 32.8 C91.4 31.9 90.8 30.9 90.3 29.4 C89.7 27.8 89.4 25.4 89.4 23.7 C89.3 22.1 89.4 20.8 90 19.4 C90.5 18 91.4 16.5 92.6 15.4 C93.8 14.3 95.6 13.1 97.2 12.8 C98.7 12.5 100.4 13.2 101.9 13.6 C103.5 14 105.1 14.1 106.4 15.1 C107.7 16.1 108.9 18.2 109.8 19.7 C110.6 21.1 111.4 22.2 111.5 23.8 Z\" fill=\"#E0663A\" stroke=\"#2B2F33\" stroke-width=\"6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M164.2 46.2 C164.2 48 164.3 50 163.7 51.5 C163.2 53 162.3 54.4 161 55.3 C159.7 56.2 157.6 56.5 155.9 56.9 C154.3 57.2 152.5 57.9 151.1 57.4 C149.7 57 148.7 55.6 147.4 54.4 C146.2 53.3 144.3 52.1 143.4 50.7 C142.6 49.3 142.3 47.8 142.4 46.2 C142.5 44.7 143.3 42.6 143.9 41.2 C144.6 39.8 145.1 38.5 146.3 37.6 C147.5 36.6 149.4 35.9 151.1 35.6 C152.9 35.3 155.2 35.4 156.7 35.8 C158.3 36.1 159.4 36.9 160.6 37.8 C161.8 38.7 163.3 39.6 163.9 41 C164.5 42.4 164.3 44.4 164.2 46.2 Z\" fill=\"#E0663A\" stroke=\"#2B2F33\" stroke-width=\"6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M187.5 100.3 C187.5 101.9 187.2 103.8 186.4 105.1 C185.6 106.5 184.1 107.5 182.7 108.5 C181.3 109.4 179.6 110.6 178 110.9 C176.4 111.2 174.6 110.7 173 110.2 C171.5 109.8 170 109.2 168.8 108.2 C167.6 107.2 166.6 105.7 165.9 104.2 C165.2 102.8 164.4 101.1 164.4 99.6 C164.4 98.1 164.9 96.4 165.6 95.1 C166.3 93.8 167.2 92.9 168.6 91.8 C169.9 90.8 172.1 89.3 173.7 88.9 C175.3 88.4 176.6 88.7 178.2 89.1 C179.7 89.4 181.3 89.8 182.7 90.9 C184.1 92.1 185.5 94.3 186.3 95.8 C187.1 97.4 187.5 98.8 187.5 100.3 Z\" fill=\"#E0663A\" stroke=\"#2B2F33\" stroke-width=\"6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M164.7 153.7 C164.6 155.1 163.9 156.6 163.2 158 C162.4 159.4 161.5 161.1 160.4 162.1 C159.3 163.1 158.2 163.6 156.6 164.1 C155 164.5 152.3 165.4 150.7 165 C149.1 164.6 148.1 163.1 146.9 161.9 C145.8 160.7 144.6 159.2 143.9 157.9 C143.2 156.7 142.7 155.8 142.8 154.3 C142.8 152.9 143.6 150.8 144.3 149.2 C144.9 147.6 145.5 146 146.6 145 C147.7 144 149.3 143.6 150.9 143.3 C152.5 143.1 154.6 143.1 156.2 143.4 C157.8 143.6 159.1 143.8 160.4 144.8 C161.7 145.8 163.3 148.1 164 149.5 C164.7 151 164.8 152.3 164.7 153.7 Z\" fill=\"#E0663A\" stroke=\"#2B2F33\" stroke-width=\"6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M111.4 176.4 C111.5 177.9 111.1 179.7 110.3 181.1 C109.5 182.4 107.9 183.8 106.5 184.6 C105.2 185.5 103.9 185.9 102.3 186.2 C100.7 186.5 98.6 186.7 97 186.5 C95.4 186.2 93.9 185.8 92.9 184.8 C91.8 183.9 91.2 182.1 90.6 180.7 C90.1 179.3 89.5 178.2 89.5 176.6 C89.5 175 90.1 172.7 90.6 171.1 C91.2 169.5 91.7 168.1 92.8 167.1 C93.9 166 95.6 165.1 97.2 164.9 C98.8 164.7 100.9 165.3 102.6 165.8 C104.3 166.2 106 166.4 107.3 167.4 C108.5 168.3 109.4 170.1 110.1 171.6 C110.8 173.1 111.4 174.8 111.4 176.4 Z\" fill=\"#E0663A\" stroke=\"#2B2F33\" stroke-width=\"6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M56.8 153.9 C56.9 155.7 57.2 157.5 56.7 158.9 C56.1 160.2 54.8 161.3 53.4 162.3 C52 163.3 50 164.4 48.3 164.8 C46.7 165.2 45 165.3 43.6 164.8 C42.2 164.4 41.2 163.2 40 162.2 C38.7 161.3 37 160.5 36.2 159 C35.5 157.6 35.6 155.1 35.5 153.3 C35.5 151.6 35.2 149.9 35.9 148.5 C36.6 147.2 38.6 146.4 39.9 145.5 C41.1 144.7 41.8 143.8 43.4 143.4 C45 143 47.7 142.9 49.3 143.2 C50.9 143.5 51.9 144.3 52.9 145.2 C54 146.1 55.1 146.9 55.7 148.4 C56.4 149.8 56.6 152.2 56.8 153.9 Z\" fill=\"#E0663A\" stroke=\"#2B2F33\" stroke-width=\"6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M35.6 100.2 C35.6 101.9 34.7 103.8 33.9 105.3 C33.1 106.8 32 108.2 30.8 109 C29.6 109.9 28.4 110.1 26.8 110.4 C25.3 110.6 22.9 110.8 21.3 110.5 C19.6 110.2 18.1 109.7 16.8 108.7 C15.6 107.7 14.5 106 13.8 104.7 C13.1 103.3 12.5 102.1 12.6 100.5 C12.6 98.9 13.1 96.6 13.9 95.2 C14.7 93.7 16 92.8 17.2 91.9 C18.5 91 19.9 90.2 21.5 89.8 C23 89.3 24.9 89.1 26.4 89.3 C28 89.5 29.7 89.9 30.9 90.8 C32.1 91.7 33.1 93.3 33.8 94.8 C34.6 96.4 35.5 98.4 35.6 100.2 Z\" fill=\"#E0663A\" stroke=\"#2B2F33\" stroke-width=\"6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M56.7 46.6 C56.6 48.1 56.3 49.6 55.8 51 C55.2 52.4 54.6 53.9 53.4 54.9 C52.2 55.9 50.1 56.6 48.5 57 C46.9 57.4 45.5 57.7 43.9 57.3 C42.3 57 40.2 56 38.9 54.9 C37.6 53.8 36.6 52.2 36 50.8 C35.5 49.3 35.5 47.8 35.6 46.3 C35.6 44.8 35.7 43.2 36.4 41.8 C37.1 40.4 38.6 38.6 39.9 37.6 C41.2 36.5 42.5 35.8 43.9 35.5 C45.4 35.2 47.2 35.4 48.7 35.8 C50.2 36.1 51.8 36.7 53.1 37.7 C54.3 38.7 55.5 40.5 56.1 42 C56.7 43.5 56.7 45.1 56.7 46.6 Z\" fill=\"#E0663A\" stroke=\"#2B2F33\" stroke-width=\"6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M76.3 86.6 C77.7 84.4 81.4 76.6 84.7 73.6 C88 70.6 94.2 69.5 96.1 68.7\" fill=\"none\" stroke=\"#F2A57E\" stroke-width=\"6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></g> </svg>","2":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 240 240\" role=\"img\" aria-label=\"ステップ2 クリアの シール（そとと なか）\"> <path d=\"M224.7 120.3 C224.7 123.6 222.5 127.2 221 130.3 C219.6 133.4 216.7 135.6 216.1 138.8 C215.5 141.9 217.1 145.6 217.3 149.2 C217.5 152.8 218.6 157.1 217.4 160.2 C216.2 163.3 212.5 165.4 209.8 167.8 C207.2 170.2 203.2 171.8 201.3 174.6 C199.5 177.3 199.8 181.1 198.6 184.4 C197.4 187.6 196.4 191.9 194.1 194.2 C191.7 196.5 187.9 197 184.6 198.2 C181.2 199.5 176.9 199.7 174.2 201.5 C171.4 203.3 170.3 206.5 168 209.2 C165.6 211.8 163.1 216 160 217.4 C156.9 218.7 152.8 217.6 149.3 217.3 C145.8 217.1 142.2 215.1 139 215.8 C135.7 216.4 133.1 219.8 129.9 221.3 C126.8 222.8 123.5 224.7 120.2 224.6 C116.9 224.6 113.4 222.5 110.2 221.1 C107 219.7 104.1 217 100.9 216.2 C97.6 215.5 94 216.8 90.6 216.9 C87.1 217 83.1 217.9 80 216.7 C76.9 215.5 74.4 212.3 72 209.8 C69.6 207.3 68.3 203.4 65.6 201.5 C62.9 199.6 59.1 199.7 55.8 198.5 C52.5 197.3 48.1 196.7 45.7 194.3 C43.2 191.9 42.4 187.5 41.2 184.3 C39.9 181 39.9 177.6 38.1 174.8 C36.4 172.1 33.4 170.4 30.8 168 C28.2 165.6 24.1 163.5 22.7 160.5 C21.4 157.4 22.5 153.3 22.7 149.7 C22.9 146.2 24.6 142.5 24 139.2 C23.4 135.9 20.6 133 19.2 129.8 C17.7 126.6 15.3 123.3 15.3 120 C15.3 116.8 17.8 113.5 19.2 110.3 C20.6 107.1 23.1 104.2 23.7 100.8 C24.3 97.5 22.8 93.7 22.8 90.2 C22.7 86.7 22 83 23.3 80 C24.6 77 27.9 74.6 30.5 72.2 C33.1 69.7 37 67.9 38.8 65.2 C40.6 62.5 40.3 59 41.4 55.8 C42.6 52.5 43.4 48.2 45.8 45.8 C48.1 43.3 52.1 42.5 55.4 41.3 C58.7 40.1 62.8 40.1 65.7 38.4 C68.5 36.6 70.1 33.4 72.5 30.8 C74.9 28.2 77.2 24.2 80.2 22.8 C83.2 21.4 87.1 22.4 90.5 22.6 C94 22.7 97.5 24.1 100.8 23.5 C104 23 106.8 20.8 110.1 19.4 C113.3 17.9 116.9 14.9 120.2 14.9 C123.5 14.9 126.7 17.8 129.8 19.3 C132.9 20.9 135.4 23.6 138.8 24.2 C142.1 24.7 146.1 22.7 149.7 22.5 C153.4 22.4 157.5 21.8 160.5 23.1 C163.5 24.4 165.4 27.9 167.8 30.4 C170.1 33 171.7 36.6 174.5 38.5 C177.4 40.4 181.4 40.7 184.7 41.9 C187.9 43 191.8 43 194.1 45.4 C196.4 47.7 197.4 52.4 198.7 55.7 C199.9 59 199.9 62.4 201.6 65.2 C203.4 68 206.6 70 209.2 72.5 C211.7 74.9 215.5 76.8 216.9 79.8 C218.3 82.8 217.6 86.8 217.5 90.3 C217.4 93.7 215.6 97.2 216.2 100.5 C216.8 103.9 219.7 106.9 221.1 110.2 C222.5 113.5 224.7 117 224.7 120.3 Z\" fill=\"#FCFAF4\" stroke=\"#FCFAF4\" stroke-width=\"24\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M224.7 120.3 C224.7 123.6 222.5 127.2 221 130.3 C219.6 133.4 216.7 135.6 216.1 138.8 C215.5 141.9 217.1 145.6 217.3 149.2 C217.5 152.8 218.6 157.1 217.4 160.2 C216.2 163.3 212.5 165.4 209.8 167.8 C207.2 170.2 203.2 171.8 201.3 174.6 C199.5 177.3 199.8 181.1 198.6 184.4 C197.4 187.6 196.4 191.9 194.1 194.2 C191.7 196.5 187.9 197 184.6 198.2 C181.2 199.5 176.9 199.7 174.2 201.5 C171.4 203.3 170.3 206.5 168 209.2 C165.6 211.8 163.1 216 160 217.4 C156.9 218.7 152.8 217.6 149.3 217.3 C145.8 217.1 142.2 215.1 139 215.8 C135.7 216.4 133.1 219.8 129.9 221.3 C126.8 222.8 123.5 224.7 120.2 224.6 C116.9 224.6 113.4 222.5 110.2 221.1 C107 219.7 104.1 217 100.9 216.2 C97.6 215.5 94 216.8 90.6 216.9 C87.1 217 83.1 217.9 80 216.7 C76.9 215.5 74.4 212.3 72 209.8 C69.6 207.3 68.3 203.4 65.6 201.5 C62.9 199.6 59.1 199.7 55.8 198.5 C52.5 197.3 48.1 196.7 45.7 194.3 C43.2 191.9 42.4 187.5 41.2 184.3 C39.9 181 39.9 177.6 38.1 174.8 C36.4 172.1 33.4 170.4 30.8 168 C28.2 165.6 24.1 163.5 22.7 160.5 C21.4 157.4 22.5 153.3 22.7 149.7 C22.9 146.2 24.6 142.5 24 139.2 C23.4 135.9 20.6 133 19.2 129.8 C17.7 126.6 15.3 123.3 15.3 120 C15.3 116.8 17.8 113.5 19.2 110.3 C20.6 107.1 23.1 104.2 23.7 100.8 C24.3 97.5 22.8 93.7 22.8 90.2 C22.7 86.7 22 83 23.3 80 C24.6 77 27.9 74.6 30.5 72.2 C33.1 69.7 37 67.9 38.8 65.2 C40.6 62.5 40.3 59 41.4 55.8 C42.6 52.5 43.4 48.2 45.8 45.8 C48.1 43.3 52.1 42.5 55.4 41.3 C58.7 40.1 62.8 40.1 65.7 38.4 C68.5 36.6 70.1 33.4 72.5 30.8 C74.9 28.2 77.2 24.2 80.2 22.8 C83.2 21.4 87.1 22.4 90.5 22.6 C94 22.7 97.5 24.1 100.8 23.5 C104 23 106.8 20.8 110.1 19.4 C113.3 17.9 116.9 14.9 120.2 14.9 C123.5 14.9 126.7 17.8 129.8 19.3 C132.9 20.9 135.4 23.6 138.8 24.2 C142.1 24.7 146.1 22.7 149.7 22.5 C153.4 22.4 157.5 21.8 160.5 23.1 C163.5 24.4 165.4 27.9 167.8 30.4 C170.1 33 171.7 36.6 174.5 38.5 C177.4 40.4 181.4 40.7 184.7 41.9 C187.9 43 191.8 43 194.1 45.4 C196.4 47.7 197.4 52.4 198.7 55.7 C199.9 59 199.9 62.4 201.6 65.2 C203.4 68 206.6 70 209.2 72.5 C211.7 74.9 215.5 76.8 216.9 79.8 C218.3 82.8 217.6 86.8 217.5 90.3 C217.4 93.7 215.6 97.2 216.2 100.5 C216.8 103.9 219.7 106.9 221.1 110.2 C222.5 113.5 224.7 117 224.7 120.3 Z\" fill=\"#93BBA3\" stroke=\"#2B2F33\" stroke-width=\"6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M197.5 120.4 C197.6 126.7 197.8 133.1 196.5 139.2 C195.2 145.3 192.5 151.5 189.5 157 C186.6 162.4 182.8 167.2 178.7 171.8 C174.6 176.4 170 181.1 164.8 184.7 C159.7 188.2 153.9 191.1 147.9 193.2 C141.9 195.3 135.1 196.4 128.9 197.2 C122.6 198 116.3 198.8 110.3 198 C104.3 197.2 98.4 195 92.8 192.6 C87.2 190.2 81.8 187 76.5 183.5 C71.2 180 65.3 175.9 60.9 171.4 C56.5 167 53.1 162.5 50.3 157 C47.4 151.5 45.3 144.6 44 138.5 C42.8 132.3 42.5 126.3 42.6 120.1 C42.6 113.8 43.1 107.2 44.5 101.2 C45.9 95.3 48.1 90 50.9 84.5 C53.7 79 57.1 73.2 61.3 68.3 C65.4 63.4 70.6 58.8 75.7 55.2 C80.7 51.7 85.9 49.2 91.8 47.1 C97.7 45 104.9 43.1 111.1 42.5 C117.2 41.8 122.7 42.4 128.7 43.3 C134.7 44.1 141.3 45.6 147.1 47.7 C152.9 49.8 158.5 52.7 163.6 56 C168.7 59.4 173.6 63.2 177.8 67.9 C182 72.6 186 78.6 188.9 84.2 C191.9 89.7 194.2 95.2 195.6 101.2 C197 107.2 197.3 114.1 197.5 120.4 Z\" fill=\"#FCFAF4\" stroke=\"#2B2F33\" stroke-width=\"5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><defs><clipPath id=\"m2\"><path d=\"M198 120 C198 126.2 197.2 132.6 195.7 138.7 C194.2 144.7 192 150.7 189.1 156.2 C186.2 161.8 182.5 167.1 178.4 171.7 C174.3 176.4 169.4 180.7 164.3 184.2 C159.2 187.7 153.5 190.7 147.7 192.9 C141.8 195.1 135.6 196.7 129.4 197.4 C123.2 198.2 116.8 198.2 110.6 197.4 C104.4 196.7 98.2 195.1 92.3 192.9 C86.5 190.7 80.8 187.7 75.7 184.2 C70.6 180.7 65.7 176.4 61.6 171.7 C57.5 167.1 53.8 161.8 50.9 156.2 C48 150.7 45.8 144.7 44.3 138.7 C42.8 132.6 42 126.2 42 120 C42 113.8 42.8 107.4 44.3 101.3 C45.8 95.3 48 89.3 50.9 83.8 C53.8 78.2 57.5 72.9 61.6 68.3 C65.7 63.6 70.6 59.3 75.7 55.8 C80.8 52.3 86.5 49.3 92.3 47.1 C98.2 44.9 104.4 43.3 110.6 42.6 C116.8 41.8 123.2 41.8 129.4 42.6 C135.6 43.3 141.8 44.9 147.7 47.1 C153.5 49.3 159.2 52.3 164.3 55.8 C169.4 59.3 174.3 63.6 178.4 68.3 C182.5 72.9 186.2 78.2 189.1 83.8 C192 89.3 194.2 95.3 195.7 101.3 C197.2 107.4 198 113.8 198 120 Z\"/></clipPath></defs><g clip-path=\"url(#m2)\"><path d=\"M30 30 Q75 30 120 30 Q120 120 120 210 Q75 210 30 210 L30 120 Z\" fill=\"#A8D3E6\"/><path d=\"M30 150 Q75 150 120 150 Q120 180 120 210 Q75 210 30 210 L30 180 Z\" fill=\"#8DB07A\"/><path d=\"M120 30 Q170 30 220 30 Q220 120 220 210 Q170 210 120 210 L120 120 Z\" fill=\"#EEDFCB\"/><path d=\"M75.9 112.2 L85.8 112.2 L86.2 152 L76.1 151.7 Z\" fill=\"#B7865A\" stroke=\"#2B2F33\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M105.2 100.2 C105.5 101.9 105.5 103.7 104.8 105.3 C104.2 106.9 102.4 108.3 101.5 109.7 C100.5 111.1 100.5 112.4 99.3 113.7 C98 115.1 95.4 116.5 93.8 117.6 C92.3 118.8 91.8 119.8 90.1 120.7 C88.4 121.5 85.6 122.7 83.6 122.8 C81.6 122.9 80.1 121.6 78.3 121.3 C76.4 121.1 74.5 121.8 72.6 121.3 C70.8 120.7 68.7 118.9 67.1 118 C65.5 117 64.4 117 63.2 115.6 C62 114.2 60.9 111.4 60 109.6 C59.1 107.8 58.4 106.4 57.9 104.9 C57.3 103.4 57.1 102.1 56.9 100.4 C56.8 98.7 56.3 96.5 56.7 94.8 C57.1 93 58.2 91.5 59.4 90 C60.5 88.4 62.3 86.8 63.7 85.3 C65.1 83.9 66.2 82.5 67.6 81.5 C69 80.5 70.2 80.1 72 79.4 C73.8 78.8 76.1 77.8 78.2 77.6 C80.2 77.4 82.6 77.9 84.4 78.2 C86.3 78.4 87.4 78.2 89.2 78.9 C91 79.7 93.5 81.7 95.3 82.7 C97.1 83.7 98.8 83.7 99.8 84.9 C100.9 86.1 100.8 88.3 101.4 90 C102 91.8 102.7 93.7 103.4 95.4 C104 97.1 105 98.6 105.2 100.2 Z\" fill=\"#93BBA3\" stroke=\"#2B2F33\" stroke-width=\"4.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M128.1 127.9 L160 98.1 L191.7 127.9 Z\" fill=\"#9B5B3C\" stroke=\"#2B2F33\" stroke-width=\"4.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M136.2 126.1 Q160.1 125.6 183.8 125.8 L183.6 158.1 Q160.1 158.4 136 158.3 Z\" fill=\"#DDBA92\" stroke=\"#2B2F33\" stroke-width=\"4.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M120 40 Q119.7 120 120.4 200\" fill=\"none\" stroke=\"#2B2F33\" stroke-width=\"4.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></g><path d=\"M197.2 119.8 C197 125.9 196.6 132.8 195.2 138.9 C193.9 144.9 191.8 150.7 189.1 156.2 C186.4 161.8 183.3 167.6 179.1 172.1 C174.8 176.7 168.8 180 163.6 183.4 C158.5 186.9 153.6 190.8 148 193.1 C142.3 195.4 136 196.7 129.6 197.4 C123.3 198.1 116 198.1 109.9 197.4 C103.7 196.6 98.7 195.4 92.9 193.1 C87.1 190.8 80.1 187.1 75 183.6 C69.9 180 66.4 176.3 62.3 171.8 C58.2 167.3 53.3 162 50.4 156.6 C47.5 151.2 46.3 145.3 44.9 139.3 C43.6 133.2 42.5 126.8 42.2 120.5 C42 114.2 42.1 107.4 43.6 101.3 C45.1 95.1 48.5 88.9 51.4 83.5 C54.3 78.1 56.9 73.6 61 68.9 C65.1 64.1 70.9 58.6 76 55 C81.1 51.4 85.8 49.2 91.6 47.2 C97.5 45.1 104.9 43.6 111.3 42.8 C117.7 41.9 123.9 41.3 130 41.9 C136.1 42.6 142.1 44.3 147.8 46.6 C153.5 48.8 158.9 51.7 164 55.2 C169.1 58.7 174.1 62.8 178.3 67.6 C182.5 72.3 186.3 78.3 189.3 84 C192.3 89.7 195.1 95.8 196.4 101.8 C197.7 107.7 197.4 113.6 197.2 119.8 Z\" fill=\"none\" stroke=\"#2B2F33\" stroke-width=\"5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> </svg>","3":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 240 240\" role=\"img\" aria-label=\"ステップ3 クリアの シール（よていひょう）\"> <path d=\"M225.4 120 C225.4 123.3 222.8 126.4 221.3 129.6 C219.8 132.8 217.1 135.8 216.4 139.1 C215.7 142.4 216.9 145.9 216.9 149.4 C216.9 152.9 217.9 157.1 216.7 160.2 C215.4 163.3 211.9 165.6 209.3 168 C206.7 170.4 203 171.8 201.2 174.6 C199.4 177.4 199.7 181.3 198.6 184.6 C197.5 187.8 196.9 191.8 194.6 194.1 C192.3 196.4 187.8 197.1 184.5 198.4 C181.2 199.7 177.5 199.9 174.8 201.7 C172 203.6 170.5 207 168.1 209.6 C165.6 212.2 163 216 160 217.3 C157 218.6 153.3 217.6 149.8 217.5 C146.3 217.3 142.3 215.7 139 216.4 C135.7 217 133.2 219.9 130.1 221.3 C127 222.7 123.6 225 120.2 225 C116.9 225 113.2 222.7 110 221.2 C106.8 219.8 104.2 216.9 101 216.1 C97.8 215.4 94.4 216.6 90.8 216.8 C87.2 216.9 82.6 218.1 79.4 217 C76.3 215.8 74.2 212.3 71.8 209.8 C69.5 207.3 68 203.7 65.2 201.8 C62.5 199.9 58.6 199.4 55.4 198.2 C52.2 196.9 48.3 196.7 46 194.4 C43.6 192.1 42.7 187.7 41.5 184.5 C40.2 181.2 40.4 177.6 38.6 174.8 C36.7 172 33.1 170.3 30.5 167.9 C27.9 165.4 24.2 163.2 23 160.1 C21.7 157 22.8 152.6 23 149.2 C23.2 145.7 24.7 142.7 24 139.5 C23.4 136.3 20.7 133.3 19.2 130 C17.7 126.7 15 123 14.9 119.7 C14.8 116.4 17.1 113.2 18.7 110.1 C20.2 107 23.5 104.4 24.2 101.2 C24.8 97.9 22.8 94.3 22.6 90.7 C22.5 87.2 21.9 82.9 23.2 79.8 C24.6 76.7 28.2 74.3 30.8 71.9 C33.3 69.5 36.6 68.3 38.4 65.6 C40.2 62.8 40.5 58.8 41.7 55.6 C42.9 52.3 43.3 48.4 45.6 46 C47.9 43.7 52.2 42.7 55.5 41.5 C58.8 40.2 62.5 40.4 65.3 38.5 C68.1 36.7 69.9 33 72.3 30.4 C74.8 27.8 77 24.2 79.9 23 C82.9 21.8 86.7 23.1 90.1 23.2 C93.6 23.4 97.3 24.7 100.7 23.9 C104.1 23.2 107.3 20.3 110.4 18.8 C113.6 17.2 116.4 14.7 119.7 14.8 C122.9 14.9 126.4 17.8 129.7 19.3 C132.9 20.7 135.9 22.9 139.1 23.5 C142.4 24.1 145.8 23 149.3 22.9 C152.7 22.8 156.8 21.6 159.9 22.8 C163.1 24.1 165.8 27.8 168.2 30.4 C170.6 33.1 171.6 36.7 174.2 38.6 C176.9 40.4 180.7 40.4 184.1 41.6 C187.4 42.7 192 43.1 194.4 45.4 C196.8 47.7 197.3 52.1 198.5 55.5 C199.7 58.8 199.8 62.8 201.7 65.6 C203.6 68.4 207.3 69.9 209.8 72.2 C212.4 74.6 215.5 76.5 216.8 79.6 C218 82.7 217.5 87.2 217.3 90.8 C217.1 94.3 215.2 97.6 215.8 100.8 C216.4 104 219.2 106.8 220.8 110 C222.4 113.2 225.3 116.7 225.4 120 Z\" fill=\"#FCFAF4\" stroke=\"#FCFAF4\" stroke-width=\"24\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M225.4 120 C225.4 123.3 222.8 126.4 221.3 129.6 C219.8 132.8 217.1 135.8 216.4 139.1 C215.7 142.4 216.9 145.9 216.9 149.4 C216.9 152.9 217.9 157.1 216.7 160.2 C215.4 163.3 211.9 165.6 209.3 168 C206.7 170.4 203 171.8 201.2 174.6 C199.4 177.4 199.7 181.3 198.6 184.6 C197.5 187.8 196.9 191.8 194.6 194.1 C192.3 196.4 187.8 197.1 184.5 198.4 C181.2 199.7 177.5 199.9 174.8 201.7 C172 203.6 170.5 207 168.1 209.6 C165.6 212.2 163 216 160 217.3 C157 218.6 153.3 217.6 149.8 217.5 C146.3 217.3 142.3 215.7 139 216.4 C135.7 217 133.2 219.9 130.1 221.3 C127 222.7 123.6 225 120.2 225 C116.9 225 113.2 222.7 110 221.2 C106.8 219.8 104.2 216.9 101 216.1 C97.8 215.4 94.4 216.6 90.8 216.8 C87.2 216.9 82.6 218.1 79.4 217 C76.3 215.8 74.2 212.3 71.8 209.8 C69.5 207.3 68 203.7 65.2 201.8 C62.5 199.9 58.6 199.4 55.4 198.2 C52.2 196.9 48.3 196.7 46 194.4 C43.6 192.1 42.7 187.7 41.5 184.5 C40.2 181.2 40.4 177.6 38.6 174.8 C36.7 172 33.1 170.3 30.5 167.9 C27.9 165.4 24.2 163.2 23 160.1 C21.7 157 22.8 152.6 23 149.2 C23.2 145.7 24.7 142.7 24 139.5 C23.4 136.3 20.7 133.3 19.2 130 C17.7 126.7 15 123 14.9 119.7 C14.8 116.4 17.1 113.2 18.7 110.1 C20.2 107 23.5 104.4 24.2 101.2 C24.8 97.9 22.8 94.3 22.6 90.7 C22.5 87.2 21.9 82.9 23.2 79.8 C24.6 76.7 28.2 74.3 30.8 71.9 C33.3 69.5 36.6 68.3 38.4 65.6 C40.2 62.8 40.5 58.8 41.7 55.6 C42.9 52.3 43.3 48.4 45.6 46 C47.9 43.7 52.2 42.7 55.5 41.5 C58.8 40.2 62.5 40.4 65.3 38.5 C68.1 36.7 69.9 33 72.3 30.4 C74.8 27.8 77 24.2 79.9 23 C82.9 21.8 86.7 23.1 90.1 23.2 C93.6 23.4 97.3 24.7 100.7 23.9 C104.1 23.2 107.3 20.3 110.4 18.8 C113.6 17.2 116.4 14.7 119.7 14.8 C122.9 14.9 126.4 17.8 129.7 19.3 C132.9 20.7 135.9 22.9 139.1 23.5 C142.4 24.1 145.8 23 149.3 22.9 C152.7 22.8 156.8 21.6 159.9 22.8 C163.1 24.1 165.8 27.8 168.2 30.4 C170.6 33.1 171.6 36.7 174.2 38.6 C176.9 40.4 180.7 40.4 184.1 41.6 C187.4 42.7 192 43.1 194.4 45.4 C196.8 47.7 197.3 52.1 198.5 55.5 C199.7 58.8 199.8 62.8 201.7 65.6 C203.6 68.4 207.3 69.9 209.8 72.2 C212.4 74.6 215.5 76.5 216.8 79.6 C218 82.7 217.5 87.2 217.3 90.8 C217.1 94.3 215.2 97.6 215.8 100.8 C216.4 104 219.2 106.8 220.8 110 C222.4 113.2 225.3 116.7 225.4 120 Z\" fill=\"#9CC0E4\" stroke=\"#2B2F33\" stroke-width=\"6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M198.6 120.1 C198.6 126.4 197.8 133 196.1 139.1 C194.5 145.1 191.7 151 188.7 156.4 C185.7 161.9 182.2 167 178.2 171.7 C174.1 176.4 169.5 180.8 164.4 184.5 C159.2 188.1 153 191.4 147.1 193.5 C141.2 195.6 134.9 196.3 128.9 197.1 C122.9 197.9 117.3 198.8 111.2 198.2 C105 197.6 98.2 195.9 92.1 193.7 C86.1 191.4 80.1 188.7 75 184.9 C69.8 181.1 65.1 175.8 61.1 171 C57.2 166.1 54.1 161.2 51.4 155.7 C48.6 150.2 46.3 143.9 44.7 137.9 C43 131.9 41.6 125.9 41.4 119.8 C41.2 113.7 42.1 107.2 43.6 101.3 C45.1 95.3 47.7 89.5 50.7 84.1 C53.7 78.8 57.3 73.8 61.6 69 C65.9 64.2 71 58.8 76.2 55.3 C81.5 51.7 87.3 49.8 93 47.7 C98.8 45.6 104.7 43.5 110.7 42.6 C116.7 41.7 122.8 41.6 128.9 42.3 C135 42.9 141.3 44.4 147.2 46.6 C153.1 48.8 159.2 51.9 164.5 55.5 C169.8 59.2 174.6 63.8 178.8 68.4 C183 73 186.7 77.6 189.6 83.1 C192.5 88.6 194.8 95.2 196.3 101.3 C197.8 107.5 198.6 113.8 198.6 120.1 Z\" fill=\"#FCFAF4\" stroke=\"#2B2F33\" stroke-width=\"5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M77.8 74 Q119.6 74.9 161.5 73.4 Q162.1 121.7 162.4 169.3 Q120.3 169.7 78.7 169.7 L77.9 121.6 Z\" fill=\"#FFFFFF\" stroke=\"#2B2F33\" stroke-width=\"5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M78 73.7 Q120.2 73.9 162.2 73.7 L161.9 96.1 Q120.3 96.2 77.9 95.5 Z\" fill=\"#2E5E4E\" stroke=\"#2B2F33\" stroke-width=\"5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M102 74 C102 74.3 102 74.6 101.9 75 C101.8 75.3 101.7 75.6 101.5 75.9 C101.4 76.1 101.2 76.4 101 76.7 C100.8 76.9 100.5 77.1 100.3 77.3 C100 77.5 99.7 77.6 99.4 77.7 C99.1 77.9 98.8 77.9 98.5 78 C98.2 78 97.8 78 97.5 78 C97.2 77.9 96.9 77.9 96.6 77.7 C96.3 77.6 96 77.5 95.7 77.3 C95.5 77.1 95.2 76.9 95 76.7 C94.8 76.4 94.6 76.1 94.5 75.9 C94.3 75.6 94.2 75.3 94.1 75 C94 74.6 94 74.3 94 74 C94 73.7 94 73.4 94.1 73 C94.2 72.7 94.3 72.4 94.5 72.1 C94.6 71.9 94.8 71.6 95 71.3 C95.2 71.1 95.5 70.9 95.7 70.7 C96 70.5 96.3 70.4 96.6 70.3 C96.9 70.1 97.2 70.1 97.5 70 C97.8 70 98.2 70 98.5 70 C98.8 70.1 99.1 70.1 99.4 70.3 C99.7 70.4 100 70.5 100.3 70.7 C100.5 70.9 100.8 71.1 101 71.3 C101.2 71.6 101.4 71.9 101.5 72.1 C101.7 72.4 101.8 72.7 101.9 73 C102 73.4 102 73.7 102 74 Z\" fill=\"#FCFAF4\" stroke=\"#2B2F33\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M146 74 C146 74.3 146 74.6 145.9 75 C145.8 75.3 145.7 75.6 145.5 75.9 C145.4 76.1 145.2 76.4 145 76.7 C144.8 76.9 144.5 77.1 144.3 77.3 C144 77.5 143.7 77.6 143.4 77.7 C143.1 77.9 142.8 77.9 142.5 78 C142.2 78 141.8 78 141.5 78 C141.2 77.9 140.9 77.9 140.6 77.7 C140.3 77.6 140 77.5 139.7 77.3 C139.5 77.1 139.2 76.9 139 76.7 C138.8 76.4 138.6 76.1 138.5 75.9 C138.3 75.6 138.2 75.3 138.1 75 C138 74.6 138 74.3 138 74 C138 73.7 138 73.4 138.1 73 C138.2 72.7 138.3 72.4 138.5 72.1 C138.6 71.9 138.8 71.6 139 71.3 C139.2 71.1 139.5 70.9 139.7 70.7 C140 70.5 140.3 70.4 140.6 70.3 C140.9 70.1 141.2 70.1 141.5 70 C141.8 70 142.2 70 142.5 70 C142.8 70.1 143.1 70.1 143.4 70.3 C143.7 70.4 144 70.5 144.3 70.7 C144.5 70.9 144.8 71.1 145 71.3 C145.2 71.6 145.4 71.9 145.5 72.1 C145.7 72.4 145.8 72.7 145.9 73 C146 73.4 146 73.7 146 74 Z\" fill=\"#FCFAF4\" stroke=\"#2B2F33\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M94.1 130.1 C97.2 133.1 103.7 151.5 112.4 148.1 C121 144.7 140.4 116 146 109.6\" fill=\"none\" stroke=\"#2E5E4E\" stroke-width=\"10\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> </svg>","4":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 240 240\" role=\"img\" aria-label=\"ステップ4 クリアの シール（よていひょうの てちょうと ほし）\"> <path d=\"M32.8 39.7 Q118.3 38.6 206.3 39.5 Q205.7 124.7 207.1 212.5 Q119.9 212.1 33.1 212.2 L34.8 124.9 Z\" fill=\"#FCFAF4\" stroke=\"#FCFAF4\" stroke-width=\"30\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M32.8 39.7 Q118.3 38.6 206.3 39.5 Q205.7 124.7 207.1 212.5 Q119.9 212.1 33.1 212.2 L34.8 124.9 Z\" fill=\"#2E5E4E\" stroke=\"#2B2F33\" stroke-width=\"6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M44.6 49.4 Q120.5 50.6 195.7 50.4 Q195.7 126.3 195.6 201.5 Q120.9 201.4 43.6 201.6 L44 125.4 Z\" fill=\"none\" stroke=\"#FCFAF4\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-dasharray=\"9 7\"/> <path d=\"M49.3 70 Q119.1 69.8 189.5 69.1 Q189.6 132.8 190.1 193.4 Q118.9 193 51 194.5 L50.2 132.1 Z\" fill=\"#FCFAF4\" stroke=\"#2B2F33\" stroke-width=\"5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M57.7 85.9 L73 85.7 L73.3 119.8 L58 120.3 Z\" fill=\"#F2A57E\" stroke=\"#2B2F33\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M76.6 86.2 L91.7 86.1 L91.4 120 L76.3 120.3 Z\" fill=\"#E1E3E6\" stroke=\"#2B2F33\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M94.8 86.1 L109.6 85.8 L109.8 120.3 L94.8 119.9 Z\" fill=\"#E1E3E6\" stroke=\"#2B2F33\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M113.1 86.3 L128 85.9 L128.3 119.9 L113.2 119.8 Z\" fill=\"#9CC0E4\" stroke=\"#2B2F33\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M131.8 85.8 L146.4 85.9 L146.8 120.2 L131.9 120 Z\" fill=\"#9CC0E4\" stroke=\"#2B2F33\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M149.8 86 L165.1 86 L165.1 120 L150 120.2 Z\" fill=\"#F2A57E\" stroke=\"#2B2F33\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M168.3 86 L183.4 86.3 L183.6 119.9 L168.4 119.9 Z\" fill=\"#F2A57E\" stroke=\"#2B2F33\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M57.7 135.9 Q121.1 135.4 184 134.7\" fill=\"none\" stroke=\"#53595F\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M58.3 154.2 Q103.5 153.3 150.2 153.3\" fill=\"none\" stroke=\"#53595F\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M58.1 171.7 Q93 171.1 127.7 170.8\" fill=\"none\" stroke=\"#53595F\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M82.1 57.9 L81.8 30\" fill=\"none\" stroke=\"#FCFAF4\" stroke-width=\"12\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M82.1 57.9 L82.1 29.8\" fill=\"none\" stroke=\"#5F666D\" stroke-width=\"6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M87 63.8 C87 64.2 87 64.6 86.9 65.1 C86.9 65.5 86.8 66.1 86.6 66.4 C86.4 66.8 86 66.8 85.7 67.1 C85.4 67.4 85 68 84.7 68.3 C84.4 68.6 84.1 68.7 83.8 68.8 C83.4 68.9 83.1 68.8 82.8 68.9 C82.4 68.9 81.9 69 81.5 69 C81.1 68.9 80.6 68.7 80.3 68.6 C79.9 68.5 79.4 68.5 79.1 68.3 C78.8 68.1 78.6 67.7 78.3 67.3 C78.1 67 77.7 66.6 77.5 66.3 C77.3 65.9 77.2 65.6 77.1 65.3 C77 64.9 77 64.5 77 64.1 C77.1 63.7 77.2 63.1 77.3 62.7 C77.4 62.3 77.5 62 77.7 61.7 C77.8 61.4 78 61.1 78.2 60.8 C78.5 60.5 79 60.2 79.4 59.9 C79.7 59.6 79.8 59.3 80.1 59.2 C80.5 59 81 58.9 81.4 58.9 C81.8 58.9 82.2 59.2 82.6 59.2 C83 59.3 83.6 59.1 83.9 59.2 C84.3 59.3 84.4 59.7 84.7 59.9 C85 60.2 85.3 60.3 85.6 60.5 C85.9 60.8 86.1 61.3 86.3 61.7 C86.5 62 86.7 62.3 86.9 62.7 C87 63.1 87 63.4 87 63.8 Z\" fill=\"#2B2F33\"/> <path d=\"M119.8 58 L119.9 29.9\" fill=\"none\" stroke=\"#FCFAF4\" stroke-width=\"12\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M120.2 58.2 L119.8 30.1\" fill=\"none\" stroke=\"#5F666D\" stroke-width=\"6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M125.1 64.2 C125.1 64.6 125 64.8 124.9 65.1 C124.8 65.5 124.6 66 124.4 66.3 C124.3 66.7 124.1 67 123.8 67.3 C123.6 67.6 123.2 68 122.9 68.2 C122.5 68.5 122.2 68.6 121.8 68.7 C121.5 68.8 121.2 68.9 120.8 68.9 C120.3 69 119.7 68.9 119.3 68.8 C118.9 68.8 118.6 68.7 118.2 68.6 C117.9 68.5 117.6 68.3 117.3 68.1 C116.9 67.9 116.4 67.5 116.1 67.3 C115.8 67 115.8 66.8 115.6 66.5 C115.5 66.1 115.3 65.4 115.2 65 C115.1 64.6 115.1 64.4 115.1 64 C115.1 63.7 115.1 63.2 115.3 62.8 C115.4 62.4 115.6 62 115.8 61.7 C115.9 61.4 116 61.2 116.3 60.9 C116.5 60.6 116.8 60.2 117.2 60 C117.5 59.7 117.9 59.7 118.3 59.5 C118.7 59.3 119.1 59 119.5 58.9 C119.9 58.8 120.1 58.8 120.5 58.9 C120.9 59 121.4 59.3 121.8 59.4 C122.2 59.6 122.7 59.6 123 59.8 C123.3 60.1 123.7 60.4 123.9 60.7 C124.1 61.1 124.1 61.4 124.3 61.8 C124.5 62.1 124.9 62.2 125.1 62.6 C125.2 63 125.1 63.8 125.1 64.2 Z\" fill=\"#2B2F33\"/> <path d=\"M158.1 58 L158.1 29.8\" fill=\"none\" stroke=\"#FCFAF4\" stroke-width=\"12\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M158.1 58.1 L157.9 30\" fill=\"none\" stroke=\"#5F666D\" stroke-width=\"6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M163.1 64 C163.2 64.4 162.9 64.7 162.8 65.1 C162.7 65.4 162.8 65.7 162.6 66.1 C162.5 66.5 162.2 67.1 161.9 67.4 C161.6 67.7 161.1 67.8 160.8 68 C160.4 68.2 160.1 68.6 159.8 68.8 C159.4 68.9 158.9 68.8 158.5 68.8 C158.1 68.8 158 68.8 157.6 68.8 C157.2 68.8 156.7 68.9 156.2 68.8 C155.8 68.7 155.5 68.4 155.1 68.2 C154.7 67.9 154.3 67.5 154.1 67.2 C153.9 66.9 153.9 66.7 153.7 66.4 C153.6 66 153.2 65.5 153.1 65.1 C153 64.7 153.1 64.4 153.1 64 C153.1 63.6 153.1 63.3 153.1 62.9 C153.2 62.5 153.3 62.1 153.5 61.7 C153.6 61.4 153.9 61.2 154.2 60.8 C154.5 60.5 155 60 155.3 59.7 C155.7 59.5 155.9 59.5 156.2 59.4 C156.5 59.2 156.8 59 157.2 58.9 C157.6 58.8 158 58.8 158.4 58.9 C158.9 59 159.5 59.1 159.9 59.3 C160.3 59.5 160.6 59.8 160.9 60.1 C161.2 60.3 161.4 60.5 161.7 60.8 C161.9 61.1 162.2 61.4 162.4 61.7 C162.5 62 162.6 62.3 162.7 62.7 C162.9 63.1 163.1 63.6 163.1 64 Z\" fill=\"#2B2F33\"/> <path d=\"M177.8 124.6 L184.3 156.8 L215.4 162.7 L187.1 179.3 L190 212.3 L166.1 188.7 L137.1 202.6 L150.6 173.2 L129.5 148.6 L160.3 152.8 Z\" fill=\"#FCFAF4\" stroke=\"#FCFAF4\" stroke-width=\"22\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M177.8 124.6 L184.3 156.8 L215.4 162.7 L187.1 179.3 L190 212.3 L166.1 188.7 L137.1 202.6 L150.6 173.2 L129.5 148.6 L160.3 152.8 Z\" fill=\"#E4C77E\" stroke=\"#2B2F33\" stroke-width=\"6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M160.2 150.2 L165.8 140\" fill=\"none\" stroke=\"#F6EBCB\" stroke-width=\"5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> </svg>"};
  var medalTex = {};        // n → CanvasTexture（shared）
  var RIM = function (n) { return n === 1 ? C.tape : n === 2 ? C.grass : n === 4 ? STEP4.cover : C.rainLight; };
  // ステップ4の手帳のシールの色（design.md 12-11）
  var STEP4 = { cover: 0x2E5E4E, page: 0xFCFAF4, star: 0xE4C77E, ring: 0x5F666D };

  function preloadMedals() {
    for (var n = 1; n <= 4; n++) medalTexture(n);
  }
  function medalTexture(n) {
    if (medalTex[n]) return medalTex[n];
    var cv = document.createElement('canvas'); cv.width = cv.height = 512;
    var c = cv.getContext('2d');
    drawMedalFallback(c, n);
    var tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 2;
    tex.userData.shared = true;
    medalTex[n] = tex;
    // 1) 本物の assets/medal-step{n}.svg（http で開いたとき）→ 2) 中に入れた同じSVG（file:// のとき）
    var srcs = ['assets/medal-step' + n + '.svg'];
    if (MEDAL_SVG && MEDAL_SVG[n]) srcs.push('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(MEDAL_SVG[n]));
    tryLoad(tex, srcs, 0);
    return tex;
  }
  function tryLoad(tex, srcs, i) {
    if (i >= srcs.length) return;
    var img = new Image();
    img.onload = function () {
      try {
        var cv = document.createElement('canvas'); cv.width = cv.height = 512;
        var c = cv.getContext('2d');
        c.drawImage(img, 0, 0, 512, 512);
        c.getImageData(0, 0, 1, 1);           // file:// で汚れた（taint）キャンバスなら ここで失敗 → 次へ
        tex.image = cv; tex.needsUpdate = true;
        kick();
      } catch (e) { tryLoad(tex, srcs, i + 1); }
    };
    img.onerror = function () { tryLoad(tex, srcs, i + 1); };
    img.src = srcs[i];
  }
  // 画像が まだ／使えないときの かんたんな絵（紙の色の まる＋ふち）
  function drawMedalFallback(c, n) {
    c.clearRect(0, 0, 512, 512);
    if (n === 4) {          // 手帳の形: 紙の色の ふち＋みどりの表紙
      c.fillStyle = '#FCFAF4'; roundRect(c, 40, 52, 432, 432, 40); c.fill();
      c.fillStyle = '#2E5E4E'; roundRect(c, 70, 84, 372, 368, 26); c.fill();
      c.fillStyle = '#FCFAF4'; roundRect(c, 106, 148, 300, 264, 14); c.fill();
      c.fillStyle = '#2E5E4E'; c.font = '700 180px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('4', 256, 290);
      return;
    }
    c.fillStyle = '#FCFAF4'; c.beginPath(); c.arc(256, 256, 230, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#' + ('000000' + RIM(n).toString(16)).slice(-6); c.lineWidth = 22;
    c.beginPath(); c.arc(256, 256, 200, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#2E5E4E'; c.font = '700 200px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(String(n), 256, 268);
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }

  // シールの立体（波のふち）。表＝SVGの板、うら＝紙の色、側面＝ふちの色
  function medalBodyGeo() {
    return G('medalBody', function () {
      var s = new THREE.Shape(), N = 120, R = 0.43;   // 板の半分=0.5 に対して SVGのふち ≒ 0.44
      for (var i = 0; i <= N; i++) {
        var a = i / N * Math.PI * 2, r = R * (1 + 0.025 * Math.cos(a * 24));
        if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r); else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      var g = new THREE.ExtrudeGeometry(s, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 1, curveSegments: 4 });
      g.translate(0, 0, -0.035 / 2);
      return g;
    });
  }
  // size: 直径（world）。mats に材質を入れる
  function makeMedal(n, mats) {
    if (n === 4) return makeNotebookMedal(mats);
    var g = new THREE.Group();
    var inner = new THREE.Group(); g.add(inner);
    var face = toon(C.page), rim = toon(RIM(n));
    var line = new THREE.MeshBasicMaterial({ color: C.ink, side: THREE.BackSide, transparent: true });
    mats.push(face, rim, line);
    var body = new THREE.Mesh(medalBodyGeo(), [face, rim]);
    var hull = new THREE.Mesh(medalBodyGeo(), line); hull.scale.set(1.03, 1.03, 1.4);
    inner.add(hull, body);
    var fm = new THREE.MeshBasicMaterial({ map: medalTexture(n), transparent: true, depthWrite: false, color: 0xFFFFFF });
    mats.push(fm);
    var front = new THREE.Mesh(G('medalFace', function () { return new THREE.PlaneGeometry(1, 1); }), fm);
    front.position.z = 0.03;
    front.renderOrder = 2;
    inner.add(front);
    g.userData.faceMat = fm;
    g.userData.inner = inner;
    return g;
  }

  /* ---------- ステップ4のシール: 角の丸い 四角の手帳（design.md 12-11） ----------
     design.md の寸法（たて・よこ 1.3・厚さ 0.06・角の半径 0.12）は まるいシールの 直径1.4 が基準。
     ここでは シールの板（SVG 240px）＝1 なので、SVGの手帳（x33–207・y40–212、白いふち込みで ±0.42）に
     合わせて 0.80 角・角の半径 0.075・厚さ 0.05 にしている（比は design.md と同じ）。
     表＝medal-step4.svg の板、表紙（ふち・うら）＝primary、リング3つ（上のふち、半分の TorusGeometry）、
     右下に 少し はみ出す 星の うすい板（tape・輪郭 ink）。中身は 9個 */
  var NB = { half: 0.40, cy: -0.025, r: 0.075, depth: 0.04, top: 0.335 };
  function notebookGeo() {
    return G('nbBody', function () {
      var s = new THREE.Shape(), h = NB.half, r = NB.r, y0 = NB.cy;
      s.moveTo(-h + r, y0 - h);
      s.lineTo(h - r, y0 - h); s.quadraticCurveTo(h, y0 - h, h, y0 - h + r);
      s.lineTo(h, y0 + h - r); s.quadraticCurveTo(h, y0 + h, h - r, y0 + h);
      s.lineTo(-h + r, y0 + h); s.quadraticCurveTo(-h, y0 + h, -h, y0 + h - r);
      s.lineTo(-h, y0 - h + r); s.quadraticCurveTo(-h, y0 - h, -h + r, y0 - h);
      var g = new THREE.ExtrudeGeometry(s, { depth: NB.depth, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 1, curveSegments: 6 });
      g.translate(0, 0, -NB.depth / 2);
      return g;
    });
  }
  // SVG の星（右下）と同じ形。中心 (172,170) からの点を 1/240 にする
  var STAR_PTS = [[177.8, 124.6], [184.3, 156.8], [215.4, 162.7], [187.1, 179.3], [190, 212.3], [166.1, 188.7], [137.1, 202.6], [150.6, 173.2], [129.5, 148.6], [160.3, 152.8]];
  var STAR_C = [172, 170];
  function starGeo() {
    return G('nbStar', function () {
      var s = new THREE.Shape();
      STAR_PTS.forEach(function (p, i) {
        var x = (p[0] - STAR_C[0]) / 240, y = -(p[1] - STAR_C[1]) / 240;
        if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
      });
      s.closePath();
      var g = new THREE.ExtrudeGeometry(s, { depth: 0.014, bevelEnabled: false });
      g.translate(0, 0, -0.007);
      return g;
    });
  }
  function makeNotebookMedal(mats) {
    var g = new THREE.Group();
    var inner = new THREE.Group(); g.add(inner);
    var cover = toon(STEP4.cover), ringM = toon(STEP4.ring), starM = toon(STEP4.star);
    var line = new THREE.MeshBasicMaterial({ color: C.ink, side: THREE.BackSide, transparent: true });
    mats.push(cover, ringM, starM, line);
    // 表紙（ふち・うら）
    var body = new THREE.Mesh(notebookGeo(), cover);
    var hull = new THREE.Mesh(notebookGeo(), line); hull.scale.set(1.03, 1.03, 1.4);
    hull.position.y = NB.cy * -0.03;     // 大きくした分の ずれを もどす
    inner.add(hull, body);
    // 表: medal-step4.svg（ページ・週の らん・リングの あな・星の白いふち）
    var fm = new THREE.MeshBasicMaterial({ map: medalTexture(4), transparent: true, depthWrite: false, color: 0xFFFFFF });
    mats.push(fm);
    var front = new THREE.Mesh(G('medalFace', function () { return new THREE.PlaneGeometry(1, 1); }), fm);
    front.position.z = NB.depth / 2 + 0.008;
    front.renderOrder = 2;
    inner.add(front);
    // リング3つ（SVG の x82・120・158）。上のふちを 前から うしろへ またぐ 半分の輪
    var rg = G('nbRing', function () { return new THREE.TorusGeometry(0.05, 0.011, 6, 14, Math.PI); });
    [82, 120, 158].forEach(function (px) {
      var rr = new THREE.Mesh(rg, ringM);
      rr.rotation.y = Math.PI / 2;
      rr.position.set((px - 120) / 240, NB.top, 0);
      inner.add(rr);
    });
    // 星の うすい板（右下に 少し はみ出す）。輪郭は ink
    var star = new THREE.Group();
    var sh = new THREE.Mesh(starGeo(), line); sh.scale.set(1.1, 1.1, 1.6);
    var sb = new THREE.Mesh(starGeo(), starM);
    star.add(sh, sb);
    star.position.set((STAR_C[0] - 120) / 240, -(STAR_C[1] - 120) / 240, front.position.z + 0.014);
    inner.add(star);
    g.userData.faceMat = fm;
    g.userData.inner = inner;
    return g;
  }

  /* ---------- 紙ふぶき（天気シールの紙: まる と しかく） ---------- */
  var CONF_COLORS;
  function confColors() {
    if (!CONF_COLORS) CONF_COLORS = [C.page, C.sun, C.rainLight, C.tape, C.primary, C.soto].map(function (c) { return new THREE.Color(c); });
    return CONF_COLORS;
  }
  function makeConfetti(N, mats) {
    var cm = new THREE.MeshToonMaterial({ gradientMap: gradientMap, side: THREE.DoubleSide, transparent: true });
    mats.push(cm);
    var half = Math.ceil(N / 2);
    var a = new THREE.InstancedMesh(G('confC', function () { return new THREE.CircleGeometry(0.07, 12); }), cm, half);
    var b = new THREE.InstancedMesh(G('confP', function () { return new THREE.PlaneGeometry(0.08, 0.12); }), cm, N - half);
    a.frustumCulled = b.frustumCulled = false;
    var cols = confColors();
    for (var i = 0; i < half; i++) a.setColorAt(i, cols[i % cols.length]);
    for (var j = 0; j < N - half; j++) b.setColorAt(j, cols[(j + 3) % cols.length]);
    a.instanceColor.needsUpdate = b.instanceColor.needsUpdate = true;
    return { meshes: [a, b], at: function (i) { return i < half ? [a, i] : [b, i - half]; } };
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
    try {
      for (var i = actors.length - 1; i >= 0; i--) {
        var a = actors[i];
        if (a.sleeping) continue;
        var t = (now - a.start) / 1000;
        if (a.update(t, a) === false) removeActor(a);
      }
      draw();
    } catch (e) { fail(e); return; }
    for (var j = 0; j < actors.length; j++) if (!actors[j].sleeping) { rafId = requestAnimationFrame(frame); break; }
  }
  // 描く。タイトルのときは 出してよい四角の外を描かない（はさみ切り）
  function draw() {
    renderer.setScissorTest(false);
    renderer.clear();
    if (currentScene === 'title') {
      var p1 = appToScreen(TITLE_AREA.x1, TITLE_AREA.y1), p2 = appToScreen(TITLE_AREA.x2, TITLE_AREA.y2);
      renderer.setScissor(p1.x, H - p2.y, p2.x - p1.x, p2.y - p1.y);
      renderer.setScissorTest(true);
    }
    renderer.render(scene, camera);
    renderer.setScissorTest(false);
  }

  /* =======================================================================
     場面
     ======================================================================= */
  function setScene(name, opt) {
    if (name === currentScene) return;
    currentScene = name;
    clearScene();
    if (name === 'title') buildTitle();
    else if (name === 'result') buildResult(opt);
    // 'play': 何も置かない
    kick();
    draw();
  }
  function clearScene() {
    for (var i = actors.length - 1; i >= 0; i--) if (actors[i].persistent) removeActor(actors[i]);
  }
  function wakeAll() {
    for (var i = 0; i < actors.length; i++) actors[i].sleeping = false;
    kick();
  }

  /* ---------- タイトル ----------
     おひさま・くも・かさ（＋しずく2つ）が 奥から ふわっと出て、ゆっくり回りながら浮かぶ。
     まとまり全体が ゆっくり左右に回り込む（カメラが回り込んで見える）。
     置き場所（1920基準・中心と だいたいの はば）
       おひさま (1290, 410) 直径≒230  → x1175–1405 y295–525
       くも     (1440, 630) はば≒230   → x1325–1555 y585–680
       かさ     (1270, 815) はば≒170   → x1185–1355 y720–925
       しずく   (1395, 790)・(1450, 865) 小
     出してよい四角 x1100–1580・y240–960 の中で、浮き（±9px）・回り込み を入れても 20px以上あく。
     さらに draw() で 四角の外は描かない */
  function buildTitle() {
    var mats = [];
    var root = new THREE.Group();
    var pivot = new THREE.Group(); root.add(pivot);
    var items = [
      { o: makeSun(mats),      ax: 1290, ay: 410, s: 1.18, delay: 0.00, kind: 'sun' },
      { o: makeCloud(mats),    ax: 1440, ay: 630, s: 0.95, delay: 0.25, kind: 'cloud' },
      { o: makeUmbrella(mats), ax: 1270, ay: 815, s: 1.12, delay: 0.50, kind: 'umb' },
      { o: makeDrop(mats),     ax: 1395, ay: 790, s: 0.55, delay: 0.75, kind: 'drop' },
      { o: makeDrop(mats),     ax: 1450, ay: 865, s: 0.42, delay: 0.85, kind: 'drop' }
    ];
    items.forEach(function (it) { pivot.add(it.o); });
    var CX = 1360, CY = 640;                    // 回り込みの中心

    var a = addActor(root, function (t, self) {
      var R = reduced(), u = unit();
      var c = appToWorld(CX, CY);
      root.position.set(0, 0, 0);
      pivot.position.set(c.x, c.y, 0);
      // まとまりの回り込み（とてもゆっくり）
      pivot.rotation.y = R ? 0 : Math.sin(t * 0.32) * 0.2;
      pivot.rotation.x = R ? 0 : Math.sin(t * 0.21) * 0.04;

      items.forEach(function (it, i) {
        var o = it.o, w = appToWorld(it.ax, it.ay);
        var lx = w.x - c.x, ly = w.y - c.y;     // 回り込みの中心からの位置
        var k = (t - it.delay);
        if (R) {
          o.position.set(lx, ly, 0);
          o.scale.setScalar(it.s * u);
          o.rotation.set(0, 0, 0);
          return;
        }
        // 奥（z=-14）から ばねで 飛び出す。画面の上では 同じ場所で だんだん近づいて見える
        var e = easeOutBack(k / 1.3, 1.2);
        var z = lerp(-14, 0, e);
        var tt = Math.max(0, k - 1.3), settle = clamp01(tt);
        var bob = Math.sin(tt * 0.9 + i * 1.7) * 0.09 * settle;      // 浮く（±9px）
        var p = atDepth(c.x + lx, c.y + ly + bob * u, z);
        o.position.set(p.x - c.x, p.y - c.y, z);
        o.scale.setScalar(it.s * u * Math.max(0.001, easeOutCubic(k / 0.9)));
        var spinIn = (1 - easeOutCubic(k / 1.6)) * Math.PI * 1.5;  // くるっと回りながら出る
        if (it.kind === 'sun') {
          o.rotation.set(0, spinIn + Math.sin(tt * 0.5) * 0.2, 0);
          o.userData.rays.rotation.z = -t * 0.25;                   // 光の点が ゆっくり回る
        } else if (it.kind === 'cloud') {
          o.rotation.set(0, spinIn + Math.sin(tt * 0.45 + 1) * 0.4, 0);
        } else if (it.kind === 'umb') {
          o.rotation.set(0.12, spinIn + tt * 0.3, Math.sin(tt * 0.6) * 0.12);
        } else {
          o.rotation.set(0, spinIn + tt * 0.5, 0);
        }
      });
      setOpacity(mats, clamp01(t / (R ? 0.8 : 0.4)));
      if (R && t > 0.9) self.sleeping = true;   // うごき すくなめ: 出たら止める
      return true;
    }, mats);
    if (a) a.persistent = true;
  }

  /* ---------- ふり返り ----------
     上の帯の左（x120–1200・y30–150 は空き）に 3つのシールを横にならべる
     （中心 x260・420・580、y92、直径92px。光るときも y34–150 の中）。1つずつ ぽんと出て、
     そのあと 1つずつ順に やわらかく明るくなる（1.4秒おき・1つ1回。点滅にしない） */
  var RESULT_POS = [260, 420, 580, 740], RESULT_Y = 92, RESULT_D = 92;
  // 4つめ（ステップ4・x740）を出すか: 渡された番号 → なければ ふり返り画面の中身を見る
  function step4Cleared() {
    if (document.querySelector('.board--result.is-s4')) return true;
    var imgs = document.querySelectorAll('#result-list .result-item img');
    for (var i = 0; i < imgs.length; i++) if (/medal-step4/.test(imgs[i].getAttribute('src') || '')) return true;
    return false;
  }
  function buildResult(opt) {
    var root = new THREE.Group();
    var list = [], all = [];
    var given = opt && opt.medals && opt.medals.length ? opt.medals.map(function (v) { return parseInt(v, 10); }) : null;
    // 渡されないときの 4つめ: 出る前（d=1.2秒）まで 画面を見て決める
    var show4 = given ? given.indexOf(4) >= 0 : step4Cleared(), decided4 = !!given || show4;
    for (var n = 1; n <= 4; n++) {
      if (given && given.indexOf(n) < 0) continue;
      var mm = [];
      var m = makeMedal(n, mm);
      m.userData.slot = n - 1;
      if (n === 4) m.visible = show4;      // 決まるまで かくしておく
      // 後ろの やわらかい光（ふだんは見えない）
      var haloMat = new THREE.MeshBasicMaterial({ color: 0xFFF6DA, transparent: true, opacity: 0, depthWrite: false });
      var halo = new THREE.Mesh(G('halo', function () { return new THREE.CircleGeometry(0.56, 40); }), haloMat);
      halo.position.z = -0.05;
      m.add(halo);
      root.add(m);
      list.push({ o: m, mats: mm, halo: haloMat, n: n });
      all.push.apply(all, mm);
    }
    var a = addActor(root, function (t, self) {
      var R = reduced(), u = unit();
      if (!decided4) { show4 = step4Cleared(); if (show4 || t > 1.2) decided4 = true; }
      list.forEach(function (md) {
        var on = md.n !== 4 || show4;
        md.o.visible = on;
        if (!on) return;
        var i = md.o.userData.slot;
        var p = appToWorld(RESULT_POS[i], RESULT_Y), size = RESULT_D / 100 * u;
        var d = 0.3 + i * 0.3, k = (t - d) / 0.8, o = md.o;
        if (R) {
          o.position.set(p.x, p.y, 0); o.rotation.set(0, 0, 0); o.scale.setScalar(size);
        } else {
          o.position.set(p.x, p.y, 0);
          o.rotation.set(0, (1 - easeOutCubic(k)) * Math.PI * 2, 0);
          o.scale.setScalar(size * Math.max(0.001, spring(k * 0.9, 6)));
        }
        setOpacity(md.mats, clamp01((t - d) / 0.35));
        // 順に光る: 1.8秒後から 1.4秒おき。1つ1回、1.2秒かけて ゆっくり明るく → 戻る
        var gt = (t - (1.8 + i * 1.4)) / 1.2, g = (gt > 0 && gt < 1) ? Math.sin(gt * Math.PI) : 0;
        md.halo.opacity = 0.75 * g;
        if (!R) o.scale.multiplyScalar(1 + g * 0.08);
      });
      var last = 0;
      list.forEach(function (md) { if (md.o.visible) last = Math.max(last, md.o.userData.slot); });
      if (decided4 && t > 1.8 + last * 1.4 + 1.4) self.sleeping = true;   // 光り終わったら止める（物は残す）
      return true;
    }, all);
    if (a) a.persistent = true;
  }

  /* =======================================================================
     せいかい celebrate(x, y)  1.3秒
     天気シールの紙ふぶき（44枚／小さめは22枚）が ぱっと広がり、
     小さなおひさまが1つ ぽんと出て 少し上に のぼる。
     広がりは半径300px（1920基準）まで。#side（右の列）には 入らない
     ======================================================================= */
  function celebrate(sx, sy, opt) {
    if (sx == null || sy == null || isNaN(sx) || isNaN(sy)) { var ar = appRect(); sx = ar.left + ar.width / 2; sy = ar.top + ar.height / 2; }
    var small = !!(opt && opt.small);
    if (!small && document.elementFromPoint) {
      var hit = document.elementFromPoint(sx, sy);
      if (hit && hit.closest && hit.closest('.day-cell')) small = true;
    }
    var R = reduced(), u = unit(), sc = appScale();
    var p = toWorld(sx, sy);
    var mats = [], root = new THREE.Group();
    root.position.set(p.x, p.y, 0.5);
    var DUR = 1.3;
    // 右の列（#side）の左はしまで（px → world）
    var side = rectOf('side'), maxRight = Infinity;
    if (side && sx < side.left) maxRight = Math.max(0, (side.left - 40 * sc - sx) / ppu);
    var maxR = 300 * sc / ppu * 0.92;

    var N = R ? 0 : (small ? 22 : 44), conf = null, parts = [];
    if (N) {
      conf = makeConfetti(N, mats);
      conf.meshes.forEach(function (m) { root.add(m); });
      for (var i = 0; i < N; i++) {
        var ang = Math.random() * Math.PI * 2, sp = (small ? 0.3 : 0.35) + Math.sqrt(Math.random()) * (small ? 0.45 : 0.62);
        parts.push({
          dx: Math.cos(ang) * sp, dy: Math.sin(ang) * sp * 0.85 + 0.15, dz: (Math.random() - .5) * 0.6,
          rx: Math.random() * 6, ry: Math.random() * 6, wr: 4 + Math.random() * 5, s: (1.3 + Math.random() * 0.9) * u
        });
      }
    }
    var sunMats = [];
    var sun = makeSun(sunMats); mats.push.apply(mats, sunMats);
    root.add(sun);
    var m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), v = new THREE.Vector3(), s3 = new THREE.Vector3();

    addActor(root, function (t) {
      var k = t / DUR;
      if (k >= 1) return false;
      if (conf) {
        var spread = easeOutCubic(k / 0.55);
        for (var i = 0; i < N; i++) {
          var pp = parts[i];
          var x = pp.dx * spread * maxR, y = pp.dy * spread * maxR - k * k * 0.35 * maxR;   // 広がって ひらひら落ちる
          x += Math.sin(t * pp.wr) * 0.04 * u;
          var len = Math.sqrt(x * x + y * y);
          if (len > maxR) { x *= maxR / len; y *= maxR / len; }
          if (x > maxRight) x = maxRight;
          v.set(x, y, pp.dz * u);
          e3.set(pp.rx + t * pp.wr, pp.ry + t * pp.wr * 0.7, 0); q.setFromEuler(e3);
          s3.setScalar(pp.s * (k < 0.06 ? k / 0.06 : 1));
          m4.compose(v, q, s3);
          var at = conf.at(i); at[0].setMatrixAt(at[1], m4);
        }
        conf.meshes.forEach(function (m) { m.instanceMatrix.needsUpdate = true; });
      }
      // 小さなおひさま: ぽんと出て（ばね）、少し上へ
      var ss = (small ? 0.36 : 0.46) * u;
      if (R) {
        sun.position.set(0, 0.9 * u, 0.3);
        sun.scale.setScalar(ss);
        sun.rotation.set(0, 0, 0);
      } else {
        sun.position.set(0, (0.7 + easeOutCubic(k) * 0.45) * u, 0.3);
        sun.scale.setScalar(ss * Math.max(0.001, spring(t * 1.3, 7)));
        sun.rotation.set(0, 0, -t * 1.2);
      }
      setOpacity(mats, R ? Math.sin(clamp01(k) * Math.PI) : (k < 0.65 ? 1 : 1 - (k - 0.65) / 0.35));
      return true;
    }, mats);
  }

  /* =======================================================================
     まちがい encourage()  1.4秒
     右の列の、ふきだし（#speech）と せんぱい（#guide）の あいだの すきま
     （1920基準 中心 (1760, 718)・はば約105px）に、首をかしげる せんぱいの
     「かんがえ中の くも」として 小さなくもが ふわっと出て、1回 こくん と うなずいて 消える。
     ふきだしの文字には かからない（design.md の y420–600 だと文字に重なったので 下の すきまへ）。
     #speech・#guide が見つかれば その間に合わせる。雨・赤・×・ゆれは使わない
     ======================================================================= */
  function encourage() {
    var R = reduced();
    var mats = [];
    var cloud = makeCloud(mats);
    var D = R ? 1.2 : 1.4;
    addActor(cloud, function (t) {
      var k = t / D;
      if (k >= 1) return false;
      var u = unit(), p = encouragePos(), s = 0.5 * u;
      if (R) {
        cloud.position.set(p.x, p.y, 0.5); cloud.rotation.set(0, 0, 0); cloud.scale.setScalar(s);
        setOpacity(mats, Math.sin(clamp01(k) * Math.PI));
        return true;
      }
      var appear = easeOutBack(k / 0.25, 1.2);
      // うなずき: 0.35〜0.75 で 前に こくん（1回だけ）
      var nod = (k > 0.35 && k < 0.75) ? Math.sin((k - 0.35) / 0.4 * Math.PI) : 0;
      cloud.position.set(p.x, p.y + (0.15 * (1 - clamp01(k / 0.3)) - nod * 0.06) * u, 0.5);
      cloud.rotation.set(nod * 0.45, 0, 0);
      cloud.scale.set(s * Math.max(0.001, appear), s * Math.max(0.001, appear) * (1 - nod * 0.05), s);
      setOpacity(mats, fadeInOut(k, 0.15, 0.78));
      return true;
    }, mats);
  }

  // ふきだしの下はし と せんぱいの上はし の まんなか（すきまが せまいときは 決まった位置）
  function encouragePos() {
    var sp = rectOf('speech'), gd = rectOf('guide'), sc = appScale();
    var def = appToScreen(1760, 718);
    if (sp && gd) {
      var top = sp.bottom + 36 * sc, bottom = gd.top;
      if (bottom - top > 70 * sc) return toWorld(Math.min(sp.right - 80 * sc, def.x), (top + bottom) / 2);
    }
    return toWorld(def.x, def.y);
  }

  /* =======================================================================
     ステップクリア stepClear(n)  1.75秒（Promise）
     medal-step{n} のシールが 手前の上から くるっと回って おりてきて、
     #clear-medal（中心 (430, 461)・直径380px）に「ぺたっ」と はられる（つぶれて もどる）。
     まわりに 紙ふぶきが少し。最後に ふわっと消えて 画像のメダルにつながる
     ======================================================================= */
  function stepClear(n) {
    n = Math.max(1, Math.min(4, parseInt(n, 10) || 1));
    var R = reduced();
    var D = R ? 1.2 : 1.75;
    return new Promise(function (resolve) {
      var done = false;
      var finish = function () { if (done) return; done = true; var i = pending.indexOf(finish); if (i >= 0) pending.splice(i, 1); resolve(); };
      pending.push(finish);
      setTimeout(finish, D * 1000 + 100);     // rAF が止まっても 必ず終わる
      if (!alive) { finish(); return; }

      var mats = [];
      var medal = makeMedal(n, mats);
      var shadowMat = new THREE.MeshBasicMaterial({ color: C.ink, transparent: true, opacity: 0, depthWrite: false });
      var shadow = new THREE.Mesh(G('shadow', function () { return new THREE.CircleGeometry(0.44, 40); }), shadowMat);
      var root = new THREE.Group();
      root.add(shadow, medal);
      var burst = false;

      addActor(root, function (t) {
        var k = t / D;
        if (k >= 1) return false;
        var r = rectOf('clear-medal'), p, size;
        if (r) { p = toWorld(r.left + r.width / 2, r.top + r.height / 2); size = r.width / ppu; }
        else { p = appToWorld(430, 461); size = 380 / 100 * unit(); }
        root.position.set(0, 0, 0);

        if (R) {
          medal.position.set(p.x, p.y, 0); medal.rotation.set(0, 0, 0); medal.scale.setScalar(size);
          setOpacity(mats, fadeInOut(k, 0.25, 0.7)); shadowMat.opacity = 0;
          return true;
        }
        var T1 = 0.85, T2 = 1.0, T3 = 1.4;
        var z, lift, rotY, rotX, sx = 1, sz = 1;
        if (t < T1) {               // 手前・上から くるっと（2回転）おりる
          var e = easeOutCubic(t / T1);
          z = lerp(7, 1.2, e); lift = lerp(0.5, 0, e) * size;
          rotY = (1 - e) * Math.PI * 4; rotX = (1 - e) * -0.6;
        } else if (t < T2) {        // ぺたっ: 紙に おしつける
          z = lerp(1.2, 0, easeInQuad((t - T1) / (T2 - T1))); lift = 0; rotY = 0; rotX = 0;
        } else {                    // つぶれて ばねで もどる
          z = 0; lift = 0; rotY = 0; rotX = 0;
          var s = spring(t - T2, 9), squash = 1 - (1 - s) * 0.45;
          sx = 1 + (1 - squash) * 0.25; sz = squash;
          if (!burst) { burst = true; ring(p, size); }
        }
        var q = atDepth(p.x, p.y + lift, z);
        medal.position.set(q.x, q.y, z);
        medal.rotation.set(rotX, rotY, 0);
        medal.scale.set(size * sx, size * sx, size * sz);
        shadow.position.set(p.x + 0.02 * size, p.y - 0.03 * size, -0.05);
        shadow.scale.setScalar(size * lerp(1.2, 1, clamp01(1 - z / 7)));
        var op = t < 0.12 ? t / 0.12 : t > T3 ? 1 - (t - T3) / (D - T3) : 1;
        setOpacity(mats, op);
        shadowMat.opacity = 0.16 * clamp01(1 - z / 7) * op;
        return true;
      }, mats.concat([shadowMat]), finish);
    });
  }
  // ぺたっ と はられたときの 紙ふぶきの輪（小さめ・0.8秒）
  function ring(p, size) {
    var N = 24, mats = [];
    var conf = makeConfetti(N, mats);
    var g = new THREE.Group();
    conf.meshes.forEach(function (m) { g.add(m); });
    g.position.set(p.x, p.y, 0.3);
    var ps = [];
    for (var i = 0; i < N; i++) ps.push({ a: i / N * Math.PI * 2 + Math.random() * 0.2, sp: 0.85 + Math.random() * 0.3, r: Math.random() * 6, w: 3 + Math.random() * 4 });
    var m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
    addActor(g, function (t) {
      var k = t / 0.8;
      if (k >= 1) return false;
      var d = (0.5 + easeOutCubic(k) * 0.16) * size;
      sc.setScalar(size * 0.42);
      for (var i = 0; i < N; i++) {
        var pp = ps[i];
        v.set(Math.cos(pp.a) * d * pp.sp, Math.sin(pp.a) * d * pp.sp - k * k * 0.05 * size, 0.1);
        e3.set(pp.r + t * pp.w, pp.r * 0.5 + t * pp.w, 0); q.setFromEuler(e3);
        m4.compose(v, q, sc);
        var at = conf.at(i); at[0].setMatrixAt(at[1], m4);
      }
      conf.meshes.forEach(function (m) { m.instanceMatrix.needsUpdate = true; });
      setOpacity(mats, k < 0.55 ? 1 : 1 - (k - 0.55) / 0.45);
      return true;
    }, mats);
  }

  function flushPending() {
    var p = pending.slice(); pending = [];
    p.forEach(function (f) { try { f(); } catch (e) {} });
  }

})();
