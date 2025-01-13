import React from 'react';
import { useHotkeysStore } from '../store/hotkeys';

interface HotkeysHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HotkeysHelp({ isOpen, onClose }: HotkeysHelpProps) {
  const hotkeys = useHotkeysStore((state) => state.hotkeys);

  // 按组分类快捷键
  const hotkeysByGroup = Object.values(hotkeys).reduce((acc, hotkey) => {
    if (!acc[hotkey.group]) {
      acc[hotkey.group] = [];
    }
    acc[hotkey.group].push(hotkey);
    return acc;
  }, {} as Record<string, typeof hotkeys[string][]>);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              键盘快捷键
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <span className="sr-only">关闭</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {Object.entries(hotkeysByGroup).map(([group, groupHotkeys]) => (
              <div key={group}>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {group}
                </h3>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-md">
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {groupHotkeys.map((hotkey) => (
                      <div
                        key={hotkey.key}
                        className="flex justify-between py-2 px-4 text-sm"
                      >
                        <span className="text-gray-700 dark:text-gray-300">
                          {hotkey.description}
                        </span>
                        <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                          {hotkey.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-right">
            <button
              onClick={onClose}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 