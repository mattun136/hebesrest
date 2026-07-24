# HEBEREST 引き継ぎ記録

最終更新: 2026-07-24 ／ 記録時点のブランチ: `docs/v1.0-handover`（`main`最新コミット `4a0e965` を起点に作成）

> このファイルはHEBERESTプロジェクトの「現在地」を記録するものです。
> 作業を再開する際は、まずこのファイルの「次回の再開地点」を読んでください。

---

## 🚦 次回の再開地点（最優先で読む）

**HEBEREST Ver.1.1「入金・発送管理」から再開する。**

Ver.1.0（本番受注システム）は完成・本番稼働中。現在動作している注文受付〜メール通知〜Google Sheets保存の処理は一切壊さないことを最優先とする。

### 優先実装候補

1. **注文ステータス管理**
   受付 → 振込待ち → 入金確認 → 発送準備 → 発送済み → 完了 → キャンセル
2. **銀行振込案内**
   振込先案内メール／振込期限／注文番号の記載／入金確認方法
3. **入金確認後の処理**
   入金確認日時の記録／入金確認メール／発送準備へのステータス変更
4. **発送管理**
   配送会社／追跡番号／発送日／発送完了メール／配送状況確認リンク
5. **管理画面またはGoogle Sheets運用改善**
   ステータス変更／対応履歴／未入金注文の抽出／未発送注文の抽出／テスト注文と本注文の区別

### 重要方針（Ver.1.1着手時に必ず守ること）

- 現在動作している注文受付処理を壊さない
- Google Sheets保存を壊さない
- 管理者通知メールを壊さない
- お客様向け自動返信メールを壊さない
- 既存データ（スプレッドシートの既存行）との後方互換性を維持する
- 作業用ブランチ＋Pull Requestで進める（`main`への直接pushはしない）
- 実装前に設計と影響範囲の整理を行う（このプロジェクトはSubagent-Driven Developmentで進めてきた実績があるので、同じ流れが再現しやすい）

---

## 1. プロジェクト概要

HEBERESTは、宮崎県産の高級柑橘「へべす」を扱うD2Cブランドサイト。単なるECサイトではなく「知る → 好きになる → 購入する」というブランド体験を提供するメディア型サイトという位置づけ。Next.js（App Router）で構築されたブランドサイト＋自前の注文受付システムを持つ。

将来的には、この注文フォームを起点として「Maruhe OS」（受注・売上・在庫・発送を統合する運用システム、別プロジェクトで並行開発中）と接続する構想があり、保存・通知・配送ロジックはインターフェース越しに差し替え可能な構成で実装されている（詳細は「6. 技術構成」参照）。

## 2. 正式名称と正式URL

| 項目 | 値 |
|---|---|
| 正式名称 | HEBEREST |
| 正式URL | https://heberest.vercel.app |
| 旧ドメイン | hebesrest.vercel.app（新ドメインへ307リダイレクト設定済み・Vercel側設定、リポジトリのコードには含まれない） |
| GitHubリポジトリ名 | heberest（`git remote -v` で確認済み：`https://github.com/mattun136/heberest.git`） |
| Vercelプロジェクト名 | heberest |
| PC側Git remote | heberestへ変更済み |

## 3. 技術構成

- **フレームワーク**: Next.js 16.2.10（App Router、Turbopack）
- **UI**: React 19.2.4 / TypeScript / Tailwind CSS v4
- **フォーム処理**: Server Actions（`"use server"`）＋ Zod v4によるバリデーション
- **注文データ保存**: Google スプレッドシート（Google Apps Script Web App経由。DBは使用していない）
- **メール通知**: Resend SDK
- **Bot対策**: Vercel BotID（`botid`パッケージ）
- **レート制限**: Vercel Firewall（`@vercel/firewall`）
- **テスト**: Node.js組み込み `node:test` + `node:assert/strict`（追加の外部テストランナーは導入していない）
- **ホスティング**: Vercel（GitHub連携による自動デプロイ）

### 注文まわりのアーキテクチャ（Maruhe OS接続を見据えた設計）

- `src/lib/orders/types.ts` — `Order`型（共通データモデル）
- `src/lib/orders/store.ts` — `OrderStore`インターフェース＋現在の実装`AppsScriptSheetStore`（将来Maruhe OS用の実装に差し替え可能）
- `src/lib/orders/notify.ts` — `OrderNotifier`インターフェース＋現在の実装`ResendOrderNotifier`（同上、差し替え可能）
- `src/lib/orders/schema.ts` — Zodバリデーションスキーマ
- `src/lib/orders/pricing.ts` / `shipping-calendar.ts` / `order.ts` — 金額計算・発送可能日計算・Order組み立て
- `src/app/order/[productId]/` — 注文フォームUI（`OrderForm.tsx`）、Server Action（`actions.ts`）
- `src/app/order/complete/` — 注文完了画面
- `docs/superpowers/apps-script/order-sheet-webapp.gs` — Google Apps Script側のソース（Webアプリとしてデプロイ済み）

呼び出し側（`actions.ts`）は`orderStore`/`orderNotifier`という**インターフェース型の変数**しか参照しない設計のため、将来Maruhe OS側の実装に差し替えても呼び出し側のコード変更は不要。

## 4. 完成済み機能（Ver.1.0）

- 商品ページ表示
- 注文フォーム入力（バリデーション付き、確認画面あり）
- 注文送信（Server Action）
- 注文番号の自動発行（`HBR-YYYYMMDD-NNNN`形式）
- 注文完了画面（ブランド体験の導線付き）
- Googleスプレッドシートへの注文保存（Apps Script Web App、冪等性キーによる重複防止）
- 管理者向け新規注文通知メール
- お客様向け注文受付自動返信メール（HTML＋テキスト両対応、注文内容の詳細を含む）
- 旧URL（hebesrest.vercel.app）から正式URL（heberest.vercel.app）への転送

## 5. 本番テスト結果

- 自動テスト: 42件成功（`npm run test`、`node:test`）
- `npm run lint`: 成功
- `npm run build`: 成功
- `npx tsc --noEmit`: 成功
- Pull Requestによるレビュー（タスク単位レビュー＋whole-branchレビュー）とmainへのマージ完了
- Vercel本番デプロイ成功
- 実機での本番注文テスト成功（注文送信 → スプレッドシート保存 → 管理者通知メール → お客様自動返信メールまで一連の動作を確認済み）

## 6. GitHub・Vercel・Google Sheets・Resendの構成

- **GitHub**: `mattun136/heberest`。`main`ブランチが本番。作業は必ず作業用ブランチ＋Pull Request経由（`main`への直接pushは行わない運用）。
- **Vercel**: GitHub連携により`main`へのpushで自動デプロイされる。この環境（Claude Codeの作業端末）には`gh` CLIも`vercel` CLIも入っていないため、PR作成・デプロイ状況の確認はGitHub/Vercelのダッシュボードで行う。
- **Google Sheets**: Apps Script Web Appを共有シークレットトークンで認証（Googleアカウントの共有権限ではなく、独自トークン方式）。Web Appは「アクセスできるユーザー: 全員」「実行するユーザー: 自分」でデプロイ。冪等性キーで重複注文を検知。
- **Resend**: `onboarding@resend.dev`（Resendのテスト送信ドメイン）を`RESEND_FROM_EMAIL`として使用中。**このテストドメインは、Resendアカウント登録時のメールアドレス宛にしか送信できない制限がある。** 現状、本番の一般のお客様に確認メールを届けるには、独自ドメインをResend側で認証し`RESEND_FROM_EMAIL`をそのドメインのアドレスに変更する必要がある（Ver.1.3「独自ドメイン・正式送信メールアドレス」で対応予定）。

## 7. 環境変数名（値は本ファイルに記載しない）

Vercelプロジェクトの環境変数として設定済み（`.env.local`にも同名でローカル開発用に設定）:

- `SHEETS_WEBAPP_URL`
- `SHEETS_WEBAPP_TOKEN`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `ORDER_NOTIFY_TO`

## 8. 現在の運用フロー

1. お客様が商品ページから注文フォームへ進み、入力・確認画面を経て送信する
2. Server Action（`actions.ts`）がBotID／レート制限チェック → Zodバリデーション → `Order`組み立て（金額はサーバー側で再計算）
3. `orderStore.saveOrder(order)`でGoogle スプレッドシートに保存（冪等性キーで重複を検知）
4. 保存成功後、`orderNotifier.notifyOrder(order)`でお客様向け自動返信メール＋管理者向け通知メールをベストエフォートで送信（メール送信失敗は注文保存の成否に影響しない。失敗時はorderIdのみをサーバーログに記録し、個人情報・APIキーはログに出さない）
5. 注文完了画面へリダイレクトし、ブランドストーリー等への導線を表示する
6. 管理者は現状、Googleスプレッドシートを直接確認して注文対応（入金確認・発送）を行う手動運用（Ver.1.1で改善予定）

## 9. 注意事項

- **`src/app/layout.tsx`の`metadataBase`が仮ドメイン（`hebesu-brand.example.com`）のままになっている。** OGP画像やcanonical URLなどの絶対URL生成に影響するため、正式URL（`https://heberest.vercel.app`）または将来の独自ドメインに更新する必要がある。今回のセッションで発見したが、依頼範囲外（コード機能変更なし）のため未修正。次回作業時に対応候補。
- **Vercel Firewallのレート制限ルール（ID: `submit-order`、`actions.ts`内の`checkRateLimit("submit-order", ...)`と対応）、およびVercel BotIDのダッシュボード側有効化状況は、本セッションでは最終確認できていない。** コード側の呼び出しは実装済みだが、Vercelダッシュボードでの実際の設定完了は次回要確認。
- `package.json`の`"name"`フィールドは現在も`"hebesrest"`のまま（旧名称）。動作に影響はないが、名称統一の一環として将来的に更新してもよい。
- `RESEND_FROM_EMAIL`が引き続きResendのテスト送信ドメイン（`onboarding@resend.dev`）のため、Resendアカウント登録アドレス以外の一般のお客様に確認メールが届かない制限が本番でも残っている（詳細は「6. 構成」参照）。独自ドメイン認証が完了するまでは、実際のお客様への送信は届かない可能性がある点に注意。
- `/legal/tokushoho`ページの事業者情報は`【要確認】`のプレースホルダーのままになっている。実運用のお客様対応が本格化する前に実データへの差し替えが必要。
- 本プロジェクトの実装はSubagent-Driven Development（superpowers plugin）で進めてきた。作業用ブランチ・タスク単位レビュー・whole-branchレビューという型が確立しているため、Ver.1.1以降も同じ型を踏襲すると円滑。

## 10. 次回の再開地点

「🚦 次回の再開地点」セクション（本ファイル冒頭）を参照。

## 11. 今後のロードマップ

| バージョン | 内容 | 状態 |
|---|---|---|
| Ver.1.0 | 本番受注システム | 完了 |
| Ver.1.1 | 入金・発送管理 | 次回再開地点 |
| Ver.1.2 | 在庫・販売期間・売り切れ管理 | 未着手 |
| Ver.1.3 | 独自ドメイン・正式送信メールアドレス・法務ページ整備 | 未着手 |
| Ver.1.4 | コンテンツ・SEO・HEBEREST Journal | 未着手 |
| Ver.1.5 | LINE通知・顧客管理・再購入案内 | 未着手 |
| Ver.2.0 | Maruhe OSとの受注・売上・在庫・発送統合 | 未着手 |
