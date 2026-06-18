import { Navbar } from "./_components/navbar";
import FAQ from "./_components/faq";
import Features from "./_components/features";
import Hero from "./_components/hero";
import Pricing from "./_components/pricing";
import { StackedCircularFooter } from "@/app/(marketing)/_components/stacked-circular-footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <FAQ />
      <Pricing />
      <StackedCircularFooter />
    </>
  );
}
