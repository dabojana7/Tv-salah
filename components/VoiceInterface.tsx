
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { ASIRI_SYSTEM_INSTRUCTION } from '../constants';
import Visualizer from './Visualizer';
// Added X to the imports from lucide-react
import { Mic, Volume2, PhoneOff, VolumeX, Volume1, Volume, BellRing, Sparkles, PhoneCall, X } from 'lucide-react';

const VoiceInterface: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [status, setStatus] = useState('المستشارة جاهزة للرد...');
  const [transcription, setTranscription] = useState('');
  const [volume, setVolume] = useState(1);
  const [prevVolume, setPrevVolume] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  const playFeedbackSound = useCallback(() => {
    try {
      const ctx = outputAudioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.warn('Audio feedback failed', e);
    }
  }, []);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(volume, outputAudioContextRef.current?.currentTime || 0, 0.1);
    }
    if (volume === 0 && isSessionActive) {
      setToastMessage('تم كتم الصوت');
      setShowToast(true);
    }
  }, [volume, isSessionActive]);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const toggleMute = () => {
    playFeedbackSound();
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume || 0.5);
    }
  };

  const handleDirectCall = () => {
    playFeedbackSound();
    const phoneNumber = '0500000000'; // رقم افتراضي لشركة نما عسير
    setToastMessage('جاري تحويلك للمكالمة المباشرة مع فريق المبيعات...');
    setShowToast(true);
    
    setTimeout(() => {
      window.location.href = `tel:${phoneNumber}`;
    }, 1000);
  };

  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number = 24000,
    numChannels: number = 1
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const encodePCM = (data: Float32Array): string => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const stopAllAudio = useCallback(() => {
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  }, []);

  const startSession = async () => {
    try {
      setStatus('جاري الربط مع سارة...');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputAudioContextRef.current = outCtx;
      const gain = outCtx.createGain();
      gain.gain.value = volume;
      gain.connect(outCtx.destination);
      gainNodeRef.current = gain;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          // Fixed typo: responseModalities
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: ASIRI_SYSTEM_INSTRUCTION,
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsSessionActive(true);
            setStatus('سارة تسمعك الآن.. أرحبوا');
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const base64Pcm = encodePCM(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ 
                  media: { data: base64Pcm, mimeType: 'audio/pcm;rate=16000' } 
                });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              setTranscription(prev => prev + ' ' + message.serverContent?.outputTranscription?.text);
            }
            if (message.serverContent?.turnComplete) setTranscription('');
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current && gainNodeRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(gainNodeRef.current);
              source.addEventListener('ended', () => { sourcesRef.current.delete(source); });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }
            if (message.serverContent?.interrupted) stopAllAudio();
          },
          onerror: () => setStatus('حدث خطأ فني'),
          onclose: () => { setIsSessionActive(false); setStatus('انتهت الجلسة'); }
        }
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (err) {
      console.error(err);
      setStatus('تعذر الوصول للميكروفون');
    }
  };

  const endSession = () => {
    stopAllAudio();
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => session.close());
    }
    setIsSessionActive(false);
    onClose();
  };

  const renderVolumeIcon = () => {
    const iconSize = 24;
    if (volume === 0) return <VolumeX size={iconSize} className="text-rose-500" />;
    if (volume <= 0.3) return <Volume size={iconSize} className="text-emerald-600 opacity-60" />;
    if (volume <= 0.7) return <Volume1 size={iconSize} className="text-emerald-600" />;
    return <Volume2 size={iconSize} className="text-emerald-600 animate-pulse" />;
  };

  return (
    <div className="fixed inset-0 bg-[#064e3b]/90 backdrop-blur-2xl z-50 flex flex-col items-center justify-center p-8 text-white text-center animate-in fade-in duration-500">
      
      {/* Premium Notification Toast */}
      <div className={`fixed top-12 px-8 py-4 bg-white rounded-full flex items-center gap-4 border border-emerald-500 shadow-2xl transition-all duration-700 transform z-[60] ${showToast ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0'}`}>
        <div className="bg-emerald-500 p-2 rounded-full">
          <BellRing size={18} className="text-white" />
        </div>
        <span className="text-[#064e3b] font-black text-sm">{toastMessage}</span>
      </div>

      <div className="w-full max-w-xl space-y-12">
        <div className="relative inline-block">
          <div className="absolute inset-[-30px] rounded-full border border-white/20 animate-slow-rotate"></div>
          
          <div className={`relative w-48 h-48 md:w-64 md:h-64 rounded-full border-4 border-white/30 flex items-center justify-center overflow-hidden transition-all duration-1000 shadow-2xl ${isSessionActive ? 'scale-105 shadow-emerald-500/30' : 'opacity-80 scale-100'}`}>
            <img 
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop" 
              alt="سارة" 
              className={`w-full h-full object-cover transition-transform duration-[2s] ${isSessionActive ? 'scale-110' : 'scale-100'}`} 
            />
          </div>
          
          {isSessionActive && (
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white text-[#064e3b] p-5 rounded-full shadow-2xl border-4 border-[#064e3b] animate-bounce">
              <Sparkles className="w-6 h-6" />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-4xl font-black tracking-tight">سارة العسيري</h2>
          <p className="text-emerald-300 font-black text-xl flex items-center justify-center gap-3">
            <span className={`w-2 h-2 rounded-full ${isSessionActive ? 'bg-emerald-300 animate-ping' : 'bg-white/20'}`}></span>
            {status}
          </p>
        </div>

        {/* Interaction Surface */}
        <div className="bg-white/10 p-10 rounded-[3rem] border border-white/10 flex flex-col items-center justify-center relative shadow-2xl backdrop-blur-md">
          <Visualizer isActive={isSessionActive} />
          <div className="mt-8 min-h-[3rem] w-full px-4 text-center">
            <p className="text-lg text-white/90 italic leading-relaxed font-bold">
              {transcription || (isSessionActive ? "تحدثوا، أبشروا بسعدكم..." : "ابدأ المكالمة للحصول على استشارة فورية")}
            </p>
          </div>
          
          <div className="mt-10 w-full max-w-sm flex items-center gap-5 px-6 py-4 bg-white/10 rounded-[2rem] border border-white/10 shadow-inner group">
            <button 
              onClick={toggleMute} 
              className="hover:scale-125 transition-all duration-300 p-3 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center"
            >
              {renderVolumeIcon()}
            </button>
            <input 
              type="range" min="0" max="1" step="0.05" value={volume} 
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="flex-1 accent-white h-2 rounded-lg appearance-none cursor-pointer bg-white/20"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
          {!isSessionActive ? (
            <>
              <button
                onClick={startSession}
                className="group relative bg-white text-[#064e3b] px-10 py-6 rounded-[2.5rem] font-black text-xl flex items-center justify-center gap-4 transition-all hover:scale-105 active:scale-95 shadow-2xl"
              >
                <Mic className="w-7 h-7" />
                <span>ابدأ الكلام</span>
              </button>
              
              <button
                onClick={handleDirectCall}
                className="group relative bg-emerald-700 hover:bg-emerald-800 text-white px-10 py-6 rounded-[2.5rem] font-black text-xl flex items-center justify-center gap-4 transition-all hover:scale-105 active:scale-95 border border-white/10 shadow-xl"
              >
                <PhoneCall className="w-7 h-7" />
                <span className="relative z-10">اتصال مباشر</span>
              </button>
            </>
          ) : (
            <button
              onClick={endSession}
              className="bg-rose-600 hover:bg-rose-700 text-white px-16 py-6 rounded-[2.5rem] font-black text-2xl flex items-center gap-4 transition-all hover:scale-105 active:scale-95 shadow-2xl"
            >
              <PhoneOff className="w-8 h-8" />
              إنهاء
            </button>
          )}
        </div>
      </div>
      
      {!isSessionActive && (
        <button 
          onClick={onClose}
          className="absolute top-10 right-10 p-4 hover:bg-white/10 rounded-full transition-colors text-white/60"
        >
          <X className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default VoiceInterface;
