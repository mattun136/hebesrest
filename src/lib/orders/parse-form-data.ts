/**
 * `<form>` から取得した `FormData` を、`orderFormSchema.safeParse` に渡す前の
 * 生オブジェクトへ変換する。クライアント側の事前チェック（OrderForm.tsx）と
 * サーバー側の正式なバリデーション（actions.ts）の両方から呼び出されるため、
 * "use server" や next/headers などサーバー専用の import を持ち込まないこと。
 */
export function parseOrderFormRaw(formData: FormData, productId: string): unknown {
  return {
    ...Object.fromEntries(formData),
    productId,
    shippingSameAsCustomer: formData.get("shippingSameAsCustomer") === "on",
    giftNoshi: formData.get("giftNoshi") === "on",
    consentPrivacy: formData.get("consentPrivacy") === "on",
    consentOrderContent: formData.get("consentOrderContent") === "on",
    consentCancellationPolicy: formData.get("consentCancellationPolicy") === "on",
  };
}
