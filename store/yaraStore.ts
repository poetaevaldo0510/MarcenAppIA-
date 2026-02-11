
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { YaraPlan, CreditTransaction, Message } from "../types";

interface MarcenaState {
  isReady: boolean;
  isAdminLoggedIn: boolean;
  activeModal: string | null;
  activeClientId: string | null;
  clients: any[];
  messages: Message[];
  conversationId: string | null;
  industrialRates: { mdf: number; markup: number };
  selectedImage: string | null;
  loadingAI: boolean;
  hasKey: boolean;
  keyStatus: 'active' | 'inactive' | 'error';
  lastHardwareCheck: string | null;

  // Sistema de Créditos
  credits: number;
  currentPlan: YaraPlan;
  transactions: CreditTransaction[];

  // Actions
  setReady: (val: boolean) => void;
  setAdmin: (val: boolean) => void;
  setModal: (id: string | null) => void;
  setClient: (id: string | null) => void;
  addClient: (name: string) => void;
  
  // Conversas v1.0
  startNewConversation: () => string;
  addMessage: (msg: Partial<Message>) => string;
  updateMessage: (id: string, payload: Partial<Message>) => void;
  deleteMessage: (id: string) => void;
  
  updateRates: (rates: { mdf?: number; markup?: number }) => void;
  setPreview: (url: string | null) => void;
  setLoadingAI: (val: boolean) => void;
  setHasKey: (val: boolean) => void;
  setKeyStatus: (status: 'active' | 'inactive' | 'error') => void;

  // Ações de Créditos
  consumeCredits: (amount: number, description: string) => boolean;
  addCredits: (amount: number, description: string) => void;
  changePlan: (plan: YaraPlan) => void;
  
  // Admin helpers
  resetStore: () => void;
}

export const useStore = create<MarcenaState>()(
  persist(
    (set, get) => ({
      isReady: false,
      isAdminLoggedIn: true,
      activeModal: null,
      activeClientId: '1',
      clients: [{ id: '1', name: 'Evaldo Master Pro' }],
      messages: [],
      conversationId: null,
      industrialRates: { mdf: 440, markup: 2.2 },
      selectedImage: null,
      loadingAI: false,
      hasKey: false,
      keyStatus: 'inactive',
      lastHardwareCheck: null,

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
      setClient: (id) => {
        const currentConvId = crypto.randomUUID();
        set({ activeClientId: id, conversationId: currentConvId });
      },
      addClient: (name) => set((state) => {
        const id = Date.now().toString();
        const convId = crypto.randomUUID();
        return { 
          clients: [...state.clients, { id, name }], 
          activeClientId: id,
          conversationId: convId
        };
      }),

      startNewConversation: () => {
        const id = crypto.randomUUID();
        set({ conversationId: id, messages: [] });
        return id;
      },

      addMessage: (msg) => {
        const id = msg.id || crypto.randomUUID();
        const convId = get().conversationId || crypto.randomUUID();
        
        if (!get().conversationId) {
          set({ conversationId: convId });
        }

        const newMessage: Message = {
          id,
          conversationId: convId,
          from: msg.from || 'user',
          type: msg.type || 'text',
          text: msg.text || '',
          timestamp: new Date().toISOString(),
          status: msg.status || 'sent',
          ...msg
        };
        
        set((state) => ({ messages: [...state.messages, newMessage] }));
        return id;
      },

      updateMessage: (id, payload) => set((state) => ({
        messages: state.messages.map((m) => m.id === id ? { ...m, ...payload } : m)
      })),

      deleteMessage: (id) => set((state) => ({
        messages: state.messages.filter(m => m.id !== id)
      })),

      updateRates: (rates) => set((state) => ({ industrialRates: { ...state.industrialRates, ...rates } })),
      setPreview: (url) => set({ selectedImage: url }),
      setLoadingAI: (val) => set({ loadingAI: val }),
      setHasKey: (val) => set({ hasKey: val }),
      setKeyStatus: (status) => set({ keyStatus: status, lastHardwareCheck: new Date().toISOString() }),

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
      
      resetStore: () => {
        if(confirm("Deseja resetar todo o Hardware Hub?")) {
           localStorage.removeItem('marcenapp-supreme-v383-persistence');
           window.location.reload();
        }
      }
    }),
    { name: 'marcenapp-supreme-v383-persistence' }
  )
);
