
import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, X, Globe, BrainCircuit, Sparkles, ChevronUp, Layers, Cpu } from 'lucide-react';
import { ChatSettings } from '../types';

interface ChatInputProps {
  onSendMessage: (text: string, image?: { data: string; mimeType: string }) => void;
  isLoading: boolean;
  settings: ChatSettings;
  setSettings: (s: ChatSettings) => void;
}

const MODELS = [
  { id: 'gemini-3-flash-preview', name: 'Veera Flash', desc: 'Instant responses with high speed sync', icon: Sparkles },
  { id: 'gemini-3-pro-preview', name: 'Veera Ultra', desc: 'Full reasoning capacity & data grounding', icon: Cpu },
];

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, settings, setSettings }) => {
  const [input, setInput] = useState('');
  const [image, setImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if ((input.trim() || image) && !isLoading) {
      onSendMessage(input, image || undefined);
      setInput('');
      setImage(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const base64 = readerEvent.target?.result?.toString().split(',')[1];
        if (base64) {
          setImage({
            data: base64,
            mimeType: file.type
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  return (
    <div className="w-full max-w-4xl mx-auto px-6 pb-10">
      <div className="relative glass rounded-[24px] border border-white/10 shadow-2xl transition-all duration-500 subtle-ring group/input">
        
        {/* Attachment Preview */}
        {image && (
          <div className="p-4 border-b border-white/5 bg-zinc-900/40 rounded-t-[24px]">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-white/10 shadow-lg group">
              <img src={`data:${image.mimeType};base64,${image.data}`} alt="Preview" className="w-full h-full object-cover" />
              <button 
                onClick={() => setImage(null)}
                className="absolute top-1 right-1 bg-black/60 backdrop-blur-md rounded-full p-1.5 hover:bg-red-500 text-white transition-all scale-0 group-hover:scale-100"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Action Controls Top */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.03]">
          <button
            onClick={() => setSettings({ ...settings, useSearch: !settings.useSearch })}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-300 border ${
              settings.useSearch 
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_-5px_rgba(6,182,212,0.3)]' 
                : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
            }`}
          >
            <Globe size={14} className={settings.useSearch ? 'animate-pulse' : ''} />
            <span>Search Synced</span>
          </button>

          <button
            onClick={() => setSettings({ ...settings, useThinking: !settings.useThinking })}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-300 border ${
              settings.useThinking 
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_-5px_rgba(99,102,241,0.3)]' 
                : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
            }`}
          >
            <BrainCircuit size={14} />
            <span>Deep Think</span>
          </button>

          <div className="h-4 w-px bg-white/10 mx-1" />

          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-all hover:bg-white/5"
          >
            <Cpu size={14} className="text-cyan-500" />
            <span>{MODELS.find(m => m.id === settings.model)?.name}</span>
            <ChevronUp size={12} className={`transition-transform duration-300 ${isSettingsOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className="flex items-end p-4 gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-zinc-500 hover:text-cyan-400 hover:bg-white/5 rounded-xl transition-all active:scale-90"
            title="Attach Media"
          >
            <ImageIcon size={22} strokeWidth={1.5} />
          </button>
          
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            accept="image/*"
            onChange={handleImageUpload}
          />

          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Search the data grid..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-[16px] text-zinc-100 placeholder-zinc-600 py-3 resize-none max-h-48 scrollbar-hide font-medium"
          />

          <button
            onClick={handleSend}
            disabled={(!input.trim() && !image) || isLoading}
            className={`p-3 rounded-xl transition-all duration-300 ${
              (input.trim() || image) && !isLoading
                ? 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-500/30 translate-y-0 active:scale-90'
                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
          >
            <Send size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* Model Selector Popup */}
        {isSettingsOpen && (
          <div className="absolute bottom-full left-0 mb-4 w-full sm:w-80 bg-[#16161a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 glass">
            <div className="p-4 border-b border-white/5 bg-white/5">
              <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Select Engine</h3>
            </div>
            <div className="p-2 space-y-1">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSettings({ ...settings, model: m.id });
                    setIsSettingsOpen(false);
                  }}
                  className={`w-full text-left p-4 rounded-xl transition-all flex items-start gap-4 ${
                    settings.model === m.id 
                      ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400' 
                      : 'hover:bg-white/5 text-zinc-400 border border-transparent'
                  }`}
                >
                  <div className={`mt-1 p-2 rounded-lg ${settings.model === m.id ? 'bg-cyan-500/20' : 'bg-zinc-800'}`}>
                    <m.icon size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{m.name}</span>
                    <span className="text-[11px] opacity-60 leading-normal mt-1">{m.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
