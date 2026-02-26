'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MoreVertical, Send, User, Sparkles, Loader2 } from 'lucide-react';
import { AIService } from '@/services/AIService';
import { useUserSettings } from '@/entities/user';
import { contextApi } from '@/entities/context';
import { useTaskContext } from '@/context/TaskContext';
import { useNavigation } from '@/context/NavigationContext';

/**
 * Interface representing a single chat message in the conversation.
 */
interface Message {
  /** Unique identifier for the message. */
  id: string;
  /** Role of the message sender ('user' for the human, 'model' for the AI). */
  role: 'user' | 'model';
  /** Text content of the message. */
  text: string;
  /** Unix timestamp of when the message was sent. */
  timestamp: number;
}

/**
 * Experimental view for interacting with the AI productivity coach (Aura).
 * Allows users to ask for advice, reflect on their day, or get focus tips.
 * The AI is context-aware and receives information about the user's
 * current location, tasks, and biological energy.
 *
 * @component
 */
export const ChatView: React.FC = () => {
  const { settings } = useUserSettings();
  const { tasks } = useTaskContext();
  const { showDashboard } = useNavigation();
  
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'init', 
      role: 'model', 
      text: `Hello ${settings.displayName || 'traveler'}. How is your energy flowing today?`, 
      timestamp: Date.now() 
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiServiceRef = useRef(AIService.getInstance());

  /**
   * Automatically scrolls the chat window to the bottom whenever a new
   * message is added or the AI starts typing.
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  /**
   * Handles sending a user message to the AI.
   * Gathers application context (location, tasks, movement) and sends it
   * along with the message history to the `AIService`.
   */
  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const userText = input.trim();
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text: userText, timestamp: Date.now() };
    
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
       const contextSnapshot = await contextApi.getSnapshot();
       const activeTaskCount = tasks.filter(t => t.status === 'active').length;
       const completedCount = tasks.filter(t => t.status === 'completed').length;
       
       const context = {
           location: contextSnapshot.location.label,
           timeOfDay: new Date().toLocaleTimeString(),
           battery: contextSnapshot.device.batteryLevel,
           activeTasks: activeTaskCount,
           completedTasks: completedCount,
           isMoving: contextSnapshot.activity.isMoving
       };
       
       const responseText = await aiServiceRef.current.sendChatMessage(messages, userText, context) || '...';
       
       const aiMsg: Message = { id: crypto.randomUUID(), role: 'model', text: responseText, timestamp: Date.now() };
       setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
       console.error(e);
       const errorMsg: Message = { id: crypto.randomUUID(), role: 'model', text: "I seem to be disconnected. Please check your connection.", timestamp: Date.now() };
       setMessages(prev => [...prev, errorMsg]);
    } finally {
       setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative z-50">
      <div className="w-full max-w-3xl mx-auto h-full flex flex-col bg-background md:border-x md:border-border">
        
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface z-20 shrink-0">
          <button onClick={showDashboard} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-foreground/5 transition-colors text-foreground">
            <ArrowLeft size={24} />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-base font-bold tracking-tight text-foreground">Coach Aura</h1>
            <div className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isTyping ? 'bg-primary animate-pulse' : 'bg-secondary'}`}></span>
              <span className="text-xxs font-semibold text-secondary uppercase tracking-widest">{isTyping ? 'Thinking...' : 'Online'}</span>
            </div>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-foreground/5 transition-colors text-foreground">
            <MoreVertical size={24} />
          </button>
        </header>

        {/* Messages Area */}
        <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 scroll-smooth pb-4">
          <div className="flex justify-center py-2">
            <span className="text-xs font-medium text-secondary bg-foreground/5 px-3 py-1 rounded-full">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start items-end'}`}>
               
               {msg.role === 'model' && (
                 <div className="relative w-8 h-8 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-surface-highlight border border-border overflow-hidden flex items-center justify-center text-secondary shadow-lg shadow-primary/10">
                      <Sparkles size={14} className="text-primary" />
                    </div>
                 </div>
               )}

               <div className={`flex flex-col gap-1 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {msg.role === 'model' && <span className="text-xxs text-secondary ml-1 mb-0.5">Aura</span>}
                  <div 
                    className={`
                      p-4 rounded-2xl shadow-sm border
                      ${msg.role === 'user' 
                        ? 'bg-foreground/10 border-border text-foreground rounded-tr-none' 
                        : 'bg-surface-highlight border-border text-foreground rounded-tl-none'
                      }
                    `}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
               </div>

               {msg.role === 'user' && (
                 <div className="w-8 h-8 rounded-full bg-foreground/5 shrink-0 overflow-hidden flex items-center justify-center border border-border">
                    <User size={14} className="text-foreground/50" />
                 </div>
               )}
            </div>
          ))}

          {isTyping && (
             <div className="flex items-end gap-3">
                <div className="relative w-8 h-8 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-surface-highlight border border-border overflow-hidden flex items-center justify-center">
                       <Loader2 size={14} className="text-primary animate-spin" />
                    </div>
                </div>
                <div className="bg-surface-highlight p-3 rounded-2xl rounded-tl-none border border-border">
                   <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-secondary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-secondary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-secondary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                   </div>
                </div>
             </div>
          )}
          
          <div ref={messagesEndRef} />
        </main>

        {/* Input Area */}
        <footer className="shrink-0 bg-surface border-t border-border p-4 z-20 md:rounded-b-xl">
          <div className="relative flex items-center">
            <input 
              className="w-full bg-surface-highlight text-foreground border-0 ring-1 ring-border focus:ring-2 focus:ring-primary/50 rounded-full pl-6 pr-14 py-3.5 text-base shadow-lg transition-all placeholder:text-secondary/50" 
              placeholder="Ask for advice or reflect on your day..." 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
              autoFocus
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-primary-foreground hover:bg-primary-dim rounded-full transition-all flex items-center justify-center disabled:opacity-0 disabled:scale-75"
            >
              <Send size={18} />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ChatView;
