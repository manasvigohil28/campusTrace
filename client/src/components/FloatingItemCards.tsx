"use client";

import { motion } from "framer-motion";
import { Headphones, Key, Laptop, BookOpen, Wallet, Watch } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface FloatingItem {
  icon: LucideIcon;
  label: string;
  color: string;
  glow: string;
  position: string;
  delay: number;
  duration: number;
}

const items: FloatingItem[] = [
  {
    icon: Headphones,
    label: "AirPods Pro",
    color: "from-blue-500/20 to-indigo-500/20",
    glow: "shadow-[0_0_25px_rgba(59,130,246,0.2)]",
    position: "top-[18%] left-[8%]",
    delay: 0,
    duration: 6,
  },
  {
    icon: Key,
    label: "Dorm Keys",
    color: "from-amber-500/20 to-orange-500/20",
    glow: "shadow-[0_0_25px_rgba(245,158,11,0.15)]",
    position: "top-[12%] right-[10%]",
    delay: 1.5,
    duration: 7,
  },
  {
    icon: Laptop,
    label: "MacBook Air",
    color: "from-purple-500/20 to-pink-500/20",
    glow: "shadow-[0_0_25px_rgba(139,92,246,0.2)]",
    position: "bottom-[22%] left-[5%]",
    delay: 0.8,
    duration: 8,
  },
  {
    icon: BookOpen,
    label: "Textbook",
    color: "from-emerald-500/20 to-teal-500/20",
    glow: "shadow-[0_0_25px_rgba(16,185,129,0.15)]",
    position: "bottom-[30%] right-[7%]",
    delay: 2,
    duration: 6.5,
  },
  {
    icon: Wallet,
    label: "Wallet",
    color: "from-rose-500/20 to-red-500/20",
    glow: "shadow-[0_0_25px_rgba(244,63,94,0.15)]",
    position: "top-[45%] left-[2%]",
    delay: 3,
    duration: 7.5,
  },
  {
    icon: Watch,
    label: "Smart Watch",
    color: "from-cyan-500/20 to-blue-500/20",
    glow: "shadow-[0_0_25px_rgba(34,211,238,0.15)]",
    position: "top-[50%] right-[3%]",
    delay: 1,
    duration: 6.8,
  },
];

export default function FloatingItemCards() {
  return (
    <div className="absolute inset-0 pointer-events-none hidden lg:block" aria-hidden="true">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={i}
            className={`absolute ${item.position}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 1 + item.delay * 0.5,
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <motion.div
              className={`
                flex items-center gap-3 px-4 py-3 rounded-2xl
                glass border border-white/[0.06]
                bg-gradient-to-br ${item.color}
                ${item.glow}
              `}
              animate={{
                y: [0, -15, 5, -8, 0],
                rotate: [0, 1, -1, 0.5, 0],
              }}
              transition={{
                duration: item.duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: item.delay,
              }}
            >
              <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center">
                <Icon className="w-4.5 h-4.5 text-ct-text-secondary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-ct-text-primary">{item.label}</p>
                <p className="text-[10px] text-ct-text-muted">Lost · 2h ago</p>
              </div>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
