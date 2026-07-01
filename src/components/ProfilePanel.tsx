import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, PenTool, Check, Sparkles, UserCheck } from 'lucide-react';
import { Theme, User as UserType } from '../types';
import { themeStyles } from './ThemeWrapper';

interface ProfilePanelProps {
  theme: Theme;
  currentUser: UserType;
  onUpdateProfile: (updatedData: { username: string; bio: string; avatar: string; status: 'online' | 'offline' | 'away' | 'busy' }) => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80'
];

export const ProfilePanel: React.FC<ProfilePanelProps> = ({
  theme,
  currentUser,
  onUpdateProfile,
}) => {
  const styles = themeStyles[theme] || themeStyles.classic;
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [status, setStatus] = useState<UserType['status']>(currentUser.status);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({ username, bio, avatar, status });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto h-full">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
          <User className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display font-bold text-sm leading-tight">My Profile Profile</h2>
          <span className="text-[10px] text-slate-400">Personalize your identity and statuses</span>
        </div>
      </div>

      <div className={`${styles.card} p-6 relative overflow-hidden`}>
        {/* Animated save banner */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: success ? 1 : 0, y: success ? 0 : -20 }}
          className="absolute top-4 right-4 bg-emerald-500/15 border border-emerald-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-emerald-400 text-[10px] font-semibold"
        >
          <Check className="h-3.5 w-3.5" />
          <span>Profile Saved!</span>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Cover & Presets Row */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-4 border-b border-slate-200/10">
            <div className="relative shrink-0">
              <img 
                src={avatar} 
                alt="preview" 
                className="h-20 w-20 rounded-2xl object-cover border-4 border-indigo-500/25 shadow-md"
              />
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-indigo-500 text-white flex items-center justify-center border-2 border-slate-900 shadow-sm">
                <PenTool className="h-3 w-3" />
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <span className="text-xs font-semibold text-slate-400 block mb-2">Select Avatar Preset</span>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {AVATAR_PRESETS.map((url) => (
                  <button
                    type="button"
                    key={url}
                    onClick={() => setAvatar(url)}
                    className={`relative h-10 w-10 rounded-xl overflow-hidden border-2 transition-all ${
                      avatar === url ? 'border-indigo-500 scale-105 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt="preset" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">User Handle</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="display_name"
                className={`w-full rounded-xl border py-2.5 px-4 text-xs outline-none transition-all ${styles.inputBg} ${styles.ring}`}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Availability Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as UserType['status'])}
                className={`w-full rounded-xl border py-2.5 px-4 text-xs outline-none transition-all ${styles.inputBg} ${styles.ring}`}
              >
                <option value="online">🟢 Online & Active</option>
                <option value="away">🟡 Away from Desk</option>
                <option value="busy">🔴 Do Not Disturb (Busy)</option>
                <option value="offline">⚫ Offline / Invisible</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Email (Verified)</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="email"
                value={currentUser.email}
                disabled
                className="w-full rounded-xl border border-slate-200/10 bg-slate-500/10 py-2.5 pl-10 pr-4 text-xs outline-none cursor-not-allowed text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Short Biography / Slogan</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other ChatterBox members about yourself..."
              rows={3}
              className={`w-full rounded-xl border py-2 px-4 text-xs outline-none transition-all resize-none ${styles.inputBg} ${styles.ring}`}
            />
          </div>

          <div className="flex gap-2.5 pt-3">
            <button
              type="submit"
              className={`w-full rounded-xl py-3 text-xs font-semibold shadow-md transition-all ${styles.accent}`}
            >
              Save Profile Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
