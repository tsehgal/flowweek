'use client';

import { useState, useEffect } from 'react';
import { getLastInput, saveLastInput, clearCache, getCacheStats } from '@/lib/cache';

interface InputFormProps {
  onSubmit: (input: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export default function InputForm({
  onSubmit,
  isLoading,
  error,
}: InputFormProps) {
  const [input, setInput] = useState('');
  const [cacheStats, setCacheStats] = useState({ count: 0, totalSize: 0 });
  const charCount = input.length;
  const isValid = charCount >= 20 && charCount <= 2000;

  // Load saved input on mount (PRODUCTION FEATURE!)
  useEffect(() => {
    console.log('🚀 InputForm mounted - loading saved input...');
    // Load user's last input (helps prevent data loss on refresh)
    const lastInput = getLastInput();
    if (lastInput) {
      setInput(lastInput);
    }

    // Update cache stats
    setCacheStats(getCacheStats());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && !isLoading) {
      await onSubmit(input);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <label className="block text-sm font-semibold text-[#272626] mb-2">
          Weekly Goals
        </label>
        <textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            saveLastInput(e.target.value); // Auto-save as they type!
          }}
          placeholder="Example:
• Gym M/T/Th/F 4-6am
• AI learning 30min daily
• Office work 9am-5pm weekdays
• Job applications 90min/week
• Family time 6-9pm every evening
• Sleep 9:30pm-3:30am"
          className="w-full h-[180px] p-3 text-sm border border-[#e9e9e7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2383e2]/20 focus:border-[#2383e2] resize-none font-sans bg-white transition-all placeholder:text-[#787774] placeholder:text-sm"
          maxLength={2000}
          disabled={isLoading}
        />
        <div className="flex justify-between items-center mt-2">
          <span
            className={`text-xs font-normal ${
              charCount > 2000
                ? 'text-red-600'
                : charCount < 20
                  ? 'text-[#787774]'
                  : 'text-[#787774]'
            }`}
          >
            {charCount} / 2000
          </span>
          {charCount < 20 && charCount > 0 && (
            <span className="text-xs text-amber-600 font-normal">
              Min 20 chars
            </span>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={!isValid || isLoading}
        className="w-full bg-[#2383e2] hover:bg-[#1a6dc4] text-white py-3 px-4 rounded-lg font-semibold text-sm disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Generating...
          </>
        ) : (
          'Generate Schedule'
        )}
      </button>

      {/* Clear Cache Button - Dev Only */}
      {process.env.NODE_ENV === 'development' && cacheStats.count > 0 && (
        <button
          type="button"
          onClick={() => {
            clearCache();
            setCacheStats({ count: 0, totalSize: 0 });
          }}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded-lg font-medium text-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear Cache ({cacheStats.count} saved)
        </button>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <svg
              className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-red-700 text-sm leading-tight">{error}</p>
          </div>
        </div>
      )}
    </form>
  );
}
