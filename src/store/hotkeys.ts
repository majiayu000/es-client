import { create } from 'zustand';

export interface Hotkey {
  key: string;
  description: string;
  group: string;
}

interface HotkeysState {
  hotkeys: Record<string, Hotkey>;
  registerHotkey: (id: string, hotkey: Hotkey) => void;
  unregisterHotkey: (id: string) => void;
}

export const useHotkeysStore = create<HotkeysState>((set) => ({
  hotkeys: {},
  registerHotkey: (id, hotkey) =>
    set((state) => ({
      hotkeys: { ...state.hotkeys, [id]: hotkey },
    })),
  unregisterHotkey: (id) =>
    set((state) => {
      const { [id]: _, ...rest } = state.hotkeys;
      return { hotkeys: rest };
    }),
})); 