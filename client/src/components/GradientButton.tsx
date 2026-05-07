"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

interface GradientButtonProps {
  children: ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
  onClick?: () => void;
  icon?: ReactNode;
}

export default function GradientButton({
  children,
  variant = "primary",
  className = "",
  onClick,
  icon,
}: GradientButtonProps) {
  const base =
    "relative inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-medium text-sm tracking-wide transition-all duration-300 cursor-pointer select-none overflow-hidden";

  const variants = {
    primary: `
      bg-gradient-to-r from-ct-indigo via-ct-blue to-ct-purple
      text-white
      shadow-[0_4px_20px_rgba(99,102,241,0.3)]
      hover:shadow-[0_4px_30px_rgba(99,102,241,0.5)]
    `,
    ghost: `
      glass border border-white/10
      text-ct-text-secondary hover:text-ct-text-primary
      hover:border-white/20
    `,
  };

  return (
    <motion.button
      className={`${base} ${variants[variant]} ${className}`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
    >
      {/* Shimmer overlay for primary */}
      {variant === "primary" && (
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none" />
      )}
      {icon && <span className="relative z-10">{icon}</span>}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
