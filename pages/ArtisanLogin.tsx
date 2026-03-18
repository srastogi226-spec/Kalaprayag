import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

interface ArtisanLoginProps {
  onSuccess: (artisanData: any) => void;
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

// ─── SECURITY CHECK ──────────────────────────────────────────────────────────
// Verifies the logged-in Firebase user is an APPROVED artisan in Firestore.
// Returns artisan data if approved, throws descriptive error otherwise.
const verifyApprovedArtisan = async (uid: string): Promise<any> => {
  const artisanRef = doc(db, 'artisans', uid);
  const artisanSnap = await getDoc(artisanRef);

  if (!artisanSnap.exists()) {
    throw new Error(
      'NO_ACCOUNT: No artisan account found. Please apply first or contact support.'
    );
  }

  const data = artisanSnap.data();

  if (data.status === 'pending') {
    throw new Error(
      'PENDING: Your application is still under review. We will contact you within 3-5 business days.'
    );
  }
  if (data.status === 'rejected') {
    throw new Error(
      'REJECTED: Your application was not approved. Please contact us for more information.'
    );
  }
  if (data.status === 'suspended') {
    throw new Error(
      'SUSPENDED: Your account has been suspended. Please contact support at kalaprayag.com.'
    );
  }
  if (data.status !== 'approved') {
    throw new Error(
      'ACCESS_DENIED: Access denied. Please contact support.'
    );
  }

  return { uid, ...data };
};
// ─────────────────────────────────────────────────────────────────────────────

const ArtisanLogin: React.FC<ArtisanLoginProps> = ({ onSuccess, onJoin }) => {
  const { loginWithGoogle } = useAuth();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const clearMessages = () => { setError(''); };

  // ── GOOGLE LOGIN ────────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      // Step 1: Firebase Google auth
      const result = await loginWithGoogle();
      const uid = result?.uid;

      if (!uid) throw new Error('NO_ACCOUNT: Could not retrieve user.');

      // Step 2: Verify approved artisan in Firestore
      const artisanData = await verifyApprovedArtisan(uid);

      // Step 3: Only approved artisans proceed
      onSuccess(artisanData);

    } catch (err: any) {
      // Always sign out on any failure
      await signOut(auth).catch(() => {});

      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in was cancelled.');
      } else if (err.message?.startsWith('PENDING:')) {
        setError(err.message.replace('PENDING: ', ''));
      } else if (err.message?.startsWith('REJECTED:')) {
        setError(err.message.replace('REJECTED: ', ''));
      } else if (err.message?.startsWith('SUSPENDED:')) {
        setError(err.message.replace('SUSPENDED: ', ''));
      } else if (err.message?.startsWith('NO_ACCOUNT:')) {
        setError(err.message.replace('NO_ACCOUNT: ', ''));
      } else {
        setError('Google sign-in failed. Please try again or use email/password.');
      }
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen pt-32 pb-24 px-6 flex items-center justify-center bg-[#FAF9F6]">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-[10px] uppercase tracking-[0.4em] text-[#8B735B] font-bold">
            Artisan Portal
          </span>
          <h1 className="text-4xl serif mt-3 mb-3">
            Welcome Back
          </h1>
          <p className="text-[#999] text-sm font-light">
            Sign in to access your artisan dashboard.
          </p>
        </div>

        {/* NOTE: Self-signup removed — accounts are created by admin only */}

        <div className="bg-white border border-[#E5E5E5] p-8 shadow-sm space-y-5">

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-xs p-3 leading-relaxed text-center mb-6">
              {error}
            </div>
          )}

          {/* Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 border border-[#E5E5E5] py-3.5 text-sm font-medium text-[#2C2C2C] hover:bg-[#FAF9F6] hover:border-[#D1D1D1] transition-all disabled:opacity-50"
          >
            {loading ? (
              <svg className="animate-spin w-5 h-5 text-[#8B735B]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : <GoogleIcon />}
            {loading ? 'Verifying...' : 'Continue with Google'}
          </button>
        </div>

        {/* Apply CTA */}
        <div className="mt-6 bg-white border border-[#E5E5E5] p-6 text-center">
          <p className="text-xs text-[#999] mb-1">New to Kala Prayag?</p>
          <p className="text-xs text-[#999] mb-2">
            Artisan accounts are created by our team after reviewing your application.
          </p>
          <button
            onClick={onJoin}
            className="text-xs font-bold uppercase tracking-widest text-[#8B735B] hover:underline"
          >
            Apply as an Artisan →
          </button>
        </div>

      </div>
    </div>
  );
};

export default ArtisanLogin;
