import React, { useEffect, useRef } from 'react';

interface LogViewerProps {
  logs: string[];
  maxHeight?: string;
}

function LogViewer({ logs, maxHeight = '200px' }: LogViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div
      ref={scrollRef}
      className="bg-gray-100 dark:bg-gray-800 rounded-md p-4 font-mono text-sm overflow-y-auto"
      style={{ maxHeight }}
    >
      {logs.map((log, index) => (
        <div key={index} className="text-gray-700 dark:text-gray-300">
          {log}
        </div>
      ))}
    </div>
  );
}

export default LogViewer; 