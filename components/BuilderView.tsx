
import React, { useState } from 'react';

const BuilderView: React.FC = () => {
  const [components, setComponents] = useState<string[]>([]);

  const addComp = (name: string) => setComponents([...components, name]);
  const clear = () => setComponents([]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-full">
      <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-[32px] p-6 backdrop-blur-xl">
        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 italic">Bileşen Kütüphanesi</h3>
        <div className="space-y-3">
          {[
            { name: 'Buton', icon: 'fas fa-square' },
            { name: 'Metin Alanı', icon: 'fas fa-font' },
            { name: 'Görsel Panel', icon: 'fas fa-image' },
            { name: 'Grafik Motoru', icon: 'fas fa-chart-bar' },
            { name: 'Veri Tablosu', icon: 'fas fa-table' }
          ].map(item => (
            <button 
              key={item.name}
              onClick={() => addComp(item.name)}
              className="w-full flex items-center gap-4 px-4 py-4 bg-black/40 border border-white/5 rounded-2xl text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all text-xs font-bold uppercase tracking-widest"
            >
              <i className={item.icon}></i>
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-3 flex flex-col gap-6">
        <div className="flex-1 bg-black/40 border border-white/10 rounded-[40px] p-10 relative overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
              <i className="fas fa-layer-group text-cyan-400"></i>
              Tasarım Tuvali
            </h3>
            <button onClick={clear} className="px-6 py-2 bg-white/5 hover:bg-red-500/20 text-red-400 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
              Tuvali Temizle
            </button>
          </div>

          <div className="flex-1 border-2 border-dashed border-white/5 rounded-[32px] p-8 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
            {components.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                <i className="fas fa-plus-circle text-6xl mb-4"></i>
                <p className="font-bold uppercase tracking-widest text-sm">Bileşen eklemek için soldaki paneli kullanın</p>
              </div>
            ) : (
              components.map((c, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex justify-between items-center animate-in zoom-in duration-300">
                  <span className="text-xs font-black uppercase tracking-widest text-gray-300">{c} Modülü #{i+1}</span>
                  <div className="flex gap-2">
                    <button className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-gray-500 hover:text-white transition-colors"><i className="fas fa-edit text-[10px]"></i></button>
                    <button className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"><i className="fas fa-trash text-[10px]"></i></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuilderView;
