import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, Shield, Bell, Volume2, Database, Palette, Eye } from 'lucide-react';
import { Theme } from '../types';
import { themeStyles } from './ThemeWrapper';

interface SettingsPanelProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onClearHistory: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  theme,
  onThemeChange,
  onClearHistory,
}) => {
  const styles = themeStyles[theme] || themeStyles.classic;
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifsEnabled, setNotifsEnabled] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [cleared, setCleared] = useState(false);

  const themeOptions = [
    { id: 'classic' as Theme, label: 'Classic Light', color: 'bg-indigo-600', text: 'slate-800' },
    { id: 'twilight' as Theme, label: 'Twilight Indigo', color: 'bg-[#0f172a]', text: 'slate-200' },
    { id: 'sunset' as Theme, label: 'Obsidian Sunset', color: 'bg-[#1a0f0f]', text: 'rose-400' },
    { id: 'emerald' as Theme, label: 'Emerald Forest', color: 'bg-[#064e3b]', text: 'emerald-400' },
  ];

  const handleClear = () => {
    onClearHistory();
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto h-full">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display font-bold text-sm leading-tight">System Settings</h2>
          <span className="text-[10px] text-slate-400">Configure visual themes, sound feeds, and cache logs</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Theme Settings card */}
        <div className={`${styles.card} p-5`}>
          <div className="flex items-center gap-2 mb-4">
            <Palette className="h-4.5 w-4.5 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Aesthetic Colors</h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {themeOptions.map((opt) => {
              const isSelected = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => onThemeChange(opt.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all hover:scale-101 ${
                    isSelected 
                      ? 'border-indigo-500 bg-indigo-500/10' 
                      : 'border-slate-200/10 hover:bg-slate-200/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`h-4.5 w-4.5 rounded-full ${opt.color} border border-slate-200/20 shrink-0`} />
                    <span className="text-xs font-semibold truncate leading-none">{opt.label}</span>
                  </div>
                  {isSelected && (
                    <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Preferences Toggle card */}
        <div className={`${styles.card} p-5`}>
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-4.5 w-4.5 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Sound & Notification Settings</h3>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold">Push Alerts</h4>
                <p className="text-[10px] text-slate-400">Receive system alerts for incoming calls or direct text feeds.</p>
              </div>
              <button 
                onClick={() => setNotifsEnabled(!notifsEnabled)}
                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 outline-none ${
                  notifsEnabled ? 'bg-indigo-500' : 'bg-slate-200/20'
                }`}
              >
                <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform duration-200 transform ${
                  notifsEnabled ? 'translate-x-4.5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200/5 pt-3.5">
              <div>
                <h4 className="text-xs font-semibold">Message Ring tones</h4>
                <p className="text-[10px] text-slate-400">Play acoustic chime prompts for inbound messages.</p>
              </div>
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 outline-none ${
                  soundEnabled ? 'bg-indigo-500' : 'bg-slate-200/20'
                }`}
              >
                <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform duration-200 transform ${
                  soundEnabled ? 'translate-x-4.5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200/5 pt-3.5">
              <div>
                <h4 className="text-xs font-semibold">In-Chat Read Indicators</h4>
                <p className="text-[10px] text-slate-400">Allow peer users to confirm when you read message threads.</p>
              </div>
              <button 
                onClick={() => setReadReceipts(!readReceipts)}
                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 outline-none ${
                  readReceipts ? 'bg-indigo-500' : 'bg-slate-200/20'
                }`}
              >
                <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform duration-200 transform ${
                  readReceipts ? 'translate-x-4.5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Database Clear Cache card */}
        <div className={`${styles.card} p-5`}>
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-4.5 w-4.5 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Data Logging Cache</h3>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="max-w-sm">
              <h4 className="text-xs font-semibold">Flush Client-Side Cache</h4>
              <p className="text-[10px] text-slate-400">Completely flush localized databases, message history backups, and connection headers.</p>
            </div>
            
            <button
              onClick={handleClear}
              className={`px-4 py-2.5 rounded-xl font-semibold text-xs border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0`}
            >
              {cleared ? 'Cache Flushed!' : 'Wipe Cache Logs'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
