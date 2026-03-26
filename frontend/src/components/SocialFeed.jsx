import React, { useRef, useEffect, useState } from 'react';
import { ExternalLink, Linkedin, Heart, MessageCircle } from 'lucide-react';
import { linkedInPosts as defaultLinkedInPosts } from '@/data/mockData';
import { useTheme } from '@/context/ThemeContext';
import { useContent } from '@/context/ContentContext';
import CinematicProfile from '@/components/CinematicProfile';

const LINKEDIN_URL = "https://www.linkedin.com/in/janicacabidoynicseuu/";

const SocialFeed = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  const { isDark } = useTheme();
  const personalInfo = useContent('personalInfo');
  const linkedInPosts = useContent('linkedInPosts') || defaultLinkedInPosts;

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
      ref={sectionRef}
      className={`section-padding border-t ${
        isDark
          ? 'bg-[#1a1c1b] border-[#3f4816]/30'
          : 'bg-[#f5f4f0] border-[#d4d2ca]/30'
      }`}
      role="region"
      aria-label="Social Media Feed"
    >
      <div className="container-custom">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <span className={`text-sm font-semibold uppercase tracking-wider mb-4 block ${isDark ? 'text-[#d9fb06]' : 'text-[#4a6d00]'}`}>
              Stay Connected
            </span>
            <h2 className={`text-4xl md:text-5xl font-black leading-tight ${isDark ? 'text-white' : 'text-[#1a1c1b]'}`}>
              SOCIAL
              <br />
              <span className={isDark ? 'text-[#d9fb06]' : 'text-[#4a6d00]'}>MEDIA FEED</span>
            </h2>
          </div>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center border-2 rounded-full px-6 py-3 self-start md:self-auto transition-all font-semibold text-base ${
              isDark
                ? 'border-[#d9fb06] text-[#d9fb06] hover:bg-[#d9fb06] hover:text-[#1a1c1b]'
                : 'border-[#4a6d00] text-[#4a6d00] hover:bg-[#4a6d00] hover:text-white'
            }`}
            data-testid="linkedin-follow-btn"
          >
            <Linkedin className="w-5 h-5 mr-2" />
            Follow on LinkedIn
          </a>
        </div>

        {/* Featured Post */}
        <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {linkedInPosts.map((post) => (
            <div
              key={post.id}
              className={`border rounded-lg overflow-hidden transition-colors ${
                isDark
                  ? 'bg-[#302f2c]/50 border-[#3f4816]/50 hover:border-[#d9fb06]/50'
                  : 'bg-white border-[#d4d2ca]/50 hover:border-[#4a6d00]/50'
              }`}
            >
              <div className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-xl overflow-hidden flex-shrink-0`}>
                    <CinematicProfile
                      profileImages={personalInfo.profileImages}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-[#1a1c1b]'}`}>Janica Cabidoy</h4>
                    <p className={`text-sm ${isDark ? 'text-[#888680]' : 'text-[#6b6964]'}`}>{personalInfo.title}</p>
                  </div>
                  <Linkedin className="w-6 h-6 text-[#0077B5]" />
                </div>

                <p className={`text-lg leading-relaxed mb-6 ${isDark ? 'text-[#888680]' : 'text-[#6b6964]'}`}>
                  {post.content}
                </p>

                <div className={`flex items-center justify-between pt-6 border-t ${isDark ? 'border-[#3f4816]/50' : 'border-[#d4d2ca]/50'}`}>
                  <div className="flex items-center gap-6">
                    <span className={`flex items-center gap-2 ${isDark ? 'text-[#888680]' : 'text-[#6b6964]'}`}>
                      <Heart className="w-5 h-5" />
                      {post.likes}
                    </span>
                    <span className={`flex items-center gap-2 ${isDark ? 'text-[#888680]' : 'text-[#6b6964]'}`}>
                      <MessageCircle className="w-5 h-5" />
                      {post.comments}
                    </span>
                  </div>
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center hover:underline font-medium ${isDark ? 'text-[#d9fb06]' : 'text-[#4a6d00]'}`}
                    data-testid="linkedin-post-link"
                  >
                    View Post
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className={`mt-12 text-center transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <p className={`mb-6 ${isDark ? 'text-[#888680]' : 'text-[#6b6964]'}`}>
            Want to see more insights and updates? Follow me on LinkedIn for daily content.
          </p>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-[#0077B5] hover:bg-[#006097] text-white rounded-full px-8 py-4 font-semibold text-base transition-all hover:scale-105"
            data-testid="linkedin-connect-btn"
          >
            <Linkedin className="w-5 h-5 mr-2" />
            Connect on LinkedIn
          </a>
        </div>
      </div>
    </section>
  );
};

export default SocialFeed;
