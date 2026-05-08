"use client";

import { motion } from "framer-motion";
import {
  ScanEye,
  BellRing,
  Map,
  ShieldCheck,
  Star,
  Globe,
} from "lucide-react";
import GlassCard from "@/components/GlassCard";

const features = [
  {
    icon: ScanEye,
    title: "AI Image Matching",
    description:
      "Upload a photo and our vision AI scans every found-item report to surface visual matches — even partial ones.",
    accent: "blue" as const,
    iconColor: "text-ct-blue-bright",
    iconBg: "bg-ct-blue/10",
    span: "md:col-span-2",
  },
  {
    icon: BellRing,
    title: "Real-Time Alerts",
    description:
      "Get instant push notifications the moment a potential match is found. Never miss a recovery window.",
    accent: "purple" as const,
    iconColor: "text-ct-purple",
    iconBg: "bg-ct-purple/10",
    span: "",
  },
  {
    icon: Map,
    title: "Campus Map",
    description:
      "See exactly where items were lost or found with interactive campus maps and building-level precision.",
    accent: "cyan" as const,
    iconColor: "text-ct-cyan",
    iconBg: "bg-ct-cyan/10",
    span: "",
  },
  {
    icon: ShieldCheck,
    title: "Secure Handoff",
    description:
      "Coordinate verified pickups through our campus security integration. Both parties stay safe and anonymous until handoff.",
    accent: "blue" as const,
    iconColor: "text-ct-blue-bright",
    iconBg: "bg-ct-blue/10",
    span: "md:col-span-2",
  },
  {
    icon: Star,
    title: "Reputation System",
    description:
      "Build campus karma by returning items. Top helpers earn badges and recognition on the community leaderboard.",
    accent: "purple" as const,
    iconColor: "text-ct-purple",
    iconBg: "bg-ct-purple/10",
    span: "",
  },
  {
    icon: Globe,
    title: "Multi-Campus Network",
    description:
      "Connected across universities. Lost it at one campus but found at another? CampusTrace bridges the gap.",
    accent: "cyan" as const,
    iconColor: "text-ct-cyan",
    iconBg: "bg-ct-cyan/10",
    span: "",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function Features() {
  return (
    <section id="features" className="relative py-28 md:py-36 overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(34, 211, 238, 0.04) 0%, transparent 70%)",
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
            Powerful Features
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            <span className="text-ct-text-primary">Everything you need,</span>
            <br />
            <span className="bg-gradient-to-r from-ct-purple via-ct-indigo to-ct-cyan bg-clip-text text-transparent">
              nothing you don&apos;t
            </span>
          </h2>
          <p className="mt-5 text-ct-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
            Built with cutting-edge AI and designed for the campus experience.
            Every feature exists to get your stuff back faster.
          </p>
        </motion.div>

        {/* Bento grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                variants={itemVariants}
                className={feature.span}
              >
                <GlassCard
                  className="relative p-8 h-full group overflow-hidden"
                  glow={feature.accent}
                >
                  {/* Hover gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

                  <div className="relative z-10">
                    {/* Icon */}
                    <div
                      className={`w-12 h-12 rounded-xl ${feature.iconBg} border border-white/[0.06] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className={`w-5.5 h-5.5 ${feature.iconColor}`} />
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-bold text-ct-text-primary mb-2.5">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-ct-text-secondary leading-relaxed">
                      {feature.description}
                    </p>
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
