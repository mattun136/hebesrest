import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-32 sm:px-8">
        <span className="text-xs tracking-[0.4em] text-brand-green">LEGAL</span>
        <h1 className="mt-4 font-serif text-3xl text-brand-green-dark">
          プライバシーポリシー
        </h1>
        <p className="mt-6 text-sm text-foreground/60">
          本ページは一般的なひな形です。事業者情報など「【要確認】」の箇所は本番公開前に正式な情報へ差し替えてください。
        </p>

        <div className="mt-10 space-y-8 text-sm leading-loose text-foreground/70">
          <section>
            <h2 className="font-serif text-lg text-brand-green-dark">
              1. 取得する情報
            </h2>
            <p className="mt-2">
              ご注文の際に、お名前・フリガナ・メールアドレス・電話番号・住所・配送先情報・のし/名入れのご希望・お支払い状況を取得します。
            </p>
          </section>
          <section>
            <h2 className="font-serif text-lg text-brand-green-dark">
              2. 利用目的
            </h2>
            <p className="mt-2">
              ご注文商品の発送、お支払いのご案内、お問い合わせへの対応、ご注文内容の確認以外の目的には利用しません。
            </p>
          </section>
          <section>
            <h2 className="font-serif text-lg text-brand-green-dark">
              3. 第三者提供
            </h2>
            <p className="mt-2">
              法令に基づく場合を除き、ご本人の同意なく取得した情報を第三者へ提供することはありません。配送のため、配送事業者へ必要な範囲の情報を共有する場合があります。
            </p>
          </section>
          <section>
            <h2 className="font-serif text-lg text-brand-green-dark">
              4. 保管方法
            </h2>
            <p className="mt-2">
              取得した情報は、社内で管理するスプレッドシートにて厳重に保管し、アクセスできる担当者を限定します。
            </p>
          </section>
          <section>
            <h2 className="font-serif text-lg text-brand-green-dark">
              5. お問い合わせ窓口
            </h2>
            <p className="mt-2">【要確認：お問い合わせ用メールアドレスをご記入ください】</p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
