"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Calendar, Mail, Shield, CheckCircle, XCircle, Award, ArrowLeft, Loader2, HeartHandshake } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/sections/Footer";

export default function ProfilePage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState({
    returned: 0,
    approved: 0,
    rejected: 0,
    trustScore: 85
  });
  const [fetching, setFetching] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!token) return;

    const fetchProfileStats = async () => {
      setFetching(true);
      try {
        const res = await fetch(`${API_URL}/claims`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          const submitted = data.submitted || [];
          const received = data.received || [];

          // Returned = Approved claims on items found by current user
          const returnedCount = received.filter((c: any) => c.status === "approved").length;
          
          // Approved = Approved claims on items lost by current user (user claimed item and finder approved it)
          const approvedCount = submitted.filter((c: any) => c.status === "approved").length;
          
          // Rejected = Rejected claims on either side
          const rejectedCount = 
            submitted.filter((c: any) => c.status === "rejected").length + 
            received.filter((c: any) => c.status === "rejected").length;

          // Calculate trust score
          // Starting base is 85%. Each return adds 5%. Each approved claim adds 2%. Rejection subtracts 10%.
          const calculated = 85 + (returnedCount * 5) + (approvedCount * 2) - (rejectedCount * 10);
          const trustScore = Math.max(30, Math.min(100, calculated));

          setStats({
            returned: returnedCount,
            approved: approvedCount,
            rejected: rejectedCount,
            trustScore: trustScore
          });
        }
      } catch (err) {
        console.error("Error calculating profile stats:", err);
      } finally {
        setFetching(false);
      }
    };

    fetchProfileStats();
  }, [token, API_URL]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-ct-bg-deep flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-ct-cyan animate-spin" />
      </div>
    );
  }

  // Formatting joining date
  const joinedDate = user.id 
    ? new Date(parseInt(user.id.substring(0, 8), 16) * 1000).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    : "Recently";

  // Circular gauge calculations
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.trustScore / 100) * circumference;

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen pt-28 pb-16 px-4 md:px-8 bg-ct-bg-deep overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-ct-blue/5 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-ct-purple/5 blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Back btn */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-ct-text-secondary hover:text-ct-text-primary mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          {/* Profile Card & Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* User details left card */}
            <div className="md:col-span-1 glass-strong rounded-3xl p-6 border border-white/[0.08] flex flex-col items-center text-center shadow-xl h-fit">
              {/* Avatar placeholder */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-ct-blue to-ct-purple flex items-center justify-center shadow-lg relative group">
                <span className="text-3xl font-bold text-white uppercase">{user.name.charAt(0)}</span>
                <div className="absolute inset-0 rounded-full border border-white/20 scale-105 group-hover:scale-110 transition-transform" />
              </div>

              <h2 className="text-xl font-extrabold text-ct-text-primary mt-5">{user.name}</h2>
              <span className="px-2.5 py-0.5 mt-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-ct-cyan/10 border border-ct-cyan/30 text-ct-cyan">
                Verified Student
              </span>

              <div className="w-full mt-6 pt-6 border-t border-white/[0.06] space-y-4 text-xs text-left text-ct-text-secondary">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-ct-text-muted" />
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-ct-text-muted">Email Address</p>
                    <p className="font-medium text-ct-text-primary mt-0.5">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-ct-text-muted" />
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-ct-text-muted">Account Created</p>
                    <p className="font-medium text-ct-text-primary mt-0.5">{joinedDate}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-ct-text-muted" />
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-ct-text-muted">Access Level</p>
                    <p className="font-medium text-ct-text-primary mt-0.5 capitalize">{user.role} User</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics & Trust Score right card */}
            <div className="md:col-span-2 space-y-6">
              <div className="glass-strong rounded-3xl p-6 md:p-8 border border-white/[0.08] shadow-xl space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-ct-text-primary">Campus Trust Telemetry</h3>
                  <p className="text-xs text-ct-text-secondary mt-1">
                    Your reputation is based on positive actions, successful matches, and safe claims approvals.
                  </p>
                </div>

                {fetching ? (
                  <div className="h-48 flex flex-col items-center justify-center text-ct-text-secondary gap-2">
                    <Loader2 className="w-6 h-6 text-ct-cyan animate-spin" />
                    <p className="text-xs">Computing reputation data...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
                    
                    {/* circular gauge */}
                    <div className="flex flex-col items-center justify-center p-4 bg-white/[0.01] border border-white/[0.03] rounded-2xl">
                      <div className="relative w-36 h-36 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                          {/* Background track */}
                          <circle
                            cx="60"
                            cy="60"
                            r={radius}
                            fill="transparent"
                            stroke="rgba(255,255,255,0.03)"
                            strokeWidth="10"
                          />
                          {/* Active gauge */}
                          <motion.circle
                            cx="60"
                            cy="60"
                            r={radius}
                            fill="transparent"
                            stroke="url(#trustGradient)"
                            strokeWidth="10"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            strokeLinecap="round"
                          />
                          {/* Gradient definition */}
                          <defs>
                            <linearGradient id="trustGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#3b82f6" />
                              <stop offset="50%" stopColor="#6366f1" />
                              <stop offset="100%" stopColor="#22c55e" />
                            </linearGradient>
                          </defs>
                        </svg>

                        <div className="absolute flex flex-col items-center">
                          <span className="text-2xl font-black text-ct-text-primary text-glow-blue">
                            {stats.trustScore}%
                          </span>
                          <span className="text-[8px] uppercase tracking-widest text-ct-text-muted mt-0.5">Trust Score</span>
                        </div>
                      </div>
                      
                      <span className="text-xs font-bold text-green-400 mt-4 flex items-center gap-1.5">
                        <Award className="w-4 h-4" />
                        <span>Excellent Standing</span>
                      </span>
                    </div>

                    {/* Stats List */}
                    <div className="space-y-4">
                      
                      <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <HeartHandshake className="w-4 h-4 text-green-400" />
                          <span className="text-xs font-semibold text-ct-text-secondary">Returned Items</span>
                        </div>
                        <span className="text-sm font-bold text-ct-text-primary">{stats.returned}</span>
                      </div>

                      <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-ct-cyan" />
                          <span className="text-xs font-semibold text-ct-text-secondary">Approved Claims</span>
                        </div>
                        <span className="text-sm font-bold text-ct-text-primary">{stats.approved}</span>
                      </div>

                      <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-400" />
                          <span className="text-xs font-semibold text-ct-text-secondary">Rejected Claims</span>
                        </div>
                        <span className="text-sm font-bold text-ct-text-primary">{stats.rejected}</span>
                      </div>

                    </div>

                  </div>
                )}
              </div>

              {/* Security info card */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-xs text-ct-text-secondary leading-relaxed space-y-2">
                <h4 className="font-bold text-ct-text-primary flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-ct-cyan">
                  <Shield className="w-4 h-4" />
                  <span>Fraud Protection Policy</span>
                </h4>
                <p>
                  To keep the CampusTrace network secure, multiple claim rejections or mismatch reports can negatively impact your Trust Score. High Trust Scores unlock instant approval paths and visibility bonuses for your reported items.
                </p>
              </div>

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
