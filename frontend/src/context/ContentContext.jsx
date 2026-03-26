import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSection, saveSection, resetSection } from '@/lib/contentStore';

const ContentContext = createContext(null);

export const ContentProvider = ({ children }) => {
  // Track a version counter to trigger re-renders when content changes
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const handler = () => setVersion(v => v + 1);
    window.addEventListener('content-updated', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('content-updated', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const get = useCallback((section) => {
    // version is in the dependency to ensure fresh reads after updates
    return getSection(section);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const save = useCallback((section, data) => {
    saveSection(section, data);
  }, []);

  const reset = useCallback((section) => {
    resetSection(section);
  }, []);

  return (
    <ContentContext.Provider value={{ get, save, reset, version }}>
      {children}
    </ContentContext.Provider>
  );
};

// Hook for portfolio components to read content
export const useContent = (section) => {
  const ctx = useContext(ContentContext);
  if (!ctx) {
    // Fallback if used outside provider
    return getSection(section);
  }
  return ctx.get(section);
};

// Hook for admin to get save/reset functions
export const useContentAdmin = () => {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContentAdmin must be used within ContentProvider');
  return { save: ctx.save, reset: ctx.reset, get: ctx.get };
};
