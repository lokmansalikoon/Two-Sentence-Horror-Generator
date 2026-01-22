
import React from 'react';

interface ErrorAlertProps {
  message: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl relative w-full group animate-in fade-in slide-in-from-top-2 duration-500" role="alert">
      <div className="flex items-start gap-4">
        <div className="bg-red-500/20 p-2 rounded-xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="space-y-1">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-red-400">Production Error</h4>
          <p className="text-gray-400 text-xs leading-relaxed">{message}</p>
        </div>
      </div>
    </div>
  );
};
