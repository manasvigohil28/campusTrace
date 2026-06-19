"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Mail, Lock, ArrowRight, Loader2, Key } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);

    if (!res.success) {
      setError(res.error || "Invalid email or password.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="relative min-h-screen flex items-center justify-center px-4 pt-24 pb-12 overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-ct-blue/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] rounded-full bg-ct-purple/10 blur-[140px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          {/* Card */}
          <div className="glass-strong rounded-3xl p-8 md:p-10 border border-white/[0.08] shadow-[0_10px_50px_rgba(0,0,0,0.5)]">
            
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-ct-indigo to-ct-cyan items-center justify-center mb-4 shadow-[0_0_20px_rgba(99,102,241,0.25)]">
                <Key className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-ct-text-primary">
                Welcome Back
              </h1>
              <p className="text-sm text-ct-text-secondary mt-2">
                Sign in to your CampusTrace account
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-ct-text-secondary tracking-wider uppercase block">
                  University Email
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-4 w-4.5 h-4.5 text-ct-text-muted" />
                  <input
                    type="email"
                    required
                    placeholder="name@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl py-3 pl-12 pr-4 text-sm text-ct-text-primary placeholder:text-ct-text-muted focus:border-ct-blue/50 focus:bg-white/[0.05] focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-ct-text-secondary tracking-wider uppercase block">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-4 w-4.5 h-4.5 text-ct-text-muted" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl py-3 pl-12 pr-4 text-sm text-ct-text-primary placeholder:text-ct-text-muted focus:border-ct-blue/50 focus:bg-white/[0.05] focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-6 py-3.5 px-5 rounded-xl bg-gradient-to-r from-ct-indigo via-ct-blue to-ct-cyan text-white text-sm font-semibold tracking-wide shadow-[0_4px_15px_rgba(99,102,241,0.25)] hover:shadow-[0_4px_25px_rgba(99,102,241,0.4)] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4.5 h-4.5" />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="text-center mt-8 pt-6 border-t border-white/[0.05]">
              <p className="text-sm text-ct-text-secondary">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-medium text-ct-cyan hover:underline transition-colors"
                >
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
