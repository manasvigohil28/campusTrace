"use client";

import { motion } from "framer-motion";
import { UploadCloud, FileSearch, Cpu, CheckCircle2 } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: UploadCloud,
    title: "Finder Uploads",
    description: "Finder lists the found item, uploading an image and answering verification parameters (brand, secret contents, color) which remain completely hidden from the public database.",
    color: "text-ct-blue-bright",
    bg: "bg-ct-blue/10",
    border: "group-hover:border-ct-blue/30"
  },
  {
    number: "02",
    icon: FileSearch,
    title: "Owner Submits Proof",
    description: "If a student spots their lost item in the public registry, they click Claim and answer the questionnaire prepared by the finder to verify ownership.",
    color: "text-ct-purple",
    bg: "bg-ct-purple/10",
    border: "group-hover:border-ct-purple/30"
  },
  {
    number: "03",
    icon: Cpu,
    title: "AI Verifies Ownership",
    description: "Our verification engine compares the owner's answers side-by-side with the finder's details, scoring keywords and calculating a similarity match index.",
    color: "text-ct-cyan",
    bg: "bg-ct-cyan/10",
    border: "group-hover:border-ct-cyan/30"
  },
  {
    number: "04",
    icon: CheckCircle2,
    title: "Safe Return",
    description: "Once verified, both students can coordinate the handoff safely (or drop it at Campus Security). The item's status updates to Returned.",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "group-hover:border-green-500/30"
  }
];

export default function HowVerificationWorks() {
  return (
    <section className="relative py-28 bg-ct-bg-deep overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-ct-indigo/5 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-20">
          <span className="inline-block px-3 py-1 rounded-full glass border border-white/[0.06] text-[10px] font-bold uppercase tracking-widest text-ct-text-secondary mb-3">
            Secure Process
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-ct-text-primary leading-tight">
            How Ownership <span className="bg-gradient-to-r from-ct-indigo via-ct-purple to-ct-cyan bg-clip-text text-transparent animate-gradient">Verification</span> Works
          </h2>
          <p className="mt-4 text-ct-text-secondary text-sm max-w-xl mx-auto leading-relaxed">
            CampusTrace protects students by using an end-to-end question matching database. No public claims without verified details.
          </p>
        </div>

        {/* Grid Step Flow */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                className="glass rounded-2xl p-6 border border-white/[0.04] relative group hover:bg-white/[0.01] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
              >
                {/* Background glow hover border */}
                <div className={`absolute inset-0 rounded-2xl border border-transparent transition-colors duration-500 pointer-events-none ${step.border}`} />

                <div>
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 rounded-xl ${step.bg} border border-white/[0.05] flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-5.5 h-5.5 ${step.color}`} />
                    </div>
                    <span className="text-2xl font-black text-white/5 group-hover:text-white/10 transition-colors">
                      {step.number}
                    </span>
                  </div>

                  {/* Title & description */}
                  <h3 className="text-base font-extrabold text-ct-text-primary mb-3">
                    {step.title}
                  </h3>
                  <p className="text-xs text-ct-text-secondary leading-relaxed font-sans">
                    {step.description}
                  </p>
                </div>

                {/* Arrow Connector on desktop */}
                {index < 3 && (
                  <div className="hidden lg:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 text-white/10 group-hover:text-ct-cyan/30 transition-colors font-mono text-lg font-bold pointer-events-none">
                    ⟶
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
