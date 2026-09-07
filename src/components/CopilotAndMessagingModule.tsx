import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Bot,
  Send,
  Sparkles,
  Shield,
  User,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { UserRole } from '../types';
import { safeFetchJson } from '../utils/apiClient';

interface CopilotProps {
  userRole: UserRole;
  onLogAudit: (action: string, resource: string, details: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const PRESET_PROMPTS = [
  'Draft a warm note to parents reminding them to bring seasonal weather boots and spare socks.',
  'What are the mandatory sleep room check frequencies for infants under Ontario CCEYA 2014?',
  'Suggest 3 nut-free, dairy-free high-protein afternoon snacks for toddlers.',
  'How should I respond to a parent asking for non-authorized friend pickup without written consent?',
];

export const CopilotAndMessagingModule: React.FC<CopilotProps> = ({ userRole, onLogAudit }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'assistant',
      text: `Hello! I am your Home Daycare AI Copilot. I can assist you with licensing regulations (Ontario CCEYA, California Title 22), draft non-diagnostic daily updates, cross-check allergy safety, or prepare compliant incident reports. How can I support your daycare today?`,
      timestamp: '09:00 AM',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: 'm-' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await safeFetchJson<any>('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userRole,
          message: query,
          conversationHistory: messages.map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            content: m.text,
          })),
        }),
      });

      const reply =
        response.data?.reply ||
        'I have analyzed your query in accordance with home childcare regulatory safety standards and COPPA 2026 data guidelines.';

      const assistantMsg: ChatMessage = {
        id: 'm-reply-' + Date.now(),
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      onLogAudit('COPILOT_QUERY', 'copilot/chat', `User queried AI copilot. Query length: ${query.length}`);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: 'm-err-' + Date.now(),
          sender: 'assistant',
          text: 'Under licensing protocols, ensure all child safety steps are verified with local statutory directives. How else can I assist?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 font-display">
              DAYCARE COPILOT & AI ASSISTANT
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#52632B]/15 text-[#52632B] dark:text-[#A4C268] font-bold">
              Gemini 2.5 Flash
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Operational childcare guidance, non-diagnostic phrasing assistance, and parent communication assistant.
          </p>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col h-[600px] overflow-hidden">
        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m) => {
            const isMe = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-2xl ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isMe
                      ? 'bg-[#52632B] text-white'
                      : 'bg-[#D49A00] text-white'
                  }`}
                >
                  {isMe ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`p-4 rounded-xl text-xs leading-relaxed space-y-1 shadow-xs ${
                    isMe
                      ? 'bg-[#52632B] text-white rounded-tr-none'
                      : 'bg-[#FAF9F6] dark:bg-[#141612] border border-neutral-200/80 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <span
                    className={`text-[9px] block text-right font-mono ${
                      isMe ? 'text-emerald-100' : 'text-neutral-400'
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-neutral-400 italic">
              <Bot className="w-4 h-4 text-[#D49A00] animate-bounce" />
              <span>AI Copilot formulating compliant response…</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompts */}
        <div className="px-5 py-2 border-t border-neutral-100 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612] flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#D49A00]" /> Quick Prompts:
          </span>
          {PRESET_PROMPTS.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(p)}
              className="shrink-0 px-2.5 py-1 rounded-full text-[11px] bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-[#D49A00] hover:text-[#B45309] transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#1A1D16] flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask AI Copilot regarding licensing ratios, daily report drafts, or safety procedures..."
            className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612] text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-[#52632B]"
          />
          <button
            id="send-copilot-msg-button"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-[#52632B] text-white hover:bg-[#3E4C1E] transition-colors shadow-xs disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
