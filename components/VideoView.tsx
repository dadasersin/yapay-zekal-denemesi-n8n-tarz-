
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';

interface VideoViewProps {
  apiKeyReady: boolean;
  onOpenKeyPicker: () => void;
}

const VideoView: React.FC<VideoViewProps> = ({ apiKeyReady, onOpenKeyPicker }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBaseImage((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  };

  const handleGenerateVideo = async () => {
    if (!apiKeyReady) { onOpenKeyPicker(); return; }
    if (!prompt.trim() && !baseImage || isGenerating) return;

    setIsGenerating(true);
    setVideoUrl(null);
    setLoadingStep('Nöral Kanallar Başlatılıyor...');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let videoRequest: any = {
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: aspectRatio }
      };

      if (baseImage) {
        videoRequest.image = { imageBytes: baseImage, mimeType: 'image/png' };
      }

      let operation = await ai.models.generateVideos(videoRequest);

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
        setLoadingStep(`Temporal Kareler Sentezleniyor... (%${operation.metadata?.progress || 0})`);
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await response.blob();
        setVideoUrl(URL.createObjectURL(blob));
      }
    } catch (error: any) {
      console.error("Video Error:", error);
    } finally {
      setIsGenerating(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white/5 border border-white/10 rounded-[40px] p-10 backdrop-blur-xl">
        <h3 className="text-2xl font-black italic text-white mb-8 uppercase tracking-tighter">Sinematik Hareket Sentezi</h3>
        
        <div className="space-y-6">
          <div className="flex gap-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 p-4 rounded-2xl border transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 ${baseImage ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/30'}`}
            >
              <i className="fas fa-image"></i> {baseImage ? 'Görsel Hazır' : 'Fotoğrafı Videoya Dönüştür'}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
            
            <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10">
              <button onClick={() => setAspectRatio('16:9')} className={`px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${aspectRatio === '16:9' ? 'bg-cyan-500 text-black' : 'text-gray-500'}`}>16:9</button>
              <button onClick={() => setAspectRatio('9:16')} className={`px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${aspectRatio === '9:16' ? 'bg-cyan-500 text-black' : 'text-gray-500'}`}>9:16</button>
            </div>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Holografik bir İstanbul üzerinde süzülen drone çekimi, neon ışıklar, sinematik ağır çekim..."
            className="w-full bg-black/40 border border-white/10 rounded-[32px] p-8 text-gray-200 focus:border-cyan-500 transition-all min-h-[160px] resize-none text-lg placeholder:text-gray-800"
          />

          <button
            onClick={handleGenerateVideo}
            disabled={isGenerating || (!prompt.trim() && !baseImage)}
            className="w-full py-5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-800 text-black font-black uppercase tracking-widest rounded-[24px] shadow-xl transition-all"
          >
            {isGenerating ? "Temporal Motor Aktif..." : "Sinematik Diziyi Üret"}
          </button>
        </div>
      </div>

      <div className="aspect-video w-full bg-black/40 rounded-[40px] border border-white/10 flex items-center justify-center relative overflow-hidden">
        {videoUrl ? (
          <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
        ) : isGenerating ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-cyan-400 font-bold uppercase tracking-widest text-xs">{loadingStep}</p>
          </div>
        ) : (
          <div className="text-center opacity-20">
            <i className="fas fa-film text-6xl mb-4"></i>
            <p className="font-bold uppercase tracking-widest text-xs">Temporal çıktı burada görünecek</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoView;
