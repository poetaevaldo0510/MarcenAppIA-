
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  ProjectData, Lead, Transaction, CartItem, MarketplaceItem, 
  AppNotification, GlobalSettings, Message 
} from '../types';

export interface Environment {
  id: string;
  name: string;
  dna: ProjectData;
  renders: any[];
}

interface ProjectThread {
  id: string;
  clientName: string;
  clientPhone: string;
  clientAddress?: string;
  projectName: string;
  environments: Environment[];
  chatHistory: Message[];
  status: 'active' | 'archived';
  createdAt: number;
}

interface WorkshopProfile {
  name: string;
  document: string;
  address: string;
  whatsapp: string;
}

export type WorkshopSize = 'small' | 'medium' | 'large';

interface ProjectState {
  isAuthorized: boolean;
  hasSeenOnboarding: boolean;
  userEmail: string | null;
  isAdmin: boolean;
  workshopProfile: WorkshopProfile;
  workshopSize: WorkshopSize | null;
  credits: number;
  projects: ProjectThread[];
  activeProjectId: string | null;
  activeEnvironmentId: string | null;
  isAssistantActive: boolean;
  cart: CartItem[];
  transactions: Transaction[];
  leads: Lead[];
  bankBalance: number;
  creditLimit: number;
  distributorLinked: boolean;
  settings: GlobalSettings;
  activePaymentSession: { id: string; projectId: string; amount: number; materials: number } | null;
  
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  completeOnboarding: () => void;
  setWorkshopSize: (size: WorkshopSize) => void;
  createProject: (name: string, clientPhone?: string) => string;
  setActiveProject: (id: string) => void;
  updateActiveDNA: (newData: Partial<ProjectData>) => void;
  addMessage: (projectId: string, role: 'user' | 'assistant', text: string, image?: string) => void;
  setAssistantActive: (active: boolean) => void;
  updateWorkshopProfile: (data: Partial<WorkshopProfile>) => void;
  addTransaction: (t: any) => void;
  addLead: (l: any) => void;
  linkDistributor: () => void;
  bookService: (s: any) => void;
  createPaymentSession: (projectId: string, total: number, materials: number) => void;
  completePayment: (method: string) => void;
  buyTool: (toolId: string, price: number) => boolean;
}

const initialDNA: ProjectData = {
  width: 2.40, height: 2.60, depth: 0.60,
  drawers: 4, doors: 6,
  internalMaterial: 'mdf15_white',
  externalMaterial: 'mdf18_wood',
  backMaterial: 'mdf6_white',
  profitMargin: 35, laborRate: 100,
  handleType: 'external'
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      isAuthorized: false,
      hasSeenOnboarding: false,
      userEmail: null,
      isAdmin: false,
      workshopProfile: { name: 'Oficina Master', document: '', address: '', whatsapp: '' },
      workshopSize: null,
      credits: 1000,
      projects: [],
      activeProjectId: null,
      activeEnvironmentId: null,
      isAssistantActive: false,
      cart: [],
      transactions: [],
      leads: [],
      bankBalance: 42500,
      creditLimit: 15000,
      distributorLinked: false,
      activePaymentSession: null,
      settings: {
        mdfWhitePrice: 350,
        mdfWoodPrice: 550,
        edgeBandPrice: 5.5,
        laborDailyRate: 400,
        workshopOverhead: 15,
        taxRate: 6,
        currency: 'BRL'
      },

      login: (email, pass) => {
        const isMaster = email.toLowerCase() === 'evaldo@marcenapp.com.br' && pass === '123456';
        if (isMaster) {
          set({ 
            isAuthorized: true, userEmail: email, isAdmin: true, hasSeenOnboarding: true,
            workshopProfile: { name: 'MarcenaPP Global Holding', document: 'MASTER', address: 'Cloud Hub', whatsapp: '11999999999' }
          });
          return true;
        }
        if (email.includes('@')) {
          set({ isAuthorized: true, userEmail: email, isAdmin: false, hasSeenOnboarding: false });
          return true;
        }
        return false;
      },

      logout: () => set({ isAuthorized: false, userEmail: null, isAdmin: false }),
      completeOnboarding: () => set({ hasSeenOnboarding: true }),
      setWorkshopSize: (size) => set({ workshopSize: size }),
      
      createProject: (name, phone) => {
        const id = 'proj-' + Math.random().toString(36).substr(2, 5);
        const envId = 'env-' + Math.random().toString(36).substr(2, 5);
        const newProject: ProjectThread = {
          id, clientName: name, clientPhone: phone || '', projectName: 'Obra: ' + name,
          createdAt: Date.now(),
          environments: [{ id: envId, name: 'Ambiente Principal', dna: { ...initialDNA }, renders: [] }],
          chatHistory: [{ id: '1', role: 'assistant', text: `Mestre, YARA conectada. Memória ativada para ${name}.`, timestamp: Date.now() }],
          status: 'active'
        };
        set(state => ({ projects: [newProject, ...state.projects], activeProjectId: id, activeEnvironmentId: envId }));
        return id;
      },

      setActiveProject: (id) => {
        const project = get().projects.find(p => p.id === id);
        if (project) {
          set({ activeProjectId: id, activeEnvironmentId: project.environments[0].id });
        }
      },
      updateActiveDNA: (newData) => set(state => ({
        projects: state.projects.map(p => p.id === state.activeProjectId 
          ? { ...p, environments: p.environments.map(e => e.id === state.activeEnvironmentId ? { ...e, dna: { ...e.dna, ...newData } } : e) } 
          : p
        )
      })),
      addMessage: (projectId, role, text, image) => set(state => ({
        projects: state.projects.map(p => p.id === projectId 
          ? { ...p, chatHistory: [...p.chatHistory, { id: Math.random().toString(), role, text, image, timestamp: Date.now() }] } 
          : p
        )
      })),
      setAssistantActive: (active) => set({ isAssistantActive: active }),
      updateWorkshopProfile: (data) => set(state => ({ workshopProfile: { ...state.workshopProfile, ...data } })),
      addTransaction: (t) => set(state => ({ transactions: [t, ...state.transactions] })),
      addLead: (l) => set(state => ({ leads: [l, ...state.leads] })),
      linkDistributor: () => set({ distributorLinked: true }),
      bookService: (s) => console.log("Serviço reservado:", s),
      createPaymentSession: (projectId, total, materials) => set({ activePaymentSession: { id: 'pay-'+Date.now(), projectId, amount: total, materials } }),
      completePayment: (method) => set({ activePaymentSession: null }),
      buyTool: (toolId, price) => {
        const { credits, isAdmin } = get();
        if (isAdmin || credits >= price) {
          if (!isAdmin) set(state => ({ credits: state.credits - price }));
          return true;
        }
        return false;
      },
    }),
    {
      name: 'marcenapp-industrial-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
