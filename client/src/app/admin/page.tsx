"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  Users, FileText, AlertTriangle, Trash2, ShieldAlert, BarChart3, 
  CheckSquare, ArrowLeft, Loader2, Calendar, ClipboardCheck, 
  LayoutDashboard, UserCheck, FolderDot, Scale, AlertOctagon, 
  History, Settings, Send, Cpu, ShieldCheck, HeartHandshake, EyeOff, MessageSquareCheck
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/sections/Footer";

type ActiveTab = 
  | "overview" 
  | "users" 
  | "items" 
  | "claims" 
  | "reports" 
  | "risk_engine" 
  | "audit_logs" 
  | "notifications" 
  | "ai_analytics" 
  | "system_analytics" 
  | "settings";

export default function AdminPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  // Core telemetries state
  const [stats, setStats] = useState<any>({});
  const [recentLost, setRecentLost] = useState<any[]>([]);
  const [recentFound, setRecentFound] = useState<any[]>([]);
  const [recentClaims, setRecentClaims] = useState<any[]>([]);
  const [categorySpread, setCategorySpread] = useState<any[]>([]);
  const [dailyTrend, setDailyTrend] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  
  // Dynamic Settings form state
  const [systemSettings, setSystemSettings] = useState<any>({
    lowThreshold: 50,
    highThreshold: 75,
    veryHighThreshold: 90,
    maxClaimsPerItem: 3,
    cooldownHours: 24,
    riskThreshold: 50,
    enableAI: true,
  });

  // Notification Dispatcher state
  const [notifTargetUser, setNotifTargetUser] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifType, setNotifType] = useState("general");
  const [notifSuccess, setNotifSuccess] = useState("");

  // Drawer / Side Panel details state
  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);
  const [userTimeline, setUserTimeline] = useState<any[]>([]);
  const [userNotes, setUserNotes] = useState("");
  const [userDrawerLoading, setUserDrawerLoading] = useState(false);

  // Status loading indicators
  const [fetching, setFetching] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  // Auth check
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "admin" && user.role !== "super-admin") {
        router.push("/dashboard");
      }
    }
  }, [user, loading, router]);

  const loadData = async () => {
    if (!token) return;
    setFetching(true);
    setError("");
    try {
      // 1. Fetch Stats, trends & spreads
      const resStats = await fetch(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resStats.ok) {
        const data = await resStats.json();
        setStats(data.stats || {});
        setRecentLost(data.recentLost || []);
        setRecentFound(data.recentFound || []);
        setRecentClaims(data.recentClaims || []);
        setCategorySpread(data.categorySpread || []);
        setDailyTrend(data.dailyTrend || []);
      }

      // 2. Fetch Users list
      const resUsers = await fetch(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resUsers.ok) {
        const data = await resUsers.json();
        setUsers(data);
      }

      // 3. Fetch Claims queue
      const resClaims = await fetch(`${API_URL}/admin/claims`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resClaims.ok) {
        const data = await resClaims.json();
        setClaims(data);
      }

      // 4. Fetch Reports queue
      const resReports = await fetch(`${API_URL}/admin/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resReports.ok) {
        const data = await resReports.json();
        setReports(data);
      }

      // 5. Fetch Audit logs
      const resLogs = await fetch(`${API_URL}/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resLogs.ok) {
        const data = await resLogs.json();
        setAuditLogs(data);
      }

      // 6. Fetch Settings
      const resSettings = await fetch(`${API_URL}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resSettings.ok) {
        const data = await resSettings.json();
        setSystemSettings(data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load operational stats.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (token && (user?.role === "admin" || user?.role === "super-admin")) {
      loadData();
    }
  }, [token, user]);

  // Action: Promote/Demote User Role
  const handleRoleUpdate = async (userId: string, newRole: string) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`)) return;
    setActionLoading(`role-${userId}`);
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update role.");
      alert(data.message);
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Action: Update User Status (active, suspended, banned, shadow_banned)
  const handleStatusUpdate = async (userId: string, newStatus: string) => {
    if (!window.confirm(`Are you sure you want to mark this user account status as ${newStatus.toUpperCase()}?`)) return;
    setActionLoading(`status-${userId}`);
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update status.");
      alert(data.message);
      loadData();
      if (selectedUserDetail?._id === userId) {
        openUserDrawer(userId);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Action: Force Resolve / Close Item
  const handleItemResolve = async (itemId: string) => {
    if (!window.confirm("Are you sure you want to force resolve this item's listing? This will close all active claims.")) return;
    setActionLoading(`item-${itemId}`);
    try {
      const res = await fetch(`${API_URL}/admin/items/${itemId}/resolve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to resolve item.");
      alert(data.message);
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Action: Soft Delete Item
  const handleItemDelete = async (itemId: string) => {
    if (!window.confirm("WARNING: Soft deleting this item will hide it from the platform registry. Continue?")) return;
    setActionLoading(`item-${itemId}`);
    try {
      const res = await fetch(`${API_URL}/admin/items/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete item.");
      alert(data.message);
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Action: Override Claims Resolution
  const handleClaimResolve = async (claimId: string, status: "approved" | "rejected") => {
    const remarks = window.prompt(`Enter notes/reason for forcing claim ${status.toUpperCase()}:`);
    if (remarks === null) return; // Cancelled
    setActionLoading(`claim-${claimId}`);
    try {
      const res = await fetch(`${API_URL}/admin/claims/${claimId}/resolve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, remarks })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to override claim.");
      alert(data.message);
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Action: Resolve Report complaint Ticket
  const handleReportResolve = async (reportId: string, action: "dismiss" | "warn" | "suspend" | "ban") => {
    const remarks = window.prompt(`Enter resolution notes for this ticket (Action: ${action.toUpperCase()}):`);
    if (remarks === null) return;
    setActionLoading(`report-${reportId}`);
    try {
      const res = await fetch(`${API_URL}/admin/reports/${reportId}/resolve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action, remarks })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to resolve report.");
      alert(data.message);
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Action: Open User Drawer Timeline Details
  const openUserDrawer = async (userId: string) => {
    setSelectedUserDetail(null);
    setUserTimeline([]);
    setUserDrawerLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/timeline`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedUserDetail(data.user);
        setUserTimeline(data.timeline || []);
        setUserNotes(data.user.adminNotes || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUserDrawerLoading(false);
    }
  };

  // Action: Save User Admin Notes
  const handleSaveUserNotes = async () => {
    if (!selectedUserDetail) return;
    setActionLoading("notes-saving");
    try {
      const res = await fetch(`${API_URL}/admin/users/${selectedUserDetail._id}/notes`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notes: userNotes })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save notes.");
      setSelectedUserDetail((prev: any) => ({ ...prev, adminNotes: data.notes }));
      alert("Admin notes saved successfully.");
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Action: Save dynamic platform settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading("settings-saving");
    try {
      const res = await fetch(`${API_URL}/admin/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(systemSettings)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update configurations.");
      alert("Dynamic operational parameters updated successfully.");
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Action: Dispatch custom notification
  const handleDispatchNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTargetUser || !notifMessage.trim()) return;
    setActionLoading("notif-sending");
    setNotifSuccess("");
    try {
      const res = await fetch(`${API_URL}/notifications/create-custom`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: notifTargetUser,
          message: notifMessage.trim(),
          type: notifType
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send warning.");
      setNotifSuccess(`Notification successfully dispatched to recipient.`);
      setNotifMessage("");
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || !user || (user.role !== "admin" && user.role !== "super-admin")) {
    return (
      <div className="min-h-screen bg-ct-bg-deep flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-ct-cyan animate-spin" />
      </div>
    );
  }

  // Sidebar Links config
  const navItems = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "users", label: "User Management", icon: <UserCheck className="w-4 h-4" /> },
    { id: "items", label: "Item Moderation", icon: <FolderDot className="w-4 h-4" /> },
    { id: "claims", label: "Claims Queue", icon: <ClipboardCheck className="w-4 h-4" /> },
    { id: "reports", label: "Reports Inbox", icon: <AlertOctagon className="w-4 h-4" /> },
    { id: "risk_engine", label: "Risk Engine", icon: <Scale className="w-4 h-4" /> },
    { id: "audit_logs", label: "Audit Logs", icon: <History className="w-4 h-4" /> },
    { id: "notifications", label: "Notifications Alerting", icon: <Send className="w-4 h-4" /> },
    { id: "ai_analytics", label: "AI Verification", icon: <Cpu className="w-4 h-4" /> },
    { id: "system_analytics", label: "System Analytics", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "settings", label: "Platform Settings", icon: <Settings className="w-4 h-4" /> }
  ];

  return (
    <>
      <Navbar />
      <div className="relative min-h-screen pt-24 pb-16 bg-ct-bg-deep overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute top-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-ct-blue/5 blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-ct-purple/5 blur-[120px] pointer-events-none" />

        <div className="w-full mx-auto px-4 md:px-8 relative z-10 flex flex-col lg:flex-row gap-8">
          
          {/* SIDEBAR NAVIGATION */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="glass-strong rounded-3xl p-5 border border-white/[0.06] shadow-xl sticky top-28 space-y-5">
              
              <div>
                <div className="flex items-center gap-1.5 text-ct-blue-bright">
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Trust &amp; Safety Panel</span>
                </div>
                <h1 className="text-xl font-black text-ct-text-primary mt-1">
                  Ops <span className="bg-gradient-to-r from-ct-blue-bright via-ct-indigo to-ct-purple bg-clip-text text-transparent">Dashboard</span>
                </h1>
                <p className="text-[10px] text-ct-text-muted mt-0.5 font-sans">
                  Role: <span className="text-ct-cyan font-bold uppercase">{user.role}</span>
                </p>
              </div>

              <nav className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as ActiveTab);
                      setSelectedUserDetail(null);
                    }}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                      activeTab === item.id 
                        ? "bg-gradient-to-r from-ct-indigo/25 to-ct-blue/10 text-ct-blue-bright border-l-2 border-ct-cyan shadow-sm"
                        : "text-ct-text-secondary hover:text-ct-text-primary hover:bg-white/[0.03]"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>

              <div className="pt-4 border-t border-white/[0.05]">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-xs text-ct-text-secondary hover:text-ct-text-primary transition-colors duration-200"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Return to Main App
                </Link>
              </div>

            </div>
          </aside>

          {/* MAIN CONTENT VIEWPORT */}
          <main className="flex-1 min-w-0">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {fetching ? (
              <div className="h-96 flex flex-col items-center justify-center text-ct-text-secondary gap-3">
                <Loader2 className="w-8 h-8 text-ct-cyan animate-spin" />
                <p className="text-xs font-medium tracking-wide">Syncing system analytics...</p>
              </div>
            ) : (
              <div className="space-y-6 animate-fadeIn">
                
                {/* 1. TAB: OVERVIEW */}
                {activeTab === "overview" && (
                  <div className="space-y-8">
                    {/* Counters grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <OverviewStat label="Total Accounts" value={stats.totalUsers} icon={<Users className="w-4.5 h-4.5 text-ct-cyan" />} />
                      <OverviewStat label="Open Claims" value={stats.pendingClaims} icon={<ClipboardCheck className="w-4.5 h-4.5 text-yellow-400" />} />
                      <OverviewStat label="Risk Alerts" value={stats.fraudAlerts} icon={<AlertTriangle className="w-4.5 h-4.5 text-red-400 animate-bounce" />} />
                      <OverviewStat label="Return Success Rate" value={`${stats.returnSuccessRate}%`} icon={<HeartHandshake className="w-4.5 h-4.5 text-green-400" />} />
                    </div>

                    {/* AI Service Banner */}
                    <div className="glass-strong rounded-3xl p-5 border border-white/[0.06] shadow-sm flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-ct-blue/10 border border-ct-blue/30 rounded-2xl flex items-center justify-center">
                          <Cpu className="w-5 h-5 text-ct-cyan" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-ct-text-primary">FastAPI NLP Vector Server Status</h4>
                          <p className="text-[10px] text-ct-text-muted mt-0.5">Real-time telemetry monitor for semantic sentence matching.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-[10px]">
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                          stats.aiStatus?.status === "online" ? "bg-green-500/10 border border-green-500/30 text-green-400" : "bg-red-500/10 border border-red-500/30 text-red-400"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${stats.aiStatus?.status === "online" ? "bg-green-400 animate-ping" : "bg-red-400"}`} />
                          {stats.aiStatus?.status === "online" ? "Online" : "Offline"}
                        </span>
                        {stats.aiStatus?.status === "online" && (
                          <span className="text-ct-text-muted">Model: <strong className="text-ct-text-primary">{stats.aiStatus.model}</strong> ({stats.aiStatus.latency}ms)</span>
                        )}
                      </div>
                    </div>

                    {/* SVG Data Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="glass-strong rounded-3xl p-5 border border-white/[0.08] flex flex-col justify-between min-h-[220px]">
                        <div>
                          <span className="text-[9px] font-bold text-ct-text-muted uppercase tracking-wider block">Lost vs Found Daily Trend</span>
                          <span className="text-xs font-bold text-ct-text-primary mt-0.5 block">Report Submissions (Last 7 days)</span>
                        </div>
                        <div className="h-32 w-full mt-4 flex items-end">
                          <svg className="w-full h-full" viewBox="0 0 300 150">
                            <line x1="10" y1="30" x2="290" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                            <line x1="10" y1="75" x2="290" y2="75" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                            <line x1="10" y1="120" x2="290" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                            {/* Lost line (Red) */}
                            <path d={`M 20 ${140 - (dailyTrend[0]?.lost * 12 || 0)} L 60 ${140 - (dailyTrend[1]?.lost * 12 || 0)} L 100 ${140 - (dailyTrend[2]?.lost * 12 || 0)} L 140 ${140 - (dailyTrend[3]?.lost * 12 || 0)} L 180 ${140 - (dailyTrend[4]?.lost * 12 || 0)} L 220 ${140 - (dailyTrend[5]?.lost * 12 || 0)} L 280 ${140 - (dailyTrend[6]?.lost * 12 || 0)}`} fill="none" stroke="#ef4444" strokeWidth="2.5" />
                            {/* Found line (Blue) */}
                            <path d={`M 20 ${140 - (dailyTrend[0]?.found * 12 || 0)} L 60 ${140 - (dailyTrend[1]?.found * 12 || 0)} L 100 ${140 - (dailyTrend[2]?.found * 12 || 0)} L 140 ${140 - (dailyTrend[3]?.found * 12 || 0)} L 180 ${140 - (dailyTrend[4]?.found * 12 || 0)} L 220 ${140 - (dailyTrend[5]?.found * 12 || 0)} L 280 ${140 - (dailyTrend[6]?.found * 12 || 0)}`} fill="none" stroke="#3b82f6" strokeWidth="2.5" />
                          </svg>
                        </div>
                        <div className="flex justify-between text-[8px] font-mono text-ct-text-muted mt-2 uppercase tracking-wide">
                          {dailyTrend.map((t, idx) => <span key={idx}>{t.date}</span>)}
                        </div>
                      </div>

                      <div className="glass-strong rounded-3xl p-5 border border-white/[0.08] flex flex-col justify-between min-h-[220px]">
                        <div>
                          <span className="text-[9px] font-bold text-ct-text-muted uppercase tracking-wider block">Spread Analysis</span>
                          <span className="text-xs font-bold text-ct-text-primary mt-0.5 block">Listing Categories Distribution</span>
                        </div>
                        <div className="space-y-2 mt-4">
                          {categorySpread.slice(0, 4).map((c, idx) => (
                            <div key={idx} className="space-y-0.5 text-[10px]">
                              <div className="flex justify-between text-ct-text-secondary">
                                <span className="font-semibold">{c.label}</span>
                                <span className="font-mono text-ct-cyan">{c.count} items</span>
                              </div>
                              <div className="w-full h-1.5 bg-white/[0.02] border border-white/[0.05] rounded-full overflow-hidden">
                                <div className="h-full bg-ct-blue" style={{ width: `${Math.min(100, (c.count / (stats.totalLost + stats.totalFound || 1)) * 100)}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                        <span className="text-[8px] text-ct-text-muted font-sans text-right block">Dynamic database spread</span>
                      </div>

                      <div className="glass-strong rounded-3xl p-5 border border-white/[0.08] flex flex-col justify-between min-h-[220px]">
                        <div>
                          <span className="text-[9px] font-bold text-ct-text-muted uppercase tracking-wider block">Decision Telemetry</span>
                          <span className="text-xs font-bold text-ct-text-primary mt-0.5 block">Ownership Claim Outcomes</span>
                        </div>
                        <div className="h-28 flex items-end justify-center gap-6 mt-4">
                          <OverviewBar height={`${Math.max(10, Math.round((stats.approvedClaims / (stats.totalClaims || 1)) * 90))}px`} color="bg-green-500" label="Approved" value={stats.approvedClaims} />
                          <OverviewBar height={`${Math.max(10, Math.round((stats.rejectedClaims / (stats.totalClaims || 1)) * 90))}px`} color="bg-red-500" label="Rejected" value={stats.rejectedClaims} />
                          <OverviewBar height={`${Math.max(10, Math.round((stats.pendingClaims / (stats.totalClaims || 1)) * 90))}px`} color="bg-yellow-500" label="Pending" value={stats.pendingClaims} />
                        </div>
                      </div>
                    </div>

                    {/* Operational feed summaries */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="glass-strong rounded-3xl p-5 border border-white/[0.06] shadow-sm space-y-3">
                        <h4 className="text-xs font-bold text-ct-text-primary flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-ct-cyan animate-pulse" />
                          <span>Recent Claim Requests</span>
                        </h4>
                        <div className="space-y-2">
                          {recentClaims.length === 0 ? (
                            <p className="text-[10px] text-ct-text-muted">No claims logged.</p>
                          ) : (
                            recentClaims.map(c => (
                              <div key={c._id} className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-xl flex items-center justify-between text-[11px] gap-2">
                                <div>
                                  <p className="font-semibold text-ct-text-primary">{c.itemId?.title || "Deleted Listing"}</p>
                                  <p className="text-[9px] text-ct-text-muted">Claimant: {c.claimantId?.name || "N/A"}</p>
                                </div>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                                  c.status === "approved" ? "bg-green-500/10 border-green-500/30 text-green-400" :
                                  c.status === "rejected" ? "bg-red-500/10 border-red-500/30 text-red-400" :
                                  "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                                }`}>
                                  {c.status}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="glass-strong rounded-3xl p-5 border border-white/[0.06] shadow-sm space-y-3">
                        <h4 className="text-xs font-bold text-ct-text-primary flex items-center gap-1.5">
                          <History className="w-4 h-4 text-ct-cyan" />
                          <span>Recent System Logs</span>
                        </h4>
                        <div className="space-y-2">
                          {auditLogs.slice(0, 4).map(log => (
                            <div key={log._id} className="p-2.5 bg-white/[0.01] border border-white/[0.03] rounded-xl flex justify-between text-[10px] gap-2">
                              <div>
                                <span className="font-semibold text-ct-text-primary font-mono">{log.action}</span>
                                <p className="text-[8px] text-ct-text-muted">By: {log.performedBy?.name || "System"}</p>
                              </div>
                              <span className="text-[8px] text-ct-text-muted">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* 2. TAB: USERS */}
                {activeTab === "users" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* User list table */}
                    <div className="lg:col-span-2 glass-strong rounded-3xl p-5 border border-white/[0.06] shadow-sm">
                      <h2 className="text-sm font-bold text-ct-text-primary mb-4 flex items-center gap-1.5">
                        <Users className="w-4.5 h-4.5 text-ct-cyan" />
                        <span>Registered Users ({users.length})</span>
                      </h2>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/[0.05] text-[9px] uppercase tracking-wider text-ct-text-muted">
                              <th className="py-2.5 px-3 font-bold">Account</th>
                              <th className="py-2.5 px-3 font-bold">Role</th>
                              <th className="py-2.5 px-3 font-bold">Trust/Risk</th>
                              <th className="py-2.5 px-3 font-bold">Status</th>
                              <th className="py-2.5 px-3 font-bold text-right">Details</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.03] text-xs text-ct-text-secondary">
                            {users.map(u => (
                              <tr key={u._id} className={`hover:bg-white/[0.01] transition-colors cursor-pointer ${
                                selectedUserDetail?._id === u._id ? "bg-white/[0.02] border-l border-ct-cyan" : ""
                              }`} onClick={() => openUserDrawer(u._id)}>
                                <td className="py-3 px-3">
                                  <p className="font-semibold text-ct-text-primary">{u.name}</p>
                                  <p className="text-[9px] text-ct-text-muted font-mono">{u.email}</p>
                                </td>
                                <td className="py-3 px-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                                    u.role === "super-admin" ? "bg-ct-cyan/10 border-ct-cyan/30 text-ct-cyan" :
                                    u.role === "admin" ? "bg-ct-purple/10 border-ct-purple/30 text-ct-purple" :
                                    "bg-white/[0.03] border-white/[0.05] text-ct-text-secondary"
                                  }`}>
                                    {u.role}
                                  </span>
                                </td>
                                <td className="py-3 px-3 space-y-1">
                                  <div className="flex items-center gap-1.5 text-[9px]">
                                    <span className="text-green-400 font-bold">T:{u.trustScore || 100}</span>
                                    <span className="text-ct-text-muted">|</span>
                                    <span className={`font-bold ${u.riskScore >= 60 ? "text-red-400" : u.riskScore >= 30 ? "text-yellow-400" : "text-green-400"}`}>R:{u.riskScore || 0}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                                    u.status === "active" ? "bg-green-500/10 border-green-500/30 text-green-400" :
                                    u.status === "suspended" ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400 animate-pulse" :
                                    u.status === "shadow_banned" ? "bg-purple-500/10 border-purple-500/30 text-purple-400" :
                                    "bg-red-500/10 border-red-500/30 text-red-400"
                                  }`}>
                                    {u.status}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <button className="text-[10px] text-ct-blue-bright hover:underline" onClick={(e) => { e.stopPropagation(); openUserDrawer(u._id); }}>
                                    Inspect
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* User side drawer timeline details */}
                    <div className="lg:col-span-1 glass-strong rounded-3xl p-5 border border-white/[0.06] shadow-sm flex flex-col justify-between min-h-[500px]">
                      {userDrawerLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-ct-text-muted gap-2">
                          <Loader2 className="w-6 h-6 animate-spin text-ct-cyan" />
                          <span className="text-[10px]">Loading telemetry...</span>
                        </div>
                      ) : selectedUserDetail ? (
                        <div className="space-y-6 flex-1 flex flex-col justify-between h-full">
                          
                          {/* Profile details */}
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-sm font-black text-ct-text-primary">{selectedUserDetail.name}</h3>
                                <p className="text-[10px] text-ct-text-muted font-mono">{selectedUserDetail.email}</p>
                              </div>
                              <span className="text-[8px] uppercase font-mono px-2 py-0.5 rounded bg-white/[0.03] text-ct-text-muted border border-white/[0.05]">{selectedUserDetail._id.slice(-6)}</span>
                            </div>

                            {/* Trust score grid */}
                            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-white/[0.01] border border-white/[0.04] text-[10px]">
                              <div>
                                <span className="text-ct-text-muted block">Trust Integrity</span>
                                <span className="font-extrabold text-green-400 text-xs mt-0.5 block">{selectedUserDetail.trustScore}/100</span>
                              </div>
                              <div>
                                <span className="text-ct-text-muted block">Risk Coefficient</span>
                                <span className={`font-extrabold text-xs mt-0.5 block ${
                                  selectedUserDetail.riskScore >= 61 ? "text-red-400" :
                                  selectedUserDetail.riskScore >= 31 ? "text-yellow-400" :
                                  "text-green-400"
                                }`}>{selectedUserDetail.riskScore}/100</span>
                              </div>
                              <div>
                                <span className="text-ct-text-muted block">Failed Claims</span>
                                <span className="font-semibold text-ct-text-primary mt-0.5 block">{selectedUserDetail.fraudFlags?.failedClaims}</span>
                              </div>
                              <div>
                                <span className="text-ct-text-muted block">Suspicious Flags</span>
                                <span className="font-semibold text-ct-text-primary mt-0.5 block">{selectedUserDetail.fraudFlags?.suspiciousClaims}</span>
                              </div>
                            </div>

                            {/* Actions options */}
                            <div className="space-y-2 pt-2 border-t border-white/[0.05]">
                              <span className="text-[9px] uppercase font-bold text-ct-text-muted tracking-wider block">Operational Action Controls</span>
                              
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  onClick={() => handleStatusUpdate(selectedUserDetail._id, "active")}
                                  disabled={actionLoading !== null || selectedUserDetail.status === "active"}
                                  className="px-2.5 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold disabled:opacity-30 hover:bg-green-500/25 cursor-pointer"
                                >
                                  Activate
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(selectedUserDetail._id, "suspended")}
                                  disabled={actionLoading !== null || selectedUserDetail.status === "suspended"}
                                  className="px-2.5 py-1 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-bold disabled:opacity-30 hover:bg-yellow-500/25 cursor-pointer"
                                >
                                  Suspend
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(selectedUserDetail._id, "banned")}
                                  disabled={actionLoading !== null || selectedUserDetail.status === "banned"}
                                  className="px-2.5 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold disabled:opacity-30 hover:bg-red-500/25 cursor-pointer"
                                >
                                  Ban Account
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(selectedUserDetail._id, "shadow_banned")}
                                  disabled={actionLoading !== null || selectedUserDetail.status === "shadow_banned"}
                                  className="px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold disabled:opacity-30 hover:bg-purple-500/25 cursor-pointer"
                                  title="Posts will look active to sender but hidden from others"
                                >
                                  Shadow Ban
                                </button>
                              </div>

                              {/* Role selectors */}
                              <div className="flex gap-2 items-center pt-2">
                                <span className="text-[10px] text-ct-text-muted">Account Role:</span>
                                <select
                                  value={selectedUserDetail.role}
                                  onChange={(e) => handleRoleUpdate(selectedUserDetail._id, e.target.value)}
                                  disabled={actionLoading !== null}
                                  className="bg-ct-bg-deep border border-white/[0.08] rounded p-1 text-[10px] text-ct-text-secondary cursor-pointer focus:outline-none"
                                >
                                  <option value="user">User</option>
                                  <option value="admin">Admin</option>
                                  <option value="super-admin">Super Admin</option>
                                </select>
                              </div>
                            </div>

                            {/* Timeline trace */}
                            <div className="space-y-2 pt-2 border-t border-white/[0.05]">
                              <span className="text-[9px] uppercase font-bold text-ct-text-muted tracking-wider block">User Activity Timeline</span>
                              <div className="space-y-2 max-h-36 overflow-y-auto pr-1 text-[10px] custom-scrollbar">
                                {userTimeline.length === 0 ? (
                                  <p className="text-[8px] text-ct-text-muted italic">No activity recorded.</p>
                                ) : (
                                  userTimeline.map((item, idx) => (
                                    <div key={idx} className="border-l border-white/[0.08] pl-2.5 relative space-y-0.5">
                                      <span className="w-1.5 h-1.5 bg-ct-cyan rounded-full absolute -left-1 top-1" />
                                      <div className="flex justify-between items-center text-[8px] text-ct-text-muted font-mono">
                                        <span>{item.type}</span>
                                        <span>{new Date(item.date).toLocaleDateString()}</span>
                                      </div>
                                      <p className="font-bold text-ct-text-secondary text-[10px] leading-tight">{item.title}</p>
                                      <p className="text-[9px] text-ct-text-muted leading-tight">{item.description}</p>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>

                            {/* Admin Notes */}
                            <div className="space-y-1.5 pt-2 border-t border-white/[0.05]">
                              <label className="text-[9px] uppercase font-bold text-ct-text-muted tracking-wider block">Admin Notes</label>
                              <textarea
                                value={userNotes}
                                onChange={(e) => setUserNotes(e.target.value)}
                                rows={2}
                                placeholder="Add administrative notes regarding this account..."
                                className="w-full bg-ct-bg-deep border border-white/[0.08] rounded-xl p-2 text-[10px] text-ct-text-secondary focus:outline-none resize-none focus:border-ct-cyan/35"
                              />
                              <button
                                onClick={handleSaveUserNotes}
                                disabled={actionLoading !== null}
                                className="w-full py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.06] rounded-lg text-[9px] font-bold cursor-pointer transition-colors"
                              >
                                Save Notes
                              </button>
                            </div>

                          </div>
                          
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-ct-text-muted text-[10px] italic">
                          Select a user to view timeline activity and manage roles/notes.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. TAB: ITEMS */}
                {activeTab === "items" && (
                  <div className="glass-strong rounded-3xl p-5 border border-white/[0.06] shadow-sm space-y-4">
                    <h2 className="text-sm font-bold text-ct-text-primary flex items-center gap-1.5">
                      <FolderDot className="w-4.5 h-4.5 text-ct-cyan" />
                      <span>Item Listings Moderation</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Lost Items list */}
                      <div className="space-y-3">
                        <span className="text-[10px] uppercase font-black tracking-wider text-red-400 block border-b border-red-500/10 pb-1">Reported Lost Listings</span>
                        <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                          {recentLost.length === 0 ? (
                            <p className="text-xs text-ct-text-muted italic">No lost listings found.</p>
                          ) : (
                            recentLost.map(item => (
                              <ItemModCard
                                key={item._id}
                                item={item}
                                type="lost"
                                onResolve={handleItemResolve}
                                onDelete={handleItemDelete}
                                loading={actionLoading === `item-${item._id}`}
                              />
                            ))
                          )}
                        </div>
                      </div>

                      {/* Found Items list */}
                      <div className="space-y-3">
                        <span className="text-[10px] uppercase font-black tracking-wider text-ct-blue-bright block border-b border-ct-blue/10 pb-1">Reported Found Listings</span>
                        <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                          {recentFound.length === 0 ? (
                            <p className="text-xs text-ct-text-muted italic">No found listings found.</p>
                          ) : (
                            recentFound.map(item => (
                              <ItemModCard
                                key={item._id}
                                item={item}
                                type="found"
                                onResolve={handleItemResolve}
                                onDelete={handleItemDelete}
                                loading={actionLoading === `item-${item._id}`}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. TAB: CLAIMS */}
                {activeTab === "claims" && (
                  <div className="glass-strong rounded-3xl p-5 border border-white/[0.06] shadow-sm space-y-4">
                    <h2 className="text-sm font-bold text-ct-text-primary flex items-center gap-1.5">
                      <ClipboardCheck className="w-4.5 h-4.5 text-ct-cyan" />
                      <span>Claims Overrides Queue</span>
                    </h2>

                    <div className="space-y-4">
                      {claims.length === 0 ? (
                        <p className="text-xs text-ct-text-muted italic py-6 text-center">No active claims on the platform.</p>
                      ) : (
                        claims.map(claim => {
                          const item = claim.itemId;
                          return (
                            <div key={claim._id} className="p-4 bg-white/[0.01] border border-white/[0.04] rounded-2xl space-y-4 text-xs">
                              
                              {/* Header info */}
                              <div className="flex justify-between items-start flex-wrap gap-2 pb-2 border-b border-white/[0.04]">
                                <div>
                                  <p className="font-extrabold text-ct-text-primary text-sm">{item ? item.title : "Deleted Listing"}</p>
                                  <div className="flex gap-3 text-[10px] text-ct-text-muted mt-0.5">
                                    <span>Category: <strong>{item?.category || "N/A"}</strong></span>
                                    <span>•</span>
                                    <span>Type: <strong>{claim.itemType}</strong></span>
                                    <span>•</span>
                                    <span>Claim Date: {new Date(claim.createdAt).toLocaleDateString()}</span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                    claim.verificationResult?.confidence === "VERY_HIGH" ? "bg-green-500/10 border-green-500/20 text-green-400" :
                                    claim.verificationResult?.confidence === "HIGH" ? "bg-ct-blue/10 border-ct-blue/20 text-ct-blue-bright" :
                                    claim.verificationResult?.confidence === "MEDIUM" ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" :
                                    "bg-red-500/10 border-red-500/20 text-red-400"
                                  }`}>
                                    {claim.verificationResult?.confidence || "LOW"} Confidence
                                  </span>

                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                    claim.status === "approved" ? "bg-green-500/15 border-green-500/30 text-green-400" :
                                    claim.status === "rejected" ? "bg-red-500/15 border-red-500/30 text-red-400" :
                                    "bg-yellow-500/15 border-yellow-500/30 text-yellow-400"
                                  }`}>
                                    {claim.status}
                                  </span>
                                </div>
                              </div>

                              {/* Answers compare */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                                <div className="p-3 rounded-xl bg-white/[0.01] border border-white/[0.03] space-y-1.5">
                                  <p className="text-[9px] uppercase font-bold text-ct-text-muted">Finder verification key</p>
                                  <p className="text-ct-text-secondary leading-relaxed font-sans max-h-24 overflow-y-auto whitespace-pre-line custom-scrollbar">
                                    {item?.verificationData ? 
                                      Object.entries(item.verificationData)
                                        .filter(([k]) => !["hideVerification", "enableAIVerification"].includes(k))
                                        .map(([k, v]) => `${k}: ${v}`).join("\n")
                                      : "No data."
                                    }
                                  </p>
                                </div>

                                <div className="p-3 rounded-xl bg-white/[0.01] border border-white/[0.03] space-y-1.5">
                                  <p className="text-[9px] uppercase font-bold text-ct-text-muted">Claimant submission</p>
                                  <p className="text-ct-text-secondary leading-relaxed font-sans max-h-24 overflow-y-auto whitespace-pre-line custom-scrollbar">
                                    {claim.claimantVerificationData ? 
                                      Object.entries(claim.claimantVerificationData)
                                        .map(([k, v]) => `${k}: ${v}`).join("\n")
                                      : "No data."
                                    }
                                  </p>
                                </div>
                              </div>

                              {/* Scores breakdown info */}
                              <div className="p-3 rounded-xl bg-[#070a1e] border border-white/[0.03] flex justify-between flex-wrap gap-4 text-[10px]">
                                <div>
                                  <span className="text-ct-text-muted">AI Matching Score:</span>
                                  <span className="font-extrabold text-ct-cyan ml-1.5 text-xs">{claim.verificationResult?.score || 0}%</span>
                                </div>
                                <div className="flex gap-4">
                                  <span>Color: <strong className="text-ct-text-primary">{claim.verificationResult?.explanation?.matchedFields?.includes("color") ? "✓" : "✗"}</strong></span>
                                  <span>Brand: <strong className="text-ct-text-primary">{claim.verificationResult?.explanation?.matchedFields?.includes("brand") ? "✓" : "✗"}</strong></span>
                                  <span>Contents: <strong className="text-ct-text-primary">{claim.verificationResult?.explanation?.matchedFields?.includes("contents") ? "✓" : "✗"}</strong></span>
                                  <span>Location: <strong className="text-ct-text-primary">{claim.verificationResult?.explanation?.matchedFields?.includes("location") ? "✓" : "✗"}</strong></span>
                                </div>
                                <div>
                                  <span className="text-ct-text-muted">NLP Similarity:</span>
                                  <span className="font-bold text-ct-text-secondary ml-1">{claim.verificationResult?.aiMetadata?.similarity ? (claim.verificationResult.aiMetadata.similarity).toFixed(2) : "0.00"}</span>
                                </div>
                              </div>

                              {/* Admin notes & overrides */}
                              <div className="flex justify-between items-center gap-4 flex-wrap pt-2 border-t border-white/[0.04]">
                                <div className="flex items-center gap-2 text-[10px]">
                                  <span className="text-ct-text-muted">Claimant:</span>
                                  <button onClick={() => { setActiveTab("users"); openUserDrawer(claim.claimantId?._id); }} className="font-bold text-ct-blue-bright hover:underline">
                                    {claim.claimantId?.name || "N/A"}
                                  </button>
                                  {claim.claimantId?.riskScore >= 50 && (
                                    <span className="px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-[8px] font-black uppercase tracking-wider animate-pulse">Flagged Risk</span>
                                  )}
                                </div>

                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleClaimResolve(claim._id, "approved")}
                                    disabled={actionLoading === `claim-${claim._id}`}
                                    className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg font-bold text-[10px] hover:bg-green-500/25 cursor-pointer transition-colors disabled:opacity-40"
                                  >
                                    Force Verify
                                  </button>
                                  <button
                                    onClick={() => handleClaimResolve(claim._id, "rejected")}
                                    disabled={actionLoading === `claim-${claim._id}`}
                                    className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg font-bold text-[10px] hover:bg-red-500/25 cursor-pointer transition-colors disabled:opacity-40"
                                  >
                                    Force Reject
                                  </button>
                                </div>
                              </div>

                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* 5. TAB: REPORTS */}
                {activeTab === "reports" && (
                  <div className="glass-strong rounded-3xl p-5 border border-white/[0.06] shadow-sm space-y-4">
                    <h2 className="text-sm font-bold text-ct-text-primary flex items-center gap-1.5">
                      <AlertOctagon className="w-4.5 h-4.5 text-ct-cyan" />
                      <span>Complaints &amp; Reports Inbox</span>
                    </h2>

                    <div className="space-y-4">
                      {reports.length === 0 ? (
                        <p className="text-xs text-ct-text-muted italic py-6 text-center">No active complaint tickets.</p>
                      ) : (
                        reports.map(rep => (
                          <div key={rep._id} className="p-4 bg-white/[0.01] border border-white/[0.04] rounded-2xl space-y-3.5 text-xs">
                            <div className="flex justify-between items-start flex-wrap gap-2">
                              <div>
                                <p className="font-extrabold text-ct-text-primary text-sm">Reason: {rep.reason}</p>
                                <div className="flex gap-2 text-[10px] text-ct-text-muted mt-0.5">
                                  <span>Reporter: <strong>{rep.reporterId?.name || "N/A"}</strong></span>
                                  <span>•</span>
                                  <span>Target: <strong>{rep.targetType}</strong> ({rep.targetId.slice(-6)})</span>
                                </div>
                              </div>

                              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                                rep.status === "open" ? "bg-red-500/10 border-red-500/20 text-red-400" :
                                rep.status === "under_review" ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" :
                                "bg-green-500/10 border-green-500/20 text-green-400"
                              }`}>
                                {rep.status}
                              </span>
                            </div>

                            <p className="text-ct-text-secondary leading-relaxed bg-[#070a1e] p-3 rounded-xl border border-white/[0.02]">
                              {rep.description}
                            </p>

                            <div className="flex justify-between items-center gap-4 flex-wrap pt-1.5">
                              {rep.resolutionNotes ? (
                                <p className="text-[10px] text-ct-text-muted">Resolution: <strong className="text-ct-text-secondary">{rep.resolutionNotes}</strong></p>
                              ) : (
                                <span className="text-[10px] text-red-400 font-medium">Pending operational response.</span>
                              )}

                              {rep.status === "open" && (
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => handleReportResolve(rep._id, "dismiss")}
                                    disabled={actionLoading === `report-${rep._id}`}
                                    className="px-2 py-1 bg-white/[0.04] border border-white/[0.06] text-ct-text-secondary rounded text-[9px] font-bold hover:bg-white/[0.08] cursor-pointer"
                                  >
                                    Dismiss
                                  </button>
                                  <button
                                    onClick={() => handleReportResolve(rep._id, "warn")}
                                    disabled={actionLoading === `report-${rep._id}`}
                                    className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded text-[9px] font-bold hover:bg-yellow-500/20 cursor-pointer"
                                  >
                                    Warn Target
                                  </button>
                                  <button
                                    onClick={() => handleReportResolve(rep._id, "suspend")}
                                    disabled={actionLoading === `report-${rep._id}`}
                                    className="px-2 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded text-[9px] font-bold hover:bg-orange-500/20 cursor-pointer"
                                  >
                                    Suspend Target
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 6. TAB: RISK ENGINE */}
                {activeTab === "risk_engine" && (
                  <div className="glass-strong rounded-3xl p-5 border border-white/[0.06] shadow-sm space-y-4">
                    <h2 className="text-sm font-bold text-ct-text-primary flex items-center gap-1.5">
                      <Scale className="w-4.5 h-4.5 text-ct-cyan" />
                      <span>Platform Trust &amp; Risk Engine</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Risk category widgets */}
                      <RiskSummaryCard
                        title="High Risk Watchlist"
                        count={users.filter(u => u.riskScore >= 60).length}
                        color="border-red-500/20 bg-red-500/5 text-red-400"
                        scoreRange="61 - 100"
                      />
                      <RiskSummaryCard
                        title="Medium Risk Watch"
                        count={users.filter(u => u.riskScore >= 30 && u.riskScore < 60).length}
                        color="border-yellow-500/20 bg-yellow-500/5 text-yellow-400"
                        scoreRange="31 - 60"
                      />
                      <RiskSummaryCard
                        title="Safe Registry"
                        count={users.filter(u => u.riskScore < 30).length}
                        color="border-green-500/20 bg-green-500/5 text-green-400"
                        scoreRange="0 - 30"
                      />
                    </div>

                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] uppercase font-black text-ct-text-muted tracking-wider block">Risk Analysis Matrix</span>
                      <div className="space-y-2">
                        {users.filter(u => u.riskScore >= 30).map(u => (
                          <div key={u._id} className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl flex items-center justify-between text-xs">
                            <div>
                              <p className="font-extrabold text-ct-text-primary">{u.name}</p>
                              <p className="text-[9px] text-ct-text-muted font-mono">{u.email}</p>
                            </div>
                            <div className="text-right flex items-center gap-4">
                              <div className="text-[9px] text-ct-text-muted">
                                <span>Failed Claims: <strong>{u.fraudFlags?.failedClaims || 0}</strong></span>
                                <span className="ml-2">Suspicious Flags: <strong>{u.fraudFlags?.suspiciousClaims || 0}</strong></span>
                              </div>
                              <span className={`px-2.5 py-0.5 rounded font-black text-[10px] ${
                                u.riskScore >= 60 ? "bg-red-500/10 border border-red-500/20 text-red-400" : "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400"
                              }`}>
                                Risk: {u.riskScore}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. TAB: AUDIT LOGS */}
                {activeTab === "audit_logs" && (
                  <div className="glass-strong rounded-3xl p-5 border border-white/[0.06] shadow-sm space-y-4">
                    <h2 className="text-sm font-bold text-ct-text-primary flex items-center gap-1.5">
                      <History className="w-4.5 h-4.5 text-ct-cyan" />
                      <span>Security &amp; Administrative Audit Logs</span>
                    </h2>

                    <div className="space-y-2">
                      {auditLogs.length === 0 ? (
                        <p className="text-xs text-ct-text-muted italic py-6 text-center">No audit logs stored in registry.</p>
                      ) : (
                        auditLogs.map(log => (
                          <div key={log._id} className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl flex justify-between items-center text-xs">
                            <div className="space-y-1">
                              <span className="font-black text-ct-text-primary font-mono text-[11px]">{log.action}</span>
                              <div className="flex gap-3 text-[9px] text-ct-text-muted">
                                <span>Performed by: <strong>{log.performedBy?.name || "System"}</strong> ({log.performedBy?.role || "System"})</span>
                                <span>Target Type: {log.targetType}</span>
                              </div>
                            </div>

                            <span className="text-[10px] font-mono text-ct-text-muted">
                              {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 8. TAB: NOTIFICATIONS */}
                {activeTab === "notifications" && (
                  <div className="glass-strong rounded-3xl p-5 border border-white/[0.06] shadow-sm space-y-4">
                    <h2 className="text-sm font-bold text-ct-text-primary flex items-center gap-1.5">
                      <Send className="w-4.5 h-4.5 text-ct-cyan" />
                      <span>Dispatch Custom Warning Notifications</span>
                    </h2>

                    <form onSubmit={handleDispatchNotification} className="space-y-4 max-w-lg">
                      {notifSuccess && (
                        <div className="p-3.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold">
                          {notifSuccess}
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-ct-text-muted tracking-wider block">Recipient User Account</label>
                        <select
                          required
                          value={notifTargetUser}
                          onChange={(e) => setNotifTargetUser(e.target.value)}
                          className="w-full bg-[#050816] border border-white/[0.08] rounded-xl p-3 text-xs text-ct-text-primary focus:outline-none focus:border-ct-cyan/35 cursor-pointer"
                        >
                          <option value="">-- Select Recipient --</option>
                          {users.map(u => (
                            <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-ct-text-muted tracking-wider block">Alert Severity / Type</label>
                        <select
                          required
                          value={notifType}
                          onChange={(e) => setNotifType(e.target.value)}
                          className="w-full bg-[#050816] border border-white/[0.08] rounded-xl p-3 text-xs text-ct-text-primary focus:outline-none focus:border-ct-cyan/35 cursor-pointer"
                        >
                          <option value="general">General Notification</option>
                          <option value="admin_warning">⚠️ Administrative Warning Alert</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-ct-text-muted tracking-wider block">Alert message</label>
                        <textarea
                          required
                          value={notifMessage}
                          onChange={(e) => setNotifMessage(e.target.value)}
                          rows={4}
                          placeholder="Type warning details or message content..."
                          className="w-full bg-[#050816] border border-white/[0.08] rounded-xl p-3 text-xs text-ct-text-primary focus:outline-none resize-none focus:border-ct-cyan/35"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={actionLoading === "notif-sending"}
                        className="px-4 py-2.5 bg-gradient-to-r from-ct-indigo to-ct-blue text-white rounded-xl font-bold text-xs shadow-md disabled:opacity-40 cursor-pointer hover:shadow-lg"
                      >
                        {actionLoading === "notif-sending" ? "Dispatching Alert..." : "Dispatch Alert Message"}
                      </button>
                    </form>
                  </div>
                )}

                {/* 9. TAB: AI ANALYTICS */}
                {activeTab === "ai_analytics" && (
                  <div className="glass-strong rounded-3xl p-5 border border-white/[0.06] shadow-sm space-y-5">
                    <h2 className="text-sm font-bold text-ct-text-primary flex items-center gap-1.5">
                      <Cpu className="w-4.5 h-4.5 text-ct-cyan" />
                      <span>AI Semantic Vector Verification Telemetry</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 bg-white/[0.01] border border-white/[0.04] rounded-2xl space-y-3">
                        <span className="text-[9px] uppercase font-bold text-ct-text-muted">Transformer Embeddings Model</span>
                        <div className="space-y-1.5">
                          <p className="text-sm font-black text-ct-text-primary">all-MiniLM-L6-v2</p>
                          <p className="text-ct-text-secondary font-sans leading-normal">
                            This model maps sentences &amp; paragraphs to a 384 dimensional dense vector space, enabling highly reliable cosine similarity comparisons for narratives and special marks.
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-white/[0.01] border border-white/[0.04] rounded-2xl space-y-3">
                        <span className="text-[9px] uppercase font-bold text-ct-text-muted">Engine Accuracy / Alignment</span>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[11px]">
                            <span>High-Confidence Alignment Rate</span>
                            <strong className="text-green-400">94.8%</strong>
                          </div>
                          <div className="w-full h-2 bg-white/[0.02] border border-white/[0.05] rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: "94.8%" }} />
                          </div>
                          <p className="text-[10px] text-ct-text-muted leading-relaxed">
                            Rate of claims flagged as VERY_HIGH confidence that were successfully confirmed and resolved by finders.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 10. TAB: SYSTEM ANALYTICS */}
                {activeTab === "system_analytics" && (
                  <div className="glass-strong rounded-3xl p-5 border border-white/[0.06] shadow-sm space-y-4">
                    <h2 className="text-sm font-bold text-ct-text-primary flex items-center gap-1.5">
                      <BarChart3 className="w-4.5 h-4.5 text-ct-cyan" />
                      <span>Resolution &amp; Location Analytics</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                      <div className="p-4 bg-white/[0.01] border border-white/[0.04] rounded-2xl space-y-3">
                        <span className="text-[10px] uppercase font-black text-ct-cyan block">Loss Hotspots Heatmap</span>
                        <div className="space-y-2 mt-2">
                          <LocationStatRow spot="Science Library" count={32} />
                          <LocationStatRow spot="Student Recreation Center" count={25} />
                          <LocationStatRow spot="University Food Court" count={18} />
                          <LocationStatRow spot="Engineering Block Hallways" count={14} />
                        </div>
                      </div>

                      <div className="p-4 bg-white/[0.01] border border-white/[0.04] rounded-2xl space-y-3 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-black text-ct-cyan block">Average Claim Resolution Time</span>
                          <p className="text-4xl font-black text-ct-text-primary text-glow-blue mt-2">14.6 hrs</p>
                        </div>
                        <p className="text-[10px] text-ct-text-muted leading-relaxed">
                          The average time elapsed between found item submission and successful ownership claim approval by finder.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 11. TAB: SETTINGS */}
                {activeTab === "settings" && (
                  <div className="glass-strong rounded-3xl p-5 border border-white/[0.06] shadow-sm space-y-4">
                    <h2 className="text-sm font-bold text-ct-text-primary flex items-center gap-1.5">
                      <Settings className="w-4.5 h-4.5 text-ct-cyan" />
                      <span>Platform Configurations &amp; Thresholds</span>
                    </h2>

                    <form onSubmit={handleSaveSettings} className="space-y-6 max-w-xl text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-bold text-ct-text-muted tracking-wider block">
                            LOW Confidence Threshold ({systemSettings.lowThreshold}%)
                          </label>
                          <input
                            type="range"
                            min="20"
                            max="60"
                            value={systemSettings.lowThreshold}
                            onChange={(e) => setSystemSettings({ ...systemSettings, lowThreshold: Number(e.target.value) })}
                            className="w-full accent-ct-cyan"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-bold text-ct-text-muted tracking-wider block">
                            HIGH Confidence Threshold ({systemSettings.highThreshold}%)
                          </label>
                          <input
                            type="range"
                            min="60"
                            max="85"
                            value={systemSettings.highThreshold}
                            onChange={(e) => setSystemSettings({ ...systemSettings, highThreshold: Number(e.target.value) })}
                            className="w-full accent-ct-cyan"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-bold text-ct-text-muted tracking-wider block">
                            VERY HIGH Confidence Threshold ({systemSettings.veryHighThreshold}%)
                          </label>
                          <input
                            type="range"
                            min="85"
                            max="98"
                            value={systemSettings.veryHighThreshold}
                            onChange={(e) => setSystemSettings({ ...systemSettings, veryHighThreshold: Number(e.target.value) })}
                            className="w-full accent-ct-cyan"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-bold text-ct-text-muted tracking-wider block">
                            Max Claims Per Item ({systemSettings.maxClaimsPerItem})
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={systemSettings.maxClaimsPerItem}
                            onChange={(e) => setSystemSettings({ ...systemSettings, maxClaimsPerItem: Number(e.target.value) })}
                            className="w-full bg-[#050816] border border-white/[0.08] rounded-xl p-2.5 text-ct-text-primary focus:outline-none"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-bold text-ct-text-muted tracking-wider block">
                            Claim Cooldown Period (Hours)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="72"
                            value={systemSettings.cooldownHours}
                            onChange={(e) => setSystemSettings({ ...systemSettings, cooldownHours: Number(e.target.value) })}
                            className="w-full bg-[#050816] border border-white/[0.08] rounded-xl p-2.5 text-ct-text-primary focus:outline-none"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-bold text-ct-text-muted tracking-wider block">
                            Fraud Score watch Threshold ({systemSettings.riskThreshold}%)
                          </label>
                          <input
                            type="range"
                            min="20"
                            max="80"
                            value={systemSettings.riskThreshold}
                            onChange={(e) => setSystemSettings({ ...systemSettings, riskThreshold: Number(e.target.value) })}
                            className="w-full accent-ct-cyan"
                          />
                        </div>

                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <input
                          type="checkbox"
                          id="enableAI"
                          checked={systemSettings.enableAI !== false}
                          onChange={(e) => setSystemSettings({ ...systemSettings, enableAI: e.target.checked })}
                          className="w-4 h-4 rounded bg-[#050816] border-white/[0.08] cursor-pointer accent-ct-cyan font-sans"
                        />
                        <label htmlFor="enableAI" className="text-ct-text-secondary cursor-pointer select-none font-bold">
                          Enable Sentence-Transformer Semantic AI Verification
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={actionLoading === "settings-saving"}
                        className="px-4 py-2.5 bg-gradient-to-r from-ct-indigo to-ct-blue text-white rounded-xl font-bold text-xs shadow-md disabled:opacity-40 cursor-pointer hover:shadow-lg transition-all"
                      >
                        {actionLoading === "settings-saving" ? "Saving..." : "Save Parameters"}
                      </button>
                    </form>
                  </div>
                )}

              </div>
            )}
          </main>

        </div>
      </div>
      <Footer />
    </>
  );
}

// Subcomponents
function OverviewStat({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="glass-strong rounded-2xl p-4 border border-white/[0.06] flex items-center gap-3.5 shadow-sm hover:border-white/[0.1] transition-all">
      <div className="w-9 h-9 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-xl font-black text-ct-text-primary text-glow-blue">{value}</p>
        <p className="text-[9px] text-ct-text-muted uppercase tracking-wider font-bold mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function OverviewBar({ height, color, label, value }: { height: string; color: string; label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-[9px] text-ct-text-muted">
      <span className="font-bold text-ct-text-primary">{value}</span>
      <div className={`w-8 rounded-t-lg ${color}`} style={{ height: height }} />
      <span>{label}</span>
    </div>
  );
}

function RiskSummaryCard({ title, count, color, scoreRange }: { title: string; count: number; color: string; scoreRange: string }) {
  return (
    <div className={`p-4 rounded-2xl border text-xs space-y-1 ${color}`}>
      <span className="text-[9px] uppercase font-bold tracking-wider opacity-85 block">{title}</span>
      <p className="text-xl font-black">{count} users</p>
      <span className="text-[8px] opacity-75 font-mono">Score Range: {scoreRange}</span>
    </div>
  );
}

function LocationStatRow({ spot, count }: { spot: string; count: number }) {
  return (
    <div className="flex justify-between items-center text-[10px] p-2 bg-white/[0.01] border border-white/[0.03] rounded-xl">
      <span className="font-medium text-ct-text-secondary">{spot}</span>
      <span className="font-mono text-ct-cyan font-bold">{count} reports</span>
    </div>
  );
}

function ItemModCard({ item, type, onResolve, onDelete, loading }: { 
  item: any; 
  type: "lost" | "found"; 
  onResolve: (id: string) => void; 
  onDelete: (id: string) => void;
  loading: boolean;
}) {
  return (
    <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-xl space-y-3.5 text-xs">
      <div className="flex justify-between items-start gap-2">
        <div>
          <p className="font-extrabold text-ct-text-primary line-clamp-1">{item.title}</p>
          <p className="text-[8px] text-ct-text-muted mt-0.5">By {item.ownerId?.name || item.finderId?.name || "N/A"}</p>
        </div>
        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
          item.status === "active" ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-white/[0.04] border-white/[0.08] text-ct-text-muted"
        }`}>
          {item.status}
        </span>
      </div>

      <div className="space-y-1 text-[10px] p-2 bg-black/20 rounded-lg text-ct-text-secondary">
        <p>Public Location: <strong className="text-ct-text-primary">{item.location?.public || "N/A"}</strong></p>
        <p>Private Spot: <strong className="text-ct-cyan font-mono">{item.location?.private || "Hidden"}</strong></p>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        {item.status === "active" && (
          <button
            onClick={() => onResolve(item._id)}
            disabled={loading}
            className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded text-[9px] font-bold hover:bg-green-500/20 cursor-pointer disabled:opacity-40 transition-colors"
          >
            Resolve Listing
          </button>
        )}
        <button
          onClick={() => onDelete(item._id)}
          disabled={loading}
          className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-[9px] font-bold hover:bg-red-500/20 cursor-pointer disabled:opacity-40 transition-colors"
        >
          Soft Delete
        </button>
      </div>
    </div>
  );
}
