# Phase B-1: 購入フォームMVP — 確定設計書

- 作成日: 2026-07-24
- 対象プロジェクト: `hebesrest`（Next.js 16.2.10 / React 19.2.4 / Tailwind CSS v4）
- ステータス: **承認済み（実装フェーズへ移行）**
- 前提: `docs/superpowers/specs/2026-07-13-brand-message-and-order-form-design.md` 4章の設計案をベースに、本書で以下の点を確定・上書きする

---

## 0. この設計書のスコープ

HEBERESTは単なるECサイトではなく「知る→好きになる→購入する」というブランド体験を提供する専門メディア兼ブランドサイトである。購入フォームはその体験を途切れさせない導線として設計し、かつ将来Maruhe OSへ接続する最初の入口となる。

前設計書（2026-07-13）の4章の内容を土台としつつ、本書は以下を新たに確定する。

1. 保存先を**Googleスプレッドシート（Apps Script Web App方式）**に確定（DBは採用しない）
2. のし・名入れをMVPスコープに含める（前設計書では見送りだったが本書で覆す）
3. 出荷可能日の自動計算ロジック
4. 送信後もブランド体験が続く完了画面のUX
5. Journalとの導線（型・UIスロットのみ、Journal本体は今回実装しない）
6. 特定商取引法・プライバシーポリシーページの新規作成方針
7. 通知メールは環境変数プレースホルダーのみ用意し実値は後日

---

## 1. 全体アーキテクチャ（前設計書から変更なし）

```
src/
  lib/
    products.ts                … 商品カタログの単一の真実源
    orders/
      types.ts                 … Order / OrderItem / Customer など共通型
      schema.ts                 … Zodスキーマ
      pricing.ts                … 金額再計算（純粋関数）
      shipping-calendar.ts      … 出荷可能日計算（純粋関数）
      order.ts                  … 注文データ生成
      store.ts                  … 保存層アダプター（Apps Script Web App。将来Maruhe OS APIに差し替え可能）
      notify.ts                 … 通知層アダプター（Resend。実値は後日）
  app/
    order/
      [productId]/page.tsx      … フォームUI（入力→確認の2ステップ）
      [productId]/actions.ts    … Server Action
      complete/page.tsx         … 完了画面
    legal/
      tokushoho/page.tsx        … 特定商取引法に基づく表記
      privacy/page.tsx          … プライバシーポリシー
```

**設計原則**：UIコンポーネントは「フォームを表示し、Server Actionを呼ぶ」以上のことをしない。金額計算・保存・通知・配送可否判定のロジックはすべて`lib/orders/`に閉じ、UIから直接外部サービスを叩かない。保存層・通知層・配送ロジックは差し替え可能なアダプター関数（`saveOrder()` / `notifyOrder()` / `getAvailableShipDates()`）として実装し、将来Maruhe OS接続時はこれらの中身のみ変更する。

ルーティングは`/order/[productId]`（入力・確認を画面内タブで切替、状態はReactが保持し消えない）→ 送信成功時のみ`/order/complete?orderId=...`へ実遷移する構成を維持する。

---

## 2. Googleスプレッドシート連携：Apps Script Web App方式

- 対象スプレッドシートにApps Scriptを紐付け、`doPost(e)`が注文JSONを受け取りシートへ1行追加する
- 認証はGoogleアカウントACLではなく**共有シークレット方式**：環境変数`SHEETS_WEBAPP_URL`（デプロイ後のWeb App URL）と`SHEETS_WEBAPP_TOKEN`（共有シークレット）をVercelに設定し、Apps Script側は同じトークンをScript Propertiesに保持して照合する。Web App自体は「アクセス:全員」で公開する必要があるため、このトークンが実質的な認証境界になる
- `lib/orders/store.ts`は`saveOrder(order: Order): Promise<void>`という単一インターフェースにする。中身がApps ScriptへのfetchでもMaruhe OS APIへのfetchでも、呼び出し側（Server Action）は無変更で済む
- **失敗時の扱い**：Sheets保存が失敗した場合、`saveOrder`は例外を投げてServer Action側に伝播させる。Server Actionはこの場合`/order/complete`へ遷移させず、「送信に失敗しました。時間をおいて再度お試しください」という一般文言を返す。冪等キーにより再送信しても二重保存にはならない。サーバーログには氏名・住所・電話番号などの個人情報を含めず、注文ID・商品ID・数量・金額のみを出力する（7章のPII方針と一貫させる）。実質的な冗長性は9章のメール通知（Sheets保存成功後に送信、管理者の受信箱にも記録が残る）が担う
- **実装前にユーザー側で必要な手動準備**（コードからは自動化できない）：
  1. 新規Googleスプレッドシートを作成
  2. 拡張機能 > Apps Script からスクリプトエディタを開き、実装計画で用意するコード一式を貼り付け
  3. Script Propertiesに共有シークレットを設定
  4. 「デプロイ」>「新しいデプロイ」>種類「ウェブアプリ」、実行ユーザー「自分」、アクセスできるユーザー「全員」で公開
  5. 発行されたWeb App URLと共有シークレットをVercelの環境変数に設定

---

## 3. 出荷可能日ロジック

- `lib/orders/shipping-calendar.ts`の`getAvailableShipDates(from: Date, count: number): string[]`（純粋関数）
  - 日曜日を除外
  - `BLACKOUT_DATES`（年末年始・市場休業日など）をコード内の配列で管理し除外
  - 最短リードタイム2営業日（収穫・梱包時間を考慮した仮値、運用しながら調整）を確保
  - 直近30件の候補日を返す
- サーバーが唯一の正とする：フォーム表示用の候補日生成、およびServer Action内での選択日の再検証の両方で同じ関数を使う（クライアントが送ってきた日付を無条件に信用しない）
- 将来Maruhe OSの営業日カレンダーAPIに差し替え可能な関数シグネチャにしておく

---

## 4. のし・名入れ（MVPスコープに含める）

- 「のしをつける」チェックボックス（初期OFF）
- ONの場合のみ「名入れ」自由記述欄を表示（20文字上限）
- サーバー側でも文字数上限・HTMLタグ除去を再検証する（クライアントのUI制御を信用しない）
- データ型：`gift: { noshi: boolean; nameEntry?: string }`をOrder型に追加

---

## 5. 送信後もブランド体験が続くUX

- `/order/complete`は事務的な完了画面にせず、Heroと同じ余白・フォント・トーンを踏襲する
- 表示内容：注文番号・受付内容の要約 → 「お支払い方法は追ってメールでご案内します」という運用文言 → 次の一歩への導線
- 次の一歩の導線は`relatedLinks: { label: string; href: string }[]`という差し替え可能な配列として実装する。初期値は「ブランドストーリーを読む」（`/#story`）「生産者の想いを知る」（`/#producer`）の2件とし、将来Journal記事を実装した際はこの配列に追加するだけで済む構造にする

---

## 6. Journalとの導線（今回のスコープの明確化）

- Journal本体（記事一覧・記事ページ）は今回実装しない
- 用意するのは「型とUIスロットのみ」：
  - `lib/products.ts`の商品定義に`relatedStorySlugs?: string[]`という任意フィールドの型を追加（値は空でよい）
  - 完了画面の`relatedLinks`配列（5章）が将来のJournal記事リンクの差し込み先になる

---

## 7. セキュリティ

| 項目 | 対応方針 |
|---|---|
| CSRF | Server Actions標準のOrigin/Hostヘッダー検証（追加実装不要） |
| ボット対策 | Vercel BotID。`instrumentation-client.ts`で`initBotId({ protect: [...] })`を設定し、Server Action内で`checkBotId()`を呼ぶ |
| レート制限 | `@vercel/firewall`の`checkRateLimit`。Server Action内にはRequestオブジェクトがないため、`next/headers`から取得できる情報を使って呼び出す方法を実装時に確定する |
| サーバー側バリデーション | Zodスキーマで全項目を再検証。金額は商品ID・数量からサーバーが必ず再計算し、フォームの表示金額は信用しない |
| 冪等性 | クライアント生成UUIDをhidden fieldで送り、Server Action側で同一キーの二重作成を防止。送信ボタンは`useActionState`の`pending`で無効化 |
| ログのPII配慮 | エラーログ（2章のSheets保存失敗時を含む）に氏名・住所・電話番号を出力しない。出力してよいのは注文ID・商品ID・数量・金額のみ |
| 環境変数 | `SHEETS_WEBAPP_URL` / `SHEETS_WEBAPP_TOKEN` / `RESEND_FROM_EMAIL` / `ORDER_NOTIFY_TO` は`lib/orders/`以外から`process.env`に直接アクセスしない |

---

## 8. 特定商取引法・プライバシーポリシーページ

- `/legal/tokushoho`・`/legal/privacy`を汎用文面（産地直送ECの一般的なひな形）で新規作成する
- 事業者情報（住所・電話番号等）・返品条件の正式文言はプレースホルダーとし、**本番公開前にユーザーによる差し替えが必須**であることを明記する
- Footerの現行テキスト（リンクなし）をこれらのページへのリンクに変更する

---

## 9. メール通知・決済

- 通知メールは今回、環境変数プレースホルダー（`RESEND_FROM_EMAIL` / `ORDER_NOTIFY_TO`）でインターフェースのみ用意する。実際の送信ドメイン・宛先アドレスは確保済みだが、実値の投入は後日行う
- 決済は「受注後、銀行振込等の方法をメールで個別案内」を初期仕様のまま維持する。`paymentStatus: "pending" | "invoiced" | "paid"`をOrder型に持たせ、将来のオンライン決済追加に備える

---

## 10. Order型（前設計書4-8を拡張）

```ts
interface Order {
  orderId: string;
  createdAt: string;
  status: "received" | "confirmed" | "cancelled";
  paymentStatus: "pending" | "invoiced" | "paid";
  customer: {
    name: string; nameKana: string;
    email: string; phone: string;
    postalCode: string; prefecture: string; city: string; addressLine: string;
  };
  shipping: {
    sameAsCustomer: boolean;
    name?: string; phone?: string;
    postalCode?: string; prefecture?: string; city?: string; addressLine?: string;
    desiredDate?: string; desiredTimeSlot?: string;
    note?: string;
  };
  gift: {
    noshi: boolean;
    nameEntry?: string;
  };
  items: Array<{
    productId: string; name: string; variantLabel: string;
    unitPriceJPY: number; quantity: number; subtotalJPY: number;
  }>;
  shippingFeeJPY: number;
  totalJPY: number;
  consents: { privacy: boolean; orderContent: boolean; cancellationPolicy: boolean };
  source: "HEBEREST-web";
}
```

---

## 11. 実装前にユーザーへ依頼する事前準備（コードから自動化できない事項）

1. Googleスプレッドシートの新規作成、Apps Scriptの貼り付け、Web Appとしてのデプロイ、URL・共有シークレットの発行（2章参照）
2. 発行されたURL・共有シークレットをVercel環境変数として設定
3. Resendの送信元・受信先の実アドレス確定（現時点ではプレースホルダーで進行）
4. 特定商取引法表記の正式な事業者情報・返品条件文言の確認（8章参照。本番公開前に必須）

---

## 12. 実装タスク分割の概要

詳細な実装計画は本設計書の承認を受け、別途 `writing-plans` により `docs/superpowers/specs/` 配下の実装計画書として作成する。ユーザー指定の実装順序は以下の通り：

① 注文フォームUI → ② 入力バリデーション → ③ 確認画面 → ④ 完了画面 → ⑤ Googleスプレッドシート保存（Apps Script Web App） → ⑥ メール通知 → ⑦ GitHubへCommit・Push → ⑧ Vercelへデプロイ

各工程ごとに `npm run lint` ・ `npm run build` を実行し、問題がないことを確認しながら進める。
