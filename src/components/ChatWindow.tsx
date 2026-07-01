import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Smile, Paperclip, Phone, Video, MoreVertical, 
  Image, FileText, CheckCheck, Loader2, ArrowLeft, Trash2, X, Download, MessageCircle
} from 'lucide-react';
import { View, Theme, User, Group, Message, Attachment } from '../types';
import { themeStyles } from './ThemeWrapper';

interface ChatWindowProps {
  theme: Theme;
  currentUser: User;
  recipient: User | null;
  group: Group | null;
  messages: Message[];
  onSendMessage: (text: string, attachment?: Attachment) => void;
  typingPeers: { [key: string]: boolean };
  onTypingStatus: (isTyping: boolean) => void;
  onInitiateCall: (receiverId: string, type: 'audio' | 'video') => void;
  onClose: () => void;
}

const EMOJIS = ['😀', '😂', '🥰', '😍', '👍', '🔥', '👏', '🎉', '💡', '🚀', '👀', '❤️', '🤔', '😅', '🙌', '✨'];

export const ChatWindow: React.FC<ChatWindowProps> = ({
  theme,
  currentUser,
  recipient,
  group,
  messages,
  onSendMessage,
  typingPeers,
  onTypingStatus,
  onInitiateCall,
  onClose,
}) => {
  const styles = themeStyles[theme] || themeStyles.classic;
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingPeers]);

  const activeThreadMessages = messages.filter((m) => {
    if (group) {
      return m.groupId === group.id;
    } else if (recipient) {
      // Direct messages with this recipient (including bot/peers)
      return !m.groupId && (
        m.senderId === recipient.id || 
        (m.senderId === currentUser.id && !m.isAi && (recipient.id === 'gemini-bot' ? m.text : true))
      );
    }
    return false;
  });

  const handleSend = () => {
    if (!inputText.trim() && !attachment) return;
    
    onSendMessage(inputText, attachment || undefined);
    setInputText('');
    setAttachment(null);
    setShowEmojiPicker(false);
    onTypingStatus(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    
    // Trigger typing updates
    onTypingStatus(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTypingStatus(false);
    }, 2000);
  };

  // Drag and Drop implementation
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const processFile = (file: File) => {
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      let fileType: 'image' | 'video' | 'audio' | 'file' = 'file';
      if (file.type.startsWith('image/')) fileType = 'image';
      else if (file.type.startsWith('video/')) fileType = 'video';
      else if (file.type.startsWith('audio/')) fileType = 'audio';

      setAttachment({
        type: fileType,
        name: file.name,
        url: reader.result as string,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`
      });
      setIsUploading(false);
      setIsDragOver(false);
    };
    reader.onerror = () => {
      setIsUploading(false);
      setIsDragOver(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const insertEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  // Determine active typing name
  const getTypingText = () => {
    if (group) {
      // Check if any group member (other than currentUser) is typing
      // For groups we simplify: if any user in group is typing, show typing status
      const typingIds = Object.keys(typingPeers).filter(id => typingPeers[id] && id !== currentUser.id);
      if (typingIds.length > 0) {
        return 'Someone is typing...';
      }
    } else if (recipient && typingPeers[recipient.id]) {
      return `${recipient.username} is typing...`;
    }
    return null;
  };

  const typingText = getTypingText();

  // Helper status color mapping
  const statusColors = {
    online: 'bg-emerald-500',
    offline: 'bg-slate-400',
    away: 'bg-amber-500',
    busy: 'bg-rose-500'
  };

  if (!recipient && !group) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/10 h-full">
        <div className="h-16 w-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-4 animate-bounce">
          <Send className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold">Your Workspace is Ready</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
          Select a contact or join a group channel from the sidebar to begin chatting. Open this app in multiple browser tabs to test dual-user interactions in real-time!
        </p>
      </div>
    );
  }

  const title = group ? group.name : recipient?.username;
  const subtitle = group ? `${group.members.length} members` : recipient?.status;
  const avatar = group ? group.avatar : recipient?.avatar;

  return (
    <div 
      className={`flex-1 flex flex-col h-full relative overflow-hidden`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Visual Overlay */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-indigo-600/85 backdrop-blur-xs flex flex-col items-center justify-center z-50 text-white p-6 border-4 border-dashed border-white/60 m-3 rounded-2xl"
          >
            <Paperclip className="h-14 w-14 animate-bounce mb-3" />
            <h3 className="text-xl font-display font-bold">Drop Attachment Here</h3>
            <p className="text-sm opacity-80 mt-1">Images, audio, video, or files up to 10MB</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <div className={`p-4 flex items-center justify-between shadow-xs border-b border-slate-200/10 ${styles.header}`}>
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200/10 md:hidden text-slate-400"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div className="relative shrink-0">
            <img 
              src={avatar} 
              alt={title} 
              className="h-11 w-11 rounded-xl object-cover border border-slate-200/10"
            />
            {!group && recipient && (
              <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 ${theme === 'classic' ? 'border-white' : 'border-[#0f172a]'} ${statusColors[recipient.status]}`} />
            )}
          </div>
          
          <div className="min-w-0">
            <h2 className="font-display font-bold text-sm leading-tight truncate">{title}</h2>
            <span className="text-[10px] text-slate-400 capitalize flex items-center gap-1 mt-0.5">
              {!group && recipient?.status === 'online' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
              {subtitle}
            </span>
          </div>
        </div>

        {/* Direct Actions: Call, Video, Menu */}
        <div className="flex items-center gap-1">
          {!group && recipient && recipient.id !== 'gemini-bot' && (
            <>
              <button 
                onClick={() => onInitiateCall(recipient.id, 'audio')}
                className={`p-2.5 rounded-xl hover:bg-slate-200/10 transition-colors ${styles.accentText}`}
                title="Voice Call"
              >
                <Phone className="h-4.5 w-4.5" />
              </button>
              <button 
                onClick={() => onInitiateCall(recipient.id, 'video')}
                className={`p-2.5 rounded-xl hover:bg-slate-200/10 transition-colors ${styles.accentText}`}
                title="Video Call"
              >
                <Video className="h-4.5 w-4.5" />
              </button>
            </>
          )}
          <button className="p-2.5 rounded-xl hover:bg-slate-200/10 text-slate-400">
            <MoreVertical className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
        {activeThreadMessages.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <div className="h-12 w-12 bg-slate-200/5 rounded-2xl flex items-center justify-center text-slate-400 mb-3 border border-slate-200/10">
              <MessageCircle className="h-6 w-6" />
            </div>
            <p className="text-xs">No messages in this chat yet</p>
            <p className="text-[10px] text-slate-500 mt-1 max-w-xs">Be the first to say hello! Your message will sync to anyone else in this workspace.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeThreadMessages.map((msg) => {
              const isSelf = msg.senderId === currentUser.id;
              return (
                <div 
                  key={msg.id}
                  className={`flex gap-2.5 max-w-[85%] ${isSelf ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  {/* Sender Avatar */}
                  {!isSelf && (
                    <img 
                      src={msg.senderAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"} 
                      alt={msg.senderName} 
                      className="h-8 w-8 rounded-lg object-cover mt-0.5 shrink-0 border border-slate-200/10"
                    />
                  )}

                  <div className="space-y-1">
                    {/* Username indicator on Group messages */}
                    {group && !isSelf && (
                      <span className="text-[10px] font-bold text-indigo-400 ml-1">{msg.senderName}</span>
                    )}
                    
                    <div className={`p-3 text-xs leading-relaxed shadow-xs ${
                      isSelf ? styles.chatBubbleSelf : styles.chatBubblePeer
                    }`}>
                      {/* Rich Attachment Rendering */}
                      {msg.attachment && (
                        <div className="mb-2 overflow-hidden rounded-lg max-w-full">
                          {msg.attachment.type === 'image' && (
                            <div className="relative group">
                              <img 
                                src={msg.attachment.url} 
                                alt={msg.attachment.name} 
                                className="max-h-60 object-contain rounded-md"
                              />
                              <a 
                                href={msg.attachment.url} 
                                download={msg.attachment.name}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          )}
                          {msg.attachment.type === 'video' && (
                            <video 
                              src={msg.attachment.url} 
                              controls 
                              className="max-h-60 rounded-md"
                            />
                          )}
                          {msg.attachment.type === 'audio' && (
                            <audio 
                              src={msg.attachment.url} 
                              controls 
                              className="w-full"
                            />
                          )}
                          {msg.attachment.type === 'file' && (
                            <div className="flex items-center gap-3 p-2 bg-black/5 rounded-md text-inherit border border-slate-200/10">
                              <FileText className="h-7 w-7 shrink-0 text-indigo-400" />
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-semibold truncate leading-tight">{msg.attachment.name}</p>
                                <p className="text-[9px] opacity-70 mt-0.5">{msg.attachment.size || 'Unknown Size'}</p>
                              </div>
                              <a 
                                href={msg.attachment.url} 
                                download={msg.attachment.name}
                                className="p-1.5 hover:bg-black/10 rounded-lg transition-colors"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Text content */}
                      {msg.text && <p className="whitespace-pre-wrap font-sans">{msg.text}</p>}
                    </div>

                    {/* Timestamp & Sync checklist */}
                    <div className={`flex items-center gap-1.5 text-[9px] text-slate-400 ${isSelf ? 'justify-end' : ''}`}>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isSelf && <CheckCheck className="h-3.5 w-3.5 text-indigo-400" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dynamic Typing Indicator */}
        <AnimatePresence>
          {typingText && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-2 text-[11px] text-slate-400 ml-12"
            >
              <Loader2 className="h-3 w-3 animate-spin text-indigo-400" />
              <span>{typingText}</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Attachment Previews */}
      <AnimatePresence>
        {attachment && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 border-t border-slate-200/10 flex items-center justify-between bg-slate-500/5 gap-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              {attachment.type === 'image' ? (
                <div className="h-10 w-10 rounded-md overflow-hidden bg-slate-200/10 shrink-0">
                  <img src={attachment.url} alt="upload" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-md bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{attachment.name}</p>
                <p className="text-[10px] text-slate-400">{attachment.size}</p>
              </div>
            </div>
            <button 
              onClick={() => setAttachment(null)}
              className="p-1 rounded-full hover:bg-slate-200/10 text-rose-400"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text Area Input Panel */}
      <div className="p-4 border-t border-slate-200/10 relative">
        {/* Emoji Selector Drawer */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className={`absolute bottom-full left-4 mb-2 p-3 ${styles.card} max-w-sm grid grid-cols-8 gap-2 z-30`}
            >
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => insertEmoji(emoji)}
                  className="text-lg hover:scale-125 transition-transform p-1.5"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2">
          {/* Custom File triggers */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className={`p-2.5 rounded-xl hover:bg-slate-200/10 text-slate-400 shrink-0 ${isUploading ? 'animate-pulse' : ''}`}
            disabled={isUploading}
            title="Attach file (Images, Videos, Audios)"
          >
            {isUploading ? <Loader2 className="h-4.5 w-4.5 animate-spin text-indigo-400" /> : <Paperclip className="h-4.5 w-4.5" />}
          </button>
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          />

          <button 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2.5 rounded-xl hover:bg-slate-200/10 text-slate-400 shrink-0"
            title="Add Emoji"
          >
            <Smile className="h-4.5 w-4.5" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder={isDragOver ? "Drop file now!" : group ? "Send group message..." : `Message ${recipient?.username}...`}
            className={`flex-1 rounded-xl border py-2.5 px-4 text-xs outline-none transition-all ${styles.inputBg} ${styles.ring}`}
          />

          <button 
            onClick={handleSend}
            className={`p-2.5 rounded-xl transition-all shadow-md shrink-0 ${
              (inputText.trim() || attachment) ? styles.accent : 'bg-slate-200/10 text-slate-400 cursor-not-allowed'
            }`}
            disabled={!inputText.trim() && !attachment}
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
