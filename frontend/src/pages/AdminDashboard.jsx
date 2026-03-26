import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveSection, getSection, resetSection, getEditableSections } from '@/lib/contentStore';
import * as mockData from '@/data/mockData';

// ======================== ERROR BOUNDARY ========================
class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', backgroundColor: '#1a1c1b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#302f2c', border: '1px solid #3f4816', borderRadius: '12px', padding: '32px', maxWidth: '500px', width: '100%' }}>
            <h2 style={{ color: '#f87171', fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>Dashboard Error</h2>
            <p style={{ color: '#888680', fontSize: '14px', marginBottom: '16px' }}>Something went wrong loading the admin dashboard.</p>
            <pre style={{ color: '#d9fb06', fontSize: '12px', backgroundColor: '#1a1c1b', padding: '12px', borderRadius: '8px', overflow: 'auto', maxHeight: '200px' }}>
              {this.state.error?.message || 'Unknown error'}
            </pre>
            <button onClick={() => window.location.reload()} style={{ marginTop: '16px', padding: '10px 24px', backgroundColor: '#d9fb06', color: '#1a1c1b', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ======================== TOAST SYSTEM ========================
let toastContainer = null;
const toast = {
  _show(msg, type) {
    if (!toastContainer) return;
    const el = document.createElement('div');
    el.style.cssText = `padding:12px 20px;border-radius:8px;font-size:14px;font-weight:500;margin-bottom:8px;animation:fadeIn 0.3s;max-width:350px;word-wrap:break-word;${
      type === 'success' ? 'background:#166534;color:#4ade80;border:1px solid #22c55e' :
      type === 'error' ? 'background:#7f1d1d;color:#fca5a5;border:1px solid #ef4444' :
      'background:#302f2c;color:#fff;border:1px solid #3f4816'
    }`;
    el.textContent = msg;
    toastContainer.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300); }, 3000);
  },
  success(msg) { this._show(msg, 'success'); },
  error(msg) { this._show(msg, 'error'); },
  info(msg) { this._show(msg, 'info'); },
};

// ======================== LOCAL STORAGE HELPERS ========================
const MESSAGES_KEY = 'portfolio-messages';
const CHAT_KEY = 'portfolio-chat';
const FILES_KEY = 'portfolio-files';
const ANALYTICS_KEY = 'portfolio-analytics';

const getLocalData = (key, fallback = []) => {
  try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : fallback; }
  catch { return fallback; }
};
const setLocalData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// ======================== TABS ========================
const TABS = [
  { id: 'content', label: 'Content Editor' },
  { id: 'files', label: 'Files Manager' },
  { id: 'messages', label: 'Messages' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'chat', label: 'Live Chat' },
  { id: 'settings', label: 'Settings' },
];

// ======================== STYLES ========================
const S = {
  page: { minHeight: '100vh', backgroundColor: '#1a1c1b', color: '#fff', fontFamily: "'Inter', sans-serif" },
  header: { backgroundColor: '#302f2c', borderBottom: '1px solid #3f4816', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' },
  tabs: { backgroundColor: '#302f2c', borderBottom: '1px solid #3f4816', display: 'flex', gap: '4px', padding: '0 24px', overflowX: 'auto', position: 'sticky', top: 0, zIndex: 10 },
  tab: (active) => ({ padding: '16px 20px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', border: 'none', background: 'none', color: active ? '#d9fb06' : '#888680', borderBottom: active ? '3px solid #d9fb06' : '3px solid transparent', whiteSpace: 'nowrap' }),
  main: { maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' },
  card: { backgroundColor: '#302f2c', border: '1px solid #3f4816', borderRadius: '12px', overflow: 'hidden' },
  statCard: { backgroundColor: '#302f2c', border: '1px solid #3f4816', borderRadius: '12px', padding: '24px' },
  btn: (bg = '#d9fb06', fg = '#1a1c1b') => ({ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: bg, color: fg, fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }),
  btnGhost: { padding: '8px 16px', borderRadius: '8px', border: '1px solid #3f4816', backgroundColor: 'transparent', color: '#888680', cursor: 'pointer', fontSize: '13px' },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' },
  th: { padding: '12px 24px', textAlign: 'left', color: '#888680', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: '#1a1c1b' },
  td: { padding: '16px 24px', borderBottom: '1px solid #3f4816' },
  inputStyle: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #3f4816', backgroundColor: '#1a1c1b', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  labelStyle: { display: 'block', color: '#888680', fontSize: '11px', fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase' },
};

// ======================== MAIN DASHBOARD ========================
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('content');
  const toastRef = useRef(null);

  useEffect(() => { toastContainer = toastRef.current; }, []);

  const handleLogout = () => { sessionStorage.removeItem("admin-auth"); navigate("/"); };

  return (
    <DashboardErrorBoundary>
      <div style={S.page}>
        {/* Toast container */}
        <div ref={toastRef} style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 9999 }} />

        {/* Header */}
        <div style={S.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => navigate('/')} style={S.btnGhost}>← Back to Site</button>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold' }}>Janica's Admin</h1>
          </div>
          <button onClick={handleLogout} style={{ ...S.btnGhost, color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}>Logout</button>
        </div>

        {/* Tabs */}
        <div style={S.tabs}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={S.tab(activeTab === tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div style={S.main}>
          {activeTab === 'content' && <ContentEditor />}
          {activeTab === 'files' && <FilesManager />}
          {activeTab === 'messages' && <MessagesView />}
          {activeTab === 'analytics' && <AnalyticsView />}
          {activeTab === 'chat' && <ChatView />}
          {activeTab === 'settings' && <SettingsView />}
        </div>
      </div>
    </DashboardErrorBoundary>
  );
};

// ======================== CONTENT EDITOR ========================
const ContentEditor = () => {
  const sections = [
    { id: 'personalInfo', label: 'Personal Info' },
    { id: 'metrics', label: 'Metrics' },
    { id: 'experience', label: 'Experience' },
    { id: 'whyHireMe', label: 'Why Hire Me' },
    { id: 'faqData', label: 'FAQ' },
    { id: 'skills', label: 'Skills' },
    { id: 'education', label: 'Education' },
    { id: 'tools', label: 'Tools & Platforms' },
  ];

  const [activeSection, setActiveSection] = useState('personalInfo');
  const [formData, setFormData] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [newToolName, setNewToolName] = useState('');

  useEffect(() => {
    const data = getSection(activeSection);
    setFormData(data ? JSON.parse(JSON.stringify(data)) : null);
    setHasChanges(false);
    setNewToolName('');
  }, [activeSection]);

  const handleSave = () => {
    saveSection(activeSection, formData);
    setHasChanges(false);
    toast.success('Saved! Changes reflect on your portfolio immediately.');
  };

  const handleReset = () => {
    resetSection(activeSection);
    const data = mockData[activeSection] ?? null;
    setFormData(data ? JSON.parse(JSON.stringify(data)) : null);
    setHasChanges(false);
    toast.info('Reset to defaults.');
  };

  const updateField = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateNestedField = (key, subKey, value) => {
    setFormData(prev => ({ ...prev, [key]: { ...prev[key], [subKey]: value } }));
    setHasChanges(true);
  };

  const updateArrayItem = (index, key, value) => {
    setFormData(prev => {
      const arr = [...prev];
      arr[index] = { ...arr[index], [key]: value };
      return arr;
    });
    setHasChanges(true);
  };

  const removeArrayItem = (index) => {
    setFormData(prev => prev.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const addArrayItem = (template) => {
    setFormData(prev => [...prev, { ...template, id: Date.now() }]);
    setHasChanges(true);
  };

  if (!formData) return <p style={{ color: '#888680', textAlign: 'center', padding: '60px' }}>Loading...</p>;

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            style={activeSection === s.id ? S.btn() : S.btnGhost}>
            {s.label}
          </button>
        ))}
      </div>

      <div style={S.card}>
        <div style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '900' }}>{sections.find(s => s.id === activeSection)?.label} Content</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleReset} style={S.btnGhost}>Reset to Default</button>
              <button onClick={handleSave} disabled={!hasChanges}
                style={{ ...S.btn(), opacity: hasChanges ? 1 : 0.5 }}>
                Save Changes
              </button>
            </div>
          </div>

          {/* Personal Info */}
          {activeSection === 'personalInfo' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                ['name', 'Full Name'], ['title', 'Title / Role'], ['subtitle', 'Subtitle'],
                ['email', 'Email'], ['phone', 'Phone'], ['location', 'Location'],
                ['linkedin', 'LinkedIn URL'], ['telegram', 'Telegram Handle'],
                ['telegramUrl', 'Telegram URL'], ['calendly', 'Calendly URL'],
                ['resumeUrl', 'Resume URL'],
              ].map(([key, label]) => (
                <div key={key} style={key === 'subtitle' ? { gridColumn: '1 / -1' } : {}}>
                  <label style={S.labelStyle}>{label}</label>
                  <input style={S.inputStyle} value={formData[key] || ''} onChange={e => updateField(key, e.target.value)} />
                </div>
              ))}
              <div>
                <label style={S.labelStyle}>Availability Status</label>
                <input style={S.inputStyle} value={formData.availability?.status || ''} onChange={e => updateNestedField('availability', 'status', e.target.value)} />
              </div>
              <div>
                <label style={S.labelStyle}>Response Time</label>
                <input style={S.inputStyle} value={formData.availability?.responseTime || ''} onChange={e => updateNestedField('availability', 'responseTime', e.target.value)} />
              </div>
              <div>
                <label style={S.labelStyle}>Timezone</label>
                <input style={S.inputStyle} value={formData.availability?.timezone || ''} onChange={e => updateNestedField('availability', 'timezone', e.target.value)} />
              </div>
            </div>
          )}

          {/* Metrics */}
          {activeSection === 'metrics' && Array.isArray(formData) && (
            <div>
              {formData.map((item, idx) => (
                <div key={item.id || idx} style={{ padding: '16px', border: '1px solid #3f4816', borderRadius: '8px', marginBottom: '12px', backgroundColor: '#1a1c1b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ color: '#d9fb06', fontSize: '12px', fontWeight: 'bold' }}>Metric #{idx + 1}</span>
                    <button onClick={() => removeArrayItem(idx)} style={{ padding: '4px 10px', backgroundColor: '#7f1d1d', color: '#fca5a5', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>✕ Remove</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {[['value', 'Value'], ['label', 'Label'], ['description', 'Description'], ['detail', 'Detail']].map(([key, label]) => (
                      <div key={key}><label style={S.labelStyle}>{label}</label><input style={S.inputStyle} value={item[key] || ''} onChange={e => updateArrayItem(idx, key, e.target.value)} /></div>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={() => addArrayItem({ value: '', label: '', description: '', detail: '' })}
                style={{ width: '100%', padding: '16px', border: '2px dashed #3f4816', borderRadius: '8px', background: 'none', color: '#d9fb06', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>+ Add New Metric</button>
            </div>
          )}

          {/* Experience */}
          {activeSection === 'experience' && Array.isArray(formData) && (
            <div>
              {formData.map((item, idx) => (
                <div key={item.id || idx} style={{ padding: '16px', border: '1px solid #3f4816', borderRadius: '8px', marginBottom: '12px', backgroundColor: '#1a1c1b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ color: '#d9fb06', fontSize: '12px', fontWeight: 'bold' }}>Experience #{idx + 1}</span>
                    <button onClick={() => removeArrayItem(idx)} style={{ padding: '4px 10px', backgroundColor: '#7f1d1d', color: '#fca5a5', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>✕ Remove</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {[['role', 'Role'], ['company', 'Company'], ['period', 'Period']].map(([key, label]) => (
                      <div key={key}><label style={S.labelStyle}>{label}</label><input style={S.inputStyle} value={item[key] || ''} onChange={e => updateArrayItem(idx, key, e.target.value)} /></div>
                    ))}
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <label style={S.labelStyle}>Description</label>
                    <textarea style={{ ...S.inputStyle, minHeight: '80px', resize: 'vertical' }} value={item.description || ''} onChange={e => updateArrayItem(idx, 'description', e.target.value)} />
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <label style={S.labelStyle}>Highlights (comma-separated)</label>
                    <input style={S.inputStyle} value={(item.highlights || []).join(', ')} onChange={e => updateArrayItem(idx, 'highlights', e.target.value.split(',').map(h => h.trim()).filter(Boolean))} />
                  </div>
                </div>
              ))}
              <button onClick={() => addArrayItem({ role: '', company: '', period: '', description: '', highlights: [] })}
                style={{ width: '100%', padding: '16px', border: '2px dashed #3f4816', borderRadius: '8px', background: 'none', color: '#d9fb06', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>+ Add New Experience</button>
            </div>
          )}

          {/* Why Hire Me */}
          {activeSection === 'whyHireMe' && Array.isArray(formData) && (
            <div>
              {formData.map((item, idx) => (
                <div key={idx} style={{ padding: '16px', border: '1px solid #3f4816', borderRadius: '8px', marginBottom: '12px', backgroundColor: '#1a1c1b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ color: '#d9fb06', fontSize: '12px', fontWeight: 'bold' }}>Feature #{idx + 1}</span>
                    <button onClick={() => removeArrayItem(idx)} style={{ padding: '4px 10px', backgroundColor: '#7f1d1d', color: '#fca5a5', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>✕ Remove</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div><label style={S.labelStyle}>Icon</label><input style={S.inputStyle} value={item.icon || ''} onChange={e => updateArrayItem(idx, 'icon', e.target.value)} /></div>
                    <div><label style={S.labelStyle}>Title</label><input style={S.inputStyle} value={item.title || ''} onChange={e => updateArrayItem(idx, 'title', e.target.value)} /></div>
                  </div>
                  <div style={{ marginTop: '12px' }}><label style={S.labelStyle}>Description</label><textarea style={{ ...S.inputStyle, minHeight: '60px', resize: 'vertical' }} value={item.description || ''} onChange={e => updateArrayItem(idx, 'description', e.target.value)} /></div>
                </div>
              ))}
              <button onClick={() => addArrayItem({ icon: 'Star', title: '', description: '' })}
                style={{ width: '100%', padding: '16px', border: '2px dashed #3f4816', borderRadius: '8px', background: 'none', color: '#d9fb06', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>+ Add New Feature</button>
            </div>
          )}

          {/* FAQ */}
          {activeSection === 'faqData' && Array.isArray(formData) && (
            <div>
              {formData.map((item, idx) => (
                <div key={item.id || idx} style={{ padding: '16px', border: '1px solid #3f4816', borderRadius: '8px', marginBottom: '12px', backgroundColor: '#1a1c1b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ color: '#d9fb06', fontSize: '12px', fontWeight: 'bold' }}>FAQ #{idx + 1}</span>
                    <button onClick={() => removeArrayItem(idx)} style={{ padding: '4px 10px', backgroundColor: '#7f1d1d', color: '#fca5a5', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>✕ Remove</button>
                  </div>
                  <div style={{ marginBottom: '12px' }}><label style={S.labelStyle}>Question</label><input style={S.inputStyle} value={item.question || ''} onChange={e => updateArrayItem(idx, 'question', e.target.value)} /></div>
                  <div><label style={S.labelStyle}>Answer</label><textarea style={{ ...S.inputStyle, minHeight: '80px', resize: 'vertical' }} value={item.answer || ''} onChange={e => updateArrayItem(idx, 'answer', e.target.value)} /></div>
                </div>
              ))}
              <button onClick={() => addArrayItem({ question: '', answer: '' })}
                style={{ width: '100%', padding: '16px', border: '2px dashed #3f4816', borderRadius: '8px', background: 'none', color: '#d9fb06', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>+ Add New FAQ</button>
            </div>
          )}

          {/* Skills */}
          {activeSection === 'skills' && Array.isArray(formData) && (
            <div>
              {formData.map((item, idx) => (
                <div key={idx} style={{ padding: '16px', border: '1px solid #3f4816', borderRadius: '8px', marginBottom: '12px', backgroundColor: '#1a1c1b', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ flex: 2 }}><label style={S.labelStyle}>Skill Name</label><input style={S.inputStyle} value={item.name || ''} onChange={e => updateArrayItem(idx, 'name', e.target.value)} /></div>
                  <div style={{ flex: 1 }}><label style={S.labelStyle}>Level (%)</label><input type="number" min="0" max="100" style={S.inputStyle} value={item.level || 0} onChange={e => updateArrayItem(idx, 'level', parseInt(e.target.value) || 0)} /></div>
                  <button onClick={() => removeArrayItem(idx)} style={{ padding: '8px 12px', backgroundColor: '#7f1d1d', color: '#fca5a5', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', marginTop: '18px' }}>✕</button>
                </div>
              ))}
              <button onClick={() => addArrayItem({ name: '', level: 80 })}
                style={{ width: '100%', padding: '16px', border: '2px dashed #3f4816', borderRadius: '8px', background: 'none', color: '#d9fb06', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>+ Add New Skill</button>
            </div>
          )}

          {/* Education */}
          {activeSection === 'education' && typeof formData === 'object' && !Array.isArray(formData) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[['degree', 'Degree'], ['major', 'Major'], ['institution', 'Institution'], ['period', 'Period']].map(([key, label]) => (
                <div key={key}><label style={S.labelStyle}>{label}</label><input style={S.inputStyle} value={formData[key] || ''} onChange={e => updateField(key, e.target.value)} /></div>
              ))}
            </div>
          )}

          {/* Tools & Platforms */}
          {activeSection === 'tools' && Array.isArray(formData) && (
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                {formData.map((tool, idx) => (
                  <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#1a1c1b', border: '1px solid #3f4816', borderRadius: '6px', fontSize: '13px' }}>
                    {tool}
                    <button onClick={() => { setFormData(prev => prev.filter((_, i) => i !== idx)); setHasChanges(true); }}
                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '14px', padding: '0 2px', fontWeight: 'bold' }}>✕</button>
                  </span>
                ))}
                {formData.length === 0 && <p style={{ color: '#888680', fontSize: '13px' }}>No tools added yet.</p>}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  style={{ ...S.inputStyle, flex: 1 }}
                  placeholder="Type a tool name and press Enter or click Add"
                  value={newToolName}
                  onChange={e => setNewToolName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newToolName.trim()) {
                      setFormData(prev => [...prev, newToolName.trim()]);
                      setNewToolName('');
                      setHasChanges(true);
                    }
                  }}
                />
                <button onClick={() => {
                  if (newToolName.trim()) {
                    setFormData(prev => [...prev, newToolName.trim()]);
                    setNewToolName('');
                    setHasChanges(true);
                  }
                }} style={S.btn()}>+ Add</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ======================== FILES MANAGER ========================
const FilesManager = () => {
  const [files, setFiles] = useState(() => getLocalData(FILES_KEY, {}));
  const resumeRef = useRef(null);
  const landingRef = useRef(null);

  const handleUpload = (slot, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File too large (max 5MB for localStorage)'); return; }

    const reader = new FileReader();
    reader.onload = () => {
      const updated = { ...files, [slot]: { name: file.name, size: file.size, type: file.type, data: reader.result, uploadedAt: new Date().toISOString() } };
      setFiles(updated);
      setLocalData(FILES_KEY, updated);
      toast.success(`${file.name} uploaded!`);

      // Auto-update resume URL in content store
      if (slot === 'resume') {
        const personalInfo = getSection('personalInfo');
        if (personalInfo) {
          saveSection('personalInfo', { ...personalInfo, resumeUrl: reader.result });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = (slot) => {
    const updated = { ...files };
    delete updated[slot];
    setFiles(updated);
    setLocalData(FILES_KEY, updated);
    toast.success('File deleted');
  };

  const fmtSize = (b) => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB';

  const slots = [
    { id: 'resume', title: 'Resume / CV', desc: 'Visitors download this from "Download Resume" buttons.', accept: '.pdf', ref: resumeRef },
    { id: 'landing_page', title: 'Landing Page / Media Kit', desc: 'Additional downloadable file for clients.', accept: '.pdf,.png,.jpg,.jpeg', ref: landingRef },
  ];

  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: '900', marginBottom: '8px' }}>Files Manager</h2>
      <p style={{ color: '#888680', marginBottom: '32px' }}>Upload and manage your resume and landing page. Stored locally in your browser.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        {slots.map(slot => {
          const existing = files[slot.id];
          return (
            <div key={slot.id} style={S.card}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #3f4816' }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '4px' }}>{slot.title}</h3>
                <p style={{ color: '#888680', fontSize: '12px' }}>{slot.desc}</p>
              </div>

              {existing && (
                <div style={{ padding: '16px 24px', backgroundColor: 'rgba(63,72,22,0.2)', borderBottom: '1px solid #3f4816', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '500', color: '#4ade80' }}>✅ {existing.name}</p>
                    <p style={{ color: '#888680', fontSize: '12px' }}>{fmtSize(existing.size)} • {new Date(existing.uploadedAt).toLocaleDateString()}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a href={existing.data} download={existing.name} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #3f4816', color: '#d9fb06', textDecoration: 'none', fontSize: '13px' }}>↓</a>
                    <button onClick={() => handleDelete(slot.id)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', background: 'none', cursor: 'pointer', fontSize: '13px' }}>🗑</button>
                  </div>
                </div>
              )}

              <div style={{ padding: '24px' }}>
                <div
                  style={{ border: '2px dashed #3f4816', borderRadius: '12px', padding: '32px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => slot.ref.current?.click()}
                  onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleUpload(slot.id, f); }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <p style={{ fontSize: '24px', marginBottom: '8px' }}>📤</p>
                  <p style={{ fontWeight: '500' }}>{existing ? 'Replace file' : 'Upload file'}</p>
                  <p style={{ color: '#888680', fontSize: '12px', marginTop: '4px' }}>Drag & drop or click • {slot.accept}</p>
                </div>
                <input ref={slot.ref} type="file" accept={slot.accept} style={{ display: 'none' }}
                  onChange={(e) => { const f = e.target.files[0]; if (f) handleUpload(slot.id, f); e.target.value = ''; }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '32px', backgroundColor: 'rgba(48,47,44,0.5)', border: '1px solid #3f4816', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ fontWeight: '600', marginBottom: '12px', color: '#d9fb06' }}>How It Works</h3>
        <ul style={{ color: '#888680', fontSize: '14px', lineHeight: '2' }}>
          <li>• Upload your resume PDF — all "Download Resume" buttons will serve this file.</li>
          <li>• Files are stored in your browser's localStorage (max 5MB per file).</li>
          <li>• Uploading a new file replaces the previous one.</li>
        </ul>
      </div>
    </div>
  );
};

// ======================== MESSAGES ========================
const MessagesView = () => {
  const [messages, setMessages] = useState(() => getLocalData(MESSAGES_KEY, []));
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const refresh = () => setMessages(getLocalData(MESSAGES_KEY, []));

  const updateStatus = (id, status) => {
    const updated = messages.map(m => m.id === id ? { ...m, status } : m);
    setMessages(updated);
    setLocalData(MESSAGES_KEY, updated);
    toast.success(`Marked as ${status}`);
  };

  const deleteMessage = (id) => {
    const updated = messages.filter(m => m.id !== id);
    setMessages(updated);
    setLocalData(MESSAGES_KEY, updated);
    setShowDeleteConfirm(null);
    toast.success('Message deleted');
  };

  const fmtDate = (d) => {
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return d; }
  };

  const stats = {
    total: messages.length,
    new: messages.filter(m => m.status === 'new').length,
    read: messages.filter(m => m.status === 'read').length,
    replied: messages.filter(m => m.status === 'replied').length,
  };

  return (
    <div>
      {/* Stats */}
      <div style={S.grid4}>
        {[
          { label: 'Total Inbox', val: stats.total, color: '#fff' },
          { label: 'Unread', val: stats.new, color: '#d9fb06' },
          { label: 'Reviewed', val: stats.read, color: '#60a5fa' },
          { label: 'Replied', val: stats.replied, color: '#4ade80' },
        ].map(s => (
          <div key={s.label} style={S.statCard}>
            <p style={{ color: '#888680', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
            <p style={{ fontSize: '28px', fontWeight: '900', color: s.color, marginTop: '8px' }}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Messages Table */}
      <div style={S.card}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #3f4816', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>Client Inquiries</h3>
          <button onClick={refresh} style={S.btnGhost}>⟳ Refresh</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={S.th}>Sender</th>
                <th style={S.th}>Context</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Time</th>
                <th style={{ ...S.th, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {messages.map(msg => (
                <tr key={msg.id}>
                  <td style={S.td}>
                    <div style={{ fontWeight: '600' }}>{msg.name}</div>
                    <div style={{ fontSize: '12px', color: '#888680' }}>{msg.email}</div>
                  </td>
                  <td style={S.td}>
                    <div style={{ color: '#d9fb06', fontSize: '12px', fontWeight: '500' }}>{msg.project || 'General Inquiry'}</div>
                    <div style={{ color: '#888680', fontSize: '13px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.message}</div>
                  </td>
                  <td style={S.td}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold',
                      backgroundColor: msg.status === 'new' ? '#d9fb06' : msg.status === 'read' ? 'rgba(96,165,250,0.2)' : 'rgba(74,222,128,0.2)',
                      color: msg.status === 'new' ? '#1a1c1b' : msg.status === 'read' ? '#60a5fa' : '#4ade80',
                    }}>{msg.status}</span>
                  </td>
                  <td style={{ ...S.td, color: '#888680', fontSize: '12px' }}>{fmtDate(msg.created_at)}</td>
                  <td style={{ ...S.td, textAlign: 'right' }}>
                    <button onClick={() => setSelectedMessage(msg)} style={{ ...S.btnGhost, padding: '6px 10px', marginRight: '4px' }}>👁</button>
                    <button onClick={() => setShowDeleteConfirm(msg.id)} style={{ ...S.btnGhost, padding: '6px 10px', color: '#f87171' }}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {messages.length === 0 && (
            <p style={{ textAlign: 'center', padding: '60px 0', color: '#888680' }}>No messages yet. Messages from your portfolio's contact form will appear here.</p>
          )}
        </div>
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedMessage(null); }}>
          <div style={{ backgroundColor: '#1a1c1b', border: '1px solid #3f4816', borderRadius: '12px', padding: '32px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>{selectedMessage.name}</h2>
            <p style={{ color: '#888680', fontSize: '13px', marginBottom: '20px' }}>{selectedMessage.email} • {fmtDate(selectedMessage.created_at)}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#302f2c', padding: '16px', borderRadius: '8px', border: '1px solid #3f4816' }}>
                <div style={{ fontSize: '10px', color: '#d9fb06', textTransform: 'uppercase', marginBottom: '4px' }}>Project</div>
                <div style={{ fontSize: '14px' }}>{selectedMessage.project || 'General Inquiry'}</div>
              </div>
              <div style={{ backgroundColor: '#302f2c', padding: '16px', borderRadius: '8px', border: '1px solid #3f4816' }}>
                <div style={{ fontSize: '10px', color: '#d9fb06', textTransform: 'uppercase', marginBottom: '4px' }}>Preferred Start</div>
                <div style={{ fontSize: '14px' }}>{selectedMessage.preferred_date || 'ASAP'}</div>
              </div>
            </div>
            <div style={{ backgroundColor: '#302f2c', padding: '20px', borderRadius: '8px', border: '1px solid #3f4816', fontStyle: 'italic', color: '#c0bfbc', lineHeight: '1.6', marginBottom: '20px', whiteSpace: 'pre-wrap' }}>
              "{selectedMessage.message}"
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => { updateStatus(selectedMessage.id, 'read'); setSelectedMessage(null); }} style={S.btnGhost}>Mark Read</button>
              <button onClick={() => { updateStatus(selectedMessage.id, 'replied'); window.open(`mailto:${selectedMessage.email}?subject=RE: Portfolio - ${selectedMessage.project || 'Inquiry'}`); setSelectedMessage(null); }} style={S.btn()}>✉ Reply</button>
              <button onClick={() => setSelectedMessage(null)} style={S.btnGhost}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteConfirm(null); }}>
          <div style={{ backgroundColor: '#1a1c1b', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '12px', padding: '32px', maxWidth: '380px', width: '90%' }}>
            <h2 style={{ color: '#f87171', fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>Delete Permanently?</h2>
            <p style={{ color: '#888680', fontSize: '14px', marginBottom: '20px' }}>This cannot be undone.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setShowDeleteConfirm(null)} style={S.btnGhost}>Cancel</button>
              <button onClick={() => deleteMessage(showDeleteConfirm)} style={S.btn('#ef4444', '#fff')}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ======================== ANALYTICS ========================
const AnalyticsView = () => {
  const analyticsData = getLocalData(ANALYTICS_KEY, { pageviews: [], events: [] });
  const messages = getLocalData(MESSAGES_KEY, []);
  const files = getLocalData(FILES_KEY, {});
  const chatConvos = getChatConversations();

  const contentSections = getEditableSections();
  let customizedCount = 0;
  contentSections.forEach(s => {
    try { const saved = JSON.parse(localStorage.getItem('portfolio-content') || '{}'); if (saved[s]?.data) customizedCount++; } catch {}
  });

  // Compute real analytics from stored data
  const pageviews = Array.isArray(analyticsData.pageviews) ? analyticsData.pageviews : [];
  const events = Array.isArray(analyticsData.events) ? analyticsData.events : [];
  const uniqueVisitors = new Set(pageviews.map(p => p.visitor_id)).size;
  const resumeDownloads = events.filter(e => e.event_type === 'resume_download').length;
  const sectionViews = events.filter(e => e.event_type === 'section_view');

  // Today's pageviews
  const today = new Date().toISOString().split('T')[0];
  const todayViews = pageviews.filter(p => p.timestamp && p.timestamp.startsWith(today)).length;

  // Top pages
  const pageCounts = {};
  pageviews.forEach(p => { pageCounts[p.page] = (pageCounts[p.page] || 0) + 1; });
  const topPages = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Top sections viewed
  const sectionCounts = {};
  sectionViews.forEach(e => { const s = e.metadata?.section; if (s) sectionCounts[s] = (sectionCounts[s] || 0) + 1; });
  const topSections = Object.entries(sectionCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const Row = ({ label, val, color = '#fff' }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #3f4816', paddingBottom: '12px', marginBottom: '16px' }}>
      <span style={{ color: '#888680' }}>{label}</span>
      <span style={{ fontSize: '22px', fontWeight: 'bold', color }}>{val}</span>
    </div>
  );

  const SmallRow = ({ label, val }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #3f4816' }}>
      <span style={{ color: '#888680', fontSize: '14px' }}>{label}</span>
      <span style={{ color: '#d9fb06', fontSize: '14px', fontWeight: '600' }}>{val}</span>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: '900', marginBottom: '8px' }}>Analytics Overview</h2>
      <p style={{ color: '#888680', marginBottom: '32px' }}>Real-time portfolio activity tracked locally.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div style={S.card}>
          <div style={{ padding: '28px' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '24px' }}>📊 Traffic</h3>
            <Row label="Total Page Views" val={pageviews.length} color="#d9fb06" />
            <Row label="Today's Views" val={todayViews} color="#60a5fa" />
            <Row label="Unique Visitors" val={uniqueVisitors} />
            <Row label="Resume Downloads" val={resumeDownloads} color="#4ade80" />
          </div>
        </div>
        <div style={S.card}>
          <div style={{ padding: '28px' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '24px' }}>📬 Messages & Contact</h3>
            <Row label="Total Messages Received" val={messages.length} />
            <Row label="Unread Messages" val={messages.filter(m => m.status === 'new').length} color="#d9fb06" />
            <Row label="Replied Messages" val={messages.filter(m => m.status === 'replied').length} color="#4ade80" />
          </div>
        </div>
        <div style={S.card}>
          <div style={{ padding: '28px' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '24px' }}>💬 Live Chat</h3>
            <Row label="Total Conversations" val={chatConvos.length} />
            <Row label="Active Chats" val={chatConvos.filter(c => c.status === 'active').length} color="#60a5fa" />
            <Row label="Closed Chats" val={chatConvos.filter(c => c.status === 'closed').length} color="#888680" />
          </div>
        </div>
        <div style={S.card}>
          <div style={{ padding: '28px' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '24px' }}>📁 Content & Files</h3>
            <Row label="Files Uploaded" val={Object.keys(files).length} color="#60a5fa" />
            <Row label="Sections Customized" val={customizedCount} color="#d9fb06" />
            <Row label="Total Editable Sections" val={contentSections.length} />
          </div>
        </div>
        <div style={S.card}>
          <div style={{ padding: '28px' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '24px' }}>🎨 Theme & Settings</h3>
            <Row label="Current Theme" val={localStorage.getItem('portfolio-theme') || 'dark'} color="#d9fb06" />
            <Row label="Web3Forms Key" val={localStorage.getItem('web3forms-key') ? 'Configured' : 'Not Set'} color={localStorage.getItem('web3forms-key') ? '#4ade80' : '#f87171'} />
            <Row label="localStorage Used" val={(() => { let total = 0; for (let key in localStorage) { if (localStorage.hasOwnProperty(key)) total += localStorage[key].length * 2; } return (total / 1024).toFixed(1) + ' KB'; })()} color="#60a5fa" />
          </div>
        </div>
        {topPages.length > 0 && (
          <div style={S.card}>
            <div style={{ padding: '28px' }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '24px' }}>🔗 Top Pages</h3>
              {topPages.map(([page, count]) => <SmallRow key={page} label={page} val={`${count} views`} />)}
            </div>
          </div>
        )}
        {topSections.length > 0 && (
          <div style={S.card}>
            <div style={{ padding: '28px' }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '24px' }}>👁 Top Sections Viewed</h3>
              {topSections.map(([section, count]) => <SmallRow key={section} label={section} val={`${count} views`} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ======================== LIVE CHAT ========================
const getChatConversations = () => {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // LiveChatWidget stores as {conversations:[...]}, handle both formats
    if (Array.isArray(parsed)) return parsed;
    if (parsed.conversations) return parsed.conversations;
    return [];
  } catch { return []; }
};

const saveChatConversations = (convos) => {
  localStorage.setItem(CHAT_KEY, JSON.stringify({ conversations: convos }));
  window.dispatchEvent(new CustomEvent('chat-updated'));
};

const ChatView = () => {
  const [conversations, setConversations] = useState(() => getChatConversations());
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [adminReply, setAdminReply] = useState('');
  const chatEndRef = useRef(null);

  const selectedConvoRef = useRef(selectedConvo);
  selectedConvoRef.current = selectedConvo;

  const refresh = useCallback(() => {
    const data = getChatConversations();
    setConversations(data);
    const current = selectedConvoRef.current;
    if (current) {
      const updated = data.find(c => c.id === current.id);
      if (updated) setSelectedConvo(updated);
    }
  }, []);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener('storage', handler);
    window.addEventListener('chat-updated', handler);
    const interval = setInterval(refresh, 3000);
    return () => { window.removeEventListener('storage', handler); window.removeEventListener('chat-updated', handler); clearInterval(interval); };
  }, [refresh]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConvo?.messages?.length]);

  const sendReply = () => {
    if (!adminReply.trim() || !selectedConvo) return;
    const updated = conversations.map(c => {
      if (c.id === selectedConvo.id) {
        return {
          ...c,
          messages: [...(c.messages || []), { id: Date.now(), sender: 'admin', message: adminReply.trim(), timestamp: new Date().toISOString() }],
          last_message: adminReply.trim(),
          updated_at: new Date().toISOString(),
        };
      }
      return c;
    });
    setConversations(updated);
    saveChatConversations(updated);
    setSelectedConvo(updated.find(c => c.id === selectedConvo.id));
    setAdminReply('');
  };

  const closeConvo = (id) => {
    const updated = conversations.map(c => c.id === id ? { ...c, status: 'closed' } : c);
    setConversations(updated);
    saveChatConversations(updated);
    setSelectedConvo(null);
    toast.success('Conversation closed');
  };

  const deleteConvo = (id) => {
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    saveChatConversations(updated);
    if (selectedConvo?.id === id) setSelectedConvo(null);
    toast.success('Conversation deleted');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '900', marginBottom: '4px' }}>Live Chat</h2>
          <p style={{ color: '#888680', fontSize: '13px' }}>Respond to visitor chats from your portfolio's chat widget.</p>
        </div>
        <button onClick={refresh} style={S.btnGhost}>⟳ Refresh</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', height: '600px' }}>
        {/* Conversation List */}
        <div style={{ ...S.card, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', backgroundColor: '#1a1c1b', borderBottom: '1px solid #3f4816', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
            <span>Inbox</span>
            <span style={{ backgroundColor: '#d9fb06', color: '#1a1c1b', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>{conversations.length}</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.length === 0 && <p style={{ textAlign: 'center', padding: '32px', color: '#888680', fontSize: '13px' }}>No conversations yet. When visitors use the chat widget on your portfolio, conversations will appear here.</p>}
            {conversations.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #3f4816' }}>
                <button onClick={() => setSelectedConvo(c)} style={{
                  flex: 1, padding: '16px', textAlign: 'left', cursor: 'pointer',
                  background: selectedConvo?.id === c.id ? 'rgba(63,72,22,0.4)' : 'transparent',
                  border: 'none', borderLeft: selectedConvo?.id === c.id ? '4px solid #d9fb06' : '4px solid transparent', color: '#fff',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{c.visitor_name || 'Visitor'}</span>
                    {c.status === 'closed' && <span style={{ fontSize: '10px', color: '#888680', padding: '2px 6px', border: '1px solid #3f4816', borderRadius: '4px' }}>closed</span>}
                  </div>
                  <p style={{ fontSize: '12px', color: '#888680', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '4px' }}>"{c.last_message || '...'}"</p>
                </button>
                <button onClick={() => deleteConvo(c.id)} style={{ padding: '8px', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '12px', marginRight: '8px' }}>🗑</button>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div style={{ ...S.card, display: 'flex', flexDirection: 'column' }}>
          {selectedConvo ? (
            <>
              <div style={{ padding: '16px', backgroundColor: '#1a1c1b', borderBottom: '1px solid #3f4816', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#d9fb06', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a1c1b', fontWeight: 'bold', fontSize: '12px' }}>
                    {(selectedConvo.visitor_name || 'V')[0]}
                  </div>
                  <span style={{ fontWeight: 'bold' }}>{selectedConvo.visitor_name || 'Visitor'}</span>
                </div>
                {selectedConvo.status !== 'closed' && (
                  <button onClick={() => closeConvo(selectedConvo.id)} style={{ ...S.btnGhost, color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}>End Chat</button>
                )}
              </div>
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#262522' }}>
                {(selectedConvo.messages || []).map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: m.sender === 'admin' ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
                    <div style={{
                      padding: '10px 14px', borderRadius: '16px', maxWidth: '75%', fontSize: '14px',
                      backgroundColor: m.sender === 'admin' ? '#d9fb06' : '#302f2c',
                      color: m.sender === 'admin' ? '#1a1c1b' : '#fff',
                      border: m.sender === 'admin' ? 'none' : '1px solid #3f4816',
                    }}>
                      {m.message}
                      <div style={{ fontSize: '10px', color: m.sender === 'admin' ? '#1a1c1b80' : '#88868080', marginTop: '4px' }}>
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              {selectedConvo.status !== 'closed' && (
                <div style={{ padding: '12px', backgroundColor: '#1a1c1b', borderTop: '1px solid #3f4816', display: 'flex', gap: '8px' }}>
                  <input value={adminReply} onChange={e => setAdminReply(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendReply()}
                    placeholder="Write a response..."
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #3f4816', backgroundColor: '#302f2c', color: '#fff', fontSize: '14px', outline: 'none' }} />
                  <button onClick={sendReply} style={S.btn()}>Send</button>
                </div>
              )}
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888680' }}>
              <p>Select a conversation to respond</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ======================== SETTINGS ========================
const SettingsView = () => {
  const [web3Key, setWeb3Key] = useState(localStorage.getItem('web3forms-key') || '');
  const [testStatus, setTestStatus] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const saveWeb3Forms = () => {
    if (web3Key.trim()) {
      localStorage.setItem('web3forms-key', web3Key.trim());
      toast.success('Web3Forms key saved!');
    } else {
      localStorage.removeItem('web3forms-key');
      toast.success('Web3Forms key removed.');
    }
  };

  const testWeb3Forms = async () => {
    if (!web3Key.trim()) { toast.error('Enter a key first'); return; }
    setTestStatus('Sending...');
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: web3Key.trim(),
          subject: 'Test Email from Portfolio Admin',
          from_name: 'Portfolio Admin',
          email: 'test@portfolio.com',
          message: 'This is a test email from your portfolio admin dashboard.',
        }),
      });
      const data = await res.json();
      if (data.success) { setTestStatus('Sent!'); toast.success('Test email sent!'); }
      else { setTestStatus('Failed'); toast.error(data.message || 'Failed to send'); }
    } catch (err) { setTestStatus('Error'); toast.error('Network error'); }
  };

  const clearAllData = () => {
    if (window.confirm('This will clear ALL admin data (messages, chats, files, content edits). Are you sure?')) {
      localStorage.removeItem(MESSAGES_KEY);
      localStorage.removeItem(CHAT_KEY);
      localStorage.removeItem(FILES_KEY);
      localStorage.removeItem('portfolio-content');
      toast.success('All data cleared. Portfolio will use default content.');
      window.dispatchEvent(new CustomEvent('content-updated'));
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: '900', marginBottom: '8px' }}>Settings</h2>
      <p style={{ color: '#888680', marginBottom: '32px' }}>Configure your portfolio admin dashboard.</p>

      <div style={{ display: 'grid', gap: '24px' }}>
        {/* Email Notifications */}
        <div style={S.card}>
          <div style={{ padding: '28px' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>📧 Email Notifications</h3>
            <p style={{ color: '#888680', fontSize: '13px', marginBottom: '24px' }}>Get notified via email when someone messages you through the contact form.</p>
            <div style={{ padding: '20px', border: '1px solid #3f4816', borderRadius: '12px', backgroundColor: '#1a1c1b', marginBottom: '16px' }}>
              <h4 style={{ color: '#d9fb06', fontWeight: 'bold', fontSize: '14px', marginBottom: '12px' }}>Web3Forms (Recommended)</h4>
              <p style={{ color: '#888680', fontSize: '12px', marginBottom: '16px' }}>
                Free, no sign-up required. Get your access key at <a href="https://web3forms.com" target="_blank" rel="noopener noreferrer" style={{ color: '#d9fb06', textDecoration: 'underline' }}>web3forms.com</a>
              </p>
              <div style={{ marginBottom: '12px' }}>
                <label style={S.labelStyle}>Access Key</label>
                <input style={S.inputStyle} value={web3Key} onChange={e => setWeb3Key(e.target.value)} placeholder="Enter your Web3Forms access key" />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={saveWeb3Forms} style={S.btn()}>Save Key</button>
                <button onClick={testWeb3Forms} style={S.btnGhost}>
                  {testStatus === 'Sending...' ? '⟳ Sending...' : 'Send Test Email'}
                </button>
              </div>
              {testStatus === 'Sent!' && <p style={{ color: '#22c55e', fontSize: '12px', marginTop: '8px' }}>Test email sent successfully!</p>}
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div style={S.card}>
          <div style={{ padding: '28px' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>🗄 Data Management</h3>
            <p style={{ color: '#888680', fontSize: '13px', marginBottom: '24px' }}>All admin data is stored in your browser's localStorage.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '16px', border: '1px solid #3f4816', borderRadius: '8px', backgroundColor: '#1a1c1b' }}>
                <p style={{ color: '#888680', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Storage Used</p>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#d9fb06' }}>
                  {(() => { let total = 0; for (let key in localStorage) { if (localStorage.hasOwnProperty(key)) total += localStorage[key].length * 2; } return (total / 1024).toFixed(1) + ' KB'; })()}
                </p>
              </div>
              <div style={{ padding: '16px', border: '1px solid #3f4816', borderRadius: '8px', backgroundColor: '#1a1c1b' }}>
                <p style={{ color: '#888680', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Storage Limit</p>
                <p style={{ fontSize: '20px', fontWeight: 'bold' }}>~5 MB</p>
              </div>
            </div>
            <button onClick={clearAllData} style={{ ...S.btn('#ef4444', '#fff'), padding: '12px 24px' }}>
              Clear All Admin Data
            </button>
            <p style={{ color: '#888680', fontSize: '11px', marginTop: '8px' }}>This resets everything to defaults. Your portfolio will show the original mockData content.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
