import React, { useState, useRef, useEffect } from 'react';

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0e1a;
    --surface: #111827;
    --surface2: #1a2235;
    --border: #1e3a5f;
    --accent: #3b82f6;
    --accent2: #06b6d4;
    --accent3: #8b5cf6;
    --text: #e2e8f0;
    --muted: #64748b;
    --user-bubble: #1e3a5f;
    --bot-bubble: #141d2e;
    --success: #10b981;
    --warning: #f59e0b;
    --font: 'Cairo', sans-serif;
    --mono: 'IBM Plex Mono', monospace;
  }

  body {
    font-family: var(--font);
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    direction: rtl;
  }

  .app {
    display: grid;
    grid-template-columns: 280px 1fr;
    grid-template-rows: 60px 1fr;
    height: 100vh;
    overflow: hidden;
  }

  /* Header */
  .header {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    background: linear-gradient(90deg, #0f172a, #1e3a5f);
    border-bottom: 1px solid var(--border);
    position: relative;
    overflow: hidden;
  }
  .header::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      90deg, transparent, transparent 80px,
      rgba(59,130,246,0.04) 80px, rgba(59,130,246,0.04) 81px
    );
  }
  .header-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 900;
    font-size: 18px;
    color: white;
    position: relative;
  }
  .logo-icon {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, var(--accent), var(--accent3));
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
  }
  .header-badges {
    display: flex; gap: 8px; position: relative;
  }
  .badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .badge-fp { background: rgba(59,130,246,0.2); color: #93c5fd; border: 1px solid rgba(59,130,246,0.3); }
  .badge-ucp { background: rgba(139,92,246,0.2); color: #c4b5fd; border: 1px solid rgba(139,92,246,0.3); }

  /* Sidebar */
  .sidebar {
    background: var(--surface);
    border-left: 1px solid var(--border);
    overflow-y: auto;
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .sidebar-section {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px;
  }
  .sidebar-title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    color: var(--accent);
    text-transform: uppercase;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .sidebar-title::before {
    content: '';
    width: 3px; height: 14px;
    background: var(--accent);
    border-radius: 2px;
  }
  .api-input {
    width: 100%;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 12px;
    color: var(--text);
    font-family: var(--mono);
    font-size: 12px;
    outline: none;
    transition: border-color 0.2s;
  }
  .api-input:focus { border-color: var(--accent); }
  .api-label {
    font-size: 11px;
    color: var(--muted);
    margin-bottom: 6px;
    display: block;
  }

  .metric-card {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 8px;
  }
  .metric-label { font-size: 10px; color: var(--muted); margin-bottom: 4px; }
  .metric-value {
    font-size: 20px;
    font-weight: 900;
    font-family: var(--mono);
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .metric-sub { font-size: 10px; color: var(--muted); margin-top: 2px; }

  .progress-bar-wrap { margin-top: 6px; }
  .progress-bar-bg {
    height: 4px;
    background: var(--border);
    border-radius: 2px;
    overflow: hidden;
  }
  .progress-bar-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.6s ease;
  }

  .btn {
    width: 100%;
    padding: 10px 16px;
    border-radius: 8px;
    border: none;
    font-family: var(--font);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .btn-primary {
    background: linear-gradient(135deg, var(--accent), #2563eb);
    color: white;
  }
  .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
  .btn-success {
    background: linear-gradient(135deg, var(--success), #059669);
    color: white;
  }
  .btn-success:hover { opacity: 0.9; transform: translateY(-1px); }
  .btn-outline {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--muted);
  }
  .btn-outline:hover { border-color: var(--accent); color: var(--accent); }

  /* Chat area */
  .chat-area {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    scroll-behavior: smooth;
  }
  .messages::-webkit-scrollbar { width: 4px; }
  .messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .msg-wrap {
    display: flex;
    gap: 12px;
    animation: fadeUp 0.3s ease;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .msg-wrap.user { flex-direction: row-reverse; }

  .msg-avatar {
    width: 36px; height: 36px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
  }
  .avatar-bot {
    background: linear-gradient(135deg, var(--accent), var(--accent3));
  }
  .avatar-user {
    background: linear-gradient(135deg, var(--surface2), var(--border));
    border: 1px solid var(--border);
  }

  .msg-bubble {
    max-width: 70%;
    padding: 12px 16px;
    border-radius: 14px;
    font-size: 14px;
    line-height: 1.7;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .bubble-bot {
    background: var(--bot-bubble);
    border: 1px solid var(--border);
    border-top-right-radius: 4px;
  }
  .bubble-user {
    background: var(--user-bubble);
    border: 1px solid rgba(59,130,246,0.3);
    border-top-left-radius: 4px;
    color: #bfdbfe;
  }

  .typing {
    display: flex; gap: 4px; padding: 4px 0;
  }
  .typing span {
    width: 7px; height: 7px;
    background: var(--accent);
    border-radius: 50%;
    animation: bounce 1.2s infinite;
  }
  .typing span:nth-child(2) { animation-delay: 0.2s; }
  .typing span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce {
    0%,80%,100% { transform: translateY(0); }
    40% { transform: translateY(-8px); }
  }

  /* Input area */
  .input-area {
    padding: 16px 24px;
    background: var(--surface);
    border-top: 1px solid var(--border);
    display: flex;
    gap: 12px;
    align-items: flex-end;
  }
  .textarea-wrap {
    flex: 1;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px 16px;
    transition: border-color 0.2s;
  }
  .textarea-wrap:focus-within { border-color: var(--accent); }
  .chat-textarea {
    width: 100%;
    background: transparent;
    border: none;
    color: var(--text);
    font-family: var(--font);
    font-size: 14px;
    resize: none;
    outline: none;
    min-height: 44px;
    max-height: 120px;
    direction: rtl;
  }
  .send-btn {
    width: 48px; height: 48px;
    border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, var(--accent), #2563eb);
    color: white;
    font-size: 18px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  .send-btn:hover:not(:disabled) { opacity: 0.9; transform: scale(1.05); }
  .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Results panel */
  .results-panel {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px;
    margin: 12px 24px;
    animation: fadeUp 0.4s ease;
  }
  .results-title {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1px;
    color: var(--success);
    text-transform: uppercase;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .results-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .result-item {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px;
    text-align: center;
  }
  .result-method {
    font-size: 10px;
    color: var(--muted);
    font-weight: 700;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }
  .result-val {
    font-size: 18px;
    font-weight: 900;
    font-family: var(--mono);
  }
  .result-val.fp { color: var(--accent); }
  .result-val.ucp { color: var(--accent3); }
  .result-sub { font-size: 10px; color: var(--muted); margin-top: 2px; }

  .welcome-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: 20px;
    text-align: center;
    padding: 40px;
  }
  .welcome-icon {
    width: 80px; height: 80px;
    background: linear-gradient(135deg, var(--accent), var(--accent3));
    border-radius: 20px;
    display: flex; align-items: center; justify-content: center;
    font-size: 40px;
  }
  .welcome-title {
    font-size: 28px;
    font-weight: 900;
    background: linear-gradient(135deg, white, var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .welcome-sub { color: var(--muted); font-size: 14px; max-width: 400px; }
  .start-btn {
    background: linear-gradient(135deg, var(--accent), var(--accent3));
    color: white;
    border: none;
    padding: 14px 32px;
    border-radius: 12px;
    font-family: var(--font);
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }
  .start-btn:hover { opacity: 0.9; transform: translateY(-2px); }

  .step-indicator {
    display: flex;
    gap: 6px;
    padding: 12px 24px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
  }
  .step-dot {
    height: 4px;
    border-radius: 2px;
    transition: all 0.3s;
    flex: 1;
  }
  .step-dot.active { background: var(--accent); }
  .step-dot.done { background: var(--success); }
  .step-dot.pending { background: var(--border); }

  @media (max-width: 768px) {
    .app { grid-template-columns: 1fr; }
    .sidebar { display: none; }
    .msg-bubble { max-width: 90%; }
  }
`;

// ─── Utilities ────────────────────────────────────────────────────────────────
function stripJsonBlock(text) {
  return text.replace(/```json[\s\S]*?```/g, '').trim();
}

function formatCurrency(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

function formatHours(n) {
  return Math.round(n).toLocaleString('en-US') + ' hrs';
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('or_key') || '');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [projectData, setProjectData] = useState(null);
  const [genPdf, setGenPdf] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const saveKey = (k) => {
    setApiKey(k);
    localStorage.setItem('or_key', k);
  };

  const sendMessage = async (text) => {
    if (!text.trim() || !apiKey) return;
    const userMsg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, apiKey }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const clean = stripJsonBlock(data.content);
      setMessages(prev => [...prev, { role: 'assistant', content: clean }]);

      if (data.extractedData?.stage === 'complete') {
        setProjectData(data.extractedData);
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ حدث خطأ: ${e.message}\nتحقق من صحة مفتاح API وحاول مرة أخرى.`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    setStarted(true);
    setMessages([]);
    setProjectData(null);
    await sendMessage('ابدأ الحوار معي لتقدير مشروعي البرمجي. قدم نفسك واطرح أول سؤال.');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleDownloadPdf = async () => {
    if (!projectData) return;
    setGenPdf(true);
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectData }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `estimation-${projectData.projectInfo.name || 'report'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('فشل توليد PDF: ' + e.message);
    } finally {
      setGenPdf(false);
    }
  };

  const handleReset = () => {
    setStarted(false);
    setMessages([]);
    setProjectData(null);
    setInput('');
  };

  // Progress steps
  const step = messages.length === 0 ? 0
    : projectData ? 5
    : messages.length < 4 ? 1
    : messages.length < 8 ? 2
    : messages.length < 14 ? 3
    : 4;

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {/* Header */}
        <header className="header">
          <div className="header-logo">
            <div className="logo-icon">🔢</div>
            مُقدِّر المشاريع البرمجية
          </div>
          <div className="header-badges">
            <span className="badge badge-fp">Function Point</span>
            <span className="badge badge-ucp">Use Case Point</span>
          </div>
        </header>

        {/* Sidebar */}
        <aside className="sidebar">
          {/* API Key */}
          <div className="sidebar-section">
            <div className="sidebar-title">إعدادات API</div>
            <label className="api-label">مفتاح OpenRouter</label>
            <input
              className="api-input"
              type="password"
              placeholder="sk-or-..."
              value={apiKey}
              onChange={e => saveKey(e.target.value)}
            />
          </div>

          {/* Results */}
          {projectData && (
            <div className="sidebar-section">
              <div className="sidebar-title">نتائج التقدير</div>

              <div className="metric-card">
                <div className="metric-label">Function Points (FP)</div>
                <div className="metric-value">{projectData.fpResults.fp.toFixed(1)}</div>
                <div className="progress-bar-wrap">
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{
                      width: `${Math.min(100, projectData.fpResults.fp / 3)}%`,
                      background: 'linear-gradient(90deg,#3b82f6,#06b6d4)'
                    }}/>
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-label">Use Case Points (UCP)</div>
                <div className="metric-value">{projectData.ucpResults.ucp.toFixed(1)}</div>
                <div className="progress-bar-wrap">
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{
                      width: `${Math.min(100, projectData.ucpResults.ucp / 3)}%`,
                      background: 'linear-gradient(90deg,#8b5cf6,#06b6d4)'
                    }}/>
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-label">متوسط الجهد التقديري</div>
                <div className="metric-value">
                  {Math.round((projectData.fpResults.effortHours + projectData.ucpResults.effortHours) / 2).toLocaleString()}
                </div>
                <div className="metric-sub">ساعة عمل</div>
              </div>

              <div className="metric-card">
                <div className="metric-label">متوسط التكلفة التقديرية</div>
                <div className="metric-value" style={{fontSize:'16px'}}>
                  {formatCurrency((projectData.fpResults.cost + projectData.ucpResults.cost) / 2)}
                </div>
                <div className="metric-sub">دولار أمريكي</div>
              </div>

              <button
                className="btn btn-success"
                onClick={handleDownloadPdf}
                disabled={genPdf}
                style={{marginTop:'8px'}}
              >
                {genPdf ? '⏳ جارٍ التوليد...' : '📄 تحميل تقرير PDF'}
              </button>
            </div>
          )}

          {/* Actions */}
          {started && (
            <div className="sidebar-section">
              <div className="sidebar-title">الأدوات</div>
              <button className="btn btn-outline" onClick={handleReset}>
                🔄 بدء مشروع جديد
              </button>
            </div>
          )}

          {/* Guide */}
          <div className="sidebar-section">
            <div className="sidebar-title">دليل الاستخدام</div>
            <div style={{fontSize:'12px', color:'var(--muted)', lineHeight:'1.8'}}>
              <p>1️⃣ أدخل مفتاح OpenRouter API</p>
              <p>2️⃣ اضغط "ابدأ التقدير"</p>
              <p>3️⃣ أجب على أسئلة الشات بوت</p>
              <p>4️⃣ احصل على النتائج والتقرير</p>
            </div>
          </div>
        </aside>

        {/* Chat Area */}
        <main className="chat-area">
          {/* Step indicator */}
          {started && (
            <div className="step-indicator">
              {[0,1,2,3,4].map(i => (
                <div key={i} className={`step-dot ${i < step ? 'done' : i === step ? 'active' : 'pending'}`}/>
              ))}
            </div>
          )}

          {/* Messages or Welcome */}
          {!started ? (
            <div className="welcome-screen">
              <div className="welcome-icon">🤖</div>
              <div className="welcome-title">مُقدِّر المشاريع الذكي</div>
              <div className="welcome-sub">
                شات بوت ذكي يحلل مشروعك البرمجي ويقدر حجمه وجهده وتكلفته
                باستخدام طريقتي Function Point و Use Case Point
              </div>
              {!apiKey && (
                <div style={{
                  background:'rgba(245,158,11,0.1)',
                  border:'1px solid rgba(245,158,11,0.3)',
                  borderRadius:'8px',
                  padding:'10px 16px',
                  fontSize:'13px',
                  color:'#fcd34d'
                }}>
                  ⚠️ الرجاء إدخال مفتاح OpenRouter API في الشريط الجانبي
                </div>
              )}
              <button className="start-btn" onClick={handleStart} disabled={!apiKey}>
                🚀 ابدأ التقدير
              </button>
            </div>
          ) : (
            <>
              <div className="messages">
                {messages.map((m, i) => (
                  <div key={i} className={`msg-wrap ${m.role === 'user' ? 'user' : ''}`}>
                    <div className={`msg-avatar ${m.role === 'user' ? 'avatar-user' : 'avatar-bot'}`}>
                      {m.role === 'user' ? '👤' : '🤖'}
                    </div>
                    <div className={`msg-bubble ${m.role === 'user' ? 'bubble-user' : 'bubble-bot'}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="msg-wrap">
                    <div className="msg-avatar avatar-bot">🤖</div>
                    <div className="msg-bubble bubble-bot">
                      <div className="typing">
                        <span/><span/><span/>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef}/>
              </div>

              {/* Results Summary */}
              {projectData && (
                <div className="results-panel">
                  <div className="results-title">✅ اكتمل التحليل — نتائج التقدير</div>
                  <div className="results-grid">
                    <div className="result-item">
                      <div className="result-method">FP — Function Points</div>
                      <div className="result-val fp">{projectData.fpResults.fp.toFixed(1)}</div>
                      <div className="result-sub">{formatHours(projectData.fpResults.effortHours)} · {formatCurrency(projectData.fpResults.cost)}</div>
                    </div>
                    <div className="result-item">
                      <div className="result-method">UCP — Use Case Points</div>
                      <div className="result-val ucp">{projectData.ucpResults.ucp.toFixed(1)}</div>
                      <div className="result-sub">{formatHours(projectData.ucpResults.effortHours)} · {formatCurrency(projectData.ucpResults.cost)}</div>
                    </div>
                    <div className="result-item" style={{gridColumn:'1/-1'}}>
                      <div className="result-method">المتوسط النهائي</div>
                      <div className="result-val" style={{color:'var(--success)',fontSize:'22px'}}>
                        {formatCurrency((projectData.fpResults.cost + projectData.ucpResults.cost) / 2)}
                      </div>
                      <div className="result-sub">
                        {Math.round((projectData.fpResults.effortHours + projectData.ucpResults.effortHours) / 2).toLocaleString()} ساعة عمل تقديرياً
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn btn-success"
                    style={{marginTop:'12px'}}
                    onClick={handleDownloadPdf}
                    disabled={genPdf}
                  >
                    {genPdf ? '⏳ جارٍ توليد التقرير...' : '📄 تحميل التقرير PDF'}
                  </button>
                </div>
              )}

              {/* Input */}
              <div className="input-area">
                <div className="textarea-wrap">
                  <textarea
                    className="chat-textarea"
                    placeholder="اكتب ردك هنا... (Enter للإرسال)"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={2}
                    disabled={loading}
                  />
                </div>
                <button
                  className="send-btn"
                  onClick={() => sendMessage(input)}
                  disabled={loading || !input.trim()}
                >
                  ➤
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}
