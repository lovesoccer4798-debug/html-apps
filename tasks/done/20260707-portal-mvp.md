# タスク: NEST Portal v1を実装して公開準備を整える

- **作成日**: 2026-07-07
- **関連仕様**: `apps/portal/specs/portal-v1.md`
- **優先度**: 高

## ゴール

- [x] 仕様書の「完成の定義」を満たすPortalが `apps/portal/index.html` に存在する
- [x] ルートURLからPortalへ到達できる（リダイレクト）
- [x] 初心者テストを実施し、結果が `docs/reviews/phase-3.md` に記録されている
- [ ] GitHub Pagesで公開されている（人間の操作待ち）

## やることリスト

- [x] 仕様書を書く（正式フローのドッグフーディング）
- [x] index.html実装（JSゼロ・外部依存ゼロ・語彙台帳準拠）
- [x] スクリーンショット検証（デスクトップ・スマホ375px・ダーク）
- [x] 初心者テスト（シミュレーション）→ 発見2件を即修正
- [x] ADR・レビュー記録・CHANGELOG・STATUS更新

## 作業ログ

### 2026-07-07

- 何をしたか: 仕様→実装→Chromiumでの3モード検証→初心者テスト→修正→再検証まで完了
- 気づき・ハマりどころ: Playwrightの実行パスは `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`（バージョン付きディレクトリ）。ダークモードの補助文字色は `#a8a396` では暗く、`#b8b3a5` に調整した
- 次にやること: オーナーによるGitHub Pages有効化（`docs/human-only-operations.md` の手順）→公開URL確認→アプリバッジは既に🐦
