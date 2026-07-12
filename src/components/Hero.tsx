import Image from "next/image";
import heroImage from "../../public/images/hero.jpg";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden pt-16"
    >
      <Image
        src={heroImage}
        alt="宮崎県日向市、山の上に広がるへべす畑と海の眺望"
        fill
        preload
        placeholder="blur"
        sizes="100vw"
        className="object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/20 to-black/50"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-24 h-[28rem] w-[28rem] rounded-full bg-brand-gold/10 blur-3xl sm:h-[36rem] sm:w-[36rem]"
      />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 py-24 text-center sm:px-8">
        <span className="mb-6 text-xs tracking-[0.4em] text-white/90">
          MIYAZAKI HEBESU
        </span>

        <h1 className="font-serif text-4xl font-medium leading-tight tracking-wide text-white drop-shadow-sm sm:text-6xl md:text-7xl">
          へべすの価値を、
          <br />
          未来へ。
        </h1>

        <p className="mt-8 max-w-xl text-base leading-loose text-white/85 sm:text-lg">
          宮崎県が育んだ香酸柑橘「へべす」。
          <br className="hidden sm:block" />
          澄んだ香りと爽やかな酸味を、生産者の手から食卓へ。
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <a
            href="#products"
            className="w-56 rounded-full bg-white px-8 py-4 text-sm tracking-wider text-brand-green-dark transition-transform hover:scale-[1.02] hover:bg-white/90"
          >
            商品を購入する
          </a>
          <a
            href="#story"
            className="w-56 rounded-full border border-white/60 px-8 py-4 text-sm tracking-wider text-white transition-colors hover:border-white hover:bg-white/10"
          >
            ブランドストーリー
          </a>
        </div>
      </div>
    </section>
  );
}
