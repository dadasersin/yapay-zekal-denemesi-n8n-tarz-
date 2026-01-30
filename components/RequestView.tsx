
import React from 'react';
import { SystemRequest } from '../types';

const RequestView: React.FC = () => {
  const requests: SystemRequest[] = [
    { id: '#1024', topic: 'Quantum API Analizi', date: '28.01', status: 'warning', statusText: 'İşleniyor' },
    { id: '#1023', topic: 'Neon Tema Entegrasyonu', date: '28.01', status: 'success', statusText: 'Tamamlandı' },
    { id: '#1022', topic: 'Gemini 3 Pro Protokolü', date: '27.01', status: 'success', statusText: 'Tamamlandı' },
    { id: '#1021', topic: 'Otonom Kod Üretimi', date: '27.01', status: 'danger', statusText: 'Durduruldu' },
  ];

  return (
    <div className="bg-white/5 border border-white/10 rounded-[40px] p-10 backdrop-blur-xl">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">İstek Yönetimi</h2>
          <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest font-bold">Tüm sistem direktifleri ve durumları</p>
        </div>
        <button className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-cyan-500/20">
          Yeni İstek Oluştur
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-[10px] text-gray-500 uppercase font-black tracking-[0.2em]">
              <th className="px-6 py-4">Protokol No</th>
              <th className="px-6 py-4">Konu / Direktif</th>
              <th className="px-6 py-4">Tarih</th>
              <th className="px-6 py-4">Durum</th>
            </tr>
          </thead>
          <tbody className="text-xs font-bold uppercase tracking-widest">
            {requests.map((r) => (
              <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-6 py-6 text-cyan-400 italic">{r.id}</td>
                <td className="px-6 py-6 text-gray-200">{r.topic}</td>
                <td className="px-6 py-6 text-gray-500">{r.date}</td>
                <td className="px-6 py-6">
                  <span className={`px-3 py-1 rounded-lg text-[9px] ${
                    r.status === 'success' ? 'bg-green-500/10 text-green-400' :
                    r.status === 'warning' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'
                  } border border-current/20`}>
                    {r.statusText}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RequestView;
