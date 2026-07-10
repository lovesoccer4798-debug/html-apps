# Creator Studio

**「投稿を生成するアプリ」ではなく、「Claude・ChatGPT・Gemini などの生成AIへ渡す、高品質なプロンプトを生成するアプリ」。**

エピソードや考えを入力し、媒体（Note / X / Threads / Instagramリール）と仕上げの好み（口調・語尾・ターゲット・分量・絵文字なし・AI感を減らす 等）を選ぶと、そのままお好みのAIに貼れるプロンプトを組み立てる。アプリ自身はAIを呼ばない・投稿を書かない — **どのAIに渡しても良いプロンプトを作ることに徹する**（この立ち位置はAPI連携版になっても変えない）。

## 使い方・起動方法

- ローカル: `index.html` をブラウザで開くだけ（インストール不要・ネット接続不要）
- 公開版: NEST Portal の「育てているアプリ」から（GitHub Pages）

## テスト・動作確認の方法

- ブラウザで開き、仕様書の「完成の定義」を1項目ずつ確認する
- スマホ幅（開発者ツールで幅375px）とダークモードの表示を確認する
- 設定を変えてリロード → 設定だけが復元され、タイトル・本文は空に戻ることを確認する

## ドキュメント

- 仕様書: [`specs/creator-studio.md`](specs/creator-studio.md)
- 変更履歴: [`CHANGELOG.md`](CHANGELOG.md)

## 設計メモ

- **Creator Studioは Prompt Engine を中心とした設計**である。将来的にAI API（Claude / OpenAI / Gemini / ローカルLLM / MCP）を接続する場合でも、**Prompt Engine 自体は変更せず、その外側に Connector 層を追加する**ことを基本方針とする（Input → Prompt Engine → Prompt → 〔将来〕AI Connector → 各AI）。
- 素のHTML/CSS/JS。フレームワーク・CDN・ビルド・サーバ通信なし（NEST Design Principles 原則6）
- 見た目は `tokens.css`（NESTのDesign Tokens）を継承
- 設定（SETTINGS）と媒体（MEDIA）はデータ配列で定義し、後から項目を足すだけで拡張できる
