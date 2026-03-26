import React, { useState, useRef, useEffect } from 'react';
import { Briefcase, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useContent } from '@/context/ContentContext';
import { Progress } from '@/components/ui/progress';
import { useTheme } from '@/context/ThemeContext';

const Experience = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeExperience, setActiveExperience] = useState(0);
  const { isDark } = useTheme();
  const sectionRef = useRef(null);
  const experience = useContent('experience') || [];
  const skills = useContent('skills') || [];
  const tools = useContent('tools') || [];
  const [animatedSkills, setAnimatedSkills] = useState(skills.map(() => 0));

  // Theme-aware colors
  const accent = isDark ? '#d9fb06' : '#4a6d00';
  const accentText = isDark ? 'text-[#d9fb06]' : 'text-[#4a6d00]';
  const accentBg = isDark ? 'bg-[#d9fb06]' : 'bg-[#4a6d00]';
  const textMain = isDark ? 'text-white' : 'text-[#1a1c1b]';
  const textMuted = isDark ? 'text-[#888680]' : 'text-[#6b6964]';
  const pageBg = isDark ? 'bg-[#1a1c1b]' : 'bg-[#f5f4f0]';
  const cardBg = isDark ? 'bg-[#302f2c]/50' : 'bg-white/50';
  const cardBgActive = isDark ? 'bg-[#302f2c]' : 'bg-white';
  const borderColor = isDark ? 'border-[#3f4816]' : 'border-[#d4d2ca]';
  const borderLight = isDark ? 'border-[#3f4816]/30' : 'border-[#d4d2ca]/30';
  const borderHalf = isDark ? 'border-[#3f4816]/50' : 'border-[#d4d2ca]/50';
  const oliveBg = isDark ? 'bg-[#3f4816]' : 'bg-[#d4d2ca]';
  const oliveBgHalf = isDark ? 'bg-[#3f4816]/50' : 'bg-[#d4d2ca]/50';
  const oliveBgLight = isDark ? 'bg-[#3f4816]/30' : 'bg-[#e8e7e3]';
  const barBg = isDark ? 'bg-[#302f2c]' : 'bg-[#e8e7e3]';
  const gradientFrom = isDark ? 'from-[#d9fb06]' : 'from-[#4a6d00]';
  const gradientTo = isDark ? 'to-[#3f4816]' : 'to-[#d4d2ca]';

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setTimeout(() => {
            setAnimatedSkills(skills.map(s => s.level));
          }, 500);
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
      id="experience"
      ref={sectionRef}
      className={`section-padding ${pageBg} border-t ${borderLight}`}
      role="region"
      aria-label="Experience"
    >
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left Column - Experience Timeline */}
          <div>
            <span className={`${accentText} text-sm font-semibold uppercase tracking-wider mb-4 block`}>
              Career Journey
            </span>
            <h2 className={`text-4xl md:text-5xl font-black ${textMain} mb-8 leading-tight`}>
              WORK
              <br />
              <span className={accentText}>EXPERIENCE</span>
            </h2>

            {/* Timeline */}
            <div className="relative">
              {/* Timeline line */}
              <div className={`absolute left-6 top-0 bottom-0 w-px ${oliveBg}`} />

              {/* Experience Items */}
              <div className="space-y-8">
                {experience.map((exp, index) => (
                  <div
                    key={exp.id}
                    className={`relative pl-16 cursor-pointer group transition-all duration-500 ${
                      isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
                    }`}
                    style={{ transitionDelay: `${index * 150}ms` }}
                    onClick={() => setActiveExperience(index)}
                    onKeyDown={(e) => e.key === 'Enter' && setActiveExperience(index)}
                    tabIndex={0}
                    role="button"
                    aria-pressed={activeExperience === index}
                  >
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-4 top-1 w-5 h-5 rounded-full border-2 transition-colors ${
                        activeExperience === index
                          ? `${accentBg} border-transparent`
                          : `${pageBg} ${borderColor}`
                      }`}
                      style={activeExperience === index ? { borderColor: accent } : {}}
                    />

                    {/* Content */}
                    <div
                      className={`p-6 border transition-all ${
                        activeExperience === index
                          ? `${cardBgActive} border-transparent`
                          : `${cardBg} ${borderHalf}`
                      }`}
                      style={activeExperience === index ? { borderColor: `${accent}50` } : {}}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className={`text-lg font-bold ${textMain} transition-colors`}>
                            {exp.role}
                          </h3>
                          <p className={`${accentText} font-medium text-sm`}>{exp.company}</p>
                          <p className={`${textMuted} text-sm mt-1`}>{exp.period}</p>
                        </div>
                        <ChevronRight
                          className={`w-5 h-5 transition-transform ${
                            activeExperience === index ? `rotate-90` : ''
                          }`}
                          style={{ color: activeExperience === index ? accent : isDark ? '#888680' : '#6b6964' }}
                        />
                      </div>

                      {/* Expanded content */}
                      {activeExperience === index && (
                        <div className={`mt-4 pt-4 border-t ${borderHalf} animate-fade-in-up`}>
                          <p className={`${textMuted} text-sm mb-4`}>{exp.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {exp.highlights.map((highlight, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className={`${borderColor} ${oliveBgLight} ${textMain} text-xs`}
                              >
                                {highlight}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Skills */}
          <div className={`transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <span className={`${accentText} text-sm font-semibold uppercase tracking-wider mb-4 block`}>
              Core Competencies
            </span>
            <h2 className={`text-4xl md:text-5xl font-black ${textMain} mb-8 leading-tight`}>
              SKILLS &
              <br />
              <span className={accentText}>EXPERTISE</span>
            </h2>

            {/* Skills List */}
            <div className="space-y-6">
              {skills.map((skill, index) => (
                <div
                  key={index}
                  className={`transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                  style={{ transitionDelay: `${index * 100 + 400}ms` }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className={`${textMain} font-medium`}>{skill.name}</span>
                    <span className={`${accentText} font-bold`}>{animatedSkills[index]}%</span>
                  </div>
                  <div className={`h-2 ${barBg} rounded-full overflow-hidden`}>
                    <div
                      className={`h-full bg-gradient-to-r ${gradientFrom} ${gradientTo} rounded-full transition-all duration-1000 ease-out`}
                      style={{ width: `${animatedSkills[index]}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Tools Box */}
            <div className={`mt-10 p-6 ${cardBg} border ${borderColor} rounded-lg`}>
              <h3 className={`${textMain} font-semibold mb-4 flex items-center gap-2`}>
                <Briefcase className="w-5 h-5" style={{ color: accent }} />
                Tools & Platforms
              </h3>
              <div className="flex flex-wrap gap-2">
                {tools.map((tool, i) => (
                  <Badge
                    key={i}
                    className={`${oliveBgHalf} ${textMuted} cursor-default transition-colors`}
                    style={{ '--tw-bg-opacity': 1 }}
                  >
                    {tool}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Experience;
