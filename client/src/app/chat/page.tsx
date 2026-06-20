"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, MessageSquare, Loader2, User, RefreshCw, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

function ChatContent() {
  const { user, token, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeConvIdFromQuery = searchParams.get("id");

  // State
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch all conversations
  const fetchConversations = async (silent = false) => {
    if (!token) return;
    if (!silent) setLoadingConvs(true);
    try {
      const res = await fetch(`${API_URL}/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);

        // If there's an active query parameter, set active conversation
        if (activeConvIdFromQuery) {
          const found = data.find((c: any) => c._id === activeConvIdFromQuery);
          if (found) {
            setActiveConv(found);
          }
        } else if (!activeConv && data.length > 0) {
          // Default to first conversation
          setActiveConv(data[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      if (!silent) setLoadingConvs(false);
    }
  };

  // Fetch messages for active conversation
  const fetchMessages = async (silent = false) => {
    if (!token || !activeConv) return;
    if (!silent) setLoadingMessages(true);
    try {
      const res = await fetch(`${API_URL}/conversations/${activeConv._id}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (token) {
      fetchConversations();
    }
  }, [token, activeConvIdFromQuery]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConv) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [activeConv]);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Poll for new messages and conversation lists
  useEffect(() => {
    if (!token || !activeConv) return;

    const interval = setInterval(() => {
      fetchMessages(true);
      fetchConversations(true);
    }, 4000); // Poll every 4 seconds

    return () => clearInterval(interval);
  }, [token, activeConv?._id]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv || !token) return;

    setSending(true);
    setError("");
    const messageToSend = inputText.trim();
    setInputText("");

    try {
      const res = await fetch(`${API_URL}/conversations/${activeConv._id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: messageToSend })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to send message.");
      }

      const newMsg = await res.json();
      setMessages(prev => [...prev, newMsg]);
      scrollToBottom();
    } catch (err: any) {
      setError(err.message || "Error sending message.");
      // Restore input text on error
      setInputText(messageToSend);
    } finally {
      setSending(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-ct-bg-deep flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-ct-cyan animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 relative z-10 h-[calc(100vh-60px)] flex flex-col">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] text-ct-text-secondary hover:text-ct-text-primary transition-all">
            <ArrowLeft className="w-4.5 h-4.5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-ct-text-primary flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-ct-cyan" />
              <span>Handoff Message Board</span>
            </h1>
            <p className="text-[11px] text-ct-text-secondary">
              Coordinate securely with other verified campus trace participants.
            </p>
          </div>
        </div>

        <button 
          onClick={() => {
            fetchConversations();
            if (activeConv) fetchMessages();
          }}
          className="p-2.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] text-ct-text-secondary rounded-lg transition-all flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold">Refresh</span>
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 glass-strong rounded-3xl border border-white/[0.06] overflow-hidden min-h-[450px] shadow-[0_15px_50px_rgba(0,0,0,0.5)]">
        
        {/* SIDEBAR: CONVERSATION LIST */}
        <div className="md:col-span-1 border-r border-white/[0.06] flex flex-col bg-black/20">
          <div className="p-4 border-b border-white/[0.06] bg-white/[0.01]">
            <p className="text-[10px] font-extrabold uppercase text-ct-text-muted tracking-wider">Active Chats</p>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingConvs ? (
              <div className="p-8 text-center text-ct-text-muted flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-ct-cyan" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-ct-text-secondary">
                <p>No active conversations.</p>
                <p className="text-[10px] text-ct-text-muted mt-1 leading-normal">Approved claims automatically generate secure handoff chat channels.</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const partner = conv.participants.find((p: any) => !p.isSelf);
                const isActive = activeConv?._id === conv._id;

                return (
                  <button
                    key={conv._id}
                    onClick={() => setActiveConv(conv)}
                    className={`w-full p-3 rounded-xl transition-all text-left flex flex-col gap-1.5 cursor-pointer ${
                      isActive 
                        ? "bg-white/[0.05] border border-white/[0.08] shadow-sm" 
                        : "hover:bg-white/[0.02] border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ct-text-primary flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-ct-cyan" />
                        {partner?.name || "Student Partner"}
                      </span>
                    </div>
                    <span className="text-[10px] text-ct-text-muted truncate">Item: {conv.itemTitle}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* MAIN CHAT BOX */}
        <div className="md:col-span-3 flex flex-col bg-white/[0.01]">
          {activeConv ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-white/[0.06] bg-black/10 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold text-ct-text-primary">
                    Chatting with: {activeConv.participants.find((p: any) => !p.isSelf)?.name || "Student Partner"}
                  </h3>
                  <p className="text-[10px] text-ct-cyan font-semibold mt-0.5">
                    Handoff Item: {activeConv.itemTitle}
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-green-500/10 border border-green-500/30 text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                  <span>Secure Handoff Channel</span>
                </span>
              </div>

              {/* Messages feed */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[380px] md:max-h-none">
                {loadingMessages && messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-ct-text-muted">
                    <Loader2 className="w-6 h-6 animate-spin text-ct-cyan" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-ct-text-muted gap-2 py-12">
                    <MessageSquare className="w-8 h-8 opacity-30 text-ct-cyan animate-pulse" />
                    <p className="text-xs font-bold">Secure connection established.</p>
                    <p className="text-[10px] text-ct-text-muted max-w-xs">Send a message below to coordinate meeting location and time on campus.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSelf = msg.senderId?._id === user.id || msg.senderId === user.id;

                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col max-w-[75%] ${isSelf ? "self-end ml-auto items-end" : "self-start items-start"}`}
                      >
                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed font-medium ${
                            isSelf
                              ? "bg-gradient-to-br from-ct-indigo to-ct-blue text-white rounded-tr-none shadow-[0_4px_12px_rgba(99,102,241,0.15)]"
                              : "bg-white/[0.03] border border-white/[0.06] text-ct-text-primary rounded-tl-none"
                          }`}
                        >
                          <p>{msg.text}</p>
                        </div>
                        <span className="text-[8px] text-ct-text-muted mt-1 px-1.5 uppercase font-semibold">
                          {isSelf ? "You" : msg.senderId?.name || "Partner"} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] text-center rounded-xl">
                    {error}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat input box */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/[0.06] bg-black/15 flex gap-3">
                <input
                  type="text"
                  placeholder="Type a secure handoff message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-white/[0.03] border border-white/[0.06] focus:border-ct-blue/35 rounded-xl px-4 py-3 text-xs text-ct-text-primary placeholder:text-ct-text-muted focus:outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={sending || !inputText.trim()}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-ct-indigo to-ct-blue text-white text-xs font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-ct-text-muted gap-2 py-20">
              <MessageSquare className="w-12 h-12 opacity-25 text-ct-cyan animate-pulse" />
              <h3 className="text-sm font-bold text-ct-text-primary">No conversation selected</h3>
              <p className="text-[11px] text-ct-text-secondary max-w-xs leading-normal">
                Choose a chatting partner on the left side panel to initiate secure handoff coordination.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function ChatPage() {
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
          <ChatContent />
        </Suspense>
      </div>
    </div>
  );
}
