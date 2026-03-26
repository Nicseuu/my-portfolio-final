import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { AnalyticsProvider } from "@/context/AnalyticsContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { ContentProvider } from "@/context/ContentContext";
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
import AdminDashboard from "@/pages/AdminDashboard";

// --- AUTHENTICATION GUARD ---
const PrivateRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem("admin-auth") === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === (process.env.REACT_APP_ADMIN_PASSWORD || 'admin')) {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin-auth", "true");
      setError("");
    } else {
      setError("Incorrect password. Access denied.");
      setPassword("");
    }
  };

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
        <meta name="title" content="Janica Cabidoy | Community Manager" />
        <meta name="description" content="Community Manager with 163% growth results. Specializing in Telegram & Discord management, AI automation bots, and data-driven community strategies." />
        <meta name="keywords" content="Community Manager, Crypto, Telegram, Discord, Growth" />
        <meta property="og:url" content="https://jcabidoy.xyz/" />
        <meta property="og:image" content="/og-image.svg" />
        <meta name="theme-color" content={isDark ? '#1a1c1b' : '#f5f4f0'} />
      </Helmet>
      <div className={`min-h-screen ${isDark ? 'bg-[#1a1c1b]' : 'bg-[#f5f4f0]'}`}>
        <Header />
        <main>
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

function App() {
  const { isDark } = useTheme();

  return (
    <div className={`App min-h-screen ${isDark ? 'bg-[#1a1c1b]' : 'bg-[#f5f4f0]'}`}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Portfolio />} />
          <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

// Wrap App with providers
function AppWithProviders() {
  return (
    <ThemeProvider>
      <ContentProvider>
        <AnalyticsProvider>
          <App />
        </AnalyticsProvider>
      </ContentProvider>
    </ThemeProvider>
  );
}

export default AppWithProviders;
