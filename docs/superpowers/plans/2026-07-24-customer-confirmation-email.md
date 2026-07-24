# 注文者本人への自動返信メール実装計画

## 背景

現在、注文フォーム送信 → Googleスプレッドシート保存 → 管理者への注文通知メール、まで動作している。
次の実装として、注文完了後に**注文者本人**へ、注文内容の詳細を含む自動返信メールを送信する。

対象ファイルは `src/lib/orders/notify.ts` のみ（`ResendOrderNotifier`クラス）。
`OrderStore`/`OrderNotifier`インターフェース自体は変更しない。呼び出し側（`src/app/order/[productId]/actions.ts`）も変更不要——`orderNotifier.notifyOrder(order)`という既存の呼び出し方のまま、内部実装だけが拡張される。

## Global Constraints（全タスク・レビュー共通の絶対条件）

- `OrderNotifier`インターフェース（`notifyOrder(order: Order): Promise<void>`）は変更しない。呼び出し元（`actions.ts`）のコードは一切変更しない。
- 管理者宛通知メール（`adminTo`宛、件名「【新規注文】」)の既存処理・既存の失敗検知ロジックは壊さない。
- お客様宛メールと管理者宛メールは、互いに独立して成功/失敗する（どちらかの失敗が他方の送信をブロックしない）。既存の`try/catch`＋`result.error`チェックのパターン（2026-07-24の直前コミットで修正済み。Resend SDK v6は失敗時に例外を投げず`{data: null, error}`を返すため、両方のチェックが必要）を新しいお客様宛メール送信にもそのまま適用すること。
- お客様宛メール送信が失敗しても、注文保存（Google Sheets保存）自体は成功扱いとする。呼び出し元の`actions.ts`のフロー（保存成功 → 通知はベストエフォート → 完了画面へリダイレクト）は変更しない。
- 失敗時はサーバーログに出力する。ただしログには個人情報（氏名・住所・電話番号・メールアドレス本文など）やAPIキーを含めない。ログに含めてよいのは`orderId`と、Resendから返るエラーオブジェクト（`result.error`、氏名等のPIIを含まない）のみ。
- `RESEND_FROM_EMAIL`は既存の環境変数をそのまま使う（新しい環境変数は増やさない）。
- HTMLメール本文に埋め込むお客様入力値（氏名・住所・備考・のし名入れ文字など）は、必ずHTMLエスケープしてから埋め込む。プレーンテキスト版はエスケープ不要（プレーンテキストなので）。
- 完了画面（`/order/complete`）の表示ロジックは変更しない。自動返信メールの成否に関わらず、注文保存が成功していれば現在の完了画面をそのまま表示する（＝`actions.ts`を変更しないことで自動的に満たされる）。
- 新しいnpm依存パッケージは追加しない。単体テストはNode.js 24に内蔵の`node:test` + `node:assert/strict`を使う（`node --test`で実行できる。TypeScriptの型注釈はNode 24のネイティブstrip機能でそのまま実行可能——`interface`や型注釈のみを含むテストファイルであれば追加のローダーは不要）。

## Task 1: お客様宛リッチ自動返信メール（HTML+テキスト）の実装とユニットテスト

### 目的

`ResendOrderNotifier.notifyOrder`のお客様宛メール部分を、現在の簡易テキスト（注文番号のみ）から、注文内容の詳細を含むテキスト版・HTML版の両方を送るように拡張する。

### 現状の`src/lib/orders/notify.ts`（変更前の全文）

```ts
import { Resend } from "resend";
import type { Order } from "@/lib/orders/types";

export interface OrderNotifier {
  notifyOrder(order: Order): Promise<void>;
}

const SITE_URL = "https://heberest.vercel.app";

function buildItemsSummary(order: Order): string {
  return order.items
    .map(
      (item) =>
        `${item.name}（${item.variantLabel}） x${item.quantity} = ¥${item.subtotalJPY.toLocaleString("ja-JP")}`
    )
    .join("\n");
}

function buildCustomerEmailText(order: Order): string {
  return [
    "--------------------------------",
    "",
    `${order.customer.name}様`,
    "",
    "この度はHEBERESTをご利用いただきありがとうございます。",
    "",
    "ご注文を受け付けました。",
    "",
    "注文番号：",
    order.orderId,
    "",
    "商品の準備が整い次第、",
    "改めて発送メールをお送りします。",
    "",
    "--------------------------------",
    "",
    "HEBEREST",
    SITE_URL,
    "",
    "--------------------------------",
  ].join("\n");
}

function buildAdminEmailText(order: Order): string {
  return [
    `注文番号: ${order.orderId}`,
    `注文日時: ${order.createdAt}`,
    `注文者: ${order.customer.name}`,
    `電話番号: ${order.customer.phone}`,
    `メール: ${order.customer.email}`,
    "",
    "商品一覧:",
    buildItemsSummary(order),
    "",
    `合計金額: ¥${order.totalJPY.toLocaleString("ja-JP")}`,
  ].join("\n");
}

class ResendOrderNotifier implements OrderNotifier {
  async notifyOrder(order: Order): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    const adminTo = process.env.ORDER_NOTIFY_TO;

    if (!apiKey || !from) {
      console.warn(
        "[orders] RESEND_API_KEY/RESEND_FROM_EMAIL is not configured; skipping notification",
        { orderId: order.orderId }
      );
      return;
    }

    const resend = new Resend(apiKey);

    try {
      const result = await resend.emails.send({
        from,
        to: order.customer.email,
        subject: "【HEBEREST】ご注文ありがとうございます",
        text: buildCustomerEmailText(order),
      });
      if (result.error) {
        console.error("[orders] failed to send customer confirmation email", {
          orderId: order.orderId,
          error: result.error,
        });
      }
    } catch (error) {
      console.error("[orders] failed to send customer confirmation email", {
        orderId: order.orderId,
        error,
      });
    }

    if (!adminTo) {
      console.warn("[orders] ORDER_NOTIFY_TO is not configured; skipping admin notification", {
        orderId: order.orderId,
      });
      return;
    }

    try {
      const result = await resend.emails.send({
        from,
        to: adminTo,
        subject: "【新規注文】",
        text: buildAdminEmailText(order),
      });
      if (result.error) {
        console.error("[orders] failed to send admin notification email", {
          orderId: order.orderId,
          error: result.error,
        });
      }
    } catch (error) {
      console.error("[orders] failed to send admin notification email", {
        orderId: order.orderId,
        error,
      });
    }
  }
}

export const orderNotifier: OrderNotifier = new ResendOrderNotifier();
```

**管理者宛（`buildAdminEmailText`・`adminTo`まわりの送信ブロック）はこのタスクでは一切変更しないこと。** 変更するのはお客様宛メールの内容（`buildCustomerEmailText`の中身の拡張＋`buildCustomerEmailHtml`の新規追加）と、お客様宛の`resend.emails.send`呼び出しに`html`フィールドを追加する部分のみ。

### 参照する`Order`型（`src/lib/orders/types.ts`、変更不要・読むだけ）

```ts
export type OrderStatus = "received" | "confirmed" | "cancelled";
export type PaymentStatus = "pending" | "invoiced" | "paid";

export interface OrderCustomer {
  name: string;
  nameKana: string;
  email: string;
  phone: string;
  postalCode: string;
  prefecture: string;
  city: string;
  addressLine: string;
}

export interface OrderShipping {
  sameAsCustomer: boolean;
  name?: string;
  phone?: string;
  postalCode?: string;
  prefecture?: string;
  city?: string;
  addressLine?: string;
  desiredDate?: string;
  desiredTimeSlot?: string;
  note?: string;
}

export interface OrderGift {
  noshi: boolean;
  nameEntry?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  variantLabel: string;
  unitPriceJPY: number;
  quantity: number;
  subtotalJPY: number;
}

export interface Order {
  orderId: string;
  idempotencyKey: string;
  createdAt: string; // Date#toISOString() (UTC)の文字列
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customer: OrderCustomer;
  shipping: OrderShipping;
  gift: OrderGift;
  items: OrderItem[];
  shippingFeeJPY: number;
  totalJPY: number;
  consents: OrderConsents;
  source: "HEBEREST-web";
}
```

`order.createdAt`はUTCのISO文字列。メール表示用には`Asia/Tokyo`のローカル時刻に変換して表示すること（例: `Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })`)。

配送希望時間帯（`shipping.desiredTimeSlot`）に入りうる値と、対応する表示ラベルは以下の通り（`src/app/order/[productId]/OrderForm.tsx`の入力欄と一致させること。未選択時は空文字列 `""` で、これは「指定なし」と表示する）:

| 値 | 表示ラベル |
|---|---|
| `""` | 指定なし |
| `morning` | 午前中 |
| `12-14` | 12:00〜14:00 |
| `14-16` | 14:00〜16:00 |
| `16-18` | 16:00〜18:00 |
| `18-20` | 18:00〜20:00 |
| `19-21` | 19:00〜21:00 |

未知の値が来た場合は、値の文字列をそのまま表示すること（フォールバック）。

配送先情報の表示ルール: `order.shipping.sameAsCustomer === true`の場合、配送先の氏名・電話番号・郵便番号・都道府県・市区町村・番地は`order.shipping`側ではなく`order.customer`側の対応するフィールドから取得して表示すること（`sameAsCustomer`のときは`shipping.name`等は`undefined`のため）。

のし・名入れの表示ルール: `order.gift.noshi === false`の場合は「のし: なし」とだけ表示。`true`の場合は「のし: あり」に加え、`order.gift.nameEntry`が存在すればその内容（エスケープ済み）を「名入れ: ○○」として表示する。

### 実装する内容

1. **HTMLエスケープ関数を追加**（ファイル内に追加する小さなヘルパー。新規依存パッケージは使わない）:

```ts
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
```

2. **日時フォーマット関数を追加**:

```ts
function formatOrderDateTime(isoString: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoString));
}
```

3. **配送希望時間帯ラベル変換関数を追加**（上記の対応表の通り）:

```ts
const TIME_SLOT_LABELS: Record<string, string> = {
  "": "指定なし",
  morning: "午前中",
  "12-14": "12:00〜14:00",
  "14-16": "14:00〜16:00",
  "16-18": "16:00〜18:00",
  "18-20": "18:00〜20:00",
  "19-21": "19:00〜21:00",
};

function formatTimeSlot(value: string | undefined): string {
  const key = value ?? "";
  return TIME_SLOT_LABELS[key] ?? key;
}
```

4. **配送先の実効値を解決するヘルパーを追加**（`sameAsCustomer`のときは`customer`側にフォールバック）:

```ts
function resolveShippingAddress(order: Order): {
  name: string;
  phone: string;
  postalCode: string;
  prefecture: string;
  city: string;
  addressLine: string;
} {
  if (order.shipping.sameAsCustomer) {
    return {
      name: order.customer.name,
      phone: order.customer.phone,
      postalCode: order.customer.postalCode,
      prefecture: order.customer.prefecture,
      city: order.customer.city,
      addressLine: order.customer.addressLine,
    };
  }
  return {
    name: order.shipping.name ?? "",
    phone: order.shipping.phone ?? "",
    postalCode: order.shipping.postalCode ?? "",
    prefecture: order.shipping.prefecture ?? "",
    city: order.shipping.city ?? "",
    addressLine: order.shipping.addressLine ?? "",
  };
}
```

5. **`buildCustomerEmailText`を書き換え**、以下の内容をすべて含める（お客様名・注文番号・注文日時・注文商品一覧＋数量＋小計・合計金額・配送先情報・配送希望日/時間帯・のし/名入れ情報・支払い方法が銀行振込であること・振込先や発送予定は改めて案内する旨・注文内容に誤りがある場合の連絡案内・ブランドトーンを保った丁寧な文章）。実装例（この通りの文言・順序で実装すること）:

```ts
function buildCustomerEmailText(order: Order): string {
  const shipping = resolveShippingAddress(order);
  const itemLines = order.items.map(
    (item) =>
      `　${item.name}（${item.variantLabel}） × ${item.quantity} = ¥${item.subtotalJPY.toLocaleString("ja-JP")}`
  );
  const giftLine = order.gift.noshi
    ? `のし: あり${order.gift.nameEntry ? `（名入れ: ${order.gift.nameEntry}）` : ""}`
    : "のし: なし";

  return [
    "--------------------------------",
    "",
    `${order.customer.name}様`,
    "",
    "この度はHEBERESTをご利用いただきありがとうございます。",
    "ご注文を受け付けましたので、内容をご確認ください。",
    "",
    "--------------------------------",
    "■ご注文情報",
    "--------------------------------",
    `注文番号: ${order.orderId}`,
    `注文日時: ${formatOrderDateTime(order.createdAt)}`,
    "",
    "ご注文商品:",
    ...itemLines,
    "",
    `合計金額: ¥${order.totalJPY.toLocaleString("ja-JP")}（送料込み）`,
    "",
    "--------------------------------",
    "■配送先情報",
    "--------------------------------",
    `お届け先: ${shipping.name}様`,
    `〒${shipping.postalCode} ${shipping.prefecture}${shipping.city}${shipping.addressLine}`,
    `電話番号: ${shipping.phone}`,
    `配送希望日: ${order.shipping.desiredDate || "指定なし"}`,
    `配送希望時間帯: ${formatTimeSlot(order.shipping.desiredTimeSlot)}`,
    "",
    "--------------------------------",
    "■のし・名入れ",
    "--------------------------------",
    giftLine,
    "",
    "--------------------------------",
    "■お支払いについて",
    "--------------------------------",
    "お支払い方法は銀行振込です。",
    "振込先および発送予定につきましては、",
    "改めて別のメールにてご案内いたします。",
    "",
    "ご注文内容に誤りがある場合や、",
    "ご不明な点がございましたら、",
    "お手数ですが本メールに返信の上ご連絡くださいませ。",
    "",
    "--------------------------------",
    "",
    "HEBEREST",
    SITE_URL,
    "",
    "--------------------------------",
  ].join("\n");
}
```

6. **`buildCustomerEmailHtml`を新規追加**（テキスト版と同じ情報を、シンプルなテーブルベースのHTMLメールとして構成する。インラインスタイルのみ使用し外部CSS/JSは使わない。お客様入力に由来する値——氏名・住所各項目・電話番号・のし名入れ文字——は必ず`escapeHtml()`を通してから埋め込む。ブランドカラーは `#1c2f21`（濃緑・見出し等）, `#2f4a37`（緑）を使う）:

```ts
function buildCustomerEmailHtml(order: Order): string {
  const shipping = resolveShippingAddress(order);
  const itemRows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #e5e5e0;">${escapeHtml(item.name)}（${escapeHtml(item.variantLabel)}） × ${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e5e5e0;text-align:right;white-space:nowrap;">¥${item.subtotalJPY.toLocaleString("ja-JP")}</td>
        </tr>`
    )
    .join("");
  const giftLine = order.gift.noshi
    ? `のし: あり${order.gift.nameEntry ? `（名入れ: ${escapeHtml(order.gift.nameEntry)}）` : ""}`
    : "のし: なし";

  return `
<!doctype html>
<html lang="ja">
  <body style="margin:0;padding:0;background-color:#f5f4f0;font-family:'Hiragino Sans','Yu Gothic',sans-serif;color:#1c2f21;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f4f0;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
            <tr>
              <td style="background-color:#1c2f21;padding:24px 32px;">
                <span style="color:#ffffff;font-size:12px;letter-spacing:0.3em;">HEBEREST</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 16px;">${escapeHtml(order.customer.name)}様</p>
                <p style="margin:0 0 24px;line-height:1.8;">
                  この度はHEBERESTをご利用いただきありがとうございます。<br />
                  ご注文を受け付けましたので、内容をご確認ください。
                </p>

                <h2 style="font-size:14px;color:#2f4a37;border-bottom:2px solid #2f4a37;padding-bottom:8px;">ご注文情報</h2>
                <p style="margin:8px 0;">注文番号: ${escapeHtml(order.orderId)}<br />注文日時: ${escapeHtml(formatOrderDateTime(order.createdAt))}</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 16px;font-size:14px;">
                  ${itemRows}
                  <tr>
                    <td style="padding:12px 0 0;font-weight:bold;">合計金額（送料込み）</td>
                    <td style="padding:12px 0 0;text-align:right;font-weight:bold;">¥${order.totalJPY.toLocaleString("ja-JP")}</td>
                  </tr>
                </table>

                <h2 style="font-size:14px;color:#2f4a37;border-bottom:2px solid #2f4a37;padding-bottom:8px;">配送先情報</h2>
                <p style="margin:8px 0;line-height:1.8;">
                  お届け先: ${escapeHtml(shipping.name)}様<br />
                  〒${escapeHtml(shipping.postalCode)} ${escapeHtml(shipping.prefecture)}${escapeHtml(shipping.city)}${escapeHtml(shipping.addressLine)}<br />
                  電話番号: ${escapeHtml(shipping.phone)}<br />
                  配送希望日: ${escapeHtml(order.shipping.desiredDate || "指定なし")}<br />
                  配送希望時間帯: ${escapeHtml(formatTimeSlot(order.shipping.desiredTimeSlot))}
                </p>

                <h2 style="font-size:14px;color:#2f4a37;border-bottom:2px solid #2f4a37;padding-bottom:8px;">のし・名入れ</h2>
                <p style="margin:8px 0;">${giftLine}</p>

                <h2 style="font-size:14px;color:#2f4a37;border-bottom:2px solid #2f4a37;padding-bottom:8px;">お支払いについて</h2>
                <p style="margin:8px 0;line-height:1.8;">
                  お支払い方法は銀行振込です。<br />
                  振込先および発送予定につきましては、改めて別のメールにてご案内いたします。
                </p>

                <p style="margin:24px 0 0;line-height:1.8;font-size:13px;color:#555;">
                  ご注文内容に誤りがある場合や、ご不明な点がございましたら、<br />
                  お手数ですが本メールに返信の上ご連絡くださいませ。
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#f5f4f0;padding:16px 32px;text-align:center;font-size:12px;color:#777;">
                HEBEREST ｜ <a href="${SITE_URL}" style="color:#2f4a37;">${SITE_URL}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
```

7. **お客様宛`resend.emails.send`呼び出しに`html`を追加**（`notifyOrder`内、お客様宛メール送信ブロックのみ変更。管理者宛ブロックは変更しない）:

```ts
      const result = await resend.emails.send({
        from,
        to: order.customer.email,
        subject: "【HEBEREST】ご注文ありがとうございます",
        text: buildCustomerEmailText(order),
        html: buildCustomerEmailHtml(order),
      });
```

（この前後の`try`/`if (result.error)`/`catch`構造は変更しない。）

### 単体テストの追加

新規ファイル `src/lib/orders/notify.test.ts` を作成し、`node:test` + `node:assert/strict`で以下を検証する（`buildCustomerEmailText`・`buildCustomerEmailHtml`・`escapeHtml`など、この実装で追加/変更した純粋関数が対象。Resend APIそのものはモックせず呼び出さない——これらの関数は`Order`を受け取って文字列を返すだけの純粋関数であるべきで、テストもその前提で書く）。

テストで検証すべき内容の例（正確なテストケース名や構成は実装者の裁量でよいが、最低限これらの観点をカバーすること）:

- `escapeHtml`が`&`, `<`, `>`, `"`, `'`を正しくエスケープする
- `buildCustomerEmailText`が、注文番号・合計金額・商品名を含む文字列を返す
- `buildCustomerEmailText`が、`shipping.sameAsCustomer === true`のとき配送先情報として`customer`側の氏名・住所を使う
- `buildCustomerEmailHtml`が、氏名に`<script>`のようなHTMLタグを含む顧客名を渡したとき、エスケープされた形（`&lt;script&gt;`）でのみ出力に含まれ、生の`<script>`タグとしては出力に含まれないこと（XSS対策の検証）
- `buildCustomerEmailHtml`が、のし名入れ文字列にHTML特殊文字が含まれる場合も同様にエスケープされること
- `order.gift.noshi === false`のとき「のし: なし」が出力され、`nameEntry`が出力に含まれないこと

テスト対象の関数（`buildCustomerEmailText`, `buildCustomerEmailHtml`, `escapeHtml`, `formatTimeSlot`, `resolveShippingAddress`）はテストから直接importできるよう、`notify.ts`内で`export function`にすること（`export class`のexportに加えて、これらのヘルパー関数もexportする。既存の`OrderNotifier`インターフェースと`orderNotifier`のexportはそのまま維持する）。

テスト内で使うダミーの`Order`オブジェクトは、`src/lib/orders/types.ts`の`Order`型を満たす最小限のものを1つ用意し、必要なフィールドだけ書き換えて複数のテストケースで使い回してよい。

### package.jsonへのtestスクリプト追加

`package.json`の`"scripts"`に以下を追加する（既存の`dev`/`build`/`start`/`lint`は変更しない）:

```json
    "test": "node --test src/**/*.test.ts"
```

### 検証手順（実装者が実行し、報告に結果を含めること）

1. `npm run test` — 追加した単体テストがすべて成功すること
2. `npm run lint` — 既存のESLintルールに違反しないこと
3. `npm run build` — 本番ビルドが成功すること（Windows環境ではまれに`Next.js build worker exited with code: 3221226505`という無関係な一過性エラーが出ることがある。その場合は再実行し、2回目で成功すればよい）

### 完了条件（Doneの定義）

- `src/lib/orders/notify.ts`のお客様宛メールがHTML+テキスト両方を送信し、上記のすべての情報を含む
- 管理者宛メールの処理・文言は一切変更されていない
- `OrderNotifier`インターフェースと`actions.ts`は変更されていない
- お客様入力由来の値はすべてHTMLエスケープされている
- ログにPIIやAPIキーが出力されない
- `npm run test` / `npm run lint` / `npm run build` すべて成功
- 1コミットにまとめてコミット済み
