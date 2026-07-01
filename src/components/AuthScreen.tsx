import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Sparkles, MessageSquare, ArrowRight, ShieldAlert, BadgeCheck } from 'lucide-react';
import { Theme } from '../types';
import { themeStyles } from './ThemeWrapper';

interface AuthScreenProps {
  theme: Theme;
  onLogin: (userData: { id: string; username: string; email: string; avatar: string }) => void;
}

type Mode = 'login' | 'register' | 'forgot' | 'verify';

export const AuthScreen: React.FC<AuthScreenProps> = ({ theme, onLogin }) => {
  const styles = themeStyles[theme] || themeStyles.classic;
  const [mode, setMode] = useState<Mode>('login');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [vCode, setVCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // One-click demo users
  const demoUsers = [
    {
      id: 'tester-' + Math.random().toString(36).substring(2, 7),
      username: 'Guest Explorer',
      email: 'guest@chatterbox.app',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'alice-session',
      username: 'Alice Vance',
      email: 'alice@chatterbox.net',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'bob-session',
      username: 'Bob Miller',
      email: 'bob@chatterbox.net',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    }
  ];

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all credentials.');
      return;
    }
    setError(null);
    // Simulate real authentications
    const normalizedEmail = email.toLowerCase().trim();
    const mockUsername = normalizedEmail.split('@')[0];
    const generatedAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(mockUsername)}`;
    
    onLogin({
      id: `user-${Date.now()}`,
      username: mockUsername.charAt(0).toUpperCase() + mockUsername.slice(1),
      email: normalizedEmail,
      avatar: generatedAvatar,
    });
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError('All fields are required.');
      return;
    }
    setError(null);
    setSuccess('Registration successful! Please verify your email.');
    setTimeout(() => {
      setMode('verify');
      setSuccess(null);
    }, 1500);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your registered email.');
      return;
    }
    setError(null);
    setSuccess('Password reset link sent to your inbox.');
    setTimeout(() => {
      setMode('login');
      setSuccess(null);
    }, 2500);
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vCode || vCode.length < 4) {
      setError('Invalid verification code. Use any 4-digit code (e.g. 1234)');
      return;
    }
    setError(null);
    setSuccess('Email successfully verified! Welcome aboard.');
    setTimeout(() => {
      const generatedId = `user-${Date.now()}`;
      onLogin({
        id: generatedId,
        username: username || 'NewUser',
        email: email || 'user@chatterbox.net',
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username || 'NewUser')}`,
      });
    }, 1500);
  };

  const selectDemoUser = (user: typeof demoUsers[0]) => {
    setError(null);
    onLogin({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 mb-3">
            <MessageSquare className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight">
            Chatter<span className={styles.accentText}>Box</span>
          </h1>
          <p className="text-slate-400 mt-1 text-sm font-sans">
            Real-time chat, group channels, and server-side AI integration
          </p>
        </div>

        {/* Card Panel */}
        <div className={`${styles.card} p-8 overflow-hidden relative`}>
          {/* Status Message */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-rose-400 text-xs"
              >
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-emerald-400 text-xs"
              >
                <BadgeCheck className="h-4 w-4 shrink-0" />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {mode === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all ${styles.inputBg} ${styles.ring}`}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-medium text-slate-400">Password</label>
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        className={`text-xs hover:underline ${styles.accentText}`}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all ${styles.inputBg} ${styles.ring}`}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all shadow-md ${styles.accent}`}
                  >
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>

                <div className="mt-5 text-center">
                  <p className="text-xs text-slate-400">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className={`font-medium hover:underline ${styles.accentText}`}
                    >
                      Sign up for free
                    </button>
                  </p>
                </div>
              </motion.div>
            )}

            {mode === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Username</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="chatter_geek"
                        className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all ${styles.inputBg} ${styles.ring}`}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all ${styles.inputBg} ${styles.ring}`}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all ${styles.inputBg} ${styles.ring}`}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all shadow-md ${styles.accent}`}
                  >
                    Create Account
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>

                <div className="mt-5 text-center">
                  <p className="text-xs text-slate-400">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className={`font-medium hover:underline ${styles.accentText}`}
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </motion.div>
            )}

            {mode === 'forgot' && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="text-sm font-semibold mb-2">Reset Password</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Enter your email address and we will mail you a link to reset your credentials.
                </p>
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all ${styles.inputBg} ${styles.ring}`}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${styles.accent}`}
                  >
                    Send Recovery Link
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="w-full text-center text-xs text-slate-400 hover:underline py-1"
                  >
                    Back to Sign In
                  </button>
                </form>
              </motion.div>
            )}

            {mode === 'verify' && (
              <motion.div
                key="verify"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="text-sm font-semibold mb-2">Verify your Email</h3>
                <p className="text-xs text-slate-400 mb-4">
                  We've sent a 4-digit code to **{email}**. Enter any code below to finish setup.
                </p>
                <form onSubmit={handleVerifySubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Verification Code</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={vCode}
                      onChange={(e) => setVCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="1234"
                      className={`w-full text-center tracking-widest text-lg font-bold rounded-xl border py-2.5 px-4 outline-none transition-all ${styles.inputBg} ${styles.ring}`}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${styles.accent}`}
                  >
                    Verify & Join
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Demo Accounts Helper */}
          {mode === 'login' && (
            <div className="mt-6 border-t border-slate-200/20 pt-5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                <span>Instant Sandbox Access (Open in Multiple Tabs!):</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {demoUsers.map((user, idx) => (
                  <button
                    key={user.id}
                    onClick={() => selectDemoUser(user)}
                    className={`flex flex-col items-center p-2 rounded-xl transition-all border border-slate-200/10 ${styles.secondaryBtn} group text-[10px]`}
                  >
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="h-8 w-8 rounded-full object-cover border-2 border-indigo-500/30 group-hover:border-indigo-500 transition-all mb-1"
                    />
                    <span className="font-semibold truncate max-w-full">{user.username.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
