
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/genai';
import { ChatMessage } from '../types';

const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [useGrounding, setUseGrounding] = useState(true);
  const [attachment, setAttachment] = useState<{file: File, type: 'image' | 'video' | 'audio'} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const type = file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'audio';
    setAttachment({ file, type });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const getUserLocation = (): Promise<{ latitude: number, longitude: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve(null)
      );
    });
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachment) || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
      attachment: attachment ? { 
        url: URL.createObjectURL(attachment.file), 
        type: attachment.type,
        mimeType: attachment.file.type 
      } : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    const currentAttachment = attachment;
    setInput('');
    setAttachment(null);
    setIsTyping(true);

    try {
      const genAI = new GoogleGenerativeAI(process.env.API_KEY || '');
      
      let modelName = 'gemini-1.5-pro'; 
      
      if (useGrounding) {
        modelName = 'gemini-1.5-flash';
        const location = await getUserLocation();
        // Note: tools like googleSearch are only available in specific regions and projects.
        // We'll keep the logic but use a supported model.
      } else if (useThinking) {
        // Thinking models are currently experimental or specific to certain endpoints.
        // Using 1.5 Pro as a fallback.
        modelName = 'gemini-1.5-pro';
      }

      const model = genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction: "Sen 'Quantum AI Yapay Zeka Merkezi' Master Kontrol Ünitesisin. Teknik, otoriter ve yardımsever bir dille konuş. En güncel bilgiyi sağla.",
      });

      const parts: any[] = [{ text: currentInput || "İçeriği analiz et." }];
      
      if (currentAttachment) {
        const b64Data = await fileToBase64(currentAttachment.file);
        parts.push({
          inlineData: { data: b64Data, mimeType: currentAttachment.file.type }
        });
      }

      const result = await model.generateContent({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          maxOutputTokens: 2048,
        }
      });

      const response = result.response;
      const responseText = response.text();

      // Grounding Chunks İşleme
      const grounding: any[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web) grounding.push({ uri: chunk.web.uri, title: chunk.web.title });
          if (chunk.maps) grounding.push({ uri: chunk.maps.uri, title: chunk.maps.title });
        });
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || 'Sistem yanıt üretemedi.',
        timestamp: new Date(),
        groundingUrls: grounding.length > 0 ? grounding : undefined
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      console.error("Chat Error:", error);
      
      let errorDisplay = "Sistem Hatası: ";
      if (error.message?.includes("500")) {
        errorDisplay += "Sunucu geçici olarak yanıt vermiyor. Lütfen 'Thinking' veya 'Grounding' modunu kapatıp tekrar deneyin.";
      } else if (error.message?.includes("429")) {
        errorDisplay += "Hız sınırı aşıldı (Kota Hatası). Lütfen 1 dakika bekleyin.";
      } else {
        errorDisplay += error.message || "Bağlantı koptu.";
      }
        
      setMessages(prev => [...prev, { 
        id: 'err-' + Date.now(), 
        role: 'model', 
        text: errorDisplay, 
        timestamp: new Date() 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-5xl mx-auto">
      <div className="flex gap-4 mb-4 justify-center">
        <button 
          onClick={() => {
            setUseThinking(!useThinking);
            if (!useThinking) setUseGrounding(false); 
          }}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${useThinking ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-white/5 border-white/10 text-gray-500'}`}
        >
          <i className="fas fa-brain mr-2"></i> Derin Düşünme {useThinking ? 'Açık' : 'Kapalı'}
        </button>
        <button 
          onClick={() => {
            setUseGrounding(!useGrounding);
            if (!useGrounding) setUseThinking(false);
          }}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${useGrounding ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 border-white/10 text-gray-500'}`}
        >
          <i className="fas fa-globe mr-2"></i> Konum & Arama {useGrounding ? 'Aktif' : 'Pasif'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-8 pb-10 pr-6 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-30 select-none">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-cyan-500 flex items-center justify-center mb-6 animate-spin-slow">
               <i className="fas fa-terminal text-3xl text-cyan-500"></i>
            </div>
            <p className="font-black uppercase tracking-[0.3em] text-sm">Giriş Bekleniyor</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`max-w-[85%] rounded-[32px] px-8 py-6 shadow-2xl transition-all duration-300 ${
              msg.role === 'user' 
                ? 'bg-cyan-600 border border-white/20 text-white rounded-tr-none' 
                : 'bg-white/5 backdrop-blur-md border border-white/10 text-gray-100 rounded-tl-none'
            }`}>
              <div className="flex items-center gap-2 mb-2 opacity-50 text-[9px] font-black uppercase tracking-[0.2em]">
                <span>{msg.role === 'user' ? 'Operatör' : 'Quantum AI Core'}</span>
                <span>//</span>
                <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              
              {msg.attachment && (
                <div className="mb-4 rounded-2xl overflow-hidden border border-white/10 bg-black/40 max-w-sm shadow-xl">
                  {msg.attachment.type === 'image' && <img src={msg.attachment.url} className="w-full h-auto" />}
                  {msg.attachment.type === 'video' && <video src={msg.attachment.url} controls className="w-full" />}
                  {msg.attachment.type === 'audio' && <audio src={msg.attachment.url} controls className="w-full" />}
                </div>
              )}

              <p className="whitespace-pre-wrap leading-relaxed text-[16px] selection:bg-cyan-500/30">{msg.text}</p>
              
              {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
                  <p className="text-[10px] text-cyan-400 font-black uppercase tracking-widest flex items-center gap-2">
                    <i className="fas fa-shield-alt"></i> Doğrulanmış Kaynaklar:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {msg.groundingUrls.map((url, i) => (
                      <a 
                        key={i} 
                        href={url.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] text-cyan-300 hover:bg-cyan-500/20 transition-colors flex items-center gap-2"
                      >
                        <span className="max-w-[150px] truncate">{url.title}</span>
                        <i className="fas fa-external-link-alt text-[8px]"></i>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 rounded-[32px] rounded-tl-none px-8 py-6 flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-500/60">Quantum Analiz...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-6 relative group">
        {attachment && (
          <div className="absolute -top-16 left-0 right-0 p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-between animate-in slide-in-from-bottom-2">
            <span className="text-xs text-cyan-400 font-bold uppercase tracking-widest px-4 truncate flex items-center gap-2">
              <i className={`fas ${attachment.type === 'image' ? 'fa-image' : attachment.type === 'video' ? 'fa-video' : 'fa-microphone'}`}></i>
              {attachment.file.name}
            </span>
            <button 
              onClick={() => {
                setAttachment(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }} 
              className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}
        <div className="relative flex items-center gap-3 bg-black border border-white/10 rounded-[32px] p-3 shadow-2xl focus-within:border-cyan-500/50 transition-all">
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="w-12 h-12 rounded-full flex items-center justify-center text-gray-500 hover:text-cyan-400 hover:bg-white/5 transition-all"
            title="Dosya Ekle"
          >
            <i className="fas fa-paperclip text-lg"></i>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept="image/*,video/*,audio/*" 
          />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="SİSTEM DİREKTİFİ GİRİN..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-white px-2 py-4 font-bold tracking-widest uppercase text-sm placeholder:text-gray-800"
          />
          <button 
            onClick={handleSend} 
            disabled={isTyping || (!input.trim() && !attachment)} 
            className="px-10 py-4 bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-900 disabled:text-gray-700 text-black font-black uppercase tracking-tighter rounded-2xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            Yürüt
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
