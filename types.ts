
export enum MessageType {
  USER = 'user',
  IARA = 'iara',
  SYSTEM = 'system'
}

export interface Attachment {
  type: 'image' | 'audio' | 'document';
  url: string;
  data?: string; // base64
}

export interface Module {
  id: string;
  type: string;
  dimensions: { w: number; h: number; d: number };
  material: string;
  finish: string;
}

export interface CreditTransaction {
  id: string;
  type: 'consumption' | 'topup';
  amount: number;
  description: string;
  timestamp: string;
}

export type YaraPlan = 'BASIC' | 'PRO' | 'STUDIO' | 'ENTERPRISE';

export interface ProjectData {
  projectId: string;
  conversationId: string;
  source: {
    type: 'text' | 'voice' | 'image' | 'sketch2d' | 'hybrid';
    content?: string;
    attachmentUrl?: string;
  };
  title: string;
  description: string;
  environment: {
    width: number;
    height: number;
    depth: number;
  };
  modules: Module[];
  render: {
    status: 'pending' | 'processing' | 'done' | 'error';
    faithfulUrl?: string;
    decoratedUrl?: string;
  };
  pricing: {
    status: 'pending' | 'processing' | 'done' | 'error';
    materials: Array<{ name: string; cost: number }>;
    total: number;
    labor: number;
    finalPrice: number;
    creditsUsed: number;
    chapas: number;
  };
  cutPlan: {
    status: 'pending' | 'processing' | 'done' | 'error';
    boards: any[];
    optimizationScore: number;
  };
  complexity: number;
}

export interface Message {
  id: string;
  conversationId: string;
  from: 'user' | 'iara';
  type: 'text' | 'image' | 'typing' | 'audio';
  text: string;
  timestamp: string;
  src?: string;
  project?: ProjectData;
  status: 'sent' | 'processing' | 'done' | 'error';
  progressiveSteps?: {
    parsed: 'active' | 'done' | false;
    render: 'active' | 'done' | false;
    pricing: 'active' | 'done' | false;
    cutPlan: 'active' | 'done' | false;
  };
}

export interface MarcenaState {
  messages: Message[];
  isLoading: boolean;
  isAdminMode: boolean;
  credits: number;
  currentPlan: YaraPlan;
  transactions: CreditTransaction[];
  conversationId: string | null;
}
