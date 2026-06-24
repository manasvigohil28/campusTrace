"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { List, ClipboardList, CheckCircle, XCircle, Trash2, Calendar, MapPin, Tag, RefreshCw, Loader2, Inbox, Eye, ShieldAlert, BarChart3, Settings, HelpCircle, Check, AlertTriangle, EyeOff, User as UserIcon } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/sections/Footer";

type Section = "overview" | "lost" | "found" | "submitted" | "received" | "settings";

// Helper to resolve verification metrics
const getResult = (claim: any) => {
  const result = claim.verificationResult || {};
  const score = typeof result.score === "number" ? result.score : 75;
  const confidence = result.confidence || (score >= 90 ? "VERY_HIGH" : score >= 75 ? "HIGH" : score >= 50 ? "MEDIUM" : "LOW");
  const aiAvailable = result.aiAvailable !== false;
  const earnedPoints = typeof result.earnedPoints === "number" ? result.earnedPoints : null;
  const possiblePoints = typeof result.possiblePoints === "number" ? result.possiblePoints : null;
  
  const checkMatch = (val: number | null | undefined, maxVal: number) => {
    if (val === null || val === undefined) return "N/A";
    if (val === maxVal) return "Match ✓";
    if (val > 0) return "Partial Match ~";
    return "Mismatch ✗";
  };

  return {
    score,
    confidence,
    aiAvailable,
    earnedPoints,
    possiblePoints,
    colorScoreText: checkMatch(result.colorScore, 20),
    brandScoreText: checkMatch(result.brandScore, 10),
    contentsScoreText: checkMatch(result.contentsScore, 30),
    locationScoreText: result.locationScore === null || result.locationScore === undefined ? "N/A" : checkMatch(result.locationScore, 20),
    semanticSimilarity: typeof result.semanticSimilarity === "number" ? Math.round(result.semanticSimilarity * 100) : null,
    matchedTerms: Array.isArray(result.matchedTerms) ? result.matchedTerms : []
  };
};

function BreakdownItem({ label, status }: { label: string; status: string }) {
  const isMatch = status.includes("✓") || (status.includes("Match") && !status.includes("Partial"));
  const isPartial = status.includes("~") || status.includes("Partial");
  const isNa = status === "N/A" || status.includes("N/A");
  
  return (
    <div className="bg-black/25 p-2.5 rounded-xl border border-white/[0.03] text-center">
      <span className="text-[8px] text-ct-text-muted block uppercase tracking-wider font-bold">{label}</span>
      <span className={`font-extrabold mt-1 block text-[10px] ${
        isNa ? "text-ct-text-muted opacity-40" :
        isMatch ? "text-green-400 text-glow-blue" :
        isPartial ? "text-yellow-400" : "text-red-400"
      }`}>
        {status}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  // Sidebar Section State
  const [activeSection, setActiveSection] = useState<Section>("overview");
  
  // Data State
  const [lostItems, setLostItems] = useState<any[]>([]);
  const [foundItems, setFoundItems] = useState<any[]>([]);
  const [claimsSubmitted, setClaimsSubmitted] = useState<any[]>([]);
  const [claimsReceived, setClaimsReceived] = useState<any[]>([]);
  
  const [fetching, setFetching] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Expansion state for claims received review
  const [expandedClaim, setExpandedClaim] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const fetchData = async () => {
    if (!token) return;
    setFetching(true);
    try {
      // 1. Fetch user's lost items
      const resLost = await fetch(`${API_URL}/items/my-lost`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resLost.ok) {
        const data = await resLost.json();
        setLostItems(data);
      }

      // 2. Fetch user's found items
      const resFound = await fetch(`${API_URL}/items/my-found`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resFound.ok) {
        const data = await resFound.json();
        setFoundItems(data);
      }

      // 3. Fetch user's claims (submitted and received)
      const resClaims = await fetch(`${API_URL}/claims`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resClaims.ok) {
        const data = await resClaims.json();
        setClaimsSubmitted(data.submitted || []);
        setClaimsReceived(data.received || []);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const handleDeleteItem = async (id: string, type: "lost" | "found") => {
    if (!window.confirm("Are you sure you want to delete this reported item?")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`${API_URL}/items/${type}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        if (type === "lost") {
          setLostItems(prev => prev.filter(item => item._id !== id));
        } else {
          setFoundItems(prev => prev.filter(item => item._id !== id));
        }
      }
    } catch (err) {
      console.error("Error deleting item:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateClaim = async (claimId: string, status: "approved" | "rejected") => {
    if (!window.confirm(`Are you sure you want to mark this claim request as ${status}?`)) return;
    setActionLoading(claimId);
    try {
      const res = await fetch(`${API_URL}/claims/${claimId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        await fetchData();
        setExpandedClaim(null);
      }
    } catch (err) {
      console.error("Error updating claim:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // AI Matching Similarity Score Helpers
  const getFieldMatchDetail = (finderVal: any, claimantVal: any) => {
    const f = String(finderVal || "").toLowerCase().trim();
    const c = String(claimantVal || "").toLowerCase().trim();
    
    if (!f || !c) return { status: "mismatch", score: 0, label: "Mismatch ✗" };
    if (f === c) return { status: "match", score: 100, label: "Match ✓" };
    
    // Check partial sharing
    const fWords = f.split(/\s+/).filter(w => w.length > 2);
    const cWords = c.split(/\s+/).filter(w => w.length > 2);
    const sharesWord = fWords.some(fw => c.includes(fw)) || cWords.some(cw => f.includes(cw));
    
    if (sharesWord || f.includes(c) || c.includes(f)) {
      return { status: "partial", score: 50, label: "Partial Match ~" };
    }
    
    return { status: "mismatch", score: 0, label: "Mismatch ✗" };
  };

  const calculateSimilarityScore = (verificationData: any, claimantData: any) => {
    if (!verificationData || !claimantData) return 0;
    const entries = Object.entries(verificationData).filter(([k]) => k !== "hideVerification" && k !== "enableAIVerification" && k !== "hideAnswers" && k !== "enableAI");
    if (entries.length === 0) return 100;
    
    let totalScore = 0;
    let count = 0;
    
    for (const [k, val] of entries) {
      const claimVal = claimantData[k];
      const match = getFieldMatchDetail(val, claimVal);
      totalScore += match.score;
      count++;
    }
    
    return Math.round(totalScore / count);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-ct-bg-deep flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-ct-cyan animate-spin" />
      </div>
    );
  }

  // Calculate stats count
  const resolvedReturns = 
    lostItems.filter(item => item.status === "claimed" || item.status === "resolved").length +
    foundItems.filter(item => item.status === "claimed" || item.status === "resolved").length;

  return (
    <>
      <Navbar />
      <div className="relative min-h-screen pt-28 pb-16 px-4 md:px-8 bg-ct-bg-deep">
        <div className="max-w-6xl mx-auto relative z-10">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-white/[0.05]">
            <div>
              <h1 className="text-3xl font-extrabold text-ct-text-primary">
                Personal <span className="bg-gradient-to-r from-ct-indigo via-ct-blue to-ct-cyan bg-clip-text text-transparent animate-gradient">Dashboard</span>
              </h1>
              <p className="text-sm text-ct-text-secondary mt-1">
                Manage your reported belongings, check matchmaking matches, and verify ownership claims.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                disabled={fetching}
                className="p-3 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] text-ct-text-secondary rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${fetching ? "animate-spin" : ""}`} />
                <span className="text-xs font-semibold">Sync</span>
              </button>

              <Link href="/report-lost">
                <button className="py-3 px-4 rounded-xl bg-gradient-to-r from-ct-indigo to-ct-blue text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer">
                  Report Lost
                </button>
              </Link>
              <Link href="/report-found">
                <button className="py-3 px-4 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-white text-xs font-bold transition-all cursor-pointer">
                  Report Found
                </button>
              </Link>
            </div>
          </div>

          {/* Top Analytics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            <AnalyticsCard title="Lost Reported" count={lostItems.length} color="border-red-500/20 text-red-400 bg-red-500/[0.02]" />
            <AnalyticsCard title="Found Reported" count={foundItems.length} color="border-ct-blue/20 text-ct-blue-bright bg-ct-blue/[0.02]" />
            <AnalyticsCard title="Claims Submitted" count={claimsSubmitted.length} color="border-ct-cyan/20 text-ct-cyan bg-ct-cyan/[0.02]" />
            <AnalyticsCard title="Successful Returns" count={resolvedReturns} color="border-green-500/20 text-green-400 bg-green-500/[0.02]" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* SIDEBAR NAVIGATION */}
            <div className="lg:col-span-1 space-y-2">
              <div className="glass-strong rounded-2xl p-4 border border-white/[0.06] flex flex-col gap-1 shadow-lg">
                <p className="text-[10px] font-bold text-ct-text-muted uppercase tracking-wider px-3 mb-2">Navigation</p>
                
                <SidebarButton active={activeSection === "overview"} onClick={() => setActiveSection("overview")} label="Overview / Activity" icon={<BarChart3 className="w-4 h-4" />} />
                <SidebarButton active={activeSection === "lost"} onClick={() => setActiveSection("lost")} label={`My Lost Items (${lostItems.length})`} icon={<List className="w-4 h-4 text-red-400" />} />
                <SidebarButton active={activeSection === "found"} onClick={() => setActiveSection("found")} label={`My Found Items (${foundItems.length})`} icon={<List className="w-4 h-4 text-ct-blue-bright" />} />
                <SidebarButton active={activeSection === "submitted"} onClick={() => setActiveSection("submitted")} label={`Claims Submitted (${claimsSubmitted.length})`} icon={<ClipboardList className="w-4 h-4 text-ct-cyan" />} />
                <SidebarButton active={activeSection === "received"} onClick={() => setActiveSection("received")} label={`Claims Received (${claimsReceived.length})`} icon={<Inbox className="w-4 h-4 text-ct-purple" />} />
                <SidebarButton active={activeSection === "settings"} onClick={() => setActiveSection("settings")} label="Profile & Settings" icon={<Settings className="w-4 h-4" />} />
              </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="lg:col-span-3 min-h-[400px]">
              {fetching ? (
                <div className="h-64 flex flex-col items-center justify-center text-ct-text-secondary gap-2">
                  <Loader2 className="w-8 h-8 text-ct-cyan animate-spin" />
                  <p className="text-xs">Loading entries...</p>
                </div>
              ) : (
                <div className="animate-fadeIn">

                  {/* SECTION: OVERVIEW */}
                  {activeSection === "overview" && (
                    <div className="glass-strong rounded-3xl p-6 md:p-8 border border-white/[0.06] shadow-lg space-y-6">
                      <div>
                        <h2 className="text-xl font-bold text-ct-text-primary">Welcome Back, {user.name}!</h2>
                        <p className="text-xs text-ct-text-secondary mt-1">
                          Here is a brief summary of your trace activities on campus.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-5 bg-white/[0.02] border border-white/[0.04] rounded-2xl space-y-2">
                          <h3 className="text-xs font-bold text-ct-cyan uppercase tracking-wider">Need to Report?</h3>
                          <p className="text-xs text-ct-text-secondary leading-relaxed">
                            Report lost items so finders can match them, or list items you found to reconnect them with owners securely.
                          </p>
                          <div className="pt-2 flex gap-3">
                            <Link href="/report-lost" className="text-xs font-bold text-ct-blue-bright hover:underline">Report Lost &gt;</Link>
                            <Link href="/report-found" className="text-xs font-bold text-ct-blue-bright hover:underline">Report Found &gt;</Link>
                          </div>
                        </div>

                        <div className="p-5 bg-white/[0.02] border border-white/[0.04] rounded-2xl space-y-2">
                          <h3 className="text-xs font-bold text-ct-cyan uppercase tracking-wider">Search Database</h3>
                          <p className="text-xs text-ct-text-secondary leading-relaxed">
                            Search our AI-powered campus registry containing all lost and found listings uploaded in the last few weeks.
                          </p>
                          <div className="pt-2">
                            <Link href="/search" className="text-xs font-bold text-ct-blue-bright hover:underline">Open Search Registry &gt;</Link>
                          </div>
                        </div>
                      </div>

                      {/* Quick profile link */}
                      <div className="p-5 bg-ct-blue/5 border border-ct-blue/20 rounded-2xl flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-ct-blue to-ct-purple flex items-center justify-center font-bold text-white">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-ct-text-primary">Reputation score &amp; telemetry</p>
                            <p className="text-[10px] text-ct-text-secondary mt-0.5">Check your campus Trust standing badge metrics.</p>
                          </div>
                        </div>
                        <Link href="/profile">
                          <button className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.06] text-xs font-bold rounded-xl transition-all cursor-pointer">
                            View Profile
                          </button>
                        </Link>
                      </div>

                    </div>
                  )}

                  {/* SECTION: MY LOST ITEMS */}
                  {activeSection === "lost" && (
                    lostItems.length === 0 ? (
                      <EmptyState title="No lost items reported" desc="Have you lost something? Click Report Lost above to add an item." />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {lostItems.map(item => (
                          <DashboardCard
                            key={item._id}
                            item={{
                              ...item,
                              location: item.location ? `${item.location.public}${item.location.private ? ` (Spot: ${item.location.private})` : ""}` : "No location specified",
                              date: item.date
                            }}
                            type="lost"
                            actionLoading={actionLoading}
                            onDelete={() => handleDeleteItem(item._id, "lost")}
                          />
                        ))}
                      </div>
                    )
                  )}

                  {/* SECTION: MY FOUND ITEMS */}
                  {activeSection === "found" && (
                    foundItems.length === 0 ? (
                      <EmptyState title="No found items reported" desc="Found something on campus? Report it to help reconnect the owner." />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {foundItems.map(item => (
                          <DashboardCard
                            key={item._id}
                            item={{
                              ...item,
                              location: item.location ? `${item.location.public}${item.location.private ? ` (Spot: ${item.location.private})` : ""}` : "No location specified",
                              date: item.date
                            }}
                            type="found"
                            actionLoading={actionLoading}
                            onDelete={() => handleDeleteItem(item._id, "found")}
                          />
                        ))}
                      </div>
                    )
                  )}

                  {/* SECTION: CLAIMS SUBMITTED */}
                  {activeSection === "submitted" && (
                    claimsSubmitted.length === 0 ? (
                      <EmptyState title="No claims submitted yet" desc="Browse reported found items on the search page and submit a claim if you spot yours." />
                    ) : (
                      <div className="space-y-4">
                        {claimsSubmitted.map(claim => (
                          <div key={claim._id} className="glass-strong rounded-2xl p-5 border border-white/[0.06] flex flex-col gap-4 shadow-md">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-ct-blue/10 border border-ct-blue/30 text-ct-blue-bright">
                                    Claim request
                                  </span>
                                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                                    claim.status === "pending" ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" :
                                    claim.status === "approved" ? "bg-green-500/10 border-green-500/30 text-green-400" :
                                    "bg-red-500/10 border-red-500/30 text-red-400"
                                  }`}>
                                    {claim.status === "approved" ? "Ownership Verified ✓" : claim.status}
                                  </span>
                                </div>
                                
                                <h3 className="text-sm font-extrabold text-ct-text-primary mt-1">
                                  Claiming: {claim.itemId ? claim.itemId.title : "Deleted Item"}
                                </h3>
                                <p className="text-xs text-ct-text-secondary">
                                  Category: {claim.itemId ? `${claim.itemId.category} (${claim.itemId.subcategory})` : "N/A"} | Finder: {claim.finderId?.name || "Unknown"}
                                </p>
                              </div>

                              <div className="text-left md:text-right text-[10px] text-ct-text-muted space-y-1">
                                <p>Submitted: {new Date(claim.createdAt).toLocaleDateString()}</p>
                                {claim.status === "approved" && (
                                  <div className="mt-1">
                                    {claim.conversationId ? (
                                      <Link href={`/chat?id=${claim.conversationId}`}>
                                        <button className="py-1.5 px-3 rounded-lg bg-green-500/10 border border-green-500/35 hover:bg-green-500/20 text-green-400 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1.5">
                                          <Inbox className="w-3.5 h-3.5 text-green-400" />
                                          <span>Go to Handoff Chat</span>
                                        </button>
                                      </Link>
                                    ) : (
                                      <p className="text-green-400 font-semibold flex items-center gap-1">
                                        <Check className="w-3.5 h-3.5" /> Ownership Verified! Chatting channel initializing...
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Claimant's own verification answers */}
                            {claim.claimantVerificationData && (
                              <div className="p-3.5 bg-white/[0.01] border border-white/[0.04] rounded-xl space-y-1">
                                <p className="text-[10px] font-bold text-ct-cyan uppercase tracking-wider mb-2">Your Answers Submitted:</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                  {Object.entries(claim.claimantVerificationData).map(([k, val]) => (
                                    <div key={k} className="bg-black/20 p-2 rounded-lg border border-white/[0.02]">
                                      <span className="text-[9px] text-ct-text-muted block uppercase">{k}</span>
                                      <span className="font-medium text-ct-text-secondary mt-0.5 block">{String(val)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  {/* SECTION: CLAIMS RECEIVED (SIDE-BY-SIDE VERIFICATION COMPARISON CARDS) */}
                  {activeSection === "received" && (
                    claimsReceived.length === 0 ? (
                      <EmptyState title="No claims received" desc="You haven't received claims on any items you've reported finding yet." />
                    ) : (
                      <div className="space-y-6">
                        {claimsReceived.map(claim => {
                          const isExpanded = expandedClaim === claim._id;
                          const verify = getResult(claim);

                          return (
                            <div key={claim._id} className="glass-strong rounded-3xl p-5 border border-white/[0.06] flex flex-col gap-4 shadow-lg">
                              
                              {/* Top Bar info */}
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-ct-purple/10 border border-ct-purple/30 text-ct-purple">
                                      Claim Request Received
                                    </span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                                      claim.status === "pending" ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" :
                                      claim.status === "approved" ? "bg-green-500/10 border-green-500/30 text-green-400" :
                                      "bg-red-500/10 border-red-500/30 text-red-400"
                                    }`}>
                                      {claim.status === "approved" ? "Ownership Verified ✓" : claim.status}
                                    </span>
                                  </div>

                                  <h3 className="text-sm font-extrabold text-ct-text-primary mt-1">
                                    Item: {claim.itemId ? claim.itemId.title : "Deleted Item"}
                                  </h3>
                                  <p className="text-xs text-ct-text-secondary">
                                    Claimant: <span className="text-ct-cyan font-semibold">{claim.claimantId?.name}</span> ({claim.claimantId?.email})
                                  </p>
                                </div>

                                {/* Actions & Expand Button */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <button
                                    onClick={() => setExpandedClaim(isExpanded ? null : claim._id)}
                                    className="py-2 px-3 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] text-ct-text-primary text-xs font-semibold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>{isExpanded ? "Hide Review" : "Review Proof"}</span>
                                  </button>

                                  {claim.status === "pending" && (
                                    <>
                                      <button
                                        onClick={() => handleUpdateClaim(claim._id, "approved")}
                                        disabled={actionLoading === claim._id}
                                        className="py-2 px-3 bg-green-500/15 border border-green-500/25 hover:bg-green-500/25 text-green-400 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 animate-pulse"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Verify Owner</span>
                                      </button>
                                      <button
                                        onClick={() => handleUpdateClaim(claim._id, "rejected")}
                                        disabled={actionLoading === claim._id}
                                        className="py-2 px-3 bg-red-500/15 border border-red-500/25 hover:bg-red-500/25 text-red-400 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                      >
                                        <XCircle className="w-3.5 h-3.5" />
                                        <span>Reject</span>
                                      </button>
                                    </>
                                  )}

                                  {claim.status === "approved" && claim.conversationId && (
                                    <Link href={`/chat?id=${claim.conversationId}`}>
                                      <button className="py-2 px-3 bg-green-500/15 border border-green-500/25 hover:bg-green-500/25 text-green-400 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer">
                                        <Inbox className="w-3.5 h-3.5 text-green-400" />
                                        <span>Open Secure Chat</span>
                                      </button>
                                    </Link>
                                  )}
                                </div>
                              </div>

                              {/* SIDE-BY-SIDE VERIFICATION COMPARISON */}
                              {isExpanded && claim.itemId && claim.itemId.verificationData && claim.claimantVerificationData && (
                                <div className="pt-4 border-t border-white/[0.05] space-y-4 animate-fadeIn">
                                  
                                  {/* AI Similarity score banner */}
                                  <div className="p-4 rounded-xl bg-gradient-to-r from-ct-indigo/20 to-ct-cyan/10 border border-ct-cyan/20 flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                      <ShieldAlert className="w-4.5 h-4.5 text-ct-cyan animate-pulse" />
                                      <div>
                                        <p className="text-xs font-bold text-ct-text-primary">AI Ownership Confidence Rating</p>
                                        <p className="text-[9px] text-ct-text-secondary mt-0.5">
                                          {verify.aiAvailable 
                                            ? `Semantic matching confidence level: ${verify.confidence}` 
                                            : "⚠️ AI Engine Offline - Fallback Manual Review Required"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <span className={`text-lg font-black tracking-wide ${
                                        verify.confidence === "VERY_HIGH" ? "text-green-400 text-glow-blue animate-pulse" :
                                        verify.confidence === "HIGH" ? "text-green-400 text-glow-blue" :
                                        verify.confidence === "MEDIUM" ? "text-yellow-400" :
                                        "text-red-400"
                                      }`}>
                                        {verify.score}% Confidence
                                      </span>
                                      {verify.earnedPoints !== null && (
                                        <p className="text-[9px] text-ct-text-muted mt-0.5">
                                          ({verify.earnedPoints}/{verify.possiblePoints} pts normalized)
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Administrative review flag for claimant fraud history */}
                                  {claim.verificationResult?.requiresAdminReview && (
                                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-[10px] font-bold flex items-center gap-2 shadow-sm animate-pulse">
                                      <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0 animate-bounce" />
                                      <span>⚠️ SUSPICIOUS CLAIMANT: Claimant has a history of high failed or suspicious claims. Manual Admin Review is strongly recommended.</span>
                                    </div>
                                  )}

                                  {/* AI Match Explanation summary list */}
                                  {claim.verificationResult?.explanation && (
                                    <div className="p-4 bg-black/45 border border-white/[0.04] rounded-2xl space-y-2 text-xs">
                                      <h4 className="text-[10px] font-bold text-ct-cyan uppercase tracking-wider mb-1 text-glow-blue">AI Verification Explanation</h4>
                                      <div className="space-y-1.5 font-sans">
                                        {claim.verificationResult.explanation.matchedFields && claim.verificationResult.explanation.matchedFields.length > 0 && (
                                          <p className="text-green-400 font-bold flex items-center gap-1.5 flex-wrap">
                                            <span className="uppercase text-[9px] text-ct-text-muted">Matched:</span>
                                            <span className="text-ct-text-secondary font-semibold">
                                              {claim.verificationResult.explanation.matchedFields.map((f: string) => `✓ ${f}`).join(", ")}
                                            </span>
                                          </p>
                                        )}
                                        {claim.verificationResult.explanation.partialMatches && claim.verificationResult.explanation.partialMatches.length > 0 && (
                                          <p className="text-yellow-400 font-bold flex items-center gap-1.5 flex-wrap">
                                            <span className="uppercase text-[9px] text-ct-text-muted">Partial:</span>
                                            <span className="text-ct-text-secondary font-semibold">
                                              {claim.verificationResult.explanation.partialMatches.map((f: string) => `~ ${f}`).join(", ")}
                                            </span>
                                          </p>
                                        )}
                                        {claim.verificationResult.explanation.mismatches && claim.verificationResult.explanation.mismatches.length > 0 && (
                                          <p className="text-red-400 font-bold flex items-center gap-1.5 flex-wrap">
                                            <span className="uppercase text-[9px] text-ct-text-muted">Mismatch:</span>
                                            <span className="text-ct-text-secondary font-semibold">
                                              {claim.verificationResult.explanation.mismatches.map((f: string) => `✗ ${f}`).join(", ")}
                                            </span>
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Dynamic Verification Breakdown Metrics */}
                                  <div className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl space-y-2 text-xs">
                                    <h4 className="text-[10px] font-bold text-ct-cyan uppercase tracking-wider mb-2">Verification Checklist</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                      <BreakdownItem label="Color Match" status={verify.colorScoreText} />
                                      <BreakdownItem label="Brand Match" status={verify.brandScoreText} />
                                      <BreakdownItem label="Contents Match" status={verify.contentsScoreText} />
                                      <BreakdownItem label="Location Match" status={verify.locationScoreText} />
                                      <BreakdownItem label="Semantic Similarity" status={verify.semanticSimilarity !== null ? `${verify.semanticSimilarity}%` : "N/A"} />
                                    </div>
                                    
                                    {verify.matchedTerms.length > 0 && (
                                      <div className="pt-3 border-t border-white/[0.04] mt-2">
                                        <p className="text-[9px] font-bold text-ct-text-muted uppercase tracking-wider mb-1.5">Common Matching Concepts (Explanation Layer):</p>
                                        <div className="flex flex-wrap gap-1.5">
                                          {verify.matchedTerms.map((term: string) => (
                                            <span key={term} className="px-2 py-0.5 rounded-lg bg-green-500/10 border border-green-500/25 text-green-400 text-[9px] font-bold">
                                              ✓ {term}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    
                                    {/* Finder Data Left Card */}
                                    <div className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.04] space-y-3">
                                      <p className="text-[10px] font-bold text-ct-cyan uppercase tracking-wider border-b border-white/[0.04] pb-1.5">
                                        Your Verification Keys (Finder)
                                      </p>
                                      <div className="space-y-2 text-xs">
                                        {Object.entries(claim.itemId.verificationData).map(([k, val]) => {
                                          if (k === "hideVerification" || k === "enableAIVerification" || k === "hideAnswers" || k === "enableAI") return null;
                                          return (
                                            <div key={k} className="bg-black/20 p-2.5 rounded-lg border border-white/[0.02]">
                                              <span className="text-[9px] text-ct-text-muted block uppercase font-bold">{k}</span>
                                              <span className="font-semibold text-ct-text-secondary mt-0.5 block">{String(val)}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* Claimant Answers Right Card */}
                                    <div className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.04] space-y-3">
                                      <p className="text-[10px] font-bold text-ct-purple uppercase tracking-wider border-b border-white/[0.04] pb-1.5">
                                        Claimant's Submitted Answers
                                      </p>
                                      <div className="space-y-2 text-xs">
                                        {Object.entries(claim.itemId.verificationData).map(([k, val]) => {
                                          if (k === "hideVerification" || k === "enableAIVerification" || k === "hideAnswers" || k === "enableAI") return null;
                                          const claimVal = claim.claimantVerificationData[k];
                                          const match = getFieldMatchDetail(val, claimVal);
                                          
                                          return (
                                            <div key={k} className={`p-2.5 rounded-lg border ${
                                              match.status === "match" ? "bg-green-500/[0.02] border-green-500/20" :
                                              match.status === "partial" ? "bg-yellow-500/[0.02] border-yellow-500/20" :
                                              "bg-red-500/[0.02] border-red-500/20"
                                            }`}>
                                              <span className="text-[9px] text-ct-text-muted block uppercase font-bold flex items-center justify-between">
                                                <span>{k}</span>
                                                <span className={`text-[8px] font-bold uppercase tracking-wider ${
                                                  match.status === "match" ? "text-green-400" :
                                                  match.status === "partial" ? "text-yellow-400" :
                                                  "text-red-400"
                                                }`}>
                                                  {match.label}
                                                </span>
                                              </span>
                                              <span className={`font-semibold mt-0.5 block ${
                                                match.status === "match" ? "text-green-400" :
                                                match.status === "partial" ? "text-yellow-400" :
                                                "text-red-400"
                                              }`}>
                                                {String(claimVal || "") || <span className="italic opacity-40">Unanswered</span>}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>

                                  </div>
                                </div>
                              )}

                            </div>
                          );
                        })}
                      </div>
                    )
                  )}

                  {/* SECTION: SETTINGS */}
                  {activeSection === "settings" && (
                    <div className="glass-strong rounded-3xl p-6 md:p-8 border border-white/[0.06] shadow-lg space-y-6">
                      <div>
                        <h2 className="text-xl font-bold text-ct-text-primary">Profile &amp; Account Settings</h2>
                        <p className="text-xs text-ct-text-secondary mt-1">
                          Manage your student details and reputation parameters.
                        </p>
                      </div>

                      <div className="p-4 bg-white/[0.01] border border-white/[0.04] rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <UserIcon className="w-8 h-8 text-ct-cyan" />
                          <div>
                            <p className="text-xs font-bold text-ct-text-primary">View Reputation Page</p>
                            <p className="text-[10px] text-ct-text-secondary mt-0.5">Inspect user trust scoring and returned statistics history.</p>
                          </div>
                        </div>
                        <Link href="/profile">
                          <button className="px-4 py-2 bg-ct-blue text-white text-xs font-bold rounded-xl hover:bg-ct-blue-bright transition-all cursor-pointer">
                            View Profile
                          </button>
                        </Link>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

          </div>

        </div>
      </div>
      <Footer />
    </>
  );
}

// Subcomponents
function AnalyticsCard({ title, count, color }: { title: string; count: number; color: string }) {
  return (
    <div className={`p-5 rounded-2xl border ${color} shadow-sm flex flex-col justify-between`}>
      <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">{title}</span>
      <h3 className="text-2xl font-black mt-2">{count}</h3>
    </div>
  );
}

function SidebarButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer text-left ${
        active 
          ? "bg-white/[0.04] border border-white/[0.08] text-white shadow-sm font-bold" 
          : "text-ct-text-secondary hover:text-ct-text-primary hover:bg-white/[0.02]"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="glass-strong rounded-3xl p-12 text-center border border-white/[0.06] shadow-md max-w-xl mx-auto mt-6">
      <Inbox className="w-10 h-10 text-ct-text-muted mx-auto mb-3 opacity-40 text-ct-cyan animate-pulse" />
      <h3 className="text-sm font-bold text-ct-text-primary">{title}</h3>
      <p className="text-xs text-ct-text-secondary mt-1.5 leading-relaxed">{desc}</p>
    </div>
  );
}

function DashboardCard({ item, type, actionLoading, onDelete }: { item: any; type: "lost" | "found"; actionLoading: string | null; onDelete: () => void }) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <div className="glass rounded-2xl overflow-hidden border border-white/[0.06] flex flex-col justify-between shadow-md relative group hover:border-white/[0.1] transition-colors">
      
      {/* Top Image */}
      <div className="h-36 bg-black/40 relative flex items-center justify-center overflow-hidden">
        {item.imagesHidden ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-black/60 relative backdrop-blur-md">
            {item.images && item.images[0] && !imgErr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.images[0]}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover opacity-25 blur-md"
                onError={() => setImgErr(true)}
              />
            ) : null}
            <div className="z-10 flex flex-col items-center gap-1.5 text-center px-4">
              <EyeOff className="w-4 h-4 text-ct-cyan animate-pulse" />
              <span className="text-[8px] font-bold text-ct-cyan uppercase tracking-wider">🔒 Blurred for Verification</span>
            </div>
          </div>
        ) : item.images && item.images[0] && !imgErr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.images[0]}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="text-ct-text-muted flex flex-col items-center gap-1">
            <Tag className="w-6 h-6 opacity-30" />
            <span className="text-[9px] uppercase tracking-wider">No Image</span>
          </div>
        )}

        <span className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border shadow-sm ${type === "lost" ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-ct-blue/10 border-ct-blue/30 text-ct-blue-bright"}`}>
          {type}
        </span>

        <span className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border shadow-sm ${
          item.status === "active" ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" : "bg-green-500/10 border-green-500/30 text-green-400"
        }`}>
          {item.status}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[9px] font-bold text-ct-cyan uppercase tracking-wider block">
            {item.category} • {item.subcategory}
          </span>
          <h3 className="text-xs font-bold text-ct-text-primary mt-1 line-clamp-1 group-hover:text-white transition-colors">{item.title}</h3>
          <p className="text-[11px] text-ct-text-secondary mt-1.5 line-clamp-2 leading-relaxed">
            {item.visibleDescription || item.description}
          </p>
        </div>

        {/* Small parameter values */}
        {item.verificationData && (
          <div className="mt-3 flex flex-wrap gap-1 border-t border-white/[0.04] pt-2.5">
            {Object.entries(item.verificationData).slice(0, 2).map(([k, val]) => {
              if (k === "hideVerification" || k === "enableAIVerification" || k === "hideAnswers" || k === "enableAI") return null;
              return (
                <span key={k} className="text-[8px] px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.05] text-ct-text-muted">
                  {k}: {String(val)}
                </span>
              );
            })}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-white/[0.04] space-y-1 text-[10px] text-ct-text-muted">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3" />
            <span className="line-clamp-1">{item.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            <span>{new Date(item.date).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Card actions */}
      <div className="px-4 py-2 border-t border-white/[0.04] bg-white/[0.01] flex items-center justify-between">
        <Link href={`/item/${item._id}`} className="text-[10px] font-bold text-ct-blue-bright hover:underline flex items-center gap-0.5">
          <span>Details Page</span>
        </Link>
        
        <button
          onClick={onDelete}
          disabled={actionLoading === item._id}
          className="p-1.5 text-ct-text-secondary hover:text-red-400 hover:bg-red-500/[0.08] rounded-lg transition-colors cursor-pointer"
          title="Delete Report"
        >
          {actionLoading === item._id ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-ct-text-muted" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

    </div>
  );
}
