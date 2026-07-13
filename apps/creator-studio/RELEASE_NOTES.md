# Creator Studio — Release Notes

> この文書は「バージョンの節目」を記録する。使い方は [README](README.md)、変更の一覧は [CHANGELOG](CHANGELOG.md) にあり、ここでは**そのバージョンで何を実現し、何を思想として選んだか**を残す。

---

## Version 1.0.0 — 2026-07-08（NEST初の実用アプリ）

NESTで実際に人がアプリを生み出せることを実証した、最初の一羽。

### Version 1.0 で実現したこと

- 素材（タイトル＋エピソード本文）から、**Note / X / Threads / Instagramリール** 向けの投稿プロンプトを生成
- パーソナライズ設定（口調・語尾・ターゲット読者・文章量・表現の傾向・絵文字を使わない・AI感を減らす）
- **設定だけをブラウザに保存**して次回自動復元（タイトル・本文は保存しない）
- 生成プロンプトのワンクリックコピー
- **ベンダー中立**: Claude・ChatGPT・Gemini など、どの生成AIにも貼れる汎用日本語プロンプト

### 設計思想

- **Prompt Engine を中心に据える**: アプリは投稿を書かず「AIへ渡す良いプロンプトを作る」ことに徹する。将来API/MCP連携になっても Engine は無変更で、外側に Connector を足すだけ
- **使いながら育てる**: Version 1.0 は完成でなく誕生。生成品質は実運用で磨く
- **信頼境界を守る**: 個人的な本文は保存しない
- **NESTシリーズの一貫性**: Design Tokens・アイコン・世界観を Portal と共有し、「別アプリ」でなく「同じ巣の別室」に

### 採用した技術

- 素の HTML / CSS / JavaScript（Vanilla）。**フレームワーク・CDN・ビルド・サーバ通信なし＝依存ゼロ**
- データ駆動（`MEDIA` / `SETTINGS` 配列）＋責務分離（DATA / Store / PromptEngine / UI の一方向依存）
- 判断根拠: [ADR: Vanilla JavaScript採用](../../docs/adr/20260708-creator-studio-vanilla-js.md)

### やらないこと（Version 1.0 のスコープ外）

- AI API の直接呼び出し（プロンプト生成に徹する）
- ログイン・サーバ保存・生成履歴
- タイトル・本文の保存
- 複数媒体の同時生成（内部構造は準備済み・UIは単一選択）

### 今後育てていく方向性

- 実運用での生成品質の改善（媒体ごとの指針 `spec` の磨き込み）
- Output Profile（ストーリー / 学び / 共感 / 営業寄り / 教育寄り など狙い別プリセット）を `SETTINGS` に追加
- Prompt Engine Roadmap（v2 Output Profile → v3 AI Connector → v4 Workflow・MCP。実装可否は各Phaseで判断）
- ※ 次に何を作る・育てるかは**オーナーが決める**
