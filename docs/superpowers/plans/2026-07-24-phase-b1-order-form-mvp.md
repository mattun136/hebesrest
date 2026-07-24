# Phase B-1: 購入フォームMVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** HEBERESTブランドサイトに、Googleスプレッドシート（Apps Script Web App経由）へ保存する購入フォームMVPを追加する。保存層・通知層・配送可否判定は将来Maruhe OSへ差し替え可能な単一インターフェースのアダプターとして実装する。

**Architecture:** `lib/products.ts`（商品カタログ）と`lib/orders/*`（型・バリデーション・金額計算・配送可能日計算・保存アダプター・通知アダプター、いずれもUIから独立した純粋関数/アダプター）を新設し、`app/order/[productId]`（入力→確認の2ステップフォーム＋Server Action）・`app/order/complete`（完了画面）・`app/legal/{tokushoho,privacy}`（法定ページ）を追加する。UIコンポーネントは「表示してServer Actionを呼ぶ」以上のことをしない。

**Tech Stack:** Next.js 16.2.10（App Router / Server Actions）/ React 19.2.4 / TypeScript / Tailwind CSS v4 / Zod v4 / Resend / Vercel BotID・Firewall。テストランナー未導入のため、純粋関数の検証は`npx --yes tsx`での一時スクリプト実行、UI/Server Actionの検証は`npm run build`と開発サーバーでの手動確認で行う。

## Global Constraints

- 対象仕様書: `docs/superpowers/specs/2026-07-24-phase-b1-order-form-design.md`（前提: `docs/superpowers/specs/2026-07-13-brand-message-and-order-form-design.md` 4章）
- 保存先はGoogleスプレッドシート（Apps Script Web App、共有シークレット方式）。DBは採用しない
- 保存層（`lib/orders/store.ts`）・通知層（`lib/orders/notify.ts`）・配送可否判定（`lib/orders/shipping-calendar.ts`）は、実装を差し替えても呼び出し側が変更不要な単一インターフェース関数（`saveOrder` / `notifyOrder` / `getAvailableShipDates`）として実装する
- 金額はクライアントの表示値を信用せず、Server Action内で商品ID・数量から必ず再計算する（`lib/orders/pricing.ts`）
- 配送希望日はServer Action内で`shipping-calendar.ts`により必ず再検証する（クライアントの選択を信用しない）
- のし・名入れをMVPスコープに含める（前設計書の「見送り」判断を上書き）
- 通知メールは環境変数（`RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `ORDER_NOTIFY_TO`）が未設定でも安全に動作すること（警告ログを出して処理は継続、送信をスキップ）
- ログに氏名・住所・電話番号などの個人情報を出力しない。出力してよいのは注文ID・商品ID・数量・金額のみ
- 各タスク完了時に個別コミットする（1タスク=1コミット）。各タスクの最後は必ず`npm run lint`と`npm run build`を実行し、エラーがないことを確認する
- 実装順序はユーザー指定：①フォームUI ②入力バリデーション ③確認画面 ④完了画面 ⑤Googleスプレッドシート保存 ⑥メール通知 ⑦GitHubへCommit・Push ⑧Vercelへデプロイ。①③は同一フォームコンポーネントの入力・確認ステップであり独立してレビューできないため1タスクにまとめ、②のバリデーションも同じタスクに含める（Task 8）。④⑤⑥⑦⑧はそれぞれ独立したタスクとする

---

### Task 1: 商品カタログを`lib/products.ts`に抽出し、`Products.tsx`から参照する

**Files:**
- Create: `src/lib/products.ts`
- Modify: `src/components/Products.tsx`

**Interfaces:**
- Consumes: なし
- Produces: `PRODUCTS: Record<ProductId, Product>`、`PRODUCT_LIST: Product[]`、`isProductId(value: string): value is ProductId`（Task 2以降・Task 8のフォーム・Server Actionが使用）

- [ ] **Step 1: `src/lib/products.ts`を作成する**

```ts
import type { StaticImageData } from "next/image";
import product1kg from "../../public/images/products/product-1kg.jpg";
import product05kg from "../../public/images/products/product-05kg.jpg";
import product18kg from "../../public/images/products/product-18kg.jpg";
import product3kg from "../../public/images/products/product-3kg.jpg";

export type ProductId = "1kg" | "05kg" | "18kg" | "3kg";

export interface Product {
  id: ProductId;
  tag: string;
  badge?: string;
  name: string;
  variantLabel: string;
  unitPriceJPY: number;
  description: string;
  mercariHref: string;
  image: StaticImageData;
  /** 将来Journal記事を実装した際にリンクする記事slug。今回は未使用。 */
  relatedStorySlugs?: string[];
}

export const PRODUCTS: Record<ProductId, Product> = {
  "1kg": {
    id: "1kg",
    tag: "人気No.1",
    badge: "人気No.1",
    name: "宮崎県産ハウスへべす 1kg",
    variantLabel: "1kg",
    unitPriceJPY: 3777,
    description:
      "初めての方にもおすすめ。ご家庭で使いやすい、一番人気の定番サイズです。",
    mercariHref:
      "https://jp.mercari.com/shops/product/2JTiJS2yRCFeoJvpWYSk8C?source=shared_link&utm_source=shared_link",
    image: product1kg,
  },
  "05kg": {
    id: "05kg",
    tag: "お試しサイズ",
    name: "宮崎県産ハウスへべす 0.5kg",
    variantLabel: "0.5kg",
    unitPriceJPY: 2500,
    description: "まずはへべすを味わってみたい方へ。",
    mercariHref:
      "https://jp.mercari.com/shops/product/2JTowaqNx8QHB2Uo44idVm?source=shared_link&utm_source=shared_link",
    image: product05kg,
  },
  "18kg": {
    id: "18kg",
    tag: "ご家庭向け",
    name: "宮崎県産ハウスへべす 1.8kg",
    variantLabel: "1.8kg",
    unitPriceJPY: 5675,
    description: "ご家族でたっぷり楽しみたい方に。",
    mercariHref:
      "https://jp.mercari.com/shops/product/2JTj2zfBbeZULsCHJ6dSVE?source=shared_link&utm_source=shared_link",
    image: product18kg,
  },
  "3kg": {
    id: "3kg",
    tag: "たっぷりサイズ",
    name: "宮崎県産ハウスへべす 3kg",
    variantLabel: "3kg",
    unitPriceJPY: 8610,
    description: "料理好きの方やまとめ買いにおすすめです。",
    mercariHref:
      "https://jp.mercari.com/shops/product/2JTj4a5Tcd4WDHWJniSjkn?source=shared_link&utm_source=shared_link",
    image: product3kg,
  },
};

export const PRODUCT_LIST: Product[] = Object.values(PRODUCTS);

export function isProductId(value: string): value is ProductId {
  return Object.prototype.hasOwnProperty.call(PRODUCTS, value);
}
```

- [ ] **Step 2: `Products.tsx`の商品配列をやめ、`PRODUCT_LIST`を参照するよう書き換える（表示・挙動は変更しない）**

`src/components/Products.tsx`の1〜79行目（`import`群と`products`配列定義）を以下に置き換える：

```tsx
import Image from "next/image";
import { PRODUCT_LIST } from "@/lib/products";
import productJuice from "../../public/images/products/product-juice.jpg";
import productJuice2 from "../../public/images/products/product-juice2.jpg";
import productNoji from "../../public/images/products/product-noji.jpg";
import productAki from "../../public/images/products/product-aki.jpg";

const comingSoonProducts = [
  {
    tag: "一年中楽しめる",
    name: "冷凍へべす非加熱ストレート果汁 1000ml",
    description: "現在販売準備中です。",
    comingSoonLabel: "準備中",
    image: productJuice,
  },
  {
    tag: "一年中楽しめる",
    name: "冷凍へべす非加熱ストレート果汁 1000ml×2",
    description: "現在販売準備中です。",
    comingSoonLabel: "準備中",
    image: productJuice2,
  },
  {
    tag: "季節限定",
    name: "路地へべす",
    comingSoonLabel: "販売準備中",
    image: productNoji,
  },
  {
    tag: "Coming Soon",
    name: "黄色い秋へべす",
    meta: "販売時期：10月〜12月限定",
    description:
      "市場から姿を消したあと、本当の旬が始まるへべす。9月で市場流通は終了しますが、園地ではその後も木の上でゆっくりと完熟していきます。私たちは、その実を農家さんから直接お届けします。爽やかな香りはそのままに、まろやかな酸味と深い味わいを楽しめる、秋だけの特別なへべすです。",
    comingSoonLabel: "販売開始をお楽しみに",
    image: productAki,
  },
];

function formatPriceLabel(unitPriceJPY: number): string {
  return `¥${unitPriceJPY.toLocaleString("ja-JP")}（税込・送料無料）`;
}
```

続けて、80行目以降の`export default function Products()`内の`{products.map((p) => (...))}`ブロックを以下2つのブロック（注文可能商品＋コミングスーン商品）に置き換える。`<div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">`の中身を丸ごと以下に差し替える：

```tsx
          {PRODUCT_LIST.map((p) => (
            <div
              key={p.id}
              className="flex flex-col rounded-3xl bg-background p-6 shadow-sm ring-1 ring-brand-line"
            >
              <div className="relative h-36 overflow-hidden rounded-2xl">
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  placeholder="blur"
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
                {p.badge && (
                  <span className="absolute left-3 top-3 rounded-full bg-brand-gold px-3 py-1 text-[10px] font-medium tracking-wider text-white shadow-sm">
                    {p.badge}
                  </span>
                )}
              </div>
              <span className="mt-6 text-[11px] tracking-[0.2em] text-brand-green">
                {p.tag}
              </span>
              <h3 className="mt-2 font-serif text-base text-brand-green-dark">
                {p.name}
              </h3>
              <p className="mt-2 flex-1 text-xs leading-relaxed text-foreground/60">
                {p.description}
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <span className="text-sm font-medium text-brand-green-dark">
                  {formatPriceLabel(p.unitPriceJPY)}
                </span>
                <a
                  href={p.mercariHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-full bg-brand-green-dark px-4 py-2 text-xs text-white transition-colors hover:bg-brand-green"
                >
                  購入する
                </a>
              </div>
            </div>
          ))}

          {comingSoonProducts.map((p) => (
            <div
              key={p.name}
              className="flex flex-col rounded-3xl bg-background p-6 shadow-sm ring-1 ring-brand-line"
            >
              <div className="relative h-36 overflow-hidden rounded-2xl">
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  placeholder="blur"
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <span className="mt-6 text-[11px] tracking-[0.2em] text-brand-green">
                {p.tag}
              </span>
              <h3 className="mt-2 font-serif text-base text-brand-green-dark">
                {p.name}
              </h3>
              {p.meta && (
                <p className="mt-1 text-xs tracking-wide text-brand-gold">
                  {p.meta}
                </p>
              )}
              {p.description && (
                <p className="mt-2 flex-1 text-xs leading-relaxed text-foreground/60">
                  {p.description}
                </p>
              )}
              <div className="mt-6 flex flex-col gap-3">
                <span className="inline-flex w-full items-center justify-center rounded-full border border-brand-line px-4 py-2 text-xs text-foreground/40">
                  {p.comingSoonLabel}
                </span>
              </div>
            </div>
          ))}
```

この時点で表示・挙動は変更前と同一であることを確認する（商品名・価格・画像・リンク先すべて据え置き）。

- [ ] **Step 3: lintを実行する**

Run: `npm run lint`
Expected: エラーなく完了する

- [ ] **Step 4: buildを実行する**

Run: `npm run build`
Expected: `✓ Compiled successfully`

- [ ] **Step 5: コミット**

```bash
git add src/lib/products.ts src/components/Products.tsx
git commit -m "refactor: extract product catalog to lib/products.ts"
```

---

### Task 2: `lib/orders/types.ts` — 共通型定義

**Files:**
- Create: `src/lib/orders/types.ts`

**Interfaces:**
- Consumes: なし
- Produces: `Order` `OrderItem` `OrderCustomer` `OrderShipping` `OrderGift` `OrderConsents` `OrderStatus` `PaymentStatus`（以降すべてのlib/orders/*・Server Actionが使用）

- [ ] **Step 1: `src/lib/orders/types.ts`を作成する**

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

export interface OrderConsents {
  privacy: boolean;
  orderContent: boolean;
  cancellationPolicy: boolean;
}

export interface Order {
  orderId: string;
  idempotencyKey: string;
  createdAt: string;
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

- [ ] **Step 2: lintを実行する**

Run: `npm run lint`
Expected: エラーなく完了する

- [ ] **Step 3: buildを実行する**

Run: `npm run build`
Expected: `✓ Compiled successfully`（`types.ts`はまだどこからも importされないため、未使用エラーにはならない）

- [ ] **Step 4: コミット**

```bash
git add src/lib/orders/types.ts
git commit -m "feat: add Order common type definitions"
```

---

### Task 3: `lib/orders/shipping-calendar.ts` — 出荷可能日の計算

**Files:**
- Create: `src/lib/orders/shipping-calendar.ts`

**Interfaces:**
- Consumes: なし
- Produces: `getAvailableShipDates(from: Date, count: number): string[]`、`isValidShipDate(dateKey: string, from: Date): boolean`（Task 5のschema・Task 8のフォーム/Server Actionが使用）

- [ ] **Step 1: `src/lib/orders/shipping-calendar.ts`を作成する**

日曜日・年末年始などの休業日を除外し、最短リードタイムを確保した出荷可能日を計算する純粋関数。日付はサーバーのタイムゾーンに依存しないよう、UTCの暦日として扱う（「どの暦日が出荷可能か」という抽象的な判定であり、実時刻の比較は行わないため問題にならない）。

```ts
/** 年末年始・市場休業日など。運用しながら追加・削除する（将来Maruhe OSの営業日カレンダーに差し替え可能）。 */
const BLACKOUT_DATES: string[] = [
  "2026-12-29",
  "2026-12-30",
  "2026-12-31",
  "2027-01-01",
  "2027-01-02",
  "2027-01-03",
];

/** 収穫・梱包にかかる最短リードタイム（営業日ベースの日数、仮値）。 */
const MIN_LEAD_DAYS = 2;

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isShippableDay(date: Date): boolean {
  const day = date.getUTCDay(); // 0 = 日曜日
  if (day === 0) return false;
  if (BLACKOUT_DATES.includes(toDateKey(date))) return false;
  return true;
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

/** `from`を起点に、出荷可能な日付（YYYY-MM-DD）を`count`件分、古い順に返す。 */
export function getAvailableShipDates(from: Date, count: number): string[] {
  const dates: string[] = [];
  const cursor = startOfUtcDay(from);
  cursor.setUTCDate(cursor.getUTCDate() + MIN_LEAD_DAYS);

  while (dates.length < count) {
    if (isShippableDay(cursor)) {
      dates.push(toDateKey(cursor));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

/** `dateKey`（YYYY-MM-DD）が`from`起点で選択可能な出荷可能日かどうかを判定する。 */
export function isValidShipDate(dateKey: string, from: Date): boolean {
  return getAvailableShipDates(from, 60).includes(dateKey);
}
```

- [ ] **Step 2: 一時スクリプトで動作を確認する**

`scratch-shipping-calendar.ts`を作成する：

```ts
import { getAvailableShipDates, isValidShipDate } from "./src/lib/orders/shipping-calendar";

const from = new Date("2026-07-24T00:00:00.000Z"); // 金曜日
const dates = getAvailableShipDates(from, 10);
console.log(dates);

console.assert(!dates.some((d) => new Date(d + "T00:00:00.000Z").getUTCDay() === 0), "日曜日が含まれています");
console.assert(dates[0] >= "2026-07-26", "最短リードタイムが守られていません");
console.assert(isValidShipDate(dates[0], from), "生成された日付自身がisValidShipDateでtrueにならない");
console.assert(!isValidShipDate("2099-01-01", from), "存在しないはずの日付がtrueになっている");
console.log("OK");
```

Run: `npx --yes tsx scratch-shipping-calendar.ts`
Expected: 日付の配列が出力され、末尾に`OK`が表示される（`console.assert`が失敗すると`Assertion failed`がコンソールに出る）

- [ ] **Step 3: 一時スクリプトを削除する**

```bash
rm -f scratch-shipping-calendar.ts
```

- [ ] **Step 4: lintを実行する**

Run: `npm run lint`
Expected: エラーなく完了する

- [ ] **Step 5: buildを実行する**

Run: `npm run build`
Expected: `✓ Compiled successfully`

- [ ] **Step 6: コミット**

```bash
git add src/lib/orders/shipping-calendar.ts
git commit -m "feat: add shipping calendar availability calculation"
```

---

### Task 4: `lib/orders/pricing.ts` — 金額のサーバー側再計算

**Files:**
- Create: `src/lib/orders/pricing.ts`

**Interfaces:**
- Consumes: `PRODUCTS: Record<ProductId, Product>`（`@/lib/products`）、`OrderItem`（`@/lib/orders/types`）
- Produces: `priceOrder(productId: ProductId, quantity: number): PricingResult`（`PricingResult = { items: OrderItem[]; shippingFeeJPY: number; totalJPY: number }`）。Task 6のorder.ts・Task 8のフォーム/Server Actionが使用

- [ ] **Step 1: `src/lib/orders/pricing.ts`を作成する**

```ts
import { PRODUCTS, type ProductId } from "@/lib/products";
import type { OrderItem } from "@/lib/orders/types";

export interface PricingResult {
  items: OrderItem[];
  shippingFeeJPY: number;
  totalJPY: number;
}

/** 全商品送料無料（初期実装は固定0円。将来地域係数を追加できるようこの関数に閉じてある）。 */
const SHIPPING_FEE_JPY = 0;

export function priceOrder(productId: ProductId, quantity: number): PricingResult {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 9) {
    throw new RangeError(`quantity must be an integer between 1 and 9, got ${quantity}`);
  }

  const product = PRODUCTS[productId];
  const subtotalJPY = product.unitPriceJPY * quantity;

  return {
    items: [
      {
        productId: product.id,
        name: product.name,
        variantLabel: product.variantLabel,
        unitPriceJPY: product.unitPriceJPY,
        quantity,
        subtotalJPY,
      },
    ],
    shippingFeeJPY: SHIPPING_FEE_JPY,
    totalJPY: subtotalJPY + SHIPPING_FEE_JPY,
  };
}
```

- [ ] **Step 2: 一時スクリプトで動作を確認する**

`scratch-pricing.ts`を作成する：

```ts
import { priceOrder } from "./src/lib/orders/pricing";

const result = priceOrder("1kg", 3);
console.log(result);

console.assert(result.items[0].subtotalJPY === 3777 * 3, "小計の計算が誤っています");
console.assert(result.totalJPY === 3777 * 3, "送料無料が反映されていません");

try {
  priceOrder("1kg", 0);
  console.assert(false, "数量0が例外にならなかった");
} catch {
  console.log("quantity=0 correctly rejected");
}

console.log("OK");
```

Run: `npx --yes tsx scratch-pricing.ts`
Expected: 計算結果が出力され、末尾に`OK`が表示される

- [ ] **Step 3: 一時スクリプトを削除する**

```bash
rm -f scratch-pricing.ts
```

- [ ] **Step 4: lintを実行する**

Run: `npm run lint`
Expected: エラーなく完了する

- [ ] **Step 5: buildを実行する**

Run: `npm run build`
Expected: `✓ Compiled successfully`

- [ ] **Step 6: コミット**

```bash
git add src/lib/orders/pricing.ts
git commit -m "feat: add server-side order pricing calculation"
```

---

### Task 5: `lib/orders/schema.ts` — Zodバリデーションスキーマ

**Files:**
- Create: `src/lib/orders/schema.ts`
- Modify: `package.json`（`zod`依存追加）

**Interfaces:**
- Consumes: `isProductId`（`@/lib/products`）、`isValidShipDate`（`@/lib/orders/shipping-calendar`）
- Produces: `orderFormSchema`（Zodスキーマ）、`type OrderFormInput = z.infer<typeof orderFormSchema>`、`type OrderFormFieldErrors = Partial<Record<string, string[]>>`。Task 6のorder.ts・Task 8のフォーム/Server Actionが使用

- [ ] **Step 1: `zod`を依存関係に追加する**

Run: `npm install zod@^4`
Expected: `package.json`の`dependencies`に`"zod"`が追加される

- [ ] **Step 2: `src/lib/orders/schema.ts`を作成する**

```ts
import { z } from "zod";
import { isProductId } from "@/lib/products";
import { isValidShipDate } from "@/lib/orders/shipping-calendar";

const postalCodeRegex = /^\d{3}-?\d{4}$/;
const phoneRegex = /^[0-9()+\- ]{9,15}$/;

export const orderFormSchema = z
  .object({
    productId: z.string().refine(isProductId, { message: "不正な商品IDです" }),
    quantity: z.coerce.number().int().min(1).max(9),

    customerName: z.string().trim().min(1, "お名前を入力してください").max(60),
    customerNameKana: z.string().trim().min(1, "フリガナを入力してください").max(60),
    customerEmail: z
      .string()
      .trim()
      .pipe(z.email("メールアドレスの形式が正しくありません")),
    customerPhone: z
      .string()
      .trim()
      .regex(phoneRegex, "電話番号の形式が正しくありません"),
    customerPostalCode: z
      .string()
      .trim()
      .regex(postalCodeRegex, "郵便番号はハイフンありなしの7桁で入力してください"),
    customerPrefecture: z.string().trim().min(1, "都道府県を入力してください").max(10),
    customerCity: z.string().trim().min(1, "市区町村を入力してください").max(60),
    customerAddressLine: z
      .string()
      .trim()
      .min(1, "番地・建物名を入力してください")
      .max(120),

    shippingSameAsCustomer: z.coerce.boolean(),
    shippingName: z.string().trim().max(60).optional(),
    shippingPhone: z.string().trim().regex(phoneRegex).optional().or(z.literal("")),
    shippingPostalCode: z
      .string()
      .trim()
      .regex(postalCodeRegex)
      .optional()
      .or(z.literal("")),
    shippingPrefecture: z.string().trim().max(10).optional(),
    shippingCity: z.string().trim().max(60).optional(),
    shippingAddressLine: z.string().trim().max(120).optional(),
    shippingDesiredDate: z.string().trim().optional().or(z.literal("")),
    shippingDesiredTimeSlot: z.string().trim().max(20).optional(),
    shippingNote: z.string().trim().max(300).optional(),

    giftNoshi: z.coerce.boolean(),
    giftNameEntry: z.string().trim().max(20).optional(),

    consentPrivacy: z.coerce
      .boolean()
      .refine((v) => v === true, { message: "プライバシーポリシーへの同意が必要です" }),
    consentOrderContent: z.coerce
      .boolean()
      .refine((v) => v === true, { message: "注文内容への同意が必要です" }),
    consentCancellationPolicy: z.coerce
      .boolean()
      .refine((v) => v === true, {
        message: "キャンセル・返品条件への同意が必要です",
      }),

    idempotencyKey: z.uuid(),
  })
  .superRefine((data, ctx) => {
    if (!data.shippingSameAsCustomer) {
      if (!data.shippingName) {
        ctx.addIssue({
          code: "custom",
          path: ["shippingName"],
          message: "配送先氏名を入力してください",
          input: data.shippingName,
        });
      }
      if (!data.shippingPostalCode || !postalCodeRegex.test(data.shippingPostalCode)) {
        ctx.addIssue({
          code: "custom",
          path: ["shippingPostalCode"],
          message: "配送先郵便番号を正しく入力してください",
          input: data.shippingPostalCode,
        });
      }
      if (!data.shippingPrefecture) {
        ctx.addIssue({
          code: "custom",
          path: ["shippingPrefecture"],
          message: "配送先都道府県を入力してください",
          input: data.shippingPrefecture,
        });
      }
      if (!data.shippingCity) {
        ctx.addIssue({
          code: "custom",
          path: ["shippingCity"],
          message: "配送先市区町村を入力してください",
          input: data.shippingCity,
        });
      }
      if (!data.shippingAddressLine) {
        ctx.addIssue({
          code: "custom",
          path: ["shippingAddressLine"],
          message: "配送先番地・建物名を入力してください",
          input: data.shippingAddressLine,
        });
      }
    }

    if (data.shippingDesiredDate && !isValidShipDate(data.shippingDesiredDate, new Date())) {
      ctx.addIssue({
        code: "custom",
        path: ["shippingDesiredDate"],
        message: "指定された配送希望日は選択できません",
        input: data.shippingDesiredDate,
      });
    }
  });

export type OrderFormInput = z.infer<typeof orderFormSchema>;
export type OrderFormFieldErrors = Partial<Record<string, string[]>>;
```

- [ ] **Step 3: 一時スクリプトで正常系・異常系を確認する**

`scratch-schema.ts`を作成する：

```ts
import { z } from "zod";
import { orderFormSchema } from "./src/lib/orders/schema";
import { getAvailableShipDates } from "./src/lib/orders/shipping-calendar";
import { randomUUID } from "node:crypto";

const validDate = getAvailableShipDates(new Date(), 1)[0];

const validInput = {
  productId: "1kg",
  quantity: "2",
  customerName: "山田太郎",
  customerNameKana: "ヤマダタロウ",
  customerEmail: "taro@example.com",
  customerPhone: "090-1234-5678",
  customerPostalCode: "123-4567",
  customerPrefecture: "宮崎県",
  customerCity: "日向市",
  customerAddressLine: "1-2-3",
  shippingSameAsCustomer: true,
  shippingDesiredDate: validDate,
  giftNoshi: false,
  consentPrivacy: true,
  consentOrderContent: true,
  consentCancellationPolicy: true,
  idempotencyKey: randomUUID(),
};

const validResult = orderFormSchema.safeParse(validInput);
console.assert(validResult.success, "正常な入力が弾かれています: " + JSON.stringify(validResult.success ? null : validResult.error.issues));

const invalidResult = orderFormSchema.safeParse({
  ...validInput,
  customerEmail: "not-an-email",
  consentPrivacy: false,
});
console.assert(!invalidResult.success, "不正な入力が通ってしまっています");
if (!invalidResult.success) {
  const flat = z.flattenError(invalidResult.error);
  console.log(flat.fieldErrors);
  console.assert(
    Array.isArray(flat.fieldErrors.customerEmail) && flat.fieldErrors.customerEmail.length > 0,
    "customerEmailのエラーメッセージが取得できていません"
  );
  console.assert(
    Array.isArray(flat.fieldErrors.consentPrivacy) && flat.fieldErrors.consentPrivacy.length > 0,
    "consentPrivacyのエラーメッセージが取得できていません"
  );
}

console.log("OK");
```

Run: `npx --yes tsx scratch-schema.ts`
Expected: `Assertion failed`が出ず、末尾に`OK`が表示される

- [ ] **Step 4: 一時スクリプトを削除する**

```bash
rm -f scratch-schema.ts
```

- [ ] **Step 5: lintを実行する**

Run: `npm run lint`
Expected: エラーなく完了する

- [ ] **Step 6: buildを実行する**

Run: `npm run build`
Expected: `✓ Compiled successfully`

- [ ] **Step 7: コミット**

```bash
git add package.json package-lock.json src/lib/orders/schema.ts
git commit -m "feat: add Zod validation schema for order form"
```

---

### Task 6: `lib/orders/order.ts` / `store.ts` / `notify.ts` — 注文生成と差し替え可能アダプター（暫定Console実装）

**Files:**
- Create: `src/lib/orders/order.ts`
- Create: `src/lib/orders/store.ts`
- Create: `src/lib/orders/notify.ts`

**Interfaces:**
- Consumes: `OrderFormInput`（`@/lib/orders/schema`）、`priceOrder`（`@/lib/orders/pricing`）、`Order`（`@/lib/orders/types`）
- Produces: `buildOrder(input: OrderFormInput, now?: Date): Order`／`interface OrderStore { saveOrder(order: Order): Promise<void> }` + `orderStore: OrderStore`／`interface OrderNotifier { notifyOrder(order: Order): Promise<void> }` + `orderNotifier: OrderNotifier`。Task 8のServer Actionが使用。Task 10で`store.ts`の実装を、Task 11で`notify.ts`の実装を差し替える（インターフェースは変更しない）

- [ ] **Step 1: `src/lib/orders/order.ts`を作成する**

```ts
import type { OrderFormInput } from "@/lib/orders/schema";
import { priceOrder } from "@/lib/orders/pricing";
import type { Order } from "@/lib/orders/types";
import type { ProductId } from "@/lib/products";

function generateOrderId(now: Date): string {
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `HBR-${datePart}-${randomPart}`;
}

/** バリデーション済みのフォーム入力から、金額をサーバー側で再計算した`Order`を組み立てる。 */
export function buildOrder(input: OrderFormInput, now: Date = new Date()): Order {
  const pricing = priceOrder(input.productId as ProductId, input.quantity);

  return {
    orderId: generateOrderId(now),
    idempotencyKey: input.idempotencyKey,
    createdAt: now.toISOString(),
    status: "received",
    paymentStatus: "pending",
    customer: {
      name: input.customerName,
      nameKana: input.customerNameKana,
      email: input.customerEmail,
      phone: input.customerPhone,
      postalCode: input.customerPostalCode,
      prefecture: input.customerPrefecture,
      city: input.customerCity,
      addressLine: input.customerAddressLine,
    },
    shipping: {
      sameAsCustomer: input.shippingSameAsCustomer,
      name: input.shippingSameAsCustomer ? undefined : input.shippingName,
      phone: input.shippingSameAsCustomer ? undefined : input.shippingPhone,
      postalCode: input.shippingSameAsCustomer ? undefined : input.shippingPostalCode,
      prefecture: input.shippingSameAsCustomer ? undefined : input.shippingPrefecture,
      city: input.shippingSameAsCustomer ? undefined : input.shippingCity,
      addressLine: input.shippingSameAsCustomer ? undefined : input.shippingAddressLine,
      desiredDate: input.shippingDesiredDate || undefined,
      desiredTimeSlot: input.shippingDesiredTimeSlot || undefined,
      note: input.shippingNote || undefined,
    },
    gift: {
      noshi: input.giftNoshi,
      nameEntry: input.giftNoshi ? input.giftNameEntry : undefined,
    },
    items: pricing.items,
    shippingFeeJPY: pricing.shippingFeeJPY,
    totalJPY: pricing.totalJPY,
    consents: {
      privacy: input.consentPrivacy,
      orderContent: input.consentOrderContent,
      cancellationPolicy: input.consentCancellationPolicy,
    },
    source: "HEBEREST-web",
  };
}
```

- [ ] **Step 2: `src/lib/orders/store.ts`を作成する（暫定実装：コンソールログのみ、Task 10でApps Script実装に差し替える）**

```ts
import type { Order } from "@/lib/orders/types";

export interface OrderStore {
  saveOrder(order: Order): Promise<void>;
}

/**
 * 暫定実装。Task 10でApps Script Web App経由の実装（AppsScriptSheetStore）に差し替える。
 * インターフェース（saveOrder）は変更しないため、呼び出し側（Server Action）は無変更で済む。
 */
class ConsoleOrderStore implements OrderStore {
  async saveOrder(order: Order): Promise<void> {
    console.log("[orders] saveOrder (console stub)", {
      orderId: order.orderId,
      productId: order.items[0]?.productId,
      quantity: order.items[0]?.quantity,
      totalJPY: order.totalJPY,
    });
  }
}

export const orderStore: OrderStore = new ConsoleOrderStore();
```

- [ ] **Step 3: `src/lib/orders/notify.ts`を作成する（暫定実装：コンソールログのみ、Task 11でResend実装に差し替える）**

```ts
import type { Order } from "@/lib/orders/types";

export interface OrderNotifier {
  notifyOrder(order: Order): Promise<void>;
}

/**
 * 暫定実装。Task 11でResend経由の実装（ResendOrderNotifier）に差し替える。
 * インターフェース（notifyOrder）は変更しないため、呼び出し側（Server Action）は無変更で済む。
 */
class ConsoleOrderNotifier implements OrderNotifier {
  async notifyOrder(order: Order): Promise<void> {
    console.log("[orders] notifyOrder (console stub)", { orderId: order.orderId });
  }
}

export const orderNotifier: OrderNotifier = new ConsoleOrderNotifier();
```

- [ ] **Step 4: lintを実行する**

Run: `npm run lint`
Expected: エラーなく完了する

- [ ] **Step 5: buildを実行する**

Run: `npm run build`
Expected: `✓ Compiled successfully`

- [ ] **Step 6: コミット**

```bash
git add src/lib/orders/order.ts src/lib/orders/store.ts src/lib/orders/notify.ts
git commit -m "feat: add order builder and swappable store/notify adapters (console stub)"
```

---

### Task 7: Headerのナビリンク修正 ＋ 法定ページ（特定商取引法・プライバシーポリシー）新設

このタスクでは、購入フォームの同意チェックからリンクする2つの法定ページを新設する。あわせて、`Header.tsx`のナビゲーションリンクが`#story`のような相対アンカーになっており、トップページ以外（今回追加する`/order/*`や`/legal/*`）では正しく機能しない（現在のURLに`#story`が付くだけでトップページへ遷移しない）既存の問題を、新規ページを追加する前提として修正する。

**Files:**
- Modify: `src/components/Header.tsx`
- Modify: `src/components/Footer.tsx`
- Create: `src/app/legal/tokushoho/page.tsx`
- Create: `src/app/legal/privacy/page.tsx`

**Interfaces:**
- Consumes: なし
- Produces: `/legal/tokushoho`・`/legal/privacy`ページ（Task 8のフォーム同意欄・Task 9の完了画面からリンクされる）

- [ ] **Step 1: `Header.tsx`のナビリンクをトップページ相対から絶対パスに変更する**

`src/components/Header.tsx`の`navLinks`配列を以下に置き換える：

```tsx
const navLinks = [
  { href: "/#story", label: "ブランドストーリー" },
  { href: "/#features", label: "特徴" },
  { href: "/#producer", label: "生産者" },
  { href: "/#products", label: "商品一覧" },
  { href: "/#voices", label: "お客様の声" },
  { href: "/#faq", label: "よくある質問" },
];
```

同様に、`購入する`ボタンの`href="#products"`（2箇所）を`href="/#products"`に変更する。

- [ ] **Step 2: `Footer.tsx`の法定ページテキストをリンクに変更する**

`src/components/Footer.tsx`の以下の箇所：

```tsx
        <div className="text-sm leading-loose">
          <p>特定商取引法に基づく表記</p>
          <p>プライバシーポリシー</p>
```

を以下に置き換える：

```tsx
        <div className="text-sm leading-loose">
          <p>
            <a href="/legal/tokushoho" className="hover:text-white">
              特定商取引法に基づく表記
            </a>
          </p>
          <p>
            <a href="/legal/privacy" className="hover:text-white">
              プライバシーポリシー
            </a>
          </p>
```

- [ ] **Step 3: `src/app/legal/tokushoho/page.tsx`を作成する**

事業者の実データ（住所・電話番号・返品条件の正式文言）は未確定のため、汎用ひな形＋プレースホルダーとする。本番公開前にユーザーによる差し替えが必須であることをページ冒頭にも明記する。

```tsx
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const rows: { label: string; value: string }[] = [
  { label: "販売事業者", value: "【要確認：正式な事業者名をご記入ください】" },
  { label: "運営統括責任者", value: "【要確認】" },
  { label: "所在地", value: "【要確認：郵便番号・住所】" },
  { label: "電話番号", value: "【要確認：お問い合わせ対応可能な電話番号】" },
  { label: "メールアドレス", value: "【要確認】" },
  { label: "販売価格", value: "各商品ページに記載の金額（消費税込み）" },
  { label: "商品代金以外の必要料金", value: "送料は無料です。振込手数料はお客様負担となります。" },
  {
    label: "お支払い方法",
    value: "銀行振込（ご注文確定後、メールにてお振込先をご案内します）",
  },
  {
    label: "お支払い時期",
    value: "ご注文確定後、案内メール受領後1週間以内にお振込みください。",
  },
  {
    label: "商品の引き渡し時期",
    value: "ご入金確認後、収穫状況に応じて順次発送いたします。",
  },
  {
    label: "返品・交換について",
    value:
      "生鮮食品の性質上、お客様都合による返品・交換はお受けできません。商品に不備があった場合は、到着後7日以内にメールにてご連絡ください。",
  },
];

export default function TokushohoPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-32 sm:px-8">
        <span className="text-xs tracking-[0.4em] text-brand-green">LEGAL</span>
        <h1 className="mt-4 font-serif text-3xl text-brand-green-dark">
          特定商取引法に基づく表記
        </h1>
        <p className="mt-6 text-sm text-foreground/60">
          本ページは一般的なひな形です。「【要確認】」の箇所は本番公開前に正式な情報へ差し替えてください。
        </p>
        <dl className="mt-10 divide-y divide-brand-line border-t border-brand-line">
          {rows.map((row) => (
            <div key={row.label} className="grid gap-1 py-4 sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-brand-green-dark">{row.label}</dt>
              <dd className="text-sm leading-relaxed text-foreground/70 sm:col-span-2">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 4: `src/app/legal/privacy/page.tsx`を作成する**

```tsx
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-32 sm:px-8">
        <span className="text-xs tracking-[0.4em] text-brand-green">LEGAL</span>
        <h1 className="mt-4 font-serif text-3xl text-brand-green-dark">
          プライバシーポリシー
        </h1>
        <p className="mt-6 text-sm text-foreground/60">
          本ページは一般的なひな形です。事業者情報など「【要確認】」の箇所は本番公開前に正式な情報へ差し替えてください。
        </p>

        <div className="mt-10 space-y-8 text-sm leading-loose text-foreground/70">
          <section>
            <h2 className="font-serif text-lg text-brand-green-dark">
              1. 取得する情報
            </h2>
            <p className="mt-2">
              ご注文の際に、お名前・フリガナ・メールアドレス・電話番号・住所・配送先情報・のし/名入れのご希望・お支払い状況を取得します。
            </p>
          </section>
          <section>
            <h2 className="font-serif text-lg text-brand-green-dark">
              2. 利用目的
            </h2>
            <p className="mt-2">
              ご注文商品の発送、お支払いのご案内、お問い合わせへの対応、ご注文内容の確認以外の目的には利用しません。
            </p>
          </section>
          <section>
            <h2 className="font-serif text-lg text-brand-green-dark">
              3. 第三者提供
            </h2>
            <p className="mt-2">
              法令に基づく場合を除き、ご本人の同意なく取得した情報を第三者へ提供することはありません。配送のため、配送事業者へ必要な範囲の情報を共有する場合があります。
            </p>
          </section>
          <section>
            <h2 className="font-serif text-lg text-brand-green-dark">
              4. 保管方法
            </h2>
            <p className="mt-2">
              取得した情報は、社内で管理するスプレッドシートにて厳重に保管し、アクセスできる担当者を限定します。
            </p>
          </section>
          <section>
            <h2 className="font-serif text-lg text-brand-green-dark">
              5. お問い合わせ窓口
            </h2>
            <p className="mt-2">【要確認：お問い合わせ用メールアドレスをご記入ください】</p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 5: lintを実行する**

Run: `npm run lint`
Expected: エラーなく完了する

- [ ] **Step 6: buildを実行する**

Run: `npm run build`
Expected: `✓ Compiled successfully`。ルート一覧に`/legal/tokushoho`・`/legal/privacy`が追加される

- [ ] **Step 7: コミット**

```bash
git add src/components/Header.tsx src/components/Footer.tsx src/app/legal
git commit -m "feat: fix header nav links for non-home pages and add legal pages"
```

---

### Task 8: 注文フォームUI・入力バリデーション・確認画面・Server Action（①②③）

このタスクで`/order/[productId]`の入力ステップ・確認ステップ・Server Action（BotID・レート制限・Zod再検証・冪等性・金額再計算）を一体で実装する。確認画面は入力ステップと同じフォーム状態を共有するため独立してレビューできず、バリデーションは確認画面へ進む条件そのものであるため、ユーザー指定の①②③をまとめて1タスクとする。この時点では`store.ts`・`notify.ts`はTask 6のConsole実装のままでよい（Task 10・11で実体化する）。

**Files:**
- Create: `src/app/order/[productId]/page.tsx`
- Create: `src/app/order/[productId]/OrderForm.tsx`
- Create: `src/app/order/[productId]/actions.ts`
- Create: `src/instrumentation-client.ts`
- Modify: `src/components/Products.tsx`（CTAを`/order/[productId]`へ変更し、メルカリ導線を補助リンクとして残す）
- Modify: `package.json`（`botid` `@vercel/firewall`依存追加）

**Interfaces:**
- Consumes: `PRODUCTS` `isProductId`（`@/lib/products`）、`getAvailableShipDates`（`@/lib/orders/shipping-calendar`）、`orderFormSchema` `OrderFormFieldErrors`（`@/lib/orders/schema`）、`priceOrder`（`@/lib/orders/pricing`）、`buildOrder`（`@/lib/orders/order`）、`orderStore` `orderNotifier`（`@/lib/orders/store`, `@/lib/orders/notify`）
- Produces: `submitOrder(productId: string, prevState: SubmitOrderState, formData: FormData): Promise<SubmitOrderState>`、`initialSubmitOrderState`（Task 9の完了画面へのリダイレクト先として`/order/complete?orderId=...`を使用）

- [ ] **Step 1: `botid`と`@vercel/firewall`を依存関係に追加する**

Run: `npm install botid @vercel/firewall`
Expected: `package.json`の`dependencies`に両方が追加される

- [ ] **Step 2: `src/instrumentation-client.ts`を作成し、BotIDのクライアント側保護対象を登録する**

BotIDはブラウザ側で`initBotId`により保護対象パスを登録して初めて、`checkBotId()`がサーバー側で正しく分類できる（登録なしでは常に許可寄りの判定になる）。

```ts
import { initBotId } from "botid/client/core";

initBotId({
  protect: [
    {
      path: "/order/*",
      method: "POST",
    },
  ],
});
```

- [ ] **Step 3: `src/app/order/[productId]/actions.ts`を作成する**

```ts
"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkBotId } from "botid/server";
import { checkRateLimit } from "@vercel/firewall";
import { isProductId } from "@/lib/products";
import { orderFormSchema, type OrderFormFieldErrors } from "@/lib/orders/schema";
import { buildOrder } from "@/lib/orders/order";
import { orderStore } from "@/lib/orders/store";
import { orderNotifier } from "@/lib/orders/notify";

export interface SubmitOrderState {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: OrderFormFieldErrors;
}

export const initialSubmitOrderState: SubmitOrderState = { status: "idle" };

export async function submitOrder(
  productId: string,
  _prevState: SubmitOrderState,
  formData: FormData
): Promise<SubmitOrderState> {
  const { isBot } = await checkBotId();
  if (isBot) {
    return {
      status: "error",
      message: "送信を確認できませんでした。時間をおいて再度お試しください。",
    };
  }

  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost";
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  const syntheticRequest = new Request(`${proto}://${host}/order/${productId}`, {
    headers: headerList,
  });
  const { rateLimited } = await checkRateLimit("submit-order", {
    request: syntheticRequest,
  });
  if (rateLimited) {
    return {
      status: "error",
      message: "リクエストが多すぎます。しばらくしてから再度お試しください。",
    };
  }

  if (!isProductId(productId)) {
    return { status: "error", message: "商品情報が正しくありません。" };
  }

  const raw = {
    ...Object.fromEntries(formData),
    productId,
    shippingSameAsCustomer: formData.get("shippingSameAsCustomer") === "on",
    giftNoshi: formData.get("giftNoshi") === "on",
    consentPrivacy: formData.get("consentPrivacy") === "on",
    consentOrderContent: formData.get("consentOrderContent") === "on",
    consentCancellationPolicy: formData.get("consentCancellationPolicy") === "on",
  };

  const parsed = orderFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: "入力内容をご確認ください。",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const order = buildOrder(parsed.data);

  try {
    await orderStore.saveOrder(order);
  } catch {
    console.error("[orders] saveOrder failed", { orderId: order.orderId });
    return {
      status: "error",
      message: "送信に失敗しました。時間をおいて再度お試しください。",
    };
  }

  await orderNotifier.notifyOrder(order);

  redirect(`/order/complete?orderId=${encodeURIComponent(order.orderId)}`);
}
```

- [ ] **Step 4: `src/app/order/[productId]/OrderForm.tsx`を作成する**

```tsx
"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { z } from "zod";
import type { Product } from "@/lib/products";
import { orderFormSchema } from "@/lib/orders/schema";
import { priceOrder } from "@/lib/orders/pricing";
import { submitOrder, initialSubmitOrderState } from "./actions";

function formatJPY(value: number): string {
  return `¥${value.toLocaleString("ja-JP")}`;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-brand-green-dark px-8 py-4 text-sm tracking-wider text-white transition-colors hover:bg-brand-green disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "送信中…" : "注文を確定する"}
    </button>
  );
}

function TextField({
  name,
  label,
  type = "text",
  error,
}: {
  name: string;
  label: string;
  type?: string;
  error?: string;
}) {
  return (
    <label className="block text-sm text-foreground/80">
      {label}
      <input
        type={type}
        name={name}
        className="mt-1 block w-full rounded-lg border border-brand-line px-3 py-2 text-foreground"
      />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

function ConsentCheckbox({
  name,
  label,
  href,
  error,
}: {
  name: string;
  label: string;
  href?: string;
  error?: string;
}) {
  return (
    <div>
      <label className="flex items-start gap-2 text-sm text-foreground/80">
        <input type="checkbox" name={name} className="mt-1" />
        <span>
          {label}
          {href && (
            <a href={href} target="_blank" rel="noopener noreferrer" className="ml-1 underline">
              （詳細）
            </a>
          )}
        </span>
      </label>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </div>
  );
}

export function OrderForm({
  product,
  availableShipDates,
}: {
  product: Product;
  availableShipDates: string[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState<"input" | "confirm">("input");
  const [quantity, setQuantity] = useState(1);
  const [sameAsCustomer, setSameAsCustomer] = useState(true);
  const [giftNoshi, setGiftNoshi] = useState(false);
  const [inputErrors, setInputErrors] = useState<Record<string, string>>({});

  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);
  const submitOrderWithProduct = useMemo(() => submitOrder.bind(null, product.id), [product.id]);
  const [state, formAction] = useActionState(submitOrderWithProduct, initialSubmitOrderState);

  const pricing = useMemo(() => priceOrder(product.id, quantity), [product.id, quantity]);

  function handleProceedToConfirm() {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const raw = {
      ...Object.fromEntries(formData),
      productId: product.id,
      shippingSameAsCustomer: formData.get("shippingSameAsCustomer") === "on",
      giftNoshi: formData.get("giftNoshi") === "on",
      consentPrivacy: formData.get("consentPrivacy") === "on",
      consentOrderContent: formData.get("consentOrderContent") === "on",
      consentCancellationPolicy: formData.get("consentCancellationPolicy") === "on",
    };

    const parsed = orderFormSchema.safeParse(raw);
    if (!parsed.success) {
      const flat = z.flattenError(parsed.error).fieldErrors as Record<string, string[] | undefined>;
      const firstErrors: Record<string, string> = {};
      for (const key of Object.keys(flat)) {
        const messages = flat[key];
        if (messages && messages[0]) firstErrors[key] = messages[0];
      }
      setInputErrors(firstErrors);
      return;
    }

    setInputErrors({});
    setStep("confirm");
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-10">
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

      <section>
        <span className="text-xs tracking-[0.4em] text-brand-green">ORDER</span>
        <h1 className="mt-4 font-serif text-3xl text-brand-green-dark sm:text-4xl">
          {product.name}
        </h1>
        <p className="mt-2 text-sm text-foreground/60">{product.description}</p>
      </section>

      <div hidden={step !== "input"} className="space-y-10">
        <fieldset className="space-y-4">
          <legend className="font-serif text-lg text-brand-green-dark">ご注文内容</legend>
          <label className="block text-sm text-foreground/80">
            数量
            <select
              name="quantity"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="mt-1 block w-32 rounded-lg border border-brand-line px-3 py-2"
            >
              {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm text-foreground/70">
            小計: {formatJPY(pricing.items[0].subtotalJPY)}（送料無料）
          </p>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-serif text-lg text-brand-green-dark">ご注文者情報</legend>
          <TextField name="customerName" label="お名前" error={inputErrors.customerName} />
          <TextField name="customerNameKana" label="フリガナ" error={inputErrors.customerNameKana} />
          <TextField name="customerEmail" label="メールアドレス" type="email" error={inputErrors.customerEmail} />
          <TextField name="customerPhone" label="電話番号" error={inputErrors.customerPhone} />
          <TextField name="customerPostalCode" label="郵便番号" error={inputErrors.customerPostalCode} />
          <TextField name="customerPrefecture" label="都道府県" error={inputErrors.customerPrefecture} />
          <TextField name="customerCity" label="市区町村" error={inputErrors.customerCity} />
          <TextField name="customerAddressLine" label="番地・建物名" error={inputErrors.customerAddressLine} />
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-serif text-lg text-brand-green-dark">配送先情報</legend>
          <label className="flex items-center gap-2 text-sm text-foreground/80">
            <input
              type="checkbox"
              name="shippingSameAsCustomer"
              checked={sameAsCustomer}
              onChange={(e) => setSameAsCustomer(e.target.checked)}
            />
            注文者と配送先は同じ
          </label>

          <div hidden={sameAsCustomer} className="space-y-4">
            <TextField name="shippingName" label="配送先氏名" error={inputErrors.shippingName} />
            <TextField name="shippingPhone" label="配送先電話番号" error={inputErrors.shippingPhone} />
            <TextField name="shippingPostalCode" label="配送先郵便番号" error={inputErrors.shippingPostalCode} />
            <TextField name="shippingPrefecture" label="配送先都道府県" error={inputErrors.shippingPrefecture} />
            <TextField name="shippingCity" label="配送先市区町村" error={inputErrors.shippingCity} />
            <TextField name="shippingAddressLine" label="配送先番地・建物名" error={inputErrors.shippingAddressLine} />
          </div>

          <label className="block text-sm text-foreground/80">
            配送希望日（任意）
            <select
              name="shippingDesiredDate"
              className="mt-1 block w-full rounded-lg border border-brand-line px-3 py-2"
            >
              <option value="">指定なし</option>
              {availableShipDates.map((date) => (
                <option key={date} value={date}>
                  {date}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-foreground/80">
            配送希望時間帯（任意）
            <select
              name="shippingDesiredTimeSlot"
              className="mt-1 block w-full rounded-lg border border-brand-line px-3 py-2"
            >
              <option value="">指定なし</option>
              <option value="morning">午前中</option>
              <option value="12-14">12:00〜14:00</option>
              <option value="14-16">14:00〜16:00</option>
              <option value="16-18">16:00〜18:00</option>
              <option value="18-20">18:00〜20:00</option>
              <option value="19-21">19:00〜21:00</option>
            </select>
          </label>

          <label className="block text-sm text-foreground/80">
            備考（任意）
            <textarea
              name="shippingNote"
              rows={3}
              className="mt-1 block w-full rounded-lg border border-brand-line px-3 py-2"
            />
          </label>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-serif text-lg text-brand-green-dark">のし・名入れ</legend>
          <label className="flex items-center gap-2 text-sm text-foreground/80">
            <input
              type="checkbox"
              name="giftNoshi"
              checked={giftNoshi}
              onChange={(e) => setGiftNoshi(e.target.checked)}
            />
            のしをつける
          </label>
          <div hidden={!giftNoshi}>
            <TextField name="giftNameEntry" label="名入れ（20文字まで）" error={inputErrors.giftNameEntry} />
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="font-serif text-lg text-brand-green-dark">ご確認事項</legend>
          <ConsentCheckbox
            name="consentPrivacy"
            label="プライバシーポリシーに同意する"
            href="/legal/privacy"
            error={inputErrors.consentPrivacy}
          />
          <ConsentCheckbox
            name="consentOrderContent"
            label="注文内容（商品・金額）を確認した"
            error={inputErrors.consentOrderContent}
          />
          <ConsentCheckbox
            name="consentCancellationPolicy"
            label="キャンセル・返品条件（特定商取引法に基づく表記）に同意する"
            href="/legal/tokushoho"
            error={inputErrors.consentCancellationPolicy}
          />
        </fieldset>

        <button
          type="button"
          onClick={handleProceedToConfirm}
          className="w-full rounded-full border border-brand-green-dark px-8 py-4 text-sm tracking-wider text-brand-green-dark transition-colors hover:bg-brand-green-dark hover:text-white"
        >
          確認画面へ
        </button>
      </div>

      <div hidden={step !== "confirm"} className="space-y-6">
        <h2 className="font-serif text-xl text-brand-green-dark">ご注文内容の確認</h2>
        <dl className="space-y-2 text-sm text-foreground/70">
          <div className="flex justify-between">
            <dt>商品</dt>
            <dd>
              {product.name}（{product.variantLabel}） × {quantity}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>小計</dt>
            <dd>{formatJPY(pricing.items[0].subtotalJPY)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>送料</dt>
            <dd>{formatJPY(pricing.shippingFeeJPY)}</dd>
          </div>
          <div className="flex justify-between font-medium text-brand-green-dark">
            <dt>合計</dt>
            <dd>{formatJPY(pricing.totalJPY)}</dd>
          </div>
        </dl>

        <p className="text-xs text-foreground/50">
          ご注文確定後、お支払い方法（銀行振込等）を追ってメールでご案内します。
        </p>

        {state.status === "error" && (
          <p role="alert" className="text-sm text-red-600">
            {state.message}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row-reverse">
          <SubmitButton />
          <button
            type="button"
            onClick={() => setStep("input")}
            className="w-full rounded-full border border-brand-line px-8 py-4 text-sm tracking-wider text-foreground/70 transition-colors hover:bg-brand-line/30"
          >
            入力画面に戻る
          </button>
        </div>
      </div>
    </form>
  );
}
```

- [ ] **Step 5: `src/app/order/[productId]/page.tsx`を作成する**

```tsx
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { isProductId, PRODUCTS } from "@/lib/products";
import { getAvailableShipDates } from "@/lib/orders/shipping-calendar";
import { OrderForm } from "./OrderForm";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  if (!isProductId(productId)) {
    notFound();
  }

  const product = PRODUCTS[productId];
  const availableShipDates = getAvailableShipDates(new Date(), 30);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-32 sm:px-8">
        <OrderForm product={product} availableShipDates={availableShipDates} />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 6: `Products.tsx`のCTAを`/order/[productId]`へ変更し、メルカリ導線を補助リンクにする**

Task 1で作成した以下のブロック（注文可能商品のCTA部分）：

```tsx
              <div className="mt-6 flex flex-col gap-3">
                <span className="text-sm font-medium text-brand-green-dark">
                  {formatPriceLabel(p.unitPriceJPY)}
                </span>
                <a
                  href={p.mercariHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-full bg-brand-green-dark px-4 py-2 text-xs text-white transition-colors hover:bg-brand-green"
                >
                  購入する
                </a>
              </div>
```

を以下に置き換える（`Link`のimportを`src/components/Products.tsx`の先頭に追加すること）：

```tsx
              <div className="mt-6 flex flex-col gap-3">
                <span className="text-sm font-medium text-brand-green-dark">
                  {formatPriceLabel(p.unitPriceJPY)}
                </span>
                <Link
                  href={`/order/${p.id}`}
                  className="inline-flex w-full items-center justify-center rounded-full bg-brand-green-dark px-4 py-2 text-xs text-white transition-colors hover:bg-brand-green"
                >
                  購入する
                </Link>
                <a
                  href={p.mercariHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center text-[11px] text-foreground/40 underline"
                >
                  メルカリShopsでも購入いただけます
                </a>
              </div>
```

`import Image from "next/image";`の下に`import Link from "next/link";`を追加する。

- [ ] **Step 7: lintを実行する**

Run: `npm run lint`
Expected: エラーなく完了する

- [ ] **Step 8: buildを実行する**

Run: `npm run build`
Expected: `✓ Compiled successfully`。ルート一覧に`/order/[productId]`が追加される

- [ ] **Step 9: 開発サーバーで入力→確認画面の導線を手動確認する**

Run: `npm run dev`

ブラウザ（またはchromium-cli等）で`http://localhost:3000/order/1kg`を開き、以下を確認する：
- 未入力のまま「確認画面へ」を押すとエラーメッセージが各項目に表示される
- 必須項目を入力すると確認画面へ切り替わり、数量に応じた小計・合計が表示される
- 「入力画面に戻る」で入力内容が消えずに残っている
- 「注文を確定する」を押すとコンソールに`[orders] saveOrder (console stub)`のログが出る（この時点では実際の保存・通知は行われない）
- `http://localhost:3000/order/does-not-exist`が404になる

確認後、開発サーバーを停止する。

- [ ] **Step 10: コミット**

```bash
git add package.json package-lock.json src/app/order src/instrumentation-client.ts src/components/Products.tsx
git commit -m "feat: add order form UI, validation, confirm step and server action"
```

---

### Task 9: 完了画面（④）

**Files:**
- Create: `src/app/order/complete/page.tsx`

**Interfaces:**
- Consumes: なし（`searchParams`から`orderId`を読むのみ）
- Produces: `/order/complete?orderId=...`ページ（Task 8のServer Actionからredirectされる）

- [ ] **Step 1: `src/app/order/complete/page.tsx`を作成する**

```tsx
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const relatedLinks: { label: string; href: string }[] = [
  { label: "ブランドストーリーを読む", href: "/#story" },
  { label: "生産者の想いを知る", href: "/#producer" },
];

export default async function OrderCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;

  return (
    <>
      <Header />
      <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-24 text-center sm:px-8">
        <span className="text-xs tracking-[0.4em] text-brand-green">THANK YOU</span>
        <h1 className="mt-4 font-serif text-3xl text-brand-green-dark sm:text-4xl">
          ご注文ありがとうございます
        </h1>
        {orderId && (
          <p className="mt-6 text-sm text-foreground/70">
            注文番号: <span className="font-medium text-brand-green-dark">{orderId}</span>
          </p>
        )}
        <p className="mt-4 max-w-md text-sm leading-loose text-foreground/70">
          お支払い方法（銀行振込等）は、追ってメールにてご案内いたします。今しばらくお待ちください。
        </p>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row">
          {relatedLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-brand-green-dark px-6 py-3 text-sm tracking-wide text-brand-green-dark transition-colors hover:bg-brand-green-dark hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: lintを実行する**

Run: `npm run lint`
Expected: エラーなく完了する

- [ ] **Step 3: buildを実行する**

Run: `npm run build`
Expected: `✓ Compiled successfully`

- [ ] **Step 4: 開発サーバーで一連の導線を確認する**

Run: `npm run dev`

`http://localhost:3000/order/1kg`から入力→確認→送信まで行い、`/order/complete?orderId=HBR-...`へ遷移すること、注文番号とブランド導線（ブランドストーリー・生産者）のリンクが表示され、クリックするとトップページの該当セクションへ遷移することを確認する。確認後、開発サーバーを停止する。

- [ ] **Step 5: コミット**

```bash
git add src/app/order/complete
git commit -m "feat: add order complete page with brand experience links"
```

---

### Task 10: Googleスプレッドシート保存の実体化（⑤、Apps Script Web App）

**Files:**
- Modify: `src/lib/orders/store.ts`（`ConsoleOrderStore`を`AppsScriptSheetStore`に差し替え）
- Create: `docs/superpowers/apps-script/order-sheet-webapp.gs`
- Create: `.env.local.example`
- Modify: `.gitignore`（`.env*`の除外ルールに対する例外を追加し、`.env.local.example`だけはコミットできるようにする）

**Interfaces:**
- Consumes: `Order`（`@/lib/orders/types`）、環境変数`SHEETS_WEBAPP_URL` `SHEETS_WEBAPP_TOKEN`
- Produces: `OrderStore`インターフェースは変更なし。`saveOrder`はApps Script Web AppへPOSTする

- [ ] **Step 1: `docs/superpowers/apps-script/order-sheet-webapp.gs`を作成する**

```javascript
// Google Apps Script: 注文管理用スプレッドシートにバインドして使用する。
//
// セットアップ手順:
// 1. 新規Googleスプレッドシートを作成する
// 2. 拡張機能 > Apps Script を開き、このファイルの内容を貼り付ける
// 3. 左メニューの「プロジェクトの設定」>「スクリプト プロパティ」で
//    キー "SHEETS_WEBAPP_TOKEN" に十分に長いランダムな文字列（共有シークレット）を設定する
// 4. 「デプロイ」>「新しいデプロイ」を選択し、種類を「ウェブアプリ」に設定する
//    - 実行ユーザー: 自分
//    - アクセスできるユーザー: 全員
// 5. デプロイ後に発行されるウェブアプリURLを SHEETS_WEBAPP_URL として、
//    手順3で設定したトークンを SHEETS_WEBAPP_TOKEN として、
//    Vercelプロジェクトの環境変数に設定する

const SHEET_NAME = "注文";

const HEADER_ROW = [
  "orderId",
  "idempotencyKey",
  "createdAt",
  "status",
  "paymentStatus",
  "customerName",
  "customerNameKana",
  "customerEmail",
  "customerPhone",
  "customerPostalCode",
  "customerPrefecture",
  "customerCity",
  "customerAddressLine",
  "shippingSameAsCustomer",
  "shippingName",
  "shippingPhone",
  "shippingPostalCode",
  "shippingPrefecture",
  "shippingCity",
  "shippingAddressLine",
  "shippingDesiredDate",
  "shippingDesiredTimeSlot",
  "shippingNote",
  "giftNoshi",
  "giftNameEntry",
  "itemsSummary",
  "shippingFeeJPY",
  "totalJPY",
  "consentPrivacy",
  "consentOrderContent",
  "consentCancellationPolicy",
  "source",
];

const IDEMPOTENCY_KEY_COLUMN_INDEX = 1; // HEADER_ROWの2列目（0始まり）

function getOrCreateSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER_ROW);
  }
  return sheet;
}

function findExistingOrderIdByIdempotencyKey_(sheet, idempotencyKey) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  const values = sheet
    .getRange(2, 1, lastRow - 1, HEADER_ROW.length)
    .getValues();
  for (let i = 0; i < values.length; i++) {
    if (values[i][IDEMPOTENCY_KEY_COLUMN_INDEX] === idempotencyKey) {
      return values[i][0];
    }
  }
  return null;
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const expectedToken = PropertiesService.getScriptProperties().getProperty(
      "SHEETS_WEBAPP_TOKEN"
    );

    if (!expectedToken || body.token !== expectedToken) {
      return ContentService.createTextOutput(
        JSON.stringify({ ok: false, error: "unauthorized" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const order = body.order;
    const sheet = getOrCreateSheet_();

    const existingOrderId = findExistingOrderIdByIdempotencyKey_(sheet, order.idempotencyKey);
    if (existingOrderId) {
      return ContentService.createTextOutput(
        JSON.stringify({ ok: true, orderId: existingOrderId, duplicate: true })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const itemsSummary = order.items
      .map(function (item) {
        return item.name + "(" + item.variantLabel + ") x" + item.quantity;
      })
      .join(", ");

    sheet.appendRow([
      order.orderId,
      order.idempotencyKey,
      order.createdAt,
      order.status,
      order.paymentStatus,
      order.customer.name,
      order.customer.nameKana,
      order.customer.email,
      order.customer.phone,
      order.customer.postalCode,
      order.customer.prefecture,
      order.customer.city,
      order.customer.addressLine,
      order.shipping.sameAsCustomer,
      order.shipping.name || "",
      order.shipping.phone || "",
      order.shipping.postalCode || "",
      order.shipping.prefecture || "",
      order.shipping.city || "",
      order.shipping.addressLine || "",
      order.shipping.desiredDate || "",
      order.shipping.desiredTimeSlot || "",
      order.shipping.note || "",
      order.gift.noshi,
      order.gift.nameEntry || "",
      itemsSummary,
      order.shippingFeeJPY,
      order.totalJPY,
      order.consents.privacy,
      order.consents.orderContent,
      order.consents.cancellationPolicy,
      order.source,
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true, orderId: order.orderId })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(error) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
```

- [ ] **Step 2: `.gitignore`に`.env.local.example`の例外を追加する**

`.gitignore`の以下の行：

```
# env files (can opt-in for committing if needed)
.env*
```

を以下に置き換える（`.env*`はそのままだと`.env.local.example`自体も除外してしまうため、例外を明示する）：

```
# env files (can opt-in for committing if needed)
.env*
!.env.local.example
```

- [ ] **Step 3: `.env.local.example`を作成する**

```bash
# Google Apps Script Web App（docs/superpowers/apps-script/order-sheet-webapp.gs をデプロイして取得）
SHEETS_WEBAPP_URL=
SHEETS_WEBAPP_TOKEN=

# Resend（Task 11で使用。未設定でも通知をスキップして動作する）
RESEND_API_KEY=
RESEND_FROM_EMAIL=
ORDER_NOTIFY_TO=
```

- [ ] **Step 4: `src/lib/orders/store.ts`の実装を`AppsScriptSheetStore`に差し替える**

```ts
import type { Order } from "@/lib/orders/types";

export interface OrderStore {
  saveOrder(order: Order): Promise<void>;
}

/**
 * Google Apps Script Web App（docs/superpowers/apps-script/order-sheet-webapp.gs）経由で
 * スプレッドシートに保存するアダプター。将来Maruhe OS APIに差し替える場合はこのクラスの
 * 中身のみを変更し、OrderStoreインターフェースと呼び出し側は変更しない。
 */
class AppsScriptSheetStore implements OrderStore {
  async saveOrder(order: Order): Promise<void> {
    const url = process.env.SHEETS_WEBAPP_URL;
    const token = process.env.SHEETS_WEBAPP_TOKEN;

    if (!url || !token) {
      console.error(
        "[orders] SHEETS_WEBAPP_URL/SHEETS_WEBAPP_TOKEN is not configured; order was not saved",
        { orderId: order.orderId }
      );
      throw new Error("Sheets Web App is not configured");
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, order }),
    });

    if (!res.ok) {
      console.error("[orders] failed to save order to Sheets", {
        orderId: order.orderId,
        status: res.status,
      });
      throw new Error("注文の保存に失敗しました");
    }
  }
}

export const orderStore: OrderStore = new AppsScriptSheetStore();
```

- [ ] **Step 5: lintを実行する**

Run: `npm run lint`
Expected: エラーなく完了する

- [ ] **Step 6: buildを実行する**

Run: `npm run build`
Expected: `✓ Compiled successfully`

- [ ] **Step 7: （ユーザー作業）Apps Scriptをデプロイし、動作確認する**

ユーザー自身が以下を行う（コードからは自動化できない）：
1. `docs/superpowers/apps-script/order-sheet-webapp.gs`の手順に従いGoogleスプレッドシートとApps Scriptをセットアップ・デプロイする
2. 発行されたURLとトークンを`.env.local`（`.env.local.example`をコピーして作成、Gitにコミットしない）に設定する
3. `npm run dev`で`/order/1kg`から実際に注文を送信し、スプレッドシートに1行追加されることを確認する
4. 同じ`idempotencyKey`で再送信した場合に行が重複しないことを確認する（例: ブラウザの戻る操作＋再送信、またはネットワークタブから同一リクエストを再送）

- [ ] **Step 8: コミット**

```bash
git add src/lib/orders/store.ts docs/superpowers/apps-script .env.local.example .gitignore
git commit -m "feat: save orders to Google Sheets via Apps Script web app"
```

---

### Task 11: メール通知の実体化（⑥、Resend）

**Files:**
- Modify: `src/lib/orders/notify.ts`（`ConsoleOrderNotifier`を`ResendOrderNotifier`に差し替え）
- Modify: `package.json`（`resend`依存追加）

**Interfaces:**
- Consumes: `Order`（`@/lib/orders/types`）、環境変数`RESEND_API_KEY` `RESEND_FROM_EMAIL` `ORDER_NOTIFY_TO`
- Produces: `OrderNotifier`インターフェースは変更なし

- [ ] **Step 1: `resend`を依存関係に追加する**

Run: `npm install resend`
Expected: `package.json`の`dependencies`に`"resend"`が追加される

- [ ] **Step 2: `src/lib/orders/notify.ts`の実装を`ResendOrderNotifier`に差し替える**

```ts
import { Resend } from "resend";
import type { Order } from "@/lib/orders/types";

export interface OrderNotifier {
  notifyOrder(order: Order): Promise<void>;
}

/**
 * Resend経由で管理者へ注文通知メールを送るアダプター。送信失敗は注文の成否に影響させない
 * （ベストエフォート。実質的なデータの正はGoogleスプレッドシート側にある）。
 */
class ResendOrderNotifier implements OrderNotifier {
  async notifyOrder(order: Order): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    const to = process.env.ORDER_NOTIFY_TO;

    if (!apiKey || !from || !to) {
      console.warn(
        "[orders] RESEND_API_KEY/RESEND_FROM_EMAIL/ORDER_NOTIFY_TO is not configured; skipping notification",
        { orderId: order.orderId }
      );
      return;
    }

    const resend = new Resend(apiKey);
    const itemsSummary = order.items
      .map(
        (item) =>
          `${item.name}（${item.variantLabel}） x${item.quantity} = ¥${item.subtotalJPY.toLocaleString("ja-JP")}`
      )
      .join("\n");

    try {
      await resend.emails.send({
        from,
        to,
        subject: `【HEBEREST】新規注文 ${order.orderId}`,
        text: [
          `注文ID: ${order.orderId}`,
          `受付日時: ${order.createdAt}`,
          "",
          itemsSummary,
          "",
          `送料: ¥${order.shippingFeeJPY.toLocaleString("ja-JP")}`,
          `合計: ¥${order.totalJPY.toLocaleString("ja-JP")}`,
        ].join("\n"),
      });
    } catch {
      console.error("[orders] failed to send order notification email", {
        orderId: order.orderId,
      });
    }
  }
}

export const orderNotifier: OrderNotifier = new ResendOrderNotifier();
```

- [ ] **Step 3: lintを実行する**

Run: `npm run lint`
Expected: エラーなく完了する

- [ ] **Step 4: buildを実行する**

Run: `npm run build`
Expected: `✓ Compiled successfully`

- [ ] **Step 5: （ユーザー作業）Resendの実アドレスを設定し、動作確認する**

ユーザー自身が`.env.local`に`RESEND_API_KEY` `RESEND_FROM_EMAIL`（認証済みドメイン）`ORDER_NOTIFY_TO`（管理者受信先）を設定する。未設定のままでも注文自体は失敗しない（警告ログのみ）ことを確認する。設定後、`/order/1kg`から注文し、管理者宛にメールが届くことを確認する。

- [ ] **Step 6: コミット**

```bash
git add src/lib/orders/notify.ts package.json package-lock.json
git commit -m "feat: send order notification email via Resend"
```

---

### Task 12: 最終確認（lint・build・手動導線確認）

**Files:**
- なし（検証のみ）

**Interfaces:**
- Consumes: Task 1〜11で変更した全ファイル
- Produces: なし（Phase B-1の完了確認）

- [ ] **Step 1: lintを実行する**

Run: `npm run lint`
Expected: エラーなく完了する

- [ ] **Step 2: 本番ビルドを実行する**

Run: `npm run build`
Expected: `✓ Compiled successfully`、`✓ Generating static pages`まで完走する

- [ ] **Step 3: 開発サーバーで一連の導線をモバイルビューも含めて確認する**

Run: `npm run dev`

以下を確認する：
- トップページ`/`の「購入する」ボタン（Products.tsx内、4商品）から`/order/[productId]`へ遷移する
- 未入力送信時のエラー表示、配送先「同じ」チェックの切り替え、のし・名入れの表示切り替え
- 確認画面の金額表示（数量変更に応じて小計・合計が変わる）
- 実際の送信→`/order/complete`への遷移、注文番号表示、ブランド導線リンク
- `/legal/tokushoho`・`/legal/privacy`が表示され、Footerからリンクできる
- Headerの各ナビリンクが`/order/*`・`/legal/*`ページからでもトップページの該当セクションへ遷移する
- ブラウザの開発者ツールでモバイル幅（375px程度）に切り替え、レイアウト崩れがないことを確認する

確認後、開発サーバーを停止する。

- [ ] **Step 4: git statusで作業ツリーがクリーンであることを確認する**

Run: `git status`
Expected: `nothing to commit, working tree clean`（Task 1〜11のコミットのみが積まれている状態）

---

### Task 13: GitHubへPush（⑦）

**Files:**
- なし

**Interfaces:**
- Consumes: Task 1〜12の全コミット
- Produces: なし

- [ ] **Step 1: リモートとの差分を確認する**

Run: `git log origin/main..HEAD --oneline`
Expected: Task 1〜11のコミットが表示される

- [ ] **Step 2: GitHubへpushする**

Run: `git push origin main`
Expected: エラーなく`main`ブランチが更新される

---

### Task 14: Vercelへデプロイ（⑧）

**Files:**
- なし

**Interfaces:**
- Consumes: Task 13でpushされたコミット
- Produces: なし

このタスクの前提として、以下がユーザーにより完了していることを確認する（Task 10 Step 6・Task 11 Step 5参照）：
- Google Apps Script Web Appのデプロイ（`SHEETS_WEBAPP_URL` / `SHEETS_WEBAPP_TOKEN`）
- Resendの送信元・宛先の実アドレス（`RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `ORDER_NOTIFY_TO`）
- `/legal/tokushoho`の事業者情報・返品条件の正式文言への差し替え

- [ ] **Step 1: Vercelプロジェクトの環境変数を設定する（ユーザー作業）**

Vercelダッシュボードの対象プロジェクト > Settings > Environment Variablesに、`.env.local`に設定した5つの変数（`SHEETS_WEBAPP_URL` `SHEETS_WEBAPP_TOKEN` `RESEND_API_KEY` `RESEND_FROM_EMAIL` `ORDER_NOTIFY_TO`）をProduction環境に設定する。

- [ ] **Step 2: Vercel Firewallのレート制限ルールを作成する（ユーザー作業）**

Vercelダッシュボード > 対象プロジェクト > Firewall で、`@vercel/firewall`条件のカスタムルールを作成し、Rate limit IDを`submit-order`として保存・公開する（Task 8のServer Actionで使用しているIDと一致させる）。

- [ ] **Step 3: BotIDを有効化する（ユーザー作業）**

Vercelダッシュボード > 対象プロジェクト > Firewall > BotID を有効化する。

- [ ] **Step 4: デプロイする**

GitHubと連携済みのVercelプロジェクトであれば、Task 13のpushにより自動的にProductionデプロイが開始される。連携未設定の場合はユーザーがVercelダッシュボードから対象リポジトリ・ブランチを指定してインポートする。

- [ ] **Step 5: デプロイ結果を確認する**

Vercelのデプロイログで`✓ Compiled successfully`を確認し、発行された本番URLで`/order/1kg`から実際に1件テスト注文を行う。スプレッドシートへの保存・通知メールの受信・完了画面表示までを確認する。
