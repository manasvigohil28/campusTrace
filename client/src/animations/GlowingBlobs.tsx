"use client";

import { motion } from "framer-motion";

interface BlobConfig {
  colors: string;
  size: string;
  position: string;
  duration: number;
  delay: number;
}

const blobs: BlobConfig[] = [
  {
    colors: "from-ct-blue/30 via-ct-indigo/20 to-transparent",
    size: "w-[600px] h-[600px] md:w-[800px] md:h-[800px]",
    position: "-top-40 -left-40",
    duration: 20,
    delay: 0,
  },
  {
    colors: "from-ct-purple/25 via-ct-blue/15 to-transparent",
    size: "w-[500px] h-[500px] md:w-[700px] md:h-[700px]",
    position: "top-1/4 -right-32",
    duration: 25,
    delay: 2,
  },
  {
    colors: "from-ct-cyan/20 via-ct-purple/10 to-transparent",
    size: "w-[400px] h-[400px] md:w-[600px] md:h-[600px]",
    position: "bottom-0 left-1/3",
    duration: 22,
    delay: 4,
  },
];

export default function GlowingBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {blobs.map((blob, i) => (
        <motion.div
          key={i}
          className={`absolute ${blob.size} ${blob.position} rounded-full bg-gradient-radial ${blob.colors} blur-3xl`}
          style={{
            background: `radial-gradient(circle, ${getGradientColors(blob.colors)})`,
            filter: "blur(80px)",
          }}
          animate={{
            x: [0, 30, -20, 10, 0],
            y: [0, -25, 15, -10, 0],
            scale: [1, 1.1, 0.95, 1.05, 1],
            opacity: [0.4, 0.6, 0.35, 0.55, 0.4],
          }}
          transition={{
            duration: blob.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: blob.delay,
          }}
        />
      ))}

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}

function getGradientColors(classes: string): string {
  const colorMap: Record<string, string> = {
    "ct-blue/30": "rgba(59, 130, 246, 0.3)",
    "ct-blue/15": "rgba(59, 130, 246, 0.15)",
    "ct-indigo/20": "rgba(99, 102, 241, 0.2)",
    "ct-purple/25": "rgba(139, 92, 246, 0.25)",
    "ct-purple/10": "rgba(139, 92, 246, 0.1)",
    "ct-cyan/20": "rgba(34, 211, 238, 0.2)",
  };

  const parts = classes.split(" ");
  const colors: string[] = [];
  for (const p of parts) {
    const key = p.replace(/^(from-|via-|to-)/, "");
    if (key === "transparent") {
      colors.push("transparent");
    } else if (colorMap[key]) {
      colors.push(colorMap[key]);
    }
  }
  return colors.join(", ");
}
