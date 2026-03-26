import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AnalyticsContext = createContext();
const ANALYTICS_KEY = 'portfolio-analytics';

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) throw new Error('useAnalytics must be used within an AnalyticsProvider');
  return context;
};

const getVisitorId = () => {
  let visitorId = localStorage.getItem('portfolio-visitor-id');
  if (!visitorId) {
    visitorId = 'v_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    localStorage.setItem('portfolio-visitor-id', visitorId);
  }
  return visitorId;
};

const getAnalyticsData = () => {
  try {
    const stored = localStorage.getItem(ANALYTICS_KEY);
    return stored ? JSON.parse(stored) : { pageviews: [], events: [] };
  } catch {
    return { pageviews: [], events: [] };
  }
};

const saveAnalyticsData = (data) => {
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
};

export const AnalyticsProvider = ({ children }) => {
  const [visitorId] = useState(getVisitorId);

  const trackPageView = useCallback((page) => {
    const data = getAnalyticsData();
    data.pageviews.push({
      page,
      visitor_id: visitorId,
      user_agent: navigator.userAgent,
      referrer: document.referrer || null,
      timestamp: new Date().toISOString(),
    });
    // Keep last 500 pageviews to avoid localStorage bloat
    if (data.pageviews.length > 500) data.pageviews = data.pageviews.slice(-500);
    saveAnalyticsData(data);
  }, [visitorId]);

  const trackEvent = useCallback((eventType, metadata = {}) => {
    const data = getAnalyticsData();
    data.events.push({
      event_type: eventType,
      visitor_id: visitorId,
      metadata,
      timestamp: new Date().toISOString(),
    });
    if (data.events.length > 500) data.events = data.events.slice(-500);
    saveAnalyticsData(data);
  }, [visitorId]);

  const trackResumeDownload = useCallback(() => { trackEvent('resume_download', { source: window.location.pathname }); }, [trackEvent]);
  const trackSectionView = useCallback((sectionName) => { trackEvent('section_view', { section: sectionName }); }, [trackEvent]);

  useEffect(() => { trackPageView(window.location.pathname); }, [trackPageView]);

  return (
    <AnalyticsContext.Provider value={{ visitorId, trackPageView, trackEvent, trackResumeDownload, trackSectionView }}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export default AnalyticsContext;
