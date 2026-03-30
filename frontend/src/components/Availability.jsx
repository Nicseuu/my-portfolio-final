import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Clock, MapPin, CheckCircle2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useContent } from '@/context/ContentContext';
import { useTheme } from '@/context/ThemeContext';
import { toast, Toaster } from 'sonner';

const MESSAGES_KEY = 'portfolio-messages';
const DEFAULT_WEB3FORMS_KEY = process.env.REACT_APP_WEB3FORMS_KEY || '';

const Availability = () => {
  const [isVisible, setIsVisible] = useState(false);
  const personalInfo = useContent('personalInfo');
  const { isDark } = useTheme();
  const [selectedDate, setSelectedDate] = useState(undefined);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    project: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sectionRef = useRef(null);

  const accent = isDark ? '#d9fb06' : '#4a6d00';
  const accentText = isDark ? 'text-[#d9fb06]' : 'text-[#4a6d00]';
  const textMain = isDark ? 'text-white' : 'text-[#1a1c1b]';
  const textMuted = isDark ? 'text-[#888680]' : 'text-[#6b6964]';
  const pageBg = isDark ? 'bg-[#1a1c1b]' : 'bg-[#f5f4f0]';
  const cardBgMuted = isDark ? 'bg-[#302f2c]/50' : 'bg-[#e8e7e3]/50';
  const sectionBg = isDark ? 'bg-[#302f2c]/30' : 'bg-[#e8e7e3]/30';
  const borderColor = isDark ? 'border-[#3f4816]' : 'border-[#d4d2ca]';
  const borderLight = isDark ? 'border-[#3f4816]/30' : 'border-[#d4d2ca]/30';
  const inputBg = isDark ? 'bg-[#302f2c]' : 'bg-[#f5f4f0]';
  const inputBorder = isDark ? 'border-[#3f4816]' : 'border-[#d4d2ca]';
  const inputText = isDark ? 'text-white' : 'text-[#1a1c1b]';
  const placeholderColor = isDark ? 'placeholder:text-[#888680]' : 'placeholder:text-[#a09d97]';
  const focusBorder = isDark ? 'focus:border-[#d9fb06]' : 'focus:border-[#4a6d00]';
  const focusRing = isDark ? 'focus:ring-[#d9fb06]' : 'focus:ring-[#4a6d00]';
  const btnBg = isDark ? 'bg-[#d9fb06]' : 'bg-[#4a6d00]';
  const btnText = isDark ? 'text-[#1a1c1b]' : 'text-white';
  const btnHover = isDark ? 'hover:bg-[#d9fb06]/90' : 'hover:bg-[#4a6d00]/90';
  const btnBorder = isDark ? 'border-[#1a1c1b]' : 'border-white';
  const dividerColor = isDark ? 'bg-[#3f4816]' : 'bg-[#d4d2ca]';

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Rate limit: max 3 submissions per 10 minutes
  const checkRateLimit = () => {
    const key = 'contact-form-submissions';
    const now = Date.now();
    const window = 10 * 60 * 1000; // 10 minutes
    const submissions = JSON.parse(localStorage.getItem(key) || '[]').filter(ts => now - ts < window);
    if (submissions.length >= 3) return false;
    submissions.push(now);
    localStorage.setItem(key, JSON.stringify(submissions));
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!checkRateLimit()) {
      toast.error('Too many messages sent. Please wait a few minutes before trying again.');
      return;
    }

    if (!selectedDate) {
      toast.error('Please select a preferred date in Step 1 before sending your message.');
      return;
    }
    if (!formData.name || !formData.email || !formData.project || !formData.message) {
      toast.error('Please fill out all fields before sending your message.');
      return;
    }

    setIsSubmitting(true);

    try {
      const existing = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
      const newMessage = {
        id: Date.now(),
        name: formData.name,
        email: formData.email,
        project: formData.project || null,
        message: formData.message,
        preferred_date: selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : null,
        status: 'new',
        created_at: new Date().toISOString(),
      };
      existing.unshift(newMessage);
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(existing));

      // Try server-side API first (keeps Web3Forms key hidden), fall back to client-side
      try {
        const serverRes = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            message: formData.message,
            project: formData.project || null,
            preferredDate: selectedDate ? selectedDate.toLocaleDateString() : null,
          }),
        });
        if (!serverRes.ok) throw new Error('Server API unavailable');
      } catch {
        // Fallback: direct Web3Forms call (for local dev or non-Vercel deployments)
        try {
          const web3formsKey = localStorage.getItem('web3forms-key') || DEFAULT_WEB3FORMS_KEY;
          if (web3formsKey) {
            await fetch('https://api.web3forms.com/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                access_key: web3formsKey,
                subject: `New Contact from ${formData.name}`,
                from_name: formData.name,
                email: formData.email,
                message: `Project: ${formData.project || 'Not specified'}\nPreferred Date: ${selectedDate ? selectedDate.toLocaleDateString() : 'Not selected'}\n\n${formData.message}`,
              }),
            });
          }
        } catch (emailErr) {
          console.error('Email notification failed:', emailErr);
        }
      }

      toast.success("Message sent! Thanks for reaching out. I'll get back to you within 24 hours.");
      setFormData({ name: '', email: '', project: '', message: '' });
      setSelectedDate(undefined);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again or email directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const disabledDays = { before: new Date() };

  return (
    <section
      id="contact"
      ref={sectionRef}
      className={`section-padding ${sectionBg} border-t ${borderLight}`}
      role="region"
      aria-label="Contact and Availability"
    >
      <Toaster position="top-right" richColors />
      <div className="container-custom">
        {/* Section Header */}
        <div className={`text-center mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <span className={`${accentText} text-sm font-semibold uppercase tracking-wider mb-4 block`}>
            Let's Connect
          </span>
          <h2 className={`text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black ${textMain} mb-4 leading-tight`}>
            AVAILABILITY
            <br />
            <span className={accentText}>& BOOKING</span>
          </h2>

        </div>

        {/* Availability Status + Calendly Card */}
        <div className={`${pageBg} border ${borderColor} rounded-2xl p-4 sm:p-6 mb-6 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full animate-pulse shrink-0" style={{ backgroundColor: accent }} />
                <span className={`${accentText} font-semibold`}>{personalInfo.availability.status}</span>
              </div>
              <div className={`flex items-center gap-2 ${textMuted}`}>
                <Clock className="w-4 h-4 shrink-0" />
                <span className="text-sm">Response Time: <span className={`${textMain} font-medium`}>{personalInfo.availability.responseTime}</span></span>
              </div>
              <div className={`flex items-center gap-2 ${textMuted}`}>
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="text-sm">Timezone: <span className={`${textMain} font-medium`}>{personalInfo.availability.timezone}</span></span>
              </div>
            </div>
            <Button
              onClick={() => window.open(personalInfo.calendly, '_blank')}
              className={`w-full sm:w-auto ${btnBg} ${btnText} ${btnHover} rounded-full py-5 px-8 text-sm font-semibold transition-all duration-300 shrink-0`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Book a Call on Calendly
            </Button>
          </div>
        </div>

        {/* Single Card — Calendar + Form side by side */}
        <div className={`${pageBg} border ${borderColor} rounded-2xl overflow-hidden transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left — Step 1: Select a Preferred Date */}
            <div className={`p-4 sm:p-6 md:p-10 flex flex-col overflow-hidden`}>
              <div className="flex items-center gap-3 mb-1">
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${btnBg} ${btnText}`}>1</span>
                <h3 className={`${textMain} font-bold text-xl flex items-center gap-2`}>
                  <Calendar className="w-5 h-5" style={{ color: accent }} />
                  Select a Preferred Date
                </h3>
              </div>
              <p className={`${textMuted} text-sm mb-6 ml-10`}>
                Choose a date that works for you, or leave it blank.
              </p>

              <div className="calendar-wide flex justify-center flex-1 items-start w-full">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={disabledDays}
                  className={`rounded-xl border ${borderColor} ${cardBgMuted} p-2 sm:p-4 md:p-6 w-full`}
                />
              </div>

              {selectedDate && (
                <div className={`flex items-center gap-2 ${textMuted} text-sm ${cardBgMuted} p-3 rounded-lg mt-4`}>
                  <CheckCircle2 className="w-4 h-4" style={{ color: accent }} />
                  <span>
                    Selected: <span className={`${accentText} font-medium`}>
                      {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Vertical Divider (desktop) / Horizontal Divider (mobile) */}
            <div className={`lg:hidden h-px ${dividerColor}`} />

            {/* Right — Step 2: Get In Touch Form */}
            <div className={`p-4 sm:p-6 md:p-10 border-l-0 lg:border-l ${borderColor}`}>
              <div className="flex items-center gap-3 mb-1">
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${btnBg} ${btnText}`}>2</span>
                <h3 className={`text-xl font-bold ${textMain}`}>Get In Touch</h3>
              </div>
              <p className={`${textMuted} text-sm mb-6 ml-10`}>
                Fill out the form below and I'll get back to you within 24 hours.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className={`block ${textMain} text-sm font-medium mb-2`}>
                      Your Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      required
                      className={`${inputBg} ${inputBorder} ${inputText} ${placeholderColor} ${focusBorder} ${focusRing}`}
                      aria-required="true"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className={`block ${textMain} text-sm font-medium mb-2`}>
                      Email Address
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                      required
                      className={`${inputBg} ${inputBorder} ${inputText} ${placeholderColor} ${focusBorder} ${focusRing}`}
                      aria-required="true"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="project" className={`block ${textMain} text-sm font-medium mb-2`}>
                    Project Type
                  </label>
                  <Input
                    id="project"
                    name="project"
                    value={formData.project}
                    onChange={handleInputChange}
                    placeholder="e.g., Community Management, Automation Bot"
                    required
                    className={`${inputBg} ${inputBorder} ${inputText} ${placeholderColor} ${focusBorder} ${focusRing}`}
                    aria-required="true"
                  />
                </div>

                <div>
                  <label htmlFor="message" className={`block ${textMain} text-sm font-medium mb-2`}>
                    Your Message
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell me about your project and goals..."
                    rows={4}
                    required
                    className={`${inputBg} ${inputBorder} ${inputText} ${placeholderColor} ${focusBorder} ${focusRing} resize-none`}
                    aria-required="true"
                  />
                </div>

                <div className={`flex items-center gap-2 text-sm ${cardBgMuted} p-3 rounded-lg ${selectedDate ? textMuted : isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                  {selectedDate ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: accent }} />
                      <span>Preferred date: <span className={`${accentText} font-medium`}>{selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span>Please select a preferred date in Step 1</span>
                    </>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full ${btnBg} ${btnText} ${btnHover} rounded-full py-6 text-base font-semibold transition-all duration-300 disabled:opacity-50`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className={`w-5 h-5 border-2 ${btnBorder} border-t-transparent rounded-full animate-spin`} />
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-5 h-5" />
                      Send Message
                    </span>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Availability;
