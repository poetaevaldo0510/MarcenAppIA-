
export interface GlobalSettings {
  mdfWhitePrice: number;
  mdfWoodPrice: number;
  edgeBandPrice: number;
  laborDailyRate: number;
  workshopOverhead: number;
  taxRate: number;
  currency: string;
}

export interface ProjectData {
  width: number;
  height: number;
  depth: number;
  drawers: number;
  doors: number;
  internalMaterial: string;
  externalMaterial: string;
  backMaterial: string;
  profitMargin: number;
  laborRate: number;
  handleType: string;
  clientName?: string;
  /* Added technical fields for compatibility */
  projectId?: string;
  title?: string;
  description?: string;
  status?: string;
  complexity?: number;
  environment?: { width: number; height: number; depth: number };
  modules?: any[];
  validation?: any;
  render?: any;
  pricing?: any;
  cutPlan?: any;
  currentVersion?: number;
  seed_base?: number;
  dna_locked?: any;
  version_count?: number;
  renderHistory?: any[];
}

export type RenderStyle = 'technical' | 'decorated' | 'raw';
export type PerspectiveAngle = 'frontal' | 'isometric' | 'corner' | 'top';

export interface RenderVersion {
  id: string;
  url: string;
  style: RenderStyle;
  perspective: PerspectiveAngle;
  timestamp: number;
  dna: ProjectData;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Part {
  id: number;
  name: string;
  w: number;
  h: number;
  qtd: number;
  mat: 'white' | 'wood' | 'back';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  image?: string;
  timestamp: number;
}

export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: number;
  read: boolean;
}

// Mapeamento das 20 Fases + Auxiliares
/* Added marketplace and distributors to fix App.tsx errors */
export type ModuleType = 
  | 'dashboard' | 'ecosystem' | 'studio' | 'showroom' | 'checkout' 
  | 'budget' | 'legal' | 'fintech' | 'blueprint' | 'cutting' 
  | 'suppliers' | 'production' | 'assembly' | 'services' | 'fiscal' 
  | 'crm' | 'marketing' | 'bi' | 'valuation' | 'settings' | 'onboarding' | 'profile' | 'album' | 'export'
  | 'marketplace' | 'distributors';

export interface Transaction { id: string; type: 'income' | 'expense'; amount: number; description: string; date: number; category: string; }
export interface Lead { id: string; name: string; phone: string; status: 'new' | 'contacted' | 'negotiating' | 'closed'; projectDna?: ProjectData; estimatedValue: number; }
export interface MarketplaceItem { id: string; name: string; category: string; price: number; unit: string; supplier: string; image: string; }
export interface CartItem { product: MarketplaceItem; quantity: number; }
export interface TeamMember { id: string; name: string; role: 'mestre' | 'projetista' | 'montador' | 'vendedor'; status: 'online' | 'in_field' | 'offline'; tasksCompleted: number; avatar: string; activeTaskId?: string; }
export interface Invoice { id: string; number: string; client_name: string; value: number; tax_value: number; date: number; status: 'pending' | 'authorized' | 'rejected'; ncm_code: string; }

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  unit: string;
  lastPrice: number;
}

export interface QuoteRequest {
  id: string;
  supplierId: string;
  items: { productId: string; quantity: number }[];
  status: 'pending' | 'sent' | 'received' | 'rejected';
  createdAt: number;
}

export interface Supplier {
  id: string;
  name: string;
  category: string;
  rating: number;
  location: string;
}
