import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Send, Bot, User, BrainCircuit, RotateCcw, 
  HelpCircle, MessageSquare, Terminal, Heart, Languages, BookOpen
} from 'lucide-react';
import { Theme, User as UserType } from '../types';
import { themeStyles } from './ThemeWrapper';

interface AIChatPanelProps {
  theme: Theme;
  currentUser: UserType;
}

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const TEMPLATES = [
  { label: 'Summarize Meeting', icon: BookOpen, prompt: 'Generate a clean, professional meeting minutes summary containing: key attendees, bulleted action items with assignees, and next milestone schedules from a messy text.' },
  { label: 'Refactor Tailwind', icon: Terminal, prompt: 'Refactor the following CSS or dirty layout code into a clean React component using modern Tailwind CSS and motion animations.' },
  { label: 'Sarcastic Assistant', icon: Heart, prompt: 'Answer my queries with hilarious, helpful sarcasm. Tell me: Why does my developer console show so many red lines?' },
  { label: 'Translate to Spanish', icon: Languages, prompt: 'Translate the following business message into formal, inviting Spanish: "Welcome to ChatterBox! We hope this platform facilitates smooth, high-fidelity collaboration for your engineering squads."' }
];

const PRESET_INSTRUCTIONS = [
  { id: 'default', label: 'Helpful Genius', desc: 'Standard polite assistant.' },
  { id: 'coder', label: 'Tech Lead / Architect', desc: 'Outputs optimized code snippets.' },
  { id: 'sassy', label: 'Sassy Cyber-Bot', desc: 'Snarky, humorous replies.' },
  { id: 'creative', label: 'Growth Strategist', desc: 'Brainstorms marketing plans.' }
];

export const AIChatPanel: React.FC<AIChatPanelProps> = ({ theme, currentUser }) => {
  const styles = themeStyles[theme] || themeStyles.classic;
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: 'assistant',
      content: "Hello! I am your **Gemini Assistant**, powered directly by Google AI. \n\nSelect a prompt template above, customize my cognitive instruction, or type anything below to brainstorm code, designs, or summaries!",
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemPreset, setSystemPreset] = useState('default');
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: AIMessage = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Formulate prompt array in standard API schema
    const promptHistory = [...messages, userMsg].map(m => ({
      role: m.role,
      content: m.content
    }));

    // System instruction override depending on selected preset
    let systemInstruction = "You are the friendly, highly intelligent Gemini AI assistant integrated inside ChatterBox, a premium communication workspace. Respond helpfully in formatting markdown.";
    if (systemPreset === 'coder') {
      systemInstruction = "You are a Principal Software Engineer and UX Architect. Provide highly efficient code, style patterns, and structured answers in technical language.";
    } else if (systemPreset === 'sassy') {
      systemInstruction = "You are a sassy cybernetic robot. Give hilariously cheeky, slightly sarcastic but ultimately useful answers to the user's questions.";
    } else if (systemPreset === 'creative') {
      systemInstruction = "You are a creative product growth consultant. Provide inspiring, bold ideas, slogans, and tactical design solutions.";
    }

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: promptHistory,
          systemInstruction
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toISOString()
        }]);
      } else {
        throw new Error(data.error || "Failed to reach AI server.");
      }
    } catch (err: any) {
      console.error("AI client fetch error:", err);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `⚠️ **Server error:** Unable to fetch response. \n\n*Error details:* ${err.message || 'Network unreachable'}. Please check if you have launched the dev server correctly.`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Workspace history cleared! What would you like to create or summarize next?",
        timestamp: new Date().toISOString()
      }
    ]);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
      {/* Left Chat Workspace */}
      <div className="flex-1 flex flex-col h-full border-r border-slate-200/10 min-w-0">
        {/* Header */}
        <div className={`p-4 border-b border-slate-200/10 flex justify-between items-center ${styles.header}`}>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-display font-bold text-sm leading-tight">Gemini Workspace</h2>
              <span className="text-[10px] text-slate-400">Model: gemini-3.5-flash (Server-Side)</span>
            </div>
          </div>
          
          <button 
            onClick={clearHistory}
            className={`p-2 rounded-lg hover:bg-slate-200/10 text-slate-400 transition-colors flex items-center gap-1.5 text-xs`}
            title="Reset Chat"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>

        {/* Templates Panel Grid */}
        <div className="p-3 border-b border-slate-200/10 bg-slate-500/5">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-2 px-1">Quick Prompt Templates</span>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {TEMPLATES.map((tpl) => {
              const TplIcon = tpl.icon;
              return (
                <button
                  key={tpl.label}
                  onClick={() => {
                    setInput(tpl.prompt);
                    handleSend(tpl.prompt);
                  }}
                  className={`flex items-start gap-2 p-2 rounded-xl text-left border border-slate-200/10 ${styles.secondaryBtn} transition-all hover:scale-102 group`}
                >
                  <TplIcon className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-semibold leading-tight line-clamp-2">{tpl.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Message Bubble Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => {
            const isAi = msg.role === 'assistant';
            return (
              <div 
                key={idx}
                className={`flex gap-3 max-w-[85%] ${isAi ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-slate-200/10 ${
                  isAi ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-500/10 text-slate-400'
                }`}>
                  {isAi ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>

                <div className="space-y-1">
                  <div className={`p-3 text-xs leading-relaxed rounded-2xl ${
                    isAi ? styles.chatBubblePeer : styles.chatBubbleSelf
                  }`}>
                    {/* Basic Rich Text formatting */}
                    <div className="prose prose-sm max-w-none text-inherit dark:prose-invert">
                      <p className="whitespace-pre-wrap font-sans">{msg.content}</p>
                    </div>
                  </div>
                  <div className={`text-[9px] text-slate-400 ${!isAi ? 'text-right' : ''}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 mr-auto max-w-[85%]">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-slate-200/10">
                <Bot className="h-4 w-4 animate-spin" />
              </div>
              <div className={`p-3 rounded-2xl ${styles.chatBubblePeer} flex items-center gap-2`}>
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-[10px] text-slate-400 ml-1 font-semibold">Gemini is synthesizing...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200/10">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
              placeholder="Ask Gemini to write, rewrite, translate, or code..."
              className={`flex-1 rounded-xl border py-2.5 px-4 text-xs outline-none transition-all ${styles.inputBg} ${styles.ring}`}
              disabled={isLoading}
            />
            <button
              onClick={() => handleSend(input)}
              className={`p-2.5 rounded-xl transition-all shadow-md shrink-0 ${
                input.trim() ? styles.accent : 'bg-slate-200/10 text-slate-400 cursor-not-allowed'
              }`}
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Cognitive Settings Side Drawer */}
      <div className="w-full md:w-64 p-4 shrink-0 bg-slate-500/5 flex flex-col h-auto md:h-full justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-400 uppercase">
            <BrainCircuit className="h-4 w-4 text-indigo-400 shrink-0" />
            <span>Cognitive Decoders</span>
          </div>
          
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Configure the internal prompt directives sent along to our Gemini API layer.
          </p>

          <div className="space-y-2">
            {PRESET_INSTRUCTIONS.map((preset) => {
              const isSelected = systemPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => setSystemPreset(preset.id)}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all flex flex-col ${
                    isSelected 
                      ? 'border-indigo-500 bg-indigo-500/10' 
                      : 'border-slate-200/10 hover:bg-slate-200/5'
                  }`}
                >
                  <span className="font-semibold text-[11px] leading-snug">{preset.label}</span>
                  <span className="text-[9px] text-slate-400 leading-snug mt-0.5">{preset.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 border-t border-slate-200/10 pt-4 hidden md:block">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 justify-center">
            <Bot className="h-3 w-3" />
            <span>Google Gemini SDK Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
