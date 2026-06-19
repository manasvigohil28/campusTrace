"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Users, FileText, AlertTriangle, Trash2, ShieldAlert, BarChart3, CheckSquare, ArrowLeft, Loader2, Calendar, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/sections/Footer";

export default function AdminPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  // Telemetry & Users State
  const [stats, setStats] = useState<any>({ totalUsers: 0, totalLost: 0, totalFound: 0, totalClaims: 0 });
  const [recentLost, setRecentLost] = useState<any[]>([]);
  const [recentFound, setRecentFound] = useState<any[]>([]);
  const [recentClaims, setRecentClaims] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [fetching, setFetching] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  // Redirect if not logged in OR not admin
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "admin") {
        router.push("/dashboard");
      }
    }
  }, [user, loading, router]);

  const fetchAdminData = async () => {
    if (!token) return;
    setFetching(true);
    setError("");
    try {
      // Fetch stats & recents
      const resStats = await fetch(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resStats.ok) {
        const data = await resStats.json();
        setStats(data.stats);
        setRecentLost(data.recentLost || []);
        setRecentFound(data.recentFound || []);
        setRecentClaims(data.recentClaims || []);
      } else {
        throw new Error("Failed to load admin stats.");
      }

      // Fetch users
      const resUsers = await fetch(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resUsers.ok) {
        const data = await resUsers.json();
        setUsers(data);
      } else {
        throw new Error("Failed to load user list.");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong fetching data.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (token && user?.role === "admin") {
      fetchAdminData();
    }
  }, [token, user]);

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("WARNING: Deleting this user will also delete all their reported items and active claims. Are you sure you want to proceed?")) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete user.");
      }

      setUsers(prev => prev.filter(u => u._id !== userId));
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-ct-bg-deep flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-ct-cyan animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="relative min-h-screen pt-28 pb-16 px-4 md:px-8 bg-ct-bg-deep overflow-hidden">
        
        {/* Ambient background glows */}
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-ct-blue/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-ct-purple/5 blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          
          {/* Back btn */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-ct-text-secondary hover:text-ct-text-primary mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          {/* Title */}
          <div className="mb-10">
            <div className="flex items-center gap-2 text-ct-blue-bright">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest">Administrator Portal</span>
            </div>
            <h1 className="text-3xl font-extrabold text-ct-text-primary mt-1">
              Admin <span className="bg-gradient-to-r from-ct-blue-bright via-ct-indigo to-ct-purple bg-clip-text text-transparent">Telemetry</span>
            </h1>
            <p className="text-sm text-ct-text-secondary mt-1">
              Monitor active platform telemetry, claims, categories distribution, and manage student accounts.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {fetching ? (
            <div className="h-64 flex flex-col items-center justify-center text-ct-text-secondary gap-2">
              <Loader2 className="w-8 h-8 text-ct-cyan animate-spin" />
              <p className="text-xs">Loading analytics...</p>
            </div>
          ) : (
            <div className="space-y-10">
              
              {/* Counters Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<Users className="w-5 h-5 text-ct-cyan" />} value={stats.totalUsers} label="Total Users" />
                <StatCard icon={<FileText className="w-5 h-5 text-red-400" />} value={stats.totalLost} label="Lost Items" />
                <StatCard icon={<FileText className="w-5 h-5 text-ct-blue-bright" />} value={stats.totalFound} label="Found Items" />
                <StatCard icon={<CheckSquare className="w-5 h-5 text-green-400" />} value={stats.totalClaims} label="Claim Requests" />
              </div>

              {/* CHARTS CONTAINER: Claims/Categories/Success Rate */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* 1. Claims per week: Area Chart */}
                <div className="glass-strong rounded-3xl p-6 border border-white/[0.08] shadow-md flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-ct-text-muted uppercase tracking-wider">Claims Telemetry</h3>
                    <p className="text-sm font-extrabold text-ct-text-primary mt-1">Claims Per Week</p>
                  </div>
                  <div className="h-44 w-full mt-4 flex items-end justify-center">
                    <svg className="w-full h-full" viewBox="0 0 300 150">
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4"/>
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      {/* Grid lines */}
                      <line x1="10" y1="30" x2="290" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1="10" y1="70" x2="290" y2="70" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1="10" y1="110" x2="290" y2="110" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      {/* Filled area path */}
                      <path d="M 10 130 Q 60 100, 110 115 T 210 60 T 290 40 L 290 130 L 10 130 Z" fill="url(#areaGrad)" />
                      {/* Stroke line */}
                      <path d="M 10 130 Q 60 100, 110 115 T 210 60 T 290 40" fill="transparent" stroke="#3b82f6" strokeWidth="3" />
                      {/* Dots */}
                      <circle cx="10" cy="130" r="4" fill="#3b82f6" />
                      <circle cx="60" cy="100" r="4" fill="#3b82f6" />
                      <circle cx="110" cy="115" r="4" fill="#3b82f6" />
                      <circle cx="160" cy="85" r="4" fill="#3b82f6" />
                      <circle cx="210" cy="60" r="4" fill="#3b82f6" />
                      <circle cx="290" cy="40" r="4" fill="#3b82f6" />
                    </svg>
                  </div>
                  <div className="flex justify-between text-[8px] text-ct-text-muted mt-2 font-mono uppercase tracking-wider">
                    <span>Wk 1</span>
                    <span>Wk 2</span>
                    <span>Wk 3</span>
                    <span>Wk 4</span>
                    <span>Wk 5</span>
                    <span>Wk 6</span>
                  </div>
                </div>

                {/* 2. Item categories: Horizontal Bar Chart */}
                <div className="glass-strong rounded-3xl p-6 border border-white/[0.08] shadow-md flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-ct-text-muted uppercase tracking-wider">Database Spread</h3>
                    <p className="text-sm font-extrabold text-ct-text-primary mt-1">Item Categories</p>
                  </div>
                  <div className="space-y-3.5 mt-6">
                    <CategoryBar label="Electronics" percentage={45} color="bg-ct-blue" />
                    <CategoryBar label="Personal Items" percentage={25} color="bg-ct-purple" />
                    <CategoryBar label="Documents" percentage={18} color="bg-ct-cyan" />
                    <CategoryBar label="Other" percentage={12} color="bg-ct-text-muted" />
                  </div>
                  <div className="mt-2 text-[9px] text-ct-text-muted font-sans text-right">
                    Total listings breakdown
                  </div>
                </div>

                {/* 3. Success Rate over time: Line Chart */}
                <div className="glass-strong rounded-3xl p-6 border border-white/[0.08] shadow-md flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-ct-text-muted uppercase tracking-wider">Resolution Rate</h3>
                    <p className="text-sm font-extrabold text-ct-text-primary mt-1">Success Return Rate</p>
                  </div>
                  <div className="h-44 w-full mt-4 flex items-end justify-center">
                    <svg className="w-full h-full" viewBox="0 0 300 150">
                      {/* Grid lines */}
                      <line x1="10" y1="30" x2="290" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1="10" y1="70" x2="290" y2="70" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1="10" y1="110" x2="290" y2="110" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      {/* Line path */}
                      <path d="M 10 110 L 60 95 L 110 80 L 160 65 L 210 50 L 290 35" fill="transparent" stroke="#22c55e" strokeWidth="3" />
                      {/* Dots with success ring */}
                      <circle cx="10" cy="110" r="4" fill="#22c55e" />
                      <circle cx="60" cy="95" r="4" fill="#22c55e" />
                      <circle cx="110" cy="80" r="4" fill="#22c55e" />
                      <circle cx="160" cy="65" r="4" fill="#22c55e" />
                      <circle cx="210" cy="50" r="4" fill="#22c55e" />
                      <circle cx="290" cy="35" r="5" fill="#0F172A" stroke="#22c55e" strokeWidth="3" />
                    </svg>
                  </div>
                  <div className="flex justify-between text-[8px] text-ct-text-muted mt-2 font-mono uppercase tracking-wider">
                    <span>65%</span>
                    <span>70%</span>
                    <span>75%</span>
                    <span>82%</span>
                    <span>88%</span>
                    <span className="text-green-400 font-bold">92%</span>
                  </div>
                </div>

              </div>

              {/* AUDIT TABLES */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 1. Accounts Management table (col-span-2) */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="glass-strong rounded-3xl p-6 border border-white/[0.06] shadow-md">
                    <h2 className="text-base font-bold text-ct-text-primary mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-ct-cyan" />
                      <span>User Management ({users.length})</span>
                    </h2>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/[0.05] text-[10px] uppercase tracking-wider text-ct-text-muted">
                            <th className="py-3 px-4 font-bold">User</th>
                            <th className="py-3 px-4 font-bold">Role</th>
                            <th className="py-3 px-4 font-bold">Joined</th>
                            <th className="py-3 px-4 font-bold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03] text-xs text-ct-text-secondary">
                          {users.map(u => (
                            <tr key={u._id} className="hover:bg-white/[0.01] transition-colors">
                              <td className="py-3.5 px-4">
                                <p className="font-semibold text-ct-text-primary">{u.name}</p>
                                <p className="text-[10px] text-ct-text-muted">{u.email}</p>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                                  u.role === "admin" ? "bg-ct-purple/10 border-ct-purple/30 text-ct-purple" : "bg-white/[0.05] border-white/[0.08] text-ct-text-secondary"
                                }`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-ct-text-muted">
                                {new Date(u.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                {u._id !== user.id ? (
                                  <button
                                    onClick={() => handleDeleteUser(u._id)}
                                    disabled={actionLoading === u._id}
                                    className="p-1.5 hover:bg-red-500/10 text-ct-text-muted hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                                    title="Delete User"
                                  >
                                    {actionLoading === u._id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-ct-text-muted italic pr-2">You</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* 2. Audit Telemetry side tables (col-span-1) */}
                <div className="space-y-6">
                  
                  {/* Recent Claims Table */}
                  <div className="glass-strong rounded-3xl p-6 border border-white/[0.06] shadow-md space-y-4">
                    <h2 className="text-sm font-bold text-ct-text-primary flex items-center gap-2">
                      <ClipboardCheck className="w-4.5 h-4.5 text-green-400" />
                      <span>Recent Claims</span>
                    </h2>

                    <div className="space-y-2.5">
                      {recentClaims.length === 0 ? (
                        <p className="text-[10px] text-ct-text-muted">No recent claims submitted.</p>
                      ) : (
                        recentClaims.map(claim => (
                          <div key={claim._id} className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl flex justify-between items-start gap-2 text-xs">
                            <div>
                              <p className="font-bold text-ct-text-primary line-clamp-1">{claim.itemId ? claim.itemId.title : "Deleted item"}</p>
                              <p className="text-[9px] text-ct-text-muted">Claimant: {claim.claimantId?.name || "N/A"}</p>
                            </div>
                            <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                              claim.status === "approved" ? "bg-green-500/10 border-green-500/30 text-green-400" :
                              claim.status === "rejected" ? "bg-red-500/10 border-red-500/30 text-red-400" :
                              "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                            }`}>
                              {claim.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Recent Reports List */}
                  <div className="glass-strong rounded-3xl p-6 border border-white/[0.06] shadow-md space-y-4">
                    <h2 className="text-sm font-bold text-ct-text-primary flex items-center gap-2">
                      <BarChart3 className="w-4.5 h-4.5 text-ct-blue-bright" />
                      <span>Recent Reports</span>
                    </h2>

                    <div className="space-y-3">
                      {recentLost.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[9px] font-bold uppercase text-red-400 tracking-wider">Lost Items</p>
                          {recentLost.map(item => (
                            <div key={item._id} className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-xl flex justify-between items-start gap-2 text-xs">
                              <div>
                                <p className="font-semibold text-ct-text-primary line-clamp-1">{item.title}</p>
                                <p className="text-[9px] text-ct-text-muted">By {item.ownerId?.name || "N/A"}</p>
                              </div>
                              <span className="text-[9px] text-ct-text-muted">{new Date(item.createdAt).toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {recentFound.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-white/[0.04]">
                          <p className="text-[9px] font-bold uppercase text-ct-blue-bright tracking-wider">Found Items</p>
                          {recentFound.map(item => (
                            <div key={item._id} className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-xl flex justify-between items-start gap-2 text-xs">
                              <div>
                                <p className="font-semibold text-ct-text-primary line-clamp-1">{item.title}</p>
                                <p className="text-[9px] text-ct-text-muted">By {item.finderId?.name || "N/A"}</p>
                              </div>
                              <span className="text-[9px] text-ct-text-muted">{new Date(item.createdAt).toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

        </div>
      </div>
      <Footer />
    </>
  );
}

// Subcomponents
function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="glass-strong rounded-2xl p-5 border border-white/[0.06] flex items-center gap-4 shadow-sm hover:border-white/[0.1] transition-all">
      <div className="w-10 h-10 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black text-ct-text-primary text-glow-blue">{value}</p>
        <p className="text-[10px] text-ct-text-muted uppercase tracking-wider font-bold mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function CategoryBar({ label, percentage, color }: { label: string; percentage: number; color: string }) {
  return (
    <div className="space-y-1 text-xs">
      <div className="flex justify-between items-center text-ct-text-secondary">
        <span className="font-medium text-ct-text-primary">{label}</span>
        <span className="font-bold">{percentage}%</span>
      </div>
      <div className="w-full h-2 bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.05]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
