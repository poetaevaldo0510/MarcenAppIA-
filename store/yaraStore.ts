
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { YaraPlan, CreditTransaction } from "../types";

interface MarcenaState {
  isReady: boolean;
  isAdminLoggedIn: boolean;
  activeModal: string | null;
  activeClientId: string | null;
  clients: any[];
  messages: any[];
  industrialRates: { mdf: number; markup: number };
  ambientes: Record<string, { pecas: any[] }>;
  activeAmbiente: string;
  selectedImage: string | null;
  loadingAI: boolean;
  hasKey: boolean;

  // Sistema de Créditos
  credits: number;
  currentPlan: YaraPlan;
  transactions: CreditTransaction[];

  setReady: (val: boolean) => void;
  setAdmin: (val: boolean) => void;
  setModal: (id: string | null) => void;
  setClient: (id: string | null) => void;
  addClient: (name: string) => void;
  addMessage: (msg: any) => void;
  updateMessage: (id: string, payload: any) => void;
  updateRates: (rates: { mdf?: number; markup?: number }) => void;
  setPreview: (url: string | null) => void;
  setLoadingAI: (val: boolean) => void;
  updateAmbientes: (ambientes: any) => void;
  setActiveAmbiente: (name: string) => void;
  setHasKey: (val: boolean) => void;

  // Ações de Créditos
  consumeCredits: (amount: number, description: string) => boolean;
  addCredits: (amount: number, description: string) => void;
  changePlan: (plan: YaraPlan) => void;
}

export const useStore = create<MarcenaState>()(
  persist(
    (set, get) => ({
      isReady: false,
      isAdminLoggedIn: false,
      activeModal: null,
      activeClientId: '1',
      clients: [{ id: '1', name: 'Evaldo Master Pro' }],
      messages: [{ 
        id: 'initial', 
        from: 'iara', 
        text: 'HUB MASTER EVALDO v3.70 ONLINE. Hardware industrial pronto. Cockpit liberado.', 
        timestamp: new Date().toISOString() 
      }],
      industrialRates: { mdf: 440, markup: 2.2 },
      ambientes: { "Geral": { pecas: [] } },
      activeAmbiente: "Geral",
      selectedImage: null,
      loadingAI: false,
      hasKey: false,

      // Início com créditos de boas-vindas
      credits: 50,
      currentPlan: 'BASIC',
      transactions: [{
        id: 'welcome',
        type: 'topup',
        amount: 50,
        description: 'Créditos de Boas-vindas Hub',
        timestamp: new Date().toISOString()
      }],

      setReady: (val) => set({ isReady: val }),
      setAdmin: (val) => set({ isAdminLoggedIn: val }),
      setModal: (id) => set({ activeModal: id }),
      setClient: (id) => set({ activeClientId: id }),
      addClient: (name) => set((state) => {
        const id = Date.now().toString();
        return { clients: [...state.clients, { id, name }], activeClientId: id };
      }),
      addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
      updateMessage: (id, payload) => set((state) => ({
        messages: state.messages.map((m) => m.id === id ? { ...m, ...payload } : m)
      })),
      updateRates: (rates) => set((state) => ({ industrialRates: { ...state.industrialRates, ...rates } })),
      setPreview: (url) => set({ selectedImage: url }),
      setLoadingAI: (val) => set({ loadingAI: val }),
      updateAmbientes: (ambientes) => set({ ambientes }),
      setActiveAmbiente: (activeAmbiente) => set({ activeAmbiente }),
      setHasKey: (val) => set({ hasKey: val }),

      consumeCredits: (amount, description) => {
        const current = get().credits;
        if (current < amount) return false;
        
        const newTransaction: CreditTransaction = {
          id: `tx-${Date.now()}`,
          type: 'consumption',
          amount,
          description,
          timestamp: new Date().toISOString()
        };

        set((state) => ({
          credits: state.credits - amount,
          transactions: [newTransaction, ...state.transactions]
        }));
        return true;
      },

      addCredits: (amount, description) => {
        const newTransaction: CreditTransaction = {
          id: `tx-${Date.now()}`,
          type: 'topup',
          amount,
          description,
          timestamp: new Date().toISOString()
        };
        set((state) => ({
          credits: state.credits + amount,
          transactions: [newTransaction, ...state.transactions]
        }));
      },

      changePlan: (plan) => set({ currentPlan: plan }),
    }),
    { name: 'marcenapp-supreme-v383-persistence' }
  )
);
