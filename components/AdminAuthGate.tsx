import React, { useState, useEffect, useRef } from 'react';

interface AdminAuthGateProps {
  children: React.ReactNode;
}

const GOOGLE_CLIENT_ID = '1031337559270-slf7h9pojusijm2q9rt8n2c9nsj1t6f8.apps.googleusercontent.com';
const ALLOWED_EMAILS = ['srastogi226@gmail.com', 'srastogi795@gmail.com'];
const ADMIN_PASSWORD = 'Shiv@1994';
const SESSION_KEY = 'kp_admin_session';
const SESSION_DURATION = 4 * 60 * 60 * 1000;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: object) => void;
          renderButton: (el: HTMLElement, cfg: object) => void;
        };
      };
    };
  }
}

const AdminAuthGate: React.FC<AdminAuthGateProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [googleReady, setGoogleReady] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authMethod, setAuthMethod] = useState<'google' | 'password'>('google');
  const inputRef = useRef<HTMLInputElement>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Check existing session
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const { expiry } = JSON.parse(raw);
        if (Date.now() < expiry) setIsAuthenticated(true);
        else localStorage.removeItem(SESSION_KEY);
      }
    } catch { }
    setLoading(false);
  }, []);

  // Load Google Identity Services
  useEffect(() => {
    if (isAuthenticated) return;
    const existing = document.getElementById('google-gsi-script');
    if (existing) { initGoogle(); return; }
    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => initGoogle();
    document.head.appendChild(script);
  }, [isAuthenticated]);

  const initGoogle = () => {
    if (!window.google) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
      auto_select: false,
    });
    setGoogleReady(true);
  };

  // Render Google button when ready
  useEffect(() => {
    if (googleReady && googleBtnRef.current && authMethod === 'google') {
      window.google?.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'filled_black',
        size: 'large',
        width: 320,
        text: 'signin_with',
        shape: 'rectangular',
      });
    }
  }, [googleReady, authMethod]);

  // Google callback — decode JWT to get email
  const handleGoogleResponse = (response: { credential: string }) => {
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      const email: string = payload.email || '';
      if (ALLOWED_EMAILS.includes(email)) {
        saveSession();
        setError('');
      } else {
        setError(`Access denied for ${email}. Only the authorised account can log in.`);
      }
    } catch {
      setError('Google sign-in failed. Try the password tab instead.');
    }
  };

  // Password login
  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = inputRef.current?.value || '';
    if (!entered.trim()) { setError('Please enter the password.'); return; }
    if (entered === ADMIN_PASSWORD) {
      saveSession();
    } else {
      setError('Incorrect password.');
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const saveSession = () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ expiry: Date.now() + SESSION_DURATION }));
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
  };

  if (loading) return null;

  // Authenticated view
  if (isAuthenticated) {
    return (
      <div>
        {children}
      </div>
    );
  }

  // Login screen
  return (
    <div className="min-h-screen pt-32 pb-24 px-6 flex items-center justify-center bg-[#FAF9F6]">
      <div className="w-full max-w-sm">

        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[#2C2C2C] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <span className="text-[10px] uppercase tracking-[0.4em] text-[#8B735B] font-bold">Restricted Access</span>
          <h1 className="text-3xl serif mt-3 mb-2">Admin Console</h1>
          <p className="text-[#999] text-sm font-light">Sign in with Google or password.</p>
        </div>

        <div className="bg-white border border-[#E5E5E5] p-8 shadow-sm space-y-6">

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-xs p-3 leading-relaxed rounded-sm">
              {error}
            </div>
          )}

          {/* Tab switcher */}
          <div className="flex border border-[#E5E5E5]">
            <button
              onClick={() => { setAuthMethod('google'); setError(''); }}
              className={`flex-1 py-2.5 text-[10px] uppercase tracking-widest font-bold transition-all ${authMethod === 'google' ? 'bg-[#2C2C2C] text-white' : 'text-[#999] hover:text-[#2C2C2C]'}`}
            >
              Google
            </button>
            <button
              onClick={() => { setAuthMethod('password'); setError(''); }}
              className={`flex-1 py-2.5 text-[10px] uppercase tracking-widest font-bold transition-all ${authMethod === 'password' ? 'bg-[#2C2C2C] text-white' : 'text-[#999] hover:text-[#2C2C2C]'}`}
            >
              Password
            </button>
          </div>

          {/* Google tab */}
          {authMethod === 'google' && (
            <div className="flex flex-col items-center gap-4">
              <p className="text-xs text-[#999] text-center">
                Only the authorised Google account can access this panel.
              </p>
              {googleReady ? (
                <div ref={googleBtnRef} className="w-full flex justify-center" />
              ) : (
                <div className="w-full h-10 bg-[#F5F5F5] animate-pulse rounded-sm" />
              )}
            </div>
          )}

          {/* Password tab */}
          {authMethod === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#999] block mb-2">Password</label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter admin password"
                    autoFocus
                    className="w-full border border-[#E5E5E5] p-3.5 text-sm focus:outline-none focus:border-[#2C2C2C] transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-3.5 text-[#999] hover:text-[#2C2C2C] text-sm"
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-[#2C2C2C] text-white py-4 text-xs uppercase tracking-[0.3em] font-bold hover:bg-[#8B735B] transition-all"
              >
                Authenticate
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[10px] text-[#CCC] mt-6 uppercase tracking-widest">
          Kala Prayag · Admin Portal · Session expires in 4 hours
        </p>
      </div>
    </div>
  );
};

export default AdminAuthGate;
