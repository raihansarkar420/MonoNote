import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, SaveStatus, Note } from '../types';
import { ConfirmationModal } from './ConfirmationModal';
import { SupabaseGuideModal } from './SupabaseGuideModal';
import { NotesSidebar } from './NotesSidebar';
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
  Plus,
  PanelLeft,
  PanelLeftClose,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';

interface DashboardViewProps {
  user: UserProfile;
  onLogout: () => void;
}

const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const DashboardView: React.FC<DashboardViewProps> = ({ user, onLogout }) => {
  const emailKey = (user.email || '').trim().toLowerCase();

  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [fontFamily, setFontFamily] = useState<'mono' | 'sans' | 'serif'>('mono');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dbNotice, setDbNotice] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedTitleRef = useRef<string>('');
  const lastSavedContentRef = useRef<string>('');

  const activeNote = notes.find((n) => n.id === activeNoteId);

  // Helper: Persist note list to local storage
  const persistNotesToLocal = (notesList: Note[]) => {
    try {
      localStorage.setItem(`minimal_notes_${emailKey}`, JSON.stringify(notesList));
    } catch (e) {
      console.warn('Local storage write failed:', e);
    }
  };

  // Helper: Retrieve notes from local storage with legacy single note migration
  const getNotesFromLocal = useCallback((): Note[] => {
    try {
      const stored = localStorage.getItem(`minimal_notes_${emailKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }

      // Check legacy single-note key
      const legacyNote = localStorage.getItem(`minimal_note_${emailKey}`);
      if (legacyNote !== null) {
        const migratedNote: Note = {
          id: generateUUID(),
          email: emailKey,
          title: 'Welcome Note',
          content: legacyNote,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem(`minimal_notes_${emailKey}`, JSON.stringify([migratedNote]));
        return [migratedNote];
      }
    } catch (e) {
      console.warn('Error reading notes from localStorage:', e);
    }
    return [];
  }, [emailKey]);

  // 1. Fetch all notes from Supabase on load
  const fetchNotes = useCallback(async () => {
    setInitialLoading(true);
    setErrorMessage(null);
    setDbNotice(null);

    const localNotes = getNotesFromLocal();

    if (!isSupabaseConfigured) {
      if (localNotes.length > 0) {
        setNotes(localNotes);
        const current = localNotes[0];
        setActiveNoteId(current.id);
        setTitle(current.title || 'Untitled Note');
        setContent(current.content || '');
        lastSavedTitleRef.current = current.title || 'Untitled Note';
        lastSavedContentRef.current = current.content || '';
      } else {
        const defaultNote: Note = {
          id: generateUUID(),
          email: emailKey,
          title: 'Getting Started',
          content: `# Welcome to MonoNote\n\nThis is your private, multi-file text workspace.\n\n• Identity: ${emailKey}\n• Left Sidebar: Create and switch between multiple text files with Titles\n• Real-time Supabase Database Sync\n• Keyboard Shortcut: Cmd+S / Ctrl+S to save immediately\n\nStart typing anywhere...`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const initialList = [defaultNote];
        setNotes(initialList);
        persistNotesToLocal(initialList);
        setActiveNoteId(defaultNote.id);
        setTitle(defaultNote.title);
        setContent(defaultNote.content);
        lastSavedTitleRef.current = defaultNote.title;
        lastSavedContentRef.current = defaultNote.content;
      }
      setLastSavedAt(new Date());
      setSaveStatus('saved');
      setInitialLoading(false);
      return;
    }

    try {
      // Query notes by email
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('email', emailKey)
        .order('updated_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch notice:', error.message);
        setDbNotice(error.message);
        // Fallback to local
        if (localNotes.length > 0) {
          setNotes(localNotes);
          setActiveNoteId(localNotes[0].id);
          setTitle(localNotes[0].title || 'Untitled Note');
          setContent(localNotes[0].content || '');
          lastSavedTitleRef.current = localNotes[0].title || 'Untitled Note';
          lastSavedContentRef.current = localNotes[0].content || '';
        } else {
          const defaultNote: Note = {
            id: generateUUID(),
            email: emailKey,
            title: 'Welcome Note',
            content: `# Welcome ${emailKey}\n\nStart writing in your new workspace...`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setNotes([defaultNote]);
          persistNotesToLocal([defaultNote]);
          setActiveNoteId(defaultNote.id);
          setTitle(defaultNote.title);
          setContent(defaultNote.content);
        }
      } else if (data && data.length > 0) {
        const formatted: Note[] = data.map((d: any) => ({
          id: d.id || generateUUID(),
          email: d.email || emailKey,
          title: d.title || (d.content ? d.content.split('\n')[0].replace(/^[#\s*-_]+/, '').slice(0, 30) : 'Untitled Note'),
          content: d.content || '',
          created_at: d.created_at || new Date().toISOString(),
          updated_at: d.updated_at || new Date().toISOString(),
        }));

        setNotes(formatted);
        persistNotesToLocal(formatted);
        setActiveNoteId(formatted[0].id);
        setTitle(formatted[0].title);
        setContent(formatted[0].content);
        lastSavedTitleRef.current = formatted[0].title;
        lastSavedContentRef.current = formatted[0].content;
        setLastSavedAt(new Date(formatted[0].updated_at));
      } else {
        // First time in DB: if local has notes, keep them; else create welcome note
        if (localNotes.length > 0) {
          setNotes(localNotes);
          setActiveNoteId(localNotes[0].id);
          setTitle(localNotes[0].title || 'Untitled Note');
          setContent(localNotes[0].content || '');
          lastSavedTitleRef.current = localNotes[0].title || 'Untitled Note';
          lastSavedContentRef.current = localNotes[0].content || '';
          // Push first note to Supabase
          try {
            await supabase.from('notes').upsert({
              id: localNotes[0].id,
              email: emailKey,
              title: localNotes[0].title,
              content: localNotes[0].content,
              updated_at: new Date().toISOString(),
            });
          } catch (err) {
            console.warn('Initial sync notice:', err);
          }
        } else {
          const defaultNote: Note = {
            id: generateUUID(),
            email: emailKey,
            title: 'Welcome Note',
            content: `# Welcome ${emailKey}\n\nThis is your private, distraction-free multi-note workspace.\n\n• Identity: ${emailKey}\n• Left sidebar: Create and switch between multiple text files with Titles\n• Real-time Supabase Database Sync\n• Keyboard Shortcut: Cmd+S / Ctrl+S to save immediately\n\nStart typing anywhere...`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          const initialList = [defaultNote];
          setNotes(initialList);
          persistNotesToLocal(initialList);
          setActiveNoteId(defaultNote.id);
          setTitle(defaultNote.title);
          setContent(defaultNote.content);
          lastSavedTitleRef.current = defaultNote.title;
          lastSavedContentRef.current = defaultNote.content;

          try {
            await supabase.from('notes').upsert({
              id: defaultNote.id,
              email: emailKey,
              title: defaultNote.title,
              content: defaultNote.content,
              updated_at: new Date().toISOString(),
            });
          } catch (err) {
            console.warn('Initial default note sync notice:', err);
          }
        }
      }
      setSaveStatus('saved');
    } catch (err: any) {
      console.warn('Fetch notes exception:', err);
      if (localNotes.length > 0) {
        setNotes(localNotes);
        setActiveNoteId(localNotes[0].id);
        setTitle(localNotes[0].title || 'Untitled Note');
        setContent(localNotes[0].content || '');
      }
    } finally {
      setInitialLoading(false);
    }
  }, [emailKey, getNotesFromLocal]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // 2. Save active note to Supabase & local storage
  const saveActiveNote = useCallback(
    async (noteId: string, updatedTitle: string, updatedContent: string) => {
      setSaveStatus('saving');
      setErrorMessage(null);

      const nowIso = new Date().toISOString();

      // Update in local notes array
      setNotes((prevNotes) => {
        const nextNotes = prevNotes.map((n) =>
          n.id === noteId
            ? { ...n, title: updatedTitle, content: updatedContent, updated_at: nowIso }
            : n
        );
        persistNotesToLocal(nextNotes);
        return nextNotes;
      });

      lastSavedTitleRef.current = updatedTitle;
      lastSavedContentRef.current = updatedContent;
      setLastSavedAt(new Date());

      if (!isSupabaseConfigured) {
        setSaveStatus('saved');
        return;
      }

      try {
        let { error } = await supabase.from('notes').upsert(
          {
            id: noteId,
            email: emailKey,
            title: updatedTitle || 'Untitled',
            content: updatedContent,
            updated_at: nowIso,
          },
          { onConflict: 'id' }
        );

        // If title column doesn't exist yet, retry with content only
        if (error && (error.message.includes('title') || error.code === '42703')) {
          const fallback = await supabase.from('notes').upsert(
            {
              id: noteId,
              email: emailKey,
              content: updatedContent,
              updated_at: nowIso,
            },
            { onConflict: 'id' }
          );
          if (!fallback.error) {
            error = null;
            setDbNotice('Run updated SQL in guide to enable title column in DB');
          }
        }

        if (error) {
          console.warn('Supabase DB save error:', error.message);
          setDbNotice(error.message);
          setSaveStatus('saved'); // local storage backup is safe
        } else {
          setDbNotice(null);
          setSaveStatus('saved');
        }
      } catch (err: any) {
        console.warn('Save exception:', err);
        setSaveStatus('saved');
      }
    },
    [emailKey]
  );

  // Trigger debounced save
  const scheduleSave = (newTitle: string, newContent: string) => {
    if (!activeNoteId) return;

    if (
      newTitle !== lastSavedTitleRef.current ||
      newContent !== lastSavedContentRef.current
    ) {
      setSaveStatus('unsaved');

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveActiveNote(activeNoteId, newTitle, newContent);
      }, 1000);
    }
  };

  // 3. Handle Title Change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);

    // Update in memory array for fast sidebar preview
    if (activeNoteId) {
      setNotes((prev) =>
        prev.map((n) => (n.id === activeNoteId ? { ...n, title: newTitle } : n))
      );
    }
    scheduleSave(newTitle, content);
  };

  // 4. Handle Content Change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Update in memory array for fast sidebar snippet preview
    if (activeNoteId) {
      setNotes((prev) =>
        prev.map((n) => (n.id === activeNoteId ? { ...n, content: newContent } : n))
      );
    }
    scheduleSave(title, newContent);
  };

  // 5. Create a new text file/note
  const handleCreateNote = () => {
    // Flush current unsaved changes first if needed
    if (activeNoteId && saveStatus === 'unsaved') {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveActiveNote(activeNoteId, title, content);
    }

    const newId = generateUUID();
    const nowIso = new Date().toISOString();
    const newNote: Note = {
      id: newId,
      email: emailKey,
      title: 'Untitled File',
      content: '',
      created_at: nowIso,
      updated_at: nowIso,
    };

    const nextNotes = [newNote, ...notes];
    setNotes(nextNotes);
    persistNotesToLocal(nextNotes);
    setActiveNoteId(newId);
    setTitle(newNote.title);
    setContent('');
    lastSavedTitleRef.current = newNote.title;
    lastSavedContentRef.current = '';
    setSaveStatus('saved');
    setLastSavedAt(new Date());

    // Sync to Supabase
    if (isSupabaseConfigured) {
      (async () => {
        try {
          await supabase.from('notes').upsert(
            {
              id: newId,
              email: emailKey,
              title: newNote.title,
              content: '',
              updated_at: nowIso,
            },
            { onConflict: 'id' }
          );
        } catch (err) {
          console.warn('Create note sync notice:', err);
        }
      })();
    }

    // Focus title input
    setTimeout(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }, 50);
  };

  // 6. Select note to open in center editor
  const handleSelectNote = (targetNoteId: string) => {
    if (targetNoteId === activeNoteId) return;

    // Flush current unsaved note before switching
    if (activeNoteId && saveStatus === 'unsaved') {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveActiveNote(activeNoteId, title, content);
    }

    const target = notes.find((n) => n.id === targetNoteId);
    if (target) {
      setActiveNoteId(target.id);
      setTitle(target.title || 'Untitled Note');
      setContent(target.content || '');
      lastSavedTitleRef.current = target.title || 'Untitled Note';
      lastSavedContentRef.current = target.content || '';
      setSaveStatus('saved');
      setLastSavedAt(new Date(target.updated_at));
      textareaRef.current?.focus();
    }
  };

  // 7. Request Delete Note (opens confirmation modal)
  const handleRequestDelete = (noteId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNoteToDeleteId(noteId);
    setShowDeleteModal(true);
  };

  // Confirm delete note
  const handleConfirmDelete = async () => {
    const targetId = noteToDeleteId || activeNoteId;
    if (!targetId) return;

    setIsDeleting(true);
    setErrorMessage(null);

    const remainingNotes = notes.filter((n) => n.id !== targetId);
    setNotes(remainingNotes);
    persistNotesToLocal(remainingNotes);

    // Delete in Supabase
    if (isSupabaseConfigured) {
      try {
        await supabase.from('notes').delete().eq('id', targetId);
      } catch (err: any) {
        console.warn('Delete note exception:', err);
      }
    }

    // If deleted note was active, switch to next available note
    if (targetId === activeNoteId) {
      if (remainingNotes.length > 0) {
        const next = remainingNotes[0];
        setActiveNoteId(next.id);
        setTitle(next.title || 'Untitled Note');
        setContent(next.content || '');
        lastSavedTitleRef.current = next.title || 'Untitled Note';
        lastSavedContentRef.current = next.content || '';
        setSaveStatus('saved');
        setLastSavedAt(new Date(next.updated_at));
      } else {
        // Create an empty new file if all deleted
        const newId = generateUUID();
        const emptyNote: Note = {
          id: newId,
          email: emailKey,
          title: 'Untitled Note',
          content: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setNotes([emptyNote]);
        persistNotesToLocal([emptyNote]);
        setActiveNoteId(newId);
        setTitle(emptyNote.title);
        setContent('');
        lastSavedTitleRef.current = emptyNote.title;
        lastSavedContentRef.current = '';
        setSaveStatus('saved');
      }
    }

    setIsDeleting(false);
    setShowDeleteModal(false);
    setNoteToDeleteId(null);
  };

  // 8. Copy note content to clipboard
  const handleCopy = () => {
    const fullText = title ? `${title}\n\n${content}` : content;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 9. Download current note as .txt file
  const handleDownload = () => {
    const filename = (title.trim() || 'note')
      .replace(/[^a-z0-9_-]/gi, '_')
      .toLowerCase();
    const fullText = title ? `${title}\n\n${content}` : content;
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 10. Keyboard Shortcut (Cmd+S / Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (activeNoteId) {
          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
          saveActiveNote(activeNoteId, title, content);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeNoteId, title, content, saveActiveNote]);

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
        className="h-16 flex items-center justify-between px-3 sm:px-6 md:px-8 border-b border-[#EEEEEE] bg-white shrink-0 z-20"
      >
        {/* Left: Brand mark & Sidebar Toggle */}
        <div className="flex items-center space-x-3">
          {/* Toggle Sidebar Button */}
          <button
            id="header-toggle-sidebar-btn"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className={`p-2 rounded transition-colors cursor-pointer ${
              isSidebarOpen
                ? 'text-black bg-[#F4F4F5]'
                : 'text-[#71717A] hover:text-black hover:bg-[#F4F4F5]'
            }`}
            title={isSidebarOpen ? 'Hide files sidebar' : 'Show files sidebar'}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-5 h-5" />
            ) : (
              <PanelLeft className="w-5 h-5" />
            )}
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 bg-black flex items-center justify-center rounded-sm text-white shadow-xs">
              <svg
                width="16"
                height="16"
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
            <span className="text-base sm:text-lg font-semibold tracking-tight text-[#1A1A1A]">
              MonoNote
            </span>
          </div>
        </div>

        {/* Right Section: User Email, Status & Actions */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* User Email & DB Status */}
          <div
            id="user-email-badge"
            className="flex items-center space-x-2 text-xs sm:text-sm text-[#18181B] bg-stone-50 border border-[#E4E4E7] px-2.5 py-1 rounded max-w-[150px] sm:max-w-[280px] truncate"
            title={`Connected email identity: ${user.email}`}
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate font-medium">{user.email}</span>
            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded font-mono shrink-0 hidden lg:inline">
              DB
            </span>
          </div>

          {dbNotice && (
            <button
              id="db-notice-pill-btn"
              onClick={() => setShowGuideModal(true)}
              className="px-2 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] rounded flex items-center gap-1 hover:bg-amber-100 transition-colors cursor-pointer"
              title={`Supabase notice: ${dbNotice}. Click to view SQL setup.`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="hidden md:inline">SQL Setup Needed</span>
            </button>
          )}

          <div className="h-6 w-[1px] bg-[#EEEEEE] hidden sm:block" />

          {/* Action Buttons */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Quick New File Button */}
            <button
              id="header-create-note-btn"
              onClick={handleCreateNote}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-[#18181B] text-xs font-medium rounded transition-colors cursor-pointer"
              title="Create new file (+)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>

            {/* Manual Save Button */}
            <button
              id="manual-save-btn"
              onClick={() => {
                if (activeNoteId) {
                  if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                  saveActiveNote(activeNoteId, title, content);
                }
              }}
              disabled={saveStatus === 'saving' || saveStatus === 'saved'}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-black text-white text-xs sm:text-sm font-medium rounded hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer shadow-xs"
              title="Save changes (Cmd+S / Ctrl+S)"
            >
              {saveStatus === 'saving' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Save className="w-3.5 h-3.5 text-white" />
              )}
              <span className="hidden xs:inline">
                {saveStatus === 'saving'
                  ? 'Saving'
                  : saveStatus === 'unsaved'
                  ? 'Save'
                  : 'Saved'}
              </span>
            </button>

            {/* Delete Active Note Button */}
            <button
              id="header-delete-note-btn"
              onClick={() => activeNoteId && handleRequestDelete(activeNoteId)}
              className="p-2 text-[#71717A] hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
              title="Delete current note"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Supabase SQL & Architecture Modal */}
            <button
              id="dashboard-open-guide-btn"
              onClick={() => setShowGuideModal(true)}
              className="p-2 text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] rounded transition-colors cursor-pointer"
              title="Supabase Schema & Setup Guide"
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
        <div className="bg-rose-50 border-b border-rose-200 text-rose-800 text-xs px-6 py-2 flex items-center justify-between">
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

      {/* Main Workspace Body with Sidebar & Center Editor */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Section: Multiple Notes Sidebar */}
        <NotesSidebar
          notes={notes}
          activeNoteId={activeNoteId}
          onSelectNote={handleSelectNote}
          onCreateNote={handleCreateNote}
          onDeleteNote={handleRequestDelete}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(false)}
        />

        {/* Center Section: Active Note Text Editor */}
        <div className="flex-1 flex flex-col relative px-3 sm:px-8 md:px-12 lg:px-16 py-4 sm:py-6 overflow-y-auto">
          {initialLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[#71717A]">
              <Loader2 className="w-6 h-6 animate-spin text-black" />
              <p className="text-xs font-mono">Loading notes from Supabase...</p>
            </div>
          ) : (
            <div className="max-w-4xl w-full mx-auto flex-1 min-h-[460px] flex flex-col bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_20px_rgba(0,0,0,0.02)] border border-[#EEEEEE] rounded-lg relative">
              {/* Geometric Gradient Accent Line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-t-lg" />

              <div className="flex-1 p-5 sm:p-8 md:p-10 overflow-hidden flex flex-col">
                {/* Note Title Input with Sleek Typography */}
                <div className="mb-4">
                  <input
                    id="note-title-input"
                    ref={titleInputRef}
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="Note Title..."
                    className="w-full text-xl sm:text-2xl font-bold tracking-tight text-[#18181B] placeholder-[#A1A1AA] bg-transparent outline-none border-b border-transparent focus:border-[#EEEEEE] pb-2 transition-colors"
                  />
                </div>

                {/* Working Draft Header & Font Selector */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F4F4F5]">
                  <div className="flex items-center space-x-2 sm:space-x-3 text-xs text-[#A1A1AA]">
                    <div className="w-4 h-4 flex items-center justify-center text-[#A1A1AA]">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <span className="uppercase tracking-wider font-semibold text-[11px]">
                      Editor
                    </span>
                    <span className="text-[#D4D4D8] hidden sm:inline">•</span>
                    <span className="text-[11px] hidden sm:inline">
                      {saveStatus === 'saving'
                        ? 'Syncing to DB...'
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
                <div className="flex-1 relative min-h-[280px]">
                  <textarea
                    id="fullscreen-note-editor"
                    ref={textareaRef}
                    value={content}
                    onChange={handleContentChange}
                    placeholder="Start typing your text here..."
                    className={`w-full h-full text-base sm:text-lg text-[#333333] leading-relaxed resize-none border-none outline-none focus:ring-0 placeholder-[#D4D4D8] bg-transparent selection:bg-stone-200 ${fontClass}`}
                    spellCheck={false}
                  />
                </div>
              </div>

              {/* Geometric Bottom Card Strip */}
              <div className="h-12 border-t border-[#F4F4F5] bg-[#FAFAFA] rounded-b-lg flex items-center justify-between px-4 sm:px-6 text-[11px] font-medium text-[#A1A1AA] uppercase tracking-wider">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <span>Words: {wordCount}</span>
                  <span>Chars: {charCount}</span>
                  <span className="hidden sm:inline">Lines: {lineCount}</span>
                </div>

                <div className="flex items-center space-x-3 sm:space-x-4">
                  <button
                    id="copy-note-text-btn"
                    onClick={handleCopy}
                    className="hover:text-[#18181B] transition-colors cursor-pointer flex items-center gap-1 normal-case text-xs"
                    title="Copy note text"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden md:inline">{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    id="download-note-txt-btn"
                    onClick={handleDownload}
                    className="hover:text-[#18181B] transition-colors cursor-pointer flex items-center gap-1 normal-case text-xs"
                    title="Download file as .txt"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Download</span>
                  </button>

                  <div className="h-4 w-[1px] bg-[#E4E4E7]" />

                  <div className="flex items-center space-x-1.5 normal-case font-mono text-[11px] text-[#71717A]">
                    <span>
                      {lastSavedAt
                        ? `Synced ${lastSavedAt.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`
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
          <div className="mt-4 sm:mt-6 max-w-4xl w-full mx-auto flex items-center justify-between px-2 text-[#A1A1AA]">
            <div className="flex items-center space-x-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-tighter">
                  Database
                </span>
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Supabase Connected
                </span>
              </div>

              <div className="w-[1px] h-6 bg-[#EEEEEE]"></div>

              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-tighter">
                  Storage
                </span>
                <span className="text-xs font-semibold text-[#18181B]">
                  {notes.length} {notes.length === 1 ? 'File' : 'Files'} Saved
                </span>
              </div>
            </div>

            <div className="text-[11px] font-mono hidden sm:block">
              {emailKey}
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Modal for Deletion */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete File"
        message="Are you sure you want to delete this text file? This action will permanently remove it from your workspace and database."
        confirmText="Yes, Delete File"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setNoteToDeleteId(null);
        }}
      />

      {/* Supabase Schema & Setup Guide Modal */}
      <SupabaseGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />
    </div>
  );
};
