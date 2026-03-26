// Content Store: localStorage-based CMS with mockData fallback
// Admin dashboard writes here, portfolio components read from here

import * as mockData from '@/data/mockData';

const STORAGE_KEY = 'portfolio-content';

// Get all saved content from localStorage
const getSavedContent = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Save a section to localStorage
export const saveSection = (section, data) => {
  const all = getSavedContent();
  all[section] = { data, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  // Dispatch event so other tabs/components react
  window.dispatchEvent(new CustomEvent('content-updated', { detail: { section } }));
};

// Deep merge: saved data on top of defaults so missing fields don't crash components
const deepMerge = (defaults, overrides) => {
  if (!defaults || !overrides) return overrides ?? defaults ?? null;
  if (Array.isArray(defaults) && Array.isArray(overrides)) return overrides;
  if (typeof defaults !== 'object' || typeof overrides !== 'object') return overrides;
  const result = { ...defaults };
  for (const key of Object.keys(overrides)) {
    if (overrides[key] !== undefined) {
      result[key] = typeof defaults[key] === 'object' && !Array.isArray(defaults[key]) && defaults[key] !== null
        ? deepMerge(defaults[key], overrides[key])
        : overrides[key];
    }
  }
  return result;
};

// Get a section: merge localStorage override with mockData defaults
export const getSection = (section) => {
  const saved = getSavedContent();
  const defaults = mockData[section] ?? null;
  if (saved[section]?.data) {
    // Merge saved data with defaults so missing fields still work
    return deepMerge(defaults, saved[section].data);
  }
  return defaults;
};

// Check if a section has been customized
export const isCustomized = (section) => {
  const saved = getSavedContent();
  return !!saved[section]?.data;
};

// Reset a section back to mockData defaults
export const resetSection = (section) => {
  const all = getSavedContent();
  delete all[section];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  window.dispatchEvent(new CustomEvent('content-updated', { detail: { section } }));
};

// Get all section names available for editing
export const getEditableSections = () => [
  'personalInfo',
  'metrics',
  'experience',
  'whyHireMe',
  'faqData',
  'skills',
  'education',
  'tools',
  'caseStudies',
  'linkedInPosts',
];
