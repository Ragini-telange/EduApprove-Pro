import React, { useState } from 'react';
import { Bot, Send, Mic, Sparkles, User, ExternalLink, RefreshCw } from 'lucide-react';
import { api } from '../../api/client';
import { ChatMessage } from '../../types';
import { Link } from 'react-router-dom';

export const AIAssistantCard: React.FC = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content:
        'Hello! I am **AICTE SmartAssist**, your compliance and workflow copilot. You can ask me questions about your applications, impending document expirations, compliance deadlines, or EVC inspection preparation.',
      timestamp: 'Ready',
      suggestions: [
        'What documents are expiring?',
        'What applications need my attention?',
        'Why is my application pending?',
        'What compliance is due next?',
      ],
    },
  ]);

  const quickPrompts = [
    'What documents are expiring?',
    'What applications need my attention?',
    'Why is my application pending?',
    'What compliance is due next?',
  ];

  const handleSend = async (messageToSend?: string) => {
    const text = messageToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await api.askAssistant(text);
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        content: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        related_items: response.related_items,
        suggestions: response.suggestions,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        content: `Sorry, I encountered an issue: ${err.message || 'Unable to connect to assistant service.'}. Please try again shortly.`,
        timestamp: 'Error',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-900 to-indigo-800 text-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center border border-white/20 shadow-xs">
            <Bot className="w-5 h-5 text-indigo-200" />
          </div>
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2">
              AICTE SmartAssist AI Copilot
              <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full font-medium">
                Active Context
              </span>
            </h3>
            <p className="text-xs text-indigo-200/90">
              Need help with your application or compliance requirements?
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                id: 'welcome-reset',
                sender: 'assistant',
                content:
                  'Session refreshed. Ask me anything regarding your institutional credentials or AICTE requirements.',
                timestamp: 'Ready',
                suggestions: quickPrompts,
              },
            ])
          }
          className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
          title="Reset conversation"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-[88%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.sender === 'user'
                  ? 'bg-slate-800 text-white'
                  : 'bg-indigo-600 text-white shadow-sm'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className="space-y-2">
              <div
                className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200 shadow-xs rounded-tl-none whitespace-pre-line'
                }`}
              >
                {msg.content}

                {/* Related items pill links */}
                {msg.related_items && msg.related_items.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-2">
                    {msg.related_items.map((item, idx) => (
                      <Link
                        key={idx}
                        to={item.link || '/institution/dashboard'}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded text-[11px] transition-colors"
                      >
                        <span>{item.title}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Suggestions Chips below assistant messages */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {msg.suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(s)}
                      className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 text-[11px] font-medium transition-all shadow-2xs"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 max-w-[80%]">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2 text-xs text-slate-500">
              <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
              <span>SmartAssist is querying institutional records...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask SmartAssist..."
              className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 p-1"
              title="Voice input (Microphone)"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>

          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
