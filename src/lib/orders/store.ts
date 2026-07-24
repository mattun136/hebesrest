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
