import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { isProductId, PRODUCTS } from "@/lib/products";
import { getAvailableShipDates } from "@/lib/orders/shipping-calendar";
import { OrderForm } from "./OrderForm";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  if (!isProductId(productId)) {
    notFound();
  }

  const product = PRODUCTS[productId];
  const availableShipDates = getAvailableShipDates(new Date(), 30);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-32 sm:px-8">
        <OrderForm product={product} availableShipDates={availableShipDates} />
      </main>
      <Footer />
    </>
  );
}
