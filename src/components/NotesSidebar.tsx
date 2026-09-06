import React, { useState, useMemo } from 'react';
import { Note } from '../types';
import {
  FileText,
  Plus,
  Trash2,
  Search,
  PanelLeftClose,
  PanelLeft,
  Calendar,
  Layers,
  X,
} from 'lucide-react';

interface NotesSidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (noteId: string) => void;
  onCreateNote: () => void;
  onDeleteNote: (noteId: string, e: React.MouseEvent) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const NotesSidebar: React.FC<NotesSidebarProps> = ({
  notes,
  activeNoteId,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  isOpen,
  onToggle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter notes by title or content
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const query = searchQuery.toLowerCase();
    return notes.filter(
      (n) =>
        (n.title && n.title.toLowerCase().includes(query)) ||
        (n.content && n.content.toLowerCase().includes(query))
    );
  }, [notes, searchQuery]);

  const formatNoteTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '';
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <aside
      id="notes-sidebar"
      className="w-full sm:w-72 md:w-80 h-full bg-white border-r border-[#EEEEEE] flex flex-col shrink-0 z-10 transition-all duration-200 select-none"
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-[#EEEEEE] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-[#18181B]" />
          <h2 className="text-sm font-semibold tracking-tight text-[#18181B]">
            Saved Files
          </h2>
          <span className="px-1.5 py-0.5 bg-[#F4F4F5] text-[#71717A] text-[11px] font-mono rounded">
            {notes.length}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          {/* New Note Button */}
          <button
            id="sidebar-create-note-btn"
            onClick={onCreateNote}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-black text-white text-xs font-medium rounded hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            title="Create new text file (+)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New File</span>
          </button>

          {/* Toggle / Close Sidebar */}
          <button
            id="sidebar-close-btn"
            onClick={onToggle}
            className="p-1.5 text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] rounded transition-colors cursor-pointer"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="p-3 border-b border-[#F4F4F5]">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-[#A1A1AA] absolute left-2.5 pointer-events-none" />
          <input
            id="sidebar-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-[#F9F9FB] border border-[#EEEEEE] rounded text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-black transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-[#A1A1AA] hover:text-[#18181B] cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Note Items List */}
      <div
        id="sidebar-notes-list"
        className="flex-1 overflow-y-auto divide-y divide-[#F4F4F5] p-2 space-y-1"
      >
        {filteredNotes.length === 0 ? (
          <div className="py-10 px-4 text-center">
            <FileText className="w-8 h-8 text-[#D4D4D8] mx-auto mb-2" />
            <p className="text-xs font-medium text-[#71717A]">
              {searchQuery ? 'No matching notes found' : 'No saved files yet'}
            </p>
            <p className="text-[11px] text-[#A1A1AA] mt-1">
              {searchQuery
                ? 'Try a different search keyword'
                : 'Click "New File" to create your first note'}
            </p>
            {!searchQuery && (
              <button
                onClick={onCreateNote}
                className="mt-3 inline-flex items-center space-x-1 px-3 py-1.5 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#18181B] text-xs font-medium rounded transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create File</span>
              </button>
            )}
          </div>
        ) : (
          filteredNotes.map((note) => {
            const isActive = note.id === activeNoteId;
            const displayTitle = note.title?.trim() || 'Untitled Note';
            const snippet = note.content
              ? note.content.replace(/^[#\s*-_]+/, '').slice(0, 70).trim()
              : 'Empty note...';

            return (
              <div
                key={note.id}
                id={`note-item-${note.id}`}
                onClick={() => onSelectNote(note.id)}
                className={`group relative p-3 rounded cursor-pointer transition-all ${
                  isActive
                    ? 'bg-[#F4F4F5] border-l-3 border-black text-[#18181B]'
                    : 'hover:bg-[#F9F9FB] text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <FileText
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-black' : 'text-[#A1A1AA]'
                      }`}
                    />
                    <h3
                      className={`text-xs font-semibold truncate ${
                        isActive ? 'text-black' : 'text-[#18181B]'
                      }`}
                    >
                      {displayTitle}
                    </h3>
                  </div>

                  {/* Delete Item Button (Only shown on hover or active) */}
                  <button
                    id={`delete-note-btn-${note.id}`}
                    onClick={(e) => onDeleteNote(note.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#A1A1AA] hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer shrink-0"
                    title="Delete note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Content Snippet */}
                <p className="text-[11px] text-[#71717A] line-clamp-1 mt-1 font-sans">
                  {snippet}
                </p>

                {/* Updated Timestamp */}
                <div className="flex items-center space-x-1.5 text-[10px] text-[#A1A1AA] mt-2 font-mono">
                  <Calendar className="w-2.5 h-2.5" />
                  <span>{formatNoteTime(note.updated_at)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer info */}
      <div className="p-3 border-t border-[#EEEEEE] bg-[#FAFAFA] text-[11px] text-[#A1A1AA] flex items-center justify-between font-mono">
        <span>Click to switch file</span>
        <span>Auto-saved</span>
      </div>
    </aside>
  );
};
