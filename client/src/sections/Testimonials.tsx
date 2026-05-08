"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

interface Testimonial {
  name: string;
  role: string;
  avatar: string;
  quote: string;
  rating: number;
  item: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Aarav Mehta",
    role: "CS Senior · MIT",
    avatar: "AM",
    quote:
      "Lost my AirPods in the library during finals week. CampusTrace matched them in under 3 minutes. Genuinely blown away.",
    rating: 5,
    item: "AirPods Pro",
  },
  {
    name: "Sarah Chen",
    role: "Bio Junior · Stanford",
    avatar: "SC",
    quote:
      "Someone found my charger and reported it. I got a notification before I even realized it was missing. The AI matching is scary good.",
    rating: 5,
    item: "MacBook Charger",
  },
  {
    name: "James Okonkwo",
    role: "Design Sophomore · RISD",
    avatar: "JO",
    quote:
      "I've returned 4 items this semester. The reputation badges make you feel like a campus hero. Love the community aspect.",
    rating: 5,
    item: "Community Hero",
  },
  {
    name: "Priya Sharma",
    role: "MBA · Wharton",
    avatar: "PS",
    quote:
      "Left my wallet in the cafeteria. Within 10 minutes someone scanned it and I got a match notification. Incredible system.",
    rating: 5,
    item: "Wallet",
  },
  {
    name: "Lucas Ferreira",
    role: "Engineering · CalTech",
    avatar: "LF",
    quote:
      "The campus map feature is genius. It showed exactly which floor my water bottle was found on. Picked it up in 5 minutes.",
    rating: 4,
    item: "Water Bottle",
  },
  {
    name: "Emily Zhang",
    role: "Pre-Med · Johns Hopkins",
    avatar: "EZ",
    quote:
      "CampusTrace has saved me hundreds of dollars. The image recognition even matched my scratched-up calculator!",
    rating: 5,
    item: "TI-84 Calculator",
  },
];

const scrollItems = [...testimonials, ...testimonials];

function TestimonialCard({ testimonial: t }: { testimonial: Testimonial }) {
  return (
    <div className="flex-shrink-0 w-[380px] md:w-[420px] glass rounded-2xl p-6 border border-white/[0.06] hover:border-white/[0.12] transition-colors duration-300 group">
      <Quote className="w-8 h-8 text-ct-indigo/20 mb-4 group-hover:text-ct-indigo/40 transition-colors duration-300" />
      <p className="text-sm text-ct-text-secondary leading-relaxed mb-6 line-clamp-4">
        &ldquo;{t.quote}&rdquo;
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ct-indigo to-ct-purple flex items-center justify-center text-xs font-bold text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            {t.avatar}
          </div>
          <div>
            <p className="text-sm font-semibold text-ct-text-primary">{t.name}</p>
            <p className="text-xs text-ct-text-muted">{t.role}</p>
          </div>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: t.rating }).map((_, j) => (
            <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          ))}
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-white/[0.06]">
        <span className="inline-block px-3 py-1 rounded-full bg-ct-indigo/10 text-[11px] font-medium text-ct-indigo">
          {t.item}
        </span>
      </div>
    </div>
  );
}

export default function Testimonials() {
  return (
    <section id="community" className="relative py-28 md:py-36 overflow-hidden">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.04) 0%, transparent 70%)" }}
      />
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full glass text-xs font-medium text-ct-text-secondary mb-6 border border-white/[0.06]">
            Loved by Students
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            <span className="text-ct-text-primary">Real stories, </span>
            <span className="bg-gradient-to-r from-ct-cyan via-ct-blue-bright to-ct-indigo bg-clip-text text-transparent">
              real reunions
            </span>
          </h2>
          <p className="mt-5 text-ct-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
            Thousands of students across campuses trust CampusTrace to find what they&apos;ve lost.
          </p>
        </motion.div>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-r from-ct-bg-deep to-transparent z-20 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-l from-ct-bg-deep to-transparent z-20 pointer-events-none" />
          <motion.div
            className="flex gap-5 mb-5"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ x: { duration: 40, repeat: Infinity, ease: "linear" } }}
          >
            {scrollItems.map((t, i) => (
              <TestimonialCard key={`r1-${i}`} testimonial={t} />
            ))}
          </motion.div>
          <motion.div
            className="flex gap-5"
            animate={{ x: ["-50%", "0%"] }}
            transition={{ x: { duration: 45, repeat: Infinity, ease: "linear" } }}
          >
            {[...scrollItems].reverse().map((t, i) => (
              <TestimonialCard key={`r2-${i}`} testimonial={t} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
