import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { XMarkIcon, Bars3Icon } from '@heroicons/react/24/outline';

interface MobileNavProps {
  navigation: Array<{ name: string; href: string }>;
}

export function MobileNav({ navigation }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="sm:hidden">
      {/* 汉堡菜单按钮 */}
      <button
        type="button"
        className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 dark:hover:bg-gray-800"
        onClick={() => setIsOpen(true)}
      >
        <span className="sr-only">打开菜单</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* 侧边抽屉 */}
      <div
        className={`fixed inset-0 z-40 transform transition-transform ease-in-out duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* 背景遮罩 */}
        <div
          className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsOpen(false)}
        />

        {/* 导航内容 */}
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800 shadow-xl">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setIsOpen(false)}
            >
              <span className="sr-only">关闭菜单</span>
              <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) => `
                    group flex items-center px-2 py-2 text-base font-medium rounded-md
                    ${isActive
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700'
                    }
                  `}
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
} 