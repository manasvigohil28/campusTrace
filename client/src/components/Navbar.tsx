"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Menu, X, Sparkles, LogOut, User as UserIcon, ShieldAlert, Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import GradientButton from "./GradientButton";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, token, logout } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!user || !token) return;
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [user, token, API_URL]);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`${API_URL}/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (n: any) => {
    await markAsRead(n._id);
    setNotificationsOpen(false);
    if (n.type === "claim_received" || n.type === "claim_approved" || n.type === "claim_rejected") {
      router.push("/dashboard");
    } else if (n.relatedItemId) {
      router.push(`/item/${n.relatedItemId}`);
    }
  };

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
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-ct-indigo to-ct-cyan flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)] group-hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-shadow duration-300">
              <MapPin className="w-5 h-5 text-white" strokeWidth={2.5} />
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-ct-cyan animate-pulse" />
            </div>
            <span className="text-lg font-bold tracking-tight text-ct-text-primary">
              Campus<span className="bg-gradient-to-r from-ct-blue-bright to-ct-cyan bg-clip-text text-transparent">Trace</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className="relative px-4 py-2 text-sm text-ct-text-secondary hover:text-ct-text-primary transition-colors duration-300 rounded-lg"
            >
              Home
            </Link>
            
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="relative px-4 py-2 text-sm text-ct-text-secondary hover:text-ct-text-primary transition-colors duration-300 rounded-lg"
                >
                  Dashboard
                </Link>
                <Link
                  href="/search"
                  className="relative px-4 py-2 text-sm text-ct-text-secondary hover:text-ct-text-primary transition-colors duration-300 rounded-lg"
                >
                  Search Database
                </Link>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="relative px-4 py-2 text-sm text-ct-blue-bright hover:text-ct-cyan transition-colors duration-300 rounded-lg flex items-center gap-1.5"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Admin Panel
                  </Link>
                )}
              </>
            ) : (
              <a
                href="#features"
                className="relative px-4 py-2 text-sm text-ct-text-secondary hover:text-ct-text-primary transition-colors duration-300 rounded-lg"
              >
                Features
              </a>
            )}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link href="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.05] text-xs text-ct-text-secondary hover:text-ct-text-primary hover:bg-white/[0.06] transition-all duration-300">
                  <UserIcon className="w-3.5 h-3.5 text-ct-cyan" />
                  <span>{user.name}</span>
                </Link>

                {/* Notifications dropdown bell */}
                <div className="relative">
                  <motion.button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="p-2.5 rounded-xl text-ct-text-secondary hover:text-ct-text-primary hover:bg-white/[0.04] transition-all duration-300 cursor-pointer relative"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Bell className="w-4.5 h-4.5" />
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] font-black text-white flex items-center justify-center animate-pulse">
                        {notifications.filter(n => !n.read).length}
                      </span>
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {notificationsOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setNotificationsOpen(false)} />
                        <motion.div
                          className="absolute right-0 mt-3 w-80 glass-strong rounded-2xl border border-white/[0.08] shadow-2xl p-4 z-40 max-h-[350px] flex flex-col"
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-white/[0.05] mb-2 flex-shrink-0">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-ct-text-primary">Notifications</h4>
                            {notifications.some(n => !n.read) && (
                              <button
                                onClick={markAllAsRead}
                                className="text-[9px] text-ct-blue-bright hover:underline cursor-pointer"
                              >
                                Mark all as read
                              </button>
                            )}
                          </div>

                          <div className="overflow-y-auto flex-1 space-y-1.5 pr-1 text-left custom-scrollbar">
                            {notifications.length === 0 ? (
                              <div className="py-8 text-center text-[10px] text-ct-text-muted">
                                No notifications yet.
                              </div>
                            ) : (
                              notifications.map(n => (
                                <div
                                  key={n._id}
                                  onClick={() => handleNotificationClick(n)}
                                  className={`p-2.5 rounded-xl border text-[11px] transition-all cursor-pointer ${
                                    n.read
                                      ? "bg-transparent border-transparent text-ct-text-secondary hover:bg-white/[0.02]"
                                      : "bg-white/[0.03] border-white/[0.06] text-ct-text-primary hover:bg-white/[0.05]"
                                  }`}
                                >
                                  <p className="leading-normal font-medium">{n.message}</p>
                                  <span className="text-[8px] text-ct-text-muted mt-1 block">
                                    {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <Link href="/report-lost">
                  <GradientButton className="text-xs py-2 px-3" icon={<Sparkles className="w-3.5 h-3.5" />}>
                    Report Lost
                  </GradientButton>
                </Link>
                <Link href="/report-found">
                  <GradientButton className="text-xs py-2 px-3" variant="ghost">
                    Report Found
                  </GradientButton>
                </Link>
                <motion.button
                  onClick={logout}
                  className="p-2.5 rounded-xl text-ct-text-secondary hover:text-red-400 hover:bg-red-500/[0.05] transition-all duration-300 cursor-pointer"
                  title="Sign Out"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LogOut className="w-4.5 h-4.5" />
                </motion.button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <motion.button
                    className="px-4 py-2 text-sm text-ct-text-secondary hover:text-ct-text-primary transition-colors cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                  >
                    Sign In
                  </motion.button>
                </Link>
                <Link href="/register">
                  <GradientButton icon={<Sparkles className="w-4 h-4" />}>
                    Register
                  </GradientButton>
                </Link>
              </>
            )}
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
              <Link
                href="/"
                className="px-4 py-3 rounded-xl text-ct-text-secondary hover:text-ct-text-primary hover:bg-white/[0.04] transition-all duration-200 text-sm font-medium"
                onClick={() => setMobileOpen(false)}
              >
                Home
              </Link>
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="px-4 py-3 rounded-xl text-ct-text-secondary hover:text-ct-text-primary hover:bg-white/[0.04] transition-all duration-200 text-sm font-medium"
                    onClick={() => setMobileOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/search"
                    className="px-4 py-3 rounded-xl text-ct-text-secondary hover:text-ct-text-primary hover:bg-white/[0.04] transition-all duration-200 text-sm font-medium"
                    onClick={() => setMobileOpen(false)}
                  >
                    Search Database
                  </Link>
                  <Link
                    href="/profile"
                    className="px-4 py-3 rounded-xl text-ct-text-secondary hover:text-ct-text-primary hover:bg-white/[0.04] transition-all duration-200 text-sm font-medium flex items-center gap-2"
                    onClick={() => setMobileOpen(false)}
                  >
                    <UserIcon className="w-4 h-4 text-ct-cyan" />
                    <span>My Profile</span>
                  </Link>
                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      className="px-4 py-3 rounded-xl text-ct-blue-bright hover:text-ct-cyan hover:bg-white/[0.04] transition-all duration-200 text-sm font-medium"
                      onClick={() => setMobileOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <div className="mt-3 pt-3 border-t border-white/[0.06] flex flex-col gap-2">
                    <Link href="/report-lost" onClick={() => setMobileOpen(false)} className="w-full">
                      <GradientButton className="w-full justify-center text-xs" icon={<Sparkles className="w-4 h-4" />}>
                        Report Lost
                      </GradientButton>
                    </Link>
                    <Link href="/report-found" onClick={() => setMobileOpen(false)} className="w-full">
                      <GradientButton className="w-full justify-center text-xs" variant="ghost">
                        Report Found
                      </GradientButton>
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMobileOpen(false);
                      }}
                      className="w-full py-3 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/5 text-sm font-medium transition-all"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <div className="mt-3 pt-3 border-t border-white/[0.06] flex flex-col gap-2">
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="w-full">
                    <button className="w-full py-3 rounded-xl border border-white/10 text-ct-text-primary text-sm font-medium hover:bg-white/5 transition-all">
                      Sign In
                    </button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)} className="w-full">
                    <GradientButton className="w-full justify-center text-xs" icon={<Sparkles className="w-4 h-4" />}>
                      Register
                    </GradientButton>
                  </Link>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

