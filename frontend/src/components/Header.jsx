import React, { useState, useEffect } from 'react';
import { Menu, X, Download, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAnalytics } from '@/context/AnalyticsContext';
import { useContent } from '@/context/ContentContext';
import { useTheme } from '@/context/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';
import CinematicProfile from '@/components/CinematicProfile';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { trackResumeDownload } = useAnalytics();
  const personalInfo = useContent('personalInfo');
  const { isDark } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'About', href: '#about' },
    { name: 'Results', href: '#metrics' },
    { name: 'Case Studies', href: '#case-studies' },
    { name: 'Experience', href: '#experience' },
    { name: 'FAQ', href: '#faq' },
    { name: 'Contact', href: '#contact' },
  ];

  const scrollToSection = (href) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || isMobileMenuOpen
          ? isDark
            ? 'bg-[#1a1c1b]/95 backdrop-blur-md border-b border-[#3f4816]/50'
            : 'bg-white/95 backdrop-blur-md border-b border-[#d4d2ca]/50 shadow-sm'
          : 'bg-transparent'
      }`}
      role="banner"
    >
      <nav className="container-custom" role="navigation" aria-label="Main navigation">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a
            href="#"
            className="flex items-center gap-3 group"
            aria-label="Go to homepage"
          >
            <div className={`w-10 h-10 rounded-xl overflow-hidden transition-transform group-hover:scale-110`}>
              <CinematicProfile
                profileImages={personalInfo.profileImages}
                className="w-full h-full"
              />
            </div>
            <div className="hidden sm:block">
              <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-[#1a1c1b]'}`}>Janica Cabidoy</p>
              <p className={`text-xs ${isDark ? 'text-[#888680]' : 'text-[#6b6964]'}`}>
                {personalInfo.title}
              </p>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => scrollToSection(link.href)}
                className={`text-sm font-medium transition-colors duration-200 ${
                  isDark
                    ? 'text-white/80 hover:text-[#d9fb06]'
                    : 'text-[#1a1c1b]/70 hover:text-[#4a6d00]'
                }`}
              >
                {link.name}
              </button>
            ))}
          </div>

          {/* Desktop CTA + Theme Toggle */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
            <a
              href={personalInfo.resumeUrl}
              download="Janica_Cabidoy_Resume.pdf"
              onClick={trackResumeDownload}
              className={`inline-flex items-center justify-center border rounded-full px-6 h-10 text-sm font-medium transition-all duration-300 ${
                isDark
                  ? 'border-[#d9fb06] text-[#d9fb06] hover:bg-[#d9fb06] hover:text-[#1a1c1b]'
                  : 'border-[#4a6d00] text-[#4a6d00] hover:bg-[#4a6d00] hover:text-white'
              }`}
              aria-label="Download Resume"
              data-testid="download-resume-btn"
            >
              <Download className="w-4 h-4 mr-2" />
              Resume
            </a>
            <Button
              className={`rounded-full px-6 font-semibold transition-all duration-300 ${
                isDark
                  ? 'bg-[#d9fb06] text-[#1a1c1b] hover:bg-[#d9fb06]/90'
                  : 'bg-[#4a6d00] text-white hover:bg-[#3d5c00]'
              }`}
              onClick={() => scrollToSection('#contact')}
            >
              Hire Me
            </Button>
          </div>

          {/* Mobile: Theme Toggle + Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              className={`p-2 ${isDark ? 'text-white' : 'text-[#1a1c1b]'}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

      </nav>

      {/* Mobile Navigation — dropdown below header */}
      {isMobileMenuOpen && (
        <div
          className={`lg:hidden overflow-y-auto border-t ${
            isDark ? 'bg-[#1a1c1b] border-[#3f4816]/50' : 'bg-white border-[#d4d2ca]/50'
          }`}
          style={{ maxHeight: 'calc(100vh - 5rem)' }}
        >
          <div className="container-custom flex flex-col gap-2 py-6">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => scrollToSection(link.href)}
                className={`text-lg font-semibold py-3 text-left transition-colors rounded-xl px-4 ${
                  isDark
                    ? 'text-white hover:text-[#d9fb06] hover:bg-[#3f4816]/30'
                    : 'text-[#1a1c1b] hover:text-[#4a6d00] hover:bg-[#4a6d00]/5'
                }`}
              >
                {link.name}
              </button>
            ))}
            <div className={`flex flex-col gap-3 mt-4 pt-4 border-t ${isDark ? 'border-[#3f4816]/50' : 'border-[#d4d2ca]/50'}`}>
              <a
                href={personalInfo.resumeUrl}
                download="Janica_Cabidoy_Resume.pdf"
                onClick={trackResumeDownload}
                className={`inline-flex items-center justify-center border rounded-full h-12 px-6 text-base font-medium transition-all ${
                  isDark
                    ? 'border-[#d9fb06] text-[#d9fb06] hover:bg-[#d9fb06] hover:text-[#1a1c1b]'
                    : 'border-[#4a6d00] text-[#4a6d00] hover:bg-[#4a6d00] hover:text-white'
                }`}
                data-testid="download-resume-mobile-btn"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Resume
              </a>
              <Button
                className={`rounded-full h-12 text-base font-semibold ${
                  isDark
                    ? 'bg-[#d9fb06] text-[#1a1c1b] hover:bg-[#d9fb06]/90'
                    : 'bg-[#4a6d00] text-white hover:bg-[#3d5c00]'
                }`}
                onClick={() => scrollToSection('#contact')}
              >
                Hire Me
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
