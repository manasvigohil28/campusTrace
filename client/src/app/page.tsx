import Navbar from "@/components/Navbar";
import Hero from "@/sections/Hero";
import HowItWorks from "@/sections/HowItWorks";
import Features from "@/sections/Features";
import Testimonials from "@/sections/Testimonials";
import CTA from "@/sections/CTA";
import Footer from "@/sections/Footer";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  );
}