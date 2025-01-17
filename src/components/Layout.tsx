import React, { useEffect, useCallback, useMemo } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';
import { ConnectionList } from './ConnectionList';
import { ConnectionForm } from './ConnectionForm';
import { MobileNav } from './MobileNav';
import { SunIcon, MoonIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '../store';
import { useHotkeysStore } from '../store/hotkeys';
import { HotkeysHelp } from './HotkeysHelp';

interface LayoutProps {
  children: (props: { activeConnectionId: string | null }) => React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showConnectionForm, setShowConnectionForm] = React.useState(false);
  const [showHotkeysHelp, setShowHotkeysHelp] = React.useState(false);
  
  const { 
    isDarkMode, 
    toggleDarkMode,
    activeConnectionId,
    setActiveConnection
  } = useAppStore();

  const { registerHotkey, unregisterHotkey } = useHotkeysStore();

  // 使用 useMemo 缓存导航配置
  const navigation = useMemo(() => [
    { name: '首页', href: '/' },
    { name: '分片', href: '/shards' },
    { name: '索引', href: '/indices' },
    { name: '搜索', href: '/search' },
    { name: '快照', href: '/snapshots' },
  ], []);

  // 使用 useCallback 缓存事件处理函数
  const handleConnectionSelect = useCallback((connectionId: string) => {
    setActiveConnection(connectionId);
  }, [setActiveConnection]);

  const handleAddConnection = useCallback(() => {
    setShowConnectionForm(true);
  }, []);

  const handleConnectionSuccess = useCallback((connectionId: string) => {
    setActiveConnection(connectionId);
    setShowConnectionForm(false);
  }, [setActiveConnection]);

  // 注册快捷键
  useEffect(() => {
    // 注册所有快捷键
    const registerAllHotkeys = () => {
      // 导航快捷键
      navigation.forEach((item, index) => {
        registerHotkey(`nav-${index + 1}`, {
          key: `cmd+${index + 1}`,
          description: `导航到${item.name}`,
          group: '导航',
        });
      });

      // 功能快捷键
      registerHotkey('toggle-theme', {
        key: 'cmd+shift+d',
        description: '切换深色模式',
        group: '功能',
      });

      registerHotkey('new-connection', {
        key: 'cmd+shift+n',
        description: '新建连接',
        group: '连接',
      });

      registerHotkey('show-help', {
        key: '?',
        description: '显示快捷键帮助',
        group: '帮助',
      });
    };

    // 注册快捷键
    registerAllHotkeys();

    // 清理函数
    return () => {
      navigation.forEach((_, index) => {
        unregisterHotkey(`nav-${index + 1}`);
      });
      unregisterHotkey('toggle-theme');
      unregisterHotkey('new-connection');
      unregisterHotkey('show-help');
    };
  }, [navigation, registerHotkey, unregisterHotkey]); // 只在需要的依赖变化时重新注册

  // 绑定快捷键行为
  useHotkeys('cmd+1', () => navigate('/'), [navigate]);
  useHotkeys('cmd+2', () => navigate('/shards'), [navigate]);
  useHotkeys('cmd+3', () => navigate('/indices'), [navigate]);
  useHotkeys('cmd+4', () => navigate('/search'), [navigate]);
  useHotkeys('cmd+5', () => navigate('/snapshots'), [navigate]);
  useHotkeys('cmd+shift+d', toggleDarkMode, [toggleDarkMode]);
  useHotkeys('cmd+shift+n', () => setShowConnectionForm(true), []);
  useHotkeys('?', () => setShowHotkeysHelp(true), []);

  // 主题效果
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* 导航栏 */}
      <nav className="relative bg-white/95 dark:bg-gray-800/95 shadow-lg border-b border-gray-100 dark:border-gray-700 transition-colors duration-200 overflow-hidden backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.05),rgba(255,255,255,0))]"></div>
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="relative flex justify-between h-16">
            <div className="flex flex-1 items-center">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-xl font-bold font-mono tracking-wider relative group">
                  <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">ES</span>
                  <span className="relative z-10 text-gray-700 dark:text-gray-200">-</span>
                  <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">EYE</span>
                  <div className="absolute -inset-x-2 -inset-y-1 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 blur opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                </Link>
              </div>

              {/* 桌面端导航链接 */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-4 overflow-x-auto">
                {navigation.map((item, index) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) => `
                      whitespace-nowrap inline-flex items-center px-3 py-2 text-sm font-medium border-b-2 transition-colors duration-200
                      ${isActive
                        ? 'border-indigo-500 text-gray-900 dark:text-white dark:border-indigo-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300'
                      }
                    `}
                  >
                    <span>{item.name}</span>
                    <kbd className="ml-2 text-xs text-gray-400">⌘{index + 1}</kbd>
                  </NavLink>
                ))}
              </div>
            </div>

            {/* 功能按钮区 */}
            <div className="flex items-center space-x-4">
              {/* 帮助按钮 */}
              <button
                onClick={() => setShowHotkeysHelp(true)}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
              >
                <span className="sr-only">显示快捷键帮助</span>
                <QuestionMarkCircleIcon className="h-5 w-5" />
              </button>

              {/* 深色模式切换按钮 */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
              >
                <span className="sr-only">切换深色模式</span>
                {isDarkMode ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </button>

              {/* 连接管理 */}
              <ConnectionList
                onConnectionSelect={handleConnectionSelect}
                onAddNew={handleAddConnection}
              />
            </div>

            {/* 移动端导航 */}
            <MobileNav navigation={navigation} />
          </div>
        </div>
      </nav>

      {/* 主要内容区域 */}
      <main className="flex-1">
        <div className="max-w-[90rem] mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {children({ activeConnectionId })}
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-[90rem] mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} ElasticEye. All rights reserved.
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Version 1.0.0
            </div>
          </div>
        </div>
      </footer>

      {/* 连接表单对话框 */}
      {showConnectionForm && (
        <ConnectionForm
          onConnected={handleConnectionSuccess}
          onCancel={() => setShowConnectionForm(false)}
        />
      )}

      {/* 快捷键帮助对话框 */}
      <HotkeysHelp
        isOpen={showHotkeysHelp}
        onClose={() => setShowHotkeysHelp(false)}
      />
    </div>
  );
} 