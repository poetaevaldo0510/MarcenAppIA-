
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { YaraPlan, Message, ProjectData } from "../types";
import { supabase } from "../lib/supabase";

interface MarcenaState {
  isReady: boolean;
  user: any | null;
  activeModal: string | null;
  activeClientId: string | null;
  clients: any[];
  messages: Message[];
  searchQuery: string;
  conversationId: string | null;
  industrialRates: { mdf: number; markup: number };
  selectedImage: string | null;
  loadingAI: boolean;
  credits: number;
  currentPlan: YaraPlan;
  manualApiKey: string | null;
  keyStatus: 'inactive' | 'active' | 'error';

  // Actions
  setReady: (val: boolean) => void;
  setUser: (user: any) => void;
  setModal: (id: string | null) => void;
  setClient: (id: string | null) => void;
  addClient: (name: string) => void;
  setManualApiKey: (key: string | null) => void;
  setKeyStatus: (status: 'inactive' | 'active' | 'error') => void;
  setLoadingAI: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
  
  syncUserFromDB: () => Promise<void>;
  addMessage: (msg: Partial<Message>) => string;
  updateMessage: (id: string, payload: Partial<Message>) => void;
  deleteMessage: (id: string) => void;
  consumeCredits: (amount: number, description: string) => Promise<boolean>;
  changePlan: (plan: YaraPlan) => void;
  setPreview: (src: string | null) => void;
  
  resetStore: () => void;
}

export const useStore = create<MarcenaState>()(
  persist(
    (set, get) => ({
      isReady: false,
      user: null,
      activeModal: null,
      activeClientId: '1',
      clients: [{ id: '1', name: 'Workshop Master' }],
      messages: [],
      searchQuery: "",
      conversationId: null,
      industrialRates: { mdf: 440, markup: 2.2 },
      selectedImage: null,
      loadingAI: false,
      credits: 99999, // High initial credits for full vision demo
      currentPlan: 'enterprise',
      manualApiKey: null,
      keyStatus: 'inactive',

      setReady: (val) => set({ isReady: val }),
      setUser: (user) => set({ user }),
      setModal: (id) => set({ activeModal: id }),
      setClient: (id) => set({ activeClientId: id, conversationId: crypto.randomUUID() }),
      setManualApiKey: (manualApiKey) => set({ manualApiKey }),
      setKeyStatus: (keyStatus) => set({ keyStatus }),
      setLoadingAI: (loadingAI) => set({ loadingAI }),
      setPreview: (selectedImage) => set({ selectedImage }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      
      syncUserFromDB: async () => {
        const currentUser = get().user;
        if (!currentUser) return;
        
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', currentUser.id)
            .single();
            
          if (data) {
            set({ credits: data.credits, currentPlan: data.plan });
          }
        } catch (e) {
          console.warn("Supabase Sync indisponível, usando estado local.");
        }
      },

      consumeCredits: async (amount, description) => {
        const user = get().user;
        if (!user) return false;

        try {
          // Attempt DB update
          const { data: dbUser } = await supabase.from('users').select('credits').eq('id', user.id).single();
          if (dbUser && dbUser.credits >= amount) {
            await supabase.from('users').update({ credits: dbUser.credits - amount }).eq('id', user.id);
            await supabase.from('credits_log').insert({ user_id: user.id, amount: -amount, description });
          }
          
          // Always update local state for immediate feedback
          set((state) => ({ credits: Math.max(0, state.credits - amount) }));
          return true;
        } catch (e) {
          const newCredits = Math.max(0, get().credits - amount);
          set({ credits: newCredits });
          return true;
        }
      },

      addClient: (name) => set((state) => ({ 
        clients: [...state.clients, { id: Date.now().toString(), name }],
        activeClientId: Date.now().toString()
      })),

      addMessage: (msg) => {
        const id = msg.id || crypto.randomUUID();
        const newMessage: Message = {
          id,
          conversationId: get().conversationId || crypto.randomUUID(),
          from: msg.from || 'user',
          type: msg.type || 'text',
          text: msg.text || '',
          timestamp: new Date().toISOString(),
          status: msg.status || 'sent',
          progressiveSteps: msg.progressiveSteps || { parsed: false, render: false, pricing: false, cutPlan: false },
          ...msg
        } as Message;
        set((state) => ({ messages: [...state.messages, newMessage] }));
        return id;
      },

      updateMessage: (id, payload) => set((state) => ({
        messages: state.messages.map((m) => m.id === id ? { ...m, ...payload } : m)
      })),

      deleteMessage: (id) => set((state) => ({
        messages: state.messages.filter((m) => m.id !== id)
      })),

      changePlan: (plan) => set({ currentPlan: plan }),

      resetStore: () => {
        localStorage.removeItem('marcenapp-supreme-v383-persistence');
        window.location.reload();
      }
    }),
    { name: 'marcenapp-supreme-v383-persistence' }
  )
);
