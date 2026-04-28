import { useState, useEffect } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Legend, Filler
} from "chart.js";
import "./App.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const API = "https://phantom-resilience-api.onrender.com";

const COUNTRY_NAMES = {
  MY: "Malaysia",        PH: "Philippines",     ID: "Indonesia",
  BD: "Bangladesh",      KE: "Kenya",            NG: "Nigeria",
  ET: "Ethiopia",        PK: "Pakistan",         MM: "Myanmar",
  KH: "Cambodia",        VN: "Vietnam",          TZ: "Tanzania",
  UG: "Uganda",          MZ: "Mozambique",       ZM: "Zambia",
  SD: "Sudan",           YE: "Yemen",            HT: "Haiti",
  NP: "Nepal",           LA: "Laos",             SN: "Senegal",
  MG: "Madagascar",      ML: "Mali",             GH: "Ghana",
  ZW: "Zimbabwe",
};

const COUNTRY_FLAGS = {
  MY: "🇲🇾", PH: "🇵🇭", ID: "🇮🇩", BD: "🇧🇩", KE: "🇰🇪",
  NG: "🇳🇬", ET: "🇪🇹", PK: "🇵🇰", MM: "🇲🇲", KH: "🇰🇭",
  VN: "🇻🇳", TZ: "🇹🇿", UG: "🇺🇬", MZ: "🇲🇿", ZM: "🇿🇲",
  SD: "🇸🇩", YE: "🇾🇪", HT: "🇭🇹", NP: "🇳🇵", LA: "🇱🇦",
  SN: "🇸🇳", MG: "🇲🇬", ML: "🇲🇱", GH: "🇬🇭", ZW: "🇿🇼",
};

const RISK_CONFIG = {
  STABLE:   { color: "#3fb950", bg: "rgba(63,185,80,0.08)",   bar: "#3fb950", label: "Stable"   },
  WATCH:    { color: "#2dd4bf", bg: "rgba(45,212,191,0.08)",  bar: "#2dd4bf", label: "Watch"    },
  ELEVATED: { color: "#d29922", bg: "rgba(210,153,34,0.08)",  bar: "#d29922", label: "Elevated" },
  DANGER:   { color: "#f07030", bg: "rgba(240,112,48,0.08)",  bar: "#f07030", label: "Danger"   },
  CRITICAL: { color: "#f85149", bg: "rgba(248,81,73,0.08)",   bar: "#f85149", label: "Critical" },
};

const INTERVENTIONS = {
  STABLE:   "Community is stable. Maintain quarterly monitoring and continue current development programs.",
  WATCH:    "Early warning signals detected. Deploy community health workers and review local economic indicators closely.",
  ELEVATED: "Multiple stress signals active. Engage local authorities, pre-position aid resources, and initiate community outreach programs.",
  DANGER:   "Community under severe stress. Escalate to national government immediately, pre-allocate emergency aid budget, and deploy field teams.",
  CRITICAL: "Immediate humanitarian intervention required. Notify UN agencies and international NGO partners. Mobilise emergency response teams now.",
};

const TREND_CONFIG = {
  IMPROVING: { icon: "↑", color: "#3fb950", label: "Improving" },
  WORSENING: { icon: "↓", color: "#f85149", label: "Worsening" },
  STABLE:    { icon: "→", color: "#d29922", label: "Stable"    },
  UNKNOWN:   { icon: "~", color: "#8b949e", label: "Unknown"   },
};

// ── Navbar ─────────────────────────────────────────────────────────────────
function Navbar({ view, setView }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-dot" />
        <span className="brand-name">PHANTOM<span className="brand-accent"> RESILIENCE</span></span>
      </div>
      <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        <span /><span /><span />
      </button>
      <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
        {["dashboard", "alerts", "about"].map(v => (
          <button key={v} className={`nav-btn ${view === v ? "active" : ""}`}
            onClick={() => { setView(v); setMenuOpen(false); }}>
            {v.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="navbar-status">
        <span className="status-dot" />
        <span className="status-text">LIVE</span>
      </div>
    </nav>
  );
}

// ── Hero Banner ─────────────────────────────────────────────────────────────
function HeroBanner() {
  return (
    <div className="hero">
      <div className="hero-content">
        <div className="hero-badge">🌍 AI-Powered Early Warning System</div>
        <h1 className="hero-title">Detecting Community Collapse <span className="hero-accent">Before It Happens</span></h1>
        <p className="hero-desc">
          Phantom Resilience monitors 25 countries in real time using public data from the World Bank, NASA, and the UN.
          Our AI assigns every country a <strong>Fragility Score</strong> — identifying communities at risk of collapse
          <strong> 3 to 5 years</strong> before it becomes a global crisis.
        </p>
        <div className="hero-pills">
          <span className="pill">📊 Real World Bank Data</span>
          <span className="pill">🤖 Machine Learning AI</span>
          <span className="pill">🔄 Auto-updates Monthly</span>
          <span className="pill">🆓 100% Free & Open</span>
        </div>
      </div>
    </div>
  );
}

// ── Score Card ──────────────────────────────────────────────────────────────
function ScoreCard({ item, onClick }) {
  const cfg     = RISK_CONFIG[item.risk_level] || RISK_CONFIG.STABLE;
  const trendCfg = TREND_CONFIG[item.trend]    || TREND_CONFIG.UNKNOWN;
  const name    = COUNTRY_NAMES[item.country]  || item.country;
  const flag    = COUNTRY_FLAGS[item.country]  || "🏳";

  return (
    <div className="score-card" onClick={() => onClick(item)}
      style={{ borderColor: cfg.color, background: cfg.bg }}>
      <div className="card-header">
        <div className="card-country">
          <span className="card-flag">{flag}</span>
          <div>
            <div className="card-name">{name}</div>
            <div className="card-code">{item.country}</div>
          </div>
        </div>
        <span className="risk-badge" style={{ color: cfg.color, borderColor: cfg.color }}>
          {cfg.label}
        </span>
      </div>

      <div className="card-score-row">
        <span className="score-number" style={{ color: cfg.color }}>{item.score.toFixed(1)}</span>
        <span className="score-denom">/100</span>
        <span className="trend-chip" style={{ color: trendCfg.color }}>
          {trendCfg.icon} {trendCfg.label}
        </span>
      </div>

      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${item.score}%`, background: cfg.color }} />
      </div>

      {item.causes && item.causes.length > 0 && (
        <div className="card-causes">
          {item.causes.slice(0, 2).map((c, i) => (
            <div key={i} className="cause-chip">
              <span>{c.icon}</span>
              <span className="cause-label">{c.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Trend Chart ─────────────────────────────────────────────────────────────
function TrendChart({ country }) {
  const [trends, setTrends] = useState(null);
  useEffect(() => {
    axios.get(`${API}/api/countries/${country}/trends`)
      .then(r => setTrends(r.data.data))
      .catch(() => setTrends([]));
  }, [country]);

  if (!trends) return <div className="chart-loading">Loading trends...</div>;
  if (!trends.length) return <div className="chart-loading">No trend data available.</div>;

  const years        = trends.map(r => r.year);
  const unemployment = trends.map(r => r.unemployment_rate || 0);
  const enrollment   = trends.map(r => r.school_enrollment || 0);

  const opts = {
    responsive: true,
    plugins: {
      legend: { labels: { color: "#8b949e", font: { size: 11 } } }
    },
    scales: {
      x: { ticks: { color: "#8b949e", font: { size: 10 } }, grid: { color: "#21262d" } },
      y: { ticks: { color: "#8b949e", font: { size: 10 } }, grid: { color: "#21262d" } }
    }
  };

  const data = {
    labels: years,
    datasets: [
      { label: "Unemployment %", data: unemployment, borderColor: "#f85149", backgroundColor: "rgba(248,81,73,0.08)", fill: true, tension: 0.4 },
      { label: "School Enrollment %", data: enrollment, borderColor: "#58a6ff", backgroundColor: "rgba(88,166,255,0.08)", fill: true, tension: 0.4 },
    ]
  };

  return (
    <div className="trend-chart">
      <div className="chart-title">📈 HISTORICAL SIGNAL TRENDS</div>
      <Line data={data} options={opts} />
    </div>
  );
}

// ── Country Modal ───────────────────────────────────────────────────────────
function CountryModal({ item, onClose }) {
  if (!item) return null;
  const cfg      = RISK_CONFIG[item.risk_level] || RISK_CONFIG.STABLE;
  const trendCfg = TREND_CONFIG[item.trend]     || TREND_CONFIG.UNKNOWN;
  const name     = COUNTRY_NAMES[item.country]  || item.country;
  const flag     = COUNTRY_FLAGS[item.country]  || "🏳";
  const intervention = INTERVENTIONS[item.risk_level] || "";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header" style={{ borderBottomColor: cfg.color }}>
          <div className="modal-flag">{flag}</div>
          <div className="modal-title-block">
            <div className="modal-country-name">{name}</div>
            <div className="modal-country-code">{item.country} · Data Year: {item.year}</div>
          </div>
          <div className="modal-header-right">
            <div className="modal-score" style={{ color: cfg.color }}>{item.score.toFixed(1)}<span className="modal-score-denom">/100</span></div>
            <span className="modal-badge" style={{ color: cfg.color, borderColor: cfg.color }}>{cfg.label}</span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">

          {/* Quick Stats */}
          <div className="modal-stats-row">
            <div className="modal-stat">
              <div className="modal-stat-label">TREND</div>
              <div className="modal-stat-value" style={{ color: trendCfg.color }}>
                {trendCfg.icon} {trendCfg.label}
              </div>
            </div>
            {item.population && (
              <div className="modal-stat">
                <div className="modal-stat-label">POPULATION</div>
                <div className="modal-stat-value">{item.population}</div>
              </div>
            )}
            <div className="modal-stat">
              <div className="modal-stat-label">RISK LEVEL</div>
              <div className="modal-stat-value" style={{ color: cfg.color }}>{cfg.label}</div>
            </div>
            <div className="modal-stat">
              <div className="modal-stat-label">FRAGILITY</div>
              <div className="modal-stat-value" style={{ color: cfg.color }}>{item.score.toFixed(1)} / 100</div>
            </div>
          </div>

          {/* Causes */}
          {item.causes && item.causes.length > 0 && (
            <div className="modal-section">
              <div className="modal-section-title">🔍 ROOT CAUSES OF FRAGILITY</div>
              <div className="causes-list">
                {item.causes.map((c, i) => (
                  <div key={i} className="cause-row">
                    <span className="cause-icon">{c.icon}</span>
                    <div className="cause-info">
                      <div className="cause-name">{c.label}</div>
                      <div className="cause-bar-track">
                        <div className="cause-bar-fill" style={{ width: `${Math.min(parseFloat(c.value) || 50, 100)}%`, background: cfg.color }} />
                      </div>
                    </div>
                    <span className="cause-value" style={{ color: cfg.color }}>{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Intervention */}
          <div className="modal-section">
            <div className="modal-section-title">🛡️ RECOMMENDED ACTION</div>
            <div className="intervention-box" style={{ borderLeftColor: cfg.color }}>
              <p>{intervention}</p>
            </div>
          </div>

          {/* Chart */}
          <div className="modal-section">
            <TrendChart country={item.country} />
          </div>

          {/* Risk Scale */}
          <div className="modal-section">
            <div className="modal-section-title">📊 RISK SCALE</div>
            <div className="risk-scale">
              {Object.entries(RISK_CONFIG).map(([key, val]) => (
                <div key={key} className={`scale-item ${item.risk_level === key ? "active" : ""}`}
                  style={{ borderColor: item.risk_level === key ? val.color : "transparent", background: item.risk_level === key ? val.bg : "transparent" }}>
                  <div className="scale-dot" style={{ background: val.color }} />
                  <span style={{ color: item.risk_level === key ? val.color : "#8b949e" }}>{val.label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Dashboard View ──────────────────────────────────────────────────────────
function DashboardView() {
  const [scores,   setScores]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter,   setFilter]   = useState("ALL");

  useEffect(() => {
    axios.get(`${API}/api/scores/all`)
      .then(r => { setScores(r.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const levels  = ["ALL", "STABLE", "WATCH", "ELEVATED", "DANGER", "CRITICAL"];
  const counts  = {};
  levels.forEach(l => counts[l] = l === "ALL" ? scores.length : scores.filter(s => s.risk_level === l).length);
  const filtered = filter === "ALL" ? scores : scores.filter(s => s.risk_level === filter);

  return (
    <div className="view">
      <HeroBanner />

      {loading ? (
        <div className="loading-screen">
          <div className="loading-spinner" />
          <p>Scanning global data streams...</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="stat-row">
            {[
              { label: "Monitored", value: counts.ALL,      color: "var(--text)" },
              { label: "Stable",    value: counts.STABLE,   color: "#3fb950" },
              { label: "Watch",     value: counts.WATCH,    color: "#2dd4bf" },
              { label: "Elevated",  value: counts.ELEVATED, color: "#d29922" },
              { label: "Danger",    value: counts.DANGER,   color: "#f07030" },
              { label: "Critical",  value: counts.CRITICAL, color: "#f85149" },
            ].map(s => (
              <div key={s.label} className="stat-box" onClick={() => setFilter(s.label === "Monitored" ? "ALL" : s.label.toUpperCase())}
                style={{ borderColor: filter === (s.label === "Monitored" ? "ALL" : s.label.toUpperCase()) ? s.color : "var(--border)", cursor: "pointer" }}>
                <div className="stat-num" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label.toUpperCase()}</div>
              </div>
            ))}
          </div>

          {/* Filter pills */}
          <div className="filter-row">
            {levels.map(l => {
              const cfg = RISK_CONFIG[l];
              return (
                <button key={l} className={`filter-pill ${filter === l ? "active" : ""}`}
                  style={{ borderColor: filter === l ? (cfg?.color || "var(--accent)") : "var(--border)", color: filter === l ? (cfg?.color || "var(--accent)") : "var(--muted)" }}
                  onClick={() => setFilter(l)}>
                  {l === "ALL" ? "All Countries" : cfg.label} ({counts[l]})
                </button>
              );
            })}
          </div>

          {/* Cards */}
          <div className="cards-grid">
            {filtered
              .sort((a, b) => b.score - a.score)
              .map(item => (
                <ScoreCard key={item.country} item={item} onClick={setSelected} />
              ))}
          </div>
        </>
      )}

      <CountryModal item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

// ── Alerts View ─────────────────────────────────────────────────────────────
function AlertsView() {
  const [alerts,   setAlerts]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    axios.get(`${API}/api/alerts/all`)
      .then(r => { setAlerts(r.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="view">
      <div className="view-header">
        <h1 className="view-title">🚨 ALERT FEED</h1>
        <p className="view-sub">Countries requiring attention — sorted by urgency</p>
      </div>
      {loading ? (
        <div className="loading-screen"><div className="loading-spinner" /><p>Loading alerts...</p></div>
      ) : alerts.length === 0 ? (
        <div className="empty-state">✅ No alerts at this time. All regions are stable.</div>
      ) : (
        <div className="alert-list">
          {alerts.map((a, i) => {
            const cfg  = RISK_CONFIG[a.risk_level] || RISK_CONFIG.STABLE;
            const name = COUNTRY_NAMES[a.country]  || a.country;
            const flag = COUNTRY_FLAGS[a.country]  || "🏳";
            return (
              <div key={i} className="alert-row" style={{ borderLeftColor: cfg.color }}
                onClick={() => setSelected(a)}>
                <div className="alert-flag">{flag}</div>
                <div className="alert-left">
                  <span className="alert-name">{name}</span>
                  <div className="alert-causes">
                    {(a.causes || []).slice(0, 2).map((c, j) => (
                      <span key={j} className="cause-chip small">{c.icon} {c.label}</span>
                    ))}
                  </div>
                </div>
                <div className="alert-right">
                  <span className="alert-score" style={{ color: cfg.color }}>{a.score.toFixed(1)}</span>
                  <span className="alert-level" style={{ color: cfg.color, borderColor: cfg.color }}>{cfg.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <CountryModal item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

// ── About View ──────────────────────────────────────────────────────────────
function AboutView() {
  return (
    <div className="view">
      <div className="view-header">
        <h1 className="view-title">ABOUT PHANTOM RESILIENCE</h1>
        <p className="view-sub">Built to protect the communities the world forgets</p>
      </div>
      <div className="about-box">
        <div className="about-section">
          <div className="about-heading">🌍 WHAT IS THIS?</div>
          <p>Phantom Resilience is an AI early warning system that detects when communities around the world are quietly heading toward collapse — before it becomes a crisis. It uses machine learning trained on real public data to compute a Fragility Score for every monitored country.</p>
        </div>
        <div className="about-section">
          <div className="about-heading">❓ WHY DOES IT EXIST?</div>
          <p>The world only responds to disasters after they happen. But collapse never occurs overnight — there are always early signals. This system connects those signals automatically and alerts the right people years before it is too late.</p>
        </div>
        <div className="about-section">
          <div className="about-heading">📊 THE 5-LEVEL RISK SCALE</div>
          <div className="score-guide">
            {Object.entries(RISK_CONFIG).map(([key, val]) => (
              <div key={key} className="score-guide-row" style={{ borderLeftColor: val.color }}>
                <span style={{ color: val.color, fontWeight: 700, minWidth: 80 }}>{val.label}</span>
                <span className="guide-desc">
                  {key === "STABLE"   && "Community is healthy. Routine monitoring only."}
                  {key === "WATCH"    && "Early signals detected. Begin local assessment."}
                  {key === "ELEVATED" && "Multiple stress factors active. Engage authorities."}
                  {key === "DANGER"   && "Severe stress. Pre-allocate emergency resources."}
                  {key === "CRITICAL" && "Immediate humanitarian intervention required."}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="about-section">
          <div className="about-heading">🔬 DATA SOURCES</div>
          <div className="sources-grid">
            {["World Bank Open Data", "Google Trends", "OpenStreetMap", "NASA / MODIS", "FAO Food Data", "Meta Data for Good"].map(s => (
              <div key={s} className="source-tag">{s}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── App Root ────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("dashboard");
  return (
    <div className="app">
      <Navbar view={view} setView={setView} />
      <main className="main">
        {view === "dashboard" && <DashboardView />}
        {view === "alerts"    && <AlertsView />}
        {view === "about"     && <AboutView />}
      </main>
    </div>
  );
}