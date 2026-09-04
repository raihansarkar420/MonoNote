import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Mail, ArrowRight, CheckCircle2, AlertCircle, Sparkles, BookOpen, Loader2 } from 'lucide-react';
import { SupabaseGuideModal } from './SupabaseGuideModal';

interface LoginViewProps {
  onDemoLogin?: (email: string) => void;
  onGuideOpen?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onDemoLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.trim()) return;

    setErrorMessage(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    // If Supabase is not configured with live credentials in this preview, offer helpful instant demo auth or clear guidance
    if (!isSupabaseConfigured) {
      setTimeout(() => {
        setLoading(false);
        setMagicLinkSent(true);
      }, 600);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setMagicLinkSent(true);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to send magic link. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FDFDFD] text-[#1A1A1A] flex flex-col justify-between p-6 sm:p-10 font-sans selection:bg-stone-200">
      {/* Top Bar / Brand (Geometric Balance) */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-black flex items-center justify-center rounded-sm text-white shadow-xs">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight text-[#1A1A1A]">
            MonoNote
          </span>
        </div>

        <button
          id="open-schema-guide-header-btn"
          onClick={() => setShowGuide(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#71717A] hover:text-[#18181B] bg-white hover:bg-[#F4F4F5] rounded border border-[#EEEEEE] transition-colors cursor-pointer shadow-xs"
        >
          <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
          <span>Supabase SQL & Setup</span>
        </button>
      </header>

      {/* Main Login Card */}
      <main className="w-full max-w-md mx-auto my-auto py-12">
        <div className="bg-white border border-[#EEEEEE] rounded-lg p-8 sm:p-10 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_20px_rgba(0,0,0,0.02)] relative">
          {/* Geometric Accent Line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-t-lg" />

          {magicLinkSent ? (
            <div className="text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <h1 className="text-xl font-semibold text-[#1A1A1A] tracking-tight">
                  Check your inbox
                </h1>
                <p className="text-sm text-[#71717A] leading-relaxed">
                  We sent a magic sign-in link to{' '}
                  <span className="text-[#1A1A1A] font-semibold">{email}</span>. Click the link in your email to open your distraction-free editor.
                </p>
              </div>

              {!isSupabaseConfigured && onDemoLogin && (
                <div className="pt-4 border-t border-[#F4F4F5] mt-4 space-y-3">
                  <div className="p-3 bg-[#FAFAFA] border border-[#EEEEEE] rounded text-xs text-[#71717A] text-left">
                    <span className="font-semibold text-emerald-600 block mb-1">Preview Mode Active</span>
                    To test the full fullscreen editor right now without waiting for email setup, enter preview mode below.
                  </div>
                  <button
                    id="enter-preview-dashboard-btn"
                    onClick={() => onDemoLogin(email)}
                    className="w-full py-2.5 px-4 bg-black hover:opacity-90 text-white font-medium rounded text-sm transition-opacity cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Open Editor as {email || 'user'}
                  </button>
                </div>
              )}

              <div className="pt-2">
                <button
                  id="try-another-email-btn"
                  onClick={() => {
                    setMagicLinkSent(false);
                    setErrorMessage(null);
                  }}
                  className="text-xs text-[#71717A] hover:text-[#18181B] underline underline-offset-4 cursor-pointer"
                >
                  Use a different email address
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-[#1A1A1A] tracking-tight">
                  Sign in
                </h1>
                <p className="text-sm text-[#71717A]">
                  Enter your email to receive a passwordless magic sign-in link.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email-input" className="block text-xs font-mono uppercase tracking-wider text-[#71717A]">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="email-input"
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-[#E4E4E7] rounded text-[#18181B] placeholder-[#A1A1AA] text-sm focus:outline-hidden focus:border-black focus:ring-1 focus:ring-black transition-all font-sans shadow-xs"
                      autoFocus
                    />
                    <Mail className="w-4 h-4 text-[#A1A1AA] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <button
                  id="send-magic-link-btn"
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full py-3 px-4 bg-black hover:opacity-90 text-white font-medium rounded text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending magic link...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue with Email</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Instant Preview / Demo Login shortcut */}
              {onDemoLogin && (
                <div className="pt-4 border-t border-[#F4F4F5] text-center space-y-2">
                  <button
                    id="quick-demo-btn"
                    type="button"
                    onClick={() => onDemoLogin('demo.writer@supabase.co')}
                    className="inline-flex items-center gap-1.5 text-xs text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Quick preview as <span className="font-mono font-medium text-[#18181B]">demo.writer@supabase.co</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Minimalist footer tagline */}
        <div className="mt-8 text-center text-xs text-[#A1A1AA] font-mono">
          <span>Clean • Distraction-Free • Supabase RLS Protected</span>
        </div>
      </main>

      {/* Bottom status bar */}
      <footer className="w-full max-w-5xl mx-auto flex items-center justify-between text-xs text-[#71717A] font-mono">
        <span>Single Note Engine</span>
        <button
          onClick={() => setShowGuide(true)}
          className="hover:text-[#18181B] transition-colors cursor-pointer"
        >
          View Database Schema &rarr;
        </button>
      </footer>

      {/* Guide Modal */}
      <SupabaseGuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
      />
    </div>
  );
};
