import React, { useEffect, useState, useRef } from 'react';
import { TrendingUp, Users, MessageSquare, Shield, Target, Zap } from 'lucide-react';
import { useContent } from '@/context/ContentContext';
import { useTheme } from '@/context/ThemeContext';

const iconMap = {
  1: TrendingUp,
  2: Zap,
  3: Users,
  4: MessageSquare,
  5: Shield,
  6: Target,
};

// Hook for counting animation
const useCountUp = (end, duration = 2000, isVisible = false) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);

  useEffect(() => {
    if (!isVisible) return;

    const numericValue = parseFloat(end.replace(/[^0-9.]/g, ''));
    const hasDecimal = end.includes('.');

    let startTime;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = numericValue * easeOutQuart;

      if (hasDecimal) {
        setCount(currentValue.toFixed(1));
      } else {
        setCount(Math.floor(currentValue));
      }

      if (progress < 1) {
        countRef.current = requestAnimationFrame(animate);
      }
    };

    countRef.current = requestAnimationFrame(animate);

    return () => {
      if (countRef.current) {
        cancelAnimationFrame(countRef.current);
      }
    };
  }, [end, duration, isVisible]);

  const suffix = end.replace(/[0-9.]/g, '');
  return `${count}${suffix}`;
};

const MetricCard = ({ metric, index, isVisible, isDark }) => {
  const Icon = iconMap[metric.id] || TrendingUp;
  const animatedValue = useCountUp(metric.value, 2000, isVisible);

  const accent = isDark ? '#d9fb06' : '#4a6d00';
  const accentText = isDark ? 'text-[#d9fb06]' : 'text-[#4a6d00]';
  const textMain = isDark ? 'text-white' : 'text-[#1a1c1b]';
  const textMuted = isDark ? 'text-[#888680]' : 'text-[#6b6964]';
  const cardBg = isDark ? 'bg-[#302f2c]/50' : 'bg-white/50';
  const cardBgHover = isDark ? 'hover:bg-[#302f2c]' : 'hover:bg-white';
  const borderHalf = isDark ? 'border-[#3f4816]/50' : 'border-[#d4d2ca]/50';
  const hoverBorder = isDark ? 'hover:border-[#d9fb06]/50' : 'hover:border-[#4a6d00]/50';
  const iconBg = isDark ? 'bg-[#3f4816]/50' : 'bg-[#e8e7e3]';
  const gradientAccent = isDark ? 'from-[#d9fb06]' : 'from-[#4a6d00]';

  return (
    <div
      className={`group relative ${cardBg} border ${borderHalf} p-8 transition-all duration-500 ${hoverBorder} ${cardBgHover} ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
      role="article"
      aria-label={`${metric.label}: ${metric.value}`}
    >
      {/* Icon */}
      <div className={`w-12 h-12 rounded-lg ${iconBg} flex items-center justify-center mb-6 transition-colors`}>
        <Icon className="w-6 h-6" style={{ color: accent }} aria-hidden="true" />
      </div>

      {/* Animated Value */}
      <div className="mb-2">
        <span className={`text-4xl md:text-5xl font-black ${textMain} transition-colors tabular-nums`}>
          {animatedValue}
        </span>
      </div>

      {/* Label */}
      <h3 className={`text-lg font-semibold ${textMain} mb-1`}>{metric.label}</h3>
      <p className={`${textMuted} text-sm mb-3`}>{metric.description}</p>

      {/* Detail */}
      <p className={`${textMuted} opacity-70 text-xs border-t ${borderHalf} pt-3 mt-3`}>
        {metric.detail}
      </p>

      {/* Hover accent */}
      <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${gradientAccent} to-transparent scale-x-0 group-hover:scale-x-100 transition-transform origin-left`} />
    </div>
  );
};

const Metrics = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { isDark } = useTheme();
  const sectionRef = useRef(null);
  const metrics = useContent('metrics') || [];

  const pageBg = isDark ? 'bg-[#1a1c1b]' : 'bg-[#f5f4f0]';
  const accentText = isDark ? 'text-[#d9fb06]' : 'text-[#4a6d00]';
  const textMain = isDark ? 'text-white' : 'text-[#1a1c1b]';
  const textMuted = isDark ? 'text-[#888680]' : 'text-[#6b6964]';
  const oliveBg = isDark ? 'bg-[#3f4816]/30' : 'bg-[#e8e7e3]';
  const borderColor = isDark ? 'border-[#3f4816]' : 'border-[#d4d2ca]';
  const dividerBg = isDark ? 'bg-[#3f4816]' : 'bg-[#d4d2ca]';

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
      id="metrics"
      ref={sectionRef}
      className={`section-padding ${pageBg}`}
      role="region"
      aria-label="Quantifiable Results"
    >
      <div className="container-custom">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <span className={`${accentText} text-sm font-semibold uppercase tracking-wider mb-4 block`}>
            Proven Results
          </span>
          <h2 className={`text-4xl md:text-5xl lg:text-6xl font-black ${textMain} mb-6 leading-tight`}>
            QUANTIFIABLE
            <br />
            <span className={accentText}>METRICS</span> & RESULTS
          </h2>
          <p className={`${textMuted} text-lg`}>
            Every campaign is backed by data. Here are the numbers that showcase
            real impact on community growth and engagement.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics.map((metric, index) => (
            <MetricCard
              key={metric.id}
              metric={metric}
              index={index}
              isVisible={isVisible}
              isDark={isDark}
            />
          ))}
        </div>

        {/* Content Production Highlight */}
        <div className={`mt-12 p-8 ${oliveBg} border ${borderColor} transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '600ms' }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className={`text-xl font-bold ${textMain} mb-2`}>Content Production</h3>
              <p className={textMuted}>
                Consistently delivering <span className={`${accentText} font-bold`}>5 to 8 content pieces weekly</span> including
                launch updates, education threads, visuals, and pinned FAQs.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className={`text-3xl font-black ${accentText}`}>5-8</p>
                <p className={`${textMuted} text-sm`}>Weekly Posts</p>
              </div>
              <div className={`w-px h-12 ${dividerBg}`} />
              <div className="text-center">
                <p className={`text-3xl font-black ${textMain}`}>24/7</p>
                <p className={`${textMuted} text-sm`}>Moderation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Metrics;
