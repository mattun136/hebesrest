import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const relatedLinks: { label: string; href: string }[] = [
  { label: "ブランドストーリーを読む", href: "/#story" },
  { label: "生産者の想いを知る", href: "/#producer" },
];

export default async function OrderCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;

  return (
    <>
      <Header />
      <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-24 text-center sm:px-8">
        <span className="text-xs tracking-[0.4em] text-brand-green">THANK YOU</span>
        <h1 className="mt-4 font-serif text-3xl text-brand-green-dark sm:text-4xl">
          ご注文ありがとうございます
        </h1>
        {orderId && (
          <p className="mt-6 text-sm text-foreground/70">
            注文番号: <span className="font-medium text-brand-green-dark">{orderId}</span>
          </p>
        )}
        <p className="mt-4 max-w-md text-sm leading-loose text-foreground/70">
          お支払い方法（銀行振込等）は、追ってメールにてご案内いたします。今しばらくお待ちください。
        </p>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row">
          {relatedLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-brand-green-dark px-6 py-3 text-sm tracking-wide text-brand-green-dark transition-colors hover:bg-brand-green-dark hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
