import React from 'react';
import { MapPin, Mail, Linkedin, Send, ArrowUp, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';
import { useContent } from '@/context/ContentContext';
import CinematicProfile from '@/components/CinematicProfile';

const Footer = () => {
  const { isDark } = useTheme();
  const personalInfo = useContent('personalInfo');

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();

  const quickLinks = [
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
  };

  return (
    <footer
      className={`pt-20 pb-8 border-t ${
        isDark
          ? 'bg-[#1a1c1b] border-[#3f4816]/50'
          : 'bg-[#f5f4f0] border-[#d4d2ca]/50'
      }`}
      role="contentinfo"
    >
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-xl overflow-hidden`}>
                <CinematicProfile
                  profileImages={personalInfo.profileImages}
                  className="w-full h-full"
                />
              </div>
              <div>
                <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-[#1a1c1b]'}`}>Janica Cabidoy</h3>
                <p className={`text-sm ${isDark ? 'text-[#888680]' : 'text-[#6b6964]'}`}>{personalInfo.title}</p>
              </div>
            </div>
            <p className={`leading-relaxed mb-6 max-w-md ${isDark ? 'text-[#888680]' : 'text-[#6b6964]'}`}>
              Building and scaling crypto communities with proven results.
              Specializing in community management, content strategy, and AI automation.
            </p>
            <div className="flex items-center gap-4">
              <a
                href={`mailto:${personalInfo.email}`}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isDark
                    ? 'bg-[#302f2c] text-[#888680] hover:bg-[#d9fb06] hover:text-[#1a1c1b]'
                    : 'bg-white text-[#6b6964] hover:bg-[#4a6d00] hover:text-white'
                }`}
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/janicacabidoynicseuu/"
                target="_blank"
                rel="noopener noreferrer"
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isDark
                    ? 'bg-[#302f2c] text-[#888680] hover:bg-[#d9fb06] hover:text-[#1a1c1b]'
                    : 'bg-white text-[#6b6964] hover:bg-[#4a6d00] hover:text-white'
                }`}
                aria-label="LinkedIn"
                data-testid="footer-linkedin-btn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href={personalInfo.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isDark
                    ? 'bg-[#302f2c] text-[#888680] hover:bg-[#d9fb06] hover:text-[#1a1c1b]'
                    : 'bg-white text-[#6b6964] hover:bg-[#4a6d00] hover:text-white'
                }`}
                aria-label="Telegram"
              >
                <Send className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className={`font-semibold mb-6 ${isDark ? 'text-white' : 'text-[#1a1c1b]'}`}>Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => scrollToSection(link.href)}
                    className={`text-sm transition-colors ${
                      isDark
                        ? 'text-[#888680] hover:text-[#d9fb06]'
                        : 'text-[#6b6964] hover:text-[#4a6d00]'
                    }`}
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className={`font-semibold mb-6 ${isDark ? 'text-white' : 'text-[#1a1c1b]'}`}>Get In Touch</h4>
            <ul className="space-y-4">
              <li className={`flex items-start gap-3 ${isDark ? 'text-[#888680]' : 'text-[#6b6964]'}`}>
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Remote • Available Worldwide</span>
              </li>
              <li className={`flex items-start gap-3 ${isDark ? 'text-[#888680]' : 'text-[#6b6964]'}`}>
                <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <a
                  href={`mailto:${personalInfo.email}`}
                  className={`text-sm transition-colors ${isDark ? 'hover:text-[#d9fb06]' : 'hover:text-[#4a6d00]'}`}
                >
                  {personalInfo.email}
                </a>
              </li>
              <li className={`flex items-start gap-3 ${isDark ? 'text-[#888680]' : 'text-[#6b6964]'}`}>
                <Send className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <a
                  href={personalInfo.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-sm transition-colors ${isDark ? 'hover:text-[#d9fb06]' : 'hover:text-[#4a6d00]'}`}
                >
                  {personalInfo.telegram}
                </a>
              </li>
            </ul>

            <a
              href={personalInfo.resumeUrl}
              download="Janica_Cabidoy_Resume.pdf"
              className={`mt-6 inline-flex items-center justify-center border rounded-full h-10 px-4 text-sm font-medium transition-all ${
                isDark
                  ? 'border-[#3f4816] text-[#888680] hover:border-[#d9fb06] hover:text-[#d9fb06]'
                  : 'border-[#d4d2ca] text-[#6b6964] hover:border-[#4a6d00] hover:text-[#4a6d00]'
              }`}
              data-testid="download-resume-footer-btn"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Resume
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={`flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t ${isDark ? 'border-[#3f4816]/50' : 'border-[#d4d2ca]/50'}`}>
          <p className={`text-sm ${isDark ? 'text-[#888680]' : 'text-[#6b6964]'}`}>
            &copy; {currentYear} Janica Cabidoy. All rights reserved.
          </p>

          <button
            onClick={scrollToTop}
            className={`flex items-center gap-2 text-sm group transition-colors ${
              isDark
                ? 'text-[#888680] hover:text-[#d9fb06]'
                : 'text-[#6b6964] hover:text-[#4a6d00]'
            }`}
            aria-label="Scroll to top"
          >
            Back to top
            <span className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
              isDark
                ? 'border-[#3f4816] group-hover:border-[#d9fb06] group-hover:bg-[#d9fb06] group-hover:text-[#1a1c1b]'
                : 'border-[#d4d2ca] group-hover:border-[#4a6d00] group-hover:bg-[#4a6d00] group-hover:text-white'
            }`}>
              <ArrowUp className="w-4 h-4" />
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
