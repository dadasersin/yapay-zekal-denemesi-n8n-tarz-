
export enum WorkspaceView {
  CHAT = 'CHAT',
  CREATIVE = 'CREATIVE',
  VIDEO = 'VIDEO',
  LIVE = 'LIVE',
  AUDIO_LAB = 'AUDIO_LAB',
  SYSTEM = 'SYSTEM',
  BUILDER = 'BUILDER',
  WORKFLOW = 'WORKFLOW',
  CRYPTO = 'CRYPTO',
  REQUESTS = 'REQUESTS'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  groundingUrls?: Array<{ uri: string; title: string }>;
  attachment?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    mimeType: string;
  };
}

export interface MediaAsset {
  id: string;
  type: 'image' | 'video';
  url: string;
  prompt: string;
  timestamp: Date;
}

export interface SystemRequest {
  id: string;
  topic: string;
  status: 'warning' | 'success' | 'danger';
  statusText: string;
  date: string;
}

export interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  parameters?: any;
}

export interface WorkflowLink {
  fromNode: string;
  toNode: string;
}
