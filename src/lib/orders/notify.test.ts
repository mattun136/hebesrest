import { test } from "node:test";
import assert from "node:assert/strict";
import {
  escapeHtml,
  formatOrderDateTime,
  formatTimeSlot,
  resolveShippingAddress,
  buildCustomerEmailText,
  buildCustomerEmailHtml,
} from "./notify.ts";

import type { Order } from "./types.ts";

// ダミーのOrder オブジェクト（テスト用ベース）
const createMockOrder = (overrides?: Partial<Order>): Order => {
  const baseOrder: Order = {
    orderId: "ORD-20240101-001",
    idempotencyKey: "test-idem-key",
    createdAt: "2024-01-15T10:30:00Z",
    status: "received",
    paymentStatus: "pending",
    customer: {
      name: "山田太郎",
      nameKana: "やまだたろう",
      email: "customer@example.com",
      phone: "09012345678",
      postalCode: "100-0001",
      prefecture: "東京都",
      city: "千代田区",
      addressLine: "丸の内1-1-1",
    },
    shipping: {
      sameAsCustomer: true,
      desiredDate: "2024-01-20",
      desiredTimeSlot: "14-16",
    },
    gift: {
      noshi: true,
      nameEntry: "山田家",
    },
    items: [
      {
        productId: "prod-001",
        name: "商品A",
        variantLabel: "赤色Lサイズ",
        unitPriceJPY: 5000,
        quantity: 2,
        subtotalJPY: 10000,
      },
      {
        productId: "prod-002",
        name: "商品B",
        variantLabel: "青色M",
        unitPriceJPY: 3000,
        quantity: 1,
        subtotalJPY: 3000,
      },
    ],
    shippingFeeJPY: 1000,
    totalJPY: 14000,
    consents: {
      privacy: true,
      orderContent: true,
      cancellationPolicy: true,
    },
    source: "HEBEREST-web",
  };

  return { ...baseOrder, ...overrides };
};

test("escapeHtml - escapes ampersand", () => {
  assert.strictEqual(escapeHtml("foo & bar"), "foo &amp; bar");
});

test("escapeHtml - escapes less-than sign", () => {
  assert.strictEqual(escapeHtml("foo < bar"), "foo &lt; bar");
});

test("escapeHtml - escapes greater-than sign", () => {
  assert.strictEqual(escapeHtml("foo > bar"), "foo &gt; bar");
});

test("escapeHtml - escapes double quotes", () => {
  assert.strictEqual(escapeHtml('foo "bar" baz'), 'foo &quot;bar&quot; baz');
});

test("escapeHtml - escapes single quotes", () => {
  assert.strictEqual(escapeHtml("foo 'bar' baz"), "foo &#39;bar&#39; baz");
});

test("escapeHtml - escapes all special characters in one string", () => {
  assert.strictEqual(
    escapeHtml('<script>alert("XSS")</script>'),
    "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;"
  );
});

test("formatOrderDateTime - converts UTC ISO string to Tokyo time", () => {
  const result = formatOrderDateTime("2024-01-15T10:30:00Z");
  // The exact format depends on Intl.DateTimeFormat output, but should contain date/time
  assert.match(result, /2024年1月15日/);
  assert.match(result, /\d{2}:\d{2}/);
});

test("formatTimeSlot - returns label for empty string (no selection)", () => {
  assert.strictEqual(formatTimeSlot(""), "指定なし");
});

test("formatTimeSlot - returns label for morning", () => {
  assert.strictEqual(formatTimeSlot("morning"), "午前中");
});

test("formatTimeSlot - returns label for 12-14", () => {
  assert.strictEqual(formatTimeSlot("12-14"), "12:00〜14:00");
});

test("formatTimeSlot - returns label for 14-16", () => {
  assert.strictEqual(formatTimeSlot("14-16"), "14:00〜16:00");
});

test("formatTimeSlot - returns label for 16-18", () => {
  assert.strictEqual(formatTimeSlot("16-18"), "16:00〜18:00");
});

test("formatTimeSlot - returns label for 18-20", () => {
  assert.strictEqual(formatTimeSlot("18-20"), "18:00〜20:00");
});

test("formatTimeSlot - returns label for 19-21", () => {
  assert.strictEqual(formatTimeSlot("19-21"), "19:00〜21:00");
});

test("formatTimeSlot - returns fallback value for unknown slot", () => {
  assert.strictEqual(formatTimeSlot("unknown"), "unknown");
});

test("formatTimeSlot - handles undefined as empty string", () => {
  assert.strictEqual(formatTimeSlot(undefined), "指定なし");
});

test("resolveShippingAddress - uses customer address when sameAsCustomer is true", () => {
  const order = createMockOrder({ shipping: { sameAsCustomer: true } });
  const result = resolveShippingAddress(order);

  assert.strictEqual(result.name, "山田太郎");
  assert.strictEqual(result.phone, "09012345678");
  assert.strictEqual(result.postalCode, "100-0001");
  assert.strictEqual(result.prefecture, "東京都");
  assert.strictEqual(result.city, "千代田区");
  assert.strictEqual(result.addressLine, "丸の内1-1-1");
});

test("resolveShippingAddress - uses shipping address when sameAsCustomer is false", () => {
  const order = createMockOrder({
    shipping: {
      sameAsCustomer: false,
      name: "山田花子",
      phone: "08087654321",
      postalCode: "200-0001",
      prefecture: "神奈川県",
      city: "横浜市西区",
      addressLine: "みなとみらい1-1-1",
    },
  });
  const result = resolveShippingAddress(order);

  assert.strictEqual(result.name, "山田花子");
  assert.strictEqual(result.phone, "08087654321");
  assert.strictEqual(result.postalCode, "200-0001");
  assert.strictEqual(result.prefecture, "神奈川県");
  assert.strictEqual(result.city, "横浜市西区");
  assert.strictEqual(result.addressLine, "みなとみらい1-1-1");
});

test("resolveShippingAddress - uses empty strings for missing shipping fields when sameAsCustomer is false", () => {
  const order = createMockOrder({
    shipping: {
      sameAsCustomer: false,
    },
  });
  const result = resolveShippingAddress(order);

  assert.strictEqual(result.name, "");
  assert.strictEqual(result.phone, "");
  assert.strictEqual(result.postalCode, "");
  assert.strictEqual(result.prefecture, "");
  assert.strictEqual(result.city, "");
  assert.strictEqual(result.addressLine, "");
});

test("buildCustomerEmailText - contains order ID", () => {
  const order = createMockOrder();
  const text = buildCustomerEmailText(order);
  assert.match(text, /ORD-20240101-001/);
});

test("buildCustomerEmailText - contains total amount", () => {
  const order = createMockOrder();
  const text = buildCustomerEmailText(order);
  assert.match(text, /14,000/);
});

test("buildCustomerEmailText - contains product names", () => {
  const order = createMockOrder();
  const text = buildCustomerEmailText(order);
  assert.match(text, /商品A/);
  assert.match(text, /商品B/);
});

test("buildCustomerEmailText - contains customer name", () => {
  const order = createMockOrder();
  const text = buildCustomerEmailText(order);
  assert.match(text, /山田太郎様/);
});

test("buildCustomerEmailText - uses customer address when sameAsCustomer is true", () => {
  const order = createMockOrder({ shipping: { sameAsCustomer: true } });
  const text = buildCustomerEmailText(order);
  assert.match(text, /山田太郎様/);
  assert.match(text, /100-0001/);
  assert.match(text, /東京都千代田区丸の内1-1-1/);
});

test("buildCustomerEmailText - contains shipping preference information", () => {
  const order = createMockOrder();
  const text = buildCustomerEmailText(order);
  assert.match(text, /2024-01-20/);
  assert.match(text, /14:00〜16:00/);
});

test("buildCustomerEmailText - contains gift information with noshi and name entry", () => {
  const order = createMockOrder({ gift: { noshi: true, nameEntry: "山田家" } });
  const text = buildCustomerEmailText(order);
  assert.match(text, /のし: あり/);
  assert.match(text, /名入れ: 山田家/);
});

test("buildCustomerEmailText - displays 'のし: なし' when noshi is false", () => {
  const order = createMockOrder({ gift: { noshi: false, nameEntry: "山田家" } });
  const text = buildCustomerEmailText(order);
  assert.match(text, /のし: なし/);
  // Should not contain actual nameEntry value after "のし: なし"
  assert(!text.match(/のし: なし[\s\S]*山田家/));
});

test("buildCustomerEmailText - contains bank transfer payment notice", () => {
  const order = createMockOrder();
  const text = buildCustomerEmailText(order);
  assert.match(text, /銀行振込/);
});

test("buildCustomerEmailHtml - contains order ID", () => {
  const order = createMockOrder();
  const html = buildCustomerEmailHtml(order);
  assert.match(html, /ORD-20240101-001/);
});

test("buildCustomerEmailHtml - contains total amount", () => {
  const order = createMockOrder();
  const html = buildCustomerEmailHtml(order);
  assert.match(html, /14,000/);
});

test("buildCustomerEmailHtml - contains product names", () => {
  const order = createMockOrder();
  const html = buildCustomerEmailHtml(order);
  assert.match(html, /商品A/);
  assert.match(html, /商品B/);
});

test("buildCustomerEmailHtml - escapes XSS attempt in customer name", () => {
  const order = createMockOrder({
    customer: {
      name: '<script>alert("XSS")</script>',
      nameKana: "test",
      email: "test@example.com",
      phone: "09012345678",
      postalCode: "100-0001",
      prefecture: "東京都",
      city: "千代田区",
      addressLine: "丸の内1-1-1",
    },
  });
  const html = buildCustomerEmailHtml(order);
  // Should contain the escaped version
  assert.match(html, /&lt;script&gt;alert\(&quot;XSS&quot;\)&lt;\/script&gt;/);
  // Should NOT contain the raw script tag
  assert(!html.includes('<script>alert("XSS")</script>'));
});

test("buildCustomerEmailHtml - escapes special characters in name entry", () => {
  const order = createMockOrder({
    gift: { noshi: true, nameEntry: '<img src="x" onerror="alert(1)">' },
  });
  const html = buildCustomerEmailHtml(order);
  // Should contain the escaped version
  assert.match(html, /&lt;img src=&quot;x&quot; onerror=&quot;alert\(1\)&quot;&gt;/);
  // Should NOT contain the raw HTML
  assert(!html.includes('<img src="x" onerror="alert(1)">'));
});

test("buildCustomerEmailHtml - displays 'のし: なし' when noshi is false", () => {
  const order = createMockOrder({ gift: { noshi: false, nameEntry: "山田家" } });
  const html = buildCustomerEmailHtml(order);
  assert.match(html, /のし: なし/);
  // Should not contain actual nameEntry value after "のし: なし"
  assert(!html.match(/のし: なし[\s\S]*山田家/));
});

test("buildCustomerEmailHtml - contains proper HTML structure", () => {
  const order = createMockOrder();
  const html = buildCustomerEmailHtml(order);
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /<html lang="ja">/);
  assert.match(html, /<\/html>/);
  assert.match(html, /HEBEREST/);
});

test("buildCustomerEmailHtml - contains brand colors", () => {
  const order = createMockOrder();
  const html = buildCustomerEmailHtml(order);
  assert.match(html, /#1c2f21/);
  assert.match(html, /#2f4a37/);
});

test("buildCustomerEmailHtml - escapes customer name in address", () => {
  const order = createMockOrder({
    customer: {
      name: 'Test<b>Name</b>',
      nameKana: "test",
      email: "test@example.com",
      phone: "09012345678",
      postalCode: "100-0001",
      prefecture: "東京都",
      city: "千代田区",
      addressLine: "丸の内1-1-1",
    },
    shipping: {
      sameAsCustomer: true,
    },
  });
  const html = buildCustomerEmailHtml(order);
  assert.match(html, /Test&lt;b&gt;Name&lt;\/b&gt;/);
  assert(!html.includes('<b>Name</b>'));
});

test("buildCustomerEmailHtml - escapes postal code", () => {
  const order = createMockOrder({
    customer: {
      name: "Test",
      nameKana: "test",
      email: "test@example.com",
      phone: "09012345678",
      postalCode: '100"0001',
      prefecture: "東京都",
      city: "千代田区",
      addressLine: "丸の内1-1-1",
    },
    shipping: {
      sameAsCustomer: true,
    },
  });
  const html = buildCustomerEmailHtml(order);
  assert.match(html, /100&quot;0001/);
});

test("buildCustomerEmailHtml - escapes phone number", () => {
  const order = createMockOrder({
    customer: {
      name: "Test",
      nameKana: "test",
      email: "test@example.com",
      phone: '090<test>12345678',
      postalCode: "100-0001",
      prefecture: "東京都",
      city: "千代田区",
      addressLine: "丸の内1-1-1",
    },
    shipping: {
      sameAsCustomer: true,
    },
  });
  const html = buildCustomerEmailHtml(order);
  assert.match(html, /090&lt;test&gt;12345678/);
});

test("buildCustomerEmailHtml - escapes address components", () => {
  const order = createMockOrder({
    customer: {
      name: "Test",
      nameKana: "test",
      email: "test@example.com",
      phone: "09012345678",
      postalCode: "100-0001",
      prefecture: '東京"都',
      city: '<city>',
      addressLine: 'line&1',
    },
    shipping: {
      sameAsCustomer: true,
    },
  });
  const html = buildCustomerEmailHtml(order);
  assert.match(html, /東京&quot;都/);
  assert.match(html, /&lt;city&gt;/);
  assert.match(html, /line&amp;1/);
});

test("buildCustomerEmailHtml - contains desired date and time slot", () => {
  const order = createMockOrder({
    shipping: {
      sameAsCustomer: true,
      desiredDate: "2024-01-20",
      desiredTimeSlot: "14-16",
    },
  });
  const html = buildCustomerEmailHtml(order);
  assert.match(html, /2024-01-20/);
  assert.match(html, /14:00〜16:00/);
});

test("buildCustomerEmailHtml - handles no desired date", () => {
  const order = createMockOrder({
    shipping: {
      sameAsCustomer: true,
      desiredDate: undefined,
      desiredTimeSlot: "",
    },
  });
  const html = buildCustomerEmailHtml(order);
  assert.match(html, /指定なし/);
});
