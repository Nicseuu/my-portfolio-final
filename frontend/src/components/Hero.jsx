import React, { useEffect, useState } from 'react';
import { MapPin, Sparkles, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/context/ThemeContext';
import { useContent } from '@/context/ContentContext';
import CinematicProfile from '@/components/CinematicProfile';

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { isDark } = useTheme();
  const personalInfo = useContent('personalInfo');

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Theme-aware color helpers
  const accent = isDark ? '#d9fb06' : '#4a6d00';
  const accentBg = isDark ? 'bg-[#d9fb06]' : 'bg-[#4a6d00]';
  const accentText = isDark ? 'text-[#d9fb06]' : 'text-[#4a6d00]';
  const accentBorder = isDark ? 'border-[#d9fb06]' : 'border-[#4a6d00]';
  const textMain = isDark ? 'text-white' : 'text-[#1a1c1b]';
  const textMuted = isDark ? 'text-[#888680]' : 'text-[#6b6964]';
  const olive = isDark ? '#3f4816' : '#d4d2ca';
  const oliveBg = isDark ? 'bg-[#3f4816]' : 'bg-[#d4d2ca]';
  const pageBg = isDark ? '#1a1c1b' : '#f5f4f0';

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
      role="banner"
      aria-label="Hero section"
    >
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 hero-gradient overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br animate-gradient ${
          isDark
            ? 'from-[#3f4816]/20 via-transparent to-[#1a1c1b]'
            : 'from-[#d4d2ca]/30 via-transparent to-[#f5f4f0]'
        }`} />

        {/* Decorative elements */}
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-float ${
          isDark ? 'bg-[#d9fb06]/5' : 'bg-[#4a6d00]/5'
        }`} />
        <div className={`absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-2xl animate-float ${
          isDark ? 'bg-[#3f4816]/30' : 'bg-[#d4d2ca]/40'
        }`} style={{ animationDelay: '1s' }} />

        {/* Grid pattern overlay */}
        <div
          className={`absolute inset-0 ${isDark ? 'opacity-5' : 'opacity-[0.03]'}`}
          style={{
            backgroundImage: `linear-gradient(${isDark ? 'rgba(217,251,6,0.1)' : 'rgba(74,109,0,0.15)'} 1px, transparent 1px),
                              linear-gradient(90deg, ${isDark ? 'rgba(217,251,6,0.1)' : 'rgba(74,109,0,0.15)'} 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <div className="container-custom relative z-10 pt-24 sm:pt-28 md:pt-32 lg:pt-36 pb-20 overflow-hidden">
        {/* Main Hero Row */}
        <div className={`flex flex-col sm:flex-row items-center gap-6 sm:gap-8 md:gap-12 lg:gap-16 mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

          {/* LEFT - Cinematic Profile with Theme Video Toggle */}
          <div className="flex-shrink-0">
            <div className="relative group">
              {/* Cinematic Profile Video — clean square, no borders */}
              <div
                className={`relative z-10 w-32 h-32 sm:w-40 sm:h-40 md:w-56 md:h-56 lg:w-72 lg:h-72 xl:w-80 xl:h-80 rounded-2xl overflow-hidden shadow-xl transition-all duration-500 ${
                  isDark
                    ? 'shadow-[#d9fb06]/20'
                    : 'shadow-[#4a6d00]/15'
                } hover:scale-105 hover:shadow-2xl`}
              >
                <CinematicProfile
                  profileImages={personalInfo.profileImages}
                  className="w-full h-full rounded-2xl"
                />
              </div>
            </div>
          </div>

          {/* RIGHT - Name & Title */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            {/* Status Badge */}
            <div className="hidden sm:flex items-center gap-3 mb-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full border ${
                isDark
                  ? 'bg-[#3f4816]/50 border-[#3f4816]'
                  : 'bg-[#4a6d00]/10 border-[#4a6d00]/30'
              }`}>
                <span className={`w-2 h-2 rounded-full animate-pulse ${isDark ? 'bg-[#d9fb06]' : 'bg-[#4a6d00]'}`} />
                <span className={`text-xs md:text-sm font-medium ${accentText}`}>{personalInfo.availability.status}</span>
              </div>
            </div>

            {/* Name */}
            <h1
              className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-[0.95] mb-2 md:mb-4 ${textMain}`}
              style={{ letterSpacing: '-0.02em' }}
            >
              {personalInfo.name.split(' ')[0]}{' '}
              <span className={accentText}>{personalInfo.name.split(' ')[1]}</span>
            </h1>

            {/* Work Title */}
            <p className={`text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold ${textMuted}`}>
              {personalInfo.title}
            </p>

            {/* Location */}
            <div className={`flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm mt-2 sm:mt-3 ${textMuted}`}>
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{personalInfo.location}</span>
            </div>
          </div>
        </div>

        {/* Content Below */}
        <div className="w-full">
          {/* Subtitle */}
          <p className={`text-base sm:text-lg md:text-xl mb-6 md:mb-8 max-w-3xl transition-all duration-700 delay-200 ${textMuted} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            Building & scaling crypto communities from the ground up.
            <span className={`font-medium ${textMain}`}> Proven results with 163% growth</span> in 5 months.
          </p>

          {/* Achievement Badges */}
          <div className={`flex flex-wrap gap-2 md:gap-3 mb-6 md:mb-8 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {personalInfo.badges.map((badge, index) => (
              <Badge
                key={index}
                variant="outline"
                className={`px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium transition-all cursor-default ${
                  isDark
                    ? 'border-[#3f4816] bg-[#3f4816]/30 text-white hover:border-[#d9fb06] hover:text-[#d9fb06]'
                    : 'border-[#d4d2ca] bg-white text-[#1a1c1b] hover:border-[#4a6d00] hover:text-[#4a6d00]'
                }`}
              >
                {index === 0 && <TrendingUp className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />}
                {index === 1 && <Users className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />}
                {index === 2 && <Sparkles className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />}
                {badge}
              </Badge>
            ))}
          </div>

          {/* CTAs */}
          <div className={`flex flex-wrap gap-3 md:gap-4 transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Button
              size="lg"
              className={`rounded-full px-6 md:px-8 py-5 md:py-6 text-sm md:text-base font-semibold transition-all duration-300 hover:scale-105 ${
                isDark
                  ? 'bg-[#d9fb06] text-[#1a1c1b] hover:bg-[#d9fb06]/90'
                  : 'bg-[#4a6d00] text-white hover:bg-[#3d5c00]'
              }`}
              onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Let's Work Together
            </Button>
            <Button
              size="lg"
              variant="outline"
              className={`rounded-full px-6 md:px-8 py-5 md:py-6 text-sm md:text-base transition-all duration-300 ${
                isDark
                  ? 'border-[#888680] text-white hover:border-[#d9fb06] hover:text-[#d9fb06]'
                  : 'border-[#6b6964] text-[#1a1c1b] hover:border-[#4a6d00] hover:text-[#4a6d00]'
              }`}
              onClick={() => document.querySelector('#case-studies')?.scrollIntoView({ behavior: 'smooth' })}
            >
              View Case Studies
            </Button>
          </div>

          {/* Quick Stats */}
          <div className={`grid grid-cols-3 gap-6 md:gap-12 lg:gap-16 mt-10 md:mt-12 pt-6 md:pt-8 border-t transition-all duration-700 delay-500 ${
            isDark ? 'border-[#3f4816]/50' : 'border-[#d4d2ca]/50'
          } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div>
              <p className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black ${accentText}`}>95K+</p>
              <p className={`text-xs md:text-sm mt-1 ${textMuted}`}>Members Managed</p>
            </div>
            <div>
              <p className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black ${textMain}`}>1.6M+</p>
              <p className={`text-xs md:text-sm mt-1 ${textMuted}`}>Reach Achieved</p>
            </div>
            <div>
              <p className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black ${textMain}`}>60%</p>
              <p className={`text-xs md:text-sm mt-1 ${textMuted}`}>Spam Reduced</p>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
};

export default Hero;
