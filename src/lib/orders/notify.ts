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

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatOrderDateTime(isoString: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoString));
}

const TIME_SLOT_LABELS: Record<string, string> = {
  "": "指定なし",
  morning: "午前中",
  "12-14": "12:00〜14:00",
  "14-16": "14:00〜16:00",
  "16-18": "16:00〜18:00",
  "18-20": "18:00〜20:00",
  "19-21": "19:00〜21:00",
};

export function formatTimeSlot(value: string | undefined): string {
  const key = value ?? "";
  return TIME_SLOT_LABELS[key] ?? key;
}

export function resolveShippingAddress(order: Order): {
  name: string;
  phone: string;
  postalCode: string;
  prefecture: string;
  city: string;
  addressLine: string;
} {
  if (order.shipping.sameAsCustomer) {
    return {
      name: order.customer.name,
      phone: order.customer.phone,
      postalCode: order.customer.postalCode,
      prefecture: order.customer.prefecture,
      city: order.customer.city,
      addressLine: order.customer.addressLine,
    };
  }
  return {
    name: order.shipping.name ?? "",
    phone: order.shipping.phone ?? "",
    postalCode: order.shipping.postalCode ?? "",
    prefecture: order.shipping.prefecture ?? "",
    city: order.shipping.city ?? "",
    addressLine: order.shipping.addressLine ?? "",
  };
}

export function buildCustomerEmailText(order: Order): string {
  const shipping = resolveShippingAddress(order);
  const itemLines = order.items.map(
    (item) =>
      `　${item.name}（${item.variantLabel}） × ${item.quantity} = ¥${item.subtotalJPY.toLocaleString("ja-JP")}`
  );
  const giftLine = order.gift.noshi
    ? `のし: あり${order.gift.nameEntry ? `（名入れ: ${order.gift.nameEntry}）` : ""}`
    : "のし: なし";

  return [
    "--------------------------------",
    "",
    `${order.customer.name}様`,
    "",
    "この度はHEBERESTをご利用いただきありがとうございます。",
    "ご注文を受け付けましたので、内容をご確認ください。",
    "",
    "--------------------------------",
    "■ご注文情報",
    "--------------------------------",
    `注文番号: ${order.orderId}`,
    `注文日時: ${formatOrderDateTime(order.createdAt)}`,
    "",
    "ご注文商品:",
    ...itemLines,
    "",
    `合計金額: ¥${order.totalJPY.toLocaleString("ja-JP")}（送料込み）`,
    "",
    "--------------------------------",
    "■配送先情報",
    "--------------------------------",
    `お届け先: ${shipping.name}様`,
    `〒${shipping.postalCode} ${shipping.prefecture}${shipping.city}${shipping.addressLine}`,
    `電話番号: ${shipping.phone}`,
    `配送希望日: ${order.shipping.desiredDate || "指定なし"}`,
    `配送希望時間帯: ${formatTimeSlot(order.shipping.desiredTimeSlot)}`,
    "",
    "--------------------------------",
    "■のし・名入れ",
    "--------------------------------",
    giftLine,
    "",
    "--------------------------------",
    "■お支払いについて",
    "--------------------------------",
    "お支払い方法は銀行振込です。",
    "振込先および発送予定につきましては、",
    "改めて別のメールにてご案内いたします。",
    "",
    "ご注文内容に誤りがある場合や、",
    "ご不明な点がございましたら、",
    "お手数ですが本メールに返信の上ご連絡くださいませ。",
    "",
    "--------------------------------",
    "",
    "HEBEREST",
    SITE_URL,
    "",
    "--------------------------------",
  ].join("\n");
}

export function buildCustomerEmailHtml(order: Order): string {
  const shipping = resolveShippingAddress(order);
  const itemRows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #e5e5e0;">${escapeHtml(item.name)}（${escapeHtml(item.variantLabel)}） × ${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e5e5e0;text-align:right;white-space:nowrap;">¥${item.subtotalJPY.toLocaleString("ja-JP")}</td>
        </tr>`
    )
    .join("");
  const giftLine = order.gift.noshi
    ? `のし: あり${order.gift.nameEntry ? `（名入れ: ${escapeHtml(order.gift.nameEntry)}）` : ""}`
    : "のし: なし";

  return `
<!doctype html>
<html lang="ja">
  <body style="margin:0;padding:0;background-color:#f5f4f0;font-family:'Hiragino Sans','Yu Gothic',sans-serif;color:#1c2f21;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f4f0;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
            <tr>
              <td style="background-color:#1c2f21;padding:24px 32px;">
                <span style="color:#ffffff;font-size:12px;letter-spacing:0.3em;">HEBEREST</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 16px;">${escapeHtml(order.customer.name)}様</p>
                <p style="margin:0 0 24px;line-height:1.8;">
                  この度はHEBERESTをご利用いただきありがとうございます。<br />
                  ご注文を受け付けましたので、内容をご確認ください。
                </p>

                <h2 style="font-size:14px;color:#2f4a37;border-bottom:2px solid #2f4a37;padding-bottom:8px;">ご注文情報</h2>
                <p style="margin:8px 0;">注文番号: ${escapeHtml(order.orderId)}<br />注文日時: ${escapeHtml(formatOrderDateTime(order.createdAt))}</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 16px;font-size:14px;">
                  ${itemRows}
                  <tr>
                    <td style="padding:12px 0 0;font-weight:bold;">合計金額（送料込み）</td>
                    <td style="padding:12px 0 0;text-align:right;font-weight:bold;">¥${order.totalJPY.toLocaleString("ja-JP")}</td>
                  </tr>
                </table>

                <h2 style="font-size:14px;color:#2f4a37;border-bottom:2px solid #2f4a37;padding-bottom:8px;">配送先情報</h2>
                <p style="margin:8px 0;line-height:1.8;">
                  お届け先: ${escapeHtml(shipping.name)}様<br />
                  〒${escapeHtml(shipping.postalCode)} ${escapeHtml(shipping.prefecture)}${escapeHtml(shipping.city)}${escapeHtml(shipping.addressLine)}<br />
                  電話番号: ${escapeHtml(shipping.phone)}<br />
                  配送希望日: ${escapeHtml(order.shipping.desiredDate || "指定なし")}<br />
                  配送希望時間帯: ${escapeHtml(formatTimeSlot(order.shipping.desiredTimeSlot))}
                </p>

                <h2 style="font-size:14px;color:#2f4a37;border-bottom:2px solid #2f4a37;padding-bottom:8px;">のし・名入れ</h2>
                <p style="margin:8px 0;">${giftLine}</p>

                <h2 style="font-size:14px;color:#2f4a37;border-bottom:2px solid #2f4a37;padding-bottom:8px;">お支払いについて</h2>
                <p style="margin:8px 0;line-height:1.8;">
                  お支払い方法は銀行振込です。<br />
                  振込先および発送予定につきましては、改めて別のメールにてご案内いたします。
                </p>

                <p style="margin:24px 0 0;line-height:1.8;font-size:13px;color:#555;">
                  ご注文内容に誤りがある場合や、ご不明な点がございましたら、<br />
                  お手数ですが本メールに返信の上ご連絡くださいませ。
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#f5f4f0;padding:16px 32px;text-align:center;font-size:12px;color:#777;">
                HEBEREST ｜ <a href="${SITE_URL}" style="color:#2f4a37;">${SITE_URL}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
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
      const result = await resend.emails.send({
        from,
        to: order.customer.email,
        subject: "【HEBEREST】ご注文ありがとうございます",
        text: buildCustomerEmailText(order),
        html: buildCustomerEmailHtml(order),
      });
      if (result.error) {
        console.error("[orders] failed to send customer confirmation email", {
          orderId: order.orderId,
          error: result.error,
        });
      }
    } catch (error) {
      console.error("[orders] failed to send customer confirmation email", {
        orderId: order.orderId,
        error,
      });
    }

    if (!adminTo) {
      console.warn("[orders] ORDER_NOTIFY_TO is not configured; skipping admin notification", {
        orderId: order.orderId,
      });
      return;
    }

    try {
      const result = await resend.emails.send({
        from,
        to: adminTo,
        subject: "【新規注文】",
        text: buildAdminEmailText(order),
      });
      if (result.error) {
        console.error("[orders] failed to send admin notification email", {
          orderId: order.orderId,
          error: result.error,
        });
      }
    } catch (error) {
      console.error("[orders] failed to send admin notification email", {
        orderId: order.orderId,
        error,
      });
    }
  }
}

export const orderNotifier: OrderNotifier = new ResendOrderNotifier();
