import type { ProjectHistoryItem } from '../types';

const HISTORY_KEY = 'marcenapp_project_history';
const DB_NAME = 'MarcenAppDB';
const STORE_NAME = 'projects';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

async function migrateFromLocalStorage(): Promise<ProjectHistoryItem[] | null> {
  const historyJson = localStorage.getItem(HISTORY_KEY);
  if (!historyJson) return null;

  console.log("Found existing history in localStorage. Migrating to IndexedDB...");

  try {
    const history: any[] = JSON.parse(historyJson);
    const migratedHistory: ProjectHistoryItem[] = history.map(project => {
      if (project.image3d && !project.views3d) {
        const { image3d, ...rest } = project;
        return { ...rest, views3d: [image3d] };
      }
      return project;
    });

    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    migratedHistory.forEach(project => store.put(project));
    
    await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });

    localStorage.removeItem(HISTORY_KEY);
    console.log('Successfully migrated history from localStorage to IndexedDB.');
    return migratedHistory;

  } catch (error) {
    console.error("Failed to migrate history from localStorage. Clearing old data.", error);
    localStorage.removeItem(HISTORY_KEY);
    return null;
  }
}

export const getHistory = async (): Promise<ProjectHistoryItem[]> => {
  const migratedData = await migrateFromLocalStorage();
  if (migratedData !== null) {
    return migratedData.sort((a, b) => b.timestamp - a.timestamp);
  }

  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const projects: ProjectHistoryItem[] = request.result;
      resolve(projects.sort((a, b) => b.timestamp - a.timestamp));
    };
  });
};

export const saveHistory = async (history: ProjectHistoryItem[]): Promise<void> => {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    history.forEach(project => store.put(project));
    await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error("Failed to save history to IndexedDB", error);
  }
};

export const addProjectToHistory = async (project: Omit<ProjectHistoryItem, 'id' | 'timestamp'>): Promise<ProjectHistoryItem[]> => {
    const newProject: ProjectHistoryItem = {
        ...project,
        id: `proj_${Date.now()}`,
        timestamp: Date.now(),
    };

    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(newProject);
    
    await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
    
    return getHistory();
};

export const removeProjectFromHistory = async (id: string): Promise<ProjectHistoryItem[]> => {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    
    await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });

    return getHistory();
};

export const updateProjectInHistory = async (id: string, updates: Partial<ProjectHistoryItem>): Promise<ProjectHistoryItem | null> => {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const project = await new Promise<ProjectHistoryItem | undefined>((resolve, reject) => {
        const request = store.get(id);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
    
    if (!project) {
        return null;
    }

    const updatedProject = { ...project, ...updates };
    store.put(updatedProject);

    await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });

    return updatedProject;
};
