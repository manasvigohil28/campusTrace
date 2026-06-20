"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll } from "framer-motion";
import { Tag, MapPin, Calendar, CheckCircle2, ShieldAlert, Sparkles, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Item {
  _id: string;
  title: string;
  category: string;
  subcategory: string;
  visibleDescription: string;
  location: string;
  date: string;
  images: string[];
  type: "lost" | "found";
  status: string;
}

export default function LiveActivity() {
  const [items, setItems] = useState<Item[]>([]);
  const [stats, setStats] = useState({ found: 120, returned: 45 });
  const scrollRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const fallbackItems: Item[] = [
    {
      _id: "mock1",
      title: "Matte Black MacBook Air M2",
      category: "Electronics",
      subcategory: "Laptops",
      visibleDescription: "Left on 2nd floor library study pod. Has a tech sticker on the front.",
      location: "Library (2nd Floor)",
      date: new Date().toISOString(),
      images: [],
      type: "found",
      status: "active"
    },
    {
      _id: "mock2",
      title: "Leather Coach Wallet",
      category: "Personal Items",
      subcategory: "Wallets",
      visibleDescription: "Brown leather wallet lost somewhere between Student Center and Gym.",
      location: "Student Center Plaza",
      date: new Date(Date.now() - 86400000).toISOString(),
      images: [],
      type: "lost",
      status: "active"
    },
    {
      _id: "mock3",
      title: "Sony WH-1000XM4 Headphones",
      category: "Electronics",
      subcategory: "Audio",
      visibleDescription: "Silver headphones found near the sports complex bench. Visibly new.",
      location: "Sports Complex",
      date: new Date(Date.now() - 172800000).toISOString(),
      images: [],
      type: "found",
      status: "active"
    },
    {
      _id: "mock4",
      title: "Engineering ID Card",
      category: "Documents",
      subcategory: "IDs",
      visibleDescription: "Name on card is Manasvi. Lost near the Chemistry lab.",
      location: "Chemistry Lab Building",
      date: new Date(Date.now() - 259200000).toISOString(),
      images: [],
      type: "lost",
      status: "active"
    }
  ];

  useEffect(() => {
    const fetchLatestItems = async () => {
      try {
        const res = await fetch(`${API_URL}/items/all`);
        if (res.ok) {
          const data = await res.json();
          // Filter active and format
          const formatted = data.map((item: any) => ({
            _id: item._id,
            title: item.title,
            category: item.category,
            subcategory: item.subcategory,
            visibleDescription: item.visibleDescription || item.description,
            location: item.location && typeof item.location === "object" ? item.location.public : item.location || "Unknown Location",
            date: item.date,
            images: item.images || [],
            type: item.type,
            status: item.status
          }));
          
          if (formatted.length > 0) {
            setItems(formatted.slice(0, 8));
            
            // Dynamic statistics based on items count
            const foundCount = data.filter((i: any) => i.type === "found").length;
            const resolvedCount = data.filter((i: any) => i.status === "claimed" || i.status === "resolved").length;
            setStats({
              found: 120 + foundCount,
              returned: 45 + resolvedCount
            });
          } else {
            setItems(fallbackItems);
          }
        } else {
          setItems(fallbackItems);
        }
      } catch (err) {
        setItems(fallbackItems);
      }
    };

    fetchLatestItems();
  }, [API_URL]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === "left" ? scrollLeft - 320 : scrollLeft + 320;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  return (
    <section className="relative py-24 bg-ct-bg-surface overflow-hidden">
      {/* Glow highlight */}
      <div className="absolute top-1/2 left-10 w-[300px] h-[300px] rounded-full bg-ct-blue/5 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Statistics Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="p-8 rounded-3xl glass-strong border border-white/[0.08] flex items-center justify-between shadow-lg relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-ct-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div>
              <p className="text-[11px] font-bold text-ct-cyan uppercase tracking-wider">Telemetry Live</p>
              <h3 className="text-4xl sm:text-5xl font-black text-ct-text-primary mt-2 text-glow-blue">
                {stats.found}
              </h3>
              <p className="text-sm text-ct-text-secondary mt-1">Belongings discovered on campus</p>
            </div>
            <Sparkles className="w-12 h-12 text-ct-blue/20 group-hover:text-ct-blue/40 transition-colors" />
          </div>

          <div className="p-8 rounded-3xl glass-strong border border-white/[0.08] flex items-center justify-between shadow-lg relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div>
              <p className="text-[11px] font-bold text-green-400 uppercase tracking-wider">Success Rate</p>
              <h3 className="text-4xl sm:text-5xl font-black text-ct-text-primary mt-2 text-glow-purple">
                {stats.returned}
              </h3>
              <p className="text-sm text-ct-text-secondary mt-1">Belongings successfully returned</p>
            </div>
            <CheckCircle2 className="w-12 h-12 text-green-500/20 group-hover:text-green-500/40 transition-colors" />
          </div>
        </div>

        {/* Section Header with Slider Controls */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <span className="inline-block px-3 py-1 rounded-full glass border border-white/[0.06] text-[10px] font-bold uppercase tracking-widest text-ct-text-secondary mb-3">
              Live Activity
            </span>
            <h2 className="text-3xl font-extrabold text-ct-text-primary">
              Recent Reported <span className="bg-gradient-to-r from-ct-blue-bright to-ct-cyan bg-clip-text text-transparent">Belongings</span>
            </h2>
            <p className="text-sm text-ct-text-secondary mt-1.5">
              Interact with the latest items reported by students. Click view details to check matching fields.
            </p>
          </div>

          {/* Slider controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => scroll("left")}
              className="p-3 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] text-ct-text-primary rounded-xl transition-all cursor-pointer shadow-md"
              suppressHydrationWarning={true}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-3 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] text-ct-text-primary rounded-xl transition-all cursor-pointer shadow-md"
              suppressHydrationWarning={true}
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal Slider Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-none select-none scroll-smooth"
          style={{ scrollbarWidth: "none" }}
        >
          {items.map((item) => (
            <motion.div
              key={item._id}
              className="flex-shrink-0 w-80 glass rounded-2xl border border-white/[0.06] hover:border-white/[0.12] hover:-translate-y-1 transition-all duration-300 snap-start flex flex-col justify-between overflow-hidden shadow-lg group cursor-pointer"
              whileHover={{ scale: 1.01 }}
            >
              {/* Media Image */}
              <div className="h-44 bg-black/40 relative flex items-center justify-center overflow-hidden">
                {item.images && item.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="text-ct-text-muted flex flex-col items-center gap-1.5">
                    <Tag className="w-8 h-8 opacity-30 animate-pulse" />
                    <span className="text-[9px] uppercase tracking-wider">No Image Attached</span>
                  </div>
                )}

                {/* Badge tags */}
                <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border shadow-md ${item.type === "lost" ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-ct-blue/10 border-ct-blue/30 text-ct-blue-bright"}`}>
                  {item.type}
                </span>

                {item.status !== "active" && (
                  <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-green-500/20 border border-green-500/30 text-green-400 shadow-md">
                    {item.status}
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-bold text-ct-cyan uppercase tracking-wider block">
                    {item.category} • {item.subcategory}
                  </span>
                  <h3 className="text-sm font-bold text-ct-text-primary mt-1 line-clamp-1 group-hover:text-white transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-ct-text-secondary mt-2 line-clamp-2 leading-relaxed">
                    {item.visibleDescription}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/[0.04] space-y-1.5 text-[10px] text-ct-text-muted">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="line-clamp-1">{item.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* View Details Link Footer */}
              <div className="px-5 py-3 border-t border-white/[0.04] bg-white/[0.01] flex items-center justify-between text-xs text-ct-text-secondary group-hover:text-ct-blue-bright transition-colors">
                <Link href={item._id.startsWith("mock") ? "/search" : `/item/${item._id}`} className="w-full flex items-center justify-between font-bold">
                  <span>View Details</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
