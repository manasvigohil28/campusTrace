"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { MapPin, Calendar, Tag, ShieldAlert, Sparkles, Loader2, ArrowLeft, Inbox, HelpCircle, EyeOff, ShieldCheck, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/sections/Footer";
import { VERIFICATION_FIELDS } from "@/lib/categories";

export default function ItemDetailPage() {
  const { id } = useParams() as { id: string };
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [item, setItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imgErr, setImgErr] = useState(false);

  // Claim Form State
  const [claimVerificationData, setClaimVerificationData] = useState<Record<string, any>>({});
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState("");
  const [claimError, setClaimError] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const fetchItemDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/items/${id}`);
      if (res.ok) {
        const data = await res.json();
        setItem(data);
      } else {
        setError("Item not found or has been deleted.");
      }
    } catch (err) {
      console.error("Error fetching item:", err);
      setError("Something went wrong loading this item.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchItemDetails();
    }
  }, [id]);

  const handleClaimVerificationChange = (name: string, value: any) => {
    setClaimVerificationData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }

    setClaimError("");
    setClaimSuccess("");

    // Validate that all required verification fields are filled
    const fields = VERIFICATION_FIELDS[item.category] || [];
    for (const f of fields) {
      if (f.required && !claimVerificationData[f.name]) {
        setClaimError(`Please provide answer for: ${f.label}`);
        return;
      }
    }

    setClaimSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/claims`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemId: item._id,
          itemType: item.type === "lost" ? "LostItem" : "FoundItem",
          finderId: item.owner?._id || item.owner?.id,
          claimantVerificationData: claimVerificationData
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to submit claim request.");
      }

      setClaimSuccess("Claim request submitted successfully! The finder will compare your answers side-by-side to approve.");
      setClaimVerificationData({});
      
      // Re-fetch item to see update if any
      setTimeout(() => {
        router.push("/dashboard");
      }, 2500);

    } catch (err: any) {
      setClaimError(err.message || "Something went wrong.");
    } finally {
      setClaimSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-ct-bg-deep flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-ct-cyan animate-spin" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-ct-bg-deep flex flex-col items-center justify-center px-6">
          <ShieldAlert className="w-12 h-12 text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-ct-text-primary">{error || "Item not found"}</h2>
          <Link href="/search" className="mt-4 text-sm text-ct-cyan hover:underline flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Search Database
          </Link>
        </div>
      </>
    );
  }

  const isOwnItem = user && (item.owner?._id === user.id || item.owner?.id === user.id);

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen pt-28 pb-16 px-4 md:px-8 bg-ct-bg-deep overflow-hidden">
        {/* Glow blur backdrops */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-ct-blue/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-ct-purple/5 blur-[140px] pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          
          <Link
            href="/search"
            className="inline-flex items-center gap-2 text-sm text-ct-text-secondary hover:text-ct-text-primary mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Search Catalog
          </Link>

          {/* Grid Layout: left gallery, right details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
            
            {/* LEFT: IMAGE GALLERY */}
            <div className="glass-strong rounded-3xl overflow-hidden border border-white/[0.08] p-4 bg-black/40 shadow-xl flex flex-col items-center justify-center min-h-[350px]">
              {item.imagesHidden ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-black/60 relative backdrop-blur-md py-20 rounded-2xl">
                  {item.images && item.images[0] && !imgErr ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-contain opacity-25 blur-md"
                      onError={() => setImgErr(true)}
                    />
                  ) : null}
                  <div className="z-10 flex flex-col items-center gap-2 text-center px-4">
                    <EyeOff className="w-8 h-8 text-ct-cyan animate-pulse" />
                    <span className="text-xs font-bold text-ct-cyan uppercase tracking-wider">🔒 Images Blurred for Verification</span>
                    <span className="text-[10px] text-ct-text-muted max-w-xs leading-relaxed mt-1">
                      Verification images for found items are hidden from public viewing. The claimant must prove ownership to view all photos.
                    </span>
                  </div>
                </div>
              ) : item.images && item.images[0] && !imgErr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.images[0]}
                  alt={item.title}
                  className="w-full rounded-2xl max-h-[400px] object-contain bg-black/20"
                  onError={() => setImgErr(true)}
                />
              ) : (
                <div className="text-ct-text-muted flex flex-col items-center gap-2 py-20">
                  <Tag className="w-16 h-16 opacity-30 animate-pulse text-ct-cyan" />
                  <span className="text-[10px] uppercase tracking-widest font-bold">No Image Attached</span>
                  <p className="text-[10px] text-ct-text-muted mt-2 max-w-xs text-center">
                    The reporter didn't upload a picture. Use description and parameters to identify this item.
                  </p>
                </div>
              )}
            </div>

            {/* RIGHT: DETAILS */}
            <div className="space-y-6">
              
              {/* Heading */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${item.type === "lost" ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-ct-blue/10 border-ct-blue/30 text-ct-blue-bright"}`}>
                    {item.type} report
                  </span>
                  
                  {item.status !== "active" ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/20 border border-green-500/30 text-green-400">
                      {item.status}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-500/15 border border-yellow-500/30 text-yellow-400">
                      Active matching
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-ct-text-primary mt-1">{item.title}</h1>
                <p className="text-xs text-ct-cyan font-bold uppercase tracking-wider mt-1.5">
                  {item.category} • {item.subcategory}
                </p>
              </div>

              {/* Claims success/error messages */}
              {claimError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                  {claimError}
                </div>
              )}
              {claimSuccess && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs font-semibold">
                  {claimSuccess}
                </div>
              )}

              {/* Metadata Table */}
              <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl space-y-3 text-xs text-ct-text-secondary shadow-md">
                <div className="flex items-center justify-between py-1 border-b border-white/[0.02]">
                  <span className="flex items-center gap-1.5 text-ct-text-muted">
                    <MapPin className="w-4 h-4 text-ct-cyan" />
                    <span>Location:</span>
                  </span>
                  <span className="font-bold text-ct-text-primary text-[12px]">
                    {item.location && typeof item.location === "object"
                      ? `${item.location.public}${item.location.private ? ` (Spot: ${item.location.private})` : ""}`
                      : item.location || "Unknown"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/[0.02]">
                  <span className="flex items-center gap-1.5 text-ct-text-muted">
                    <Calendar className="w-4 h-4 text-ct-cyan" />
                    <span>Reported On:</span>
                  </span>
                  <span className="font-bold text-ct-text-primary text-[12px]">{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="flex items-center gap-1.5 text-ct-text-muted">
                    <Tag className="w-4 h-4 text-ct-cyan" />
                    <span>Reported By:</span>
                  </span>
                  <span className="font-bold text-ct-text-primary text-[12px]">{item.owner?.name || "Anonymous student"}</span>
                </div>
              </div>

              {/* Public Description */}
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-ct-text-secondary">Visible Description</h4>
                <p className="text-xs text-ct-text-secondary leading-relaxed bg-white/[0.01] p-4 rounded-xl border border-white/[0.04]">
                  {item.visibleDescription || item.description}
                </p>
              </div>

              {/* PRIVATE DETAILS (Only for owner/reporter or admin) */}
              {user && (isOwnItem || user.role === "admin") && item.verificationData && (
                <div className="p-5 rounded-2xl bg-ct-blue/5 border border-ct-blue/20 space-y-3">
                  <div className="flex items-center gap-1.5 text-ct-blue-bright">
                    <ShieldAlert className="w-4 h-4" />
                    <h4 className="text-[10px] font-bold uppercase tracking-wider">Verification Attributes (Visible to Owner/Admin)</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {Object.entries(item.verificationData).map(([key, val]) => {
                      if (key === "hideVerification" || key === "enableAIVerification") return null;
                      return (
                        <div key={key} className="bg-[#050816] p-2.5 rounded-xl border border-white/[0.04]">
                          <span className="text-[9px] text-ct-text-muted uppercase block">{key}</span>
                          <span className="font-bold text-ct-text-primary mt-0.5 block">{String(val)}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 flex items-center gap-3 text-[10px] text-ct-text-muted">
                    <span className="flex items-center gap-1">
                      <EyeOff className="w-3.5 h-3.5" /> Answers Hidden: {item.verificationData.hideVerification !== false ? "Yes" : "No"}
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-green-400" /> AI Engine: {item.verificationData.enableAIVerification !== false ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              )}

              {/* CLAIM QUESTIONNAIRE FORM */}
              <div className="pt-6 border-t border-white/[0.06]">
                {isOwnItem ? (
                  <div className="text-xs text-ct-text-secondary flex items-center gap-2 bg-white/[0.03] p-4 rounded-xl justify-center border border-white/[0.05]">
                    <ShieldAlert className="w-4 h-4 text-ct-cyan animate-pulse" />
                    <span>This is your reported item. You can manage claims received in your dashboard.</span>
                  </div>
                ) : item.status !== "active" ? (
                  <div className="text-xs text-green-400 flex items-center gap-2 bg-green-500/5 p-4 rounded-xl justify-center border border-green-500/10">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span>This item has been successfully claimed or resolved.</span>
                  </div>
                ) : (
                  <form onSubmit={handleClaimSubmit} className="space-y-4">
                    
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-4 shadow-sm">
                      <div className="flex items-center gap-1.5 text-ct-cyan">
                        <HelpCircle className="w-4.5 h-4.5" />
                        <h4 className="text-[10px] font-bold uppercase tracking-wider">Ownership Verification Questionnaire</h4>
                      </div>
                      
                      <p className="text-[11px] text-ct-text-secondary leading-relaxed font-sans">
                        To verify you are the rightful owner, please answer the questions below. Your answers will be compared side-by-side with the finder's details for validation.
                      </p>

                      <div className="space-y-3.5">
                        {(VERIFICATION_FIELDS[item.category] || []).map((f) => (
                          <div key={f.name} className="space-y-1.5">
                            <label className="text-[10px] font-bold text-ct-text-secondary uppercase tracking-wider block">
                              {f.label} {f.required && "*"}
                            </label>
                            
                            {f.type === "textarea" ? (
                              <textarea
                                required={f.required}
                                rows={2}
                                placeholder={f.placeholder}
                                value={claimVerificationData[f.name] || ""}
                                onChange={(e) => handleClaimVerificationChange(f.name, e.target.value)}
                                className="w-full bg-[#050816] border border-white/[0.06] rounded-xl p-3 text-xs text-ct-text-primary focus:outline-none focus:border-ct-blue/40 resize-none"
                              />
                            ) : f.type === "select" ? (
                              <select
                                required={f.required}
                                value={claimVerificationData[f.name] || ""}
                                onChange={(e) => handleClaimVerificationChange(f.name, e.target.value)}
                                className="w-full bg-[#050816] border border-white/[0.06] rounded-xl p-3 text-xs text-ct-text-primary focus:outline-none focus:border-ct-blue/40 cursor-pointer"
                              >
                                <option value="">-- Select Option --</option>
                                {f.options?.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={f.type}
                                required={f.required}
                                placeholder={f.placeholder}
                                value={claimVerificationData[f.name] || ""}
                                onChange={(e) => handleClaimVerificationChange(f.name, e.target.value)}
                                className="w-full bg-[#050816] border border-white/[0.06] rounded-xl p-3 text-xs text-ct-text-primary focus:outline-none focus:border-ct-blue/40"
                              />
                            )}
                          </div>
                        ))}

                        {/* Location Guess Field */}
                        <div className="space-y-1.5 pt-2 border-t border-white/[0.04]">
                          <label className="text-[10px] font-bold text-ct-text-secondary uppercase tracking-wider block">
                            Where did you lose this item? (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Science Library 2nd floor study rooms, Student Gym"
                            value={claimVerificationData.locationGuess || ""}
                            onChange={(e) => handleClaimVerificationChange("locationGuess", e.target.value)}
                            className="w-full bg-[#050816] border border-white/[0.06] rounded-xl p-3 text-xs text-ct-text-primary focus:outline-none focus:border-ct-blue/40"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={claimSubmitting}
                      className="w-full py-3.5 bg-gradient-to-r from-ct-indigo to-ct-blue text-white rounded-xl font-bold text-xs shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg"
                    >
                      {claimSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Submitting claim request...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Submit Claim &amp; Verify Ownership</span>
                        </>
                      )}
                    </button>

                  </form>
                )}
              </div>

            </div>

          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
