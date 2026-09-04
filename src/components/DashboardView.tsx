import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, SaveStatus } from '../types';
import { ConfirmationModal } from './ConfirmationModal';
import { SupabaseGuideModal } from './SupabaseGuideModal';
import {
  Save,
  Trash2,
  LogOut,
  Check,
  Loader2,
  AlertCircle,
  Copy,
  Download,
  Database,
  Type,
  Maximize2,
  Minimize2,
  Sparkles,
} from 'lucide-react';

interface DashboardViewProps {
  user: UserProfile;
  onLogout: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ user, onLogout }) => {
  const [content, setContent] = useState<string>('');
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [fontFamily, setFontFamily] = useState<'mono' | 'sans' | 'serif'>('mono');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<string>('');

  // 1. Fetch note from Supabase on load
  const fetchNote = useCallback(async () => {
    setInitialLoading(true);
    setErrorMessage(null);

    if (!isSupabaseConfigured || user.isDemo) {
      // Load from local storage for demo/preview mode
      const savedLocal = localStorage.getItem(`minimal_note_${user.id}`);
      if (savedLocal !== null) {
        setContent(savedLocal);
        lastSavedContentRef.current = savedLocal;
      } else {
        const welcomeText = `# Welcome to your Minimal Note\n\nThis is your clean, distraction-free text editor.\n\nKey features:\n• Auto-saving as you type\n• Supabase RLS secured persistence\n• Shortcut: Cmd+S / Ctrl+S to save immediately\n• Clean markdown or plain text writing\n\nStart typing anywhere...`;
        setContent(welcomeText);
        lastSavedContentRef.current = welcomeText;
      }
      setLastSavedAt(new Date());
      setSaveStatus('saved');
      setInitialLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notes')
        .select('id, content, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching note from Supabase:', error);
        setErrorMessage(error.message);
      } else if (data) {
        setContent(data.content || '');
        lastSavedContentRef.current = data.content || '';
        if (data.updated_at) {
          setLastSavedAt(new Date(data.updated_at));
        }
      } else {
        // No existing note record yet for this user, start empty
        setContent('');
        lastSavedContentRef.current = '';
      }
      setSaveStatus('saved');
    } catch (err: any) {
      console.error('Fetch note exception:', err);
      setErrorMessage(err?.message || 'Failed to load note.');
    } finally {
      setInitialLoading(false);
    }
  }, [user.id, user.isDemo]);

  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

  // 2. Save note to Supabase (upsert based on user_id)
  const saveNote = useCallback(
    async (textToSave: string) => {
      setSaveStatus('saving');
      setErrorMessage(null);

      if (!isSupabaseConfigured || user.isDemo) {
        // Fallback local storage save
        localStorage.setItem(`minimal_note_${user.id}`, textToSave);
        lastSavedContentRef.current = textToSave;
        setLastSavedAt(new Date());
        setSaveStatus('saved');
        return;
      }

      try {
        const { error } = await supabase.from('notes').upsert(
          {
            user_id: user.id,
            content: textToSave,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

        if (error) {
          console.error('Error saving note:', error);
          setSaveStatus('error');
          setErrorMessage(error.message);
        } else {
          lastSavedContentRef.current = textToSave;
          setLastSavedAt(new Date());
          setSaveStatus('saved');
        }
      } catch (err: any) {
        console.error('Save exception:', err);
        setSaveStatus('error');
        setErrorMessage(err?.message || 'Failed to save note.');
      }
    },
    [user.id, user.isDemo]
  );

  // 3. Handle Text Change & Auto-save debounce
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setContent(newText);

    if (newText !== lastSavedContentRef.current) {
      setSaveStatus('unsaved');

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Auto-save after 1.2 seconds of typing pause
      saveTimeoutRef.current = setTimeout(() => {
        saveNote(newText);
      }, 1200);
    }
  };

  // 4. Delete / Clear note
  const handleDeleteNote = async () => {
    setIsDeleting(true);
    setErrorMessage(null);

    if (!isSupabaseConfigured || user.isDemo) {
      localStorage.removeItem(`minimal_note_${user.id}`);
      setContent('');
      lastSavedContentRef.current = '';
      setSaveStatus('saved');
      setLastSavedAt(new Date());
      setIsDeleting(false);
      setShowDeleteModal(false);
      textareaRef.current?.focus();
      return;
    }

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        setErrorMessage(error.message);
      } else {
        setContent('');
        lastSavedContentRef.current = '';
        setSaveStatus('saved');
        setLastSavedAt(new Date());
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to delete note.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      textareaRef.current?.focus();
    }
  };

  // 5. Copy content to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 6. Download content as file
  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `note-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 7. Keyboard Shortcuts (Cmd+S / Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveNote(content);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content, saveNote]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Stats
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const lineCount = content ? content.split('\n').length : 0;

  const fontClass =
    fontFamily === 'mono'
      ? 'font-mono'
      : fontFamily === 'serif'
      ? 'font-serif'
      : 'font-sans';

  return (
    <div className="h-full flex flex-col bg-[#FDFDFD] text-[#1A1A1A] font-sans overflow-hidden select-none">
      {/* Sleek Top Bar (Geometric Balance) */}
      <header
        id="dashboard-header"
        className="h-16 flex items-center justify-between px-4 sm:px-10 border-b border-[#EEEEEE] bg-white shrink-0 z-20"
      >
        {/* Left: Brand mark & App Name */}
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

        {/* Right Section: User Pill, Save Status & Actions */}
        <div className="flex items-center space-x-3 sm:space-x-6">
          {/* User Email & Active Dot */}
          <div
            id="user-email-badge"
            className="flex items-center space-x-2 text-xs sm:text-sm text-[#71717A] max-w-[140px] sm:max-w-[260px] truncate"
            title={user.email || 'Authenticated User'}
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">{user.email || 'user@supabase.co'}</span>
            {user.isDemo && (
              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] rounded font-mono shrink-0">
                Preview
              </span>
            )}
          </div>

          <div className="h-6 w-[1px] bg-[#EEEEEE] hidden sm:block" />

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Manual Save Button (High-Contrast Solid Black) */}
            <button
              id="manual-save-btn"
              onClick={() => {
                if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                saveNote(content);
              }}
              disabled={saveStatus === 'saving' || saveStatus === 'saved'}
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-black text-white text-xs sm:text-sm font-medium rounded hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer shadow-xs"
              title="Save changes (Cmd+S / Ctrl+S)"
            >
              {saveStatus === 'saving' ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Save className="w-4 h-4 text-white" />
              )}
              <span className="hidden xs:inline">
                {saveStatus === 'saving' ? 'Saving...' : 'Save changes'}
              </span>
            </button>

            {/* Delete/Clear Button */}
            <button
              id="open-delete-modal-btn"
              onClick={() => setShowDeleteModal(true)}
              className="p-2 text-[#71717A] hover:text-rose-600 hover:bg-[#F4F4F5] rounded transition-colors cursor-pointer"
              title="Clear note content"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Supabase SQL & Architecture Modal */}
            <button
              id="dashboard-open-guide-btn"
              onClick={() => setShowGuideModal(true)}
              className="p-2 text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] rounded transition-colors cursor-pointer"
              title="Supabase Schema & Configuration"
            >
              <Database className="w-4 h-4" />
            </button>

            {/* Logout Button */}
            <button
              id="logout-btn"
              onClick={onLogout}
              className="p-2 text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] rounded transition-colors cursor-pointer"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Optional Error Alert Banner */}
      {errorMessage && (
        <div className="bg-rose-50 border-b border-rose-200 text-rose-800 text-xs px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-950 font-medium underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Canvas with Geometric Card Layout */}
      <main className="flex-1 flex flex-col relative px-4 sm:px-10 md:px-16 lg:px-20 py-6 sm:py-8 overflow-y-auto">
        {initialLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[#71717A]">
            <Loader2 className="w-6 h-6 animate-spin text-black" />
            <p className="text-xs font-mono">Loading note from Supabase...</p>
          </div>
        ) : (
          <div className="max-w-4xl w-full mx-auto flex-1 min-h-[440px] flex flex-col bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_20px_rgba(0,0,0,0.02)] border border-[#EEEEEE] rounded-lg relative">
            {/* Geometric Gradient Accent Line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-t-lg" />

            <div className="flex-1 p-6 sm:p-10 md:p-12 overflow-hidden flex flex-col">
              {/* Working Draft Header & Font Selector */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#F4F4F5]">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 flex items-center justify-center text-[#A1A1AA]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                  </div>
                  <span className="text-xs uppercase tracking-widest text-[#A1A1AA] font-bold">
                    Working Draft
                  </span>
                  <span className="text-xs text-[#D4D4D8] hidden sm:inline">•</span>
                  <span className="text-xs text-[#A1A1AA] hidden sm:inline">
                    {saveStatus === 'saving'
                      ? 'Syncing changes...'
                      : saveStatus === 'unsaved'
                      ? 'Unsaved changes'
                      : 'Real-time database sync'}
                  </span>
                </div>

                {/* Typography Switch */}
                <div className="flex items-center bg-[#F4F4F5] rounded p-0.5 text-[11px] font-medium">
                  <button
                    onClick={() => setFontFamily('mono')}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      fontFamily === 'mono'
                        ? 'bg-white text-[#18181B] shadow-xs'
                        : 'text-[#71717A] hover:text-[#18181B]'
                    }`}
                    title="Monospace Font"
                  >
                    Mono
                  </button>
                  <button
                    onClick={() => setFontFamily('sans')}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      fontFamily === 'sans'
                        ? 'bg-white text-[#18181B] shadow-xs'
                        : 'text-[#71717A] hover:text-[#18181B]'
                    }`}
                    title="Sans-Serif Font"
                  >
                    Sans
                  </button>
                  <button
                    onClick={() => setFontFamily('serif')}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      fontFamily === 'serif'
                        ? 'bg-white text-[#18181B] shadow-xs'
                        : 'text-[#71717A] hover:text-[#18181B]'
                    }`}
                    title="Serif Font"
                  >
                    Serif
                  </button>
                </div>
              </div>

              {/* Distraction-Free Textarea */}
              <div className="flex-1 relative">
                <textarea
                  id="fullscreen-note-editor"
                  ref={textareaRef}
                  value={content}
                  onChange={handleContentChange}
                  placeholder="Start typing your ideas here..."
                  className={`w-full h-full text-base sm:text-lg text-[#333333] leading-relaxed resize-none border-none outline-none focus:ring-0 placeholder-[#D4D4D8] bg-transparent selection:bg-stone-200 ${fontClass}`}
                  spellCheck={false}
                  autoFocus
                />
              </div>
            </div>

            {/* Geometric Bottom Card Strip */}
            <div className="h-12 border-t border-[#F4F4F5] bg-[#FAFAFA] rounded-b-lg flex items-center justify-between px-6 text-[11px] font-medium text-[#A1A1AA] uppercase tracking-wider">
              <div className="flex items-center space-x-4">
                <span>Words: {wordCount}</span>
                <span>Characters: {charCount}</span>
                <span className="hidden sm:inline">Lines: {lineCount}</span>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  id="copy-note-text-btn"
                  onClick={handleCopy}
                  className="hover:text-[#18181B] transition-colors cursor-pointer flex items-center gap-1 normal-case text-xs"
                  title="Copy text"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden md:inline">{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  id="download-note-txt-btn"
                  onClick={handleDownload}
                  className="hover:text-[#18181B] transition-colors cursor-pointer flex items-center gap-1 normal-case text-xs"
                  title="Download .txt"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Download</span>
                </button>

                <div className="h-4 w-[1px] bg-[#E4E4E7]" />

                <div className="flex items-center space-x-1.5 normal-case font-mono text-[11px] text-[#71717A]">
                  <span>
                    {lastSavedAt
                      ? `Synced ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : 'Ready'}
                  </span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-emerald-500"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Geometric Balance Meta Row */}
        <div className="mt-6 sm:mt-8 max-w-4xl w-full mx-auto flex items-center justify-between px-2">
          <div className="flex items-center space-x-6">
            <div className="flex flex-col">
              <span className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-tighter">
                Database Status
              </span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Connected
              </span>
            </div>

            <div className="w-[1px] h-6 bg-[#EEEEEE]"></div>

            <div className="flex flex-col">
              <span className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-tighter">
                Storage & RLS
              </span>
              <span className="text-xs font-semibold text-[#18181B]">
                Supabase RLS Protected
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[#D1D5DB]">
            <div className="w-2 h-2 rounded-full bg-current"></div>
            <div className="w-2 h-2 rounded-full bg-current"></div>
            <div className="w-2 h-2 rounded-full bg-[#3F3F46]"></div>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteNote}
        isDeleting={isDeleting}
        title="Clear this note?"
        description="This will erase all content in the editor and remove the saved note record from Supabase."
        confirmText="Clear Note"
      />

      {/* Supabase SQL and Configuration Guide Modal */}
      <SupabaseGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />
    </div>
  );
};
