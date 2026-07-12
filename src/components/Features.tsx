const features = [
  {
    title: "香り",
    en: "AROMA",
    description:
      "皮から立ち上る清涼な香りは、柚子やすだちとも異なる、へべす特有のもの。一滴で料理の印象を変えます。",
    icon: (
      <path d="M32 8c-6 6-10 13-10 20a10 10 0 0 0 20 0c0-7-4-14-10-20Z" />
    ),
  },
  {
    title: "味",
    en: "TASTE",
    description:
      "酸味は柔らかく、後味はすっきりと軽やか。塩味・脂・魚介との相性がよく、料理の輪郭を引き立てます。",
    icon: <path d="M14 30h36l-5 18a6 6 0 0 1-6 4H25a6 6 0 0 1-6-4Z" />,
  },
  {
    title: "栄養",
    en: "NUTRITION",
    description:
      "ビタミンCやクエン酸、香気成分を豊富に含み、疲労回復や美容を意識する方にも選ばれています。",
    icon: <path d="M32 10a14 14 0 0 1 14 14c0 10-14 24-14 24S18 34 18 24a14 14 0 0 1 14-14Z" />,
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="bg-brand-green-dark px-6 py-24 text-white sm:px-8 sm:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className="text-xs tracking-[0.4em] text-white/60">
            CHARACTERISTICS
          </span>
          <h2 className="mt-4 font-serif text-3xl sm:text-4xl">
            へべすの、三つの特徴
          </h2>
        </div>

        <div className="mt-16 grid gap-10 sm:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="text-center">
              <svg
                viewBox="0 0 64 64"
                className="mx-auto h-14 w-14 text-brand-gold"
                fill="currentColor"
                aria-hidden
              >
                {f.icon}
              </svg>
              <h3 className="mt-6 font-serif text-xl">{f.title}</h3>
              <span className="text-[11px] tracking-[0.3em] text-white/40">
                {f.en}
              </span>
              <p className="mt-4 text-sm leading-loose text-white/70">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
