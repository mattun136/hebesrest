"use client";

import { useState } from "react";

const faqs = [
  {
    q: "へべすとすだち・かぼすの違いは何ですか？",
    a: "見た目は似ていますが、へべすは香りが強く酸味がまろやかなのが特徴です。宮崎県日向市周辺でのみ栽培されている希少な柑橘です。",
  },
  {
    q: "保存方法を教えてください。",
    a: "生果は冷蔵庫の野菜室で1〜2週間保存可能です。長期保存の場合は、輪切りやカットして冷凍することをおすすめします。",
  },
  {
    q: "訳あり品との違いは何ですか？",
    a: "訳あり品は形やサイズが不揃いですが、香りや果汁量は通常品と変わりません。ご自宅用として人気です。",
  },
  {
    q: "配送にはどれくらいかかりますか？",
    a: "ご注文確認後、収穫状況に応じて3〜7営業日以内に発送いたします。収穫期以外は冷凍・加工品での発送となります。",
  },
  {
    q: "支払い方法は何がありますか？",
    a: "クレジットカード、銀行振込、代金引換に対応しています。詳細はご注文手続き時にご確認ください。",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-[#f4efe3] px-6 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <span className="text-xs tracking-[0.4em] text-brand-green">
            FAQ
          </span>
          <h2 className="mt-4 font-serif text-3xl text-brand-green-dark sm:text-4xl">
            よくある質問
          </h2>
        </div>

        <div className="mt-14 divide-y divide-brand-line rounded-3xl bg-background ring-1 ring-brand-line">
          {faqs.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left sm:px-8"
                >
                  <span className="text-sm font-medium text-brand-green-dark sm:text-base">
                    {item.q}
                  </span>
                  <span
                    aria-hidden
                    className={`shrink-0 text-lg text-brand-green transition-transform ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <p className="px-6 pb-6 text-sm leading-loose text-foreground/70 sm:px-8">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
