import type { Order } from "@/lib/orders/types";

export interface OrderStore {
  saveOrder(order: Order): Promise<void>;
}

/**
 * order-sheet-webapp.gs の doPost が常に返すJSONレスポンスの形。
 * Apps ScriptはdoPost内で発生した例外もcatchしてHTTP 200で返すため、
 * HTTPステータスだけでなくこの `ok` フィールドを必ず確認する必要がある。
 */
interface AppsScriptResponseBody {
  ok: boolean;
  orderId?: string;
  duplicate?: boolean;
  error?: string;
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

    // Apps Script側のdoPostは内部エラーや認証失敗でも常にHTTP 200を返すため、
    // HTTPステータスだけでなくレスポンスボディの`ok`フィールドを必ず確認する。
    let json: AppsScriptResponseBody;
    try {
      json = (await res.json()) as AppsScriptResponseBody;
    } catch (parseError) {
      console.error("[orders] failed to parse Sheets Web App response", {
        orderId: order.orderId,
        status: res.status,
        parseError: String(parseError),
      });
      throw new Error("注文の保存に失敗しました");
    }

    if (!json.ok) {
      console.error("[orders] Sheets Web App reported failure", {
        orderId: order.orderId,
        error: json.error,
      });
      throw new Error("注文の保存に失敗しました");
    }
  }
}

export const orderStore: OrderStore = new AppsScriptSheetStore();
