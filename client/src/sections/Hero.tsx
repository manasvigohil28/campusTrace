"use client";

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
            Lost something
          </span>
          <span className="block mt-2 bg-gradient-to-r from-ct-blue-bright via-ct-indigo to-ct-purple bg-clip-text text-transparent animate-gradient">
            on campus?
          </span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          variants={fadeUp}
          className="mt-6 md:mt-8 text-lg md:text-xl text-ct-text-secondary max-w-2xl mx-auto leading-relaxed"
        >
          We help it find its way back.{" "}
          <span className="text-ct-text-primary font-medium">CampusTrace</span>{" "}
          uses smart AI matching to reconnect you with your belongings — fast,
          secure, and community-driven.
        </motion.p>

        {/* Search bar */}
        <motion.div variants={fadeUp} className="mt-10 md:mt-12 max-w-2xl mx-auto">
          <div className="relative group">
            {/* Outer glow ring */}
            <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-ct-blue/30 via-ct-purple/20 to-ct-cyan/30 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500 blur-sm" />

            <div className="relative flex items-center gap-3 px-5 py-4 rounded-2xl glass-strong border border-white/[0.06] group-hover:border-white/[0.1] group-focus-within:border-ct-indigo/30 transition-all duration-300">
              <Search className="w-5 h-5 text-ct-text-muted flex-shrink-0" />
              <input
                type="text"
                placeholder="Search for your lost item..."
                className="flex-1 bg-transparent text-ct-text-primary placeholder:text-ct-text-muted text-sm md:text-base outline-none"
              />
              <motion.button
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-ct-indigo to-ct-blue text-white text-sm font-medium shadow-[0_4px_15px_rgba(99,102,241,0.25)] hover:shadow-[0_4px_25px_rgba(99,102,241,0.4)] transition-shadow duration-300 cursor-pointer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">AI Search</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          variants={fadeUp}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <GradientButton
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Report Lost Item
          </GradientButton>
          <GradientButton variant="ghost">
            I Found Something
          </GradientButton>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={fadeUp}
          className="mt-16 md:mt-20 flex flex-wrap items-center justify-center gap-8 md:gap-12"
        >
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                className="flex items-center gap-3 group cursor-default"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:border-ct-indigo/20 transition-colors duration-300">
                  <Icon className="w-4.5 h-4.5 text-ct-indigo" />
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-ct-text-primary text-glow-blue">
                    {stat.value}
                  </p>
                  <p className="text-xs text-ct-text-muted">{stat.label}</p>
                </div>
              </motion.div>
            );
          })}
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
