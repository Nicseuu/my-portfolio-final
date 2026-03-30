import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/context/ThemeContext';

const CinematicProfile = ({ profileImages, className = '' }) => {
  const { isDark, theme } = useTheme();
  const toLightRef = useRef(null);
  const toDarkRef = useRef(null);
  const prevThemeRef = useRef(theme);
  const [videosReady, setVideosReady] = useState({ light: false, dark: false });
  const [videoError, setVideoError] = useState({ light: false, dark: false });
  const [activeVideo, setActiveVideo] = useState(isDark ? 'to-dark' : 'to-light');

  // Preload both videos and seek to last frame on initial load
  useEffect(() => {
    const lightVideo = toLightRef.current;
    const darkVideo = toDarkRef.current;

    const seekToEnd = (video, which) => {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        setVideosReady(prev => ({ ...prev, [which]: true }));
      };
      video.addEventListener('seeked', onSeeked);
      video.currentTime = video.duration || 1;
    };

    const onLightMeta = () => {
      if (prevThemeRef.current === 'light' && lightVideo) {
        seekToEnd(lightVideo, 'light');
      } else {
        setVideosReady(prev => ({ ...prev, light: true }));
      }
    };
    const onDarkMeta = () => {
      if (prevThemeRef.current === 'dark' && darkVideo) {
        seekToEnd(darkVideo, 'dark');
      } else {
        setVideosReady(prev => ({ ...prev, dark: true }));
      }
    };

    if (lightVideo) {
      lightVideo.addEventListener('loadeddata', onLightMeta);
      lightVideo.load();
    }
    if (darkVideo) {
      darkVideo.addEventListener('loadeddata', onDarkMeta);
      darkVideo.load();
    }

    return () => {
      if (lightVideo) lightVideo.removeEventListener('loadeddata', onLightMeta);
      if (darkVideo) darkVideo.removeEventListener('loadeddata', onDarkMeta);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Play cinematic transition on theme change
  useEffect(() => {
    if (prevThemeRef.current === theme) return;
    const direction = theme === 'light' ? 'to-light' : 'to-dark';
    prevThemeRef.current = theme;

    const isLight = direction === 'to-light';
    const canPlay = isLight
      ? videosReady.light && !videoError.light
      : videosReady.dark && !videoError.dark;
    if (!canPlay) return;

    const video = isLight ? toLightRef.current : toDarkRef.current;
    const other = isLight ? toDarkRef.current : toLightRef.current;
    if (!video) return;

    if (other) other.pause();

    video.currentTime = 0;
    setActiveVideo(direction);

    video.play().catch(() => {
      // Mobile may block autoplay — seek to end frame instead
      video.currentTime = video.duration || 1;
    });
  }, [theme, videosReady, videoError]);

  const handleVideoError = useCallback((dir) => {
    setVideoError(prev => ({ ...prev, [dir]: true }));
  }, []);

  const bothFailed = videoError.light && videoError.dark;
  const placeholderBg = isDark ? '#1a1c1b' : '#f5f4f0';

  return (
    <div className={`relative overflow-hidden ${className}`}>

      {/* Profile image fallback if both videos fail */}
      {bothFailed && (
        <div
          className="absolute inset-0 w-full h-full"
          style={{ backgroundColor: placeholderBg, zIndex: 1 }}
        >
          {profileImages?.[0] && (
            <img
              src={profileImages[0]}
              alt="Profile"
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center 15%' }}
              loading="lazy"
            />
          )}
        </div>
      )}

      {/* To-Light video */}
      <video
        ref={toLightRef}
        src="/to-light.mp4"
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          objectPosition: 'center 15%',
          zIndex: activeVideo === 'to-light' ? 3 : 1,
          opacity: activeVideo === 'to-light' ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
        onError={() => handleVideoError('light')}
      />

      {/* To-Dark video */}
      <video
        ref={toDarkRef}
        src="/to-dark.mp4"
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          objectPosition: 'center 15%',
          zIndex: activeVideo === 'to-dark' ? 3 : 1,
          opacity: activeVideo === 'to-dark' ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
        onError={() => handleVideoError('dark')}
      />
    </div>
  );
};

export default CinematicProfile;
