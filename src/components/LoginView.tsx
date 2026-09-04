import React, { useState } from 'react';
import { Mail, ArrowRight, AlertCircle, Sparkles, BookOpen, Database, ShieldCheck } from 'lucide-react';
import { SupabaseGuideModal } from './SupabaseGuideModal';

interface LoginViewProps {
  onEmailLogin: (email: string) => void;
  onGuideOpen?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onEmailLogin }) => {
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    // Basic email validation
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address (e.g., name@example.com).');
      return;
    }

    setErrorMessage(null);
    onEmailLogin(cleanEmail);
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

          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-[#1A1A1A] tracking-tight">
                Sign in with Email
              </h1>
              <p className="text-sm text-[#71717A] leading-relaxed">
                Enter your email address to access your notes. Your text is saved and synced directly with the Supabase database.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email-input" className="block text-xs font-mono uppercase tracking-wider text-[#71717A]">
                  Email Address (User Identity)
                </label>
                <div className="relative">
                  <input
                    id="email-input"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="w-full px-4 py-3 bg-white border border-[#E4E4E7] rounded text-[#18181B] placeholder-[#A1A1AA] text-sm focus:outline-hidden focus:border-black focus:ring-1 focus:ring-black transition-all font-sans shadow-xs"
                    autoFocus
                  />
                  <Mail className="w-4 h-4 text-[#A1A1AA] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <button
                id="continue-with-email-btn"
                type="submit"
                className="w-full py-3 px-4 bg-black hover:opacity-90 text-white font-medium rounded text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs group"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Continue to Notepad</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </form>

            <div className="p-3 bg-[#FAFAFA] rounded border border-[#EEEEEE] space-y-2 text-xs text-[#71717A]">
              <div className="flex items-center gap-2 font-medium text-[#18181B]">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>No password or email verification required</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <Database className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                <span>Notes are saved in the Supabase DB linked to your email</span>
              </div>
            </div>
          </div>
        </div>

        {/* Minimalist footer tagline */}
        <div className="mt-8 text-center text-xs text-[#A1A1AA] font-mono">
          <span>Clean • Distraction-Free • Supabase DB Connected</span>
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
