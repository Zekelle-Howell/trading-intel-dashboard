import { useState, useEffect } from "react";

const SUPABASE_URL = "https://nkufqvyvhmfazftcsgga.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rdWZxdnl2aG1mYXpmdGNzZ2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMjEyMDQsImV4cCI6MjA5NTU5NzIwNH0.OG7aFls-h4rDnaB3rOX-kuMX8yPUB5JN8WLEnZuK-jY";

const DEFAULT_STOCKS = [
  { ticker: "RDW",  name: "Redwire",           color: "#6366f1" },
  { ticker: "RKLB", name: "Rocket Lab",         color: "#0ea5e9" },
  { ticker: "LUNR", name: "Intuitive Machines", color: "#f59e0b" },
  { ticker: "ASTS", name: "AST SpaceMobile",    color: "#10b981" },
  { ticker: "SPCE", name: "Virgin Galactic",    color: "#ec4899" },
];

const COLORS = ["#6366f1","#0ea5e9","#f59e0b","#10b981","#ec4899","#ef4444","#8b5cf6","#14b8a6","#f97316","#06b6d4"];
const SECTORS = ["Space","Defense","Oil & Gas","Nuclear","Infrastructure","AI & Tech","Healthcare","Mining"];
const TABS = ["Dashboard","Contracts","Portfolio","Alerts","Manage"];

const supabase = {
  get: (table, query = "") => fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }).then(r => r.json()),
  post: (table, data) => fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: "POST", headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(data) }),
  delete: (table, match) => fetch(`${SUPABASE_URL}/rest/v1/${table}?${match}`, { method: "DELETE", headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }),
};

const SECTOR_KEYWORDS = {
  "Space":          ["space","satellite","spacecraft","aerospace","lunar","orbital","launch"],
  "Defense":        ["drone","unmanned","uav","uas","hypersonic","missile","defense","weapons"],
  "Oil & Gas":      ["oil","gas","petroleum","pipeline","refinery","drilling","lng","offshore"],
  "Nuclear":        ["nuclear","uranium","reactor","smr"],
  "Infrastructure": ["infrastructure","bridge","highway","water","port","airport","broadband"],
  "AI & Tech":      ["artificial intelligence","machine learning","cybersecurity","cloud","quantum","robotics"],
  "Healthcare":     ["pharmaceutical","medical","vaccine","biotech","genomics"],
  "Mining":         ["mining","rare earth","lithium","copper","semiconductor","critical minerals"],
};

const scoreColor = s => s >= 8 ? "#ef4444" : s >= 6 ? "#f59e0b" : "#10b981";
const impactColor = i => !i ? "#888" : i.includes("STRONG POSITIVE") ? "#10b981" : i.includes("POSITIVE") ? "#34d399" : i.includes("NEGATIVE") ? "#ef4444" : "#888";
const daysLeft = d => { if (!d) return null; return Math.ceil((new Date(d) - new Date()) / 86400000); };
const daysColor = d => d === null ? "#888" : d <= 3 ? "#ef4444" : d <= 7 ? "#f59e0b" : "#10b981";
const isExpired = c => { const d = daysLeft(c.deadline); return d !== null && d < 0; };
const isActive = c => !isExpired(c) && (c.score || 0) >= 6;

const contractMatchesSector = (contract, sector) => {
  const text = ((contract.title || "") + " " + (contract.sectors || "") + " " + (contract.agency || "")).toLowerCase();
  return SECTOR_KEYWORDS[sector]?.some(k => text.includes(k));
};

function Badge({ text, color }) {
  return <span style={{ fontSize: 10, fontWeight: 700, color, background: color + "18", padding: "2px 7px", borderRadius: 6 }}>{text}</span>;
}

function TabBar({ tabs, active, onSelect }) {
  return (
    <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 2 }}>
      {tabs.map(t => (
        <button key={t} onClick={() => onSelect(t)} style={{ padding: "5px 11px", borderRadius: 20, border: "0.5px solid", fontSize: 11, cursor: "pointer", whiteSpace: "nowrap", background: active === t ? "#6366f1" : "#fff", color: active === t ? "#fff" : "#555", borderColor: active === t ? "#6366f1" : "#e5e7eb", fontWeight: active === t ? 600 : 400 }}>{t}</button>
      ))}
    </div>
  );
}

function ContractCard({ contract, stocks }) {
  const [expanded, setExpanded] = useState(false);
  const days = daysLeft(contract.deadline);

  const matchedStocks = stocks.filter(s =>
    (contract.title || "").toLowerCase().includes(s.name.toLowerCase()) ||
    (contract.tickers || "").includes(s.ticker) ||
    (contract.public_tickers || "").includes(s.ticker)
  );

  const publicTickers = (contract.public_tickers || "")
    .split(",")
    .map(t => t.trim())
    .filter(t => t && t.length > 0 && t.length <= 5);

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #e5e7eb", marginBottom: 10, overflow: "hidden" }}>
      <div style={{ padding: "0.75rem 1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {matchedStocks.map(s => (
              <Badge key={s.ticker} text={`⭐ ${s.ticker}`} color={s.color} />
            ))}
            {publicTickers.filter(t => !matchedStocks.find(s => s.ticker === t)).map(t => (
              <Badge key={t} text={t} color="#64748b" />
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor(contract.score) }}>{contract.score}/10</span>
            {days !== null && <span style={{ fontSize: 11, color: daysColor(days) }}>{days}d</span>}
          </div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 3, lineHeight: 1.4 }}>{contract.title}</div>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>{contract.agency}</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: impactColor(contract.stock_impact), marginBottom: 5 }}>{contract.stock_impact}</div>
        <div style={{ fontSize: 12, color: "#555", lineHeight: 1.5, marginBottom: 8 }}>{contract.headline}</div>
        <button onClick={() => setExpanded(!expanded)} style={{ fontSize: 12, color: "#6366f1", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          {expanded ? "hide intel ▲" : "view intel ▼"}
        </button>
      </div>
      {expanded && (
        <div style={{ borderTop: "0.5px solid #f3f4f6", padding: "0.75rem 1rem", background: "#fafafa" }}>
          {contract.why_it_matters && <div style={{ fontSize: 12, color: "#444", marginBottom: 8, lineHeight: 1.5 }}><strong>Why it matters:</strong> {contract.why_it_matters}</div>}
          {contract.likely_winner && <div style={{ fontSize: 12, color: "#444", marginBottom: 8, lineHeight: 1.5 }}><strong>Likely winner:</strong> {contract.likely_winner}</div>}
          {contract.competitors && <div style={{ fontSize: 12, color: "#444", marginBottom: 8 }}><strong>Competitors:</strong> {contract.competitors}</div>}
          {publicTickers.length > 0 && (
            <div style={{ fontSize: 12, color: "#444", marginBottom: 8 }}>
              <strong>Watch on Unusual Whales:</strong>{" "}
              {publicTickers.map((t, i) => (
                <span key={i} style={{ background: "#f1f5f9", padding: "1px 6px", borderRadius: 4, marginRight: 4, fontWeight: 600, color: "#0ea5e9" }}>{t}</span>
              ))}
            </div>
          )}
          {contract.contract_value && contract.contract_value !== "Unknown" && <div style={{ fontSize: 12, color: "#444", marginBottom: 8 }}><strong>Value:</strong> {contract.contract_value}</div>}
          {contract.sam_url && <a href={contract.sam_url} style={{ fontSize: 12, color: "#6366f1" }} target="_blank" rel="noreferrer">View on SAM.gov →</a>}
        </div>
      )}
    </div>
  );
}

function Contracts({ contracts, stocks, loading }) {
  const [sectorFilter, setSectorFilter] = useState("All");
  const [sortBy, setSortBy] = useState("score");
  const [minScore, setMinScore] = useState(6);
  const [impactFilter, setImpactFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [hideExpired, setHideExpired] = useState(true);

  let filtered = contracts;
  if (hideExpired) filtered = filtered.filter(c => !isExpired(c));
  if (search) filtered = filtered.filter(c => (c.title || "").toLowerCase().includes(search.toLowerCase()) || (c.agency || "").toLowerCase().includes(search.toLowerCase()));
  if (sectorFilter !== "All") filtered = filtered.filter(c => contractMatchesSector(c, sectorFilter));
  if (minScore > 0) filtered = filtered.filter(c => (c.score || 0) >= minScore);
  if (impactFilter !== "All") filtered = filtered.filter(c => c.stock_impact?.includes(impactFilter));
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "score") return b.score - a.score;
    if (sortBy === "deadline") return new Date(a.deadline || 0) - new Date(b.deadline || 0);
    if (sortBy === "newest") return new Date(b.created_at) - new Date(a.created_at);
    return 0;
  });

  const expiredCount = contracts.filter(c => isExpired(c)).length;
  const hasActiveFilters = sectorFilter !== "All" || minScore !== 6 || impactFilter !== "All" || sortBy !== "score";

  return (
    <div style={{ padding: "1rem" }}>
      <input
        placeholder="Search title or agency..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: "0.5px solid #e5e7eb", fontSize: 12, marginBottom: 10, boxSizing: "border-box" }}
      />
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button onClick={() => setShowFilters(!showFilters)} style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: "0.5px solid #e5e7eb", background: showFilters ? "#f3f4f6" : "#fff", fontSize: 12, color: "#555", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between" }}>
          <span>{showFilters ? "▲" : "▼"} filters & sort</span>
          {hasActiveFilters && <span style={{ color: "#6366f1", fontWeight: 600 }}>active</span>}
        </button>
        <button onClick={() => setHideExpired(!hideExpired)} style={{ padding: "8px 12px", borderRadius: 10, border: "0.5px solid #e5e7eb", background: hideExpired ? "#111" : "#fff", color: hideExpired ? "#fff" : "#555", fontSize: 11, cursor: "pointer", whiteSpace: "nowrap" }}>
          {hideExpired ? `✓ Active only` : `Show expired (${expiredCount})`}
        </button>
      </div>
      {showFilters && (
        <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #e5e7eb", padding: "0.75rem 1rem", marginBottom: 12 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>sort by</div>
            <div style={{ display: "flex", gap: 6 }}>
              {[["score","Score"],["deadline","Deadline"],["newest","Newest"]].map(([val, label]) => (
                <button key={val} onClick={() => setSortBy(val)} style={{ padding: "4px 10px", borderRadius: 8, border: "0.5px solid", fontSize: 11, cursor: "pointer", background: sortBy === val ? "#6366f1" : "#fff", color: sortBy === val ? "#fff" : "#555", borderColor: sortBy === val ? "#6366f1" : "#e5e7eb" }}>{label}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>sector</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {["All", ...SECTORS].map(s => (
                <button key={s} onClick={() => setSectorFilter(s)} style={{ padding: "4px 8px", borderRadius: 8, border: "0.5px solid", fontSize: 10, cursor: "pointer", background: sectorFilter === s ? "#0ea5e9" : "#fff", color: sectorFilter === s ? "#fff" : "#555", borderColor: sectorFilter === s ? "#0ea5e9" : "#e5e7eb" }}>{s}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>min score: <strong>{minScore}+</strong></div>
            <input type="range" min="0" max="9" step="1" value={minScore} onChange={e => setMinScore(+e.target.value)} style={{ width: "100%" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#aaa" }}><span>All</span><span>9+</span></div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>impact</div>
            <div style={{ display: "flex", gap: 6 }}>
              {[["All","All"],["POSITIVE","Positive"],["NEGATIVE","Negative"]].map(([val, label]) => (
                <button key={val} onClick={() => setImpactFilter(val)} style={{ padding: "4px 10px", borderRadius: 8, border: "0.5px solid", fontSize: 11, cursor: "pointer", background: impactFilter === val ? "#10b981" : "#fff", color: impactFilter === val ? "#fff" : "#555", borderColor: impactFilter === val ? "#10b981" : "#e5e7eb" }}>{label}</button>
              ))}
            </div>
          </div>
        </div>
      )}
      <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>{filtered.length} contract{filtered.length !== 1 ? "s" : ""}</div>
      {loading && <div style={{ fontSize: 13, color: "#888", textAlign: "center", padding: "2rem" }}>Loading...</div>}
      {!loading && filtered.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #e5e7eb", padding: "2rem", textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "#888" }}>No contracts match your filters.</div>
        </div>
      )}
      {filtered.map((c, i) => <ContractCard key={i} contract={c} stocks={stocks} />)}
    </div>
  );
}

function Portfolio() {
  const [positions, setPositions] = useState([
    { ticker: "JNJ",  shares: 15,  entry: 220.00, current: 265.77 },
    { ticker: "KO",   shares: 40,  entry: 75.00,  current: 86.85  },
    { ticker: "PG",   shares: 20,  entry: 140.00, current: 155.20 },
  ]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ ticker: "", shares: "", entry: "", current: "" });
  const totalValue = positions.reduce((s, p) => s + p.shares * p.current, 0);
  const totalCost  = positions.reduce((s, p) => s + p.shares * p.entry, 0);
  const totalPnL   = totalValue - totalCost;
  const totalPct   = ((totalPnL / totalCost) * 100).toFixed(1);
  const addPosition = () => {
    if (!form.ticker || !form.shares || !form.entry || !form.current) return;
    setPositions([...positions, { ticker: form.ticker.toUpperCase(), shares: +form.shares, entry: +form.entry, current: +form.current }]);
    setForm({ ticker: "", shares: "", entry: "", current: "" });
    setAdding(false);
  };
  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: "1rem" }}>
        <div style={{ background: "#f8f9fa", borderRadius: 12, padding: "0.75rem 1rem", border: "0.5px solid #e5e7eb" }}>
          <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>total value</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div style={{ background: "#f8f9fa", borderRadius: 12, padding: "0.75rem 1rem", border: "0.5px solid #e5e7eb" }}>
          <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>total p&l</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: totalPnL >= 0 ? "#10b981" : "#ef4444" }}>{totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(2)} ({totalPct}%)</div>
        </div>
      </div>
      {positions.map((p, i) => {
        const pnl = (p.current - p.entry) * p.shares;
        const pct = (((p.current - p.entry) / p.entry) * 100).toFixed(1);
        return (
          <div key={i} style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #e5e7eb", padding: "0.75rem 1rem", marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{p.ticker}</span>
                <span style={{ fontSize: 11, color: "#888" }}>{p.shares} shares</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, fontSize: 12 }}>
              <div><div style={{ color: "#888", fontSize: 10 }}>entry</div><div style={{ fontWeight: 500 }}>${p.entry.toFixed(2)}</div></div>
              <div><div style={{ color: "#888", fontSize: 10 }}>current</div><div style={{ fontWeight: 500 }}>${p.current.toFixed(2)}</div></div>
              <div><div style={{ color: "#888", fontSize: 10 }}>p&l</div><div style={{ fontWeight: 600, color: pnl >= 0 ? "#10b981" : "#ef4444" }}>{pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} ({pct}%)</div></div>
            </div>
          </div>
        );
      })}
      {adding ? (
        <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #6366f1", padding: "1rem", marginBottom: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            {[["ticker","JNJ"],["shares","15"],["entry $","220.00"],["current $","265.77"]].map(([label, ph], idx) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: "#888", marginBottom: 2 }}>{label}</div>
                <input placeholder={ph} value={form[["ticker","shares","entry","current"][idx]]} onChange={e => setForm({ ...form, [["ticker","shares","entry","current"][idx]]: e.target.value })} style={{ width: "100%", padding: "6px 8px", borderRadius: 8, border: "0.5px solid #e5e7eb", fontSize: 13, boxSizing: "border-box" }} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addPosition} style={{ flex: 1, background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "8px", fontSize: 13, cursor: "pointer" }}>Add</button>
            <button onClick={() => setAdding(false)} style={{ flex: 1, background: "#f3f4f6", color: "#444", border: "none", borderRadius: 8, padding: "8px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ width: "100%", padding: "10px", borderRadius: 12, border: "0.5px dashed #d1d5db", background: "none", color: "#6366f1", fontSize: 13, cursor: "pointer" }}>+ add position</button>
      )}
    </div>
  );
}

function Alerts({ contracts, stocks }) {
  const alerts = contracts.filter(c => isActive(c)).sort((a, b) => b.score - a.score).slice(0, 20);
  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 12 }}>active contracts score 6+ sorted by significance</div>
      {alerts.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #e5e7eb", padding: "2rem", textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "#888" }}>No alerts yet. Scanner runs every 90 min during business hours.</div>
        </div>
      )}
      {alerts.map((c, i) => {
        const publicTickers = (c.public_tickers || "").split(",").map(t => t.trim()).filter(t => t && t.length <= 5);
        return (
          <div key={i} style={{ background: "#fff", borderRadius: 12, border: `0.5px solid ${c.score >= 8 ? "#ef444440" : "#e5e7eb"}`, padding: "0.75rem 1rem", marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: "#888" }}>{c.agency?.slice(0, 40)}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(c.score) }}>{c.score}/10</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#111", lineHeight: 1.4, marginBottom: 4 }}>{c.headline || c.title}</div>
            <div style={{ fontSize: 11, color: impactColor(c.stock_impact), marginBottom: 6 }}>{c.stock_impact}</div>
            {publicTickers.length > 0 && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {publicTickers.map((t, idx) => (
                  <span key={idx} style={{ fontSize: 10, fontWeight: 700, color: "#0ea5e9", background: "#f0f9ff", padding: "2px 6px", borderRadius: 4 }}>{t}</span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Manage({ stocks, onUpdate }) {
  const [form, setForm] = useState({ ticker: "", name: "", color: COLORS[0] });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const addStock = async () => {
    if (!form.ticker) return;
    setSaving(true);
    await supabase.post("watched_stocks", { ticker: form.ticker.toUpperCase(), name: form.name || form.ticker.toUpperCase(), color: form.color });
    setForm({ ticker: "", name: "", color: COLORS[Math.floor(Math.random() * COLORS.length)] });
    setMsg("Stock added!");
    setTimeout(() => setMsg(""), 2000);
    setSaving(false);
    onUpdate();
  };
  const removeStock = async (ticker) => {
    await supabase.delete("watched_stocks", `ticker=eq.${ticker}`);
    onUpdate();
  };
  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 12 }}>Watched Stocks</div>
      {stocks.map(s => (
        <div key={s.ticker} style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #e5e7eb", padding: "0.75rem 1rem", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{s.ticker}</div>
              <div style={{ fontSize: 11, color: "#888" }}>{s.name}</div>
            </div>
          </div>
          <button onClick={() => removeStock(s.ticker)} style={{ background: "#fee2e2", border: "none", color: "#ef4444", borderRadius: 8, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>Remove</button>
        </div>
      ))}
      <div style={{ fontSize: 13, fontWeight: 600, color: "#111", margin: "1.25rem 0 10px" }}>Add Stock</div>
      <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #e5e7eb", padding: "1rem" }}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>ticker</div>
          <input placeholder="e.g. PLTR" value={form.ticker} onChange={e => setForm({ ...form, ticker: e.target.value.toUpperCase() })} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "0.5px solid #e5e7eb", fontSize: 13, boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>company name</div>
          <input placeholder="e.g. Palantir" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "0.5px solid #e5e7eb", fontSize: 13, boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>color</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {COLORS.map(c => (
              <div key={c} onClick={() => setForm({ ...form, color: c })} style={{ width: 24, height: 24, borderRadius: "50%", background: c, cursor: "pointer", border: form.color === c ? "2px solid #111" : "2px solid transparent" }} />
            ))}
          </div>
        </div>
        <button onClick={addStock} disabled={saving || !form.ticker} style={{ width: "100%", padding: "10px", borderRadius: 10, border: "none", background: "#6366f1", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: saving || !form.ticker ? 0.6 : 1 }}>
          {saving ? "Adding..." : "Add Stock"}
        </button>
        {msg && <div style={{ fontSize: 12, color: "#10b981", textAlign: "center", marginTop: 8 }}>{msg}</div>}
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("Dashboard");
  const [contracts, setContracts] = useState([]);
  const [stocks, setStocks] = useState(DEFAULT_STOCKS);
  const [loading, setLoading] = useState(true);

  const loadStocks = () => {
    supabase.get("watched_stocks", "select=*&order=created_at.asc")
      .then(data => { if (Array.isArray(data) && data.length > 0) setStocks(data); })
      .catch(() => {});
  };

  useEffect(() => {
    loadStocks();
    supabase.get("contracts", "select=*&order=created_at.desc&limit=200")
      .then(data => { setContracts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const activeContracts = contracts.filter(c => isActive(c));
  const topContracts = [...activeContracts].sort((a, b) => b.score - a.score).slice(0, 3);

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#f8f9fa", minHeight: "100vh", maxWidth: 430, margin: "0 auto" }}>
      <div style={{ background: "#fff", borderBottom: "0.5px solid #e5e7eb", padding: "0.75rem 1rem", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 8 }}>Trading Intel</div>
        <TabBar tabs={TABS} active={tab} onSelect={setTab} />
      </div>

      {tab === "Dashboard" && (
        <div style={{ padding: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: "1rem" }}>
            {[
              ["Active 6+", activeContracts.length],
              ["Score 8+", activeContracts.filter(c => c.score >= 8).length],
              ["Positive", activeContracts.filter(c => c.stock_impact?.includes("POSITIVE")).length],
              ["Score 7+", activeContracts.filter(c => c.score >= 7).length],
            ].map(([label, val]) => (
              <div key={label} style={{ background: "#fff", borderRadius: 12, padding: "0.75rem 1rem", border: "0.5px solid #e5e7eb" }}>
                <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#111" }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 8 }}>Top Opportunities</div>
          {loading && <div style={{ fontSize: 13, color: "#888", textAlign: "center", padding: "2rem" }}>Loading...</div>}
          {!loading && topContracts.length === 0 && (
            <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #e5e7eb", padding: "1.5rem", textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#888" }}>No active opportunities yet. Scanner runs every 90 min (7am–7pm CST).</div>
            </div>
          )}
          {topContracts.map((c, i) => <ContractCard key={i} contract={c} stocks={stocks} />)}
          <div style={{ fontSize: 13, fontWeight: 600, color: "#111", margin: "1rem 0 8px" }}>Watching</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {stocks.map(s => (
              <div key={s.ticker} style={{ background: s.color + "15", border: `0.5px solid ${s.color}40`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, color: s.color }}>{s.ticker}</div>
            ))}
          </div>
        </div>
      )}

      {tab === "Contracts" && <Contracts contracts={contracts} stocks={stocks} loading={loading} />}
      {tab === "Portfolio" && <Portfolio />}
      {tab === "Alerts" && <Alerts contracts={contracts} stocks={stocks} />}
      {tab === "Manage" && <Manage stocks={stocks} onUpdate={loadStocks} />}
    </div>
  );
}
