import React from "react";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Img,
  Series,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { loadFont } from "@remotion/fonts";

// ---- 色（design.md にそろえる） ----
const C = {
  paper: "#fffdf8",
  ink: "#2d3b4e",
  kokoro: "#3f6fb0",
  kotoba: "#d9782d",
  kurashi: "#3f8f5f",
};

const FONT_UD = "BIZ UDGothic";
const FONT_MARU = "Zen Maru Gothic";

loadFont({ family: FONT_UD, url: staticFile("fonts/BIZUDGothic-Bold.ttf"), weight: "700" });
loadFont({ family: FONT_UD, url: staticFile("fonts/BIZUDGothic-Regular.ttf"), weight: "400" });
loadFont({ family: FONT_MARU, url: staticFile("fonts/ZenMaruGothic-Bold.ttf"), weight: "700" });

const FPS = 30;
const W = 1080;
const H = 1920;

// 画面写真の枠（縦型の上側）
const CARD = { x: 40, y: 330, w: 1000, h: 562.5 };
// 字幕の枠（下1/3 = y1280 より上におさめる）
const CAPTION = { top: 975, height: 265 };

type View = { s: number; x: number; y: number }; // s=ズーム倍率, x/y=注目点(0〜1)
type Shot = { src: string; from: View; to: View };
type Cap = { lines: [string] | [string, string]; start: number; end: number };

type SceneDef = {
  id: string;
  seconds: number;
  color: string;
  chip?: string; // 小さな見出し（例: ステップ1）
  heading: string;
  shots: Shot[];
  captions: Cap[];
  kind?: "title" | "normal";
};

const ease = Easing.bezier(0.45, 0, 0.55, 1);

// 注目点が枠の中心に来るように、はみ出さない範囲で移動量を出す
const offsetFor = (v: View) => {
  const maxX = (CARD.w * (v.s - 1)) / 2;
  const maxY = (CARD.h * (v.s - 1)) / 2;
  const tx = Math.max(-maxX, Math.min(maxX, (0.5 - v.x) * CARD.w * v.s));
  const ty = Math.max(-maxY, Math.min(maxY, (0.5 - v.y) * CARD.h * v.s));
  return { tx, ty };
};

const ShotLayer: React.FC<{ shot: Shot; start: number; dur: number; opacity: number }> = ({
  shot,
  start,
  dur,
  opacity,
}) => {
  const frame = useCurrentFrame() - start;
  if (opacity <= 0) return null;
  const t = interpolate(frame, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const v: View = {
    s: shot.from.s + (shot.to.s - shot.from.s) * t,
    x: shot.from.x + (shot.to.x - shot.from.x) * t,
    y: shot.from.y + (shot.to.y - shot.from.y) * t,
  };
  const { tx, ty } = offsetFor(v);
  return (
    <Img
      src={staticFile(`shots/${shot.src}.jpg`)}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: CARD.w,
        height: CARD.h,
        opacity,
        translate: `${tx}px ${ty}px`,
        scale: String(v.s),
      }}
    />
  );
};

const ShotCard: React.FC<{ shots: Shot[]; total: number; color: string }> = ({
  shots,
  total,
  color,
}) => {
  const frame = useCurrentFrame();
  const n = shots.length;
  const seg = total / n;
  const xf = 18; // クロスフェード（0.6秒）
  return (
    <div
      style={{
        position: "absolute",
        left: CARD.x - 17,
        top: CARD.y - 17,
        width: CARD.w + 34,
        height: CARD.h + 34,
        boxSizing: "border-box",
        background: "#ffffff",
        borderRadius: 22,
        border: `3px solid ${C.ink}`,
        boxShadow: "6px 8px 0 rgba(45,59,78,0.12)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 14,
          top: 14,
          width: CARD.w,
          height: CARD.h,
          overflow: "hidden",
          borderRadius: 12,
          background: C.paper,
        }}
      >
        {shots.map((shot, i) => {
          const start = i * seg;
          const opacity =
            i === 0
              ? 1
              : interpolate(frame, [start - xf / 2, start + xf / 2], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: ease,
                });
          return (
            <div key={shot.src + i} style={{ position: "absolute", inset: 0 }}>
              <ShotLayer shot={shot} start={i === 0 ? 0 : start - xf / 2} dur={seg + xf} opacity={opacity} />
            </div>
          );
        })}
      </div>
      {/* マスキングテープ風の飾り */}
      <div
        style={{
          position: "absolute",
          left: 70,
          top: -22,
          width: 150,
          height: 34,
          background: color,
          opacity: 0.35,
          rotate: "-4deg",
          borderRadius: 3,
        }}
      />
    </div>
  );
};

const Heading: React.FC<{ chip?: string; text: string; color: string }> = ({ chip, text, color }) => (
  <div
    style={{
      position: "absolute",
      left: 60,
      right: 60,
      top: 120,
      height: 170,
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      gap: 14,
    }}
  >
    {chip ? (
      <div
        style={{
          alignSelf: "flex-start",
          fontFamily: FONT_UD,
          fontWeight: 700,
          fontSize: 38,
          color: "#fff",
          background: color,
          padding: "6px 22px",
          borderRadius: 999,
        }}
      >
        {chip}
      </div>
    ) : null}
    <div
      style={{
        fontFamily: FONT_MARU,
        fontWeight: 700,
        fontSize: 64,
        lineHeight: 1.2,
        color: C.ink,
        whiteSpace: "nowrap",
        borderBottom: `5px solid ${color}`,
        paddingBottom: 10,
        alignSelf: "flex-start",
      }}
    >
      {text}
    </div>
  </div>
);

const Captions: React.FC<{ caps: Cap[]; color: string }> = ({ caps, color }) => {
  const frame = useCurrentFrame();
  const fade = 9;
  return (
    <>
      {caps.map((c, i) => {
        const s = c.start * FPS;
        const e = c.end * FPS;
        if (frame < s - 1 || frame > e + 1) return null;
        const opacity = interpolate(frame, [s, s + fade, e - fade, e], [0, 1, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 50,
              right: 50,
              top: CAPTION.top,
              height: CAPTION.height,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity,
            }}
          >
            <div
              style={{
                background: "#ffffff",
                border: `3px solid ${C.ink}`,
                borderLeft: `14px solid ${color}`,
                borderRadius: 20,
                padding: "26px 36px",
                width: "100%",
                boxSizing: "border-box",
                textAlign: "center",
              }}
            >
              {c.lines.map((l, j) => (
                <div
                  key={j}
                  style={{
                    fontFamily: FONT_UD,
                    fontWeight: 700,
                    fontSize: 60,
                    lineHeight: 1.45,
                    color: C.ink,
                    whiteSpace: "nowrap",
                  }}
                >
                  {l}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
};

// 下1/3の飾り（文字は置かない）
const BottomDeco: React.FC = () => (
  <svg
    width={W}
    height={640}
    style={{ position: "absolute", left: 0, top: 1280, opacity: 0.5 }}
    viewBox={`0 0 ${W} 640`}
  >
    <path
      d="M -20 520 C 240 420, 420 600, 640 460 S 980 300, 1120 340"
      fill="none"
      stroke="#9fb3cc"
      strokeWidth={5}
      strokeDasharray="4 18"
      strokeLinecap="round"
    />
    <g fill="#eef2f7" stroke="#d6dee8" strokeWidth={3}>
      <path d="M150 230 q0 -40 45 -40 q15 -35 60 -25 q35 -15 55 20 q40 0 40 45 z" />
      <path d="M760 140 q0 -34 38 -34 q13 -30 52 -21 q30 -13 47 17 q34 0 34 38 z" />
    </g>
  </svg>
);

const Scene: React.FC<{ def: SceneDef }> = ({ def }) => {
  const frame = useCurrentFrame();
  const dur = def.seconds * FPS;
  const fadeIn = interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [dur - 10, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const isTitle = def.kind === "title";
  return (
    <AbsoluteFill style={{ backgroundColor: C.paper }}>
      <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
        <Heading chip={def.chip} text={def.heading} color={def.color} />
        <ShotCard shots={def.shots} total={dur} color={def.color} />
        {isTitle ? <TitleBlock /> : <Captions caps={def.captions} color={def.color} />}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// オープニング・まとめのタイトル（ゲーム画面と同じ「大空 こころの たび」）
const TitleBlock: React.FC = () => {
  const frame = useCurrentFrame();
  const sub = interpolate(frame, [12, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: 50,
        right: 50,
        top: CAPTION.top,
        height: CAPTION.height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
      }}
    >
      <div style={{ fontFamily: FONT_MARU, fontWeight: 700, fontSize: 104, color: C.ink, whiteSpace: "nowrap", lineHeight: 1.5 }}>
        <ruby>
          大空<rt style={{ fontSize: 34, color: C.ink }}>おおぞら</rt>
        </ruby>{" "}
        こころの たび
      </div>
      <div
        style={{
          fontFamily: FONT_UD,
          fontWeight: 700,
          fontSize: 52,
          color: C.kokoro,
          whiteSpace: "nowrap",
          opacity: sub,
        }}
      >
        気持ちに 気づいて、よい 行動を えらぼう
      </div>
    </div>
  );
};

const v = (s: number, x: number, y: number): View => ({ s, x, y });

export const SCENES: SceneDef[] = [
  {
    id: "opening",
    kind: "title",
    seconds: 3,
    color: C.kokoro,
    heading: "学習ゲームの しょうかい",
    shots: [{ src: "01_title", from: v(1.0, 0.5, 0.5), to: v(1.06, 0.4, 0.45) }],
    captions: [],
  },
  {
    id: "about",
    seconds: 8,
    color: C.kokoro,
    chip: "どんな ゲーム？",
    heading: "パソコンで 遊ぶ 学習ゲーム",
    shots: [{ src: "01_title", from: v(1.15, 0.3, 0.45), to: v(1.25, 0.72, 0.55) }],
    captions: [
      { lines: ["特別支援学級の 中学生向け", "ブラウザで 遊べます"], start: 0.3, end: 4.0 },
      { lines: ["もとは ワークブック", "「大空に翔け」（全96ページ）"], start: 4.1, end: 7.8 },
    ],
  },
  {
    id: "step1",
    seconds: 7,
    color: C.kokoro,
    chip: "ステップ1　4問",
    heading: "ことばの おくの 気持ち",
    shots: [
      { src: "s1_3_mondai1", from: v(1.0, 0.5, 0.5), to: v(1.12, 0.5, 0.6) },
      { src: "s1_4_seikai1", from: v(1.12, 0.45, 0.6), to: v(1.2, 0.4, 0.65) },
    ],
    captions: [
      { lines: ["きつい ことばの 下にある", "気持ちを 2つから えらぶ"], start: 0.3, end: 6.8 },
    ],
  },
  {
    id: "step2",
    seconds: 7,
    color: C.kotoba,
    chip: "ステップ2　5問",
    heading: "変えられる？ 変えられない？",
    shots: [
      { src: "s2_3_mondai1", from: v(1.0, 0.5, 0.5), to: v(1.12, 0.5, 0.55) },
      { src: "s2_4_seikai1", from: v(1.12, 0.5, 0.6), to: v(1.18, 0.55, 0.62) },
    ],
    captions: [
      { lines: ["カードを「手のはこ」と", "「くものはこ」に 分ける"], start: 0.3, end: 6.8 },
    ],
  },
  {
    id: "step3",
    seconds: 7,
    color: C.kurashi,
    chip: "ステップ3　5問",
    heading: "こまった とき、どうする？",
    shots: [
      { src: "s3_3_mondai1", from: v(1.0, 0.5, 0.5), to: v(1.1, 0.5, 0.55) },
      { src: "s3_4_seikai1", from: v(1.12, 0.5, 0.6), to: v(1.2, 0.45, 0.62) },
    ],
    captions: [
      { lines: ["こまった 場面で、よい 行動を", "3つから えらぶ"], start: 0.3, end: 3.6 },
      { lines: ["大人に 相談する ことも", "えらべるように"], start: 3.7, end: 6.8 },
    ],
  },
  {
    id: "anshin",
    seconds: 9,
    color: C.kokoro,
    chip: "安心して 学べる",
    heading: "まちがえても 大丈夫",
    shots: [
      { src: "s1_2_otehon", from: v(1.5, 0.22, 0.2), to: v(1.4, 0.3, 0.25) },
      { src: "s1_4_seikai1", from: v(1.4, 0.45, 0.8), to: v(1.3, 0.5, 0.8) },
    ],
    captions: [
      { lines: ["漢字に ふりがな", "「よむ」ボタンで 読み上げ"], start: 0.3, end: 4.4 },
      { lines: ["失点も 時間の 制限も なし", "まちがえても ヒントが 出る"], start: 4.5, end: 8.8 },
    ],
  },
  {
    id: "settings",
    seconds: 6,
    color: C.kotoba,
    chip: "えらべる",
    heading: "おと・うごきを へらせる",
    shots: [{ src: "s2_2_otehon", from: v(1.0, 0.5, 0.5), to: v(1.7, 0.86, 0.12) }],
    captions: [
      { lines: ["右上の ボタンで", "おと・うごきを 切りかえ"], start: 0.3, end: 5.8 },
    ],
  },
  {
    id: "easy",
    seconds: 6,
    color: C.kurashi,
    chip: "かんたん",
    heading: "ダブルクリックで はじまる",
    shots: [{ src: "s3_6_clear", from: v(1.05, 0.5, 0.45), to: v(1.15, 0.45, 0.45) }],
    captions: [
      { lines: ["index.html を ダブルクリック", "ネットは いりません"], start: 0.3, end: 5.8 },
    ],
  },
  {
    id: "ending",
    kind: "title",
    seconds: 3,
    color: C.kokoro,
    chip: "まとめ",
    heading: "3つの ステップで 学ぶ",
    shots: [{ src: "99_furikaeri", from: v(1.0, 0.5, 0.5), to: v(1.06, 0.5, 0.45) }],
    captions: [],
  },
];

export const TOTAL = SCENES.reduce((a, s) => a + s.seconds * FPS, 0);

export const MyComponent: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.paper }}>
      <BottomDeco />
      <Series>
        {SCENES.map((s) => (
          <Series.Sequence key={s.id} durationInFrames={s.seconds * FPS} name={s.id}>
            <Scene def={s} />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
};

export const MyComposition = () => {
  return (
    <Composition
      id="OzoraIntro"
      component={MyComponent}
      durationInFrames={TOTAL}
      fps={FPS}
      width={W}
      height={H}
    />
  );
};
