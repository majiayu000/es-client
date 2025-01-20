import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Connection {
  id: string;
  name: string;
  url: string;
  username?: string;
  password?: string;
}

interface ConnectionState {
  connections: Connection[];
  activeConnectionId: string | null;
  addConnection: (connection: Omit<Connection, 'id'>) => void;
  removeConnection: (id: string) => void;
  updateConnection: (id: string, connection: Partial<Connection>) => void;
  setActiveConnection: (id: string | null) => void;
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set) => ({
      connections: [],
      activeConnectionId: null,
      addConnection: (connection) =>
        set((state) => ({
          connections: [
            ...state.connections,
            { ...connection, id: crypto.randomUUID() },
          ],
        })),
      removeConnection: (id) =>
        set((state) => ({
          connections: state.connections.filter((conn) => conn.id !== id),
          activeConnectionId:
            state.activeConnectionId === id ? null : state.activeConnectionId,
        })),
      updateConnection: (id, connection) =>
        set((state) => ({
          connections: state.connections.map((conn) =>
            conn.id === id ? { ...conn, ...connection } : conn
          ),
        })),
      setActiveConnection: (id) =>
        set(() => ({
          activeConnectionId: id,
        })),
    }),
    {
      name: 'elastic-eye-connections',
    }
  )
); 