import { z } from "zod";
import { isProductId } from "@/lib/products";
import { isValidShipDate } from "@/lib/orders/shipping-calendar";

const postalCodeRegex = /^\d{3}-?\d{4}$/;
const phoneRegex = /^[0-9()+\- ]{9,15}$/;

export const orderFormSchema = z
  .object({
    productId: z.string().refine(isProductId, { message: "不正な商品IDです" }),
    quantity: z.coerce.number().int().min(1).max(9),

    customerName: z.string().trim().min(1, "お名前を入力してください").max(60),
    customerNameKana: z.string().trim().min(1, "フリガナを入力してください").max(60),
    customerEmail: z
      .string()
      .trim()
      .pipe(z.email("メールアドレスの形式が正しくありません")),
    customerPhone: z
      .string()
      .trim()
      .regex(phoneRegex, "電話番号の形式が正しくありません"),
    customerPostalCode: z
      .string()
      .trim()
      .regex(postalCodeRegex, "郵便番号はハイフンありなしの7桁で入力してください"),
    customerPrefecture: z.string().trim().min(1, "都道府県を入力してください").max(10),
    customerCity: z.string().trim().min(1, "市区町村を入力してください").max(60),
    customerAddressLine: z
      .string()
      .trim()
      .min(1, "番地・建物名を入力してください")
      .max(120),

    shippingSameAsCustomer: z.coerce.boolean(),
    shippingName: z.string().trim().max(60).optional(),
    shippingPhone: z.string().trim().regex(phoneRegex).optional().or(z.literal("")),
    shippingPostalCode: z
      .string()
      .trim()
      .regex(postalCodeRegex)
      .optional()
      .or(z.literal("")),
    shippingPrefecture: z.string().trim().max(10).optional(),
    shippingCity: z.string().trim().max(60).optional(),
    shippingAddressLine: z.string().trim().max(120).optional(),
    shippingDesiredDate: z.string().trim().optional().or(z.literal("")),
    shippingDesiredTimeSlot: z.string().trim().max(20).optional(),
    shippingNote: z.string().trim().max(300).optional(),

    giftNoshi: z.coerce.boolean(),
    giftNameEntry: z.string().trim().max(20).optional(),

    consentPrivacy: z.coerce
      .boolean()
      .refine((v) => v === true, { message: "プライバシーポリシーへの同意が必要です" }),
    consentOrderContent: z.coerce
      .boolean()
      .refine((v) => v === true, { message: "注文内容への同意が必要です" }),
    consentCancellationPolicy: z.coerce
      .boolean()
      .refine((v) => v === true, {
        message: "キャンセル・返品条件への同意が必要です",
      }),

    idempotencyKey: z.uuid(),
  })
  .superRefine((data, ctx) => {
    if (!data.shippingSameAsCustomer) {
      if (!data.shippingName) {
        ctx.addIssue({
          code: "custom",
          path: ["shippingName"],
          message: "配送先氏名を入力してください",
          input: data.shippingName,
        });
      }
      if (!data.shippingPostalCode || !postalCodeRegex.test(data.shippingPostalCode)) {
        ctx.addIssue({
          code: "custom",
          path: ["shippingPostalCode"],
          message: "配送先郵便番号を正しく入力してください",
          input: data.shippingPostalCode,
        });
      }
      if (!data.shippingPrefecture) {
        ctx.addIssue({
          code: "custom",
          path: ["shippingPrefecture"],
          message: "配送先都道府県を入力してください",
          input: data.shippingPrefecture,
        });
      }
      if (!data.shippingCity) {
        ctx.addIssue({
          code: "custom",
          path: ["shippingCity"],
          message: "配送先市区町村を入力してください",
          input: data.shippingCity,
        });
      }
      if (!data.shippingAddressLine) {
        ctx.addIssue({
          code: "custom",
          path: ["shippingAddressLine"],
          message: "配送先番地・建物名を入力してください",
          input: data.shippingAddressLine,
        });
      }
    }

    if (data.shippingDesiredDate && !isValidShipDate(data.shippingDesiredDate, new Date())) {
      ctx.addIssue({
        code: "custom",
        path: ["shippingDesiredDate"],
        message: "指定された配送希望日は選択できません",
        input: data.shippingDesiredDate,
      });
    }
  });

export type OrderFormInput = z.infer<typeof orderFormSchema>;
export type OrderFormFieldErrors = Partial<Record<string, string[]>>;
