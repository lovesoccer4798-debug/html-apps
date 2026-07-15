# ADR: Task Calendar v2はオーナー支給のデザインhandoffを正とし、NEST共通ビジュアルから独立する

- **日付**: 2026-07-15
- **ステータス**: 採用
- **関連**: `apps/task-calendar/specs/task-calendar-v2.md` / タスク `tasks/in-progress/20260714-task-calendar.md`

## 背景（Context）

オーナーがClaude designで作成したhi-fiデザインhandoff（ブルーグレー×グリーン、モバイル390×844基準、ダーク/ライト2モード、ボトムナビ＋タイムライン構成）を支給し、Task Calendarへの反映を指示した。一方でNESTの `design-guide.md` は「NEST共通トークン（クリーム×巣の緑）」「Webフォントを読み込まない」「アイコンはLucide」を定めており、handoff（Noto Sans JP・Roboto Mono・Material SymbolsをGoogle Fontsから読み込む）と衝突する。

## 検討した選択肢

### 選択肢A: handoffを字義通り再現（Google Fonts CDNを読み込む）

- 長所: ピクセルパーフェクトに近い
- 短所: CDN禁止・Webフォント不使用のワークスペース規約に反する。オフラインPWAの信頼性が下がる。Googleのサービス停止に脆い（原則6）

### 選択肢B: 配色・レイアウト・挙動はhandoffに忠実、フォントは端末標準＋モノスペーススタック、アイコンはLucideで代替

- 長所: 規約とPWAオフラインを守りつつ、デザインの意図（クールなトーン・モノスペース数字・線画アイコン）は再現できる
- 短所: 書体・アイコンの字形が原典と微差

## 決定（Decision）

**選択肢B。** アプリ固有の見た目はオーナー支給のhandoffを正とし（NEST共通パレットから独立）、値はアプリの `tokens.css` に集約する。フォントは端末標準＋`ui-monospace` 系、アイコンはLucideインラインSVGで、Material Symbolsの対応アイコンに置き換える。「実行中カード」の深緑 `#123B2A` はhandoffどおり両モード共通のブランド要素として固定する。

## 影響（Consequences）

- 良くなること: オフライン動作と10年運用の安全性を保ったまま、オーナーの意図したデザインに揃う
- 悪くなること・引き受けるリスク: NESTアプリ間でビジュアルが割れる（Portal/Creator Studio はNESTトークンのまま）。アプリ単位の差し色を認める前例になる
- 将来この決定を覆す場合の条件・コスト: design-guideに「アプリ固有テーマの規約」を追記して統合するか、本アプリをNESTトークンへ戻す（tokens.cssの差し替えで可能な構造は維持する）
