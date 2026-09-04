import React, { useState, useEffect } from 'react';
import { UserProfile } from './types';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check existing email user session
    const savedUser = localStorage.getItem('minimal_note_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed?.email) {
          setUser(parsed);
          setLoading(false);
          return;
        }
      } catch (e) {
        localStorage.removeItem('minimal_note_user');
      }
    }
    setLoading(false);
  }, []);

  // Direct Email Login: No password and no confirmation email required!
  const handleEmailLogin = (emailInput: string) => {
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail) return;

    const emailUser: UserProfile = {
      id: cleanEmail,
      email: cleanEmail,
    };

    localStorage.setItem('minimal_note_user', JSON.stringify(emailUser));
    setUser(emailUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('minimal_note_user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#FDFDFD] flex flex-col items-center justify-center text-[#71717A] gap-3 font-sans">
        <Loader2 className="w-6 h-6 animate-spin text-black" />
        <span className="text-xs font-mono">Opening distraction-free workspace...</span>
      </div>
    );
  }

  return user ? (
    <DashboardView user={user} onLogout={handleLogout} />
  ) : (
    <LoginView onEmailLogin={handleEmailLogin} />
  );
}

