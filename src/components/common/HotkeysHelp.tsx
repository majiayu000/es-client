import React from 'react';
import { useHotkeysStore } from '@/store/hotkeys';

interface HotkeysHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

function HotkeysHelp({ isOpen, onClose }: HotkeysHelpProps) {
  const { hotkeys } = useHotkeysStore();

  if (!isOpen) return null;

  // 按组分类快捷键
  const hotkeysByGroup = hotkeys.reduce((acc, hotkey) => {
    const group = hotkey.group || '其他';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(hotkey);
    return acc;
  }, {} as Record<string, typeof hotkeys>);

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                键盘快捷键
              </h3>
              <div className="mt-4">
                {Object.entries(hotkeysByGroup).map(([group, groupHotkeys]) => (
                  <div key={group} className="mb-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">{group}</h4>
                    <dl className="space-y-2">
                      {groupHotkeys.map((hotkey) => (
                        <div key={hotkey.id} className="flex justify-between">
                          <dt className="text-sm text-gray-500">{hotkey.description}</dt>
                          <dd className="text-sm text-gray-900">
                            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
                              {hotkey.key}
                            </kbd>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-6">
            <button
              type="button"
              className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
              onClick={onClose}
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HotkeysHelp; 