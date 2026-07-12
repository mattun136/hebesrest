const footerLinks = [
  { href: "#story", label: "ブランドストーリー" },
  { href: "#features", label: "特徴" },
  { href: "#producer", label: "生産者" },
  { href: "#products", label: "商品一覧" },
  { href: "#voices", label: "お客様の声" },
  { href: "#faq", label: "よくある質問" },
];

export default function Footer() {
  return (
    <footer className="bg-brand-green-dark px-6 py-16 text-white/70 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 sm:flex-row sm:justify-between">
        <div>
          <a href="#top" className="font-serif text-lg tracking-[0.2em] text-white">
            HEBESU
          </a>
          <p className="mt-4 max-w-xs text-sm leading-loose">
            宮崎県産へべすの価値を、生産者とともに未来へつなぐブランドです。
          </p>
        </div>

        <nav aria-label="フッターナビゲーション">
          <ul className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-1">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="hover:text-white">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="text-sm leading-loose">
          <p>特定商取引法に基づく表記</p>
          <p>プライバシーポリシー</p>
          <p className="mt-4 text-white/40">
            &copy; {new Date().getFullYear()} HEBESU. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
