import Header from "@/components/Header";
import Footer from "@/components/Footer";

const rows: { label: string; value: string }[] = [
  { label: "販売事業者", value: "【要確認：正式な事業者名をご記入ください】" },
  { label: "運営統括責任者", value: "【要確認】" },
  { label: "所在地", value: "【要確認：郵便番号・住所】" },
  { label: "電話番号", value: "【要確認：お問い合わせ対応可能な電話番号】" },
  { label: "メールアドレス", value: "【要確認】" },
  { label: "販売価格", value: "各商品ページに記載の金額（消費税込み）" },
  { label: "商品代金以外の必要料金", value: "送料は無料です。振込手数料はお客様負担となります。" },
  {
    label: "お支払い方法",
    value: "銀行振込（ご注文確定後、メールにてお振込先をご案内します）",
  },
  {
    label: "お支払い時期",
    value: "ご注文確定後、案内メール受領後1週間以内にお振込みください。",
  },
  {
    label: "商品の引き渡し時期",
    value: "ご入金確認後、収穫状況に応じて順次発送いたします。",
  },
  {
    label: "返品・交換について",
    value:
      "生鮮食品の性質上、お客様都合による返品・交換はお受けできません。商品に不備があった場合は、到着後7日以内にメールにてご連絡ください。",
  },
];

export default function TokushohoPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-32 sm:px-8">
        <span className="text-xs tracking-[0.4em] text-brand-green">LEGAL</span>
        <h1 className="mt-4 font-serif text-3xl text-brand-green-dark">
          特定商取引法に基づく表記
        </h1>
        <p className="mt-6 text-sm text-foreground/60">
          本ページは一般的なひな形です。「【要確認】」の箇所は本番公開前に正式な情報へ差し替えてください。
        </p>
        <dl className="mt-10 divide-y divide-brand-line border-t border-brand-line">
          {rows.map((row) => (
            <div key={row.label} className="grid gap-1 py-4 sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-brand-green-dark">{row.label}</dt>
              <dd className="text-sm leading-relaxed text-foreground/70 sm:col-span-2">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </main>
      <Footer />
    </>
  );
}
