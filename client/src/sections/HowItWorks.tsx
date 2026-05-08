"use client";

import { motion } from "framer-motion";
import { Camera, Brain, HandshakeIcon, ArrowRight } from "lucide-react";
import GlassCard from "@/components/GlassCard";

const steps = [
  {
    number: "01",
    icon: Camera,
    title: "Report It",
    description:
      "Snap a photo or describe your lost item. Our smart form auto-categorizes and tags it for maximum visibility across your campus.",
    accent: "from-ct-blue to-ct-indigo",
    glowColor: "rgba(59, 130, 246, 0.15)",
    iconBg: "bg-ct-blue/10",
    iconColor: "text-ct-blue-bright",
  },
  {
    number: "02",
    icon: Brain,
    title: "AI Matches",
    description:
      "Our AI engine cross-references your report with found items using image recognition, text similarity, and location proximity — in seconds.",
    accent: "from-ct-purple to-ct-indigo",
    glowColor: "rgba(139, 92, 246, 0.15)",
    iconBg: "bg-ct-purple/10",
    iconColor: "text-ct-purple",
  },
  {
    number: "03",
    icon: HandshakeIcon,
    title: "Reunite",
    description:
      "Get notified when a match is found. Coordinate a secure handoff on campus through our verified pickup system. Done!",
    accent: "from-ct-cyan to-ct-blue",
    glowColor: "rgba(34, 211, 238, 0.15)",
    iconBg: "bg-ct-cyan/10",
    iconColor: "text-ct-cyan",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function HowItWorks() {
  return (
    <section
      id="how"
      className="relative py-28 md:py-36 overflow-hidden"
    >
      {/* Background accent */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full glass text-xs font-medium text-ct-text-secondary mb-6 border border-white/[0.06]">
            Simple & Fast
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            <span className="text-ct-text-primary">How </span>
            <span className="bg-gradient-to-r from-ct-blue-bright via-ct-indigo to-ct-purple bg-clip-text text-transparent">
              CampusTrace
            </span>
            <span className="text-ct-text-primary"> Works</span>
          </h2>
          <p className="mt-5 text-ct-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
            Three simple steps to reunite with your belongings. Our AI does the
            heavy lifting so you can focus on what matters.
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div key={i} variants={itemVariants} className="relative">
                {/* Connector arrow (desktop only) */}
                {i < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-4 md:-right-5 z-20 -translate-y-1/2">
                    <ArrowRight className="w-5 h-5 text-ct-text-muted/40" />
                  </div>
                )}

                <GlassCard
                  className="relative p-8 md:p-10 h-full group"
                  glow={
                    i === 0 ? "blue" : i === 1 ? "purple" : "cyan"
                  }
                >
                  {/* Step number watermark */}
                  <span className="absolute top-6 right-8 text-7xl font-black text-white/[0.03] select-none pointer-events-none">
                    {step.number}
                  </span>

                  {/* Icon */}
                  <div
                    className={`w-14 h-14 rounded-2xl ${step.iconBg} border border-white/[0.06] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className={`w-6 h-6 ${step.iconColor}`} />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-ct-text-primary mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-ct-text-secondary leading-relaxed">
                    {step.description}
                  </p>

                  {/* Bottom gradient bar */}
                  <div className="mt-8">
                    <div
                      className={`h-1 w-12 rounded-full bg-gradient-to-r ${step.accent} opacity-60 group-hover:w-20 group-hover:opacity-100 transition-all duration-500`}
                    />
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
