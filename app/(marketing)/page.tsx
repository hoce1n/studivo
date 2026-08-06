import { Navbar } from "./_components/navbar";
import FAQ from "./_components/faq";
import Features from "./_components/features";
import Hero from "./_components/hero";
import Testimonial from "./_components/testimonial";
import Pricing from "./_components/pricing";
import { StackedCircularFooter } from "@/app/(marketing)/_components/stacked-circular-footer";
import CTA from "./_components/cta";

// const cardNavItems = [
//   {
//     label: "About",
//     bgColor: "#1B1722",
//     textColor: "#fff",
//     links: [
//       { label: "Company", href: "/#features", ariaLabel: "About Company" },
//       { label: "Careers", href: "/#testimonials", ariaLabel: "About Careers" },
//     ],
//   },
//   {
//     label: "Projects",
//     bgColor: "#2F293A",
//     textColor: "#fff",
//     links: [
//       { label: "Featured", href: "/#pricing", ariaLabel: "Featured Projects" },
//       { label: "Case Studies", href: "/#faq", ariaLabel: "Project Case Studies" },
//     ],
//   },
//   {
//     label: "Contact",
//     bgColor: "#2F293A",
//     textColor: "#fff",
//     links: [
//       { label: "Email", href: "mailto:hello@studivo.app", ariaLabel: "Email us" },
//       { label: "Twitter", href: "https://twitter.com", ariaLabel: "Twitter" },
//       { label: "LinkedIn", href: "https://linkedin.com", ariaLabel: "LinkedIn" },
//     ],
//   },
// ];

export default function Home() {
  return (
    <>
      <Navbar />
      {/* <CardNav
        logo="/studivo.svg"
        logoAlt="Studivo logo"
        items={cardNavItems}
        baseColor="#f8fafc"
        menuColor="#111"
        buttonBgColor="#111"
        buttonTextColor="#fff"
        ease="power3.out"
      /> */}
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
