
import React, { useState } from 'react';
import FloatingCallBubble from './components/FloatingCallBubble';
import ChatInterface from './components/ChatInterface';
import VoiceInterface from './components/VoiceInterface';
import { X } from 'lucide-react';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'chat' | 'voice' | null>(null);

  const closeInterface = () => setActiveMode(null);

  return (
    <div className="min-h-screen bg-[#fcfaf7] overflow-hidden relative selection:bg-[#10b981]/30">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-[#10b981]/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-[#d4af37]/10 blur-[120px] rounded-full"></div>
        <div className="absolute inset-0 bg-pattern"></div>
      </div>

      {/* Hero Content */}
      <div className="absolute top-20 right-20 text-right space-y-4 animate-in fade-in slide-in-from-right-8 duration-1000 hidden md:block z-10">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/40 backdrop-blur-md rounded-full border border-black/5">
          <div className="w-2 h-2 rounded-full bg-[#10b981] animate-ping"></div>
          <span className="text-[10px] font-black text-[#064e3b] uppercase tracking-[0.3em]">خدمة كبار العملاء</span>
        </div>
        <h1 className="text-[#064e3b] text-4xl md:text-6xl font-black leading-tight">
          نما عسير <br />
          <span className="text-[#10b981]">للعقارات الفاخرة</span>
        </h1>
        <p className="text-[#064e3b]/60 max-w-sm text-sm font-medium leading-relaxed">
          سارة خبيرتكم العقارية جاهزة لاستقبالكم. اختاروا وسيلة التواصل المفضلة لديكم.
        </p>
      </div>

      {/* Overlays for Chat and Voice */}
      {activeMode === 'chat' && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-10 animate-in fade-in zoom-in-95 duration-300">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={closeInterface}></div>
          <div className="relative w-full max-w-2xl h-[85vh] bg-white rounded-[2.5rem] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.15)] flex flex-col border border-black/5">
            <div className="p-5 border-b flex justify-between items-center bg-[#f8f9fa]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#064e3b] flex items-center justify-center text-white font-bold">س</div>
                <span className="text-[#064e3b] font-black text-sm tracking-widest uppercase">محادثة نصية مع سارة</span>
              </div>
              <button onClick={closeInterface} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                <X className="w-6 h-6 text-[#064e3b]" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatInterface />
            </div>
          </div>
        </div>
      )}

      {activeMode === 'voice' && (
        <VoiceInterface onClose={closeInterface} />
      )}

      {/* Floating Elements */}
      <FloatingCallBubble onSelectChat={() => setActiveMode('chat')} onSelectVoice={() => setActiveMode('voice')} />

      {/* Subtle Copyright Footer */}
      <div className="absolute bottom-10 left-10 opacity-40">
        <p className="text-[9px] font-black text-[#064e3b] uppercase tracking-[0.5em]">
          Elite Estates • ASIR 2025
        </p>
      </div>
    </div>
  );
};

export default App;
