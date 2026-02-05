
import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatSession, Message, Role, ChatSettings } from './types';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import { geminiService } from './services/geminiService';
import { Sparkles, Command, ShieldCheck, Activity, Database } from 'lucide-react';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>({
    model: 'gemini-3-flash-preview', // Switched to Flash for maximum speed
    useSearch: true,
    useThinking: false,
    thinkingBudget: 16000
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('veera_ai_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) setActiveSessionId(parsed[0].id);
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    } else {
      handleNewChat();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('veera_ai_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (scrollRef.current) {
      // Use scrollTo for more immediate positioning during fast streams
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessions, activeSessionId]);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: 'New Intelligence Task',
      messages: [],
      model: settings.model,
      createdAt: Date.now()
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
  };

  const handleDeleteSession = (id: string) => {
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (activeSessionId === id) {
      setActiveSessionId(newSessions.length > 0 ? newSessions[0].id : null);
    }
  };

  const handleSendMessage = async (text: string, image?: { data: string; mimeType: string }) => {
    if (!activeSessionId) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: Role.USER,
      parts: [
        { text },
        ...(image ? [{ inlineData: image }] : [])
      ],
      timestamp: Date.now()
    };

    const aiMessageId = uuidv4();
    const initialAiMessage: Message = {
      id: aiMessageId,
      role: Role.MODEL,
      parts: [{ text: "" }],
      timestamp: Date.now(),
      isStreaming: true
    };

    let updatedSessions = sessions.map(s => {
      if (s.id === activeSessionId) {
        const title = s.messages.length === 0 ? text.slice(0, 30) + (text.length > 30 ? '...' : '') : s.title;
        return {
          ...s,
          title,
          messages: [...s.messages, userMessage, initialAiMessage]
        };
      }
      return s;
    });

    setSessions(updatedSessions);
    setIsLoading(true);

    try {
      const history = sessions.find(s => s.id === activeSessionId)?.messages || [];
      const stream = geminiService.streamChat(history, text, settings, image);

      for await (const { text: fullText, sources } of stream) {
        setSessions(prev => prev.map(s => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: s.messages.map(m => {
                if (m.id === aiMessageId) {
                  return { ...m, parts: [{ text: fullText }], groundingSources: sources };
                }
                return m;
              })
            };
          }
          return s;
        }));
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: s.messages.map(m => {
              if (m.id === aiMessageId) {
                return { ...m, parts: [{ text: "⚠️ Real-time sync interrupted. Please check your connection to the data grid." }] };
              }
              return m;
            })
          };
        }
        return s;
      }));
    } finally {
      setIsLoading(false);
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: s.messages.map(m => {
              if (m.id === aiMessageId) {
                return { ...m, isStreaming: false };
              }
              return m;
            })
          };
        }
        return s;
      }));
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden text-zinc-100 bg-[#09090b]">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
      />
      
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Subtle Background Glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none translate-y-1/2 -translate-x-1/2" />

        {/* Header */}
        <header className="h-16 border-b border-white/[0.03] bg-[#09090b]/80 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-2 py-1 bg-white/5 border border-white/10 rounded-lg">
               <Database size={14} className="text-cyan-500" />
               <div className="h-3 w-px bg-white/10" />
               <span className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase">Real-Time Sync</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_15px_-5px_rgba(6,182,212,0.2)]">
               <Activity size={12} className="text-cyan-400 animate-pulse" />
               <span className="text-[10px] font-bold text-cyan-400 tracking-wider">NETWORK LIVE</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer">
              <ShieldCheck size={18} />
              <span className="text-xs font-semibold">Veera Core</span>
            </div>
          </div>
        </header>

        {/* Chat Window */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar"
        >
          {activeSession && activeSession.messages.length > 0 ? (
            <div className="pb-24">
              {activeSession.messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-12 animate-in fade-in zoom-in duration-700">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500 blur-[80px] opacity-20 animate-pulse" />
                <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-cyan-500/40 relative z-10 animate-float">
                  <Sparkles size={44} className="text-white drop-shadow-lg" strokeWidth={2.5} />
                </div>
              </div>

              <div className="max-w-xl space-y-4 relative z-10">
                <h2 className="text-5xl font-extrabold text-white tracking-tight leading-tight">
                   Veera AI <br/>
                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">Synced & Ready.</span>
                </h2>
                <p className="text-zinc-400 text-lg font-medium leading-relaxed">
                  Experience full data synchronization with modern standards. Real-time search, complex reasoning, and multimodal understanding.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl relative z-10 px-4">
                {[
                  { title: "Insights", desc: "Current events & real-time grounding", color: "from-cyan-500/20 to-cyan-500/5" },
                  { title: "Deep Thought", desc: "Long-form reasoning & simulation", color: "from-indigo-500/20 to-indigo-500/5" },
                  { title: "Visual Logic", desc: "Multimodal analysis of digital media", color: "from-purple-500/20 to-purple-500/5" }
                ].map((item, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleSendMessage(item.desc)}
                    className="group p-6 bg-zinc-900/40 border border-white/5 rounded-3xl text-left hover:border-cyan-500/40 hover:bg-zinc-900 transition-all duration-300 shadow-xl hover:shadow-cyan-500/5"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform`}>
                        <div className="w-2 h-2 rounded-full bg-cyan-400 opacity-60 animate-ping" />
                    </div>
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 group-hover:text-cyan-400 transition-colors">{item.title}</p>
                    <p className="text-zinc-200 text-sm font-semibold leading-relaxed group-hover:text-white">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Input Area */}
        <div className="relative z-40 bg-gradient-to-t from-[#09090b] via-[#09090b]/95 to-transparent pt-12">
          <ChatInput 
            onSendMessage={handleSendMessage} 
            isLoading={isLoading} 
            settings={settings}
            setSettings={setSettings}
          />
          <div className="text-center text-[10px] text-zinc-600 font-bold tracking-widest uppercase pb-4 opacity-50">
            Enterprise Sync • Secure Protocol
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
