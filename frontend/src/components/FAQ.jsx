import React, { useState, useRef, useEffect } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { useContent } from '@/context/ContentContext';
import { useTheme } from '@/context/ThemeContext';

const FAQ = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { isDark } = useTheme();
  const sectionRef = useRef(null);
  const faqData = useContent('faqData') || [];

  // Theme-aware colors
  const accent = isDark ? '#d9fb06' : '#4a6d00';
  const accentText = isDark ? 'text-[#d9fb06]' : 'text-[#4a6d00]';
  const accentBg = isDark ? 'bg-[#d9fb06]' : 'bg-[#4a6d00]';
  const textMain = isDark ? 'text-white' : 'text-[#1a1c1b]';
  const textMuted = isDark ? 'text-[#888680]' : 'text-[#6b6964]';
  const pageBg = isDark ? 'bg-[#1a1c1b]' : 'bg-[#f5f4f0]';
  const cardBg = isDark ? 'bg-[#302f2c]/50' : 'bg-white/50';
  const borderColor = isDark ? 'border-[#3f4816]' : 'border-[#d4d2ca]';
  const borderLight = isDark ? 'border-[#3f4816]/30' : 'border-[#d4d2ca]/30';
  const borderHalf = isDark ? 'border-[#3f4816]/50' : 'border-[#d4d2ca]/50';

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

  // Function to render markdown-like text with bold
  const renderAnswer = (text) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className={`${accentText} font-bold`}>{part}</strong>;
      }
      // Handle newlines
      return part.split('\n').map((line, i) => (
        <React.Fragment key={`${index}-${i}`}>
          {line}
          {i < part.split('\n').length - 1 && <br />}
        </React.Fragment>
      ));
    });
  };

  return (
    <section
      id="faq"
      ref={sectionRef}
      className={`section-padding ${pageBg} border-t ${borderLight}`}
      role="region"
      aria-label="Frequently Asked Questions"
    >
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left Column - Header */}
          <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <span className={`${accentText} text-sm font-semibold uppercase tracking-wider mb-4 block`}>
              Common Questions
            </span>
            <h2 className={`text-4xl md:text-5xl lg:text-6xl font-black ${textMain} mb-6 leading-tight`}>
              FREQUENTLY
              <br />
              <span className={accentText}>ASKED</span>
            </h2>
            <p className={`${textMuted} text-lg mb-8`}>
              Everything you need to know about working with me. Can't find what
              you're looking for? Feel free to reach out directly.
            </p>

            {/* Quick Info Box */}
            <div className={`${cardBg} border ${borderColor} p-6 rounded-lg`}>
              <h3 className={`${textMain} font-semibold mb-4`}>Quick Info</h3>
              <ul className="space-y-3">
                <li className={`flex items-center gap-3 ${textMuted}`}>
                  <span className={`w-2 h-2 ${accentBg} rounded-full`} />
                  Base Rate: <span className={`${accentText} font-bold`}>1,200 USDT/month</span>
                </li>
                <li className={`flex items-center gap-3 ${textMuted}`}>
                  <span className={`w-2 h-2 ${accentBg} rounded-full`} />
                  Response Time: <span className={`${textMain} font-semibold`}>Within 24 hours</span>
                </li>
                <li className={`flex items-center gap-3 ${textMuted}`}>
                  <span className={`w-2 h-2 ${accentBg} rounded-full`} />
                  Availability: <span className={`${textMain} font-semibold`}>Currently Available</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column - Accordion */}
          <div className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Accordion type="single" collapsible className="space-y-4">
              {faqData.map((item, index) => (
                <AccordionItem
                  key={item.id}
                  value={`item-${item.id}`}
                  className={`${cardBg} border ${borderHalf} rounded-lg px-6 transition-colors`}
                  style={{ '--accent': accent }}
                >
                  <AccordionTrigger className={`${textMain} text-left py-6 hover:no-underline text-lg font-semibold`}>
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className={`${textMuted} pb-6 leading-relaxed`}>
                    {renderAnswer(item.answer)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
