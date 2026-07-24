"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { z } from "zod";
import type { Product } from "@/lib/products";
import { orderFormSchema } from "@/lib/orders/schema";
import { priceOrder } from "@/lib/orders/pricing";
import { submitOrder } from "./actions";
import { initialSubmitOrderState } from "./order-form-state";

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
