import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/context/ThemeContext';

const CinematicProfile = ({ profileImages, className = '' }) => {
  const { isDark, theme } = useTheme();
  const toLightRef = useRef(null);
  const toDarkRef = useRef(null);
  const prevThemeRef = useRef(theme);
  const [videoError, setVideoError] = useState({ light: false, dark: false });
  const [videosReady, setVideosReady] = useState({ light: false, dark: false });
  const [frameReady, setFrameReady] = useState(false);
  // Default: show the matching video for current theme on load
  const [activeVideo, setActiveVideo] = useState(isDark ? 'to-dark' : 'to-light');

  // Preload videos and seek to last frame on load
  useEffect(() => {
    const lightVideo = toLightRef.current;
    const darkVideo = toDarkRef.current;

    // Seek to last frame and wait for the seeked event to confirm frame is rendered
    const seekToEnd = (video, which) => {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        setVideosReady(prev => ({ ...prev, [which]: true }));
        setFrameReady(true);
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
    setFrameReady(true); // Video is playing, hide fallback

    video.play().catch(() => {});
  }, [theme, videosReady, videoError]);

  const handleVideoError = useCallback((dir) => {
    setVideoError(prev => ({ ...prev, [dir]: true }));
  }, []);

  // Pick the right fallback image — handle both array and object formats
  const fallbackSrc = Array.isArray(profileImages)
    ? (profileImages[0] || '/profile.jpg')
    : (profileImages?.dark || profileImages?.light || profileImages?.main || '/profile.jpg');

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Invisible spacer to maintain container dimensions */}
      <div style={{ width: '100%', paddingBottom: '100%' }} />

      {/* Fallback image — visible until video frame is ready */}
      {!frameReady && (
        <img
          src={fallbackSrc}
          alt="Profile"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: 'center 15%', zIndex: 2 }}
        />
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
          visibility: activeVideo === 'to-light' ? 'visible' : 'hidden',
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
          visibility: activeVideo === 'to-dark' ? 'visible' : 'hidden',
        }}
        onError={() => handleVideoError('dark')}
      />
    </div>
  );
};

export default CinematicProfile;
