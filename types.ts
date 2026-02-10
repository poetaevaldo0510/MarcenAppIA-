
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

export interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  attachment?: Attachment;
  projectData?: ProjectData;
  budget?: BudgetResult;
  cutPlan?: CutPlanResult;
  isConfirmed?: boolean;
}

export interface Piece {
  name: string;
  width: number;
  height: number;
  quantity: number;
  material: string;
}

export interface Hardware {
  name: string;
  quantity: number;
  pricePerUnit: number;
}

export interface ProjectData {
  title: string;
  description: string;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  material: string;
  color: string;
  pieces: Piece[];
  hardware: Hardware[];
  renderUrl?: string;
  decoratedRenderUrl?: string;
}

export interface BudgetResult {
  mdfCost: number;
  hardwareCost: number;
  laborCost: number;
  totalCost: number;
  finalPrice: number;
  margin: number;
  details: {
    sheetsNeeded: number;
    totalAreaM2: number;
  };
}

export interface CutPlanResult {
  efficiency: number;
  totalSheets: number;
  piecesCount: number;
}
