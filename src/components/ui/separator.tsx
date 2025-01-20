import React from 'react';

interface SeparatorProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

function Separator({ className = '', orientation = 'horizontal' }: SeparatorProps) {
  return (
    <div
      className={`
        ${orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px'}
        bg-gray-200 dark:bg-gray-700
        ${className}
      `}
      role="separator"
    />
  );
}

export default Separator;
