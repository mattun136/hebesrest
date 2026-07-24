import Image from "next/image";
import Link from "next/link";
import { PRODUCT_LIST } from "@/lib/products";
import productJuice from "../../public/images/products/product-juice.jpg";
import productJuice2 from "../../public/images/products/product-juice2.jpg";
import productNoji from "../../public/images/products/product-noji.jpg";
import productAki from "../../public/images/products/product-aki.jpg";

const comingSoonProducts = [
  {
    tag: "一年中楽しめる",
    name: "冷凍へべす非加熱ストレート果汁 1000ml",
    description: "現在販売準備中です。",
    comingSoonLabel: "準備中",
    image: productJuice,
  },
  {
    tag: "一年中楽しめる",
    name: "冷凍へべす非加熱ストレート果汁 1000ml×2",
    description: "現在販売準備中です。",
    comingSoonLabel: "準備中",
    image: productJuice2,
  },
  {
    tag: "季節限定",
    name: "路地へべす",
    comingSoonLabel: "販売準備中",
    image: productNoji,
  },
  {
    tag: "Coming Soon",
    name: "黄色い秋へべす",
    meta: "販売時期：10月〜12月限定",
    description:
      "市場から姿を消したあと、本当の旬が始まるへべす。9月で市場流通は終了しますが、園地ではその後も木の上でゆっくりと完熟していきます。私たちは、その実を農家さんから直接お届けします。爽やかな香りはそのままに、まろやかな酸味と深い味わいを楽しめる、秋だけの特別なへべすです。",
    comingSoonLabel: "販売開始をお楽しみに",
    image: productAki,
  },
];

function formatPriceLabel(unitPriceJPY: number): string {
  return `¥${unitPriceJPY.toLocaleString("ja-JP")}（税込・送料無料）`;
}

export default function Products() {
  return (
    <section id="products" className="bg-[#f4efe3] px-6 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className="text-xs tracking-[0.4em] text-brand-green">
            PRODUCTS
          </span>
          <h2 className="mt-4 font-serif text-3xl text-brand-green-dark sm:text-4xl">
            商品一覧
          </h2>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCT_LIST.map((p) => (
            <div
              key={p.id}
              className="flex flex-col rounded-3xl bg-background p-6 shadow-sm ring-1 ring-brand-line"
            >
              <div className="relative h-36 overflow-hidden rounded-2xl">
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  placeholder="blur"
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
                {p.badge && (
                  <span className="absolute left-3 top-3 rounded-full bg-brand-gold px-3 py-1 text-[10px] font-medium tracking-wider text-white shadow-sm">
                    {p.badge}
                  </span>
                )}
              </div>
              <span className="mt-6 text-[11px] tracking-[0.2em] text-brand-green">
                {p.tag}
              </span>
              <h3 className="mt-2 font-serif text-base text-brand-green-dark">
                {p.name}
              </h3>
              <p className="mt-2 flex-1 text-xs leading-relaxed text-foreground/60">
                {p.description}
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <span className="text-sm font-medium text-brand-green-dark">
                  {formatPriceLabel(p.unitPriceJPY)}
                </span>
                <Link
                  href={`/order/${p.id}`}
                  className="inline-flex w-full items-center justify-center rounded-full bg-brand-green-dark px-4 py-2 text-xs text-white transition-colors hover:bg-brand-green"
                >
                  購入する
                </Link>
                <a
                  href={p.mercariHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center text-[11px] text-foreground/40 underline"
                >
                  メルカリShopsでも購入いただけます
                </a>
              </div>
            </div>
          ))}

          {comingSoonProducts.map((p) => (
            <div
              key={p.name}
              className="flex flex-col rounded-3xl bg-background p-6 shadow-sm ring-1 ring-brand-line"
            >
              <div className="relative h-36 overflow-hidden rounded-2xl">
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  placeholder="blur"
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <span className="mt-6 text-[11px] tracking-[0.2em] text-brand-green">
                {p.tag}
              </span>
              <h3 className="mt-2 font-serif text-base text-brand-green-dark">
                {p.name}
              </h3>
              {p.meta && (
                <p className="mt-1 text-xs tracking-wide text-brand-gold">
                  {p.meta}
                </p>
              )}
              {p.description && (
                <p className="mt-2 flex-1 text-xs leading-relaxed text-foreground/60">
                  {p.description}
                </p>
              )}
              <div className="mt-6 flex flex-col gap-3">
                <span className="inline-flex w-full items-center justify-center rounded-full border border-brand-line px-4 py-2 text-xs text-foreground/40">
                  {p.comingSoonLabel}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
