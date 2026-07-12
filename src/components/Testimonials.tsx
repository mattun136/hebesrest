const voices = [
  {
    name: "東京都 / 40代 女性",
    comment:
      "香りの強さに驚きました。いつもの焼き魚に絞るだけで、料亭のような一品になります。",
  },
  {
    name: "大阪府 / 30代 男性",
    comment:
      "すだちより香りがまろやかで、鍋物にぴったり。訳あり品でも味は全く問題なしでした。",
  },
  {
    name: "福岡県 / 50代 女性",
    comment:
      "果汁が多くて使いやすい。冷凍の果汁タイプは常備しておくと便利です。",
  },
];

export default function Testimonials() {
  return (
    <section id="voices" className="mx-auto max-w-6xl px-6 py-24 sm:px-8 sm:py-32">
      <div className="text-center">
        <span className="text-xs tracking-[0.4em] text-brand-green">
          VOICES
        </span>
        <h2 className="mt-4 font-serif text-3xl text-brand-green-dark sm:text-4xl">
          お客様の声
        </h2>
      </div>

      <div className="mt-16 grid gap-8 sm:grid-cols-3">
        {voices.map((v) => (
          <figure
            key={v.name}
            className="rounded-3xl border border-brand-line p-8"
          >
            <blockquote className="text-sm leading-loose text-foreground/70">
              “{v.comment}”
            </blockquote>
            <figcaption className="mt-6 text-xs tracking-wide text-foreground/50">
              {v.name}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
