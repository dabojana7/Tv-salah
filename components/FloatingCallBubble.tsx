
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, BellRing, MessageCircleMore, MicVocal, PhoneForwarded, X, Volume2, Stars, Zap, Music } from 'lucide-react';

interface FloatingCallBubbleProps {
  onSelectChat: () => void;
  onSelectVoice: () => void;
}

interface Particle {
  id: number;
  tx: string;
  ty: string;
  s: number;
  d: string;
  r: string;
  sr: string;
  delay: string;
  color: string;
  target: 'chat' | 'voice' | 'call';
}

const FloatingCallBubble: React.FC<FloatingCallBubbleProps> = ({ onSelectChat, onSelectVoice }) => {
  const [showToast, setShowToast] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [menuParticles, setMenuParticles] = useState<Particle[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const playMagicSound = useCallback((freq: number, type: OscillatorType, duration: number, volume: number) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
      
      if (freq === 440) { 
          oscillator.frequency.exponentialRampToValueAtTime(freq * 0.7, audioCtx.currentTime + duration);
      } else {
          oscillator.frequency.exponentialRampToValueAtTime(freq * 1.8, audioCtx.currentTime + duration);
      }

      gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn("Audio feedback failed:", e);
    }
  }, []);

  const triggerBurst = (target: 'chat' | 'voice' | 'call') => {
    const palette = ['#10b981', '#059669', '#064e3b', '#065f46', '#d4af37', '#ffffff', '#ecfdf5'];
    const newParticles = Array.from({ length: 32 }).map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 40 + Math.random() * 180;
      return {
        id: Date.now() + i,
        tx: `${Math.cos(angle) * distance}px`,
        ty: `${Math.sin(angle) * distance}px`,
        s: 0.2 + Math.random() * 0.8,
        d: `${0.4 + Math.random() * 0.8}s`,
        r: `${(Math.random() - 0.5) * 1080}deg`,
        sr: `${(Math.random() - 0.5) * 360}deg`,
        delay: `${Math.random() * 0.2}s`,
        color: palette[Math.floor(Math.random() * palette.length)],
        target
      };
    });
    setMenuParticles(newParticles);
    setTimeout(() => setMenuParticles([]), 1500);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (!isOpen) playMagicSound(1300, 'sine', 0.12, 0.015);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isOpen) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / 10;
    const y = (e.clientY - rect.top - rect.height / 2) / 10;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (!isOpen) setMousePos({ x: 0, y: 0 });
  };

  const toggleMenu = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    
    if (nextState) {
      setShowSparkles(true);
      setTimeout(() => setShowSparkles(false), 1500);
      playMagicSound(700, 'sine', 0.3, 0.06);
    } else {
      playMagicSound(400, 'sine', 0.25, 0.04);
      setMousePos({ x: 0, y: 0 });
    }

    if (window.navigator.vibrate) window.navigator.vibrate(40);
  };

  const handleCallRequest = () => {
    triggerBurst('call');
    playMagicSound(440, 'sine', 0.4, 0.12);
    if (window.navigator.vibrate) window.navigator.vibrate([50, 70, 50]);
    
    setTimeout(() => {
      setIsOpen(false);
      setShowToast(true);
      setTimeout(() => {
        window.location.href = 'tel:0500000000';
      }, 1500);
    }, 300);
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const sparkles = Array.from({ length: 18 }).map((_, i) => ({
    tx: `${(Math.random() - 0.5) * 240}px`,
    ty: `${(Math.random() - 0.5) * 240}px`,
    s: 0.5 + Math.random() * 1.8,
    d: `${0.8 + Math.random() * 0.8}s`,
    r: `${Math.random() * 360}deg`,
    delay: `${Math.random() * 0.3}s`
  }));

  return (
    <>
      {/* Lead Notification Toast */}
      <div className={`fixed bottom-48 right-10 px-8 py-5 bg-[#006C35]/98 backdrop-blur-3xl rounded-[2.5rem] flex items-center gap-6 border border-emerald-400/50 shadow-[0_40px_100px_rgba(0,0,0,0.15)] transition-magic z-[130] ${showToast ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-90 pointer-events-none'}`}>
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-400 blur-xl opacity-60 animate-pulse"></div>
          <div className="relative bg-emerald-400 p-4 rounded-full shadow-lg border border-white/20">
            <BellRing size={26} className="text-white animate-bounce" />
          </div>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-white font-black text-base tracking-wide">جاري تحويل اتصالك...</span>
          <span className="text-emerald-200 text-[11px] font-bold uppercase tracking-[0.2em] mt-1 opacity-80">سارة تتأهب للرد على استفسارك</span>
        </div>
      </div>

      <div 
        ref={containerRef}
        className={`fixed bottom-10 right-10 z-[110] flex flex-col items-end gap-6`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        {/* Menu Options */}
        <div className={`flex flex-col items-end gap-6 transition-magic relative ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-24 pointer-events-none scale-50 rotate-12'}`}>
          
          {/* Enhanced Chat Option */}
          <button 
            onClick={() => { 
              triggerBurst('chat');
              setTimeout(() => { onSelectChat(); setIsOpen(false); }, 300);
            }}
            className="flex items-center gap-5 group/opt bg-white/95 hover:bg-[#006C35] backdrop-blur-3xl p-3 pr-10 rounded-full border border-black/5 transition-magic hover:scale-110 shadow-[0_25px_60px_rgba(0,0,0,0.15)] relative overflow-hidden group/chat"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-emerald-400/10 to-emerald-400/0 -translate-x-full group-hover/opt:translate-x-full transition-transform duration-1000"></div>
            <span className="text-[#006C35] group-hover/opt:text-white font-black text-sm uppercase tracking-[0.2em]">محادثة نصية</span>
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center group-hover/opt:bg-emerald-400/20 group-hover/opt:scale-110 transition-all duration-500 border border-emerald-100 shadow-sm relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent group-hover/opt:from-white/20"></div>
               <MessageCircleMore size={30} className="text-[#006C35] group-hover/opt:text-white transition-transform duration-500 group-hover/chat:-rotate-12 group-hover/chat:scale-110 z-10" />
               <Zap size={14} className="absolute top-2 right-2 text-emerald-400 opacity-0 group-hover/chat:opacity-100 group-hover/chat:animate-pulse transition-opacity delay-200" />
               
              {menuParticles.filter(p => p.target === 'chat').map(p => (
                <div key={p.id} className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div 
                    className="absolute animate-sparkle-burst" 
                    style={{ 
                      '--tx': p.tx, '--ty': p.ty, '--s': p.s, '--d': p.d, '--r': p.r, '--sr': p.sr,
                      animationDelay: p.delay
                    } as React.CSSProperties}
                  >
                    <Sparkles size={8} style={{ color: p.color }} />
                  </div>
                </div>
              ))}
            </div>
          </button>

          {/* Enhanced Voice Option */}
          <button 
            onClick={() => { 
              triggerBurst('voice');
              setTimeout(() => { onSelectVoice(); setIsOpen(false); }, 300);
            }}
            className="flex items-center gap-5 group/opt bg-white/95 hover:bg-[#d4af37] backdrop-blur-3xl p-3 pr-10 rounded-full border border-black/5 transition-magic hover:scale-110 shadow-[0_25px_60px_rgba(0,0,0,0.15)] relative overflow-hidden group/voice"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/20 to-amber-400/0 -translate-x-full group-hover/opt:translate-x-full transition-transform duration-1000"></div>
            <span className="text-[#d4af37] group-hover/opt:text-white font-black text-sm uppercase tracking-[0.2em]">استشارة صوتية</span>
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center group-hover/opt:bg-amber-400/20 group-hover/opt:scale-110 transition-all duration-500 border border-amber-100 shadow-sm relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent group-hover/opt:from-white/20"></div>
               <MicVocal size={30} className="text-[#d4af37] group-hover/opt:text-white transition-transform duration-500 group-hover/voice:scale-125 z-10" />
               <div className="absolute inset-0 bg-amber-400/20 rounded-full scale-0 group-hover/voice:animate-ping opacity-0 group-hover/voice:opacity-100"></div>
               
              {menuParticles.filter(p => p.target === 'voice').map(p => (
                <div key={p.id} className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div 
                    className="absolute animate-sparkle-burst" 
                    style={{ 
                      '--tx': p.tx, '--ty': p.ty, '--s': p.s, '--d': p.d, '--r': p.r, '--sr': p.sr,
                      animationDelay: p.delay
                    } as React.CSSProperties}
                  >
                    <Sparkles size={8} style={{ color: p.color }} />
                  </div>
                </div>
              ))}
            </div>
          </button>

          {/* Enhanced Call Option */}
          <button 
            onClick={handleCallRequest}
            className="flex items-center gap-5 group/opt bg-white/95 hover:bg-emerald-600 backdrop-blur-3xl p-3 pr-10 rounded-full border border-black/5 transition-magic hover:scale-110 shadow-[0_25px_60px_rgba(0,0,0,0.15)] relative overflow-hidden group/call"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/opt:translate-x-full transition-transform duration-1000"></div>
            <span className="text-emerald-700 group-hover/opt:text-white font-black text-sm uppercase tracking-[0.2em]">اتصال مباشر</span>
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center group-hover/opt:bg-emerald-500/20 group-hover/opt:scale-110 transition-all duration-500 border border-emerald-100 shadow-sm relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent group-hover/opt:from-white/20"></div>
               <PhoneForwarded size={28} className="text-emerald-700 group-hover/opt:text-white transition-transform duration-500 group-hover/call:translate-x-1 group-hover/call:-translate-y-1 z-10" />
               <BellRing size={12} className="absolute top-2 left-2 text-emerald-600 opacity-0 group-hover/call:opacity-100 animate-bounce transition-opacity" />
               
              {menuParticles.filter(p => p.target === 'call').map(p => (
                <div key={p.id} className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div 
                    className="absolute animate-sparkle-burst" 
                    style={{ 
                      '--tx': p.tx, '--ty': p.ty, '--s': p.s, '--d': p.d, '--r': p.r, '--sr': p.sr,
                      animationDelay: p.delay
                    } as React.CSSProperties}
                  >
                    <Sparkles size={8} style={{ color: p.color }} />
                  </div>
                </div>
              ))}
            </div>
          </button>
        </div>

        <div className={`relative transition-magic ${isHovered && !isOpen ? 'scale-110' : 'scale-100'}`}>
          {showSparkles && sparkles.map((s, i) => (
            <div 
              key={i}
              className="absolute left-1/2 top-1/2 z-50 pointer-events-none"
              style={{ 
                '--tx': s.tx, '--ty': s.ty, '--s': s.s, '--d': s.d, '--r': s.r 
              } as React.CSSProperties}
            >
              <Sparkles 
                size={18} 
                className="text-emerald-400 animate-sparkle-burst" 
                style={{ animationDelay: s.delay }}
              />
            </div>
          ))}

          {/* Tooltip Label */}
          <div className={`absolute right-full mr-12 top-1/2 -translate-y-1/2 transition-magic whitespace-nowrap ${isHovered && !isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-16 pointer-events-none'}`}>
            <div className="bg-[#006C35]/90 backdrop-blur-3xl px-8 py-4 rounded-full border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.1)] border-r-emerald-500 border-r-4 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-2000"></div>
              <p className="text-white font-black text-base tracking-wide relative">يا مرحبا.. أبشر بسعدك</p>
            </div>
          </div>

          <button
            onClick={toggleMenu}
            style={{ 
              transform: `translate(${mousePos.x}px, ${mousePos.y}px) ${isOpen ? 'rotate(90deg)' : ''}` 
            }}
            className={`relative w-36 h-36 md:w-44 md:h-44 flex items-center justify-center transition-all duration-500 ease-out animate-magic-float group/btn rounded-full overflow-visible`}
          >
            {/* Subtle Idle Pulsing Glow - Complements Asiri Green */}
            {!isOpen && !isHovered && (
              <div className="absolute inset-[-10%] bg-gradient-to-br from-[#10b981]/30 to-[#006C35]/20 blur-3xl rounded-full animate-pulse-gentle pointer-events-none"></div>
            )}

            {/* Magical Rotating Outer Rings */}
            <div className={`absolute inset-[-12%] rounded-full transition-opacity duration-1000 ${isOpen ? 'opacity-0' : 'opacity-100 animate-rotate-slow'}`}>
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id="magicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="50%" stopColor="#d4af37" />
                            <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                    </defs>
                    <circle cx="50" cy="50" r="48" fill="none" stroke="url(#magicGradient)" strokeWidth="0.6" className="animate-dash-flow opacity-60" />
                    <circle cx="50" cy="2" r="2.5" fill="#d4af37" className="animate-pulse shadow-lg" />
                </svg>
            </div>
            
            <div className={`absolute inset-[-6%] rounded-full transition-opacity duration-1000 ${isOpen ? 'opacity-0' : 'opacity-100 animate-rotate-slow-reverse'}`}>
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                    <circle cx="50" cy="50" r="48" fill="none" stroke="#10b981" strokeWidth="0.3" strokeDasharray="1, 10" className="opacity-40" />
                </svg>
            </div>

            {/* Main Circular Body with prominent Asiri Gradient */}
            <div className={`relative w-full h-full rounded-full flex items-center justify-center shadow-[0_30px_70px_rgba(0,0,0,0.3)] border-[6px] overflow-hidden transition-magic ${isOpen ? 'border-emerald-400 bg-gradient-to-br from-[#006C35] to-[#10b981]' : 'border-white bg-white'} ${!isOpen && !isHovered ? 'animate-pulse-gentle' : ''}`}>
              
              <div className={`absolute inset-0 transition-opacity duration-1000 ${isOpen ? 'opacity-30' : 'opacity-100'}`}>
                <img 
                  src="https://images.unsplash.com/photo-1543333991-a7c58e747306?q=80&w=600&auto=format&fit=crop" 
                  alt="سارة العسيري" 
                  className={`w-full h-full object-cover transition-all duration-[3s] ${isHovered ? 'scale-110' : 'scale-100'} ${!isOpen ? 'brightness-110' : 'brightness-75'}`}
                />
                {/* Asiri Green Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#004225]/80 via-transparent to-transparent"></div>
                <div className="shimmer-effect opacity-20"></div>
              </div>

              {/* Interaction Elements */}
              <div className="relative z-10 flex flex-col items-center justify-center transition-magic w-full h-full">
                {isOpen ? (
                  <X size={52} className="text-white animate-in spin-in-90 duration-700" />
                ) : (
                  <div className={`flex flex-col items-center justify-end h-full pb-6 w-full transition-all duration-700 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-100'}`}>
                    
                    {/* Stars/Action Indicator */}
                    <div className={`mb-auto pt-6 transition-all duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}>
                       <Stars size={34} className="text-white/80 animate-pulse drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                    </div>

                    {/* Integrated Label Badge with Upward Drift Animation */}
                    <div className={`px-4 py-2 bg-gradient-to-r from-emerald-600/90 to-emerald-800/90 backdrop-blur-xl rounded-full border border-white/30 shadow-[0_8px_20px_rgba(0,0,0,0.4)] transform transition-all duration-500 ${isHovered ? '-translate-y-4 scale-110 shadow-[0_15px_30px_rgba(0,0,0,0.5)]' : 'translate-y-0 scale-100'}`}>
                      <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] drop-shadow-md whitespace-nowrap">سارة العسيري</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Idle State Icon Overlay */}
              {!isOpen && !isHovered && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in fade-in duration-700">
                   <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/40 shadow-2xl">
                      <Volume2 size={24} className="text-white animate-pulse" />
                   </div>
                </div>
              )}
            </div>

            {/* Multi-layered Outer Ripple Effect */}
            <div className={`absolute inset-[-10%] rounded-full border-2 border-emerald-400/30 transition-all duration-1000 ${isHovered && !isOpen ? 'scale-125 opacity-0' : 'scale-100 opacity-0'}`}></div>
            <div className={`absolute inset-[-20%] rounded-full border border-emerald-500/10 transition-all duration-1500 delay-100 ${isHovered && !isOpen ? 'scale-150 opacity-0' : 'scale-100 opacity-0'}`}></div>
          </button>
        </div>
      </div>
    </>
  );
};

export default FloatingCallBubble;
