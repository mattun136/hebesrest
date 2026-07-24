// Google Apps Script: 注文管理用スプレッドシートにバインドして使用する。
//
// セットアップ手順:
// 1. 新規Googleスプレッドシートを作成する
// 2. 拡張機能 > Apps Script を開き、このファイルの内容を貼り付ける
// 3. 左メニューの「プロジェクトの設定」>「スクリプト プロパティ」で
//    キー "SHEETS_WEBAPP_TOKEN" に十分に長いランダムな文字列（共有シークレット）を設定する
// 4. 「デプロイ」>「新しいデプロイ」を選択し、種類を「ウェブアプリ」に設定する
//    - 実行ユーザー: 自分
//    - アクセスできるユーザー: 全員
// 5. デプロイ後に発行されるウェブアプリURLを SHEETS_WEBAPP_URL として、
//    手順3で設定したトークンを SHEETS_WEBAPP_TOKEN として、
//    Vercelプロジェクトの環境変数に設定する

const SHEET_NAME = "注文";

const HEADER_ROW = [
  "orderId",
  "idempotencyKey",
  "createdAt",
  "status",
  "paymentStatus",
  "customerName",
  "customerNameKana",
  "customerEmail",
  "customerPhone",
  "customerPostalCode",
  "customerPrefecture",
  "customerCity",
  "customerAddressLine",
  "shippingSameAsCustomer",
  "shippingName",
  "shippingPhone",
  "shippingPostalCode",
  "shippingPrefecture",
  "shippingCity",
  "shippingAddressLine",
  "shippingDesiredDate",
  "shippingDesiredTimeSlot",
  "shippingNote",
  "giftNoshi",
  "giftNameEntry",
  "itemsSummary",
  "shippingFeeJPY",
  "totalJPY",
  "consentPrivacy",
  "consentOrderContent",
  "consentCancellationPolicy",
  "source",
];

const IDEMPOTENCY_KEY_COLUMN_INDEX = 1; // HEADER_ROWの2列目（0始まり）

function getOrCreateSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER_ROW);
  }
  return sheet;
}

function findExistingOrderIdByIdempotencyKey_(sheet, idempotencyKey) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  const values = sheet
    .getRange(2, 1, lastRow - 1, HEADER_ROW.length)
    .getValues();
  for (let i = 0; i < values.length; i++) {
    if (values[i][IDEMPOTENCY_KEY_COLUMN_INDEX] === idempotencyKey) {
      return values[i][0];
    }
  }
  return null;
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const expectedToken = PropertiesService.getScriptProperties().getProperty(
      "SHEETS_WEBAPP_TOKEN"
    );

    if (!expectedToken || body.token !== expectedToken) {
      return ContentService.createTextOutput(
        JSON.stringify({ ok: false, error: "unauthorized" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const order = body.order;
    const sheet = getOrCreateSheet_();

    const existingOrderId = findExistingOrderIdByIdempotencyKey_(sheet, order.idempotencyKey);
    if (existingOrderId) {
      return ContentService.createTextOutput(
        JSON.stringify({ ok: true, orderId: existingOrderId, duplicate: true })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const itemsSummary = order.items
      .map(function (item) {
        return item.name + "(" + item.variantLabel + ") x" + item.quantity;
      })
      .join(", ");

    sheet.appendRow([
      order.orderId,
      order.idempotencyKey,
      order.createdAt,
      order.status,
      order.paymentStatus,
      order.customer.name,
      order.customer.nameKana,
      order.customer.email,
      order.customer.phone,
      order.customer.postalCode,
      order.customer.prefecture,
      order.customer.city,
      order.customer.addressLine,
      order.shipping.sameAsCustomer,
      order.shipping.name || "",
      order.shipping.phone || "",
      order.shipping.postalCode || "",
      order.shipping.prefecture || "",
      order.shipping.city || "",
      order.shipping.addressLine || "",
      order.shipping.desiredDate || "",
      order.shipping.desiredTimeSlot || "",
      order.shipping.note || "",
      order.gift.noshi,
      order.gift.nameEntry || "",
      itemsSummary,
      order.shippingFeeJPY,
      order.totalJPY,
      order.consents.privacy,
      order.consents.orderContent,
      order.consents.cancellationPolicy,
      order.source,
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true, orderId: order.orderId })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(error) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
