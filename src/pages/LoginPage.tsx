import React, { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useAppContext } from "../context/AppContext";

export function LoginPage() {
  const { login, tenants } = useAppContext();
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  
  const normalizedSlug = tenantSlug?.replace(/^\/+/, '').replace(/\/+$/, '').toLowerCase().trim();
  const tenant = normalizedSlug ? tenants.find(t => t.slug.replace(/^\/+/, '').replace(/\/+$/, '').toLowerCase().trim() === normalizedSlug) : null;
  
  const [role, setRole] = useState<'SUPER_ADMIN' | 'OWNER'>(tenantSlug ? 'OWNER' : 'SUPER_ADMIN');
  const [email, setEmail] = useState(tenant ? tenant.adminEmail : "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (role === 'SUPER_ADMIN') {
      if (email !== 'admin@example.com' || password !== 'admin') {
        setError("Invalid super admin credentials. Use admin@example.com / admin");
        return;
      }
      login("admin@example.com", 'SUPER_ADMIN');
      navigate('/super-admin');
      return;
    }

    // OWNER flow
    setIsLoading(true);
    fetch('/api/tenants/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'bypass-tunnel-reminder': 'true'
      },
      body: JSON.stringify({ email, password })
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Đăng nhập thất bại');
      
      login(data.adminEmail, 'OWNER', data.id, data.token);
      navigate(`/${data.slug}/admin/dashboard`);
    })
    .catch(err => {
      setError(err.message);
    })
    .finally(() => {
      setIsLoading(false);
    });
  };

  const brandColor = tenant ? tenant.themeColor : '#4f46e5'; // indigo-600

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans relative overflow-hidden" style={{ backgroundColor: '#0F0F12' }}>
      {/* Decorative gradient */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[100px] -z-10 opacity-20"
        style={{ backgroundColor: brandColor }}
      ></div>
      
      <div className="w-full max-w-sm bg-[#151518] rounded-2xl border border-[#1F1F23] shadow-2xl p-8 relative z-10">
        <div className="text-center mb-8">
          {error && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/50 text-rose-400 text-xs px-3 py-2 rounded">
              {error}
            </div>
          )}
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-xl mx-auto mb-4 shadow-lg"
            style={{ backgroundColor: brandColor, boxShadow: `0 10px 15px -3px ${brandColor}33` }}
          >
            {tenant ? tenant.name.charAt(0).toUpperCase() : 'N'}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {tenant ? `Welcome to ${tenant.name}` : 'Welcome Back'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {!tenantSlug && (
            <div className="flex gap-2 p-1 bg-[#0A0A0C] border border-[#1F1F23] rounded-lg">
              <button
                type="button"
                onClick={() => setRole('OWNER')}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-colors ${role === 'OWNER' ? 'bg-[#1A1A1E] text-white shadow-sm border border-[#1F1F23]' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Salon Owner
              </button>
              <button
                type="button"
                onClick={() => setRole('SUPER_ADMIN')}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-colors ${role === 'SUPER_ADMIN' ? 'bg-[#1A1A1E] text-white shadow-sm border border-[#1F1F23]' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Super Admin
              </button>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#0A0A0C] border border-[#1F1F23] rounded-lg px-4 py-3 text-sm text-white outline-none transition-colors"
              style={{ padding: '0.75rem 1rem' }}
              onFocus={(e) => e.target.style.borderColor = brandColor}
              onBlur={(e) => e.target.style.borderColor = '#1F1F23'}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Password</label>
              <a href="#" className="text-[10px] font-bold hover:underline" style={{ color: brandColor }}>Forgot?</a>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#0A0A0C] border border-[#1F1F23] rounded-lg px-4 py-3 text-sm text-white outline-none transition-colors"
              onFocus={(e) => e.target.style.borderColor = brandColor}
              onBlur={(e) => e.target.style.borderColor = '#1F1F23'}
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 text-white rounded-lg text-sm font-bold uppercase tracking-wider transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: brandColor, boxShadow: `0 10px 15px -3px ${brandColor}40` }}
            onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
            onMouseOut={(e) => e.currentTarget.style.filter = 'brightness(1)'}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
