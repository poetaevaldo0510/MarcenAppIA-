
export enum MessageType {
  USER = 'user',
  IARA = 'iara',
  SYSTEM = 'system'
}

// Added YaraPlan type used in store
export type YaraPlan = 'BASIC' | 'PRO' | 'STUDIO' | 'ENTERPRISE';

// Added CreditTransaction interface used in store
export interface CreditTransaction {
  id: string;
  type: 'topup' | 'consumption';
  amount: number;
  description: string;
  timestamp: string;
}

// Added Attachment interface used in engine
export interface Attachment {
  type: 'image' | 'audio';
  url?: string;
  data: string;
}

export interface Module {
  id: string;
  type: string;
  dimensions: { w: number; h: number; d: number };
  material: string;
  finish: string;
}

export interface RenderVersion {
  version: number;
  timestamp: string;
  faithfulUrl: string;
  decoratedUrl: string;
}

export interface ProjectData {
  projectId: string;
  title: string;
  description: string;
  complexity: number; // Added complexity property to resolve error in budgetEngine.ts
  environment: {
    width: number;
    height: number;
    depth: number;
  };
  modules: Module[];
  status: 'draft' | 'validated' | 'LOCKED' | 'production';
  currentVersion: number;
  renderHistory: RenderVersion[];
  validation: {
    isValid: boolean;
    alerts: string[];
    coherenceScore: number;
  };
  pricing?: any;
  cutPlan?: any;
  render: {
    status: 'pending' | 'processing' | 'done' | 'error';
    faithfulUrl?: string;
    decoratedUrl?: string;
  };
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
  status: 'sent' | 'processing' | 'done' | 'error' | 'waiting_confirmation';
  progressiveSteps?: {
    parsed: 'active' | 'done' | 'error' | false;
    render: 'active' | 'done' | 'error' | false;
    pricing: 'active' | 'done' | 'error' | false;
    cutPlan: 'active' | 'done' | 'error' | false;
  };
}
