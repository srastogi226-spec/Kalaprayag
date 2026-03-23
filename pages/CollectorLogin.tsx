import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface CollectorLoginProps {
  onSuccess: () => void;
  onNavigate?: (page: string) => void;
}

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const CollectorLogin: React.FC<CollectorLoginProps> = ({ onSuccess, onNavigate }) => {
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result) {
        onSuccess();
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled.');
      } else {
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 flex items-center justify-center bg-[#FAF9F6]">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-[10px] uppercase tracking-[0.4em] text-[#8B735B] font-bold">
            Collector Portal
          </span>
          <h1 className="text-4xl serif mt-3 mb-3">
            Welcome to the Collective
          </h1>
          <p className="text-[#999] text-sm font-light leading-relaxed">
            Sign in to track your orders, save pieces to your wishlist, and manage your heritage collection.
          </p>
        </div>

        <div className="bg-white border border-[#E5E5E5] p-10 shadow-sm space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-[11px] p-3 text-center rounded-sm italic font-medium">
              {error}
            </div>
          )}

          {/* Social login choice */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 border border-[#2C2C2C] py-4 text-[11px] uppercase tracking-widest font-bold text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white transition-all duration-500 disabled:opacity-50 group"
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4 text-current" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : <GoogleIcon />}
              {loading ? 'Verifying...' : 'Sign in with Google'}
            </button>
            
            <p className="text-center text-[9px] uppercase tracking-[0.2em] text-[#999] px-4 font-medium leading-relaxed">
              By continuing, you agree to join the Kala Prayag community and our terms of service.
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center px-4">
          <button 
            onClick={() => onNavigate?.('home')}
            className="text-[9px] uppercase tracking-[0.3em] font-bold text-[#999] hover:text-[#8B735B] transition-all border-b border-transparent hover:border-[#8B735B] pb-1"
          >
            ← Return to Main Site
          </button>
        </div>

      </div>
    </div>
  );
};

export default CollectorLogin;
