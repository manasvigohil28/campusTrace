"use client";

import { motion } from "framer-motion";
import { Laptop, Wallet, CreditCard, CheckCircle, Heart } from "lucide-react";

const stories = [
  {
    icon: Laptop,
    itemTitle: "Returned MacBook Pro M1",
    location: "Engineering Hall",
    description: "Lost during midterms. The finder listed it with matching serial code parameters. The owner submitted proof within 40 minutes, matching the sticker details precisely.",
    time: "40 Minutes to Match",
    color: "text-ct-blue-bright",
    bg: "bg-ct-blue/10",
  },
  {
    icon: Wallet,
    itemTitle: "Returned Leather Wallet",
    location: "Student Center Plaza",
    description: "Found with cash and credit cards intact. The owner verified the wallet's contents ('2 transit cards, a gym pass, and a family photo') which matched the finder's hidden logs perfectly.",
    time: "2 Hours to Return",
    color: "text-ct-purple",
    bg: "bg-ct-purple/10",
  },
  {
    icon: CreditCard,
    itemTitle: "Returned Student ID & Keys",
    location: "Campus Recreation Center",
    description: "ID card and gym locker key ring lost near the basketball courts. The matchmaking engine linked it automatically to a found report, notifying the student in minutes.",
    time: "15 Minutes to Match",
    color: "text-ct-cyan",
    bg: "bg-ct-cyan/10",
  }
];

export default function SuccessStories() {
  return (
    <section className="relative py-28 bg-ct-bg-surface overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-10 right-10 w-[250px] h-[250px] bg-ct-purple/5 blur-[90px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-ct-cyan/5 blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-20">
          <span className="inline-block px-3 py-1 rounded-full glass border border-white/[0.06] text-[10px] font-bold uppercase tracking-widest text-ct-text-secondary mb-3">
            Community Outcomes
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-ct-text-primary leading-tight">
            Campus <span className="bg-gradient-to-r from-green-400 to-ct-cyan bg-clip-text text-transparent">Success</span> Stories
          </h2>
          <p className="mt-4 text-ct-text-secondary text-sm max-w-xl mx-auto leading-relaxed">
            Reconnecting students, one lost item at a time. Here are some of the hundreds of secure recoveries coordinates on CampusTrace.
          </p>
        </div>

        {/* Stories Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stories.map((story, index) => {
            const Icon = story.icon;
            return (
              <motion.div
                key={index}
                className="glass-strong rounded-3xl p-6 border border-white/[0.06] hover:border-white/[0.1] transition-all duration-300 flex flex-col justify-between shadow-lg relative group overflow-hidden"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {/* Visual hover effect line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-ct-indigo via-ct-blue to-ct-cyan opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 rounded-2xl ${story.bg} border border-white/[0.05] flex items-center justify-center`}>
                      <Icon className={`w-5.5 h-5.5 ${story.color}`} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-400 flex items-center gap-1 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Returned
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-ct-text-primary mb-1">
                    {story.itemTitle}
                  </h3>
                  <span className="text-[10px] text-ct-text-muted block mb-4">
                    Found at: {story.location}
                  </span>
                  
                  <p className="text-xs text-ct-text-secondary leading-relaxed mb-6 font-sans">
                    {story.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/[0.04] flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-ct-text-primary flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400/20" />
                    Verified Return
                  </span>
                  <span className="text-ct-cyan font-medium">{story.time}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
