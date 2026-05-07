"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { type ReactNode } from "react";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: "blue" | "purple" | "cyan" | "none";
}

const glowStyles = {
  blue: "hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]",
  purple: "hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]",
  cyan: "hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]",
  none: "",
};

export default function GlassCard({
  children,
  className = "",
  hover = true,
  glow = "blue",
  ...props
}: GlassCardProps) {
  return (
    <motion.div
      className={`
        glass rounded-2xl
        transition-shadow duration-500
        ${glowStyles[glow]}
        ${className}
      `}
      whileHover={hover ? { y: -4, transition: { duration: 0.3 } } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
}
