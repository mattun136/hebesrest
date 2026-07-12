import Image from "next/image";
import product1kg from "../../public/images/products/product-1kg.jpg";
import product05kg from "../../public/images/products/product-05kg.jpg";
import product18kg from "../../public/images/products/product-18kg.jpg";
import product3kg from "../../public/images/products/product-3kg.jpg";
import productJuice from "../../public/images/products/product-juice.jpg";
import productJuice2 from "../../public/images/products/product-juice2.jpg";
import productNoji from "../../public/images/products/product-noji.jpg";
import productAki from "../../public/images/products/product-aki.jpg";

const products = [
  {
    tag: "人気No.1",
    badge: "人気No.1",
    name: "宮崎県産ハウスへべす 1kg",
    price: "¥3,777（税込・送料無料）",
    description:
      "初めての方にもおすすめ。ご家庭で使いやすい、一番人気の定番サイズです。",
    href: "https://jp.mercari.com/shops/product/2JTiJS2yRCFeoJvpWYSk8C?source=shared_link&utm_source=shared_link",
    image: product1kg,
  },
  {
    tag: "お試しサイズ",
    name: "宮崎県産ハウスへべす 0.5kg",
    price: "¥2,500（税込・送料無料）",
    description: "まずはへべすを味わってみたい方へ。",
    href: "https://jp.mercari.com/shops/product/2JTowaqNx8QHB2Uo44idVm?source=shared_link&utm_source=shared_link",
    image: product05kg,
  },
  {
    tag: "ご家庭向け",
    name: "宮崎県産ハウスへべす 1.8kg",
    price: "¥5,675（税込・送料無料）",
    description: "ご家族でたっぷり楽しみたい方に。",
    href: "https://jp.mercari.com/shops/product/2JTj2zfBbeZULsCHJ6dSVE?source=shared_link&utm_source=shared_link",
    image: product18kg,
  },
  {
    tag: "たっぷりサイズ",
    name: "宮崎県産ハウスへべす 3kg",
    price: "¥8,610（税込・送料無料）",
    description: "料理好きの方やまとめ買いにおすすめです。",
    href: "https://jp.mercari.com/shops/product/2JTj4a5Tcd4WDHWJniSjkn?source=shared_link&utm_source=shared_link",
    image: product3kg,
  },
  {
    tag: "一年中楽しめる",
    name: "冷凍へべす非加熱ストレート果汁 1000ml",
    description: "現在販売準備中です。",
    comingSoon: true,
    comingSoonLabel: "準備中",
    image: productJuice,
  },
  {
    tag: "一年中楽しめる",
    name: "冷凍へべす非加熱ストレート果汁 1000ml×2",
    description: "現在販売準備中です。",
    comingSoon: true,
    comingSoonLabel: "準備中",
    image: productJuice2,
  },
  {
    tag: "季節限定",
    name: "路地へべす",
    price: "販売準備中",
    comingSoon: true,
    image: productNoji,
  },
  {
    tag: "Coming Soon",
    name: "黄色い秋へべす",
    meta: "販売時期：10月〜12月限定",
    description:
      "市場から姿を消したあと、本当の旬が始まるへべす。9月で市場流通は終了しますが、園地ではその後も木の上でゆっくりと完熟していきます。私たちは、その実を農家さんから直接お届けします。爽やかな香りはそのままに、まろやかな酸味と深い味わいを楽しめる、秋だけの特別なへべすです。",
    comingSoon: true,
    comingSoonLabel: "販売開始をお楽しみに",
    image: productAki,
  },
];

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
          {products.map((p) => (
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
                {p.price && (
                  <span className="text-sm font-medium text-brand-green-dark">
                    {p.price}
                  </span>
                )}
                {p.comingSoon ? (
                  <span className="inline-flex w-full items-center justify-center rounded-full border border-brand-line px-4 py-2 text-xs text-foreground/40">
                    {p.comingSoonLabel ?? "販売準備中"}
                  </span>
                ) : (
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center rounded-full bg-brand-green-dark px-4 py-2 text-xs text-white transition-colors hover:bg-brand-green"
                  >
                    購入する
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
