import Image from "next/image";
import producerImage from "../../public/images/producer.jpg";

// 本当の生産者情報が決まり次第、下記を実名・実データに差し替えて
// SHOW_PRODUCER_PROFILES を true にすると、生産者カードが表示されます。
const SHOW_PRODUCER_PROFILES = false;

const producers = [
  {
    name: "河野 誠一",
    role: "日向市 / へべす農家歴32年",
    comment:
      "土づくりから見直し、農薬に頼りすぎない栽培を続けています。香りの強いへべすを届けるのが誇りです。",
  },
  {
    name: "黒木 美緒",
    role: "美郷町 / へべす農家歴15年",
    comment:
      "先代から受け継いだ木を大切に、一玉ずつ手摘みで収穫。見た目より香りと果汁量にこだわっています。",
  },
];

export default function Producer() {
  return (
    <section id="producer" className="mx-auto max-w-6xl px-6 py-24 sm:px-8 sm:py-32">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="relative h-80 overflow-hidden rounded-3xl shadow-lg ring-1 ring-brand-line sm:h-[28rem] lg:h-[34rem]">
          <Image
            src={producerImage}
            alt="収穫したへべすを抱える宮崎の生産者"
            fill
            placeholder="blur"
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>

        <div>
          <span className="text-xs tracking-[0.4em] text-brand-green">
            PRODUCERS
          </span>
          <h2 className="mt-4 font-serif text-3xl text-brand-green-dark sm:text-4xl">
            宮崎の生産者とともに
          </h2>
          <p className="mt-6 max-w-xl text-sm leading-loose text-foreground/60">
            HEBERESTがお届けするへべすは、宮崎県で大切に育てられたものです。
          </p>
          <p className="mt-6 max-w-xl text-sm leading-loose text-foreground/60">
            収穫時期や品質を見極め、その時期に最も良い状態のへべすを厳選しています。
          </p>
          <p className="mt-6 max-w-xl text-sm leading-loose text-foreground/60">
            市場を通じたものも、生産者さんから届けていただくものも、一つひとつ品質を確認し、
            自信を持ってお届けできるものだけをお客様へお届けしています。
          </p>
          <p className="mt-8 max-w-xl font-serif text-base leading-loose text-brand-green-dark">
            「おいしいへべすを、もっと多くの人に知ってほしい。」
          </p>
          <p className="mt-4 max-w-xl text-sm leading-loose text-foreground/60">
            その想いを大切に、HEBERESTは宮崎のへべすの魅力を全国へ届けていきます。
          </p>
        </div>
      </div>

      {SHOW_PRODUCER_PROFILES && (
        <div className="mt-16 grid gap-10 sm:grid-cols-2">
          {producers.map((p) => (
            <div
              key={p.name}
              className="rounded-3xl border border-brand-line p-8"
            >
              <h3 className="font-serif text-lg text-brand-green-dark">
                {p.name}
              </h3>
              <p className="mt-1 text-xs tracking-wide text-foreground/50">
                {p.role}
              </p>
              <p className="mt-4 text-sm leading-loose text-foreground/70">
                {p.comment}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
