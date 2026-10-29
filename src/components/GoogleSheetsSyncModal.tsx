import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Plus,
  Link as LinkIcon,
  Database
} from 'lucide-react';
import { User } from 'firebase/auth';
import { GoogleSheetMeta, Product, SaleRecord, MonthlySummary } from '../types';
import { googleSignIn, logout, getBengaliAuthErrorMessage } from '../services/auth';
import { createGoogleSheet, syncAllDataToGoogleSheet, listUserGoogleSheets } from '../services/sheets';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  token: string | null;
  onAuthSuccess: (user: User, token: string) => void;
  onLogout: () => void;
  sheetMeta: GoogleSheetMeta | null;
  onUpdateSheetMeta: (meta: GoogleSheetMeta | null) => void;
  products: Product[];
  sales: SaleRecord[];
  monthlySummaries: MonthlySummary[];
  currency: string;
}

export const GoogleSheetsSyncModal: React.FC<Props> = ({
  isOpen,
  onClose,
  user,
  token,
  onAuthSuccess,
  onLogout,
  sheetMeta,
  onUpdateSheetMeta,
  products,
  sales,
  monthlySummaries,
  currency,
}) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Existing sheets picker
  const [availableSheets, setAvailableSheets] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  const [customSheetId, setCustomSheetId] = useState('');

  useEffect(() => {
    if (isOpen && token) {
      loadDriveSheets();
    }
  }, [isOpen, token]);

  const loadDriveSheets = async () => {
    setIsLoadingSheets(true);
    try {
      const sheets = await listUserGoogleSheets();
      setAvailableSheets(sheets);
    } catch {
      // Ignored
    } finally {
      setIsLoadingSheets(false);
    }
  };

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        onAuthSuccess(result.user, result.accessToken);
        setSyncStatus('সফলভাবে গুগল একাউন্টে যুক্ত হয়েছে!');
      }
    } catch (err: any) {
      setErrorMessage(getBengaliAuthErrorMessage(err));
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleCreateNewSheet = async () => {
    setIsCreatingSheet(true);
    setErrorMessage(null);
    setSyncStatus(null);
    try {
      const { spreadsheetId, spreadsheetUrl } = await createGoogleSheet(
        'Product Stock & Profit Ledger (প্রোডাক্ট স্টক ও লাভ খাতা)'
      );

      // Now sync the current data into the newly created sheet
      await syncAllDataToGoogleSheet(
        spreadsheetId,
        products,
        sales,
        monthlySummaries,
        currency
      );

      const newMeta: GoogleSheetMeta = {
        spreadsheetId,
        spreadsheetUrl,
        title: 'Product Stock & Profit Ledger (প্রোডাক্ট স্টক ও লাভ খাতা)',
        lastSyncedAt: new Date().toISOString(),
      };

      onUpdateSheetMeta(newMeta);
      setSyncStatus('গুগল শিট সফলভাবে তৈরি এবং ডেটা সিন্ক করা হয়েছে!');
    } catch (err: any) {
      setErrorMessage(err.message || 'শিট তৈরি করতে সমস্যা হয়েছে');
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleSyncExisting = async () => {
    if (!sheetMeta) return;
    setIsSyncing(true);
    setErrorMessage(null);
    setSyncStatus(null);
    try {
      await syncAllDataToGoogleSheet(
        sheetMeta.spreadsheetId,
        products,
        sales,
        monthlySummaries,
        currency
      );

      const updatedMeta: GoogleSheetMeta = {
        ...sheetMeta,
        lastSyncedAt: new Date().toISOString(),
      };
      onUpdateSheetMeta(updatedMeta);
      setSyncStatus('গুগল শিটের সমস্ত ডেটা সফলভাবে আপডেট ও সিন্ক করা হয়েছে!');
    } catch (err: any) {
      setErrorMessage(err.message || 'শিট সিন্ক করতে সমস্যা হয়েছে');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLinkSheet = async (id: string, name?: string) => {
    if (!id.trim()) return;
    const cleanId = id.includes('/d/') ? id.split('/d/')[1].split('/')[0] : id.trim();
    const url = `https://docs.google.com/spreadsheets/d/${cleanId}/edit`;

    const meta: GoogleSheetMeta = {
      spreadsheetId: cleanId,
      spreadsheetUrl: url,
      title: name || 'Google Sheet',
      lastSyncedAt: null,
    };
    onUpdateSheetMeta(meta);
    setSyncStatus('শিট লিঙ্ক করা হয়েছে। এবার সিন্ক বাটনে চাপুন।');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-3 sm:my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 bg-white/10 rounded-lg shrink-0">
              <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold truncate">Google Sheets ইন্টিগ্রেশন ও লাইভ সিন্ক</h2>
              <p className="text-[11px] sm:text-xs text-emerald-100 truncate">
                প্রোডাক্ট, বিক্রয় ও মাসিক লাভ-ক্ষতির লাইভ স্প্রেডশিট ও বাটন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
          {/* Auth section */}
          {!user ? (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-4">
              <div className="inline-flex p-3 bg-white rounded-2xl shadow-xs border border-slate-200">
                <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Google একাউন্টে সাইন ইন করুন
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                  গুগল শিটে সরাসরি নতুন ফাইল তৈরি করতে ও স্বয়ংক্রিয়ভাবে স্টক ও বিক্রয় ডেটা ব্যাকআপ রাখতে অনুমতি দিন।
                </p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isAuthenticating}
                  className="gsi-material-button mx-auto"
                >
                  <div className="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents">
                    {isAuthenticating ? 'সংযোগ হচ্ছে...' : 'Sign in with Google'}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-10 h-10 rounded-full border border-emerald-300" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">{user.displayName || 'Google User'}</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> কানেক্টেড
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="text-xs font-semibold text-slate-600 hover:text-rose-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-rose-300 bg-white transition-all"
              >
                লগআউট
              </button>
            </div>
          )}

          {/* Sync Alerts */}
          {syncStatus && (
            <div className="p-3 bg-emerald-100/70 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{syncStatus}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Current Linked Sheet Status */}
          {sheetMeta ? (
            <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-md space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                    লিঙ্ক করা গুগল শিট
                  </span>
                  <h4 className="text-base font-bold text-white mt-0.5">{sheetMeta.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    সর্বশেষ সিন্ক:{' '}
                    {sheetMeta.lastSyncedAt
                      ? new Date(sheetMeta.lastSyncedAt).toLocaleString('bn-BD')
                      : 'এখনও সিন্ক করা হয়নি'}
                  </p>
                </div>
                <a
                  href={sheetMeta.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  শিট ওপেন করুন
                </a>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/60 text-center">
                <div className="p-2 bg-slate-800/80 rounded-xl">
                  <p className="text-[10px] text-slate-400">মোট পণ্য</p>
                  <p className="text-sm font-bold text-emerald-300">{products.length} টি</p>
                </div>
                <div className="p-2 bg-slate-800/80 rounded-xl">
                  <p className="text-[10px] text-slate-400">মোট বিক্রয় এন্ট্রি</p>
                  <p className="text-sm font-bold text-teal-300">{sales.length} টি</p>
                </div>
                <div className="p-2 bg-slate-800/80 rounded-xl">
                  <p className="text-[10px] text-slate-400">মাসিক হিসাব</p>
                  <p className="text-sm font-bold text-blue-300">{monthlySummaries.length} মাস</p>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleSyncExisting}
                  disabled={isSyncing || !user}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'থিম ও বাটন সহ শিট আপডেট হচ্ছে...' : 'থিম ও বাটন সহ শিটে সব ডেটা সিন্ক করুন'}
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateSheetMeta(null)}
                  className="text-xs text-rose-400 hover:text-rose-300 underline text-center sm:text-right"
                >
                  শিট আনলিঙ্ক করুন
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 sm:p-5 border-2 border-dashed border-emerald-300 rounded-2xl bg-emerald-50/40 text-center space-y-3">
                <FileSpreadsheet className="w-10 h-10 text-emerald-600 mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    কোন গুগল শিট লিঙ্ক করা নেই
                  </h4>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1">
                    নিচের বাটনে চাপ দিলে আপনার গুগল ড্রাইভে ৩টি ট্যাব বিশিষ্ট সম্পূর্ণ রেডিমেড ডিজাইন ও নেভিগেশন বাটন সহ স্প্রেডশিট স্বয়ংক্রিয়ভাবে তৈরি হবে।
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCreateNewSheet}
                  disabled={isCreatingSheet || !user}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl inline-flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  {isCreatingSheet ? 'ডিজাইন ও শিট তৈরি হচ্ছে...' : 'নতুন গুগল শিট তৈরি ও ডিজাইন সিন্ক করুন'}
                </button>
              </div>

              {/* Or link existing sheet */}
              {user && (
                <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Database className="w-4 h-4 text-slate-500" />
                    পূর্বের গুগল শিট লিঙ্ক করতে চান? (Link Existing)
                  </div>

                  {isLoadingSheets ? (
                    <p className="text-xs text-slate-500">গুগল ড্রাইভ শিট লোড হচ্ছে...</p>
                  ) : availableSheets.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {availableSheets.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 text-xs hover:border-emerald-300 transition-colors"
                        >
                          <span className="font-medium text-slate-800 truncate max-w-xs">{s.name}</span>
                          <button
                            type="button"
                            onClick={() => handleLinkSheet(s.id, s.name)}
                            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg"
                          >
                            সিলেক্ট করুন
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Google Sheet ID বা URL পেস্ট করুন"
                        value={customSheetId}
                        onChange={(e) => setCustomSheetId(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs bg-white rounded-xl border border-slate-300 outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleLinkSheet(customSheetId)}
                        disabled={!customSheetId.trim()}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        লিঙ্ক
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Sync Features Info */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <p className="font-bold text-slate-800">গুগল শিটে যা যা সংরক্ষিত থাকবে:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="font-bold text-emerald-700">১. পণ্য ও স্টক:</span> নাম, ক্রয়মূল্য, বিক্রয়মূল্য, বর্তমান স্টক, মোট বিক্রয় ও স্টক মূল্য
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="font-bold text-teal-700">২. দৈনিক বিক্রয়:</span> তারিখ, পণ্য, সেদিনের দর, মোট বিক্রি, কেনা খরচ, লাভ ও মার্জিন
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="font-bold text-blue-700">৩. মাসিক হিসাব:</span> প্রতি মাসের মোট আয়, খরচ, নীট লাভ/ক্ষতি ও সেরা বিক্রিত পণ্য
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
