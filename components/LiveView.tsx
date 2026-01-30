
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/genai';

const LiveView: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcription, setTranscription] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const frameIntervalRef = useRef<number | null>(null);

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
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

  const createBlob = (data: Float32Array): any => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const handleCleanup = () => {
    setIsActive(false);
    setIsInitializing(false);
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (e) { }
      sessionRef.current = null;
    }
    if (frameIntervalRef.current) {
      window.clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    if (inputAudioContextRef.current) {
      try { inputAudioContextRef.current.close(); } catch (e) { }
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      try { outputAudioContextRef.current.close(); } catch (e) { }
      outputAudioContextRef.current = null;
    }
    sourcesRef.current.forEach(s => {
      try { s.stop(); } catch (e) { }
    });
    sourcesRef.current.clear();

    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const startSession = async () => {
    setIsInitializing(true);
    setErrorMsg(null);
    try {
      const apiKey = (process as any).env.API_KEY || '';
      const genAI = new GoogleGenerativeAI(apiKey);
      console.log("Checking GenAI instance:", genAI);

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: isCameraActive
        });
      } catch (err: any) {
        if (isCameraActive && (err.name === 'NotFoundError' || err.name === 'NotAllowedError')) {
          console.warn("Kamera bulunamadı veya reddedildi, sadece ses ile devam ediliyor.");
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setIsCameraActive(false);
          setErrorMsg("Uyarı: Kamera erişimi sağlanamadı. Oturum sadece sesli olarak başlatılıyor.");
        } else {
          throw err;
        }
      }

      if (isCameraActive && videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputAudioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      // NOTE: ai.live.connect is not part of the standard @google/genai SDK yet.
      // This is a placeholder for future extension or experimental usage.
      setErrorMsg("HATA: Multimodal Live API bu sistemde henüz yapılandırılmadı.");
      setIsInitializing(false);
      handleCleanup();

    } catch (err: any) {
      console.error("Oturum başlatılamadı:", err);
      setIsInitializing(false);
      if (err.name === 'NotFoundError') {
        setErrorMsg("Donanım hatası: Mikrofon veya kamera bulunamadı.");
      } else if (err.name === 'NotAllowedError') {
        setErrorMsg("İzin hatası: Tarayıcı donanım erişimini engelledi.");
      } else {
        setErrorMsg("Başlatma başarısız: " + (err.message || "Bilinmeyen bir hata oluştu."));
      }
    }
  };

  useEffect(() => {
    return () => handleCleanup();
  }, []);

  return (
    <div className="flex flex-col h-full gap-8 max-w-6xl mx-auto">
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <i className="fas fa-exclamation-triangle text-red-500"></i>
            <span className="text-xs font-bold text-red-200 uppercase tracking-widest">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-white transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        <div className="lg:col-span-5 flex flex-col items-center gap-10">
          <div className="relative group">
            <div className={`absolute -inset-16 bg-cyan-500/20 rounded-full blur-[100px] transition-all duration-1000 ${isActive ? 'opacity-100 scale-125 animate-pulse' : 'opacity-0 scale-75'}`}></div>

            <div className={`relative w-64 h-64 rounded-[4rem] border-4 flex items-center justify-center transition-all duration-700 ${isActive ? 'bg-black border-cyan-400 shadow-[0_0_80px_rgba(34,211,238,0.4)]' : 'bg-white/5 border-white/10'}`}>
              {!isActive ? (
                <div className="flex flex-col items-center gap-6 text-center px-8">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform ${isInitializing ? 'bg-gray-800' : 'bg-cyan-500'}`}>
                    <i className={`fas ${isInitializing ? 'fa-spinner animate-spin' : 'fa-microphone'} text-3xl ${isInitializing ? 'text-cyan-500' : 'text-black'}`}></i>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">{isInitializing ? 'Bağlanıyor...' : 'Bağlantı Bekleniyor'}</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">Neural Audio Core v2.5</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-8">
                  <div className="flex items-end gap-2 h-20">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 rounded-full bg-gradient-to-t from-cyan-600 to-cyan-400 animate-pulse"
                        style={{
                          height: `${30 + Math.random() * 70}%`,
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: '0.5s'
                        }}
                      ></div>
                    ))}
                  </div>
                  <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] animate-pulse">Omni-Link Aktif</p>
                </div>
              )}
            </div>
          </div>

          <div className="w-full space-y-4">
            {!isActive ? (
              <>
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-200 uppercase tracking-widest">Kamera Erişimi</span>
                    <span className="text-[8px] text-gray-500 uppercase font-black">Video-in Modu</span>
                  </div>
                  <button
                    onClick={() => setIsCameraActive(!isCameraActive)}
                    disabled={isInitializing}
                    className={`w-12 h-6 rounded-full relative transition-all ${isCameraActive ? 'bg-cyan-500' : 'bg-gray-800'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isCameraActive ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>
                <button
                  onClick={startSession}
                  disabled={isInitializing}
                  className="w-full py-5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-800 disabled:text-gray-600 text-black font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3"
                >
                  <i className={`fas ${isInitializing ? 'fa-spinner animate-spin' : 'fa-plug'}`}></i> {isInitializing ? 'Başlatılıyor...' : 'Sistemi Başlat'}
                </button>
              </>
            ) : (
              <button
                onClick={handleCleanup}
                className="w-full py-5 bg-red-500 hover:bg-red-400 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3"
              >
                <i className="fas fa-times-circle"></i> Bağlantıyı Kes
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col gap-6 h-[calc(100vh-14rem)]">
          {isActive && isCameraActive && (
            <div className="h-1/3 bg-black rounded-3xl border border-white/10 overflow-hidden relative shadow-2xl animate-in zoom-in duration-500">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover grayscale opacity-60"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-[8px] font-black text-white uppercase tracking-widest">Canlı Görüntü</span>
              </div>
            </div>
          )}

          <div className={`flex-1 bg-white/5 border border-white/10 rounded-[40px] p-8 flex flex-col overflow-hidden backdrop-blur-xl ${!isCameraActive || !isActive ? 'h-full' : ''}`}>
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-3">
              <i className="fas fa-terminal text-cyan-500"></i> İşlem Logları
            </h3>
            <div className="flex-1 overflow-y-auto space-y-4 pr-4 custom-scrollbar">
              {transcription.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                  <i className="fas fa-comment-dots text-4xl mb-4"></i>
                  <p className="text-[10px] font-black uppercase tracking-widest">Sinyal bekleniyor...</p>
                </div>
              ) : (
                transcription.map((t, i) => (
                  <div key={i} className={`flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2`}>
                    <span className={`text-[8px] font-black uppercase tracking-widest ${t.role === 'user' ? 'text-cyan-500' : 'text-indigo-400'}`}>
                      {t.role === 'user' ? 'Girdi' : 'Yanıt'}
                    </span>
                    <p className={`text-sm leading-relaxed ${t.role === 'user' ? 'text-gray-300' : 'text-white font-medium italic'}`}>
                      {t.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
              <span className="text-[8px] font-black text-gray-600 uppercase mb-1">Gecikme</span>
              <span className="text-xs font-mono text-cyan-400">{isActive ? '142ms' : '--'}</span>
            </div>
            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
              <span className="text-[8px] font-black text-gray-600 uppercase mb-1">Durum</span>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-gray-600'}`}></div>
                <span className="text-xs font-mono text-cyan-400">{isActive ? 'Aktif' : 'Çevrimdışı'}</span>
              </div>
            </div>
            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
              <span className="text-[8px] font-black text-gray-600 uppercase mb-1">Codec</span>
              <span className="text-xs font-mono text-cyan-400">{isActive ? 'PCM_S16' : '--'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveView;
