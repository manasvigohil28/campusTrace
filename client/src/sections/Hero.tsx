"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Sparkles, ArrowRight, MapPin, Shield, Zap } from "lucide-react";
import GlowingBlobs from "@/animations/GlowingBlobs";
import FloatingParticles from "@/animations/FloatingParticles";
import FloatingItemCards from "@/components/FloatingItemCards";
import GradientButton from "@/components/GradientButton";

/* ── Animation variants ─────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.3 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 1.2 },
  },
};

/* ── Stat pills ─────────────────────────────────────────────── */
const stats = [
  { icon: MapPin, value: "2,400+", label: "Items Recovered" },
  { icon: Shield, value: "98%", label: "Match Accuracy" },
  { icon: Zap, value: "<5min", label: "Avg. Match Time" },
];

/* ── Component ──────────────────────────────────────────────── */
export default function Hero() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    } else {
      router.push("/search");
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background layers */}
      <GlowingBlobs />
      <FloatingParticles count={25} />
      <FloatingItemCards />

      {/* Radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 40%, transparent, var(--ct-bg-deep))",
        }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 max-w-5xl mx-auto px-6 pt-32 pb-20 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div variants={fadeUp} className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/[0.06] text-xs font-medium text-ct-text-secondary">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ct-cyan opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-ct-cyan" />
            </span>
            AI-Powered Lost &amp; Found for Modern Campuses
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05]"
        >
          <span className="block text-ct-text-primary">
            Find What
          </span>
          <span className="block mt-2 bg-gradient-to-r from-ct-blue-bright via-ct-indigo to-ct-purple bg-clip-text text-transparent animate-gradient">
            Matters.
          </span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          variants={fadeUp}
          className="mt-6 md:mt-8 text-lg md:text-xl text-ct-text-secondary max-w-2xl mx-auto leading-relaxed"
        >
          Lost something on campus? Found something? <br className="hidden sm:inline" />
          Let <span className="text-ct-text-primary font-bold">CampusTrace</span> connect people securely.
        </motion.p>

        {/* Search bar */}
        <motion.div variants={fadeUp} className="mt-10 md:mt-12 max-w-2xl mx-auto">
          <form onSubmit={handleSearch} className="relative group">
            {/* Outer glow ring */}
            <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-ct-blue/30 via-ct-purple/20 to-ct-cyan/30 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500 blur-sm" />

            <div className="relative flex items-center gap-3 px-5 py-4 rounded-2xl glass-strong border border-white/[0.06] group-hover:border-white/[0.1] group-focus-within:border-ct-indigo/30 transition-all duration-300">
              <Search className="w-5 h-5 text-ct-text-muted flex-shrink-0" />
              <input
                type="text"
                placeholder="Search for your lost item..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-ct-text-primary placeholder:text-ct-text-muted text-sm md:text-base outline-none"
                suppressHydrationWarning={true}
              />
              <motion.button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-ct-indigo to-ct-blue text-white text-sm font-medium shadow-[0_4px_15px_rgba(99,102,241,0.25)] hover:shadow-[0_4px_25px_rgba(99,102,241,0.4)] transition-shadow duration-300 cursor-pointer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                suppressHydrationWarning={true}
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">AI Search</span>
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          variants={fadeUp}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/report-lost">
            <GradientButton
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Report Lost
            </GradientButton>
          </Link>
          <Link href="/report-found">
            <GradientButton variant="ghost">
              Report Found
            </GradientButton>
          </Link>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          variants={fadeIn}
          className="mt-16 flex flex-col items-center gap-2"
        >
          <span className="text-[11px] uppercase tracking-[0.2em] text-ct-text-muted">
            Scroll to explore
          </span>
          <motion.div
            className="w-5 h-8 rounded-full border border-white/[0.12] flex items-start justify-center p-1.5"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className="w-1 h-1 rounded-full bg-ct-text-secondary"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
