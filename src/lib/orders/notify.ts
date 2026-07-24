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
