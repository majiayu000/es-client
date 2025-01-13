import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Connection {
  id: string;
  name: string;
  hosts: string[];
  is_active: boolean;
}

interface AppState {
  // 主题相关
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  
  // 连接相关
  connections: Connection[];
  activeConnectionId: string | null;
  addConnection: (connection: Connection) => void;
  removeConnection: (connectionId: string) => void;
  setActiveConnection: (connectionId: string) => void;
  updateConnection: (connectionId: string, updates: Partial<Connection>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // 主题状态
      isDarkMode: typeof window !== 'undefined' 
        ? localStorage.getItem('darkMode') === 'true' ||
          (!('darkMode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
        : false,
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

      // 连接状态
      connections: [],
      activeConnectionId: null,
      addConnection: (connection) => set((state) => ({
        connections: [...state.connections, connection],
        activeConnectionId: connection.id,
      })),
      removeConnection: (connectionId) => set((state) => ({
        connections: state.connections.filter((conn) => conn.id !== connectionId),
        activeConnectionId: state.activeConnectionId === connectionId ? null : state.activeConnectionId,
      })),
      setActiveConnection: (connectionId) => set({ activeConnectionId: connectionId }),
      updateConnection: (connectionId, updates) => set((state) => ({
        connections: state.connections.map((conn) =>
          conn.id === connectionId ? { ...conn, ...updates } : conn
        ),
      })),
    }),
    {
      name: 'es-lif-storage',
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        connections: state.connections,
        activeConnectionId: state.activeConnectionId,
      }),
    }
  )
); 