import React, { useState } from 'react';
import { Info, HelpCircle, ShieldAlert, FileText, Mail, ArrowUpRight } from 'lucide-react';
import { Theme } from '../types';
import { themeStyles } from './ThemeWrapper';

interface InfoPanelProps {
  theme: Theme;
}

type Tab = 'about' | 'help' | 'privacy' | 'terms' | 'contact';

export const InfoPanel: React.FC<InfoPanelProps> = ({ theme }) => {
  const styles = themeStyles[theme] || themeStyles.classic;
  const [activeTab, setActiveTab] = useState<Tab>('about');

  const menuItems = [
    { id: 'about' as Tab, label: 'About ChatterBox', icon: Info },
    { id: 'help' as Tab, label: 'Help & Guides', icon: HelpCircle },
    { id: 'privacy' as Tab, label: 'Privacy Policy', icon: ShieldAlert },
    { id: 'terms' as Tab, label: 'Terms of Use', icon: FileText },
    { id: 'contact' as Tab, label: 'Contact Us', icon: Mail }
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
      {/* Left Menu Navigation Strip */}
      <div className="w-full md:w-56 p-4 shrink-0 bg-slate-500/5 border-r border-slate-200/10 flex flex-col gap-1.5 h-auto md:h-full">
        <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-2 px-2">Documentation</span>
        {menuItems.map((item) => {
          const ItemIcon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs font-semibold transition-all ${
                isActive 
                  ? 'bg-indigo-500/10 border-l-2 border-indigo-500 text-indigo-400' 
                  : 'hover:bg-slate-200/5 text-slate-400 hover:text-slate-300'
              }`}
            >
              <ItemIcon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right Content Space */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 max-w-3xl">
        {activeTab === 'about' && (
          <div className="space-y-4">
            <h2 className="text-xl font-display font-bold">About ChatterBox</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              ChatterBox is a modern, high-fidelity real-time workspace designed for visual developers and engineers. Leveraging high-performance Express middleware and raw HTML5 WebSockets, ChatterBox coordinates instant peer-to-peer message synchronization, typing updates, and calling indicators with zero overhead.
            </p>
            <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 grid grid-cols-2 gap-4 mt-6">
              <div>
                <span className="text-xs font-bold text-indigo-400 block">Core Architecture</span>
                <span className="text-[10px] text-slate-400 mt-1 block">React, Vite, Express, WebSockets, Tailwind v4, Motion</span>
              </div>
              <div>
                <span className="text-xs font-bold text-indigo-400 block">AI Synthesis Layer</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Google Gemini API integration (gemini-3.5-flash)</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'help' && (
          <div className="space-y-4">
            <h2 className="text-xl font-display font-bold">Help & Guides</h2>
            <div className="space-y-3 mt-4">
              <div className="p-3.5 rounded-xl bg-slate-500/5 border border-slate-200/10">
                <h3 className="text-xs font-semibold">1. How do I test real-time chat?</h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Simply open your application's Development App URL in **two separate browser tabs** or window panes. Log into each tab with a separate demo contact (e.g. Alice Vance in Tab 1, Bob Miller in Tab 2). Direct messages and typing updates will synchronize instantly!
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-500/5 border border-slate-200/10">
                <h3 className="text-xs font-semibold">2. How do I activate Gemini Assistant?</h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Select the **AI Chat** tab in the sidebar navigation or ping the recipient "Gemini Assistant". If you have defined your `GEMINI_API_KEY` in Google AI Studio secrets, ChatterBox will stream real-time replies server-side.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-500/5 border border-slate-200/10">
                <h3 className="text-xs font-semibold">3. How do file attachments work?</h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  You can drag and drop any file directly into the active **Chat Window** or click the attachment icon. Files are processed locally as encoded streams and synced safely with other clients.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-4">
            <h2 className="text-xl font-display font-bold">Privacy Policy</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              We take security and user trust seriously. ChatterBox is designed to keep sensitive API keys hidden strictly server-side:
            </p>
            <ul className="list-disc list-inside text-xs text-slate-400 space-y-2 mt-2 leading-relaxed">
              <li>All chat messages and group definitions reside solely in-memory within the sandboxed container workspace.</li>
              <li>Secret integrations, specifically your **GEMINI_API_KEY**, are proxy-routed server-side and never exposed to browser inspection consoles.</li>
              <li>Camera and microphone media stream handles are captured locally via standard navigator APIs and are kept sandboxed.</li>
            </ul>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="space-y-4">
            <h2 className="text-xl font-display font-bold">Terms of Use</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              By accessing ChatterBox, you acknowledge and agree to the following conditions:
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              This applet is designed as an educational, offline-resilient sandbox prototype. You are free to export this workspace to zip formats, integrate real databases, deploy custom server channels, and hook up external routing platforms.
            </p>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="space-y-4">
            <h2 className="text-xl font-display font-bold">Contact Support</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Have suggestions or need clarification regarding the socket protocols or layout structures? Reach out to our engineering channels:
            </p>
            <div className="space-y-2.5 mt-4">
              <a 
                href="mailto:support@chatterbox.app" 
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-500/5 border border-slate-200/10 hover:bg-slate-200/5 transition-all text-xs"
              >
                <div className="flex items-center gap-3">
                  <Mail className="h-4.5 w-4.5 text-indigo-400" />
                  <span className="font-semibold">support@chatterbox.app</span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
