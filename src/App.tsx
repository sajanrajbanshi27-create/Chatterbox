import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, Sparkles, Phone, Users, User, Settings, Info, 
  Menu, X, Bell, Heart, Loader2, Signal, SignalHigh
} from 'lucide-react';

import { Theme, View, User as UserType, Group, Message, Call, Notification, Attachment } from './types';
import { ThemeWrapper } from './components/ThemeWrapper';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { GroupsPanel } from './components/GroupsPanel';
import { AIChatPanel } from './components/AIChatPanel';
import { CallsPanel } from './components/CallsPanel';
import { ProfilePanel } from './components/ProfilePanel';
import { SettingsPanel } from './components/SettingsPanel';
import { InfoPanel } from './components/InfoPanel';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(() => {
    const cached = localStorage.getItem('chatterbox_user');
    return cached ? JSON.parse(cached) : null;
  });

  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('chatterbox_theme') as Theme) || 'classic';
  });

  // Sidebar controls
  const [currentView, setCurrentView] = useState<View>('chats');
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // App Sync State
  const [users, setUsers] = useState<UserType[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [typingPeers, setTypingPeers] = useState<{ [key: string]: boolean }>({});

  // Modals & Socket Ref
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync cached theme
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('chatterbox_theme', newTheme);
  };

  // Login handler
  const handleLogin = (userData: { id: string; username: string; email: string; avatar: string }) => {
    const userObj: UserType = {
      ...userData,
      status: 'online',
      bio: 'New ChatterBox explorer! Ready to connect.'
    };
    setCurrentUser(userObj);
    localStorage.setItem('chatterbox_user', JSON.stringify(userObj));
  };

  const handleLogout = () => {
    if (socketRef.current) socketRef.current.close();
    setCurrentUser(null);
    setUsers([]);
    setGroups([]);
    setMessages([]);
    setCalls([]);
    setActiveCall(null);
    setNotifications([]);
    localStorage.removeItem('chatterbox_user');
  };

  // --- WebSocket Setup ---
  useEffect(() => {
    if (!currentUser) {
      if (socketRef.current) socketRef.current.close();
      return;
    }

    const connectSocket = () => {
      setConnectionStatus('connecting');
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const socketUrl = `${wsProtocol}//${window.location.host}/ws`;

      console.log("Attempting WebSocket handshake at:", socketUrl);
      const ws = new WebSocket(socketUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected.");
        setConnectionStatus('connected');
        
        // Log in this user on the server
        ws.send(JSON.stringify({
          type: 'auth:login',
          payload: currentUser
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { type, payload } = data;

          switch (type) {
            case 'sync:initial': {
              const { users: sUsers, groups: sGroups, messages: sMessages, calls: sCalls, notifications: sNotifs } = payload;
              setUsers(sUsers);
              setGroups(sGroups);
              setMessages(sMessages);
              setCalls(sCalls);
              setNotifications(sNotifs);
              break;
            }

            case 'presence:update': {
              const { userId, status } = payload;
              setUsers((prev) => 
                prev.map(u => u.id === userId ? { ...u, status } : u)
              );
              break;
            }

            case 'profile:updated': {
              const { user: updatedUser } = payload;
              setUsers((prev) => 
                prev.map(u => u.id === updatedUser.id ? updatedUser : u)
              );
              if (updatedUser.id === currentUser.id) {
                setCurrentUser(updatedUser);
                localStorage.setItem('chatterbox_user', JSON.stringify(updatedUser));
              }
              break;
            }

            case 'message:received': {
              const message = payload as Message;
              setMessages((prev) => {
                // Prevent duplicate message appendages
                if (prev.some(m => m.id === message.id)) return prev;
                return [...prev, message];
              });

              // Push notifications if chat is currently closed or in another thread
              const activeDirect = selectedRecipientId === message.senderId;
              const activeGroup = selectedGroupId === message.groupId;
              const isMine = message.senderId === currentUser.id;

              if (!isMine && !activeDirect && !activeGroup) {
                const newNotif: Notification = {
                  id: `notif-${Date.now()}`,
                  title: message.groupId ? 'New Group Message' : `Message from ${message.senderName}`,
                  body: message.text.length > 40 ? message.text.substring(0, 37) + '...' : message.text,
                  type: 'message',
                  timestamp: new Date().toISOString(),
                  read: false
                };
                setNotifications((prev) => [newNotif, ...prev]);
                
                // Play notification sound
                try {
                  const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2357/2357-84.wav');
                  audio.volume = 0.2;
                  audio.play();
                } catch (err) {
                  // Ignore audio-playback blocks
                }
              }
              break;
            }

            case 'typing:update': {
              const { isTyping, senderId } = payload;
              setTypingPeers((prev) => ({
                ...prev,
                [senderId]: isTyping
              }));
              break;
            }

            case 'group:created': {
              const newGroup = payload as Group;
              setGroups((prev) => {
                if (prev.some(g => g.id === newGroup.id)) return prev;
                return [...prev, newGroup];
              });
              break;
            }

            // --- Call Signaling Responses ---
            case 'call:incoming': {
              const incomingCall = payload as Call;
              setActiveCall(incomingCall);
              
              // Play ringing sound
              try {
                const ringAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/1359/1359-84.wav');
                ringAudio.loop = true;
                ringAudio.play();
                (window as any)._activeRingAudio = ringAudio;
              } catch (err) {}
              break;
            }

            case 'call:ringing': {
              const ringingCall = payload as Call;
              setActiveCall(ringingCall);
              break;
            }

            case 'call:connected': {
              const connectedCall = payload as Call;
              setActiveCall(connectedCall);
              stopRingAudio();
              break;
            }

            case 'call:rejected': {
              setActiveCall(null);
              stopRingAudio();
              break;
            }

            case 'call:ended': {
              const endedCall = payload as Call;
              setCalls((prev) => [endedCall, ...prev]);
              setActiveCall(null);
              stopRingAudio();
              break;
            }
          }
        } catch (e) {
          console.error("WS Parse message error:", e);
        }
      };

      ws.onclose = () => {
        console.warn("WebSocket channel closed. Retrying connection in 3 seconds...");
        setConnectionStatus('disconnected');
        reconnectTimeoutRef.current = setTimeout(connectSocket, 3000);
      };

      ws.onerror = (e) => {
        console.error("WS general channel error:", e);
        ws.close();
      };
    };

    connectSocket();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [currentUser?.id]);

  const stopRingAudio = () => {
    try {
      if ((window as any)._activeRingAudio) {
        (window as any)._activeRingAudio.pause();
        (window as any)._activeRingAudio = null;
      }
    } catch (e) {}
  };

  // --- WebSocket Send Functions ---
  const handleSendMessage = (text: string, attachment?: Attachment) => {
    if (!socketRef.current || connectionStatus !== 'connected') return;

    socketRef.current.send(JSON.stringify({
      type: 'message:send',
      payload: {
        text,
        groupId: selectedGroupId || undefined,
        recipientId: selectedRecipientId || undefined,
        attachment
      }
    }));
  };

  const handleTypingStatus = (isTyping: boolean) => {
    if (!socketRef.current || connectionStatus !== 'connected') return;

    socketRef.current.send(JSON.stringify({
      type: 'typing:status',
      payload: {
        isTyping,
        recipientId: selectedRecipientId || undefined,
        groupId: selectedGroupId || undefined
      }
    }));
  };

  const handleCreateGroupSubmit = (name: string, description: string, avatar: string, members: string[]) => {
    if (!socketRef.current || connectionStatus !== 'connected') return;

    socketRef.current.send(JSON.stringify({
      type: 'group:create',
      payload: { name, description, avatar, members }
    }));
  };

  const handleInitiateCall = (receiverId: string, type: 'audio' | 'video') => {
    if (!socketRef.current || connectionStatus !== 'connected') return;

    socketRef.current.send(JSON.stringify({
      type: 'call:initiate',
      payload: { receiverId, type }
    }));
    setCurrentView('calls');
  };

  const handleAcceptCall = (callId: string) => {
    if (!socketRef.current || connectionStatus !== 'connected') return;
    socketRef.current.send(JSON.stringify({
      type: 'call:accept',
      payload: { callId }
    }));
  };

  const handleRejectCall = (callId: string) => {
    if (!socketRef.current || connectionStatus !== 'connected') return;
    socketRef.current.send(JSON.stringify({
      type: 'call:reject',
      payload: { callId }
    }));
  };

  const handleEndCall = (callId: string, duration: number) => {
    if (!socketRef.current || connectionStatus !== 'connected') return;
    socketRef.current.send(JSON.stringify({
      type: 'call:end',
      payload: { callId, duration }
    }));
  };

  const handleUpdateProfile = (profileData: { username: string; bio: string; avatar: string; status: 'online' | 'offline' | 'away' | 'busy' }) => {
    if (!socketRef.current || connectionStatus !== 'connected') return;
    socketRef.current.send(JSON.stringify({
      type: 'profile:update',
      payload: profileData
    }));
  };

  const handleClearLocalLogs = () => {
    setMessages([]);
    setNotifications([]);
    setCalls([]);
  };

  // Get active selected peer
  const activeRecipient = users.find(u => u.id === selectedRecipientId) || null;
  const activeGroup = groups.find(g => g.id === selectedGroupId) || null;

  if (!currentUser) {
    return (
      <ThemeWrapper theme={theme}>
        <AuthScreen theme={theme} onLogin={handleLogin} />
      </ThemeWrapper>
    );
  }

  return (
    <ThemeWrapper theme={theme}>
      <div className="flex h-screen w-full overflow-hidden relative">
        {/* Toggle Mobile Drawer Controls */}
        <div className="absolute top-4 left-4 z-30 md:hidden">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-lg"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Real-time Connection Quality indicator */}
        <div className="absolute top-4 right-4 z-30 pointer-events-none hidden md:flex items-center gap-1.5 bg-black/40 border border-white/5 backdrop-blur-xs rounded-xl py-1.5 px-3">
          {connectionStatus === 'connected' ? (
            <>
              <SignalHigh className="h-4 w-4 text-emerald-400" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">WS Connected</span>
            </>
          ) : connectionStatus === 'connecting' ? (
            <>
              <Loader2 className="h-4 w-4 text-amber-400 animate-spin" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">Connecting...</span>
            </>
          ) : (
            <>
              <Signal className="h-4 w-4 text-rose-400 animate-pulse" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400">Disconnected</span>
            </>
          )}
        </div>

        {/* Sidebar Left panel */}
        <div className={`h-full absolute md:relative z-20 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
          <Sidebar 
            theme={theme}
            currentView={currentView}
            onViewChange={(view) => {
              setCurrentView(view);
              setSidebarOpen(false); // Close on mobile navigation
            }}
            currentUser={currentUser}
            users={users}
            groups={groups}
            messages={messages}
            selectedRecipientId={selectedRecipientId}
            onSelectRecipient={(id) => {
              setSelectedRecipientId(id);
              setSelectedGroupId(null);
              setCurrentView('chats');
              setSidebarOpen(false);
            }}
            selectedGroupId={selectedGroupId}
            onSelectGroup={(id) => {
              setSelectedGroupId(id);
              setSelectedRecipientId(null);
              setCurrentView('groups');
              setSidebarOpen(false);
            }}
            onLogout={handleLogout}
            onOpenCreateGroup={() => setCreateGroupOpen(true)}
            notificationsCount={notifications.filter(n => !n.read).length}
          />
        </div>

        {/* Central main content panel */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          <AnimatePresence mode="wait">
            {currentView === 'chats' && (
              <motion.div 
                key="chats"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="h-full flex-1"
              >
                <ChatWindow 
                  theme={theme}
                  currentUser={currentUser}
                  recipient={activeRecipient}
                  group={null}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  typingPeers={typingPeers}
                  onTypingStatus={handleTypingStatus}
                  onInitiateCall={handleInitiateCall}
                  onClose={() => setSelectedRecipientId(null)}
                />
              </motion.div>
            )}

            {currentView === 'groups' && (
              <motion.div 
                key="groups"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="h-full flex-1"
              >
                <ChatWindow 
                  theme={theme}
                  currentUser={currentUser}
                  recipient={null}
                  group={activeGroup}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  typingPeers={typingPeers}
                  onTypingStatus={handleTypingStatus}
                  onInitiateCall={handleInitiateCall}
                  onClose={() => setSelectedGroupId(null)}
                />
              </motion.div>
            )}

            {currentView === 'ai' && (
              <motion.div 
                key="ai"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full flex-1"
              >
                <AIChatPanel theme={theme} currentUser={currentUser} />
              </motion.div>
            )}

            {currentView === 'calls' && (
              <motion.div 
                key="calls"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full flex-1"
              >
                <CallsPanel 
                  theme={theme}
                  calls={calls}
                  activeCall={activeCall}
                  currentUser={currentUser}
                  users={users}
                  onAcceptCall={handleAcceptCall}
                  onRejectCall={handleRejectCall}
                  onEndCall={handleEndCall}
                  onInitiateCall={handleInitiateCall}
                />
              </motion.div>
            )}

            {currentView === 'profile' && (
              <motion.div 
                key="profile"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="h-full flex-1"
              >
                <ProfilePanel 
                  theme={theme} 
                  currentUser={currentUser} 
                  onUpdateProfile={handleUpdateProfile} 
                />
              </motion.div>
            )}

            {currentView === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="h-full flex-1"
              >
                <SettingsPanel 
                  theme={theme} 
                  onThemeChange={handleThemeChange} 
                  onClearHistory={handleClearLocalLogs} 
                />
              </motion.div>
            )}

            {currentView === 'info' && (
              <motion.div 
                key="info"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="h-full flex-1"
              >
                <InfoPanel theme={theme} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Assemble Group modal drawer */}
        <AnimatePresence>
          {createGroupOpen && (
            <GroupsPanel 
              theme={theme}
              users={users}
              currentUser={currentUser}
              onClose={() => setCreateGroupOpen(false)}
              onCreateGroup={handleCreateGroupSubmit}
            />
          )}
        </AnimatePresence>

        {/* Global call signaling incoming notification alerts banner */}
        <AnimatePresence>
          {activeCall && activeCall.status === 'ringing' && activeCall.callerId !== currentUser.id && (
            <motion.div 
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 bg-indigo-950/95 text-white border border-indigo-500/30 shadow-2xl p-4 rounded-2xl flex items-center gap-4 backdrop-blur-md max-w-sm w-11/12"
            >
              <img 
                src={users.find(u => u.id === activeCall.callerId)?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"} 
                alt="caller" 
                className="h-10 w-10 rounded-full object-cover shrink-0 border border-indigo-500/30"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-indigo-400">Incoming Feed</p>
                <p className="font-semibold text-xs truncate leading-snug">{activeCall.callerName}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Wants to start an {activeCall.type} call</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button 
                  onClick={() => handleRejectCall(activeCall.id)}
                  className="p-2.5 bg-rose-600 rounded-full text-white hover:bg-rose-700 transition-colors shadow-md"
                  title="Decline"
                >
                  <X className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => {
                    handleAcceptCall(activeCall.id);
                    setCurrentView('calls');
                  }}
                  className="p-2.5 bg-emerald-600 rounded-full text-white hover:bg-emerald-700 transition-colors shadow-md animate-bounce"
                  title="Accept"
                >
                  <Phone className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ThemeWrapper>
  );
}
