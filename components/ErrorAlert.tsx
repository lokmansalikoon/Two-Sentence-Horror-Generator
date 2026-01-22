
import React from 'react';

export const ErrorAlert: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2">
    <div className="flex gap-3">
      <div className="text-red-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </div>
      <p className="text-red-400 text-xs font-medium leading-relaxed">{message}</p>
    </div>
  </div>
);
