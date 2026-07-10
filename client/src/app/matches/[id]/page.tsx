"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Bot, MapPin, Calendar, Tag, CheckCircle2, MinusCircle,
  XCircle, Loader2, Sparkles, ShieldAlert, ExternalLink, ChevronRight
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function ReviewMatchPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const matchId = params?.id as string;

  const [match, setMatch] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!token || !matchId) return;

    const load = async () => {
      setFetching(true);
      try {
        // Mark as viewed
        await fetch(`${API_URL}/matches/${matchId}/viewed`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` }
        });

        const res = await fetch(`${API_URL}/matches/${matchId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          setError("Match not found or you are not authorized to view it.");
          return;
        }
        const data = await res.json();
        setMatch(data);
      } catch {
        setError("Failed to load match data.");
      } finally {
        setFetching(false);
      }
    };

    load();
  }, [token, matchId, API_URL]);

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-ct-bg-deep flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-xs text-ct-text-secondary">Loading match data...</p>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-ct-bg-deep flex flex-col items-center justify-center gap-4">
        <ShieldAlert className="w-10 h-10 text-red-400/60" />
        <p className="text-sm text-ct-text-secondary">{error || "Match not found."}</p>
        <Link href="/dashboard">
          <button className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white font-bold cursor-pointer">
            Back to Dashboard
          </button>
        </Link>
      </div>
    );
  }

  const lost  = match.lostItemId;
  const found = match.foundItemId;
  const score = match.overallScore || 0;
  const confidence = match.confidence || "MEDIUM";

  const scoreGradient =
    score >= 90 ? "from-emerald-500 to-green-400" :
    score >= 80 ? "from-yellow-500 to-amber-400"   :
    "from-orange-500 to-red-400";

  const confidenceBg =
    confidence === "EXCELLENT" ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300" :
    confidence === "VERY_HIGH" ? "bg-green-500/15 border-green-500/30 text-green-300"       :
    confidence === "HIGH"      ? "bg-yellow-500/15 border-yellow-500/30 text-yellow-300"    :
    "bg-orange-500/15 border-orange-500/30 text-orange-300";

  return (
    <>
      <Navbar />
      <div className="relative min-h-screen pt-28 pb-20 px-4 md:px-8 bg-ct-bg-deep">
        <div className="max-w-5xl mx-auto relative z-10">

          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-xs text-ct-text-secondary hover:text-white transition-colors mb-8 group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Dashboard
          </button>

          {/* Page title */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-ct-text-primary">
                  AI Match <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Review</span>
                </h1>
                <p className="text-xs text-ct-text-secondary mt-0.5">Side-by-side comparison — all-MiniLM-L6-v2 · Phase 5</p>
              </div>
            </div>
          </div>

          {/* Score banner */}
          <div className="glass-strong rounded-3xl p-6 border border-white/[0.06] shadow-xl mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Big score */}
              <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${scoreGradient} flex flex-col items-center justify-center shadow-xl flex-shrink-0`}>
                <span className="text-white font-black text-3xl leading-tight">{score}</span>
                <span className="text-white/80 text-[10px] font-bold">%</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${confidenceBg}`}>
                    {confidence.replace("_", " ")} Match
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-white/[0.03] border-white/[0.08] text-ct-text-muted">
                    {match.status}
                  </span>
                  <span className="text-[10px] text-ct-text-muted">
                    {match.aiModel} · {match.embeddingDimension}D
                  </span>
                </div>

                {/* Reason summary */}
                <p className="text-sm text-ct-text-primary font-semibold leading-relaxed mb-3">
                  {match.matchReason?.reasonSummary || "AI-based semantic match"}
                </p>

                {/* Score bar */}
                <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden max-w-sm">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${scoreGradient} transition-all duration-700`}
                    style={{ width: `${score}%` }}
                  />
                </div>

                {/* Score breakdown */}
                <div className="mt-3 flex gap-3 flex-wrap">
                  <ScorePill label="Semantic" value={match.semanticScore} color="text-ct-blue-bright" bg="bg-ct-blue/10 border-ct-blue/20" />
                  <ScorePill label="Fields" value={match.fieldScore} color="text-ct-cyan" bg="bg-ct-cyan/10 border-ct-cyan/20" />
                  <ScorePill label="Location" value={match.locationScore} color="text-ct-purple" bg="bg-ct-purple/10 border-ct-purple/20" />
                  {match.semanticSimilarity != null && (
                    <span className="text-[9px] px-2 py-1 rounded-full border bg-white/[0.03] border-white/[0.06] text-ct-text-muted font-mono">
                      raw cosine: {match.semanticSimilarity?.toFixed(4)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Side-by-side comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <ItemCard item={lost}  type="lost"  label="Lost Item" />
            <ItemCard item={found} type="found" label="Found Item" />
          </div>

          {/* Field comparison table */}
          <FieldComparisonTable lost={lost} found={found} matchReason={match.matchReason} />

          {/* Matched Keywords */}
          {match.matchReason?.matchedKeywords?.length > 0 && (
            <div className="glass-strong rounded-3xl p-6 border border-white/[0.06] shadow-lg mb-8">
              <h3 className="text-sm font-bold text-ct-text-primary mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Shared Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {match.matchReason.matchedKeywords.map((kw: string) => (
                  <span key={kw} className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-4 flex-wrap justify-center">
            {found?._id && (
              <Link href={`/item/${found._id}`}>
                <button className="py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-sm font-bold shadow-lg transition-all flex items-center gap-2 cursor-pointer">
                  <ExternalLink className="w-4 h-4" />
                  View Found Item & Claim
                </button>
              </Link>
            )}
            {lost?._id && (
              <Link href={`/item/${lost._id}`}>
                <button className="py-3 px-6 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white text-sm font-bold transition-all flex items-center gap-2 cursor-pointer">
                  <ExternalLink className="w-4 h-4" />
                  View Lost Item
                </button>
              </Link>
            )}
            <Link href="/dashboard">
              <button className="py-3 px-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] text-ct-text-secondary text-sm font-semibold transition-all cursor-pointer">
                Back to Dashboard
              </button>
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function ScorePill({ label, value, color, bg }: { label: string; value: number | null; color: string; bg: string }) {
  if (value == null) return null;
  return (
    <span className={`text-[10px] px-2.5 py-1 rounded-full border ${bg} ${color} font-bold`}>
      {label}: {value}%
    </span>
  );
}

function ItemCard({ item, type, label }: { item: any; type: "lost" | "found"; label: string }) {
  const isLost = type === "lost";
  const accentColor = isLost ? "border-red-500/20 text-red-400/70" : "border-emerald-500/20 text-emerald-400/70";
  const headerBg    = isLost ? "bg-red-500/[0.03]" : "bg-emerald-500/[0.03]";

  if (!item) {
    return (
      <div className="glass-strong rounded-3xl border border-white/[0.06] p-8 flex items-center justify-center text-ct-text-muted text-sm">
        Item no longer available
      </div>
    );
  }

  const dateStr = isLost
    ? (item.dateLost  ? new Date(item.dateLost).toLocaleDateString()  : "—")
    : (item.dateFound ? new Date(item.dateFound).toLocaleDateString() : "—");

  const vd = item.verificationData || {};

  return (
    <div className={`glass-strong rounded-3xl border ${isLost ? "border-red-500/10" : "border-emerald-500/10"} shadow-lg overflow-hidden`}>
      {/* Card header */}
      <div className={`px-5 py-3.5 border-b border-white/[0.04] ${headerBg} flex items-center justify-between`}>
        <span className={`text-[9px] font-black uppercase tracking-widest ${isLost ? "text-red-400" : "text-emerald-400"}`}>
          {label}
        </span>
        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
          item.status === "active" ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" : "bg-green-500/10 border-green-500/30 text-green-400"
        }`}>
          {item.status}
        </span>
      </div>

      {/* Image */}
      {item.publicImages?.[0] && (
        <div className="h-40 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.publicImages[0]}
            alt={item.title}
            className="w-full h-full object-cover opacity-80"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      )}

      <div className="p-5 space-y-3">
        <div>
          <p className="text-[9px] font-bold text-ct-cyan uppercase tracking-wider">{item.category} · {item.subcategory}</p>
          <h3 className="text-base font-extrabold text-ct-text-primary mt-0.5">{item.title}</h3>
          {item.visibleDescription && (
            <p className="text-xs text-ct-text-secondary mt-1.5 leading-relaxed line-clamp-3">{item.visibleDescription}</p>
          )}
        </div>

        {/* Metadata */}
        <div className="space-y-1.5 text-xs text-ct-text-muted border-t border-white/[0.04] pt-3">
          {item.location?.public && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-ct-cyan flex-shrink-0" />
              <span>{item.location.public}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-ct-cyan flex-shrink-0" />
            <span>{isLost ? "Lost" : "Found"}: {dateStr}</span>
          </div>
          {item.ownerId?.name && (
            <div className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-ct-cyan flex-shrink-0" />
              <span>By: {item.ownerId.name}</span>
            </div>
          )}
          {item.finderId?.name && (
            <div className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-ct-cyan flex-shrink-0" />
              <span>Found by: {item.finderId.name}</span>
            </div>
          )}
        </div>

        {/* Verification fields */}
        {Object.keys(vd).length > 0 && (
          <div className="border-t border-white/[0.04] pt-3 grid grid-cols-2 gap-2">
            {Object.entries(vd).map(([k, v]) => {
              if (["hideVerification","enableAIVerification","hideAnswers","enableAI"].includes(k)) return null;
              return (
                <div key={k} className="bg-black/25 rounded-xl p-2 border border-white/[0.03]">
                  <span className="text-[8px] text-ct-text-muted uppercase tracking-wider block font-bold">{k}</span>
                  <span className="text-[10px] text-ct-text-secondary mt-0.5 block line-clamp-1">{String(v)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function FieldComparisonTable({ lost, found, matchReason }: { lost: any; found: any; matchReason: any }) {
  if (!lost || !found) return null;

  const matchedFields  = matchReason?.matchedFields  || [];
  const partialFields  = matchReason?.partialFields  || [];

  const lostVd  = lost.verificationData  || {};
  const foundVd = found.verificationData || {};

  const allKeys = Array.from(new Set([
    ...Object.keys(lostVd),
    ...Object.keys(foundVd),
    "location",
  ])).filter(k => !["hideVerification","enableAIVerification","hideAnswers","enableAI"].includes(k));

  if (allKeys.length === 0) return null;

  return (
    <div className="glass-strong rounded-3xl border border-white/[0.06] shadow-lg mb-8 overflow-hidden">
      <div className="px-6 py-4 border-b border-white/[0.04] flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-bold text-ct-text-primary">Field-by-Field Comparison</h3>
      </div>

      <div className="divide-y divide-white/[0.03]">
        {/* Header row */}
        <div className="grid grid-cols-3 gap-4 px-6 py-3 bg-white/[0.01]">
          <span className="text-[9px] font-black uppercase tracking-widest text-ct-text-muted">Field</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-red-400/70">Lost Item</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400/70">Found Item</span>
        </div>

        {allKeys.map(key => {
          const lVal = key === "location"
            ? (lost.location?.public || "—")
            : (lostVd[key] != null ? String(lostVd[key]) : "—");
          const fVal = key === "location"
            ? (found.location?.public || "—")
            : (foundVd[key] != null ? String(foundVd[key]) : "—");

          const isMatch   = matchedFields.includes(key);
          const isPartial = partialFields.includes(key);

          const Icon = isMatch ? CheckCircle2 : isPartial ? MinusCircle : XCircle;
          const iconColor = isMatch ? "text-emerald-400" : isPartial ? "text-yellow-400" : "text-red-400/40";
          const rowBg = isMatch ? "bg-emerald-500/[0.02]" : isPartial ? "bg-yellow-500/[0.02]" : "";

          return (
            <div key={key} className={`grid grid-cols-3 gap-4 px-6 py-3 items-center ${rowBg} hover:bg-white/[0.02] transition-colors`}>
              <div className="flex items-center gap-2">
                <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${iconColor}`} />
                <span className="text-[10px] font-semibold text-ct-text-secondary capitalize">
                  {key === "specialMarks" ? "Special Marks" : key}
                </span>
              </div>
              <span className="text-[10px] text-ct-text-primary line-clamp-2">{lVal}</span>
              <span className="text-[10px] text-ct-text-primary line-clamp-2">{fVal}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
