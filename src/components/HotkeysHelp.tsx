import React, { useEffect } from 'react';
import { useHotkeysStore } from '../store/hotkeys';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface HotkeysHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GroupedHotkey {
  id: string;
  description: string;
  key: string;
  group: string;
}

export function HotkeysHelp({ isOpen, onClose }: HotkeysHelpProps) {
  const { hotkeys } = useHotkeysStore();

  // 按 ESC 关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // 点击背景关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // 按快捷键分组
  const groupedHotkeys = hotkeys.reduce((acc, hotkey) => {
    const group = hotkey.group || '其他';
    if (!acc[group]) acc[group] = [];
    acc[group].push(hotkey);
    return acc;
  }, {} as Record<string, GroupedHotkey[]>);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            键盘快捷键
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto">
          {Object.entries(groupedHotkeys).map(([group, shortcuts]) => (
            <div key={group} className="mb-6 last:mb-0">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                {group}
              </h3>
              <div className="space-y-2">
                {shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.id}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-gray-900 dark:text-white">
                      {shortcut.description}
                    </span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200 font-mono text-sm">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
          提示：按 ESC 键或点击背景区域可关闭此窗口
        </div>
      </div>
    </div>
  );
} 