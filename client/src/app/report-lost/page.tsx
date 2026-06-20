"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, MapPin, Calendar, Image as ImageIcon, Send, Loader2, AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { CATEGORY_MAP, VERIFICATION_FIELDS } from "@/lib/categories";

export default function ReportLostPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  // Stepper State
  const [step, setStep] = useState(1);

  // Form Field States
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(Object.keys(CATEGORY_MAP)[0]);
  const [subcategory, setSubcategory] = useState(CATEGORY_MAP[Object.keys(CATEGORY_MAP)[0]][0]);
  const [description, setDescription] = useState("");
  const [publicLocationLost, setPublicLocationLost] = useState("");
  const [privateLocationLost, setPrivateLocationLost] = useState("");
  const [dateLost, setDateLost] = useState("");
  const [publicImageUrl, setPublicImageUrl] = useState("");
  const [verificationImageUrl, setVerificationImageUrl] = useState("");
  const [publicImagePreviewError, setPublicImagePreviewError] = useState(false);
  const [verificationImagePreviewError, setVerificationImagePreviewError] = useState(false);
  const [freeTextDescription, setFreeTextDescription] = useState("");
  const [verificationData, setVerificationData] = useState<Record<string, any>>({});
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Reset verificationData when category changes
  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setSubcategory(CATEGORY_MAP[cat][0]);
    setVerificationData({});
  };

  const handleVerificationChange = (name: string, value: any) => {
    setVerificationData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const isStep4Valid = () => {
    const fields = VERIFICATION_FIELDS[category] || [];
    for (const f of fields) {
      if (f.required && !verificationData[f.name]) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!title || !category || !subcategory || !description || !publicLocationLost || !privateLocationLost || !dateLost) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!isStep4Valid()) {
      setError("Please fill in all required verification fields.");
      return;
    }

    if (publicImageUrl && !publicImageUrl.startsWith("http://") && !publicImageUrl.startsWith("https://")) {
      setError("Please provide a valid public image URL starting with http:// or https://");
      return;
    }

    if (verificationImageUrl && !verificationImageUrl.startsWith("http://") && !verificationImageUrl.startsWith("https://")) {
      setError("Please provide a valid verification image URL starting with http:// or https://");
      return;
    }

    setSubmitting(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_URL}/items/lost`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          category,
          subcategory,
          visibleDescription: description,
          location: {
            public: publicLocationLost,
            private: privateLocationLost
          },
          dateLost: new Date(dateLost),
          publicImages: publicImageUrl ? [publicImageUrl] : [],
          verificationImages: verificationImageUrl ? [verificationImageUrl] : [],
          verificationData: {
            ...verificationData,
            freeTextDescription
          }
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to submit lost item report.");
      }

      setSuccess(true);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);

    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-ct-bg-deep flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-ct-cyan animate-spin" />
      </div>
    );
  }

  // Stepper Indicator render helper
  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-between max-w-xl mx-auto mb-12 relative">
        <div className="absolute top-1/2 left-4 right-4 h-[1px] bg-white/[0.06] -translate-y-1/2 z-0" />
        <div 
          className="absolute top-1/2 left-4 h-[2px] bg-gradient-to-r from-ct-blue to-ct-purple -translate-y-1/2 z-0 transition-all duration-500" 
          style={{ width: `${((step - 1) / 4) * 90}%` }}
        />
        
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="z-10 flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={() => s < step && setStep(s)}
              disabled={s >= step}
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border transition-all duration-300 ${
                s === step 
                  ? "bg-gradient-to-br from-ct-blue to-ct-purple border-transparent text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] scale-110" 
                  : s < step 
                    ? "bg-ct-indigo text-white border-transparent cursor-pointer" 
                    : "bg-[#0a0f24] text-ct-text-muted border-white/[0.08]"
              }`}
            >
              {s}
            </button>
            <span className={`text-[9px] font-bold uppercase tracking-wider ${s === step ? "text-ct-cyan" : "text-ct-text-muted"}`}>
              {s === 1 ? "Info" : s === 2 ? "Location" : s === 3 ? "Photos" : s === 4 ? "Verify" : "Review"}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="relative min-h-screen pt-28 pb-16 px-4 md:px-8 bg-ct-bg-deep">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-ct-blue/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[300px] h-[300px] rounded-full bg-ct-purple/5 blur-[120px] pointer-events-none" />

        <div className="max-w-2xl mx-auto relative z-10">
          
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-ct-text-secondary hover:text-ct-text-primary mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-ct-text-primary">
              Report <span className="bg-gradient-to-r from-red-400 to-ct-purple bg-clip-text text-transparent">Lost Item</span>
            </h1>
            <p className="text-sm text-ct-text-secondary mt-1">
              Follow our 5-step wizard to register your lost item in the secure campus trace system.
            </p>
          </div>

          {/* Stepper graphical progress bar */}
          {renderStepIndicator()}

          <div className="glass-strong rounded-3xl p-6 md:p-8 border border-white/[0.08] shadow-[0_10px_50px_rgba(0,0,0,0.4)]">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs text-center font-medium flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>Lost item reported successfully! Redirecting to dashboard...</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                
                {/* STEP 1: BASIC INFO */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5"
                  >
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-ct-text-secondary uppercase tracking-wider block">
                        Item Name / Title *
                      </label>
                      <div className="relative flex items-center">
                        <FileText className="absolute left-4 w-4.5 h-4.5 text-ct-text-muted" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Matte Black iPhone 13 Pro, Set of Dorm Keys"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl py-3 pl-12 pr-4 text-sm text-ct-text-primary placeholder:text-ct-text-muted focus:border-ct-blue/50 focus:bg-white/[0.05] focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-ct-text-secondary uppercase tracking-wider block">
                          Category *
                        </label>
                        <select
                          value={category}
                          onChange={(e) => handleCategoryChange(e.target.value)}
                          className="w-full bg-[#0a0f24] border border-white/[0.06] rounded-xl py-3 px-4 text-sm text-ct-text-primary focus:border-ct-blue/50 focus:outline-none transition-all cursor-pointer"
                        >
                          {Object.keys(CATEGORY_MAP).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-ct-text-secondary uppercase tracking-wider block">
                          Subcategory *
                        </label>
                        <select
                          value={subcategory}
                          onChange={(e) => setSubcategory(e.target.value)}
                          className="w-full bg-[#0a0f24] border border-white/[0.06] rounded-xl py-3 px-4 text-sm text-ct-text-primary focus:border-ct-blue/50 focus:outline-none transition-all cursor-pointer"
                        >
                          {(CATEGORY_MAP[category] || []).map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-ct-text-secondary uppercase tracking-wider block">
                        Public Visible Description *
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Describe where/how it was lost generally. DO NOT disclose private verification details like passwords, exact contents, or unique marks."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl py-3 px-4 text-sm text-ct-text-primary placeholder:text-ct-text-muted focus:border-ct-blue/50 focus:bg-white/[0.05] focus:outline-none transition-all resize-none"
                      />
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: LOCATION & DATE */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5"
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-ct-text-secondary uppercase tracking-wider block">
                          General Location / Area *
                        </label>
                        <div className="relative flex items-center">
                          <MapPin className="absolute left-4 w-4.5 h-4.5 text-ct-text-muted" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. Science Library, Gym, Student Center"
                            value={publicLocationLost}
                            onChange={(e) => setPublicLocationLost(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl py-3 pl-12 pr-4 text-sm text-ct-text-primary placeholder:text-ct-text-muted focus:border-ct-blue/50 focus:bg-white/[0.05] focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-ct-text-secondary uppercase tracking-wider block">
                          Exact Spot / Room (Hidden from public) *
                        </label>
                        <div className="relative flex items-center">
                          <MapPin className="absolute left-4 w-4.5 h-4.5 text-ct-text-muted" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. 2nd floor study cubicle desk, locker 45"
                            value={privateLocationLost}
                            onChange={(e) => setPrivateLocationLost(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl py-3 pl-12 pr-4 text-sm text-ct-text-primary placeholder:text-ct-text-muted focus:border-ct-blue/50 focus:bg-white/[0.05] focus:outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-ct-text-secondary uppercase tracking-wider block">
                        Approximate Date Lost *
                      </label>
                      <div className="relative flex items-center">
                        <Calendar className="absolute left-4 w-4.5 h-4.5 text-ct-text-muted" />
                        <input
                          type="date"
                          required
                          value={dateLost}
                          onChange={(e) => setDateLost(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl py-3 pl-12 pr-4 text-sm text-ct-text-primary placeholder:text-ct-text-muted focus:border-ct-blue/50 focus:bg-white/[0.05] focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: IMAGES */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5"
                  >
                    <div className="space-y-4">
                      {/* Public Image URL */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-ct-text-secondary uppercase tracking-wider block">
                          Public Image URL (Optional - visible to everyone)
                        </label>
                        <div className="relative flex items-center">
                          <ImageIcon className="absolute left-4 w-4.5 h-4.5 text-ct-text-muted" />
                          <input
                            type="url"
                            placeholder="e.g. https://example.com/backpack-public.jpg"
                            value={publicImageUrl}
                            onChange={(e) => {
                              setPublicImageUrl(e.target.value);
                              setPublicImagePreviewError(false);
                            }}
                            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl py-3 pl-12 pr-4 text-sm text-ct-text-primary placeholder:text-ct-text-muted focus:border-ct-blue/50 focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      {publicImageUrl && (
                        <div className="mt-2 p-2 rounded-2xl bg-white/[0.02] border border-white/[0.06] w-fit mx-auto text-center">
                          {!publicImagePreviewError ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={publicImageUrl}
                              alt="Public Preview"
                              className="max-h-36 rounded-xl object-contain bg-black/20 mx-auto"
                              onError={() => setPublicImagePreviewError(true)}
                            />
                          ) : (
                            <div className="p-2 text-[10px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                              ⚠️ Invalid public image URL. Please copy a direct image link.
                            </div>
                          )}
                        </div>
                      )}

                      {/* Verification Image URL */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-ct-text-secondary uppercase tracking-wider block">
                          Verification Image URL (Optional - hidden from claimants, shown to admin/finder)
                        </label>
                        <div className="relative flex items-center">
                          <ImageIcon className="absolute left-4 w-4.5 h-4.5 text-ct-text-muted" />
                          <input
                            type="url"
                            placeholder="e.g. https://example.com/backpack-serial-number.jpg"
                            value={verificationImageUrl}
                            onChange={(e) => {
                              setVerificationImageUrl(e.target.value);
                              setVerificationImagePreviewError(false);
                            }}
                            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl py-3 pl-12 pr-4 text-sm text-ct-text-primary placeholder:text-ct-text-muted focus:border-ct-blue/50 focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      {verificationImageUrl && (
                        <div className="mt-2 p-2 rounded-2xl bg-white/[0.02] border border-white/[0.06] w-fit mx-auto text-center">
                          {!verificationImagePreviewError ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={verificationImageUrl}
                              alt="Verification Preview"
                              className="max-h-36 rounded-xl object-contain bg-black/20 mx-auto"
                              onError={() => setVerificationImagePreviewError(true)}
                            />
                          ) : (
                            <div className="p-2 text-[10px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                              ⚠️ Invalid verification image URL. Please copy a direct image link.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: VERIFICATION DETAILS */}
                {step === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5"
                  >
                    <div className="p-4 rounded-xl bg-ct-blue/5 border border-ct-blue/20 mb-2">
                      <p className="text-xs text-ct-text-secondary leading-relaxed">
                        Provide specific verification details. These fields will be hidden and used to verify claims side-by-side.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(VERIFICATION_FIELDS[category] || []).map((f) => (
                        <div key={f.name} className={`space-y-1.5 ${f.type === "textarea" ? "sm:col-span-2" : ""}`}>
                          <label className="text-[11px] font-bold text-ct-text-secondary uppercase tracking-wider block">
                            {f.label} {f.required && "*"}
                          </label>
                          
                          {f.type === "textarea" ? (
                            <textarea
                              required={f.required}
                              rows={2}
                              placeholder={f.placeholder}
                              value={verificationData[f.name] || ""}
                              onChange={(e) => handleVerificationChange(f.name, e.target.value)}
                              className="w-full bg-[#050816] border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-ct-text-primary placeholder:text-ct-text-muted focus:border-ct-blue/50 focus:outline-none transition-all resize-none"
                            />
                          ) : f.type === "select" ? (
                            <select
                              required={f.required}
                              value={verificationData[f.name] || ""}
                              onChange={(e) => handleVerificationChange(f.name, e.target.value)}
                              className="w-full bg-[#050816] border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-ct-text-primary focus:border-ct-blue/50 focus:outline-none transition-all cursor-pointer"
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
                              value={verificationData[f.name] || ""}
                              onChange={(e) => handleVerificationChange(f.name, e.target.value)}
                              className="w-full bg-[#050816] border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-ct-text-primary placeholder:text-ct-text-muted focus:border-ct-blue/50 focus:outline-none transition-all"
                            />
                          )}
                        </div>
                      ))}

                      {/* Free-text Detailed Description for NLP */}
                      <div className="sm:col-span-2 space-y-1.5 mt-2">
                        <label className="text-[11px] font-bold text-ct-text-secondary uppercase tracking-wider block">
                          Detailed Narrative / Free-text Description (Optional)
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Provide a detailed natural description of the item (e.g. 'Dark blue pencil case with some blue ink stains inside, containing a plastic ruler and a metal compass'). This will be used for secure AI ownership verification."
                          value={freeTextDescription}
                          onChange={(e) => setFreeTextDescription(e.target.value)}
                          className="w-full bg-[#050816] border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-ct-text-primary placeholder:text-ct-text-muted focus:border-ct-blue/50 focus:outline-none transition-all resize-none"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 5: REVIEW & SUBMIT */}
                {step === 5 && (
                  <motion.div
                    key="step5"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5"
                  >
                    <h3 className="text-sm font-bold text-ct-text-primary uppercase tracking-wider pb-2 border-b border-white/[0.05]">
                      Review Report Summary
                    </h3>
                    
                    <div className="space-y-3.5 text-xs">
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-ct-text-muted font-semibold">Title:</span>
                        <span className="col-span-2 text-ct-text-primary font-bold">{title}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-ct-text-muted font-semibold">Category:</span>
                        <span className="col-span-2 text-ct-text-primary">{category} &gt; {subcategory}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-ct-text-muted font-semibold">General Location:</span>
                        <span className="col-span-2 text-ct-text-primary">{publicLocationLost}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-ct-text-muted font-semibold">Exact Spot (Hidden):</span>
                        <span className="col-span-2 text-ct-text-primary">{privateLocationLost}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-ct-text-muted font-semibold">Date Lost:</span>
                        <span className="col-span-2 text-ct-text-primary">{new Date(dateLost).toLocaleDateString()}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-ct-text-muted font-semibold">Public Description:</span>
                        <span className="col-span-2 text-ct-text-secondary leading-relaxed">{description}</span>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.04] mt-4 space-y-2">
                        <p className="text-[10px] font-bold text-ct-cyan uppercase tracking-wider">Hidden Verification Answers:</p>
                        {Object.entries(verificationData).map(([key, val]) => (
                          <div key={key} className="flex justify-between items-center text-[11px] py-1 border-b border-white/[0.02]">
                            <span className="text-ct-text-muted capitalize">{key}:</span>
                            <span className="text-ct-text-primary font-semibold">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>

              {/* STICKY FOOTER CONTROLS */}
              <div className="mt-8 pt-6 border-t border-white/[0.05] flex justify-between items-center">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep(prev => prev - 1)}
                    className="px-5 py-2.5 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] text-ct-text-primary text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                ) : (
                  <div />
                )}

                {step < 5 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (step === 3 && publicImageUrl && !publicImageUrl.startsWith("http://") && !publicImageUrl.startsWith("https://")) {
                        setError("Please enter a valid public image URL starting with http:// or https://");
                        return;
                      }
                      if (step === 3 && verificationImageUrl && !verificationImageUrl.startsWith("http://") && !verificationImageUrl.startsWith("https://")) {
                        setError("Please enter a valid verification image URL starting with http:// or https://");
                        return;
                      }
                      setError("");
                      setStep(prev => prev + 1);
                    }}
                    disabled={
                      (step === 1 && !title) ||
                      (step === 2 && (!publicLocationLost || !privateLocationLost || !dateLost)) ||
                      (step === 3 && (
                        (publicImageUrl !== "" && !publicImageUrl.startsWith("http://") && !publicImageUrl.startsWith("https://")) ||
                        (verificationImageUrl !== "" && !verificationImageUrl.startsWith("http://") && !verificationImageUrl.startsWith("https://"))
                      )) ||
                      (step === 4 && !isStep4Valid())
                    }
                    className="px-5 py-2.5 rounded-xl bg-ct-indigo hover:bg-ct-blue text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting || success}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-ct-indigo to-ct-blue text-white text-xs font-bold shadow-[0_4px_15px_rgba(99,102,241,0.25)] hover:shadow-[0_4px_25px_rgba(99,102,241,0.4)] disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Report</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
