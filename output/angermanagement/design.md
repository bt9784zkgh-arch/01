# デザイン設計書 ― いかりと なかよく なろう

## 1. テーマ
**「ほけんしつの けいじばん ― こころの おんどけい」**

保健室のかべ（クラフト紙）に、手で書いた画用紙のけいじ物がマスキングテープでとめてある、という見た目。
いかりを「こわい赤い炎」ではなく **こころの温度（おんど）** として扱う。温度計は、上がることも、下げることもできる。
- 主役のモチーフ: **こころの おんどけい**（たての くだ＋下の まるい玉）と、**ハートの中の 小さな ほのお**（いかりマーク）
- 案内役: 保健室の先生（めがね・みどりのカーディガン。おだやかな表情）
- 中学生向けに、幼い絵本調にしない。線は手描き風に少しゆらし、色は彩度をおさえる。絵文字は使わず自作SVGを使う
- 赤は「やさしい赤（サーモン）」だけ。真っ赤・黒い背景・とがった炎・画面のゆれは使わない

## 2. 色（16進）
| 用途 | 変数 | 色 | メモ |
|---|---|---|---|
| かべ（背景） | `--c-wall` | `#E8DDC8` | クラフト紙。うすいせんいのノイズ付き |
| 画用紙（けいじばん） | `--c-paper` | `#FBF7EF` | 問題エリアの地 |
| 文字・線 | `--c-ink` | `#33302C` | 紙の上 12.3:1 / かべの上 9.8:1 |
| 補足文字 | `--c-ink-soft` | `#5E5750` | 紙の上 6.6:1 |
| 主色（ボタン・せいかい・フォーカス） | `--c-primary` | `#2F6B62` | 深いみどり。白文字 6.2:1 |
| 主色のうすい地 | `--c-primary-bg` | `#E6F0EC` | せいかい・えらんだ |
| マスキングテープ | `--c-tape` | `#EBC9A8` | 飾り（問題エリアの外） |
| はだ | `--c-skin` | `#F7E3C8` | 人物 |

**決まった意味の色（lesson-plan.md どおり固定。色だけでなく形・もよう・ことばでも区別）**
| 意味 | 地の色 | こい色（線・影） | 形・もよう | ことば |
|---|---|---|---|---|
| いかり 小さい | `#A9C6E3` 青 | `#2F5F8A` | ほのお **1つ**・**水玉** | 小さい |
| いかり 中くらい | `#F1D88A` 黄 | `#7A5C0E` | ほのお **2つ**・**ななめ線** | 中くらい |
| いかり 大きい | `#EFAE9B` やさしい赤 | `#A0432E` | ほのお **3つ**・**こうし** | 大きい |
| かえられる | `#F2BC85` オレンジ | `#9A5414` | **て**のアイコン・**まるい箱** | かえられる |
| かえられない | `#C9CCD1` グレー | `#5B6068` | **かぎ**のアイコン・**角ばった箱（ふたの線）** | かえられない |

- どの地の色の上でも、文字は `--c-ink`（7:1以上）。こい色の上は白文字（5:1以上）。すべて WCAG AA 4.5:1 以上を確認済み
- せいかい＝みどり＋**はなまるスタンプ＋「せいかい」の文字**。まちがい＝**点線のわく＋やさしい「？」＋「もういちど みてみよう」**。赤い×・赤い色は まちがいに使わない

## 3. フォント
| 用途 | 指定（左から順に使える物） |
|---|---|
| 本文・問題・ボタン | `"Zen Maru Gothic", "Hiragino Maru Gothic ProN", "BIZ UDPGothic", "UD Digi Kyokasho NK-R", "Yu Gothic UI", "Yu Gothic", "Meiryo", "Noto Sans JP", sans-serif` |
| 見出し（手書き風） | `"Klee One", "UD Digi Kyokasho NK-B", "UD デジタル 教科書体 NK-B", "YuKyokasho", "Hiragino Maru Gothic ProN", "BIZ UDPGothic", "Meiryo", sans-serif` |

- Google Fonts は `style.css` 先頭の `@import`（display=swap）。**ネットが無くても** Windows の BIZ UDPゴシック／UDデジタル教科書体、Mac のヒラギノ丸ゴで同じ配置のまま読める（1280×720 で確認済み）
- 文字の大きさ（1920×1080 基準）: 問題文 48px／選択肢 40px／本文・せんせいのことば 32px／いちばん小さい文字 28px。行間 1.55〜1.65
- 文は **分かち書き（ことばの間にスペース）** で書く。CSS は `word-break: keep-all` なので、スペースの所でだけ改行する

## 4. 画面サイズ
- `#app` は 1920×1080 の固定キャンバス。**game.js で次を必ず入れる**（JSが無いときは CSS の zoom で段階的に縮む）
```js
function fitApp(){
  const s = Math.min(innerWidth/1920, innerHeight/1080);
  document.documentElement.style.setProperty('--app-scale', s);
}
document.documentElement.classList.add('js-fit');
addEventListener('resize', fitApp); fitApp();
```
- `#stage3d` は `#app` の **外**（`position:fixed; inset:0`）。`Motion3D.celebrate(x, y)` には `getBoundingClientRect()` の画面座標（px）をそのまま渡せばよい

## 5. 画面の配置（全ステップで同じ位置）
```
┌──────────────────────────────────────────────────────────────────── 1920 ┐
│ [#step-tag ステップ名]  #progress「ステップ1／もんだい2／4」●◎○○   #settings [おと][うごき][おやすみ][もどる] │ y 24–164
│                                                                          │
│ ┌テープ─────────────── .board.paper (#board)  x40 y190 1840×864 ─────テープ┐ │
│ │ #question-area  (1300×190)                          │ #side (約410)   │ │
│ │   .q-text 問題文 48px（ruby）            [#btn-read よむ]│                 │ │
│ │ - - - - - - - - - - - - - - - - - - - - - - - - - - - │  #speech        │ │
│ │ #visual  (1300×360)  絵・メーター・カード               │  ふきだし        │ │
│ │   ※ #feedback はここに重なって出る                      │                 │ │
│ │ #choices (1300×約240)                                 │  #teacher       │ │
│ │   [ 1 選択肢 ]   [ 2 選択肢 ]   [ 3 選択肢 ]  (間40px)  │  せんせい        │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```
- 問題中は `#visual`・`#choices` の上で何も動かさない。飾り（テープ・3Dの浮かぶ物）は `#board` の外か `#side` の上のすきまだけ
- `#step-tag` にはステップ名を書く（1「いかりは だれにでも ある」2「いかりの ことばと 強さ」3「かえられる？ かえられない？」）。番号は `#progress` に出す

### 各画面
| 画面 | 要素 | 配置 |
|---|---|---|
| タイトル `#screen-title` | `.paper.poster`（左・少しかたむいたポスター）に `h1.title-logo`「いかりと <span class="accent">なかよく</span> なろう」、`.title-sub`「こころの おんどけいを しらべよう」、`#btn-start.btn-primary`「はじめる」。右に `img.title-ondokei`（kokoro-ondokei.svg）、右下に `.teacher` | 中央寄せの定型にしない。3Dはポスターの右側の空間で演出 |
| おてほん（`#screen-play` を `data-mode="model"` で使う） | `.q-text` に先生の説明、`#visual` に絵、`#speech` に先生のことば、`#choices` の右はしに `#btn-next.btn-primary`「つぎへ」 | 問題と同じ位置 |
| 問題（`#screen-play` `data-mode="quiz"`） | 上の図のとおり | |
| せいかい | 押した `.choice` に `.is-correct`、`#feedback.feedback--good.is-show`（stamp-hanamaru.svg＋ほめことば）、`#teacher.is-happy` | 1.2秒後に「つぎへ」が出る（自動で進めない） |
| もういちど | 押した `.choice` に `.is-retry`、`#feedback.feedback--retry.is-show`（stamp-retry.svg＋「もういちど みてみよう」）、`#teacher.is-thinking` | 2回目: 正解でない物に `.is-dimmed`。3回目: 正解に `.is-guide` |
| ステップ2 置いた | `.choice.is-placed`（「おいたね」）、`#feedback.feedback--accept.is-show`、`#meter` の該当 `.meter-zone` に `.word-card.word-card--chip` を追加 | 正誤なし |
| ステップクリア `#screen-clear` | `.board.paper` の中に `.clear-wrap` > `img#clear-medal`（medal-step{n}.svg）＋`p.clear-text`「ステップ1 クリア！」、`#choices` 位置に「つぎへ」 | 3Dの `stepClear(n)` と同時。WebGLが無くてもメダル画像で伝わる |
| ふり返り `#screen-result` | `.board.paper` > `ul.result-list` > `li.result-item`（medal-step1〜3.svg＋lesson-planの3文）、`p.result-note`、`.result-actions` に `#btn-again.btn-secondary`「もういちど」`#btn-end.btn-primary`「おわる」 | ⭐の絵文字のかわりにメダル画像 |
| おやすみ `#rest-overlay` | 全面の紙。icon-rest.svg＋「ひとやすみ しよう。いつでも もどれるよ」＋`#btn-resume.btn-primary`「つづける」 | `#btn-rest` で開く。音は止める |

### ステップごとの `#visual` と `#choices`
| ステップ | `#visual` | `#choices` |
|---|---|---|
| 1 | 絵1枚（people.svg / stamp-ok.svg＋face-0.svg / flame-shrink.svg など） | `button.choice.choice--yesno` ×2（540×200）。`img.choice-icon` に icon-maru.svg / icon-batsu.svg（Q2のみ。他はことばだけでもよい） |
| 2 (Q1・Q2) | 左: `.word-card`（moyamoya.svg＋「イライラ」）、右: `#meter.meter`（`.meter-tube` と `.meter-zone.lv3/.lv2/.lv1`、上が大きい） | `button.choice.choice--level.lv1/.lv2/.lv3` ×3（380×210）。中に level-1/2/3.svg＋「小さい／中くらい／大きい」 |
| 2 (Q3・Q4) | `#meter` だけ（または2枚の絵 moyamoya.svg / dokan.svg） | `button.choice.choice--word` ×2（ことば＋絵: moyamoya / dokan、flame大小は level-1/level-3） |
| 3 | `.situation-card`（絵＋状況のことば） | `button.choice.choice--box.can`（icon-hand.svg「かえられる」）、`.cannot`（icon-lock.svg「かえられない」） ×2（580×220） |

## 6. 要素ID・クラス名 一覧（game-builder・motion-3d・sound-maker 共通）

### ID（ページに1つ）
| ID | 役割 |
|---|---|
| `#stage3d` | 3Dキャンバスを重ねる入れ物。`#app` の外。`pointer-events:none`、z-index 50 |
| `#app` | 1920×1080 の画面本体（`--app-scale` で拡大縮小） |
| `#screen-title` / `#screen-play` / `#screen-clear` / `#screen-result` | 画面（`.screen`、表示中だけ `.is-active`） |
| `#topbar` | 上の帯 |
| `#step-tag` | ステップ名の札 |
| `#progress` | 進み具合（中に `.progress-text` と `ol.progress-dots > li.dot`） |
| `#settings` | 右上の設定ボタン群 |
| `#btn-sound` | おと あり／なし（`aria-pressed`。icon-sound-on / icon-sound-off） |
| `#btn-motion` | うごき ふつう／すくなめ（`aria-pressed`。icon-motion / icon-motion-less） |
| `#btn-rest` | おやすみ（icon-rest） |
| `#btn-back` | もどる（icon-back） |
| `#board` | 問題画面のけいじばん（class `board paper`） |
| `#question-area` | 問題エリア |
| `#q-text` | 問題文（class `q-text`。`<ruby>漢字<rt>ふりがな</rt></ruby>`） |
| `#btn-read` | 🔈よむ（class `read-btn`。icon-speaker。読み上げ中 `.is-reading`） |
| `#visual` | 絵・図エリア |
| `#meter` | ステップ2のいかりメーター（class `meter`） |
| `#choices` | 選択肢エリア |
| `#feedback` | せいかい／もういちど／おいたね の札（`#visual` に重なる） |
| `#side` | 右の列（ふきだし＋せんせい） |
| `#speech` | せんせいのふきだし |
| `#teacher` | せんせいの絵（teacher.svg） |
| `#btn-start` / `#btn-next` / `#btn-again` / `#btn-end` / `#btn-resume` | はじめる／つぎへ／もういちど／おわる／つづける |
| `#clear-medal` | ステップクリアのメダル画像 |
| `#rest-overlay` | おやすみ画面（`.is-show`） |

### クラス
| クラス | 役割 |
|---|---|
| `.screen` `.is-active` | 画面の切りかえ |
| `.paper` `.board` `.poster` | 画用紙・けいじばん・タイトルのポスター |
| `.tape .tape--tl / .tape--tr` `.pin` | テープ・おしピン（飾り。`.board` の角に置く） |
| `.dot` `.is-now` `.is-done` | 進み具合の丸（未: 点線の丸／いま: 太い輪／済: 塗り＋チェック） |
| `.set-btn` | 設定ボタン（128×128） |
| `.q-text` `ruby` `rt` | 問題文とふりがな。`body.furigana-off` で rt を隠せる（先生用） |
| `.read-btn` | 読み上げボタン |
| `.visual-img` | `#visual` の絵 |
| `.choice` | 選択肢ボタン（共通。最小 240×180、となりと40px） |
| `.choice--yesno` `.choice--level .lv1/.lv2/.lv3` `.choice--word` `.choice--box .can/.cannot` | 選択肢の種類 |
| `.choice-icon` | 選択肢の中の絵 |
| `.key-num` | 選択肢の左上の数字（1〜4キーの目じるし） |
| `.is-selected` `.is-correct` `.is-placed` `.is-retry` `.is-dimmed` `.is-guide` | 選択肢の状態 |
| `.feedback--good` `.feedback--accept` `.feedback--retry` `.is-show` | `#feedback` の種類 |
| `.speech` `.teacher` `.is-thinking` `.is-happy` | せんせい（首をかしげる／少しはねる） |
| `.word-card` `.word-card--chip` | ことばカード／メーターに置いた小カード |
| `.meter` `.meter-tube` `.meter-zone .lv1/.lv2/.lv3` `.meter-label` | いかりメーター |
| `.situation-card` `.is-picked` | ステップ3の状況カード |
| `.btn-primary` `.btn-secondary` | 大きいボタン（はじめる・つぎへ 等） |
| `.title-logo` `.accent` `.title-sub` `.title-ondokei` | タイトル画面 |
| `.clear-wrap` `.clear-text` | ステップクリア |
| `.result-list` `.result-item` `.result-note` `.result-actions` | ふり返り |
| `body.reduce-motion` | うごき すくなめ（CSSのアニメ・トランジションを止める） |
| `.sr-only` | 画面に出さず読み上げ用 |
| `html.js-fit` | fitApp() が動いている目じるし |

## 7. 素材（assets/ すべて自作SVG）
| ファイル | 内容 | 使う場所 |
|---|---|---|
| teacher.svg | 保健室の先生 | `#teacher`、タイトル |
| kokoro-ondokei.svg | こころの温度計（下 青・水玉／中 黄・ななめ線／上 赤・こうし、左に●1〜3個） | タイトル、おてほん（ステップ2） |
| ikari-mark.svg | ハートの中の小さなほのお | おてほん（ステップ1） |
| level-1/2/3.svg | いかりの大きさのバッジ（ほのお1/2/3つ＋もよう） | `.choice--level`、`.meter-label` |
| face-0〜3.svg | にこにこ／むっ／こまった／まゆをよせた（こわくない） | おてほん1、ステップ2のヒント |
| people.svg | いろいろな人5人、むねに小さなほのお | 1-1、1-3 |
| flame-shrink.svg / breath.svg | ほのおが小さくなる／しんこきゅう | 1-4 とヒント |
| stamp-ok.svg | OKスタンプ | 1-2 |
| moyamoya.svg / dokan.svg | イライラ（もやもや）／爆発（ドカン） | ステップ2 |
| trip.svg / typhoon.svg / rain.svg / quake.svg / traffic.svg / study.svg / heart-change.svg | 修学旅行と台風／台風／雨／地震／渋滞／勉強で点数↑／ハート赤→青 | ステップ3 |
| icon-hand.svg / icon-lock.svg | かえられる／かえられない | `.choice--box` |
| icon-maru.svg / icon-batsu.svg | まる（みどり）／ばつ（グレー） | ステップ1 |
| icon-speaker / icon-sound-on / icon-sound-off / icon-motion / icon-motion-less / icon-rest / icon-back / icon-hint .svg | 操作アイコン | `#settings`、`#btn-read` |
| stamp-hanamaru.svg / stamp-retry.svg | せいかい／もういちど | `#feedback`、`.is-correct` |
| medal-step1/2/3.svg | ステップクリアのメダル（ハート／温度計／て） | `#clear-medal`、ふり返り |
| pin.svg | おしピン（飾り） | `.board` の角 |

## 8. 3D担当（motion-3d）向け
- **`theme` オブジェクト**（`Motion3D.init(el, { theme })` で渡す。game.js にこのまま書く）
```js
const THEME = {
  paper: 0xFBF7EF, wall: 0xE8DDC8, ink: 0x33302C, primary: 0x2F6B62, tape: 0xEBC9A8,
  lv1: 0xA9C6E3, lv2: 0xF1D88A, lv3: 0xEFAE9B,
  can: 0xF2BC85, cannot: 0xC9CCD1, skin: 0xF7E3C8
};
```
- 質感: `MeshToonMaterial`（2〜3段階のグラデーションマップ）＋輪郭は少し太めの `EdgesGeometry`（色 ink）。光沢・金属・発光は使わない。背景は透明（`alpha:true`）
- **モチーフと作り方**
| モチーフ | 立体の作り方 | 色 |
|---|---|---|
| こころの温度計（主役） | `CylinderGeometry`（くだ、半径0.18・高さ1.6）＋上に `SphereGeometry` 半分＋下に `SphereGeometry`（玉、半径0.35）。中の液は細い Cylinder を3段（下 lv1・中 lv2・上 lv3） | 外: paper、液: lv1/lv2/lv3 |
| ハート（いかりマーク） | `THREE.Shape` でハートを描き `ExtrudeGeometry`（depth 0.2・bevel 小） | 地 `#F6D9CF`、中に小さなほのお |
| 小さなほのお | `LatheGeometry`（しずくの形の輪郭を回す）か `ConeGeometry`＋下に `SphereGeometry`。先を丸く | lv3（やさしい赤）。下げるとき lv1 に色を変えてもよい |
| しずく（落ち着いた） | ほのおと同じ形を上下さかさに | lv1 |
| 紙ふぶき | `PlaneGeometry`（0.08×0.12）を両面で。ひらひら回転 | paper / lv1 / lv2 / can / primary |
| スタンプ・メダル | うすい `CylinderGeometry`（半径0.6・厚さ0.08）。表にテクスチャで medal-step{n}.svg を貼ってもよい（`CanvasTexture`） | 地 paper、ふち primary |
| マスキングテープの切れはし | うすい `BoxGeometry` を少しねじる | tape |
- 場面
  - タイトル: 温度計・ハート・しずくがポスターの右側で ゆっくり浮かぶ。温度計の液が 上がって→下がる（いかりは下げられる、のメッセージ）
  - 問題中（`setScene('play')`）: `#board` の上では何も動かさない。浮かぶ物を出すなら `#side` の上の小さな空間か画面のはしで、とてもゆっくり
  - せいかい `celebrate(x,y)`: 紙ふぶき＋小さなハートがふわっと広がる（1〜1.5秒）。ほのおは使わない
  - まちがい `encourage()`: しずくが1つ ぽとんと落ちる程度。赤・×・ゆれは使わない
  - `stepClear(n)`: メダル（1 ハート／2 温度計／3 て）がくるっと回って紙に「ポン」と押される（2秒以内）
  - ふり返り: 3つのメダルが並び、1つずつ順にやわらかく明るくなる（1秒に1回以下）

## 9. 音と演出を出す場所（sound-maker・game-builder 向け）
| きっかけ | 音 `Sound.play()` | 3D `Motion3D` | 画面（CSS） |
|---|---|---|---|
| 「はじめる」 | `Sound.start()`（BGM小さく。保健室のおだやかさ: オルゴール・木琴・やわらかいパッド） | `setScene('play')` | |
| ボタンを押した | `tap`（ぽん） | | `.choice:active` で沈む |
| せいかい | `correct` | `celebrate(x,y)` | `.is-correct`・`#feedback.feedback--good`・`#teacher.is-happy` |
| ステップ2で置いた | `correct`（同じ音でよい。正誤ではなく「受けとめた」音） | `celebrate(x,y)` を小さく | `.is-placed`・`.feedback--accept` |
| まちがい | `retry`（ぽわん。やさしい低め） | `encourage()` | `.is-retry`・`#teacher.is-thinking` |
| ステップクリア | `clear`（短いファンファーレ） | `await stepClear(n)` | `#screen-clear` |
| ふり返り | （BGMのみ） | `setScene('result')` | |
| おやすみ | BGMを止める（`Sound.setMuted(true)` か `stop()`）。もどったら元の設定に | 何もしない | `#rest-overlay.is-show` |
- 曲のイメージ: 「保健室で ほっと する」。テンポ 84 前後、長調、音は少なめ

## 10. 見やすさのチェック（このデザインで守っていること）
- 文字 28px以上・問題文 48px・行間 1.55以上／コントラスト 4.5:1以上（数値は2章）
- ボタン: 選択肢 240×180以上（実寸 380〜580×200〜220）、設定 128×128、よむ 168×128。となりとの間 24〜40px
- 色だけにしない: いかりの大きさ＝ほのおの数＋もよう＋ことば、かえられる/ない＝アイコン＋箱の形＋ことば、せいかい＝はなまる＋ことば、進み具合＝塗り＋チェック
- 点滅なし。`.is-guide` のやさしい明暗は 2.4秒に1回。画面全体が光る演出なし
- `body.reduce-motion` と `prefers-reduced-motion` でCSSの動きを止める（3Dは `Motion3D.setReducedMotion(true)`）
- キーボード: すべての押せる物に太いみどりの `:focus-visible` わく。`.key-num` で1〜4キーを見せる
- 1280×720 で縮めても重ならないことを確認済み
