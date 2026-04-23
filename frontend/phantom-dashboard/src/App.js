import { useState, useEffect } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Legend, Filler
} from "chart.js";
import "./App.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const API = "http://127.0.0.1:8000";

function getRiskColor(level) {
  if (level === "SAFE")     return "var(--safe)";
  if (level === "WATCH")    return "var(--watch)";
  if (level === "DANGER")   return "var(--danger)";
  if (level === "CRITICAL") return "var(--critical)";
  return "var(--muted)";
}

function getRiskBg(level) {
  if (level === "SAFE")     return "rgba(63,185,80,0.08)";
  if (level === "WATCH")    return "rgba(210,153,34,0.08)";
  if (level === "DANGER")   return "rgba(248,81,73,0.08)";
  if (level === "CRITICAL") return "rgba(255,68,68,0.1)";
  return "transparent";
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar({ view, setView }) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-dot" />
        PHANTOM<span className="brand-accent">RESILIENCE</span>
      </div>
      <div className="navbar-links">
        {["dashboard", "alerts", "about"].map(v => (
          <button
            key={v}
            className={`nav-btn ${view === v ? "active" : ""}`}
            onClick={() => setView(v)}
          >
            {v.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="navbar-status">
        <span className="status-dot" />
        SYSTEM ONLINE
      </div>
    </nav>
  );
}

// ── Score Card ────────────────────────────────────────────────────────────────
function ScoreCard({ item, onClick }) {
  const color = getRiskColor(item.risk_level);
  const bg    = getRiskBg(item.risk_level);
  return (
    <div className="score-card" onClick={() => onClick(item)} style={{ borderColor: color, background: bg }}>
      <div className="score-card-top">
        <span className="country-code">{item.country}</span>
        <span className="risk-badge" style={{ color, borderColor: color }}>{item.risk_level}</span>
      </div>
      <div className="score-number" style={{ color }}>{item.score.toFixed(1)}</div>
      <div className="score-label">FRAGILITY INDEX</div>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${item.score}%`, background: color }} />
      </div>
    </div>
  );
}

// ── Trend Chart ───────────────────────────────────────────────────────────────
function TrendChart({ country }) {
  const [trends, setTrends] = useState(null);

  useEffect(() => {
    axios.get(`${API}/api/countries/${country}/trends`)
      .then(r => setTrends(r.data.data))
      .catch(() => setTrends([]));
  }, [country]);

  if (!trends) return <div className="chart-loading">Loading trends...</div>;
  if (trends.length === 0) return <div className="chart-loading">No trend data.</div>;

  const years = trends.map(r => r.year);
  const unemployment = trends.map(r => r.unemployment_rate || 0);
  const enrollment   = trends.map(r => r.school_enrollment || 0);

  const opts = {
    responsive: true,
    plugins: { legend: { labels: { color: "#8b949e", font: { family: "Share Tech Mono" } } } },
    scales: {
      x: { ticks: { color: "#8b949e" }, grid: { color: "#21262d" } },
      y: { ticks: { color: "#8b949e" }, grid: { color: "#21262d" } }
    }
  };

  const data = {
    labels: years,
    datasets: [
      {
        label: "Unemployment %",
        data: unemployment,
        borderColor: "#f85149",
        backgroundColor: "rgba(248,81,73,0.1)",
        fill: true, tension: 0.4
      },
      {
        label: "School Enrollment %",
        data: enrollment,
        borderColor: "#58a6ff",
        backgroundColor: "rgba(88,166,255,0.1)",
        fill: true, tension: 0.4
      }
    ]
  };

  return (
    <div className="trend-chart">
      <div className="chart-title">SIGNAL TRENDS — {country}</div>
      <Line data={data} options={opts} />
    </div>
  );
}

// ── Country Detail Modal ──────────────────────────────────────────────────────
function CountryModal({ item, onClose }) {
  if (!item) return null;
  const color = getRiskColor(item.risk_level);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ borderColor: color }}>
          <div>
            <div className="modal-country">{item.country}</div>
            <div className="modal-score" style={{ color }}>
              {item.score.toFixed(1)} / 100
            </div>
          </div>
          <span className="modal-badge" style={{ color, borderColor: color }}>
            {item.risk_level}
          </span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-message">{item.message}</div>
          <TrendChart country={item.country} />
          <div className="intervention-box">
            <div className="intervention-title">RECOMMENDED INTERVENTIONS</div>
            {item.score < 30 && <p>✔ Community is stable. Continue monitoring quarterly.</p>}
            {item.score >= 30 && item.score < 60 && (
              <>
                <p>⚠ Deploy community field workers to assess local needs.</p>
                <p>⚠ Review school attendance records with local authorities.</p>
              </>
            )}
            {item.score >= 60 && item.score < 80 && (
              <>
                <p>🔴 Escalate to national government — pre-allocate aid budget.</p>
                <p>🔴 Deploy emergency agricultural support programs.</p>
                <p>🔴 Set up early warning communication with local leaders.</p>
              </>
            )}
            {item.score >= 80 && (
              <>
                <p>🚨 CRITICAL — Immediate humanitarian intervention required.</p>
                <p>🚨 Notify UN and international NGO partners immediately.</p>
                <p>🚨 Mobilise emergency response teams to the region.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard View ────────────────────────────────────────────────────────────
function DashboardView() {
  const [scores, setScores]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    axios.get(`${API}/api/scores/all`)
      .then(r => { setScores(r.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const safe     = scores.filter(s => s.risk_level === "SAFE").length;
  const watch    = scores.filter(s => s.risk_level === "WATCH").length;
  const danger   = scores.filter(s => s.risk_level === "DANGER" || s.risk_level === "CRITICAL").length;

  return (
    <div className="view">
      <div className="view-header">
        <h1 className="view-title">GLOBAL FRAGILITY MONITOR</h1>
        <p className="view-sub">Real-time community resilience intelligence</p>
      </div>

      {loading ? (
        <div className="loading-screen">
          <div className="loading-spinner" />
          <p>Scanning global data streams...</p>
        </div>
      ) : (
        <>
          <div className="stat-row">
            <div className="stat-box">
              <div className="stat-num" style={{ color: "var(--text)" }}>{scores.length}</div>
              <div className="stat-label">COUNTRIES MONITORED</div>
            </div>
            <div className="stat-box">
              <div className="stat-num" style={{ color: "var(--safe)" }}>{safe}</div>
              <div className="stat-label">STABLE</div>
            </div>
            <div className="stat-box">
              <div className="stat-num" style={{ color: "var(--watch)" }}>{watch}</div>
              <div className="stat-label">WATCH</div>
            </div>
            <div className="stat-box">
              <div className="stat-num" style={{ color: "var(--danger)" }}>{danger}</div>
              <div className="stat-label">DANGER / CRITICAL</div>
            </div>
          </div>

          <div className="cards-grid">
            {scores
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

// ── Alerts View ───────────────────────────────────────────────────────────────
function AlertsView() {
  const [alerts, setAlerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    axios.get(`${API}/api/alerts/all`)
      .then(r => { setAlerts(r.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="view">
      <div className="view-header">
        <h1 className="view-title">ALERT FEED</h1>
        <p className="view-sub">Communities requiring immediate attention</p>
      </div>

      {loading ? (
        <div className="loading-screen">
          <div className="loading-spinner" />
          <p>Loading alerts...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="empty-state">No alerts at this time. All monitored regions are stable.</div>
      ) : (
        <div className="alert-list">
          {alerts.map((a, i) => {
            const color = getRiskColor(a.risk_level);
            return (
              <div
                key={i}
                className="alert-row"
                style={{ borderLeftColor: color }}
                onClick={() => setSelected(a)}
              >
                <div className="alert-left">
                  <span className="alert-code">{a.country}</span>
                  <span className="alert-msg">{a.message}</span>
                </div>
                <div className="alert-right">
                  <span className="alert-score" style={{ color }}>{a.score.toFixed(1)}</span>
                  <span className="alert-level" style={{ color, borderColor: color }}>{a.risk_level}</span>
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

// ── About View ────────────────────────────────────────────────────────────────
function AboutView() {
  return (
    <div className="view">
      <div className="view-header">
        <h1 className="view-title">ABOUT THIS SYSTEM</h1>
        <p className="view-sub">Built to protect the communities no one talks about</p>
      </div>
      <div className="about-box">
        <div className="about-section">
          <div className="about-heading">WHAT IS PHANTOM RESILIENCE?</div>
          <p>An AI-powered early warning system that detects when communities are quietly collapsing — 3 to 5 years before it becomes a crisis. Using public data from the World Bank, NASA, FAO and more, the system builds a Fragility Index score for every monitored region.</p>
        </div>
        <div className="about-section">
          <div className="about-heading">HOW THE SCORE WORKS</div>
          <div className="score-guide">
            {[
              { label: "SAFE",     range: "0 – 30",  color: "var(--safe)",   desc: "Community is stable. Quarterly monitoring." },
              { label: "WATCH",    range: "30 – 60", color: "var(--watch)",  desc: "Early warning signals detected. Deploy field workers." },
              { label: "DANGER",   range: "60 – 80", color: "var(--danger)", desc: "Multiple systems under stress. Pre-allocate aid." },
              { label: "CRITICAL", range: "80 – 100",color: "var(--critical)","desc": "Immediate intervention required." },
            ].map(s => (
              <div key={s.label} className="score-guide-row" style={{ borderLeftColor: s.color }}>
                <span style={{ color: s.color, fontWeight: 700 }}>{s.label}</span>
                <span className="guide-range">{s.range}</span>
                <span className="guide-desc">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="about-section">
          <div className="about-heading">DATA SOURCES</div>
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

// ── App Root ──────────────────────────────────────────────────────────────────
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