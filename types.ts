
export enum MessageType {
  USER = 'user',
  IARA = 'iara',
  SYSTEM = 'system'
}

export type YaraPlan = 'free' | 'pro' | 'studio' | 'enterprise';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  plan: YaraPlan;
  credits: number;
}

export interface RenderVersion {
  version: number;
  timestamp: string;
  image_url: string;
  faithfulUrl: string;
  decoratedUrl: string;
  seed: number;
  locked: boolean;
}

export interface ProjectData {
  projectId: string;
  user_id?: string;
  title: string;
  description: string;
  complexity: number;
  seed_base: number;
  version_count: number;
  max_free_versions: number;
  environment: {
    width: number;
    height: number;
    depth: number;
  };
  modules: Module[];
  status: 'draft' | 'validated' | 'LOCKED' | 'production';
  dna_locked?: {
    modules: Module[];
    environment: any;
  };
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

export interface Module {
  id: string;
  type: string;
  dimensions: { w: number; h: number; d: number };
  material: string;
  finish: string;
}

export interface Message {
  id: string;
  conversationId: string;
  from: 'user' | 'iara';
  type: 'text' | 'image' | 'typing' | 'audio';
  text: string;
  timestamp: string;
  src?: string;
  audio?: string; // Base64 do áudio gerado pela YARA
  project?: ProjectData;
  status: 'sent' | 'processing' | 'done' | 'error' | 'waiting_confirmation';
  progressiveSteps?: {
    parsed: 'active' | 'done' | 'error' | false;
    render: 'active' | 'done' | 'error' | false;
    pricing: 'active' | 'done' | 'error' | false;
    cutPlan: 'active' | 'done' | 'error' | false;
  };
}

export interface CreditTransaction {
  id: string;
  type: 'topup' | 'consumption';
  amount: number;
  description: string;
  timestamp: string;
}

export interface Attachment {
  type: 'image' | 'audio';
  url?: string;
  data: string;
}
