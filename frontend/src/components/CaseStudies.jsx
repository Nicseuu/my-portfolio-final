import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ExternalLink, Calendar, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useContent } from '@/context/ContentContext';
import { useTheme } from '@/context/ThemeContext';

const CaseStudyCard = ({ study, onClick, index, isVisible, isDark }) => {
  const cardBg = isDark ? 'bg-[#302f2c]/50' : 'bg-white/80';
  const borderColor = isDark ? 'border-[#3f4816]/50' : 'border-[#d4d2ca]/50';
  const hoverBorder = isDark ? 'hover:border-[#d9fb06]/50' : 'hover:border-[#4a6d00]/50';
  const accentText = isDark ? 'text-[#d9fb06]' : 'text-[#4a6d00]';
  const textMain = isDark ? 'text-white' : 'text-[#1a1c1b]';
  const textMuted = isDark ? 'text-[#888680]' : 'text-[#6b6964]';
  const tagBg = isDark ? 'bg-[#3f4816]/30' : 'bg-[#e8e7e3]';
  const tagBorder = isDark ? 'border-[#3f4816]' : 'border-[#d4d2ca]';
  const tagText = isDark ? 'text-[#888680]' : 'text-[#6b6964]';
  const gradientFrom = isDark ? 'from-[#1a1c1b]' : 'from-[#f5f4f0]';
  const resultBorder = isDark ? 'border-[#3f4816]/50' : 'border-[#d4d2ca]/50';

  return (
    <div
      className={`group relative ${cardBg} border ${borderColor} overflow-hidden transition-all duration-500 ${hoverBorder} cursor-pointer ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={`View case study: ${study.title}`}
    >
      {/* Image Section */}
      {study.images && study.images.length > 0 && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={study.images[0]}
            alt={`${study.title} analytics`}
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className={`absolute inset-0 bg-gradient-to-t ${gradientFrom} via-transparent to-transparent`} />
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {study.tags.map((tag, i) => (
            <Badge
              key={i}
              variant="outline"
              className={`${tagBorder} ${tagBg} ${tagText} text-xs`}
            >
              {tag}
            </Badge>
          ))}
        </div>

        {/* Title */}
        <h3 className={`text-xl font-bold ${textMain} mb-2 group-hover:${accentText} transition-colors`}>
          {study.title}
        </h3>

        {/* Client & Duration */}
        <div className={`flex items-center gap-4 ${textMuted} text-sm mb-4`}>
          <span className="flex items-center gap-1">
            <Award className="w-4 h-4" />
            {study.client}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {study.duration}
          </span>
        </div>

        {/* Challenge Preview */}
        <p className={`${textMuted} text-sm line-clamp-2 mb-4`}>
          {study.challenge}
        </p>

        {/* Results Preview */}
        {study.results?.initial && (
          <div className={`flex items-center gap-6 pt-4 border-t ${resultBorder}`}>
            <div>
              <p className={`text-2xl font-bold ${accentText}`}>{study.results.initial.reach}</p>
              <p className={`${textMuted} text-xs`}>Reach</p>
            </div>
            <div>
              <p className={`text-2xl font-bold ${textMain}`}>{study.results.initial.reachGrowth}</p>
              <p className={`${textMuted} text-xs`}>Growth</p>
            </div>
          </div>
        )}

        {study.results?.features && (
          <div className={`pt-4 border-t ${resultBorder}`}>
            <p className={`${accentText} font-semibold text-sm`}>{study.results.features.length} Key Features</p>
          </div>
        )}

        {/* CTA */}
        <div className={`flex items-center ${accentText} mt-4 font-medium text-sm group-hover:gap-2 transition-all`}>
          <span>Read Full Case Study</span>
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </div>
  );
};

const CaseStudyModal = ({ study, isOpen, onClose, isDark }) => {
  if (!study) return null;

  const modalBg = isDark ? 'bg-[#1a1c1b]' : 'bg-[#f5f4f0]';
  const borderColor = isDark ? 'border-[#3f4816]' : 'border-[#d4d2ca]';
  const accentText = isDark ? 'text-[#d9fb06]' : 'text-[#4a6d00]';
  const textMain = isDark ? 'text-white' : 'text-[#1a1c1b]';
  const textMuted = isDark ? 'text-[#888680]' : 'text-[#6b6964]';
  const cardBg = isDark ? 'bg-[#302f2c]/50' : 'bg-white/80';
  const oliveBg = isDark ? 'bg-[#3f4816]/30' : 'bg-[#e8e7e3]';
  const accentBg = isDark ? 'bg-[#d9fb06]' : 'bg-[#4a6d00]';
  const accentBtnText = isDark ? 'text-[#1a1c1b]' : 'text-white';
  const dotBg = isDark ? 'bg-[#d9fb06]' : 'bg-[#4a6d00]';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto ${modalBg} ${borderColor}`}>
        <DialogHeader>
          <DialogTitle className={`text-2xl font-bold ${textMain}`}>
            {study.title}
          </DialogTitle>
          <DialogDescription className={textMuted}>
            {study.client} • {study.duration}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Images */}
          {study.images && study.images.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {study.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`${study.title} result ${i + 1}`}
                  className={`w-full rounded-lg border ${borderColor}`}
                  loading="lazy"
                />
              ))}
            </div>
          )}

          {/* Challenge */}
          <div>
            <h4 className={`text-lg font-semibold ${accentText} mb-2`}>The Challenge</h4>
            <p className={textMuted}>{study.challenge}</p>
          </div>

          {/* Solution */}
          <div>
            <h4 className={`text-lg font-semibold ${accentText} mb-2`}>The Solution</h4>
            <p className={textMuted}>{study.solution}</p>
          </div>

          {/* Results */}
          <div>
            <h4 className={`text-lg font-semibold ${accentText} mb-4`}>The Results</h4>

            {study.results?.initial && (
              <div className="space-y-4">
                {/* 28 Days Results */}
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor}`}>
                  <h5 className={`${textMain} font-semibold mb-4`}>Initial {study.results.initial.period} Results</h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className={`text-3xl font-bold ${accentText}`}>{study.results.initial.reach}</p>
                      <p className={`${textMuted} text-sm`}>Reach ({study.results.initial.reachGrowth} growth)</p>
                    </div>
                    <div>
                      <p className={`text-3xl font-bold ${textMain}`}>{study.results.initial.videoViews}</p>
                      <p className={`${textMuted} text-sm`}>Video Views</p>
                    </div>
                    <div>
                      <p className={`text-3xl font-bold ${textMain}`}>{study.results.initial.oneMinuteViews}</p>
                      <p className={`${textMuted} text-sm`}>1-Minute Views</p>
                    </div>
                    <div>
                      <p className={`text-3xl font-bold ${textMain}`}>{study.results.initial.interactions}</p>
                      <p className={`${textMuted} text-sm`}>Interactions</p>
                    </div>
                    <div className="col-span-2">
                      <p className={`text-3xl font-bold ${accentText}`}>{study.results.initial.nonFollowerReach}</p>
                      <p className={`${textMuted} text-sm`}>Reach from Non-Followers</p>
                    </div>
                  </div>
                </div>

                {/* 90 Days Results */}
                {study.results.extended && (
                  <div className={`${oliveBg} p-6 rounded-lg border ${borderColor}`}>
                    <h5 className={`${textMain} font-semibold mb-4`}>Extended {study.results.extended.period} Results</h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className={`text-3xl font-bold ${accentText}`}>{study.results.extended.reach}</p>
                        <p className={`${textMuted} text-sm`}>Total Reach</p>
                      </div>
                      <div>
                        <p className={`text-3xl font-bold ${textMain}`}>{study.results.extended.videoViews}</p>
                        <p className={`${textMuted} text-sm`}>Video Views</p>
                      </div>
                      <div>
                        <p className={`text-3xl font-bold ${textMain}`}>{study.results.extended.watchTime}</p>
                        <p className={`${textMuted} text-sm`}>Watch Time</p>
                      </div>
                      <div>
                        <p className={`text-3xl font-bold ${textMain}`}>{study.results.extended.interactions}</p>
                        <p className={`${textMuted} text-sm`}>Total Interactions</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {study.results?.features && (
              <div className={`${cardBg} p-6 rounded-lg border ${borderColor}`}>
                <h5 className={`${textMain} font-semibold mb-4`}>Key Features Delivered</h5>
                <ul className="space-y-2">
                  {study.results.features.map((feature, i) => (
                    <li key={i} className={`flex items-start gap-3 ${textMuted}`}>
                      <span className={`w-1.5 h-1.5 ${dotBg} rounded-full mt-2 flex-shrink-0`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className={`flex flex-wrap gap-2 pt-4 border-t ${borderColor}`}>
            {study.tags.map((tag, i) => (
              <Badge
                key={i}
                className={`${accentBg} ${accentBtnText} hover:opacity-90`}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const CaseStudies = () => {
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const { isDark } = useTheme();
  const sectionRef = useRef(null);
  const caseStudies = useContent('caseStudies') || [];

  const pageBg = isDark ? 'bg-[#1a1c1b]' : 'bg-[#f5f4f0]';
  const borderLight = isDark ? 'border-[#3f4816]/30' : 'border-[#d4d2ca]/30';
  const accentText = isDark ? 'text-[#d9fb06]' : 'text-[#4a6d00]';
  const textMain = isDark ? 'text-white' : 'text-[#1a1c1b]';
  const textMuted = isDark ? 'text-[#888680]' : 'text-[#6b6964]';

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
      id="case-studies"
      ref={sectionRef}
      className={`section-padding ${pageBg} border-t ${borderLight}`}
      role="region"
      aria-label="Case Studies"
    >
      <div className="container-custom">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <span className={`${accentText} text-sm font-semibold uppercase tracking-wider mb-4 block`}>
            Success Stories
          </span>
          <h2 className={`text-4xl md:text-5xl lg:text-6xl font-black ${textMain} mb-6 leading-tight`}>
            CASE
            <br />
            <span className={accentText}>STUDIES</span>
          </h2>
          <p className={`${textMuted} text-lg`}>
            Real results from real projects. Click on any case study to explore
            the full story, strategy, and measurable outcomes.
          </p>
        </div>

        {/* Case Studies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {caseStudies.map((study, index) => (
            <CaseStudyCard
              key={study.id}
              study={study}
              index={index}
              isVisible={isVisible}
              isDark={isDark}
              onClick={() => setSelectedStudy(study)}
            />
          ))}
        </div>

        {/* Modal */}
        <CaseStudyModal
          study={selectedStudy}
          isOpen={!!selectedStudy}
          onClose={() => setSelectedStudy(null)}
          isDark={isDark}
        />
      </div>
    </section>
  );
};

export default CaseStudies;
