import React from 'react';

interface ApiKeyInputProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  isDisabled: boolean;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ apiKey, onApiKeyChange, isDisabled }) => {
  return (
    <div className="space-y-4 p-6 bg-yellow-900/20 rounded-xl border border-yellow-700/50">
      <div className="flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-lg font-semibold text-yellow-300">Gemini API Key Required</h2>
      </div>
      <div>
        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-400 mb-2">
          Enter your API key to use the app. Your key is saved securely in your browser's local storage.
        </label>
        <input
          id="apiKey"
          type="password"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          placeholder="Enter your Gemini API Key here"
          className="w-full p-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 ease-in-out"
          disabled={isDisabled}
          aria-label="Gemini API Key Input"
        />
        <p className="text-xs text-gray-500 mt-2">
          You can get your API key from{' '}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:underline"
          >
            Google AI Studio
          </a>.
        </p>
      </div>
    </div>
  );
};
