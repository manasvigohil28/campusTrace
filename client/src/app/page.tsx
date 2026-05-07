import Navbar from "@/components/Navbar";
import Hero from "@/sections/Hero";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <Navbar />
      <Hero />
    </main>
  );
}