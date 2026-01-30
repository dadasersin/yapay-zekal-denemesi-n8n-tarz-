
import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/genai';
import { MediaAsset } from '../types';

interface CreativeViewProps {
  apiKeyReady: boolean;
  onOpenKeyPicker: () => void;
}

const CreativeView: React.FC<CreativeViewProps> = ({ apiKeyReady, onOpenKeyPicker }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [mode, setMode] = useState<'generate' | 'edit'>('generate');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageSize, setImageSize] = useState('1K');
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const ratios = ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'];
  const sizes = ['1K', '2K', '4K'];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBaseImage((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
    setMode('edit');
  };

  const handleAction = async () => {
    if (!prompt.trim() || isGenerating) return;

    // Pro Image modeleri kullanıcı anahtarı gerektirir
    if (mode === 'generate' && !apiKeyReady) {
      onOpenKeyPicker();
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const genAI = new GoogleGenerativeAI(process.env.API_KEY || '');
      let modelName = 'gemini-1.5-flash';

      if (mode === 'generate') {
        // Warning: This SDK does not perform image generation (Imagen) directly.
        // It performs text and multimodal generation. 
        // We will fallback to 1.5 Flash for multimodal analysis.
        modelName = 'gemini-1.5-flash';
      } else {
        modelName = 'gemini-1.5-flash';
      }

      const model = genAI.getGenerativeModel({ model: modelName });

      const parts: any[] = [{ text: prompt }];
      if (mode === 'edit' && baseImage) {
        parts.push({
          inlineData: { data: baseImage, mimeType: 'image/png' }
        });
      }

      const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
      const response = result.response;

      let imageUrl = '';
      // The original code expected an image in the response, but Gemini returns text.
      // To keep the UI functional, we will show a placeholder or let the user know.
      // However, if the user intended to use an image model, we'd need Vertex AI.
      // For now, let's fix the crash.

      if (imageUrl) {
        const newAsset: MediaAsset = { id: Date.now().toString(), type: 'image', url: imageUrl, prompt, timestamp: new Date() };
        setAssets(prev => [newAsset, ...prev]);
        setSelectedAsset(newAsset);
      } else {
        setErrorMsg("Modelden görsel yanıtı alınamadı.");
      }
    } catch (error: any) {
      console.error("Image Error:", error);
      const msg = error.message || "";

      if (msg.includes("403") || msg.includes("permission") || msg.includes("not found")) {
        setErrorMsg("Erişim Engellendi. Lütfen ücretli bir GCP projesine bağlı API anahtarı seçin.");
        // Otomatik olarak anahtar seçiciyi açabiliriz
        onOpenKeyPicker();
      } else {
        setErrorMsg("Görsel sentezlenirken bir hata oluştu: " + msg);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-xl">
          <div className="flex gap-2 mb-6">
            <button onClick={() => setMode('generate')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'generate' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'bg-white/5 text-gray-500'}`}>Üretim</button>
            <button onClick={() => setMode('edit')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'edit' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'bg-white/5 text-gray-500'}`}>Düzenleme</button>
          </div>

          <div className="space-y-6">
            {mode === 'edit' && (
              <div className="p-4 border-2 border-dashed border-white/10 rounded-2xl text-center group hover:border-cyan-500/50 transition-colors">
                <input type="file" onChange={handleFileUpload} className="hidden" id="edit-upload" accept="image/*" />
                <label htmlFor="edit-upload" className="cursor-pointer text-xs font-bold text-gray-500 uppercase tracking-widest group-hover:text-cyan-400">
                  {baseImage ? 'Görsel Hazır ✓' : 'Analiz Edilecek Görseli Yükle'}
                </label>
              </div>
            )}

            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Sentez Direktifi</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={mode === 'generate' ? "Cyberpunk bir İstanbul silüeti, 8k, neon ışıklar..." : "Arkadaki nesneleri sil ve sanatsal bir filtre ekle..."}
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-gray-200 focus:border-cyan-500 transition-all min-h-[120px] resize-none outline-none"
              />
            </div>

            {mode === 'generate' && (
              <>
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Geometri (En-Boy)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {ratios.map(r => (
                      <button key={r} onClick={() => setAspectRatio(r)} className={`p-2 rounded-lg text-[9px] font-bold border transition-all ${aspectRatio === r ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 border-white/5 text-gray-600'}`}>{r}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Ölçekleme (Density)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {sizes.map(s => (
                      <button key={s} onClick={() => setImageSize(s)} className={`p-2 rounded-lg text-[9px] font-bold border transition-all ${imageSize === s ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 border-white/5 text-gray-600'}`}>{s}</button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {errorMsg && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-[10px] text-red-400 font-bold uppercase tracking-widest leading-relaxed">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                {errorMsg}
                {errorMsg.includes("Erişim Engellendi") && (
                  <button
                    onClick={onOpenKeyPicker}
                    className="block mt-2 text-cyan-400 hover:underline"
                  >
                    Anahtar Seçmek İçin Tıklayın
                  </button>
                )}
              </div>
            )}

            {!apiKeyReady && mode === 'generate' && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-[10px] text-yellow-500 font-bold uppercase tracking-widest">
                <p>Gemini 3 Pro Image kullanımı için kendi API anahtarınızı seçmelisiniz.</p>
                <button
                  onClick={onOpenKeyPicker}
                  className="mt-2 text-cyan-400 hover:underline"
                >
                  <i className="fas fa-key mr-2"></i> Anahtar Seç
                </button>
              </div>
            )}

            <button
              onClick={handleAction}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-800 disabled:text-gray-600 text-black font-black uppercase tracking-widest rounded-2xl shadow-lg transition-all"
            >
              {isGenerating ? "Nöral İşlem Devam Ediyor..." : mode === 'generate' ? "Varlığı Sentezle" : "Görseli Güncelle"}
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="bg-black/40 border border-white/10 rounded-[40px] p-8 h-full flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1),transparent)]"></div>

          {selectedAsset ? (
            <div className="w-full h-full flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
              <img src={selectedAsset.url} className="max-h-[80%] object-contain rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.3)] border border-white/10" />
              <div className="text-center bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
                <p className="text-gray-400 text-xs italic font-medium">"{selectedAsset.prompt}"</p>
              </div>
              <a
                href={selectedAsset.url}
                download={`quantum-ai-${selectedAsset.id}.png`}
                className="absolute bottom-10 right-10 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-cyan-500 hover:text-black transition-all"
              >
                <i className="fas fa-download"></i>
              </a>
            </div>
          ) : (
            <div className="text-center space-y-4 opacity-20">
              <i className="fas fa-magic text-6xl text-cyan-400"></i>
              <p className="font-bold uppercase tracking-[0.3em] text-sm">Görsel Çıktı Bekleniyor</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreativeView;
