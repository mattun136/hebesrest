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
