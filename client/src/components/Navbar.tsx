"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Menu, X, Sparkles } from "lucide-react";
import GradientButton from "./GradientButton";

const navLinks = [
  { label: "Home", href: "#" },
  { label: "How it Works", href: "#how" },
  { label: "Features", href: "#features" },
  { label: "Community", href: "#community" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.header
        className={`
          fixed top-0 left-0 right-0 z-50
          transition-all duration-500
          ${scrolled
            ? "glass-strong py-3 shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
            : "py-5 bg-transparent"
          }
        `}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <nav className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <motion.a
            href="#"
            className="flex items-center gap-2.5 group"
            whileHover={{ scale: 1.02 }}
          >
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-ct-indigo to-ct-cyan flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)] group-hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-shadow duration-300">
              <MapPin className="w-5 h-5 text-white" strokeWidth={2.5} />
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-ct-cyan animate-pulse" />
            </div>
            <span className="text-lg font-bold tracking-tight text-ct-text-primary">
              Campus<span className="bg-gradient-to-r from-ct-blue-bright to-ct-cyan bg-clip-text text-transparent">Trace</span>
            </span>
          </motion.a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <motion.a
                key={link.label}
                href={link.href}
                className="relative px-4 py-2 text-sm text-ct-text-secondary hover:text-ct-text-primary transition-colors duration-300 rounded-lg group"
                whileHover={{ scale: 1.04 }}
              >
                <span className="relative z-10">{link.label}</span>
                <motion.span
                  className="absolute inset-0 rounded-lg bg-white/[0.04]"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              </motion.a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <motion.button
              className="p-2.5 rounded-xl text-ct-text-secondary hover:text-ct-text-primary hover:bg-white/[0.04] transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Search className="w-4.5 h-4.5" />
            </motion.button>

            <GradientButton icon={<Sparkles className="w-4 h-4" />}>
              Report Item
            </GradientButton>
          </div>

          {/* Mobile burger */}
          <motion.button
            className="md:hidden p-2 rounded-xl text-ct-text-secondary hover:text-ct-text-primary transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            whileTap={{ scale: 0.9 }}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </motion.button>
        </nav>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-ct-bg-deep/90 backdrop-blur-xl" onClick={() => setMobileOpen(false)} />
            <motion.div
              className="absolute top-20 left-4 right-4 glass-strong rounded-2xl p-6 flex flex-col gap-2"
              initial={{ y: -20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  className="px-4 py-3 rounded-xl text-ct-text-secondary hover:text-ct-text-primary hover:bg-white/[0.04] transition-all duration-200 text-sm font-medium"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.05 * i }}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </motion.a>
              ))}
              <div className="mt-3 pt-3 border-t border-white/[0.06]">
                <GradientButton className="w-full justify-center" icon={<Sparkles className="w-4 h-4" />}>
                  Report Item
                </GradientButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
