import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Connection {
  id: string;
  name: string;
  hosts: string[];
  username?: string;
  password?: string;
  is_active?: boolean;
}

interface AppState {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  connections: Connection[];
  activeConnectionId: string | null;
  addConnection: (connection: Connection) => void;
  updateConnection: (id: string, connection: Partial<Connection>) => void;
  removeConnection: (id: string) => void;
  setActiveConnection: (id: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isDarkMode: false,
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      connections: [],
      activeConnectionId: null,
      addConnection: (connection) =>
        set((state) => ({
          connections: [...state.connections, connection],
          activeConnectionId: connection.id
        })),
      updateConnection: (id, connection) =>
        set((state) => ({
          connections: state.connections.map((conn) =>
            conn.id === id ? { ...conn, ...connection } : conn
          )
        })),
      removeConnection: (id) =>
        set((state) => ({
          connections: state.connections.filter((conn) => conn.id !== id),
          activeConnectionId: state.activeConnectionId === id ? null : state.activeConnectionId
        })),
      setActiveConnection: (id) =>
        set(() => ({
          activeConnectionId: id
        }))
    }),
    {
      name: 'elastic-eye-storage'
    }
  )
); 