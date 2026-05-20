import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { 
  MessageSquare, Send, Settings, User, RefreshCw, 
  Facebook, Info, CheckCircle, XCircle, Search, 
  Phone, Star, History, Calendar, ExternalLink,
  ChevronRight, Shield
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { motion, AnimatePresence } from "motion/react";
import axios from "axios";
axios.defaults.headers.common['bypass-tunnel-reminder'] = 'true';

interface Message {
  id: string;
  psid: string;
  senderId: string;
  recipientId: string;
  content: string;
  direction: 'INBOUND' | 'OUTBOUND';
  timestamp: string;
}

interface Conversation {
  psid: string;
  content: string;
  timestamp: string;
  direction: string;
  customer?: {
    fullName: string;
    phone: string;
    tier: string;
    avatarUrl?: string | null;
  } | null;
  facebookProfile?: {
    fullName: string;
    avatarUrl?: string | null;
  } | null;
}

interface CustomerInfo {
  id?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string | null;
  tier?: string;
  points?: number;
  visits?: number;
  lastVisit?: string;
  bookings?: any[];
  isUnlinked?: boolean;
  facebookProfile?: {
    fullName: string;
    avatarUrl?: string | null;
  } | null;
}

const isImageUrl = (content: string) => {
  if (!content || !content.startsWith('http')) return false;
  
  // 1. Check known Facebook/Instagram CDN domains
  if (
    content.includes('fbsbx.com') || 
    content.includes('instagram.com') || 
    content.includes('fbcdn.net') ||
    content.includes('images.unsplash.com')
  ) {
    return true;
  }
  
  // 2. Fallback to extracting the pathname before query parameters
  try {
    const url = new URL(content);
    const pathname = url.pathname.toLowerCase();
    return (
      pathname.endsWith('.jpg') || 
      pathname.endsWith('.jpeg') || 
      pathname.endsWith('.png') || 
      pathname.endsWith('.gif') || 
      pathname.endsWith('.webp')
    );
  } catch (e) {
    return false;
  }
};

export default function OwnerMessagesPage() {
  const { tenantSlug } = useParams();
  const navigate = useNavigate();
  const { tenants } = useAppContext();
  const tenant = tenants.find(t => t.slug === tenantSlug);

  const [activeTab, setActiveTab] = useState<'chat' | 'settings'>('chat');
  const [socialPlatform, setSocialPlatform] = useState<'facebook' | 'instagram'>('facebook');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [igConversations, setIgConversations] = useState<Conversation[]>([]);
  const [selectedPsid, setSelectedPsid] = useState<string | null>(null);
  const [history, setHistory] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [igAccountId, setIgAccountId] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [showLinkSearch, setShowLinkSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Settings state
  const [pageId, setPageId] = useState("");
  const [pageAccessToken, setPageAccessToken] = useState("");
  const [verifyToken, setVerifyToken] = useState("salon_booking_verify_token");
  const [isActive, setIsActive] = useState(true);
  const [configLoading, setConfigLoading] = useState(false);

  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tenant) {
      fetchConversations();
      fetchIgConversations();
      fetchConfig();
    }
  }, [tenant]);

  // Reload conversations when switching platform tab
  useEffect(() => {
    setSelectedPsid(null);
  }, [socialPlatform]);

  useEffect(() => {
    if (selectedPsid) {
      fetchHistory(selectedPsid);
      fetchCustomerInfo(selectedPsid);
    } else {
      setCustomerInfo(null);
    }
  }, [selectedPsid]);

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  // Polling effect for real-time messages
  useEffect(() => {
    if (!tenant || activeTab !== 'chat') return;
    const interval = setInterval(() => {
      fetchConversationsSilently();
      fetchIgConversationsSilently();
      if (selectedPsid) fetchHistorySilently(selectedPsid);
    }, 3000);
    return () => clearInterval(interval);
  }, [tenant, activeTab, selectedPsid]);

  const scrollToBottom = () => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    if (!tenant) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/facebook/conversations/${tenant.id}?platform=facebook`);
      setConversations(res.data);
    } catch (err) {
      console.error("Error fetching conversations", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationsSilently = async () => {
    if (!tenant) return;
    try {
      const res = await axios.get(`/api/facebook/conversations/${tenant.id}?platform=facebook`);
      setConversations(prev => JSON.stringify(prev) !== JSON.stringify(res.data) ? res.data : prev);
    } catch (err) {}
  };

  const fetchIgConversations = async () => {
    if (!tenant) return;
    try {
      const res = await axios.get(`/api/facebook/conversations/${tenant.id}?platform=instagram`);
      setIgConversations(res.data);
    } catch (err) {}
  };

  const fetchIgConversationsSilently = async () => {
    if (!tenant) return;
    try {
      const res = await axios.get(`/api/facebook/conversations/${tenant.id}?platform=instagram`);
      setIgConversations(prev => JSON.stringify(prev) !== JSON.stringify(res.data) ? res.data : prev);
    } catch (err) {}
  };

  const fetchHistory = async (psid: string) => {
    if (!tenant) return;
    setHistoryLoading(true);
    try {
      const res = await axios.get(`/api/facebook/history/${tenant.id}/${psid}`);
      setHistory(res.data);
    } catch (err) {
      console.error("Error fetching history", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchHistorySilently = async (psid: string) => {
    if (!tenant) return;
    try {
      const res = await axios.get(`/api/facebook/history/${tenant.id}/${psid}`);
      // Only set state if the history payload changed to avoid redundant re-renders
      setHistory(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(res.data)) {
          return res.data;
        }
        return prev;
      });
    } catch (err) {
      console.error("Error fetching history silently", err);
    }
  };

  const fetchCustomerInfo = async (psid: string) => {
    if (!tenant) return;
    setCustomerLoading(true);
    try {
      const res = await axios.get(`/api/facebook/customer/${tenant.id}/${psid}`);
      setCustomerInfo(res.data);
    } catch (err) {
      console.error("Error fetching customer info", err);
    } finally {
      setCustomerLoading(false);
    }
  };

  const fetchConfig = async () => {
    if (!tenant) return;
    try {
      const res = await axios.get(`/api/facebook/config/${tenant.id}`);
      if (res.data) {
        setPageId(res.data.pageId || "");
        setPageAccessToken(res.data.pageAccessToken || "");
        setVerifyToken(res.data.verifyToken || "salon_booking_verify_token");
        setIgAccountId(res.data.igAccountId || "");
        setIsActive(res.data.isActive ?? true);
      }
    } catch (err) {}
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPsid || !tenant) return;

    const messageContent = newMessage.trim();
    // Instantly clear the input field so the user knows it's sending
    setNewMessage("");

    // Create an optimistic message object
    const optimisticMessage = {
      id: `optimistic-${Date.now()}`,
      direction: 'OUTBOUND',
      content: messageContent,
      timestamp: new Date().toISOString(),
      isSending: true
    };

    // Optimistically update the UI chat history list
    setHistory(prev => [...prev, optimisticMessage]);

    try {
      const res = await axios.post('/api/facebook/send', {
        tenantId: tenant.id,
        psid: selectedPsid,
        content: messageContent,
        platform: socialPlatform
      });
      setHistory(prev => prev.map(msg => msg.id === optimisticMessage.id ? res.data : msg));
    } catch (err) {
      console.error("Error sending message", err);
      // Remove the optimistic message on failure and notify the user
      setHistory(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      alert("Failed to send message. Please try again.");
      // Put the text back so they don't lose their message
      setNewMessage(messageContent);
    }
  };

  const handleSearchCustomer = async () => {
    if (!searchQuery.trim() || !tenant) return;
    try {
      const res = await axios.get(`/api/customers?tenantId=${tenant.id}`);
      const filtered = res.data.filter((c: any) => 
        c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.phone.includes(searchQuery)
      );
      setSearchResults(filtered);
    } catch (err) {
      console.error("Search error", err);
    }
  };

  const handleLinkCustomer = async (customerId: string) => {
    if (!selectedPsid || !tenant) return;
    try {
      await axios.post('/api/facebook/link-customer', {
        tenantId: tenant.id,
        psid: selectedPsid,
        customerId
      });
      setShowLinkSearch(false);
      fetchCustomerInfo(selectedPsid);
      fetchConversations();
    } catch (err) {
      console.error("Linking error", err);
    }
  };

  const handleCreateCustomer = async () => {
    if (!selectedPsid || !tenant || !customerInfo || !customerInfo.facebookProfile) return;
    try {
      await axios.post('/api/facebook/customer/create', {
        tenantId: tenant.id,
        psid: selectedPsid,
        fullName: customerInfo.facebookProfile.fullName,
        avatarUrl: customerInfo.facebookProfile.avatarUrl
      });
      fetchCustomerInfo(selectedPsid);
      fetchConversations();
    } catch (err) {
      console.error("Creating customer error", err);
    }
  };

  const handleSaveConfig = async () => {
    if (!tenant) return;
    setConfigLoading(true);
    try {
      await axios.post(`/api/facebook/config/${tenant.id}`, {
        pageId, pageAccessToken, verifyToken, igAccountId, isActive
      });
      alert("Configuration saved!");
    } catch (err) {
      alert("Failed to save config.");
    } finally {
      setConfigLoading(false);
    }
  };

  const handleToggleBot = async (newVal: boolean) => {
    setIsActive(newVal);
    if (!tenant) return;
    try {
      await axios.post(`/api/facebook/config/${tenant.id}`, {
        pageId, pageAccessToken, verifyToken, igAccountId, isActive: newVal
      });
    } catch (err) {
      console.error("Failed to auto-save chatbot status", err);
      setIsActive(!newVal);
      alert("Failed to update chatbot status.");
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        {/* Platform Tabs (Facebook CRM | Instagram CRM) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setSocialPlatform('facebook'); setActiveTab('chat'); }}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
              socialPlatform === 'facebook' && activeTab === 'chat'
                ? 'bg-[#1877F2] text-white shadow-lg shadow-[#1877F2]/30'
                : 'bg-[#111114] text-slate-400 border border-[#1F1F23] hover:text-white'
            }`}
          >
            <Facebook size={16} />
            Facebook CRM
            {conversations.length > 0 && (
              <span className="bg-white/20 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {conversations.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setSocialPlatform('instagram'); setActiveTab('chat'); }}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
              socialPlatform === 'instagram' && activeTab === 'chat'
                ? 'text-white shadow-lg'
                : 'bg-[#111114] text-slate-400 border border-[#1F1F23] hover:text-white'
            }`}
            style={socialPlatform === 'instagram' && activeTab === 'chat' ? {
              background: 'linear-gradient(135deg, #833AB4, #FD1D1D, #F77737)',
              boxShadow: '0 4px 20px rgba(131,58,180,0.3)'
            } : {}}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
            Instagram CRM
            {igConversations.length > 0 && (
              <span className="bg-white/20 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {igConversations.length}
              </span>
            )}
          </button>
        </div>
        <div className="flex gap-1 bg-[#111114] p-1 rounded-xl border border-[#1F1F23]">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${activeTab === 'chat' ? 'bg-[#384FFF] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <MessageSquare size={16} />
            Inbox
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${activeTab === 'settings' ? 'bg-[#384FFF] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <Settings size={16} />
            Config
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-4">
        {activeTab === 'chat' ? (
          <>
            {/* Sidebar (20%): Conversations */}
            <div className="w-1/5 min-w-[280px] bg-[#111114] rounded-2xl border border-[#1F1F23] flex flex-col overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-[#1F1F23] flex justify-between items-center bg-[#0F0F12]/80 backdrop-blur-md">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {socialPlatform === 'facebook' ? 'Messenger' : 'Instagram DM'}
                </span>
                <button onClick={socialPlatform === 'facebook' ? fetchConversations : fetchIgConversations} className="p-1.5 rounded-lg hover:bg-[#1A1A1E] text-slate-400 hover:text-[#384FFF] transition-colors">
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {(socialPlatform === 'facebook' ? conversations : igConversations).length === 0 && !loading ? (
                  <div className="p-12 text-center text-slate-600">
                    <MessageSquare size={32} className="mx-auto mb-3 opacity-10" />
                    <p className="text-xs">{socialPlatform === 'facebook' ? 'No Messenger chats' : 'No Instagram DMs'}</p>
                  </div>
                ) : (
                  (socialPlatform === 'facebook' ? conversations : igConversations).map((conv) => (
                    <button
                      key={conv.psid}
                      onClick={() => setSelectedPsid(conv.psid)}
                      className={`w-full p-4 flex gap-3 text-left transition-all duration-200 border-b border-[#1F1F23]/30 ${selectedPsid === conv.psid ? 'bg-[#384FFF]/10 border-l-4 border-l-[#384FFF]' : 'hover:bg-[#1A1A1E]'}`}
                    >
                      <div className="relative flex-shrink-0">
                        {conv.customer?.avatarUrl || conv.facebookProfile?.avatarUrl ? (
                          <img 
                            src={conv.customer?.avatarUrl || conv.facebookProfile?.avatarUrl || ''} 
                            alt={conv.customer?.fullName || conv.facebookProfile?.fullName}
                            className="w-11 h-11 rounded-2xl object-cover shadow-inner"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className={`w-11 h-11 rounded-2xl ${selectedPsid === conv.psid ? (socialPlatform === 'facebook' ? 'bg-[#1877F2]' : 'bg-gradient-to-br from-[#833AB4] to-[#F77737]') : 'bg-slate-800'} flex items-center justify-center text-white font-bold text-lg shadow-inner`}>
                            {(conv.customer?.fullName || conv.facebookProfile?.fullName || 'G').charAt(0)}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-[#0F0F12] border-2 border-[#111114] flex items-center justify-center">
                          {socialPlatform === 'facebook' 
                            ? <Facebook size={10} className="text-[#1877F2]" />
                            : <svg width="10" height="10" viewBox="0 0 24 24" fill="url(#ig-grad)" style={{filter:'hue-rotate(0deg)'}}><defs><linearGradient id="ig-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#833AB4"/><stop offset="100%" stopColor="#F77737"/></linearGradient></defs><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                          }
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 py-0.5">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-bold text-white truncate">{conv.customer?.fullName || conv.facebookProfile?.fullName || `User ${conv.psid.slice(-4)}`}</span>
                          <span className="text-[10px] text-slate-500 font-medium">{new Date(conv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className={`text-xs truncate mt-1 ${selectedPsid === conv.psid ? 'text-slate-300' : 'text-slate-500'}`}>
                          {conv.direction === 'OUTBOUND' && <span className="text-[#384FFF] font-bold mr-1">You:</span>}
                          {isImageUrl(conv.content) ? (
                            <span className="italic text-slate-400">📷 [Hình ảnh]</span>
                          ) : (
                            conv.content
                          )}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Main (50%): Chat Window */}
            <div className="flex-1 flex flex-col bg-[#111114] rounded-2xl border border-[#1F1F23] overflow-hidden shadow-2xl relative">
              {selectedPsid ? (
                <>
                  <div className="p-4 border-b border-[#1F1F23] flex items-center justify-between bg-[#0F0F12]/80 backdrop-blur-md z-10">
                    <div className="flex items-center gap-3">
                      {customerInfo?.avatarUrl || customerInfo?.facebookProfile?.avatarUrl ? (
                        <img 
                          src={customerInfo.avatarUrl || customerInfo.facebookProfile?.avatarUrl || ''} 
                          alt={customerInfo.fullName || customerInfo.facebookProfile?.fullName}
                          className="w-9 h-9 rounded-xl object-cover shadow-inner"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-[#384FFF]/10 border border-[#384FFF]/30 flex items-center justify-center text-[#384FFF]">
                          <User size={18} />
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          {customerInfo?.fullName || customerInfo?.facebookProfile?.fullName || `Guest User (${selectedPsid.slice(-4)})`}
                          {customerInfo && !customerInfo.isUnlinked && <Shield size={12} className="text-[#384FFF]" />}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="text-[10px] text-slate-500 font-medium">Messenger Active</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 rounded-xl bg-[#1A1A1E] text-slate-400 hover:text-white transition-colors">
                        <Phone size={16} />
                      </button>
                      <button className="p-2 rounded-xl bg-[#1A1A1E] text-slate-400 hover:text-white transition-colors">
                        <Info size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.8]">
                    {historyLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <RefreshCw className="animate-spin text-[#384FFF]" size={32} />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-center my-4">
                          <span className="px-3 py-1 rounded-full bg-[#1F1F23] text-[10px] text-slate-500 font-bold uppercase tracking-widest">Beginning of conversation</span>
                        </div>
                         {history.map((msg, idx) => {
                          const isFirstInGroup = idx === 0 || history[idx-1].direction !== msg.direction;
                          const isSending = (msg as any).isSending;
                          return (
                            <div key={msg.id} className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-4' : 'mt-1'}`}>
                              <div className={`max-w-[70%] group relative ${isSending ? 'opacity-50 animate-pulse' : ''}`}>
                                <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-lg ${
                                  msg.direction === 'OUTBOUND' 
                                    ? 'bg-[#384FFF] text-white rounded-tr-none' 
                                    : 'bg-[#1F1F23] text-slate-100 rounded-tl-none border border-[#2F2F35]'
                                }`}>
                                  {isImageUrl(msg.content) ? (
                                    <button 
                                      type="button"
                                      onClick={() => setPreviewImage(msg.content)} 
                                      className="block max-w-[240px] overflow-hidden rounded-xl border border-[#2F2F35] shadow-md hover:scale-105 transition-transform cursor-pointer"
                                    >
                                      <img 
                                        src={msg.content} 
                                        alt="Sent image" 
                                        className="w-full h-auto object-cover max-h-[200px]" 
                                        referrerPolicy="no-referrer"
                                      />
                                    </button>
                                  ) : (
                                    msg.content
                                  )}
                                </div>
                                <div className={`text-[9px] mt-1.5 font-medium opacity-0 group-hover:opacity-100 transition-opacity absolute ${msg.direction === 'OUTBOUND' ? 'right-0 text-[#384FFF]' : 'left-0 text-slate-500'}`}>
                                  {isSending ? 'Sending...' : new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div ref={historyEndRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="p-4 bg-[#0F0F12] border-t border-[#1F1F23] flex gap-3 z-10">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Write your message..."
                      className="flex-1 bg-[#1A1A1E] border border-[#2F2F35] rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-[#384FFF] focus:ring-1 focus:ring-[#384FFF]/50 transition-all placeholder:text-slate-600"
                    />
                    <button 
                      type="submit" 
                      disabled={!newMessage.trim()}
                      className="bg-[#384FFF] text-white w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-[#2A3CBF] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#384FFF]/30 disabled:opacity-30 disabled:hover:scale-100"
                    >
                      <Send size={20} />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-24 h-24 rounded-3xl bg-[#384FFF]/5 flex items-center justify-center mb-8 border border-[#384FFF]/10 relative">
                    <MessageSquare size={44} className="text-[#384FFF] opacity-40" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#384FFF] flex items-center justify-center animate-bounce">
                      <Star size={16} className="text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Select a Conversation</h3>
                  <p className="text-slate-500 max-w-sm leading-relaxed">Respond to customers from Facebook Messenger instantly and view their full history.</p>
                </div>
              )}
            </div>

            {/* Right Sidebar (30%): Customer Info */}
            <div className="w-[30%] min-w-[320px] bg-[#111114] rounded-2xl border border-[#1F1F23] flex flex-col overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-[#1F1F23] bg-[#0F0F12]/80 backdrop-blur-md">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Customer Intelligence</span>
              </div>
              
              {selectedPsid ? (
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-6">
                  {customerLoading ? (
                    <div className="p-12 text-center">
                      <RefreshCw className="animate-spin text-[#384FFF] mx-auto mb-4" />
                      <p className="text-xs text-slate-500">Syncing CRM data...</p>
                    </div>
                  ) : customerInfo ? (
                    <>
                      {/* Profile Card */}
                      <div className="bg-gradient-to-br from-[#1A1A1E] to-[#0F0F12] rounded-3xl p-6 border border-[#2F2F35] shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Shield size={80} />
                        </div>
                        <div className="relative z-10">
                          <div className="flex items-center gap-4 mb-5">
                            {customerInfo.avatarUrl || customerInfo.facebookProfile?.avatarUrl ? (
                              <img 
                                src={customerInfo.avatarUrl || customerInfo.facebookProfile?.avatarUrl || ''} 
                                alt={customerInfo.fullName || customerInfo.facebookProfile?.fullName}
                                className="w-16 h-16 rounded-2xl object-cover shadow-lg border border-[#2F2F35]"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-2xl bg-[#384FFF] flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-[#384FFF]/20">
                                {(customerInfo.fullName || customerInfo.facebookProfile?.fullName || 'G').charAt(0)}
                              </div>
                            )}
                            <div>
                              <h3 className="text-lg font-bold text-white">{customerInfo.fullName || customerInfo.facebookProfile?.fullName || 'Guest User'}</h3>
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-tighter ${
                                customerInfo.isUnlinked ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                customerInfo.tier === 'VIP' ? 'bg-amber-500/10 text-amber-500' : 'bg-[#384FFF]/10 text-[#384FFF]'
                              }`}>
                                {customerInfo.isUnlinked ? 'Unlinked Lead' : `${customerInfo.tier} Member`}
                              </span>
                            </div>
                          </div>
                          
                          {!customerInfo.isUnlinked && (
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-[#111114]/50 p-3 rounded-2xl border border-[#1F1F23]">
                                <span className="text-[10px] text-slate-500 block mb-1">Total Visits</span>
                                <span className="text-sm font-bold text-white">{customerInfo.visits}</span>
                              </div>
                              <div className="bg-[#111114]/50 p-3 rounded-2xl border border-[#1F1F23]">
                                <span className="text-[10px] text-slate-500 block mb-1">Loyalty Points</span>
                                <span className="text-sm font-bold text-[#384FFF]">{customerInfo.points} pts</span>
                              </div>
                            </div>
                          )}

                          <div className="mt-4 pt-4 border-t border-[#1F1F23] space-y-2">
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <Phone size={12} className="text-[#384FFF]" />
                              {customerInfo.isUnlinked ? 'Unlinked (No phone number)' : customerInfo.phone}
                            </div>
                            {!customerInfo.isUnlinked && (
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Calendar size={12} className="text-[#384FFF]" />
                                Last Visit: {customerInfo.lastVisit ? new Date(customerInfo.lastVisit).toLocaleDateString() : 'Never'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {customerInfo.isUnlinked ? (
                        <div className="p-6 bg-[#384FFF]/5 rounded-3xl border border-[#384FFF]/10 text-center space-y-4">
                          <div className="w-12 h-12 rounded-xl bg-[#384FFF]/10 flex items-center justify-center mx-auto">
                            <Search size={20} className="text-[#384FFF]" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white mb-1">Not in CRM Directory</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed">This Facebook lead just messaged you and is not yet saved as a customer profile. Link them to track visits.</p>
                          </div>
                          
                          {showLinkSearch ? (
                            <div className="space-y-3">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  placeholder="Name or Phone..."
                                  className="w-full bg-[#0F0F12] border border-[#2F2F35] rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#384FFF] text-white"
                                />
                                <button onClick={handleSearchCustomer} className="absolute right-2 top-1.5 p-1 text-slate-500 hover:text-[#384FFF]">
                                  <Search size={14} />
                                </button>
                              </div>
                              <div className="max-h-40 overflow-y-auto space-y-1">
                                {searchResults.map(c => (
                                  <button
                                    key={c.id}
                                    onClick={() => handleLinkCustomer(c.id)}
                                    className="w-full p-2 text-left bg-[#1A1A1E] rounded-lg text-[10px] text-white hover:bg-[#384FFF]/20 flex justify-between"
                                  >
                                    <span>{c.fullName}</span>
                                    <span className="text-slate-500">{c.phone}</span>
                                  </button>
                                ))}
                              </div>
                              <button onClick={() => setShowLinkSearch(false)} className="text-[10px] text-slate-500 underline">Cancel</button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <button 
                                onClick={handleCreateCustomer}
                                className="w-full py-2.5 rounded-2xl bg-[#384FFF] text-white text-xs font-black shadow-lg shadow-[#384FFF]/20 hover:scale-105 active:scale-95 transition-all"
                              >
                                Create CRM Profile
                              </button>
                              <button 
                                onClick={() => setShowLinkSearch(true)}
                                className="w-full py-2.5 rounded-2xl bg-[#1A1A1E] text-slate-300 text-xs font-bold border border-[#2F2F35] hover:bg-[#252529] hover:scale-105 active:scale-95 transition-all"
                              >
                                Link to Existing Customer
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          {/* Service History */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <History size={14} className="text-[#384FFF]" />
                                Service History
                              </h4>
                              <span className="text-[10px] bg-[#1F1F23] px-2 py-0.5 rounded-full text-slate-500">Recent 10</span>
                            </div>
                            
                            <div className="space-y-2">
                              {customerInfo.bookings && customerInfo.bookings.length > 0 ? (
                                customerInfo.bookings.map((booking: any) => (
                                  <div key={booking.id} className="p-3 bg-[#1A1A1E] rounded-2xl border border-[#1F1F23] hover:border-[#384FFF]/30 transition-colors group">
                                    <div className="flex justify-between items-start mb-1">
                                      <span className="text-xs font-bold text-white group-hover:text-[#384FFF] transition-colors">{booking.service.name}</span>
                                      <span className={`text-[9px] px-1.5 py-0.5 rounded-lg ${
                                        booking.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'
                                      }`}>
                                        {booking.status}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-[10px] text-slate-500">{new Date(booking.dateTime).toLocaleDateString()}</span>
                                      <span className="text-[10px] font-bold text-slate-300">${booking.service.price}</span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-8 text-center bg-[#1A1A1E] rounded-3xl border border-[#1F1F23] border-dashed">
                                  <p className="text-xs text-slate-600 italic">No bookings found</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <button 
                            onClick={() => navigate(`/${tenant?.slug}/admin/customers?search=${customerInfo.fullName}`)}
                            className="w-full py-3 rounded-2xl bg-[#1A1A1E] text-white text-xs font-bold flex items-center justify-center gap-2 border border-[#2F2F35] hover:bg-[#252529] transition-all"
                          >
                            View Full CRM Profile
                            <ExternalLink size={12} />
                          </button>
                        </>
                      )}

                      <div className="flex gap-2.5">
                        <a 
                          href="https://business.facebook.com/latest/inbox/messenger"
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-3 rounded-2xl bg-[#111114] text-slate-400 text-xs font-bold flex items-center justify-center gap-2 border border-[#1F1F23] hover:text-white hover:bg-[#1A1A1E] transition-all"
                        >
                          Open Page Inbox
                          <ExternalLink size={12} />
                        </a>
                        <a 
                          href={`https://www.facebook.com/search/people/?q=${encodeURIComponent(customerInfo.fullName || customerInfo.facebookProfile?.fullName || '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-3 rounded-2xl bg-[#384FFF]/10 text-[#384FFF] text-xs font-bold flex items-center justify-center gap-2 border border-[#384FFF]/20 hover:bg-[#384FFF]/20 transition-all"
                        >
                          Find Profile
                          <Facebook size={12} />
                        </a>
                      </div>
                    </>
                  ) : null}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 opacity-20">
                  <User size={64} className="text-slate-400 mb-4" />
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">No selection</p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Settings Content (Existing but updated with #384FFF) */
          <div className="flex-1 bg-[#111114] rounded-2xl border border-[#1F1F23] p-12 overflow-y-auto shadow-2xl">
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="flex items-center gap-5 p-6 bg-[#384FFF]/5 border border-[#384FFF]/10 rounded-3xl">
                <div className="w-14 h-14 rounded-2xl bg-[#384FFF] flex items-center justify-center text-white shadow-lg shadow-[#384FFF]/20">
                  <Facebook size={28} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Facebook Integration</h4>
                  <p className="text-sm text-slate-500">Configure your Facebook Graph API credentials to enable cross-platform messaging.</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* AI Chatbot Toggle Switch */}
                <div className="flex items-center justify-between p-6 bg-[#1A1A1E] border border-[#1F1F23] rounded-3xl transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-600/10 text-violet-400 flex items-center justify-center">
                      <Shield size={20} />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-white">AI Auto-Reply Assistant</h5>
                      <p className="text-xs text-slate-500">Automatically reply to incoming messages when owner is offline.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleBot(!isActive)}
                    type="button"
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 ${
                      isActive ? 'bg-[#384FFF]' : 'bg-[#2F2F35]'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${
                        isActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Page ID</label>
                  <input
                    type="text"
                    value={pageId}
                    onChange={(e) => setPageId(e.target.value)}
                    placeholder="Enter your Facebook Page ID"
                    className="w-full bg-[#0F0F12] border border-[#2F2F35] rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#384FFF] transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Page Access Token</label>
                  <textarea
                    value={pageAccessToken}
                    onChange={(e) => setPageAccessToken(e.target.value)}
                    placeholder="EAA..."
                    rows={4}
                    className="w-full bg-[#0F0F12] border border-[#2F2F35] rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#384FFF] resize-none font-mono transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Webhook Verify Token</label>
                  <input
                    type="text"
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value)}
                    className="w-full bg-[#0F0F12] border border-[#2F2F35] rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#384FFF] transition-all"
                  />
                </div>

                {/* Instagram Section */}
                <div className="mt-8 pt-8 border-t border-[#1F1F23]">
                  <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-[#833AB4]/10 to-[#F77737]/10 border border-[#833AB4]/20 rounded-2xl mb-6">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{background:'linear-gradient(135deg,#833AB4,#FD1D1D,#F77737)'}}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">Instagram Integration</h4>
                      <p className="text-xs text-slate-500">Dùng chung Page Access Token ở trên. Chỉ cần điền Instagram Account ID bên dưới.</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Instagram Business Account ID</label>
                    <input
                      type="text"
                      value={igAccountId}
                      onChange={(e) => setIgAccountId(e.target.value)}
                      placeholder="e.g. 17841400008460056"
                      className="w-full bg-[#0F0F12] border border-[#2F2F35] rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#833AB4] transition-all"
                    />
                    <p className="text-[10px] text-slate-600 px-1">Lấy ID này tại: Meta Business Suite → Settings → Accounts → Instagram Accounts</p>
                  </div>
                </div>

                <button
                  onClick={handleSaveConfig}
                  disabled={configLoading}
                  className="w-full bg-[#384FFF] text-white font-black py-4 rounded-2xl hover:bg-[#2A3CBF] transition-all shadow-xl shadow-[#384FFF]/20 disabled:opacity-30 mt-4 flex items-center justify-center gap-3"
                >
                  {configLoading ? <RefreshCw className="animate-spin" /> : <>Save Configuration <ChevronRight size={18} /></>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-slate-300 bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all duration-200"
            >
              <span className="text-xl font-bold">✕</span>
            </button>
            <img 
              src={previewImage} 
              alt="High resolution preview" 
              className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
