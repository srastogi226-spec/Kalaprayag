import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ArtisanLoginProps {
  onSuccess: () => void;
  onJoin: () => void;
}

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const ArtisanLogin: React.FC<ArtisanLoginProps> = ({ onSuccess, onJoin }) => {
  const { login, signup, loginWithGoogle, resetPassword } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const clearMessages = () => { setError(''); setInfo(''); };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      onSuccess();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in was cancelled.');
      } else {
        console.error("Google Login Error:", err);
        setError(`Google sign-in failed: ${err.message || err.code || 'Unknown Error'}. Please try again.`);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    try {
      await login(email, password);
      onSuccess();
    } catch (err: any) {
      const code = err.code;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await signup(email, password);
      onSuccess();
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError('Account creation failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!email) { setError('Please enter your email address.'); return; }
    setLoading(true);
    try {
      await resetPassword(email);
      setInfo('Reset email sent! Check your inbox and spam folder.');
    } catch {
      setError('Failed to send reset email. Please check the address and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 flex items-center justify-center bg-[#FAF9F6]">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-[10px] uppercase tracking-[0.4em] text-[#8B735B] font-bold">Artisan Portal</span>
          <h1 className="text-4xl serif mt-3 mb-3">
            {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
          </h1>
          <p className="text-[#999] text-sm font-light">
            {mode === 'login' && 'Sign in to access your artisan dashboard.'}
            {mode === 'signup' && 'Create your artisan account to get started.'}
            {mode === 'forgot' && "Enter your email and we'll send a reset link."}
          </p>
        </div>

        <div className="bg-white border border-[#E5E5E5] p-8 shadow-sm space-y-5">

          {/* Error / Info banners */}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-xs p-3 leading-relaxed animate-in fade-in duration-200">
              {error}
            </div>
          )}
          {info && (
            <div className="bg-green-50 border border-green-100 text-green-700 text-xs p-3 leading-relaxed animate-in fade-in duration-200">
              {info}
            </div>
          )}

          {/* Google Sign-In */}
          {mode !== 'forgot' && (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-3 border border-[#E5E5E5] py-3.5 text-sm font-medium text-[#2C2C2C] hover:bg-[#FAF9F6] hover:border-[#D1D1D1] transition-all disabled:opacity-50"
              >
                {googleLoading ? (
                  <svg className="animate-spin w-5 h-5 text-[#8B735B]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : <GoogleIcon />}
                {googleLoading ? 'Signing in...' : 'Continue with Google'}
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#E5E5E5]" />
                <span className="text-[10px] uppercase tracking-widest text-[#CCC]">or</span>
                <div className="flex-1 h-px bg-[#E5E5E5]" />
              </div>
            </>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#999] block mb-2">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
                  className="w-full border border-[#E5E5E5] p-3.5 text-sm focus:outline-none focus:border-[#2C2C2C] transition-all" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#999] block mb-2">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full border border-[#E5E5E5] p-3.5 text-sm focus:outline-none focus:border-[#2C2C2C] transition-all" />
              </div>
              <div className="text-right">
                <button type="button" onClick={() => { setMode('forgot'); clearMessages(); }}
                  className="text-[10px] text-[#8B735B] uppercase tracking-widest hover:underline">
                  Forgot Password?
                </button>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#2C2C2C] text-white py-4 text-xs uppercase tracking-[0.3em] font-bold hover:bg-[#8B735B] transition-all disabled:opacity-50">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Signup Form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#999] block mb-2">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
                  className="w-full border border-[#E5E5E5] p-3.5 text-sm focus:outline-none focus:border-[#2C2C2C] transition-all" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#999] block mb-2">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters"
                  className="w-full border border-[#E5E5E5] p-3.5 text-sm focus:outline-none focus:border-[#2C2C2C] transition-all" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#999] block mb-2">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password"
                  className="w-full border border-[#E5E5E5] p-3.5 text-sm focus:outline-none focus:border-[#2C2C2C] transition-all" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#2C2C2C] text-white py-4 text-xs uppercase tracking-[0.3em] font-bold hover:bg-[#8B735B] transition-all disabled:opacity-50">
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* Forgot Password Form */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#999] block mb-2">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
                  className="w-full border border-[#E5E5E5] p-3.5 text-sm focus:outline-none focus:border-[#2C2C2C] transition-all" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#2C2C2C] text-white py-4 text-xs uppercase tracking-[0.3em] font-bold hover:bg-[#8B735B] transition-all disabled:opacity-50">
                {loading ? 'Sending...' : 'Send Reset Email'}
              </button>
              <button type="button" onClick={() => { setMode('login'); clearMessages(); }}
                className="w-full py-3 text-xs uppercase tracking-widest text-[#999] hover:text-[#2C2C2C] transition-all">
                ← Back to Sign In
              </button>
            </form>
          )}

        </div>

        {/* Apply CTA */}
        <div className="mt-6 bg-white border border-[#E5E5E5] p-6 text-center">
          <p className="text-xs text-[#999] mb-2">New to Kala Prayag? Want to sell your crafts?</p>
          <button onClick={onJoin}
            className="text-xs font-bold uppercase tracking-widest text-[#8B735B] hover:underline">
            Apply as an Artisan →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArtisanLogin;
