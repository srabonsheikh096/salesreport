import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '@/firebase-applet-config.json';

// Reuse app instance if already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Configure Google Auth Provider with requested Google Workspace scopes
export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => {
  provider.addScope(scope);
});
provider.setCustomParameters({
  prompt: 'select_account',
});

// Flag to indicate if we are in the middle of a sign-in flow
let isSigningIn = false;
// Cache the access token in memory (NEVER in localStorage/sessionStorage as required)
let cachedAccessToken: string | null = null;

export const getBengaliAuthErrorMessage = (error: any): string => {
  const code = error?.code || '';
  if (code === 'auth/popup-blocked') {
    return 'ব্রাউজার সাইন-ইন পপআপ ব্লক করেছে! অনুগ্রহ করে ব্রাউজারের অ্যাড্রেস বার থেকে Popups Allow (অনুমতি) করুন এবং আবার চেষ্টা করুন।';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'গুগল সাইন-ইন উইন্ডোটি বন্ধ করা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
  }
  if (code === 'auth/cancelled-popup-request') {
    return 'পূর্ববর্তী সাইন-ইন অনুরোধটি এখনও চলমান। অনুগ্রহ করে ২ সেকেন্ড পর আবার চেষ্টা করুন।';
  }
  if (code === 'auth/network-request-failed') {
    return 'ইন্টারনেট বা নেটওয়ার্ক সংযোগ পাওয়া যায়নি। আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন।';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'ডোমেইন অনুমোদন সংক্রান্ত সমস্যা। পেজটি রিফ্রেশ দিয়ে আবার চেষ্টা করুন।';
  }
  return error?.message || 'গুগল একাউন্টে সাইন-ইন সম্পন্ন করা যায়নি।';
};

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) {
        onAuthSuccess(user, cachedAccessToken);
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) {
        onAuthFailure();
      }
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || null;

    if (!accessToken) {
      throw new Error('গুগল একাউন্ট থেকে পারমিশন টোকেন পাওয়া যায়নি। অনুগ্রহ করে গুগল শিটের অনুমতি প্রদান করুন।');
    }

    cachedAccessToken = accessToken;
    return { user: result.user, accessToken };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
