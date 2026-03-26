import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);
  const [showHint, setShowHint] = useState(true);

  const handleClick = () => {
    setIsAnimating(true);
    setShowHint(false);
    toggleTheme();
    // Mark as clicked so hint never shows again
    localStorage.setItem('theme-toggled', 'true');
  };

  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  // Show hint after 3 seconds if user hasn't toggled before
  useEffect(() => {
    const hasToggled = localStorage.getItem('theme-toggled');
    if (hasToggled) return;

    const timer = setTimeout(() => setShowHint(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Auto-hide hint after 6 seconds
  useEffect(() => {
    if (!showHint) return;
    const timer = setTimeout(() => setShowHint(false), 10000);
    return () => clearTimeout(timer);
  }, [showHint]);

  return (
    <div className="relative">
      {/* Pulsing ring to draw attention */}
      {showHint && (
        <span
          className={`absolute inset-0 rounded-full pointer-events-none z-0 ${
            isDark ? 'border-2 border-[#d9fb06]/60' : 'border-2 border-[#4a6d00]/50'
          }`}
          style={{
            animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
          }}
        />
      )}

      <button
        onClick={handleClick}
        className={`relative z-10 p-2 rounded-full transition-all duration-500 ${
          isDark
            ? 'bg-[#302f2c] text-[#d9fb06] hover:bg-[#3f4816]'
            : 'bg-gray-100 text-[#4a6d00] hover:bg-gray-200'
        } ${showHint ? (isDark ? 'ring-2 ring-[#d9fb06]/40' : 'ring-2 ring-[#4a6d00]/30') : ''} ${className}`}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        data-testid="theme-toggle-btn"
      >
        <div
          className="relative w-5 h-5"
          style={{
            transform: isAnimating ? 'rotate(360deg) scale(0.8)' : 'rotate(0deg) scale(1)',
            transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <Sun
            className="w-5 h-5 absolute inset-0"
            style={{
              opacity: isDark ? 1 : 0,
              transform: isDark ? 'rotate(0deg)' : 'rotate(90deg)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
            }}
          />
          <Moon
            className="w-5 h-5 absolute inset-0"
            style={{
              opacity: isDark ? 0 : 1,
              transform: isDark ? 'rotate(-90deg)' : 'rotate(0deg)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
            }}
          />
        </div>
      </button>

      {/* Tooltip hint — positioned to the left */}
      {showHint && (
        <div
          className={`absolute right-full mr-2 top-1/2 -translate-y-1/2 whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-medium pointer-events-none z-50 ${
            isDark
              ? 'bg-[#3f4816] text-[#d9fb06] border border-[#d9fb06]/30 shadow-md shadow-[#d9fb06]/10'
              : 'bg-white text-[#4a6d00] border border-[#4a6d00]/20 shadow-md shadow-black/5'
          }`}
          style={{
            animation: 'fadeInLeft 0.3s ease-out',
          }}
        >
          {/* Arrow pointing right */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 rotate-45 ${
              isDark
                ? 'bg-[#3f4816] border-r border-b border-[#d9fb06]/30'
                : 'bg-white border-r border-b border-[#4a6d00]/20'
            }`}
          />
          {isDark ? 'Try light mode' : 'Try dark mode'}
        </div>
      )}

      {/* Keyframe styles */}
      <style>{`
        @keyframes ping {
          0% { transform: scale(1); opacity: 0.8; }
          75%, 100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes fadeInLeft {
          0% { opacity: 0; transform: translateY(-50%) translateX(4px); }
          100% { opacity: 1; transform: translateY(-50%) translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default ThemeToggle;
