import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, Video, PhoneOff, Mic, MicOff, VideoOff, 
  Volume2, VolumeX, ShieldAlert, Sparkles, MonitorUp, Loader2, Play
} from 'lucide-react';
import { Theme, Call, User } from '../types';
import { themeStyles } from './ThemeWrapper';

interface CallsPanelProps {
  theme: Theme;
  calls: Call[];
  activeCall: Call | null;
  currentUser: User;
  users: User[];
  onAcceptCall: (callId: string) => void;
  onRejectCall: (callId: string) => void;
  onEndCall: (callId: string, duration: number) => void;
  onInitiateCall: (receiverId: string, type: 'audio' | 'video') => void;
}

export const CallsPanel: React.FC<CallsPanelProps> = ({
  theme,
  calls,
  activeCall,
  currentUser,
  users,
  onAcceptCall,
  onRejectCall,
  onEndCall,
  onInitiateCall,
}) => {
  const styles = themeStyles[theme] || themeStyles.classic;
  const [micMuted, setMicMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const [screenShared, setScreenShared] = useState(false);
  
  // Track active call duration counter
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeCall && activeCall.status === 'connected') {
      setDuration(0);
      timer = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeCall?.status]);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPeerDetails = (call: Call) => {
    const isCaller = call.callerId === currentUser.id;
    const peerId = isCaller ? call.receiverId : call.callerId;
    const peer = users.find(u => u.id === peerId);
    return {
      name: isCaller ? call.receiverName : call.callerName,
      avatar: peer?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      status: peer?.status || 'offline',
      bio: peer?.bio || '',
      isCaller
    };
  };

  // List of offline users to call
  const activeContacts = users.filter(u => u.id !== currentUser.id && u.id !== 'gemini-bot');

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
      {/* Active Call UI Screens overlay */}
      <AnimatePresence>
        {activeCall && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="absolute inset-0 bg-[#070a13] z-40 flex flex-col justify-between p-6 text-white"
          >
            {/* Call Header */}
            <div className="flex justify-between items-center z-10">
              <div className="flex items-center gap-2.5 bg-black/40 rounded-xl p-2 border border-white/5">
                <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 leading-none">
                  {activeCall.status === 'connected' ? 'Connected Rooms' : 'Connecting Signaling...'}
                </span>
              </div>
              <span className="text-xs font-mono bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                {activeCall.status === 'connected' ? formatDuration(duration) : 'Ringing...'}
              </span>
            </div>

            {/* Call Center Layout: Avatars & Visualizers */}
            <div className="flex-1 flex flex-col items-center justify-center relative">
              {activeCall.type === 'video' && activeCall.status === 'connected' && !videoOff ? (
                // Video Screen representations
                <div className="absolute inset-0 rounded-2xl overflow-hidden bg-slate-900 border border-white/10 flex items-center justify-center">
                  <img 
                    src={getPeerDetails(activeCall).avatar} 
                    alt="video peer"
                    className="h-full w-full object-cover opacity-85"
                  />
                  {/* PiP of self */}
                  <div className="absolute bottom-4 right-4 h-24 w-32 bg-black border border-white/20 rounded-xl overflow-hidden shadow-lg">
                    <img src={currentUser.avatar} alt="self" className="h-full w-full object-cover" />
                  </div>
                  {screenShared && (
                    <div className="absolute inset-0 bg-indigo-900/60 flex flex-col items-center justify-center z-20">
                      <MonitorUp className="h-10 w-10 text-white animate-bounce mb-2" />
                      <span className="text-xs font-bold font-display">Sharing Screen Viewport</span>
                    </div>
                  )}
                </div>
              ) : (
                // Audio Wave Visualizers
                <div className="flex flex-col items-center">
                  <div className="relative mb-6">
                    {/* Ringing waves */}
                    <span className="absolute -inset-4 rounded-full bg-indigo-500/15 animate-ping" />
                    <span className="absolute -inset-8 rounded-full bg-indigo-500/5 animate-ping" style={{ animationDelay: '500ms' }} />
                    
                    <img 
                      src={getPeerDetails(activeCall).avatar} 
                      alt="avatar" 
                      className="h-28 w-28 rounded-full object-cover border-4 border-indigo-500/30 shadow-xl"
                    />
                  </div>
                  <h3 className="text-lg font-display font-bold">{getPeerDetails(activeCall).name}</h3>
                  <p className="text-xs text-slate-400 capitalize mt-1">
                    {activeCall.type === 'video' ? 'Video Conference Room' : 'Direct Audio Feed'}
                  </p>
                  
                  {/* Real Sound Waves mock */}
                  {activeCall.status === 'connected' && (
                    <div className="flex items-center gap-1.5 mt-6 h-6 justify-center">
                      <span className="w-1 bg-indigo-400 rounded-full animate-bounce h-3" style={{ animationDelay: '100ms' }} />
                      <span className="w-1 bg-indigo-400 rounded-full animate-bounce h-6" style={{ animationDelay: '300ms' }} />
                      <span className="w-1 bg-indigo-400 rounded-full animate-bounce h-4" style={{ animationDelay: '500ms' }} />
                      <span className="w-1 bg-indigo-400 rounded-full animate-bounce h-5" style={{ animationDelay: '200ms' }} />
                      <span className="w-1 bg-indigo-400 rounded-full animate-bounce h-2" style={{ animationDelay: '400ms' }} />
                    </div>
                  )}
                </div>
              )}

              {/* Ringing accept/reject pane for receiver */}
              {activeCall.status === 'ringing' && !getPeerDetails(activeCall).isCaller && (
                <div className="absolute bottom-10 bg-black/60 p-4 border border-white/10 rounded-2xl flex flex-col items-center gap-4 text-center backdrop-blur-md max-w-xs z-30">
                  <p className="text-xs text-indigo-300 font-semibold">Incoming Call Signaling...</p>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => onRejectCall(activeCall.id)}
                      className="h-12 w-12 bg-rose-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-rose-700 transition-all"
                    >
                      <PhoneOff className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => onAcceptCall(activeCall.id)}
                      className="h-12 w-12 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-emerald-700 transition-all"
                    >
                      <Phone className="h-5 w-5 animate-pulse" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Call Control Center Panel */}
            <div className="flex justify-center items-center gap-4 z-10 pb-4">
              {/* Controls toggle */}
              <button 
                onClick={() => setMicMuted(!micMuted)}
                className={`h-11 w-11 rounded-xl flex items-center justify-center border transition-all ${
                  micMuted ? 'bg-rose-600 border-rose-600 text-white' : 'bg-white/10 border-white/10 hover:bg-white/20'
                }`}
                title={micMuted ? "Unmute Mic" : "Mute Mic"}
              >
                {micMuted ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
              </button>

              {activeCall.type === 'video' && (
                <>
                  <button 
                    onClick={() => setVideoOff(!videoOff)}
                    className={`h-11 w-11 rounded-xl flex items-center justify-center border transition-all ${
                      videoOff ? 'bg-rose-600 border-rose-600 text-white' : 'bg-white/10 border-white/10 hover:bg-white/20'
                    }`}
                    title={videoOff ? "Start Camera" : "Stop Camera"}
                  >
                    {videoOff ? <VideoOff className="h-4.5 w-4.5" /> : <Video className="h-4.5 w-4.5" />}
                  </button>

                  <button 
                    onClick={() => setScreenShared(!screenShared)}
                    className={`h-11 w-11 rounded-xl flex items-center justify-center border transition-all ${
                      screenShared ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white/10 border-white/10 hover:bg-white/20'
                    }`}
                    title={screenShared ? "Stop Sharing" : "Share Screen"}
                  >
                    <MonitorUp className="h-4.5 w-4.5" />
                  </button>
                </>
              )}

              <button 
                onClick={() => setSoundMuted(!soundMuted)}
                className={`h-11 w-11 rounded-xl flex items-center justify-center border transition-all ${
                  soundMuted ? 'bg-rose-600 border-rose-600 text-white' : 'bg-white/10 border-white/10 hover:bg-white/20'
                }`}
                title={soundMuted ? "Unmute Audio" : "Mute Audio"}
              >
                {soundMuted ? <VolumeX className="h-4.5 w-4.5" /> : <Volume2 className="h-4.5 w-4.5" />}
              </button>

              <button 
                onClick={() => onEndCall(activeCall.id, duration)}
                className="h-11 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 font-semibold text-xs flex items-center gap-2 shadow-lg transition-all"
              >
                <PhoneOff className="h-4.5 w-4.5" />
                <span>Disconnect</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main List Workspace */}
      <div className="flex-1 flex flex-col h-full border-r border-slate-200/10 min-w-0">
        {/* Header */}
        <div className={`p-4 border-b border-slate-200/10 flex items-center gap-2.5 ${styles.header}`}>
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Phone className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-sm leading-tight">Audio & Video Conference</h2>
            <span className="text-[10px] text-slate-400">Call Log History</span>
          </div>
        </div>

        {/* History of Calls */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-3">Call Registry Logs</span>
          
          {calls.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-xs">No calling records found.</p>
              <p className="text-[10px] text-slate-500 mt-1">Initiate an audio or video session with a buddy below.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {calls.map((call) => {
                const isIncoming = call.receiverId === currentUser.id;
                const peerDetails = getPeerDetails(call);
                
                return (
                  <div 
                    key={call.id}
                    className={`flex items-center justify-between p-3 border border-slate-200/10 rounded-xl bg-slate-500/5 hover:bg-slate-200/5 transition-all`}
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={peerDetails.avatar} 
                        alt="peer" 
                        className="h-9 w-9 rounded-full object-cover border border-slate-200/10"
                      />
                      <div className="min-w-0">
                        <h4 className="font-semibold text-xs truncate leading-tight">{peerDetails.name}</h4>
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mt-1">
                          {call.type === 'video' ? <Video className="h-3 w-3" /> : <Phone className="h-3 w-3" />}
                          <span className="capitalize">{call.type} Call</span>
                          <span>•</span>
                          <span>{new Date(call.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {call.status === 'ended' && (
                        <span className="text-[10px] font-mono text-slate-400">
                          {formatDuration(call.duration || 0)}
                        </span>
                      )}
                      {call.status === 'rejected' && (
                        <span className="text-[10px] text-rose-400 font-semibold bg-rose-500/5 px-2 py-1 rounded-md border border-rose-500/10">Rejected</span>
                      )}
                      <button 
                        onClick={() => onInitiateCall(isIncoming ? call.callerId : call.receiverId, call.type)}
                        className={`p-2 rounded-lg ${styles.secondaryBtn}`}
                        title="Recall"
                      >
                        <Play className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right side contact trigger list */}
      <div className="w-full md:w-64 p-4 shrink-0 bg-slate-500/5 flex flex-col h-auto md:h-full justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-400 uppercase">
            <Volume2 className="h-4 w-4 text-indigo-400 shrink-0" />
            <span>Connect Hub</span>
          </div>
          
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Choose a contact below to trigger a live high-fidelity WebRTC mock signaling call!
          </p>

          <div className="space-y-1.5">
            {activeContacts.map((contact) => (
              <div 
                key={contact.id}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-500/5 border border-slate-200/10"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <img src={contact.avatar} alt="contact" className="h-7 w-7 rounded-full object-cover shrink-0" />
                  <span className="font-semibold text-[10px] truncate leading-tight">{contact.username}</span>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button 
                    onClick={() => onInitiateCall(contact.id, 'audio')}
                    className="p-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-400 transition-colors"
                  >
                    <Phone className="h-3 w-3" />
                  </button>
                  <button 
                    onClick={() => onInitiateCall(contact.id, 'video')}
                    className="p-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-400 transition-colors"
                  >
                    <Video className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 border-t border-slate-200/10 pt-4 hidden md:block">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 justify-center">
            <Volume2 className="h-3.5 w-3.5" />
            <span>Simulate Multi-Tabs Calls</span>
          </div>
        </div>
      </div>
    </div>
  );
};
