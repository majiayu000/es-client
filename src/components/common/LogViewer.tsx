import React, { useEffect, useRef } from 'react';
import { cn } from "@/lib/utils";

interface LogViewerProps {
  logs: string[];
  maxHeight?: string;
  className?: string;
}

export default function LogViewer({ logs, maxHeight = "200px", className }: LogViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (logs.length === 0) return null;

  return (
    <div
      ref={scrollRef}
      className={cn(
        "bg-gray-50 dark:bg-gray-800 rounded-md p-4 font-mono text-sm overflow-y-auto",
        className
      )}
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