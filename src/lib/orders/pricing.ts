import { PRODUCTS, type ProductId } from "@/lib/products";
import type { OrderItem } from "@/lib/orders/types";

export interface PricingResult {
  items: OrderItem[];
  shippingFeeJPY: number;
  totalJPY: number;
}

/** 全商品送料無料（初期実装は固定0円。将来地域係数を追加できるようこの関数に閉じてある）。 */
const SHIPPING_FEE_JPY = 0;

export function priceOrder(productId: ProductId, quantity: number): PricingResult {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 9) {
    throw new RangeError(`quantity must be an integer between 1 and 9, got ${quantity}`);
  }

  const product = PRODUCTS[productId];
  const subtotalJPY = product.unitPriceJPY * quantity;

  return {
    items: [
      {
        productId: product.id,
        name: product.name,
        variantLabel: product.variantLabel,
        unitPriceJPY: product.unitPriceJPY,
        quantity,
        subtotalJPY,
      },
    ],
    shippingFeeJPY: SHIPPING_FEE_JPY,
    totalJPY: subtotalJPY + SHIPPING_FEE_JPY,
  };
}
