import Header from "@/components/Header";
import Hero from "@/components/Hero";
import BrandStory from "@/components/BrandStory";
import Features from "@/components/Features";
import Producer from "@/components/Producer";
import Products from "@/components/Products";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <Hero />
        <BrandStory />
        <Features />
        <Producer />
        <Products />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
