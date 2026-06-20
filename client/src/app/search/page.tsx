"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, MapPin, Calendar, Tag, Filter, ShieldAlert, Sparkles, Loader2, AlertCircle, EyeOff } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { CATEGORY_MAP } from "@/lib/categories";

function SearchContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Search and filter state
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState("All Categories");
  const [subcategory, setSubcategory] = useState("All Subcategories");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("all"); // "all", "lost", "found"
  const [status, setStatus] = useState("active"); // "all", "active", "claimed", "resolved"

  const [items, setItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  // Reset subcategory when category changes
  useEffect(() => {
    setSubcategory("All Subcategories");
  }, [category]);

  const fetchItems = async () => {
    setLoadingItems(true);
    try {
      let url = `${API_URL}/items/all?`;
      if (query) url += `q=${encodeURIComponent(query)}&`;
      if (category && category !== "All Categories") url += `category=${encodeURIComponent(category)}&`;
      if (subcategory && subcategory !== "All Subcategories") url += `subcategory=${encodeURIComponent(subcategory)}&`;
      if (location) url += `location=${encodeURIComponent(location)}&`;
      if (status && status !== "all") url += `status=${status}&`;

      const res = await fetch(url);
      if (res.ok) {
        let data = await res.json();
        // Client side filtering for type
        if (type !== "all") {
          data = data.filter((item: any) => item.type === type);
        }
        setItems(data);
      }
    } catch (err) {
      console.error("Error fetching items:", err);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [category, subcategory, type, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 relative z-10">
      
      {/* Header */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl font-extrabold text-ct-text-primary tracking-tight md:text-4xl">
          Search <span className="bg-gradient-to-r from-ct-blue-bright to-ct-cyan bg-clip-text text-transparent">Campus Database</span>
        </h1>
        <p className="mt-2 text-sm text-ct-text-secondary">
          Find lost matching keys, electronics, bags, books and verify ownership instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-strong rounded-2xl p-5 border border-white/[0.06] shadow-lg">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.05]">
              <Filter className="w-4.5 h-4.5 text-ct-cyan" />
              <h2 className="text-sm font-semibold tracking-wider uppercase text-ct-text-primary">Filters</h2>
            </div>

            <div className="space-y-4">
              
              {/* Type selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-ct-text-muted uppercase tracking-wider block">Item Type</label>
                <div className="grid grid-cols-3 gap-1 bg-white/[0.03] p-1 rounded-lg border border-white/[0.04]">
                  <button
                    onClick={() => setType("all")}
                    className={`py-1.5 px-2 text-xs font-medium rounded-md transition-all cursor-pointer ${type === "all" ? "bg-ct-indigo text-white shadow-sm" : "text-ct-text-secondary hover:text-ct-text-primary"}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setType("lost")}
                    className={`py-1.5 px-2 text-xs font-medium rounded-md transition-all cursor-pointer ${type === "lost" ? "bg-red-500/80 text-white shadow-sm" : "text-ct-text-secondary hover:text-ct-text-primary"}`}
                  >
                    Lost
                  </button>
                  <button
                    onClick={() => setType("found")}
                    className={`py-1.5 px-2 text-xs font-medium rounded-md transition-all cursor-pointer ${type === "found" ? "bg-ct-blue text-white shadow-sm" : "text-ct-text-secondary hover:text-ct-text-primary"}`}
                  >
                    Found
                  </button>
                </div>
              </div>

              {/* Category selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-ct-text-muted uppercase tracking-wider block">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#0a0f24] border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-ct-text-primary focus:border-ct-blue/50 focus:outline-none transition-all cursor-pointer"
                >
                  <option value="All Categories">All Categories</option>
                  {Object.keys(CATEGORY_MAP).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Subcategory selector (conditionally shown) */}
              {category !== "All Categories" && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-ct-text-muted uppercase tracking-wider block">Subcategory</label>
                  <select
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full bg-[#0a0f24] border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-ct-text-primary focus:border-ct-blue/50 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="All Subcategories">All Subcategories</option>
                    {(CATEGORY_MAP[category] || []).map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Location filter */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-ct-text-muted uppercase tracking-wider block">Location (Keywords)</label>
                <div className="relative flex items-center">
                  <MapPin className="absolute left-3 w-4 h-4 text-ct-text-muted" />
                  <input
                    type="text"
                    placeholder="e.g. Library, Gym"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl py-2 pl-9 pr-3 text-xs text-ct-text-primary placeholder:text-ct-text-muted focus:border-ct-blue/50 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-ct-text-muted uppercase tracking-wider block">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-[#0a0f24] border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-ct-text-primary focus:border-ct-blue/50 focus:outline-none transition-all cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="claimed">Claimed</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <button
                onClick={fetchItems}
                className="w-full mt-4 py-2 px-3 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Apply Filters
              </button>

            </div>
          </div>
        </div>

        {/* Search Input & Cards Grid */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative group">
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-ct-blue/20 via-ct-purple/10 to-ct-cyan/20 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm" />
            <div className="relative flex items-center gap-3 px-4 py-3 rounded-2xl glass border border-white/[0.06] focus-within:border-ct-blue/30 transition-all">
              <Search className="w-5 h-5 text-ct-text-muted flex-shrink-0" />
              <input
                type="text"
                placeholder="Search database (e.g. AirPods, keys, textbook)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-ct-text-primary placeholder:text-ct-text-muted text-sm outline-none"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-ct-indigo to-ct-blue text-white text-xs font-semibold shadow-md cursor-pointer hover:shadow-lg transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Search
              </button>
            </div>
          </form>

          {/* Cards list */}
          {loadingItems ? (
            <div className="h-64 flex flex-col items-center justify-center text-ct-text-secondary gap-3">
              <Loader2 className="w-8 h-8 text-ct-cyan animate-spin" />
              <p className="text-sm">Fetching items...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="glass-strong rounded-3xl p-12 text-center border border-white/[0.06]">
              <AlertCircle className="w-10 h-10 text-ct-text-muted mx-auto mb-3" />
              <h3 className="text-base font-bold text-ct-text-primary">No items found</h3>
              <p className="text-xs text-ct-text-secondary mt-1">Try modifying your keywords or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <Link
                  key={item._id}
                  href={`/item/${item._id}`}
                  className="glass rounded-2xl overflow-hidden border border-white/[0.06] hover:border-white/[0.12] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between shadow-md group"
                >
                  <div>
                    {/* Card Image */}
                    <div className="h-40 bg-black/40 relative flex items-center justify-center overflow-hidden">
                      {item.imagesHidden ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-black/60 relative backdrop-blur-md">
                          {item.images && item.images[0] && !brokenImages[item._id] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.images[0]}
                              alt={item.title}
                              className="absolute inset-0 w-full h-full object-cover opacity-25 blur-md"
                              onError={() => {
                                setBrokenImages(prev => ({ ...prev, [item._id]: true }));
                              }}
                            />
                          ) : null}
                          <div className="z-10 flex flex-col items-center gap-1.5 text-center px-4">
                            <EyeOff className="w-4 h-4 text-ct-cyan animate-pulse" />
                            <span className="text-[8px] font-bold text-ct-cyan uppercase tracking-wider">🔒 Blurred for Verification</span>
                          </div>
                        </div>
                      ) : item.images && item.images[0] && !brokenImages[item._id] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={() => {
                            setBrokenImages(prev => ({ ...prev, [item._id]: true }));
                          }}
                        />
                      ) : (
                        <div className="text-ct-text-muted flex flex-col items-center gap-1">
                          <Tag className="w-8 h-8 opacity-40" />
                          <span className="text-[10px] uppercase tracking-wider">No Image</span>
                        </div>
                      )}

                      {/* Type Badge */}
                      <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${item.type === "lost" ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-ct-blue/10 border-ct-blue/30 text-ct-blue-bright"}`}>
                        {item.type}
                      </span>

                      {/* Status Badge */}
                      {item.status !== "active" && (
                        <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/20 border border-green-500/30 text-green-400 shadow-sm">
                          {item.status}
                        </span>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-5">
                      <p className="text-[10px] font-bold text-ct-cyan uppercase tracking-wider mb-1">
                        {item.category} • {item.subcategory}
                      </p>
                      <h3 className="text-sm font-bold text-ct-text-primary group-hover:text-white line-clamp-1 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-ct-text-secondary line-clamp-2 mt-2 leading-relaxed font-sans">
                        {item.visibleDescription || item.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <div className="pt-3 border-t border-white/[0.04] space-y-1 text-[11px] text-ct-text-muted">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-ct-text-muted" />
                        <span className="line-clamp-1">
                          {item.location && typeof item.location === "object" ? item.location.public : item.location || "Unknown"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-ct-text-muted" />
                        <span>{new Date(item.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>
      </div>

    </div>
  );
}

export default function SearchPage() {
  return (
    <>
      <Navbar />
      <div className="relative min-h-screen bg-ct-bg-deep overflow-hidden">
        {/* Glow background blobs */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-ct-blue/5 blur-[120px] pointer-events-none animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-ct-purple/5 blur-[140px] pointer-events-none animate-pulse-glow" />
        
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-ct-cyan animate-spin" />
          </div>
        }>
          <SearchContent />
        </Suspense>
      </div>
    </>
  );
}
