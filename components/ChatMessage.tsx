
import React, { useState, useEffect, useRef } from 'react';
import { Message, Role } from '../types';
import { User, Sparkles, ExternalLink, Globe } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === Role.USER;
  const isStreaming = message.isStreaming;
  
  // Clean content of markdown artifacts as requested
  const cleanContent = (text: string) => {
    return text
      .replace(/#{1,6}\s?/g, '') // Remove headers (e.g. ### )
      .replace(/\*\*/g, '')      // Remove bold markers (e.g. **)
      .replace(/__/g, '');       // Remove other markers
  };

  // State for the text that is currently visible to the user
  const [visibleText, setVisibleText] = useState(isUser ? cleanContent(message.parts.map(p => p.text || '').join('')) : '');
  const targetTextRef = useRef('');
  const typingIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isUser) return;

    // The full text we WANT to display eventually
    const newTargetText = cleanContent(message.parts.map(p => p.text || '').join(''));
    targetTextRef.current = newTargetText;

    // If we are not already typing, or if we have new text to type, start/continue the interval
    if (!typingIntervalRef.current) {
      typingIntervalRef.current = window.setInterval(() => {
        setVisibleText((prev) => {
          if (prev.length < targetTextRef.current.length) {
            // Take the next character from the target text
            return prev + targetTextRef.current[prev.length];
          } else {
            // If we've caught up and the stream is over, clear the interval
            if (!isStreaming) {
              if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current);
                typingIntervalRef.current = null;
              }
            }
            return prev;
          }
        });
      }, 15); // Adjust speed: 15ms per character creates a smooth "typing" feel
    }

    return () => {
      if (!isStreaming && typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    };
  }, [message.parts, isStreaming, isUser]);

  // Handle cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, []);

  const isThinking = isStreaming && message.parts.every(p => !p.text);

  return (
    <div className={`group w-full border-b border-white/[0.03] transition-colors duration-500 ${isUser ? 'bg-transparent' : 'bg-white/[0.02]'}`}>
      <div className="max-w-4xl mx-auto w-full py-10 px-6 sm:px-8">
        <div className="flex gap-6">
          <div className="flex flex-col items-center pt-1">
            <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 shadow-xl ${
              isUser ? 'bg-zinc-800 text-zinc-400' : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white'
            }`}>
              {isUser ? <User size={18} strokeWidth={2.5} /> : <Sparkles size={18} strokeWidth={2.5} />}
            </div>
          </div>
          
          <div className="flex-1 min-w-0 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                {isUser ? 'You' : 'Veera AI'}
              </span>
              <span className="text-[10px] text-zinc-600 font-medium">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className={`prose prose-zinc prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-900/50 prose-pre:border prose-pre:border-white/5 prose-code:text-cyan-400 ${isUser ? 'text-zinc-300 font-medium text-[15px]' : 'text-zinc-200 text-[16px]'}`}>
              {isThinking ? (
                <div className="typing-indicator">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`whitespace-pre-wrap selection:bg-cyan-500/40 ${isStreaming || (visibleText.length < targetTextRef.current.length) ? 'typing-cursor' : ''}`}>
                    {visibleText}
                  </div>
                  
                  {/* Render Images immediately */}
                  {message.parts.map((part, idx) => (
                    part.inlineData && (
                      <div key={`img-${idx}`} className="mt-6 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 group-hover:border-cyan-500/30 transition-colors duration-500">
                        <img
                          src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`}
                          alt="Content analysis"
                          className="w-full max-h-[500px] object-contain bg-zinc-900"
                        />
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>

            {message.groundingSources && message.groundingSources.length > 0 && !isStreaming && visibleText.length >= targetTextRef.current.length && (
              <div className="pt-6 mt-6 border-t border-white/[0.05] animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 mb-4 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                  <Globe size={12} className="text-cyan-500" />
                  <span>Verified Sources</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {message.groundingSources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/link flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-lg text-[11px] text-zinc-400 hover:text-cyan-400 transition-all shadow-sm"
                    >
                      <span className="truncate max-w-[180px] font-medium">{source.title}</span>
                      <ExternalLink size={10} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
