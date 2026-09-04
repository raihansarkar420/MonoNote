import React, { useState } from 'react';
import { X, Copy, Check, Database, Terminal, Shield, Sparkles } from 'lucide-react';

interface SupabaseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SQL_SCHEMA = `-- 1. Create the \`notes\` table
create table if not exists public.notes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    content text default '' not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint notes_user_id_key unique (user_id)
);

-- 2. Index for fast user_id query lookup
create index if not exists idx_notes_user_id on public.notes (user_id);

-- 3. Enable Row Level Security (RLS)
alter table public.notes enable row level security;

-- 4. Set RLS Policies (auth.uid() = user_id)
create policy "Users can view their own note"
    on public.notes for select
    using (auth.uid() = user_id);

create policy "Users can insert their own note"
    on public.notes for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own note"
    on public.notes for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own note"
    on public.notes for delete
    using (auth.uid() = user_id);`;

export const SupabaseGuideModal: React.FC<SupabaseGuideModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'sql' | 'env' | 'nextjs'>('sql');

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="guide-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="guide-modal-content"
        className="relative w-full max-w-2xl bg-white border border-[#EEEEEE] rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Geometric Accent Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-cyan-500" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EEEEEE] bg-white pt-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#1A1A1A]">Supabase & Next.js Setup Guide</h2>
              <p className="text-xs text-[#71717A]">SQL Schema, RLS Security, and Environment Configuration</p>
            </div>
          </div>
          <button
            id="close-guide-btn"
            onClick={onClose}
            className="p-1.5 text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-[#EEEEEE] bg-[#FAFAFA] text-xs">
          <button
            id="tab-sql-btn"
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-2 font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'sql'
                ? 'border-black text-[#18181B]'
                : 'border-transparent text-[#71717A] hover:text-[#18181B]'
            }`}
          >
            1. Supabase SQL Schema & RLS
          </button>
          <button
            id="tab-env-btn"
            onClick={() => setActiveTab('env')}
            className={`px-3 py-2 font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'env'
                ? 'border-black text-[#18181B]'
                : 'border-transparent text-[#71717A] hover:text-[#18181B]'
            }`}
          >
            2. Environment (.env.local)
          </button>
          <button
            id="tab-nextjs-btn"
            onClick={() => setActiveTab('nextjs')}
            className={`px-3 py-2 font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'nextjs'
                ? 'border-black text-[#18181B]'
                : 'border-transparent text-[#71717A] hover:text-[#18181B]'
            }`}
          >
            3. Next.js / Vercel Deploy
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-[#333333] flex-1 bg-white">
          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#71717A] flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  Run in Supabase Dashboard &rarr; <strong>SQL Editor</strong> &rarr; <strong>New Query</strong>
                </p>
                <button
                  id="copy-sql-btn"
                  onClick={() => handleCopy(SQL_SCHEMA)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#18181B] bg-[#F4F4F5] hover:bg-[#E4E4E7] rounded border border-[#E4E4E7] transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied SQL!' : 'Copy SQL'}
                </button>
              </div>

              <div className="relative rounded overflow-hidden border border-[#E4E4E7] bg-[#FAFAFA] font-mono text-xs">
                <pre className="p-4 overflow-x-auto text-[#18181B] leading-relaxed max-h-72">
                  <code>{SQL_SCHEMA}</code>
                </pre>
              </div>

              <div className="p-3 bg-[#FAFAFA] rounded border border-[#EEEEEE] text-xs text-[#71717A] space-y-1">
                <span className="font-semibold text-[#18181B]">Features implemented:</span>
                <ul className="list-disc list-inside space-y-0.5 text-[#71717A]">
                  <li>Automatic unique note constraint per user ID (`notes_user_id_key`).</li>
                  <li>Strict Row Level Security policies: only the authentic user (`auth.uid() = user_id`) can query, write, update, or clear their note.</li>
                  <li>Cascade deletion with `auth.users(id)` if user account is deleted.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'env' && (
            <div className="space-y-4">
              <p className="text-xs text-[#71717A]">
                In Supabase Dashboard &rarr; <strong>Project Settings</strong> &rarr; <strong>API</strong>, copy your Project URL and Anon/Public Key:
              </p>

              <div className="relative rounded overflow-hidden border border-[#E4E4E7] bg-[#FAFAFA] font-mono text-xs p-4 text-[#18181B]">
                <div className="text-[#A1A1AA] mb-1"># Connected Supabase Project Configuration:</div>
                <div>VITE_SUPABASE_URL=https://zlhrzeozucyobcrjrscv.supabase.co</div>
                <div>VITE_SUPABASE_ANON_KEY=sb_publishable_Appvg2ltqE1WMl_4HUaxEg_s4VWWHAh</div>
                <div className="mt-3 text-[#A1A1AA]"># For Next.js (App Router / Pages Router):</div>
                <div>NEXT_PUBLIC_SUPABASE_URL=https://zlhrzeozucyobcrjrscv.supabase.co</div>
                <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_Appvg2ltqE1WMl_4HUaxEg_s4VWWHAh</div>
              </div>

              <div className="p-3 bg-[#FAFAFA] rounded border border-[#EEEEEE] text-xs text-[#71717A]">
                <span className="font-semibold text-[#18181B]">Authentication Setup:</span>
                <p className="mt-1">
                  Ensure <strong>Email Auth</strong> and <strong>Magic Link (OTP)</strong> are enabled in Supabase &rarr; Authentication &rarr; Providers &rarr; Email.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'nextjs' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#FAFAFA] rounded border border-[#EEEEEE] text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-[#18181B]">
                  <Terminal className="w-4 h-4 text-emerald-600" />
                  Vercel Deployment Ready
                </div>
                <p className="text-[#71717A]">
                  When deploying to Vercel (or hosting on any Next.js / static host), add your environment variables in Vercel Project Settings &rarr; Environment Variables.
                </p>
              </div>

              <div className="p-3 bg-[#FAFAFA] rounded border border-[#EEEEEE] text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-[#18181B]">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Email Redirect URLs
                </div>
                <p className="text-[#71717A]">
                  In Supabase &rarr; Authentication &rarr; URL Configuration, add your production Vercel domain (e.g. <code className="text-[#18181B] bg-[#EEEEEE] px-1 py-0.5 rounded">https://your-app.vercel.app</code>) to <strong>Redirect URLs</strong> so magic links redirect correctly back to your app.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#FAFAFA] border-t border-[#EEEEEE] flex items-center justify-between text-xs text-[#71717A]">
          <span>SQL script saved at root <code className="text-[#18181B]">/supabase_schema.sql</code></span>
          <button
            id="guide-got-it-btn"
            onClick={onClose}
            className="px-4 py-1.5 font-medium text-white bg-black hover:opacity-90 rounded transition-opacity cursor-pointer shadow-xs"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
