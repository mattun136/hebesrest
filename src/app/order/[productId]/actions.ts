"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkBotId } from "botid/server";
import { checkRateLimit } from "@vercel/firewall";
import { isProductId } from "@/lib/products";
import { orderFormSchema } from "@/lib/orders/schema";
import { buildOrder } from "@/lib/orders/order";
import { orderStore } from "@/lib/orders/store";
import { orderNotifier } from "@/lib/orders/notify";
import { parseOrderFormRaw } from "@/lib/orders/parse-form-data";
import type { SubmitOrderState } from "./order-form-state";

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

  const raw = parseOrderFormRaw(formData, productId);

  const parsed = orderFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: "入力内容をご確認ください。",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const order = buildOrder(parsed.data);

  let saveResult: { orderId: string; duplicate: boolean };
  try {
    saveResult = await orderStore.saveOrder(order);
  } catch {
    console.error("[orders] saveOrder failed", { orderId: order.orderId });
    return {
      status: "error",
      message: "送信に失敗しました。時間をおいて再度お試しください。",
    };
  }

  if (!saveResult.duplicate) {
    try {
      await orderNotifier.notifyOrder(order);
    } catch {
      console.error("[orders] notifyOrder failed", { orderId: order.orderId });
    }
  }

  redirect(`/order/complete?orderId=${encodeURIComponent(saveResult.orderId)}`);
}
