import React, { useState, useEffect, lazy, Suspense } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { AnalyticsProvider } from "@/context/AnalyticsContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { ContentProvider } from "@/context/ContentContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Metrics from "@/components/Metrics";
import CaseStudies from "@/components/CaseStudies";
import WhyHireMe from "@/components/WhyHireMe";
import Experience from "@/components/Experience";
import FAQ from "@/components/FAQ";
import SocialFeed from "@/components/SocialFeed";
import Availability from "@/components/Availability";
import Footer from "@/components/Footer";
import LiveChatWidget from "@/components/LiveChatWidget";

// Lazy-load heavy admin dashboard (60KB) — only loaded when visiting /admin
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));

// --- AUTHENTICATION GUARD ---
// Hash password using SHA-256 for comparison (never store plain text)
const hashPassword = async (pwd) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pwd);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
};

// Generate a signed session token (timestamp + hash) to prevent simple sessionStorage manipulation
const generateToken = async (pwd) => {
  const ts = Date.now().toString();
  const raw = `${pwd}-${ts}-janica-admin`;
  const hash = await hashPassword(raw);
  return `${ts}.${hash}`;
};

// Validate session token (expires after 4 hours)
const validateToken = async (token, pwd) => {
  if (!token || !token.includes('.')) return false;
  const [ts, hash] = token.split('.');
  const age = Date.now() - parseInt(ts, 10);
  if (isNaN(age) || age > 4 * 60 * 60 * 1000) return false; // 4 hour expiry
  const raw = `${pwd}-${ts}-janica-admin`;
  const expected = await hashPassword(raw);
  return hash === expected;
};

const ADMIN_PWD = process.env.REACT_APP_ADMIN_PASSWORD || 'admin';

const PrivateRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const navigate = useNavigate();

  // Validate existing session token on mount
  useEffect(() => {
    const check = async () => {
      const token = sessionStorage.getItem("admin-auth");
      if (token && token !== "true") {
        const valid = await validateToken(token, ADMIN_PWD);
        if (valid) { setIsAuthenticated(true); }
        else { sessionStorage.removeItem("admin-auth"); }
      } else {
        sessionStorage.removeItem("admin-auth"); // Clear old insecure tokens
      }
      setChecking(false);
    };
    check();
  }, []);

  // Lock after 5 failed attempts for 60 seconds
  useEffect(() => {
    if (attempts >= 5) {
      setLocked(true);
      const timer = setTimeout(() => { setLocked(false); setAttempts(0); }, 60000);
      return () => clearTimeout(timer);
    }
  }, [attempts]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (locked) { setError("Too many attempts. Try again in 60 seconds."); return; }
    if (password === ADMIN_PWD) {
      const token = await generateToken(ADMIN_PWD);
      setIsAuthenticated(true);
      sessionStorage.setItem("admin-auth", token);
      setError("");
    } else {
      setAttempts(a => a + 1);
      setError("Incorrect password. Access denied.");
      setPassword("");
    }
  };

  if (checking) return (
    <div style={{ minHeight: "100vh", backgroundColor: "#1a1c1b", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#888680", fontSize: "14px" }}>Verifying session…</div>
    </div>
  );
  if (isAuthenticated) return children;

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#1a1c1b",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: "380px" }}>
        <div style={{
          backgroundColor: "#302f2c",
          border: "1px solid #3f4816",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
            <div style={{
              width: "64px", height: "64px", borderRadius: "50%",
              backgroundColor: "rgba(63,72,22,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg style={{ width: "32px", height: "32px", color: "#d9fb06" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#fff", textAlign: "center", marginBottom: "8px" }}>
            Admin Access
          </h2>
          <p style={{ fontSize: "14px", color: "#888680", textAlign: "center", marginBottom: "24px" }}>
            Enter the admin password to continue.
          </p>

          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="Enter password"
              autoFocus
              style={{
                width: "100%", height: "48px", padding: "0 16px",
                borderRadius: "8px", backgroundColor: "#1a1c1b",
                border: "1px solid #3f4816", color: "#fff", fontSize: "14px",
                outline: "none", marginBottom: "12px", boxSizing: "border-box",
              }}
              onFocus={(e) => { e.target.style.borderColor = "#d9fb06"; }}
              onBlur={(e) => { e.target.style.borderColor = "#3f4816"; }}
            />

            {error && (
              <p style={{ color: "#f87171", fontSize: "14px", textAlign: "center", marginBottom: "12px" }}>
                {error}
              </p>
            )}

            <button type="submit" style={{
              width: "100%", height: "48px", backgroundColor: "#d9fb06",
              color: "#1a1c1b", fontWeight: "bold", fontSize: "14px",
              borderRadius: "8px", border: "none", cursor: "pointer",
              marginBottom: "8px",
            }}>
              Unlock Dashboard
            </button>

            <button type="button" onClick={() => navigate("/")} style={{
              width: "100%", height: "40px", backgroundColor: "transparent",
              color: "#888680", fontSize: "14px", border: "none", cursor: "pointer",
            }}>
              ← Back to Portfolio
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const Portfolio = () => {
  const { isDark } = useTheme();

  return (
    <>
      <Helmet>
        <title>Janica Cabidoy | Community Manager</title>
        <link rel="canonical" href="https://jcabidoy.xyz/" />
        <meta name="title" content="Janica Cabidoy | Community Manager" />
        <meta name="description" content="Community Manager with 163% growth results. Specializing in Telegram & Discord management, AI automation bots, and data-driven community strategies." />
        <meta name="keywords" content="Community Manager, Crypto, Web3, Telegram, Discord, Growth, Moderation, AI Bots" />
        <meta name="author" content="Janica Cabidoy" />
        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content={isDark ? '#1a1c1b' : '#f5f4f0'} />

        {/* Open Graph / Facebook / LinkedIn */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://jcabidoy.xyz/" />
        <meta property="og:title" content="Janica Cabidoy | Community Manager" />
        <meta property="og:description" content="Community Manager with 163% growth results. Specializing in Telegram & Discord management, AI automation bots, and data-driven community strategies." />
        <meta property="og:image" content="https://jcabidoy.xyz/og-image.svg" />
        <meta property="og:site_name" content="Janica Cabidoy Portfolio" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Janica Cabidoy | Community Manager" />
        <meta name="twitter:description" content="Community Manager with 163% growth results in Web3 communities. 95K+ members managed." />
        <meta name="twitter:image" content="https://jcabidoy.xyz/og-image.svg" />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Person",
          name: "Janica Cabidoy",
          url: "https://jcabidoy.xyz",
          jobTitle: "Community Manager",
          description: "Community Manager specializing in Web3, Telegram & Discord management with 163% growth results.",
          address: { "@type": "PostalAddress", addressLocality: "Cainta", addressRegion: "Rizal", addressCountry: "PH" },
          knowsAbout: ["Community Management", "Web3", "Telegram", "Discord", "AI Automation", "Content Strategy"],
        })}</script>
      </Helmet>
      <div className={`min-h-screen ${isDark ? 'bg-[#1a1c1b]' : 'bg-[#f5f4f0]'}`}>
        <Header />
        <main id="main-content">
          <Hero />
          <Metrics />
          <WhyHireMe />
          <CaseStudies />
          <Experience />
          <FAQ />
          <SocialFeed />
          <Availability />
        </main>
        <Footer />
        <LiveChatWidget />
      </div>
    </>
  );
};

// Loading fallback for lazy-loaded routes
const LazyFallback = () => (
  <div style={{
    minHeight: '100vh', backgroundColor: '#1a1c1b',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <div style={{ color: '#888680', fontSize: '14px' }}>Loading…</div>
  </div>
);

function App() {
  const { isDark } = useTheme();

  return (
    <div className={`App min-h-screen ${isDark ? 'bg-[#1a1c1b]' : 'bg-[#f5f4f0]'}`}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Portfolio />} />
          <Route path="/admin" element={
            <Suspense fallback={<LazyFallback />}>
              <PrivateRoute><AdminDashboard /></PrivateRoute>
            </Suspense>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

// Wrap App with providers and global error boundary
function AppWithProviders() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ContentProvider>
          <AnalyticsProvider>
            <App />
          </AnalyticsProvider>
        </ContentProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default AppWithProviders;
