
export type UserRole = 'marceneiro' | 'projetista' | 'admin' | 'distribuidor';
export type MessageType = 'text' | 'user-image' | 'status' | 'master-card';
export type ProjectStatus = 'rendering' | 'ready' | 'error';
export type SaleStatus = 'quote' | 'closed' | 'delivered';
export type SubscriptionTier = 'free' | 'essencial' | 'pro' | 'master';
export type MainTab = 'chat' | 'history' | 'profile' | 'admin';

export interface LocationState {
  latitude: number;
  longitude: number;
}

export interface IaraDna {
  projeto: string;
  pecas: Array<{ nome: string; w: number; h: number; qtd: number; material?: string }>;
  chapas: number;
  ferragens: { qtd: number };
  desc: string;
}

export interface IaraDesignOutput {
  components: Array<{
    name: string;
    type: 'module' | 'panel';
    dimensions: { w: number; h: number; d: number };
    material: string;
    quantity: number;
    // Added missing moduleId property
    moduleId?: string;
  }>;
  budgetPreview: {
    materialCost: number;
    laborCost: number;
    total: number;
  };
  architecturalAudit?: {
    ergonomics: string[];
    trends: string[];
    technical: string[];
  };
  // Added projectParams for technical spec access
  projectParams?: {
    dominantMaterial?: string;
    dimensions?: {
      width: number;
      height: number;
      depth: number;
      unit: string;
    };
  };
}

export interface ChatMessage {
  id: string | number;
  from: 'user' | 'iara';
  sender?: 'user' | 'iara';
  // Added role and sources for ResearchAssistant
  role?: 'user' | 'model';
  type: MessageType;
  text?: string;
  src?: string; 
  render?: string;
  ref?: string;
  dna?: IaraDna;
  precoFinal?: number;
  timestamp: number;
  // Added sources for grounding
  sources?: any[];
  metadata?: {
    renderedImageUrl?: string;
    originalImageUrl?: string;
  };
}

export interface ProjectHistoryItem {
  id: string;
  name: string;
  updatedAt: number;
  messages: ChatMessage[];
  dna?: IaraDna | null;
  lastImage?: string | null;
  status: string;
  timestamp: number;
  views3d: string[];
  description: string;
  saleStatus: SaleStatus;
  chatHistory: ChatMessage[];
  bom?: string | null;
  cuttingPlan?: string | null;
  materialCost?: number;
  laborCost?: number;
  technicalSpec?: IaraDesignOutput | null;
  legalSpec?: { contractText: string } | null;
  totalValue?: number;
  // Added missing properties identified in errors
  style?: string;
  clientName?: string;
  clientId?: string;
  orderStatus?: string;
  currentStage?: string;
  cuttingPlanImage?: string | null;
  cuttingPlanOptimization?: string | null;
  withLedLighting?: boolean;
  priceSources?: any[];
  engineeringStatus?: 'pending' | 'completed';
}

export interface UserProfile {
    id: string;
    businessName: string;
    fullName: string;
    phone: string;
    email: string;
    role: UserRole;
    credits: number;
    subscriptionPlan?: SubscriptionTier;
    logo?: string;
    // Added missing properties identified in errors
    onboardingCompleted?: boolean;
    corteCloudConfig?: {
      enabled: boolean;
      apiKey: string;
      storeId: string;
    };
    transactions?: any[];
    carpenterDNA?: string;
    learnedInsights?: string[];
    neuralSyncLevel?: number;
    referralCode?: string;
    instagram?: string;
}

// Added missing FinancialStats interface
export interface FinancialStats {
    totalInvoiced: number;
    totalExpenses: number;
    netProfit: number;
    margin: number;
}

// Added missing Finish interface
export interface Finish {
    id: string;
    name: string;
    manufacturer: string;
    imageUrl?: string;
}

// Added missing Client interface
export interface Client {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    notes: string;
    status: 'lead' | 'active' | 'archived';
    timestamp: number;
    ownerId: string;
    category?: string;
}

// Added missing TechnicalReview interface
export interface TechnicalReview {
    status: 'pending' | 'approved' | 'rejected';
    notes: string;
}

// Added missing IMaterialCost interface
export interface IMaterialCost {
    sku: string;
    provider: string;
    pricePerUnit: number;
    lastUpdated: Date;
    currency: string;
}

// Added missing IHardwareCost interface
export interface IHardwareCost {
    name: string;
    avgMarketPrice: number;
    marginSafety: number;
}

// Added missing UnicornMilestone interface
export interface UnicornMilestone {
    phase: number;
    id: string;
    year: string;
    title: string;
    status: 'active' | 'pending';
    kpi: string;
    description: string;
}

// Added missing ToolInfo interface
export interface ToolInfo {
    title: string;
    icon: any;
    creditCost: number;
    description: string;
    howToUse: string[];
}

// Added missing IaraPillars interface
export interface IaraPillars {
    render: string;
    budget: string;
    bom: string;
    cutlist: string;
}

// Added missing SupplierOffer interface
export interface SupplierOffer {
    supplierId: string;
    supplierName: string;
    totalAmount: number;
    deliveryDays: number;
    itemsMatch: number;
    isBestPrice: boolean;
    isFastest: boolean;
    moduleType?: string;
}
