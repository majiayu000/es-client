import { create } from 'zustand';

interface Hotkey {
  id: string;
  key: string;
  description: string;
  group: string;
}

interface HotkeysState {
  hotkeys: Hotkey[];
  registerHotkey: (id: string, hotkey: Omit<Hotkey, 'id'>) => void;
  unregisterHotkey: (id: string) => void;
}

export const useHotkeysStore = create<HotkeysState>((set) => ({
  hotkeys: [],
  registerHotkey: (id, hotkey) => set((state) => ({
    hotkeys: [...state.hotkeys, { id, ...hotkey }]
  })),
  unregisterHotkey: (id) => set((state) => ({
    hotkeys: state.hotkeys.filter((h) => h.id !== id)
  }))
})); 