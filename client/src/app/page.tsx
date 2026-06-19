import Navbar from "@/components/Navbar";
import Hero from "@/sections/Hero";
import LiveActivity from "@/sections/LiveActivity";
import HowVerificationWorks from "@/sections/HowVerificationWorks";
import SuccessStories from "@/sections/SuccessStories";
import CTA from "@/sections/CTA";
import Footer from "@/sections/Footer";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <Navbar />
      <Hero />
      <LiveActivity />
      <HowVerificationWorks />
      <SuccessStories />
      <CTA />
      <Footer />
    </main>
  );
}