import React from 'react';
import { useAppStore } from '@/store';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlusIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface ConnectionListProps {
  onConnectionSelect: (connectionId: string) => void;
  onAddNew: () => void;
}

function ConnectionList({ onConnectionSelect, onAddNew }: ConnectionListProps) {
  const { connections, activeConnectionId, removeConnection } = useAppStore();
  const activeConnection = connections.find(conn => conn.id === activeConnectionId);

  return (
    <div className="flex items-center space-x-2">
      {/* 添加新连接按钮 */}
      <Button
        onClick={onAddNew}
        variant="outline"
        size="sm"
        className="text-indigo-600 dark:text-indigo-400 border-indigo-600/20 dark:border-indigo-400/20 hover:bg-indigo-50 dark:hover:bg-indigo-950"
      >
        <PlusIcon className="h-4 w-4 mr-1" />
        添加连接
      </Button>

      {/* 连接列表下拉菜单 */}
      {connections.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="min-w-[140px] justify-between"
            >
              <span className="truncate">
                {activeConnection ? activeConnection.name : '选择连接'}
              </span>
              <ChevronDownIcon className="h-4 w-4 ml-2 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]" style={{ backgroundColor: 'white' }}>
            <DropdownMenuLabel>已保存的连接</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {connections.map((connection) => (
              <DropdownMenuItem
                key={connection.id}
                onClick={() => onConnectionSelect(connection.id)}
                className="justify-between group"
              >
                <div className="flex flex-col">
                  <span>{connection.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {connection.hosts[0]}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {connection.id === activeConnectionId && (
                    <div
                      className="h-2 w-2 rounded-full bg-green-500"
                      title="当前活动连接"
                    />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeConnection(connection.id);
                    }}
                    className="hidden group-hover:flex p-1 hover:bg-red-50 rounded-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 hover:text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onAddNew}
              className="text-indigo-600 dark:text-indigo-400"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              添加新连接
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export default ConnectionList; 