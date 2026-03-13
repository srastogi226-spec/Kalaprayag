// src/hooks/useArtisanGuard.ts
// Use this hook anywhere you need to verify
// the current user is an approved artisan.

import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebase';

export const verifyApprovedArtisan = async (
  uid: string
): Promise<any> => {
  const artisanRef = doc(db, 'artisans', uid);
  const artisanSnap = await getDoc(artisanRef);

  // Not in artisans collection at all
  if (!artisanSnap.exists()) {
    await signOut(auth);
    throw new Error(
      'No artisan account found. Please apply first or contact support.'
    );
  }

  const data = artisanSnap.data();

  // Check status
  switch (data.status) {
    case 'approved':
      return { uid, ...data }; // ✅ Only approved gets through

    case 'pending':
      await signOut(auth);
      throw new Error(
        'Your application is still under review. We will contact you within 3-5 business days.'
      );

    case 'rejected':
      await signOut(auth);
      throw new Error(
        'Your application was not approved. Please contact us for more information.'
      );

    case 'suspended':
      await signOut(auth);
      throw new Error(
        'Your account has been suspended. Please contact support.'
      );

    default:
      await signOut(auth);
      throw new Error('Access denied. Please contact support.');
  }
};

// Use in any component:
// import { verifyApprovedArtisan } from '../hooks/useArtisanGuard';
//
// const artisanData = await verifyApprovedArtisan(user.uid);
// setLoggedInArtisan(artisanData);
