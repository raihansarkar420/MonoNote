import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { UserProfile } from './types';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local preview session first
    const demoSession = localStorage.getItem('minimal_note_demo_session');
    if (demoSession) {
      try {
        const parsed = JSON.parse(demoSession);
        setUser(parsed);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('minimal_note_demo_session');
      }
    }

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // 1. Get current Supabase session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            isAnonymous: session.user.is_anonymous,
          });
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // 2. Listen to Supabase auth state changes (e.g. Magic Link click callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            isAnonymous: session.user.is_anonymous,
          });
        } else if (!localStorage.getItem('minimal_note_demo_session')) {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleDemoLogin = (email: string) => {
    const demoUser: UserProfile = {
      id: 'demo-user-' + Math.random().toString(36).substring(2, 9),
      email: email || 'demo.writer@supabase.co',
      isDemo: true,
    };
    localStorage.setItem('minimal_note_demo_session', JSON.stringify(demoUser));
    setUser(demoUser);
  };

  const handleLogout = async () => {
    localStorage.removeItem('minimal_note_demo_session');
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Error logging out:', err);
      }
    }
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#FDFDFD] flex flex-col items-center justify-center text-[#71717A] gap-3 font-sans">
        <Loader2 className="w-6 h-6 animate-spin text-black" />
        <span className="text-xs font-mono">Initializing note workspace...</span>
      </div>
    );
  }

  return user ? (
    <DashboardView user={user} onLogout={handleLogout} />
  ) : (
    <LoginView onDemoLogin={handleDemoLogin} />
  );
}
