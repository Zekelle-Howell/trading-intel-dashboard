// Trading Intelligence Dashboard v5
// Tabs: Dashboard, Contracts, Portfolio, Alerts, Manage
// Built for Supabase backend + Railway scanner

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://nkufqvyvhmfazftcsgga.supabase.co";
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const WATCHED_STOCKS = ["RDW", "RKLB", "LUNR", "ASTS", "SPCE"];

const SCORE_COLOR = (score) => {
  if (score >= 80) return "#00ff88";
  if (score >= 60) return "#ffcc00";
  if (score >= 40) return "#ff8800";
  return "#ff4444";
};

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
};

const formatCurrency = (val) => {
  if (!val) return "—";
  const n = parseFloat(val);
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = {
  app: {
    minHeight: "100vh",
    background: "#0a0e17",
    color: "#e0e8f0",
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
  },
  header: {
    borderBottom: "1px solid #1e2d40",
    padding: "16px 24px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    background: "#0d1520",
  },
  logo: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#00ff88",
    letterSpacing: "0.05em",
  },
  logoSub: { fontSize: "11px", color: "#4a6680", marginTop: "2px" },
  nav: {
    display: "flex",
    gap: "4px",
    padding: "12px 24px",
    borderBottom: "1px solid #1e2d40",
    background: "#0d1520",
    overflowX: "auto",
  },
  navBtn: (active) => ({
    padding: "8px 18px",
    border: active ? "1px solid #00ff88" : "1px solid #1e2d40",
    borderRadius: "4px",
    background: active ? "rgba(0,255,136,0.08)" : "transparent",
    color: active ? "#00ff88" : "#4a6680",
    cursor: "pointer",
    fontSize: "12px",
    fontFamily: "inherit",
    letterSpacing: "0.08em",
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  }),
  page: { padding: "24px", maxWidth: "1200px", margin: "0 auto" },
  grid: (cols) => ({
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap: "16px",
    marginBottom: "24px",
  }),
  card: {
    background: "#0d1520",
    border: "1px solid #1e2d40",
    borderRadius: "6px",
    padding: "20px",
  },
  cardTitle: {
    fontSize: "11px",
    color: "#4a6680",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginBottom: "8px",
  },
  cardValue: { fontSize: "28px", fontWeight: "700", color: "#e0e8f0" },
  cardSub: { fontSize: "11px", color: "#4a6680", marginTop: "4px" },
  sectionTitle: {
    fontSize: "13px",
    color: "#00ff88",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: "16px",
    borderBottom: "1px solid #1e2d40",
    paddingBottom: "8px",
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "12px" },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    color: "#4a6680",
    fontSize: "11px",
    letterSpacing: "0.08em",
    borderBottom: "1px solid #1e2d40",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #111827",
    verticalAlign: "top",
  },
  badge: (color) => ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "3px",
    fontSize: "10px",
    fontWeight: "700",
    background: `${color}22`,
    color: color,
    border: `1px solid ${color}44`,
    letterSpacing: "0.06em",
  }),
  scoreBar: (score) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  }),
  input: {
    background: "#111827",
    border: "1px solid #1e2d40",
    borderRadius: "4px",
    color: "#e0e8f0",
    padding: "8px 12px",
    fontSize: "12px",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
  },
  btn: (variant = "primary") => ({
    padding: "10px 20px",
    borderRadius: "4px",
    border: variant === "primary" ? "1px solid #00ff88" : "1px solid #1e2d40",
    background: variant === "primary" ? "rgba(0,255,136,0.1)" : "transparent",
    color: variant === "primary" ? "#00ff88" : "#4a6680",
    cursor: "pointer",
    fontSize: "12px",
    fontFamily: "inherit",
    letterSpacing: "0.08em",
    transition: "all 0.15s",
  }),
  pill: {
    display: "inline-block",
    padding: "2px 8px",
    background: "#1e2d40",
    borderRadius: "3px",
    fontSize: "11px",
    color: "#8ab0cc",
    marginRight: "4px",
    marginBottom: "4px",
  },
  empty: {
    textAlign: "center",
    color: "#2a3d50",
    padding: "60px 20px",
    fontSize: "13px",
  },
  spinner: {
    textAlign: "center",
    color: "#00ff88",
    padding: "60px 20px",
    fontSize: "12px",
    letterSpacing: "0.1em",
  },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ title, value, sub, accent }) {
  return (
    <div style={{ ...styles.card, borderColor: accent ? `${accent}44` : "#1e2d40" }}>
      <div style={styles.cardTitle}>{title}</div>
      <div style={{ ...styles.cardValue, color: accent || "#e0e8f0" }}>{value}</div>
      {sub && <div style={styles.cardSub}>{sub}</div>}
    </div>
  );
}

// ─── Score Badge ──────────────────────────────────────────────────────────────

function ScoreBadge({ score }) {
  const color = SCORE_COLOR(score);
  return (
    <span style={styles.badge(color)}>
      {score ?? "—"}
    </span>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardTab({ contracts }) {
  const avgScore = contracts.length
    ? Math.round(contracts.reduce((a, c) => a + (c.score || 0), 0) / contracts.length)
    : 0;
  const highValue = contracts.filter((c) => (c.score || 0) >= 70);
  const today = contracts.filter((c) => {
    if (!c.created_at) return false;
    const d = new Date(c.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const stockMentions = {};
  WATCHED_STOCKS.forEach((s) => (stockMentions[s] = 0));
  contracts.forEach((c) => {
    const text = `${c.likely_winner || ""} ${c.competitors || ""}`.toUpperCase();
    WATCHED_STOCKS.forEach((s) => {
      if (text.includes(s)) stockMentions[s]++;
    });
  });

  const recentHigh = contracts
    .filter((c) => (c.score || 0) >= 70)
    .slice(0, 5);

  return (
    <div style={styles.page}>
      <div style={{ ...styles.grid(4) }}>
        <StatCard title="Total Contracts" value={contracts.length} sub="scanned from SAM.gov" />
        <StatCard title="Avg AI Score" value={`${avgScore}/100`} sub="opportunity rating" accent="#00ff88" />
        <StatCard title="High Value" value={highValue.length} sub="scored 70+" accent="#ffcc00" />
        <StatCard title="Today" value={today.length} sub="new contracts" />
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Watched Stocks — Contract Mentions</div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {WATCHED_STOCKS.map((s) => (
            <div key={s} style={{ textAlign: "center", minWidth: "80px" }}>
              <div style={{ fontSize: "20px", fontWeight: "700", color: stockMentions[s] > 0 ? "#00ff88" : "#2a3d50" }}>
                {stockMentions[s]}
              </div>
              <div style={{ fontSize: "11px", color: "#4a6680" }}>{s}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "16px", ...styles.card }}>
        <div style={styles.sectionTitle}>Top Opportunities</div>
        {recentHigh.length === 0 ? (
          <div style={styles.empty}>No high-score contracts yet</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {["Score", "Title", "Value", "Likely Winner", "Date"].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentHigh.map((c) => (
                <tr key={c.id} style={{ background: "rgba(0,255,136,0.02)" }}>
                  <td style={styles.td}><ScoreBadge score={c.score} /></td>
                  <td style={{ ...styles.td, maxWidth: "300px", color: "#c0d8e8" }}>
                    {c.title?.slice(0, 80)}{c.title?.length > 80 ? "…" : ""}
                  </td>
                  <td style={styles.td}>{formatCurrency(c.value)}</td>
                  <td style={styles.td}>
                    {c.likely_winner ? (
                      <span style={styles.badge("#00aaff")}>{c.likely_winner}</span>
                    ) : "—"}
                  </td>
                  <td style={{ ...styles.td, color: "#4a6680" }}>{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Contracts Tab ────────────────────────────────────────────────────────────

function ContractsTab({ contracts, loading }) {
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState(0);

  const filtered = contracts.filter((c) => {
    const matchSearch =
      !search ||
      (c.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.likely_winner || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.agency || "").toLowerCase().includes(search.toLowerCase());
    const matchScore = (c.score || 0) >= minScore;
    return matchSearch && matchScore;
  });

  return (
    <div style={styles.page}>
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <input
          style={{ ...styles.input, maxWidth: "320px" }}
          placeholder="Search title, winner, agency..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          style={{ ...styles.input, maxWidth: "160px" }}
          value={minScore}
          onChange={(e) => setMinScore(Number(e.target.value))}
        >
          <option value={0}>All Scores</option>
          <option value={50}>50+ Score</option>
          <option value={70}>70+ Score</option>
          <option value={80}>80+ Score</option>
        </select>
        <div style={{ color: "#4a6680", fontSize: "12px", alignSelf: "center" }}>
          {filtered.length} of {contracts.length} contracts
        </div>
      </div>

      <div style={styles.card}>
        {loading ? (
          <div style={styles.spinner}>LOADING CONTRACTS...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>No contracts match your filters</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {["Score", "Title", "Agency", "Value", "Likely Winner", "Competitors", "Date"].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} style={{ transition: "background 0.1s" }}>
                  <td style={styles.td}><ScoreBadge score={c.score} /></td>
                  <td style={{ ...styles.td, maxWidth: "260px" }}>
                    <div style={{ color: "#c0d8e8", marginBottom: "4px" }}>
                      {c.title?.slice(0, 70)}{c.title?.length > 70 ? "…" : ""}
                    </div>
                    {c.notice_id && (
                      <div style={{ fontSize: "10px", color: "#2a3d50" }}>{c.notice_id}</div>
                    )}
                  </td>
                  <td style={{ ...styles.td, color: "#8ab0cc", fontSize: "11px" }}>
                    {c.agency?.slice(0, 40)}
                  </td>
                  <td style={{ ...styles.td, color: "#ffcc00" }}>{formatCurrency(c.value)}</td>
                  <td style={styles.td}>
                    {c.likely_winner ? (
                      <span style={styles.badge("#00aaff")}>{c.likely_winner}</span>
                    ) : "—"}
                  </td>
                  <td style={{ ...styles.td, maxWidth: "180px" }}>
                    {c.competitors
                      ? c.competitors.split(",").map((t, i) => (
                          <span key={i} style={styles.pill}>{t.trim()}</span>
                        ))
                      : "—"}
                  </td>
                  <td style={{ ...styles.td, color: "#4a6680", fontSize: "11px" }}>
                    {formatDate(c.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Portfolio Tab ────────────────────────────────────────────────────────────

function PortfolioTab({ contracts }) {
  const stockData = WATCHED_STOCKS.map((symbol) => {
    const related = contracts.filter((c) => {
      const text = `${c.likely_winner || ""} ${c.competitors || ""}`.toUpperCase();
      return text.includes(symbol);
    });
    const avgScore = related.length
      ? Math.round(related.reduce((a, c) => a + (c.score || 0), 0) / related.length)
      : 0;
    const highConf = related.filter((c) => (c.score || 0) >= 70);
    return { symbol, related, avgScore, highConf };
  });

  return (
    <div style={styles.page}>
      <div style={{ ...styles.grid(1), gridTemplateColumns: "1fr" }}>
        {stockData.map(({ symbol, related, avgScore, highConf }) => (
          <div key={symbol} style={styles.card}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
              <div style={{ fontSize: "22px", fontWeight: "700", color: "#00ff88", minWidth: "60px" }}>
                {symbol}
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#4a6680" }}>
                  {related.length} contract{related.length !== 1 ? "s" : ""} found
                  {" · "}
                  {highConf.length} high-confidence
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
                  <span style={styles.badge(SCORE_COLOR(avgScore))}>Avg Score: {avgScore}</span>
                  {highConf.length > 0 && (
                    <span style={styles.badge("#00ff88")}>🔥 {highConf.length} HOT</span>
                  )}
                </div>
              </div>
            </div>

            {related.length === 0 ? (
              <div style={{ color: "#2a3d50", fontSize: "12px" }}>
                No contracts mention {symbol} yet. Scanner is watching.
              </div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    {["Score", "Title", "Value", "Role", "Date"].map((h) => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {related.slice(0, 5).map((c) => {
                    const isWinner = (c.likely_winner || "").toUpperCase().includes(symbol);
                    return (
                      <tr key={c.id}>
                        <td style={styles.td}><ScoreBadge score={c.score} /></td>
                        <td style={{ ...styles.td, maxWidth: "300px", color: "#c0d8e8" }}>
                          {c.title?.slice(0, 70)}{c.title?.length > 70 ? "…" : ""}
                        </td>
                        <td style={{ ...styles.td, color: "#ffcc00" }}>{formatCurrency(c.value)}</td>
                        <td style={styles.td}>
                          <span style={styles.badge(isWinner ? "#00ff88" : "#ff8800")}>
                            {isWinner ? "LIKELY WINNER" : "COMPETITOR"}
                          </span>
                        </td>
                        <td style={{ ...styles.td, color: "#4a6680", fontSize: "11px" }}>
                          {formatDate(c.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Alerts Tab ───────────────────────────────────────────────────────────────

function AlertsTab({ contracts }) {
  const alerts = contracts
    .filter((c) => (c.score || 0) >= 70)
    .slice(0, 20)
    .map((c) => ({
      ...c,
      alertType: (c.score || 0) >= 85 ? "CRITICAL" : "HIGH",
    }));

  return (
    <div style={styles.page}>
      <div style={{ ...styles.card, marginBottom: "16px" }}>
        <div style={styles.sectionTitle}>Alert Rules</div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <span style={styles.badge("#00ff88")}>Score ≥ 70 → Email Alert</span>
          <span style={styles.badge("#ffcc00")}>Watched Stock Mention → Highlighted</span>
          <span style={styles.badge("#ff4444")}>Score ≥ 85 → CRITICAL</span>
        </div>
        <div style={{ marginTop: "12px", fontSize: "11px", color: "#4a6680" }}>
          Gmail alerts are sent automatically by the Railway scanner. Showing last 20 alert-worthy contracts.
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Recent Alerts ({alerts.length})</div>
        {alerts.length === 0 ? (
          <div style={styles.empty}>No alert-level contracts yet (score ≥ 70)</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {["Level", "Score", "Title", "Likely Winner", "Value", "Triggered"].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alerts.map((c) => (
                <tr key={c.id}>
                  <td style={styles.td}>
                    <span style={styles.badge(c.alertType === "CRITICAL" ? "#ff4444" : "#ffcc00")}>
                      {c.alertType}
                    </span>
                  </td>
                  <td style={styles.td}><ScoreBadge score={c.score} /></td>
                  <td style={{ ...styles.td, maxWidth: "280px", color: "#c0d8e8" }}>
                    {c.title?.slice(0, 70)}{c.title?.length > 70 ? "…" : ""}
                  </td>
                  <td style={styles.td}>
                    {c.likely_winner ? (
                      <span style={styles.badge("#00aaff")}>{c.likely_winner}</span>
                    ) : "—"}
                  </td>
                  <td style={{ ...styles.td, color: "#ffcc00" }}>{formatCurrency(c.value)}</td>
                  <td style={{ ...styles.td, color: "#4a6680", fontSize: "11px" }}>
                    {formatDate(c.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Manage Tab ───────────────────────────────────────────────────────────────

function ManageTab({ contracts, onRefresh }) {
  const [status, setStatus] = useState(null);

  const testSupabase = async () => {
    setStatus("Testing Supabase connection...");
    try {
      const { count, error } = await supabase
        .from("contracts")
        .select("*", { count: "exact", head: true });
      if (error) setStatus(`❌ Supabase error: ${error.message}`);
      else setStatus(`✅ Supabase connected — ${count} contracts in DB`);
    } catch (e) {
      setStatus(`❌ Connection failed: ${e.message}`);
    }
  };

  return (
    <div style={styles.page}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div style={styles.card}>
          <div style={styles.sectionTitle}>System Status</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { label: "Scanner", value: "Railway — disciplined-friendship", color: "#00ff88" },
              { label: "Database", value: "Supabase — nkufqvyvhmfazftcsgga", color: "#00ff88" },
              { label: "Alerts", value: "Gmail — active", color: "#00ff88" },
              { label: "Scan Interval", value: "Every 90 min (7am–7pm CST)", color: "#ffcc00" },
              { label: "Total Scanned", value: `${contracts.length} contracts`, color: "#e0e8f0" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "#4a6680" }}>{label}</span>
                <span style={{ color }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.sectionTitle}>Actions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button style={styles.btn("primary")} onClick={onRefresh}>
              ↻ Refresh Contracts
            </button>
            <button style={styles.btn("primary")} onClick={testSupabase}>
              ⚡ Test Supabase Connection
            </button>
            {status && (
              <div style={{
                marginTop: "8px", padding: "10px", background: "#111827",
                borderRadius: "4px", fontSize: "12px",
                color: status.includes("✅") ? "#00ff88" : "#ff4444",
              }}>
                {status}
              </div>
            )}
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.sectionTitle}>Watched Stocks</div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {WATCHED_STOCKS.map((s) => (
              <span key={s} style={{ ...styles.badge("#00aaff"), fontSize: "13px", padding: "4px 12px" }}>
                {s}
              </span>
            ))}
          </div>
          <div style={{ marginTop: "12px", fontSize: "11px", color: "#2a3d50" }}>
            Edit WATCHED_STOCKS in App.js to add/remove tickers.
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.sectionTitle}>Score Legend</div>
          {[
            { range: "80–100", label: "Strong Buy Signal", color: "#00ff88" },
            { range: "60–79", label: "Watch Closely", color: "#ffcc00" },
            { range: "40–59", label: "Low Priority", color: "#ff8800" },
            { range: "0–39", label: "Skip", color: "#ff4444" },
          ].map(({ range, label, color }) => (
            <div key={range} style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ ...styles.badge(color), minWidth: "60px", textAlign: "center" }}>{range}</span>
              <span style={{ fontSize: "12px", color: "#8ab0cc" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────

const TABS = ["Dashboard", "Contracts", "Portfolio", "Alerts", "Manage"];

export default function App() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (!error && data) {
        setContracts(data);
        setLastFetch(new Date());
      }
    } catch (e) {
      console.error("Supabase fetch error:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const renderTab = () => {
    switch (activeTab) {
      case "Dashboard": return <DashboardTab contracts={contracts} />;
      case "Contracts": return <ContractsTab contracts={contracts} loading={loading} />;
      case "Portfolio": return <PortfolioTab contracts={contracts} />;
      case "Alerts": return <AlertsTab contracts={contracts} />;
      case "Manage": return <ManageTab contracts={contracts} onRefresh={fetchContracts} />;
      default: return null;
    }
  };

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <div>
          <div style={styles.logo}>⬡ TRADING INTEL</div>
          <div style={styles.logoSub}>SAM.gov Intelligence Platform</div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: "11px", color: "#2a3d50" }}>
          {loading ? "SYNCING..." : lastFetch ? `Updated ${lastFetch.toLocaleTimeString()}` : ""}
        </div>
      </div>

      <div style={styles.nav}>
        {TABS.map((tab) => (
          <button
            key={tab}
            style={styles.navBtn(activeTab === tab)}
            onClick={() => setActiveTab(tab)}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {renderTab()}
    </div>
  );
}
