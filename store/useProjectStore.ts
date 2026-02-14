
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  ProjectData, Lead, Transaction, CartItem, MarketplaceItem, Message 
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

interface ProjectState {
  isAuthorized: boolean;
  hasSeenOnboarding: boolean;
  userEmail: string | null;
  isAdmin: boolean;
  workshopProfile: any;
  workshopSize: any;
  credits: number;
  projects: ProjectThread[];
  activeProjectId: string | null;
  activeEnvironmentId: string | null;
  isAssistantActive: boolean;
  bankBalance: number;
  creditLimit: number;
  distributorLinked: boolean;
  activePaymentSession: any | null;
  settings: any;
  transactions: any[];
  leads: any[];
  cart: any[];
  
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  completeOnboarding: () => void;
  setWorkshopSize: (size: string) => void;
  createProject: (name: string, clientPhone?: string) => string;
  setActiveProject: (id: string) => void;
  updateActiveDNA: (newData: Partial<ProjectData>) => void;
  addMessage: (projectId: string, role: 'user' | 'assistant', text: string, image?: string) => void;
  setAssistantActive: (active: boolean) => void;
  updateWorkshopProfile: (data: any) => void;
  addTransaction: (t: any) => void;
  addLead: (l: any) => void;
  linkDistributor: () => void;
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
      bankBalance: 42500,
      creditLimit: 15000,
      distributorLinked: false,
      activePaymentSession: null,
      settings: { mdfWhitePrice: 350, mdfWoodPrice: 550, edgeBandPrice: 5.5, laborDailyRate: 400, workshopOverhead: 15, taxRate: 6, currency: 'BRL' },
      transactions: [],
      leads: [],
      cart: [],

      login: (email, pass) => {
        const isMaster = email.toLowerCase() === 'evaldo@marcenapp.com.br' && pass === '123456';
        if (isMaster) {
          set({ isAuthorized: true, userEmail: email, isAdmin: true, hasSeenOnboarding: true });
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
          chatHistory: [{ id: '1', role: 'assistant', text: `Mestre, YARA conectada para ${name}.`, timestamp: Date.now() }],
          status: 'active'
        };
        set(state => ({ projects: [newProject, ...state.projects], activeProjectId: id, activeEnvironmentId: envId }));
        return id;
      },
      setActiveProject: (id) => {
        const project = get().projects.find(p => p.id === id);
        if (project) set({ activeProjectId: id, activeEnvironmentId: project.environments[0].id });
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
      createPaymentSession: (projectId, total, materials) => set({ activePaymentSession: { id: 'pay-'+Date.now(), projectId, amount: total, materials } }),
      completePayment: () => set({ activePaymentSession: null }),
      buyTool: (toolId, price) => {
        const { credits, isAdmin } = get();
        if (isAdmin || credits >= price) {
          if (!isAdmin) set(state => ({ credits: state.credits - price }));
          return true;
        }
        return false;
      },
    }),
    { name: 'marcenapp-industrial-storage', storage: createJSONStorage(() => localStorage) }
  )
);
