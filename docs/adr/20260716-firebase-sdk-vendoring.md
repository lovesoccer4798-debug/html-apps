# ADR: Firebase SDKはCDNではなくリポジトリに同梱（自己ホスト）する

- **日付**: 2026-07-16
- **ステータス**: 採用
- **関連**: `apps/task-calendar/specs/task-calendar-firebase-sync.md`

## 背景（Context）

Task CalendarにGoogleログインとクラウド同期（Firebase Auth / Firestore・Sparkプラン無料枠）を導入する。ワークスペース規約はCDN禁止（AGENTS/design-guide）で、PWAのオフライン起動も守る必要がある。

## 検討した選択肢

- **A: gstatic CDNから読み込み** — 規約違反・オフラインで壊れる・Google側の変更に脆い
- **B: compatビルドを `vendor/` に同梱** — 約500KB増えるが、規約遵守・オフラインOK・バージョン固定（10.14.1）

## 決定（Decision)

**B**。`vendor/firebase-{app,auth,firestore}-compat.js` を同梱し、ログイン操作時に遅延読み込み（普段の起動を重くしない）。apiKey等のWeb設定は公開前提の識別子なので `firebase-config.js` としてコミットし、アクセス制御はFirestoreセキュリティルールで行う。gitleaksの誤検知は `.gitleaks.toml` のallowlistで明示。

## 影響（Consequences）

- 良い: 無料・オフライン維持・依存の凍結。悪い: SDK更新は手動（意図的）。リポジトリ+500KB
- 覆す条件: 公式がセルフホスト非推奨化した場合はバンドラー導入を再検討（新ADR）
