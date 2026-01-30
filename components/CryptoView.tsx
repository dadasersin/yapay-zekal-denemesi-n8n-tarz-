
import React, { useState, useEffect, useRef } from 'react';

const CryptoView: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        const indicators = ["SMA", "EMA", "RSI", "MACD", "VWAP"];
        const ind = indicators[Math.floor(Math.random() * indicators.length)];
        const action = Math.random() > 0.5 ? "AL sinyali üretildi" : "SAT sinyali üretildi";
        addLog(`${ind} Filtresi: ${action} (+${(Math.random() * 2).toFixed(2)}%)`);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isRunning]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">Algoritmik Veri Motoru</h3>
            <span className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${isRunning ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-800 text-gray-500'}`}>
              {isRunning ? 'Çalışıyor' : 'Beklemede'}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-8">
            {["SMA", "EMA", "RSI", "MACD", "VWAP", "TEMA"].map(ind => (
              <div key={ind} className="flex items-center gap-3 p-4 bg-black/40 border border-white/5 rounded-2xl">
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-cyan-500 bg-transparent border-white/10" />
                <span className="text-xs font-bold text-gray-400">{ind}</span>
              </div>
            ))}
          </div>

          <div className="bg-black rounded-2xl border border-white/10 p-6 h-64 overflow-y-auto custom-scrollbar font-mono text-[11px]">
            {logs.length === 0 && <p className="text-gray-700 text-center py-20">Motoru başlatmak için strateji seçin...</p>}
            {logs.map((log, i) => (
              <div key={i} className="mb-1 text-cyan-400/80">
                <span className="opacity-40">{log.split(' ')[0]}</span> {log.split(' ').slice(1).join(' ')}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-gradient-to-br from-indigo-900/20 to-black border border-white/10 rounded-[32px] p-8">
          <h4 className="text-sm font-black text-white uppercase tracking-widest mb-6">Strateji Kontrolü</h4>
          <div className="space-y-4">
            <button 
              onClick={() => { setIsRunning(true); addLog("Sistem senkronize edildi. Motor başlatılıyor..."); }}
              disabled={isRunning}
              className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-800 text-black font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-cyan-500/20"
            >
              Stratejiyi Başlat
            </button>
            <button 
              onClick={() => { setIsRunning(false); addLog("Motor durduruldu."); }}
              disabled={!isRunning}
              className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest rounded-2xl transition-all border border-white/10"
            >
              Durdur
            </button>
          </div>
          
          <div className="mt-10 p-4 bg-white/5 rounded-2xl border border-white/5">
            <p className="text-[10px] text-gray-500 uppercase font-black mb-2">Başarı Oranı</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-black text-white italic">84.2%</span>
              <span className="text-[10px] text-green-400 mb-1">+2.4%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoView;
