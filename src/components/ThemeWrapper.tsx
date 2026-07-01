import React from 'react';
import { Theme } from '../types';

interface ThemeWrapperProps {
  theme: Theme;
  children: React.ReactNode;
}

export const themeStyles = {
  classic: {
    bg: 'bg-slate-50 text-slate-800',
    sidebarBg: 'bg-white border-r border-slate-200/80',
    sidebarHeader: 'bg-slate-50 border-b border-slate-200/80',
    activeTab: 'bg-indigo-50 text-indigo-600 font-medium',
    inactiveTab: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    card: 'bg-white border border-slate-200 shadow-xs rounded-2xl',
    header: 'bg-white border-b border-slate-200/80',
    accent: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    accentText: 'text-indigo-600',
    chatBubbleSelf: 'bg-indigo-600 text-white rounded-2xl rounded-tr-none',
    chatBubblePeer: 'bg-slate-100 text-slate-800 rounded-2xl rounded-tl-none',
    secondaryBtn: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    inputBg: 'bg-slate-100 border-slate-200 focus:bg-white',
    ring: 'focus:ring-indigo-500/20 focus:border-indigo-500',
    badge: 'bg-indigo-100 text-indigo-700',
    textMuted: 'text-slate-500 text-xs',
  },
  twilight: {
    bg: 'bg-[#0b0f19] text-[#e2e8f0]',
    sidebarBg: 'bg-[#0f172a] border-r border-[#1e293b]',
    sidebarHeader: 'bg-[#0b0f19] border-b border-[#1e293b]',
    activeTab: 'bg-indigo-950/50 text-indigo-400 font-medium border-l-2 border-indigo-500',
    inactiveTab: 'text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#e2e8f0]',
    card: 'bg-[#0f172a] border border-[#1e293b] shadow-md rounded-2xl',
    header: 'bg-[#0f172a] border-b border-[#1e293b]',
    accent: 'bg-indigo-500 hover:bg-indigo-600 text-white',
    accentText: 'text-indigo-400',
    chatBubbleSelf: 'bg-indigo-500 text-white rounded-2xl rounded-tr-none',
    chatBubblePeer: 'bg-[#1e293b] text-[#e2e8f0] rounded-2xl rounded-tl-none',
    secondaryBtn: 'bg-[#1e293b] hover:bg-[#334155] text-[#e2e8f0]',
    inputBg: 'bg-[#1e293b] border-[#334155] focus:bg-[#0f172a]',
    ring: 'focus:ring-indigo-500/30 focus:border-indigo-500',
    badge: 'bg-indigo-950 text-indigo-300',
    textMuted: 'text-[#64748b] text-xs',
  },
  sunset: {
    bg: 'bg-[#120a0a] text-[#f4eae8]',
    sidebarBg: 'bg-[#1a0f0f] border-r border-[#2d1a1a]',
    sidebarHeader: 'bg-[#120a0a] border-b border-[#2d1a1a]',
    activeTab: 'bg-rose-950/40 text-rose-400 font-medium border-l-2 border-rose-500',
    inactiveTab: 'text-[#b29e9d] hover:bg-[#2d1a1a] hover:text-[#f4eae8]',
    card: 'bg-[#1a0f0f] border border-[#2d1a1a] shadow-md rounded-2xl',
    header: 'bg-[#1a0f0f] border-b border-[#2d1a1a]',
    accent: 'bg-rose-500 hover:bg-rose-600 text-white',
    accentText: 'text-rose-400',
    chatBubbleSelf: 'bg-rose-600 text-white rounded-2xl rounded-tr-none',
    chatBubblePeer: 'bg-[#2d1a1a] text-[#f4eae8] rounded-2xl rounded-tl-none',
    secondaryBtn: 'bg-[#2d1a1a] hover:bg-[#422828] text-[#f4eae8]',
    inputBg: 'bg-[#2d1a1a] border-[#422828] focus:bg-[#1a0f0f]',
    ring: 'focus:ring-rose-500/30 focus:border-rose-500',
    badge: 'bg-rose-950 text-rose-300',
    textMuted: 'text-[#8c7473] text-xs',
  },
  emerald: {
    bg: 'bg-[#022c22] text-[#e6f4f1]',
    sidebarBg: 'bg-[#064e3b] border-r border-[#065f46]',
    sidebarHeader: 'bg-[#022c22] border-b border-[#065f46]',
    activeTab: 'bg-[#065f46] text-[#34d399] font-medium border-l-2 border-[#10b981]',
    inactiveTab: 'text-[#a7f3d0] hover:bg-[#065f46] hover:text-white',
    card: 'bg-[#064e3b] border border-[#065f46] shadow-md rounded-2xl',
    header: 'bg-[#064e3b] border-b border-[#065f46]',
    accent: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    accentText: 'text-[#34d399]',
    chatBubbleSelf: 'bg-emerald-600 text-white rounded-2xl rounded-tr-none',
    chatBubblePeer: 'bg-[#065f46] text-[#e6f4f1] rounded-2xl rounded-tl-none',
    secondaryBtn: 'bg-[#065f46] hover:bg-[#047857] text-[#e6f4f1]',
    inputBg: 'bg-[#065f46] border-[#047857] focus:bg-[#064e3b]',
    ring: 'focus:ring-emerald-500/30 focus:border-emerald-500',
    badge: 'bg-[#022c22] text-emerald-300',
    textMuted: 'text-[#a7f3d0]/60 text-xs',
  },
};

export const ThemeWrapper: React.FC<ThemeWrapperProps> = ({ theme, children }) => {
  const styles = themeStyles[theme] || themeStyles.classic;
  
  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ease-in-out ${styles.bg}`}>
      {children}
    </div>
  );
};
