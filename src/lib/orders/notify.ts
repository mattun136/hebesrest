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

/**
 * Resend経由でお客様宛の注文確認メールと、管理者宛の新規注文通知メールを送るアダプター。
 * 送信失敗は注文の成否に影響させない（ベストエフォート。実質的なデータの正はGoogleスプレッドシート側にある）。
 * お客様宛・管理者宛は互いに独立して失敗しても構わないよう、それぞれ個別にtry/catchする。
 */
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
      await resend.emails.send({
        from,
        to: order.customer.email,
        subject: "【HEBEREST】ご注文ありがとうございます",
        text: buildCustomerEmailText(order),
      });
    } catch {
      console.error("[orders] failed to send customer confirmation email", {
        orderId: order.orderId,
      });
    }

    if (!adminTo) {
      console.warn("[orders] ORDER_NOTIFY_TO is not configured; skipping admin notification", {
        orderId: order.orderId,
      });
      return;
    }

    try {
      await resend.emails.send({
        from,
        to: adminTo,
        subject: "【新規注文】",
        text: buildAdminEmailText(order),
      });
    } catch {
      console.error("[orders] failed to send admin notification email", {
        orderId: order.orderId,
      });
    }
  }
}

export const orderNotifier: OrderNotifier = new ResendOrderNotifier();
