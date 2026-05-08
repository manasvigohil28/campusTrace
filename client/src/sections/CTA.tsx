"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import GradientButton from "@/components/GradientButton";

export default function CTA() {
  return (
    <section className="relative py-28 md:py-36 overflow-hidden">
      {/* Glow backgrounds */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute bottom-0 left-1/4 w-[400px] h-[400px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-10 right-1/4 w-[300px] h-[300px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Badge */}
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-medium text-ct-text-secondary mb-8 border border-white/[0.06]">
            <Sparkles className="w-3.5 h-3.5 text-ct-cyan" />
            Join 50+ Campuses
          </span>

          {/* Headline */}
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
            <span className="text-ct-text-primary">Never lose</span>
            <br />
            <span className="bg-gradient-to-r from-ct-blue-bright via-ct-purple to-ct-cyan bg-clip-text text-transparent animate-gradient">
              what matters
            </span>
          </h2>

          <p className="mt-6 text-lg md:text-xl text-ct-text-secondary max-w-2xl mx-auto leading-relaxed">
            Whether you lost your laptop or found someone&apos;s keys — CampusTrace
            connects the dots. Start using it on your campus today.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <GradientButton icon={<ArrowRight className="w-4 h-4" />}>
              Report Lost Item
            </GradientButton>
            <GradientButton variant="ghost">
              I Found Something
            </GradientButton>
          </div>

          {/* Trust line */}
          <p className="mt-8 text-xs text-ct-text-muted">
            Free for all students · No sign-up required to browse · Verified campus network
          </p>
        </motion.div>
      </div>
    </section>
  );
}
