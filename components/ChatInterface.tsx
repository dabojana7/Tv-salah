
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { ASIRI_SYSTEM_INSTRUCTION } from '../constants';
import { Message } from '../types';
import { sendLeadToN8N } from '../services/n8nService';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: 'يا مرحبا هيل عد السيل! معكم سارة، خبيرتكم العقارية في عسير الهول. وش حالكم؟ وكيف أقدر أخدمكم اليوم في عقارات منطقتنا الغالية؟',
      timestamp: Date.now(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    chatRef.current = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: ASIRI_SYSTEM_INSTRUCTION,
      }
    });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const detectLeadData = (text: string) => {
    const phoneRegex = /(05\d{8})/;
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) {
      sendLeadToN8N({ phone: phoneMatch[0], interest: 'الرغبة في التواصل الهاتفي' });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (!chatRef.current) throw new Error('Chat not initialized');
      detectLeadData(input);
      const response = await chatRef.current.sendMessage({ message: input });
      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text || 'أبشر بسعدك، بس عذراً صار فيه مشكلة بسيطة، أعد سؤالك لاهنت.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white" role="main" aria-label="محادثة سارة العقارية">
      {/* Messages Scroll Area */}
      <div 
        className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar bg-[#f8f8f6]"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="سجل الرسائل"
      >
        {messages.map((m) => (
          <div 
            key={m.id} 
            className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}
            aria-label={m.role === 'user' ? 'رسالتك' : 'رسالة سارة'}
          >
            <div className={`flex gap-4 max-w-[88%] ${m.role === 'user' ? 'flex-row' : 'flex-row-reverse'}`}>
              
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-[3px] shadow-lg transition-all duration-300 ${
                  m.role === 'user' 
                  ? 'bg-slate-800 border-slate-700 text-white' 
                  : 'bg-white border-slate-200 text-slate-400'
                }`}
                aria-hidden="true"
              >
                {m.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              
              <div className={`group relative p-6 border-[3px] transition-all duration-300 shadow-xl ${
                m.role === 'user' 
                ? 'bg-slate-800 text-white border-slate-700 rounded-tr-[28px] rounded-tl-[28px] rounded-br-[28px] rounded-bl-none' 
                : 'bg-white text-slate-900 border-slate-100 rounded-tl-[28px] rounded-tr-[28px] rounded-bl-[28px] rounded-br-none'
              }`}>
                <p className="text-sm md:text-base leading-relaxed font-bold whitespace-pre-wrap">{m.text}</p>
                <div className={`text-[10px] mt-3 font-black tracking-widest uppercase flex items-center gap-1 ${
                  m.role === 'user' ? 'justify-end opacity-40 text-white' : 'justify-start opacity-30 text-slate-900'
                }`}>
                  <time dateTime={new Date(m.timestamp).toISOString()}>
                    {new Date(m.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                  </time>
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-end" aria-live="assertive" role="status">
            <div className="bg-white border-[3px] border-slate-100 px-8 py-5 rounded-tl-[28px] rounded-tr-[28px] rounded-bl-[28px] rounded-br-none shadow-xl flex items-center gap-4">
              <Loader2 className="w-5 h-5 animate-spin text-[#006C35]" aria-hidden="true" />
              <span className="text-[11px] font-black text-slate-400 tracking-widest">سارة تزهب الرد...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-8 bg-white border-t border-slate-100">
        <div className="flex gap-4 items-center bg-slate-50 p-2 rounded-full border-[3px] border-slate-100 focus-within:border-[#006C35]/30 focus-within:bg-white focus-within:shadow-2xl transition-all duration-500">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="وش بخاطرك تسأل عنه؟"
            aria-label="اكتب رسالتك هنا"
            autoComplete="off"
            className="flex-1 bg-transparent border-none px-6 py-4 text-sm font-bold text-slate-900 focus:ring-0 outline-none placeholder:text-slate-300"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            aria-label="إرسال الرسالة"
            className="bg-[#006C35] hover:bg-[#004d26] text-white w-14 h-14 rounded-full flex items-center justify-center transition-all disabled:opacity-20 shadow-xl active:scale-95 flex-shrink-0 group"
          >
            <Send size={24} className="rotate-180 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
