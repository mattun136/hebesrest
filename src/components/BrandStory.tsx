import Image from "next/image";
import brandStoryImage from "../../public/images/brand-story.jpg";

export default function BrandStory() {
  return (
    <section id="story" className="mx-auto max-w-6xl px-6 py-24 sm:px-8 sm:py-32">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="relative order-2 h-72 overflow-hidden rounded-3xl shadow-lg ring-1 ring-brand-line sm:h-96 lg:order-1 lg:h-[32rem]">
          <Image
            src={brandStoryImage}
            alt="日向市に建つへべす発祥の地を示す石碑"
            fill
            placeholder="blur"
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="order-1 lg:order-2">
          <span className="text-xs tracking-[0.4em] text-brand-green">
            BRAND STORY
          </span>
          <h2 className="mt-4 font-serif text-3xl leading-snug text-brand-green-dark sm:text-4xl">
            一玉に宿る、
            <br />
            宮崎の風土と時間。
          </h2>
          <p className="mt-8 text-base leading-loose text-foreground/70">
            へべすは、宮崎県日向市を中心に育まれてきた、すだちに似た香酸柑橘です。
            種が少なく果汁が豊富で、他の柑橘にはない上品な香りを持つことから、
            「幻の柑橘」とも呼ばれてきました。
          </p>
          <p className="mt-6 text-base leading-loose text-foreground/70">
            私たちは、この土地でしか生まれない味わいを、一過性の流行で終わらせることなく、
            次の世代へ受け継ぐべき地域の財産だと考えています。
          </p>
          <p className="mt-6 text-base leading-loose text-foreground/70">
            生産者とともに丹精込めて育てたへべすを、固定概念にとらわれない新しい形で、
            より多くの方々へ届けること。
          </p>
          <p className="mt-6 text-base leading-loose text-foreground/70">
            それが、私たちの使命です。
          </p>
        </div>
      </div>
    </section>
  );
}
