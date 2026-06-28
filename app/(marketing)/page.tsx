import { Navbar } from "./_components/navbar";
import FAQ from "./_components/faq";
import Features from "./_components/features";
import Hero from "./_components/hero";
import Testimonial from "./_components/testimonial";
import Pricing from "./_components/pricing";
import { StackedCircularFooter } from "@/app/(marketing)/_components/stacked-circular-footer";
import CTA from "./_components/cta";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <Testimonial />
      <Pricing />
      <FAQ />
      <CTA />
      <StackedCircularFooter />
    </>
  );
}
