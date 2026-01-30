
import React, { useState, useCallback, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/genai';
import { WorkflowNode, WorkflowLink } from '../types';

const WorkflowStudio: React.FC = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [links, setLinks] = useState<WorkflowLink[]>([]);
  const [activeTab, setActiveTab] = useState<'visual' | 'code' | 'logs'>('visual');
  const [logs, setLogs] = useState<string[]>([]);
  const [aiPrompt, setAiPrompt] = useState('');

  // Simülasyon Durumları
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [telemetryData, setTelemetryData] = useState<any>(null);
  const [executionResult, setExecutionResult] = useState<string | null>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 50)]);
  };

  const processJson = (content: string) => {
    if (!content.trim()) {
      addLog("HATA: İşlenecek JSON verisi bulunamadı.");
      return;
    }
    try {
      const data = JSON.parse(content);
      addLog("Workflow JSON ayrıştırılıyor...");

      const parsedNodes: WorkflowNode[] = (data.nodes || []).map((n: any) => ({
        id: n.id,
        name: n.name,
        type: n.type,
        position: n.position || [Math.random() * 500, Math.random() * 500],
        parameters: n.parameters
      }));

      const parsedLinks: WorkflowLink[] = [];
      if (data.connections) {
        Object.keys(data.connections).forEach(fromId => {
          const connectionGroup = data.connections[fromId];
          Object.keys(connectionGroup).forEach(connectionType => {
            const outputs = connectionGroup[connectionType];
            outputs.forEach((output: any[]) => {
              output.forEach((target: any) => {
                if (target.node) {
                  parsedLinks.push({ fromNode: fromId, toNode: target.node });
                }
              });
            });
          });
        });
      }

      setNodes(parsedNodes);
      setLinks(parsedLinks);
      setJsonInput(content);
      setExecutionResult(null);
      addLog(`${parsedNodes.length} düğüm ve ${parsedLinks.length} bağlantı başarıyla yüklendi.`);
      setActiveTab('visual');
    } catch (e: any) {
      addLog(`HATA: Geçersiz JSON yapısı - ${e.message}`);
    }
  };

  const handleImport = () => {
    processJson(jsonInput);
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && (file.type === "application/json" || file.name.endsWith('.json'))) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        processJson(content);
      };
      reader.readAsText(file);
      addLog(`Dosya yüklendi: ${file.name}`);
    } else {
      addLog("HATA: Sadece JSON dosyaları kabul edilir.");
    }
  }, []);

  const runSimulation = async () => {
    if (nodes.length === 0) return;
    setIsProcessing(true);
    setSimulationProgress(0);
    setExecutionResult(null);
    addLog("Neural Execution Engine başlatıldı...");

    let step = 0;
    for (const node of nodes) {
      step++;
      setActiveNodeId(node.id);
      setSimulationProgress((step / nodes.length) * 100);
      setTelemetryData(node.parameters || { info: "Sistem Parametresi Yok" });

      addLog(`İşlem Başlıyor: ${node.name}`);

      // Node tipine göre simülasyon mantığı
      if (node.type.includes('googleGemini')) {
        addLog(`>> Gemini Nöral Analiz katmanı aktifleşti.`);
        await new Promise(r => setTimeout(r, 1500));
      } else if (node.type.includes('telegram')) {
        addLog(`>> Harici Sinyal: Telegram API tetiklendi.`);
        await new Promise(r => setTimeout(r, 1000));
      } else {
        await new Promise(r => setTimeout(r, 800));
      }

      addLog(`Düğüm Tamamlandı: ${node.name} [OK]`);
    }

    setActiveNodeId(null);
    setTelemetryData(null);
    setExecutionResult("İş Akışı Başarıyla Yürütüldü. Tüm veriler senkronize edildi.");
    addLog("İş akışı simülasyonu %100 başarıyla tamamlandı.");
    setIsProcessing(false);
  };

  return (
    <div
      className="flex flex-col h-[calc(100vh-12rem)] relative"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-[100] bg-cyan-900/60 backdrop-blur-md border-4 border-dashed border-cyan-400 rounded-[40px] flex flex-col items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-200">
          <div className="w-24 h-24 rounded-full bg-cyan-500/20 flex items-center justify-center mb-6 animate-bounce">
            <i className="fas fa-file-code text-5xl text-cyan-400"></i>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em] mb-2">JSON Verisini Bırak</h2>
          <p className="text-cyan-400 font-bold uppercase tracking-widest text-xs">İş akışı otomatik olarak kurgulanacaktır</p>
        </div>
      )}

      {/* AI Prompt Input Bar */}
      <div className="mb-6 flex gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="AI'ya iş akışı hazırlat..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold uppercase tracking-widest outline-none focus:border-cyan-500 transition-all placeholder:text-gray-700"
          />
        </div>
        <button
          onClick={runSimulation}
          disabled={nodes.length === 0 || isProcessing}
          className={`px-8 rounded-2xl shadow-lg transition-all font-black uppercase tracking-widest flex items-center gap-3 ${isProcessing ? 'bg-gray-800 text-gray-500' : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/20'}`}
        >
          {isProcessing ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-play"></i>}
          {isProcessing ? 'Çalışıyor' : 'Akışı Yürüt'}
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        {/* Sol Panel: Logs & Telemetry */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="flex-1 bg-black/40 border border-white/10 rounded-[32px] p-6 flex flex-col overflow-hidden">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center justify-between">
              JSON Editörü
              <button onClick={() => setJsonInput('')} className="text-red-500/50 hover:text-red-500 transition-colors text-[9px] font-black uppercase">TEMİZLE</button>
            </h3>

            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="JSON buraya yapıştırın veya sürükleyin..."
              className="flex-1 bg-transparent border-none p-0 text-[10px] font-mono text-cyan-300/70 resize-none outline-none custom-scrollbar mb-4"
            />

            <button
              onClick={handleImport}
              className="w-full py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400 text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500 hover:text-black transition-all flex items-center justify-center gap-2"
            >
              <i className="fas fa-project-diagram"></i>
              Tuvala Yansıt
            </button>
          </div>

          {telemetryData && (
            <div className="h-48 bg-cyan-950/30 border border-cyan-500/30 rounded-[24px] p-4 animate-in fade-in slide-in-from-bottom-4 overflow-hidden">
              <h3 className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <i className="fas fa-microchip animate-pulse"></i> Canlı Telemetri
              </h3>
              <div className="font-mono text-[10px] text-cyan-500 space-y-1 overflow-y-auto h-full custom-scrollbar pb-6">
                <div className="flex justify-between">
                  <span className="opacity-50 uppercase tracking-tighter">Status:</span>
                  <span className="font-bold">ACTIVE</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-50 uppercase tracking-tighter">Node ID:</span>
                  <span className="font-bold">{activeNodeId}</span>
                </div>
                <div className="mt-2 text-gray-400 break-all bg-black/20 p-2 rounded">
                  <pre>{JSON.stringify(telemetryData, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sağ Panel: Görsel Alan / Canvas */}
        <div className="lg:col-span-3 bg-black/40 border border-white/10 rounded-[40px] relative overflow-hidden flex flex-col">
          <div className="h-16 border-b border-white/5 flex items-center px-8 justify-between bg-black/20">
            <div className="flex gap-6">
              {[
                { id: 'visual', label: 'Neural Canvas', icon: 'fa-project-diagram' },
                { id: 'logs', label: 'Execution Logs', icon: 'fa-terminal' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab.id ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <i className={`fas ${tab.icon} text-[8px]`}></i>
                  {tab.label}
                </button>
              ))}
            </div>

            {isProcessing && (
              <div className="flex items-center gap-4 flex-1 max-w-xs justify-end">
                <span className="text-[9px] font-black text-cyan-500 uppercase tracking-widest animate-pulse">Yürütülüyor...</span>
                <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${simulationProgress}%` }}></div>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 relative overflow-auto custom-scrollbar p-10 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03),transparent)]">
            {activeTab === 'visual' ? (
              <div className="relative min-w-[1000px] min-h-[1000px]">
                {/* Connections Layer */}
                <svg className="absolute inset-0 pointer-events-none w-full h-full">
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="rgba(34,211,238,0.2)" />
                    </marker>
                  </defs>
                  {links.map((link, i) => {
                    const from = nodes.find(n => n.id === link.fromNode);
                    const to = nodes.find(n => n.id === link.toNode);
                    if (!from || !to) return null;
                    return (
                      <line
                        key={i}
                        x1={from.position[0] + 240}
                        y1={from.position[1] + 40}
                        x2={to.position[0]}
                        y2={to.position[1] + 40}
                        stroke="rgba(6,182,212,0.15)"
                        strokeWidth="1.5"
                        markerEnd="url(#arrowhead)"
                      />
                    );
                  })}
                </svg>

                {/* Nodes Layer */}
                {nodes.map(node => (
                  <div
                    key={node.id}
                    className={`absolute w-60 p-5 rounded-2xl border backdrop-blur-md transition-all duration-500 group ${activeNodeId === node.id
                        ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.2)] scale-105 z-20'
                        : 'bg-white/5 border-white/10 hover:border-white/20 z-10'
                      }`}
                    style={{ left: node.position[0], top: node.position[1] }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center border border-white/5">
                        <i className={`fas ${node.type.includes('googleGemini') ? 'fa-brain text-purple-400' : 'fa-cog text-gray-400'} text-xs`}></i>
                      </div>
                      <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{node.id}</span>
                    </div>
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-1 truncate">{node.name}</h4>
                    <p className="text-[9px] text-gray-500 font-bold uppercase truncate">{node.type.split('.').pop()}</p>

                    {activeNodeId === node.id && (
                      <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 animate-pulse"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-2 font-mono text-[11px]">
                {logs.length === 0 && <p className="text-gray-700 italic text-center py-20 uppercase tracking-[0.2em]">Kayıt bulunamadı</p>}
                {logs.map((log, i) => (
                  <div key={i} className={`p-3 rounded-lg border flex gap-4 ${log.includes('HATA') ? 'bg-red-500/5 border-red-500/20 text-red-400' : 'bg-white/5 border-white/5 text-gray-400'}`}>
                    <span className="opacity-40 shrink-0">{log.split(']')[0]}]</span>
                    <span>{log.split(']')[1]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {executionResult && (
            <div className="p-8 bg-cyan-500 text-black font-black uppercase tracking-[0.2em] text-[10px] text-center animate-in slide-in-from-bottom-5">
              <i className="fas fa-check-circle mr-2"></i>
              {executionResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowStudio;
