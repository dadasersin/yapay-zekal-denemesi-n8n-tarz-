
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';

const AudioLab: React.FC = () => {
  const [textToSpeech, setTextToSpeech] = useState('');
  const [transcription, setTranscription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Yardımcı Fonksiyonlar: PCM Verisini Decode Etme
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

  const handleTTS = async () => {
    if (!textToSpeech.trim() || isProcessing) return;
    setIsProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say clearly and naturally: ${textToSpeech}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          }
        }
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const bytes = decodeBase64(base64Audio);
        const audioBuffer = await decodeAudioData(bytes, audioCtx, 24000, 1);
        
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.start();
      }
    } catch (e) {
      console.error("TTS Hatası:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleTranscribe(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error("Mikrofon erişim hatası:", err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleTranscribe = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const b64 = (reader.result as string).split(',')[1];
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              { inlineData: { data: b64, mimeType: 'audio/webm' } },
              { text: "Lütfen bu ses kaydını tam olarak metne dök ve içeriği analiz et." }
            ]
          }
        });
        setTranscription(response.text || 'Ses dökümü boş döndü.');
      };
    } catch (e) {
      console.error("Transcription Hatası:", e);
      setTranscription("Döküm sırasında bir hata oluştu.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      <div className="bg-white/5 border border-white/10 rounded-[40px] p-10 backdrop-blur-xl">
        <h3 className="text-xl font-black italic text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
          <i className="fas fa-volume-up text-cyan-400"></i> Metinden Sese (TTS)
        </h3>
        <textarea
          value={textToSpeech}
          onChange={(e) => setTextToSpeech(e.target.value)}
          placeholder="Seslendirilmesini istediğiniz metni girin..."
          className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-sm text-gray-200 focus:border-cyan-500 transition-all min-h-[200px] resize-none outline-none"
        />
        <button 
          onClick={handleTTS}
          disabled={isProcessing || !textToSpeech.trim()}
          className="w-full mt-6 py-4 bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-800 text-black font-black uppercase tracking-widest rounded-2xl shadow-lg transition-all"
        >
          {isProcessing ? 'Nöral Sentezleniyor...' : 'Sesi Dinle'}
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[40px] p-10 backdrop-blur-xl">
        <h3 className="text-xl font-black italic text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
          <i className="fas fa-microphone text-purple-400"></i> Ses Dökümü (Transcription)
        </h3>
        <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-white/5 rounded-3xl mb-6">
          <button 
            onMouseDown={startRecording} 
            onMouseUp={stopRecording}
            onMouseLeave={isRecording ? stopRecording : undefined}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 scale-110 shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 'bg-purple-600 hover:bg-purple-500 shadow-xl'}`}
          >
            <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'} text-3xl text-white`}></i>
          </button>
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            {isRecording ? 'Kayıt Yapılıyor...' : 'Kaydetmek için Basılı Tutun'}
          </p>
        </div>
        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 min-h-[150px] font-medium text-sm text-gray-300 custom-scrollbar overflow-y-auto">
          {isProcessing ? (
            <div className="flex items-center gap-2 animate-pulse">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Analiz Ediliyor...</span>
            </div>
          ) : transcription || 'Henüz bir döküm yapılmadı.'}
        </div>
      </div>
    </div>
  );
};

export default AudioLab;
