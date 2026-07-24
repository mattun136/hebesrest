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
