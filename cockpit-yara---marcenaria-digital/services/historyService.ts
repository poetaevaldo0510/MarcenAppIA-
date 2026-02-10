
import type { ProjectHistoryItem, UserProfile, FinancialStats } from '../types';

const DB_NAME = 'MarcenAppDB';
const PROJECTS_STORE_NAME = 'projects';
const PROFILE_STORE_NAME = 'carpenterProfile';
const DB_VERSION = 14; 

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PROJECTS_STORE_NAME)) db.createObjectStore(PROJECTS_STORE_NAME, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(PROFILE_STORE_NAME)) db.createObjectStore(PROFILE_STORE_NAME, { keyPath: 'email' });
    };
  });
}

export const getCarpenterProfile = async (): Promise<UserProfile | null> => {
    const db = await openDb();
    return new Promise((resolve) => {
        const tx = db.transaction(PROFILE_STORE_NAME, 'readonly');
        const store = tx.objectStore(PROFILE_STORE_NAME);
        const request = store.get('mestre@oficina.digital');
        request.onsuccess = () => resolve(request.result || null);
    });
};

export const saveCarpenterProfile = async (profile: UserProfile): Promise<UserProfile> => {
    const db = await openDb();
    const tx = db.transaction(PROFILE_STORE_NAME, 'readwrite');
    tx.objectStore(PROFILE_STORE_NAME).put(profile);
    return profile;
};

export const getHistory = async (): Promise<ProjectHistoryItem[]> => {
    const db = await openDb();
    return new Promise((resolve) => {
        const tx = db.transaction(PROJECTS_STORE_NAME, 'readonly');
        const store = tx.objectStore(PROJECTS_STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve((request.result || []).sort((a: any, b: any) => b.updatedAt - a.updatedAt));
    });
};

export const getProjectById = async (id: string): Promise<ProjectHistoryItem | null> => {
    const db = await openDb();
    return new Promise((resolve) => {
        const tx = db.transaction(PROJECTS_STORE_NAME, 'readonly');
        const store = tx.objectStore(PROJECTS_STORE_NAME);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
    });
};

export const addProjectToHistory = async (project: Omit<ProjectHistoryItem, 'id' | 'timestamp'>): Promise<ProjectHistoryItem[]> => {
    const db = await openDb();
    const newProject: ProjectHistoryItem = { 
        ...project, 
        id: `proj_${Date.now()}`, 
        timestamp: Date.now(),
        updatedAt: Date.now()
    } as ProjectHistoryItem;
    const tx = db.transaction(PROJECTS_STORE_NAME, 'readwrite');
    tx.objectStore(PROJECTS_STORE_NAME).add(newProject);
    return getHistory();
};

export const updateProjectInHistory = async (id: string, updates: Partial<ProjectHistoryItem>): Promise<ProjectHistoryItem | null> => {
    const db = await openDb();
    const tx = db.transaction(PROJECTS_STORE_NAME, 'readwrite');
    const store = tx.objectStore(PROJECTS_STORE_NAME);
    const project = await new Promise<any>((resolve) => {
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result);
    });
    if (!project) return null;
    const updated = { ...project, ...updates, updatedAt: Date.now() };
    store.put(updated);
    return updated;
};

export const removeProjectFromHistory = async (id: string): Promise<ProjectHistoryItem[]> => {
    const db = await openDb();
    const tx = db.transaction(PROJECTS_STORE_NAME, 'readwrite');
    tx.objectStore(PROJECTS_STORE_NAME).delete(id);
    return getHistory();
};

export const addCredits = async (amount: number): Promise<number> => {
    const profile = await getCarpenterProfile();
    if (!profile) return 0;
    const newTotal = (profile.credits || 0) + amount;
    await saveCarpenterProfile({ ...profile, credits: newTotal });
    return newTotal;
};

export const refillMasterCredits = async (amount: number = 500): Promise<number> => addCredits(amount);
