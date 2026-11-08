# 01（仕事チーム）／ 02（ゲームづくりチーム）

ファイルや画像を渡すと、要約・縦型動画・パワーポイント・SNS投稿文をまとめて作るClaude Codeのチームです。

## 使い方
このリポジトリでClaude Codeを開き、資料を渡して「01、これお願い」と頼みます。
完成品は `output/<案件名>/` にまとまります。

## メンバー
| 担当 | ファイル | 作るもの |
|---|---|---|
| 要約担当 | `.claude/agents/summarizer.md` | 共通台本 `script.md` |
| 動画担当（縦型 9:16） | `.claude/agents/video-maker.md` | `video.mp4` |
| パワポ担当 | `.claude/agents/slide-maker.md` | `slides.pptx` |
| SNS投稿文担当 | `.claude/agents/sns-writer.md` | `sns.md` |

進め方のルールは `CLAUDE.md` に書いてあります。

---

# 02（ゲームづくりチーム）

資料を渡すと、その内容を**特別支援学級の生徒でもわかる教え方**で学べる、パソコン用のブラウザゲームを作るチームです。

- 教え方: スモールステップ・見てわかるヒント・すぐにほめる・まちがえても大丈夫・ふりがな・読み上げ
- 見た目: AIっぽくない、題材に合った手づくり感のあるデザイン（横長16:9）
- 音: Web Audio APIで作るオリジナルBGMを小さく流す（ボタンで消せる）
- 動き: Three.jsの3Dモーショングラフィックス（「うごきをへらす」設定つき）

## 使い方
資料を渡して「02、これお願い」と頼みます。完成品は `output/<案件名>/index.html` をダブルクリックで遊べます（ネット不要）。

## メンバー
| 担当 | ファイル | 作るもの |
|---|---|---|
| 教え方担当 | `.claude/agents/lesson-designer.md` | 学習設計書 `lesson-plan.md` |
| デザイン担当 | `.claude/agents/art-director.md` | `design.md`・`style.css` |
| 3Dモーション担当 | `.claude/agents/motion-3d.md` | `motion3d.js` |
| BGM・効果音担当 | `.claude/agents/sound-maker.md` | `bgm.js` |
| ゲーム組立担当 | `.claude/agents/game-builder.md` | `index.html`・`game.js` |
| チェック担当 | `.claude/agents/game-tester.md` | `test-report.md` |
