import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Users, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { Theme, User } from '../types';
import { themeStyles } from './ThemeWrapper';

interface GroupsPanelProps {
  theme: Theme;
  users: User[];
  currentUser: User;
  onClose: () => void;
  onCreateGroup: (name: string, description: string, avatar: string, members: string[]) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80', // work
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=150&auto=format&fit=crop&q=80', // lounge
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80', // music
  'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=150&auto=format&fit=crop&q=80'  // tech
];

export const GroupsPanel: React.FC<GroupsPanelProps> = ({
  theme,
  users,
  currentUser,
  onClose,
  onCreateGroup,
}) => {
  const styles = themeStyles[theme] || themeStyles.classic;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateGroup(name, description, avatar, selectedMembers);
    onClose();
  };

  const availableContacts = users.filter((u) => u.id !== currentUser.id && u.id !== 'gemini-bot');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-md ${styles.card} p-6 overflow-hidden`}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-200/10">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="text-base font-display font-bold">Assemble New Group</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200/10 text-slate-400 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Group Name & Desc */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Group Channel Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Design Sync"
              className={`w-full rounded-xl border py-2.5 px-4 text-xs outline-none transition-all ${styles.inputBg} ${styles.ring}`}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Purpose / Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what members will discuss in this channel..."
              rows={2}
              className={`w-full rounded-xl border py-2 px-4 text-xs outline-none transition-all resize-none ${styles.inputBg} ${styles.ring}`}
            />
          </div>

          {/* Preset Avatar Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" />
              <span>Group Cover Banner</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_AVATARS.map((url) => {
                const isSelected = avatar === url;
                return (
                  <button
                    type="button"
                    key={url}
                    onClick={() => setAvatar(url)}
                    className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all ${
                      isSelected ? 'border-indigo-500 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt="preset" className="h-full w-full object-cover" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Members checklist */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Select Members (Alice, Bob, Charlie)</label>
            <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-200/10 rounded-xl p-2 bg-slate-500/5">
              {availableContacts.length === 0 ? (
                <p className="text-center py-4 text-xs text-slate-400">No contacts available.</p>
              ) : (
                availableContacts.map((user) => {
                  const isChecked = selectedMembers.includes(user.id);
                  return (
                    <button
                      type="button"
                      key={user.id}
                      onClick={() => toggleMember(user.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                        isChecked ? 'bg-indigo-500/10' : 'hover:bg-slate-200/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img 
                          src={user.avatar} 
                          alt={user.username} 
                          className="h-8 w-8 rounded-lg object-cover shrink-0"
                        />
                        <span className="font-semibold text-xs truncate">{user.username}</span>
                      </div>
                      
                      {isChecked ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                      ) : (
                        <div className="h-4.5 w-4.5 rounded-full border-2 border-slate-400/40 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Submit buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 rounded-xl py-2.5 text-xs font-semibold ${styles.secondaryBtn}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 rounded-xl py-2.5 text-xs font-semibold ${styles.accent}`}
            >
              Assemble Channel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
