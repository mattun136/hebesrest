import type { StaticImageData } from "next/image";
import product1kg from "../../public/images/products/product-1kg.jpg";
import product05kg from "../../public/images/products/product-05kg.jpg";
import product18kg from "../../public/images/products/product-18kg.jpg";
import product3kg from "../../public/images/products/product-3kg.jpg";

export type ProductId = "1kg" | "05kg" | "18kg" | "3kg";

export interface Product {
  id: ProductId;
  tag: string;
  badge?: string;
  name: string;
  variantLabel: string;
  unitPriceJPY: number;
  description: string;
  mercariHref: string;
  image: StaticImageData;
  /** 将来Journal記事を実装した際にリンクする記事slug。今回は未使用。 */
  relatedStorySlugs?: string[];
}

export const PRODUCTS: Record<ProductId, Product> = {
  "1kg": {
    id: "1kg",
    tag: "人気No.1",
    badge: "人気No.1",
    name: "宮崎県産ハウスへべす 1kg",
    variantLabel: "1kg",
    unitPriceJPY: 3777,
    description:
      "初めての方にもおすすめ。ご家庭で使いやすい、一番人気の定番サイズです。",
    mercariHref:
      "https://jp.mercari.com/shops/product/2JTiJS2yRCFeoJvpWYSk8C?source=shared_link&utm_source=shared_link",
    image: product1kg,
  },
  "05kg": {
    id: "05kg",
    tag: "お試しサイズ",
    name: "宮崎県産ハウスへべす 0.5kg",
    variantLabel: "0.5kg",
    unitPriceJPY: 2500,
    description: "まずはへべすを味わってみたい方へ。",
    mercariHref:
      "https://jp.mercari.com/shops/product/2JTowaqNx8QHB2Uo44idVm?source=shared_link&utm_source=shared_link",
    image: product05kg,
  },
  "18kg": {
    id: "18kg",
    tag: "ご家庭向け",
    name: "宮崎県産ハウスへべす 1.8kg",
    variantLabel: "1.8kg",
    unitPriceJPY: 5675,
    description: "ご家族でたっぷり楽しみたい方に。",
    mercariHref:
      "https://jp.mercari.com/shops/product/2JTj2zfBbeZULsCHJ6dSVE?source=shared_link&utm_source=shared_link",
    image: product18kg,
  },
  "3kg": {
    id: "3kg",
    tag: "たっぷりサイズ",
    name: "宮崎県産ハウスへべす 3kg",
    variantLabel: "3kg",
    unitPriceJPY: 8610,
    description: "料理好きの方やまとめ買いにおすすめです。",
    mercariHref:
      "https://jp.mercari.com/shops/product/2JTj4a5Tcd4WDHWJniSjkn?source=shared_link&utm_source=shared_link",
    image: product3kg,
  },
};

export const PRODUCT_LIST: Product[] = Object.values(PRODUCTS);

export function isProductId(value: string): value is ProductId {
  return Object.prototype.hasOwnProperty.call(PRODUCTS, value);
}
