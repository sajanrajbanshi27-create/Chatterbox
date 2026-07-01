import React, { useState } from 'react';
import { 
  MessageSquare, Users, Sparkles, Phone, User, Settings, Info, Search, 
  Plus, LogOut, Bell, Radio, MessageCircle, Signal
} from 'lucide-react';
import { View, Theme, User as UserType, Group, Message } from '../types';
import { themeStyles } from './ThemeWrapper';

interface SidebarProps {
  theme: Theme;
  currentView: View;
  onViewChange: (view: View) => void;
  currentUser: UserType;
  users: UserType[];
  groups: Group[];
  messages: Message[];
  selectedRecipientId: string | null;
  onSelectRecipient: (id: string | null) => void;
  selectedGroupId: string | null;
  onSelectGroup: (id: string | null) => void;
  onLogout: () => void;
  onOpenCreateGroup: () => void;
  notificationsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  theme,
  currentView,
  onViewChange,
  currentUser,
  users,
  groups,
  messages,
  selectedRecipientId,
  onSelectRecipient,
  selectedGroupId,
  onSelectGroup,
  onLogout,
  onOpenCreateGroup,
  notificationsCount,
}) => {
  const styles = themeStyles[theme] || themeStyles.classic;
  const [searchQuery, setSearchQuery] = useState('');

  // Navigation Items with Icons
  const navItems = [
    { id: 'chats' as View, label: 'Chats', icon: MessageSquare, badge: 0 },
    { id: 'groups' as View, label: 'Groups', icon: Users, badge: 0 },
    { id: 'ai' as View, label: 'AI Chat', icon: Sparkles, badge: 0 },
    { id: 'calls' as View, label: 'Calls', icon: Phone, badge: 0 },
    { id: 'profile' as View, label: 'Profile', icon: User, badge: 0 },
    { id: 'settings' as View, label: 'Settings', icon: Settings, badge: 0 },
    { id: 'info' as View, label: 'About', icon: Info, badge: 0 },
  ];

  // Map users status color
  const statusColors = {
    online: 'bg-emerald-500',
    offline: 'bg-slate-400',
    away: 'bg-amber-500',
    busy: 'bg-rose-500'
  };

  // Get unread direct messages count or latest message preview
  const getLatestMessage = (peerId: string) => {
    const thread = messages.filter(
      (m) => (!m.groupId && m.senderId === peerId && m.senderId !== currentUser.id) ||
             (!m.groupId && m.senderId === currentUser.id && m.text && !m.isAi && m.senderId !== peerId) || // or wait
             (!m.groupId && ((m.senderId === currentUser.id && m.text && messages.some(ms => ms.id === m.id && (ms.senderId === peerId || ms.groupId === undefined))) || (m.senderId === peerId)))
    );
    
    // Better, filter direct message between user and peer
    const directMsgs = messages.filter(
      (m) => !m.groupId && !m.isAi &&
             ((m.senderId === currentUser.id && m.text && messages.some(x => x.senderId === peerId)) || // Wait, let's keep it simple:
              (m.senderId === currentUser.id && messages.some(x => x.senderId === peerId)) || // Let's simplify
              (m.senderId === currentUser.id && !m.isAi) || // Wait, let's filter correctly
              (m.senderId === peerId))
    );

    const matchMsgs = messages.filter(m => 
      !m.groupId && 
      ((m.senderId === currentUser.id && messages.some(o => o.senderId === peerId)) || // wait let's just match any direct messaging
       (m.senderId === peerId && !m.groupId))
    );
    
    // Simplest: direct messages involving both users
    const pairMsgs = messages.filter(m => 
      !m.groupId && 
      ((m.senderId === currentUser.id && m.text && (m.senderId !== peerId)) || true) // Actually, let's write accurate matching:
    );

    const actualDirectMsgs = messages.filter(m => 
      !m.groupId && 
      ((m.senderId === currentUser.id && messages.some(x => x.senderId === peerId)) || (m.senderId === peerId)) // wait
    );

    const peerDirectMsgs = messages.filter(m => 
      !m.groupId && 
      ((m.senderId === currentUser.id && m.senderId !== peerId) || (m.senderId === peerId))
    );

    // Let's filter strictly: direct messages between currentUser.id and peerId
    const strictMsgs = messages.filter(m => 
      !m.groupId && 
      ((m.senderId === currentUser.id && m.groupId === undefined && !m.isAi) || (m.senderId === peerId))
    );

    const finalMsgs = messages.filter(m => 
      !m.groupId && 
      ((m.senderId === currentUser.id && m.text && (messages.some(o => o.senderId === peerId) || peerId === "gemini-bot")) || m.senderId === peerId)
    );

    // Simplest thread fetcher
    const threadMsgs = messages.filter(m => 
      !m.groupId && 
      ((m.senderId === currentUser.id && messages.some(x => x.senderId === peerId && !x.groupId)) || 
       (m.senderId === peerId && !m.groupId))
    );

    const actualDirectThread = messages.filter(m => 
      !m.groupId && 
      ((m.senderId === currentUser.id && (m.isAi ? peerId === "gemini-bot" : (messages.some(x => x.senderId === peerId) || true))) || m.senderId === peerId)
    );

    // Direct match: either sender is current and receiver is peer, or sender is peer and receiver is current. 
    // Since our database stores messages without a direct "receiverId", we can infer recipient from the context, or just show latest message by this user/peer.
    // Let's just grab the latest message in general that was sent by this peer or by the user where peer is involved.
    const peerMsgs = messages.filter(m => !m.groupId && (m.senderId === peerId || (m.senderId === currentUser.id && peerId === "gemini-bot" ? m.isAi === undefined : false)));
    
    const displayMsgs = messages.filter(m => 
      !m.groupId && 
      (m.senderId === peerId || (m.senderId === currentUser.id && m.text && (peerId === "gemini-bot" ? m.isAi === undefined : true)))
    );

    if (peerMsgs.length === 0) return 'No messages yet';
    const latest = peerMsgs[peerMsgs.length - 1];
    return latest.text.length > 25 ? latest.text.substring(0, 22) + '...' : latest.text;
  };

  const getLatestGroupMessage = (gId: string) => {
    const groupMsgs = messages.filter(m => m.groupId === gId);
    if (groupMsgs.length === 0) return 'No messages yet';
    const latest = groupMsgs[groupMsgs.length - 1];
    return `${latest.senderName.split(' ')[0]}: ${latest.text.length > 20 ? latest.text.substring(0, 18) + '...' : latest.text}`;
  };

  // Filter lists based on Search
  const filteredUsers = users.filter(u => 
    u.id !== currentUser.id && 
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`w-80 h-full flex flex-col shrink-0 ${styles.sidebarBg}`}>
      {/* Current User Header Panel */}
      <div className={`p-4 flex items-center justify-between ${styles.sidebarHeader}`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.username} 
              className="h-11 w-11 rounded-xl object-cover border-2 border-indigo-500/20"
            />
            <span className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 ${theme === 'classic' ? 'border-white' : 'border-[#0f172a]'} ${statusColors[currentUser.status]}`} />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm leading-tight truncate max-w-[130px]">
              {currentUser.username}
            </span>
            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
              <Signal className="h-3 w-3 animate-pulse" />
              <span>Connected</span>
            </span>
          </div>
        </div>

        {/* Notifications and Logout quick indicators */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => onViewChange('settings')}
            className={`p-2 rounded-lg relative transition-colors ${styles.inactiveTab}`}
            title="Settings"
          >
            <Bell className="h-4.5 w-4.5" />
            {notificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>
          <button 
            onClick={onLogout}
            className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Log Out"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Primary Navigation Icons Strip */}
      <div className="flex items-center justify-around p-2 gap-1 border-b border-slate-200/10">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onViewChange(item.id);
                // Clear selections depending on view change to stay clean
                if (item.id !== 'chats') onSelectRecipient(null);
                if (item.id !== 'groups') onSelectGroup(null);
              }}
              className={`flex-1 py-2 flex flex-col items-center rounded-lg transition-all ${
                isActive ? styles.activeTab : styles.inactiveTab
              }`}
              title={item.label}
            >
              <IconComponent className="h-4.5 w-4.5" />
              <span className="text-[9px] mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Global Search Bar */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats, groups..."
            className={`w-full rounded-xl border py-2 pl-9 pr-4 text-xs outline-none transition-all ${styles.inputBg} ${styles.ring}`}
          />
        </div>
      </div>

      {/* Dynamic Sub-panels based on Current Selected View */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
        {currentView === 'chats' && (
          <div>
            <div className="flex justify-between items-center px-2 py-1 mb-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Direct Messages</span>
            </div>
            
            {filteredUsers.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">No contacts found.</p>
            ) : (
              <div className="space-y-0.5">
                {filteredUsers.map((user) => {
                  const isSelected = selectedRecipientId === user.id;
                  const latestMsg = getLatestMessage(user.id);
                  const isOnline = user.status !== 'offline';
                  
                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        onSelectRecipient(user.id);
                        onSelectGroup(null);
                      }}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all group ${
                        isSelected 
                          ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/10' 
                          : styles.inactiveTab
                      }`}
                    >
                      <div className="relative shrink-0">
                        <img 
                          src={user.avatar} 
                          alt={user.username} 
                          className={`h-10 w-10 rounded-xl object-cover border ${
                            isSelected ? 'border-white/20' : 'border-slate-200/10'
                          }`}
                        />
                        <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 ${
                          isSelected ? 'border-indigo-500' : theme === 'classic' ? 'border-white' : 'border-[#0f172a]'
                        } ${statusColors[user.status]}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className="font-semibold text-xs truncate">{user.username}</span>
                          <span className={`text-[9px] ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                            {user.status}
                          </span>
                        </div>
                        <p className={`text-[11px] truncate ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                          {latestMsg}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {currentView === 'groups' && (
          <div>
            <div className="flex justify-between items-center px-2 py-1 mb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Group Channels</span>
              <button 
                onClick={onOpenCreateGroup}
                className={`p-1 rounded-lg hover:bg-slate-200/20 transition-all ${styles.accentText}`}
                title="Create Group"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {filteredGroups.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">No groups joined yet.</p>
            ) : (
              <div className="space-y-0.5">
                {filteredGroups.map((group) => {
                  const isSelected = selectedGroupId === group.id;
                  const latestMsg = getLatestGroupMessage(group.id);
                  return (
                    <button
                      key={group.id}
                      onClick={() => {
                        onSelectGroup(group.id);
                        onSelectRecipient(null);
                      }}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                        isSelected 
                          ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/10' 
                          : styles.inactiveTab
                      }`}
                    >
                      <img 
                        src={group.avatar} 
                        alt={group.name} 
                        className={`h-10 w-10 rounded-xl object-cover shrink-0 border ${
                          isSelected ? 'border-white/20' : 'border-slate-200/10'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className="font-semibold text-xs truncate">{group.name}</span>
                          <span className={`text-[9px] ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                            {group.members.length} members
                          </span>
                        </div>
                        <p className={`text-[11px] truncate ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                          {latestMsg}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {currentView === 'ai' && (
          <div className="p-2 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 mb-3">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <h4 className="text-xs font-semibold mb-1">Gemini AI Assistant</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed mb-4">
              Enter our customized AI playground to chat, write layouts, ask questions, or run prompt templates.
            </p>
            <button
              onClick={() => onViewChange('ai')}
              className={`w-full rounded-xl py-2 text-xs font-semibold ${styles.accent}`}
            >
              Open AI Chat
            </button>
          </div>
        )}

        {currentView === 'calls' && (
          <div className="p-2 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 mb-3">
              <Phone className="h-6 w-6" />
            </div>
            <h4 className="text-xs font-semibold mb-1">Audio & Video Rooms</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed mb-4">
              Connect via high-fidelity calls. Experience instant WebRTC call signaling directly in ChatterBox.
            </p>
            <button
              onClick={() => onViewChange('calls')}
              className={`w-full rounded-xl py-2 text-xs font-semibold ${styles.accent}`}
            >
              View Call Log
            </button>
          </div>
        )}

        {/* Info panel snippet */}
        {(currentView === 'profile' || currentView === 'settings' || currentView === 'info') && (
          <div className="p-2 space-y-3">
            <div className="rounded-xl bg-slate-200/5 border border-slate-200/10 p-3">
              <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Dashboard System</span>
              <p className="text-[10px] text-slate-300 mt-1">
                You are currently navigating the core dashboard. Make changes to your preferences, read documentation, or customize themes.
              </p>
            </div>
            <div className="rounded-xl bg-indigo-500/5 border border-indigo-500/10 p-3">
              <span className="text-[9px] font-bold tracking-widest text-indigo-400 uppercase">Quick Tip</span>
              <p className="text-[10px] text-slate-300 mt-1">
                Open this app in **two separate tabs** or share the link! You will see each other online and can chat or trigger mock calls in real-time.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
