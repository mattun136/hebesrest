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
