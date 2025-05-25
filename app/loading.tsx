import React from 'react';

const Loading = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="flex flex-col items-center gap-6">
        {/* Animated gradient ring */}
        <div className="relative flex items-center justify-center">
          <div className="h-20 w-20 animate-spin rounded-full border-[6px] border-t-transparent border-b-transparent border-l-primary border-r-primary shadow-lg" />
          <div className="absolute h-10 w-10 rounded-full bg-primary opacity-80 shadow-inner shadow-primary/30" />
        </div>

        {/* App name + dots animation */}
        <div className="text-center">
          <p className="text-xl font-bold text-primary tracking-wide animate-pulse">
            FileShareDrop
          </p>
          <div className="mt-2 flex justify-center space-x-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
