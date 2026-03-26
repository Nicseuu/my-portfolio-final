import React, { useState, useRef, useEffect } from 'react';
import { TrendingUp, Bot, Users, Zap, Shield, BarChart3 } from 'lucide-react';
import { useContent } from '@/context/ContentContext';
import { useTheme } from '@/context/ThemeContext';

const iconMap = {
  TrendingUp: TrendingUp,
  Bot: Bot,
  Users: Users,
  Zap: Zap,
  Shield: Shield,
  BarChart3: BarChart3,
};

const WhyHireMe = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { isDark } = useTheme();
  const sectionRef = useRef(null);
  const whyHireMe = useContent('whyHireMe') || [];

  // Theme-aware colors
  const accent = isDark ? '#d9fb06' : '#4a6d00';
  const accentText = isDark ? 'text-[#d9fb06]' : 'text-[#4a6d00]';
  const textMain = isDark ? 'text-white' : 'text-[#1a1c1b]';
  const textMuted = isDark ? 'text-[#888680]' : 'text-[#6b6964]';
  const sectionBg = isDark ? 'bg-[#302f2c]/30' : 'bg-[#e8e7e3]/30';
  const cardBg = isDark ? 'bg-[#1a1c1b]' : 'bg-white';
  const borderHalf = isDark ? 'border-[#3f4816]/50' : 'border-[#d4d2ca]/50';
  const hoverBorder = isDark ? 'hover:border-[#d9fb06]/50' : 'hover:border-[#4a6d00]/50';
  const numberColor = isDark ? 'text-[#3f4816]/30' : 'text-[#d4d2ca]/50';
  const iconBg = isDark ? 'bg-[#3f4816]/50' : 'bg-[#e8e7e3]';
  const borderLight = isDark ? 'border-[#3f4816]/30' : 'border-[#d4d2ca]/30';
  const gradientAccent = isDark ? 'from-[#d9fb06]' : 'from-[#4a6d00]';

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="about"
      ref={sectionRef}
      className={`section-padding ${sectionBg} border-t ${borderLight}`}
      role="region"
      aria-label="Why Hire Me"
    >
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className={`${accentText} text-sm font-semibold uppercase tracking-wider mb-4 block`}>
            Value Proposition
          </span>
          <h2 className={`text-4xl md:text-5xl lg:text-6xl font-black ${textMain} mb-6 leading-tight`}>
            WHY <span className={accentText}>HIRE</span> ME?
          </h2>
          <p className={`${textMuted} text-lg`}>
            I bring a unique combination of community management expertise,
            technical automation skills, and data-driven decision making.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {whyHireMe.map((item, index) => {
            const Icon = iconMap[item.icon] || TrendingUp;
            return (
              <div
                key={index}
                className={`group relative ${cardBg} border ${borderHalf} p-8 transition-all duration-500 ${hoverBorder} ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {/* Number */}
                <span className={`absolute top-6 right-6 text-6xl font-black ${numberColor} transition-colors`}>
                  {String(index + 1).padStart(2, '0')}
                </span>

                {/* Icon */}
                <div className={`w-14 h-14 rounded-lg ${iconBg} flex items-center justify-center mb-6 transition-colors`}>
                  <Icon className="w-7 h-7" style={{ color: accent }} aria-hidden="true" />
                </div>

                {/* Content */}
                <h3 className={`text-xl font-bold ${textMain} mb-3 transition-colors`}>
                  {item.title}
                </h3>
                <p className={`${textMuted} leading-relaxed`}>
                  {item.description}
                </p>

                {/* Bottom accent */}
                <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${gradientAccent} to-transparent scale-x-0 group-hover:scale-x-100 transition-transform origin-left`} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyHireMe;
