
import React, { useState, useEffect } from 'react';
import { WorkspaceView } from './types';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import CreativeView from './components/CreativeView';
import VideoView from './components/VideoView';
import LiveView from './components/LiveView';
import AudioLab from './components/AudioLab';
import SystemView from './components/SystemView';
import BuilderView from './components/BuilderView';
import WorkflowStudio from './components/WorkflowStudio';
import CryptoView from './components/CryptoView';
import RequestView from './components/RequestView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<WorkspaceView>(WorkspaceView.CHAT);
  const [apiKeyReady, setApiKeyReady] = useState(false);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setApiKeyReady(hasKey);
      } else {
        setApiKeyReady(true);
      }
    };
    checkApiKey();
  }, []);

  const handleOpenKeyPicker = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setApiKeyReady(true);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case WorkspaceView.CHAT: return <ChatView />;
      case WorkspaceView.CREATIVE: return <CreativeView apiKeyReady={apiKeyReady} onOpenKeyPicker={handleOpenKeyPicker} />;
      case WorkspaceView.VIDEO: return <VideoView apiKeyReady={apiKeyReady} onOpenKeyPicker={handleOpenKeyPicker} />;
      case WorkspaceView.LIVE: return <LiveView />;
      case WorkspaceView.AUDIO_LAB: return <AudioLab />;
      case WorkspaceView.SYSTEM: return <SystemView />;
      case WorkspaceView.BUILDER: return <BuilderView />;
      case WorkspaceView.WORKFLOW: return <WorkflowStudio />;
      case WorkspaceView.CRYPTO: return <CryptoView />;
      case WorkspaceView.REQUESTS: return <RequestView />;
      default: return <ChatView />;
    }
  };

  return (
    <div className="flex h-screen bg-black text-gray-100 overflow-hidden font-['Inter']">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[100px] rounded-full"></div>
      </div>

      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="flex-1 flex flex-col relative overflow-hidden z-10">
        <header className="h-20 border-b border-white/10 flex items-center justify-between px-10 bg-black/40 backdrop-blur-xl">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">
                {currentView === WorkspaceView.CHAT && "Komuta Merkezi"}
                {currentView === WorkspaceView.CREATIVE && "Görsel Sentez Studio"}
                {currentView === WorkspaceView.VIDEO && "Veo Temporal Lab"}
                {currentView === WorkspaceView.LIVE && "Omni-Link Live"}
                {currentView === WorkspaceView.AUDIO_LAB && "Ses Laboratuvarı"}
                {currentView === WorkspaceView.SYSTEM && "Sistem Çekirdeği"}
                {currentView === WorkspaceView.BUILDER && "Otonom İnşa"}
                {currentView === WorkspaceView.WORKFLOW && "Neural Workflow Studio"}
                {currentView === WorkspaceView.CRYPTO && "Kripto Bot Motoru"}
                {currentView === WorkspaceView.REQUESTS && "İstek Yönetimi"}
              </h1>
              <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
            </div>
            <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-0.5">
              Protocol v12.0 // Workflow Engine v2.5 Online
            </p>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)] overflow-hidden">
            <img src="https://ui-avatars.com/api/?name=Quantum&background=00f2ff&color=000" alt="Profil" />
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto h-full">
            {renderView()}
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
