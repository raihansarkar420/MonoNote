export interface Note {
  id: string;
  email: string;
  user_id?: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error' | 'idle';

export interface UserProfile {
  id: string;
  email: string;
  isAnonymous?: boolean;
  isDemo?: boolean;
  isGuest?: boolean;
}
