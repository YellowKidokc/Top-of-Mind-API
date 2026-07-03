// src/pages/CommandCenter.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import FusionFeed from "../components/FusionFeed";

const API_BASE = import.meta.env.VITE_BACKEND_URL || "";

// ---------- Helper ----------

function formatDate(ts) {
  if (!ts) return "—";
  return dayjs(ts).format("YYYY-MM-DD HH:mm");
}

// ---------- Widgets ----------

function EmpireStatusGrid({ divisions, updatedAt }) {
  const getColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "green":
      case "ok":
      case "received":
        return "#22c55e"; // green
      case "yellow":
      case "pending":
        return "#eab308"; // yellow
      case "red":
      case "missing":
        return "#ef4444"; // red
      default:
        return "#6b7280"; // gray
    }
  };

  return (
    <div style={cardStyle}>
      <h2 style={cardTitleStyle}>📊 Empire Status Grid</h2>
      <p style={subtitleStyle}>Daily memo heartbeat per division</p>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {divisions.length === 0 && (
          <p style={{ color: "#9ca3af" }}>No memo index found yet.</p>
        )}
        {divisions.map((d) => (
          <div key={d.id || d.name} style={miniCardStyle}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "999px",
                backgroundColor: getColor(d.status),
                boxShadow: "0 0 12px rgba(0,0,0,0.4)",
              }}
            />
            <div style={{ marginTop: 6, fontWeight: 600 }}>{d.name}</div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>
              Last memo: {formatDate(d.lastMemoDate)}
            </div>
            {d.summary && (
              <div
                style={{
                  fontSize: 12,
                  color: "#e5e7eb",
                  marginTop: 4,
                  maxHeight: 40,
                  overflow: "hidden",
                }}
              >
                {d.summary}
              </div>
            )}
          </div>
        ))}
      </div>
      <FooterUpdated updatedAt={updatedAt} />
    </div>
  );
}

function BoutiqueRevenueTracker({ revenue }) {
  const { mrr, totalReportSales, yoyGrowth, sparkline, updatedAt } = revenue;

  return (
    <div style={cardStyle}>
      <h2 style={cardTitleStyle}>🪙 Boutique Revenue</h2>
      <p style={subtitleStyle}>AHK Boutique – reports & subscriptions</p>
      <div
        style={{
          display: "flex",
          gap: 24,
          alignItems: "flex-end",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={labelStyle}>Current MRR</div>
          <div style={bigNumberStyle}>${(mrr || 0).toLocaleString()}</div>
        </div>
        <div>
          <div style={labelStyle}>Total Report Sales</div>
          <div style={bigNumberStyle}>
            ${(totalReportSales || 0).toLocaleString()}
          </div>
        </div>
        <div>
          <div style={labelStyle}>YoY Growth</div>
          <div
            style={{
              ...bigNumberStyle,
              color: (yoyGrowth || 0) >= 0 ? "#22c55e" : "#ef4444",
            }}
          >
            {(yoyGrowth || 0).toFixed(1)}%
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={labelStyle}>Trend (last periods)</div>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
          {(sparkline || []).map((v, idx) => (
            <div
              key={idx}
              style={{
                width: 8,
                height: Math.max(4, v),
                borderRadius: 4,
                background:
                  "linear-gradient(to top, #d4af37, rgba(212,175,55,0.3))",
              }}
            />
          ))}
          {(!sparkline || sparkline.length === 0) && (
            <span style={{ fontSize: 12, color: "#9ca3af" }}>
              No sparkline data yet.
            </span>
          )}
        </div>
      </div>

      <FooterUpdated updatedAt={updatedAt} />
    </div>
  );
}

function ProjectPulse({ projects }) {
  const items = projects || [];

  return (
    <div style={cardStyle}>
      <h2 style={cardTitleStyle}>🌍 Project Pulse</h2>
      <p style={subtitleStyle}>Italian Projects – WOW & Q-VAN</p>
      {items.length === 0 && (
        <p style={{ color: "#9ca3af" }}>No project data wired yet.</p>
      )}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {items.map((p) => (
          <div key={p.id} style={miniCardStyle}>
            <div style={{ fontWeight: 600 }}>{p.name}</div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
              Progress: {Math.round(p.progress || 0)}%
            </div>
            {p.link && (
              <a
                href={p.link}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: 12,
                  color: "#d4af37",
                  marginTop: 6,
                  textDecoration: "underline",
                }}
              >
                Open latest HTML study
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FusionInsightViewer({ fusion }) {
  if (!fusion || !fusion.hasReport) {
    return (
      <div style={cardStyle}>
        <h2 style={cardTitleStyle}>🧠 Fusion Insight Viewer</h2>
        <p style={subtitleStyle}>Weekly Fusion Report</p>
        <p style={{ color: "#9ca3af" }}>No fusion report found yet.</p>
      </div>
    );
  }

  const src = fusion.latest?.url || "/api/fusion/html";

  return (
    <div style={{ ...cardStyle, flex: 1, minHeight: 320 }}>
      <h2 style={cardTitleStyle}>🧠 Fusion Insight Viewer</h2>
      <p style={subtitleStyle}>{fusion.latest?.filename}</p>
      <iframe
        title="Weekly Fusion Report"
        src={src}
        style={{
          borderRadius: 12,
          border: "1px solid rgba(148,163,184,0.4)",
          width: "100%",
          height: 260,
          backgroundColor: "#020617",
        }}
      />
      <FooterUpdated updatedAt={fusion.updatedAt} />
    </div>
  );
}

function SystemHealthPanel({ systemHealth }) {
  const sh = systemHealth || {};
  return (
    <div style={cardStyle}>
      <h2 style={cardTitleStyle}>⚡ System Health</h2>
      <p style={subtitleStyle}>Engines & schedulers</p>
      <div style={{ display: "grid", gap: 8 }}>
        <HealthRow label="PM2 / Emma-Orchestrator" value={sh.pm2 || "—"} />
        <HealthRow
          label="Task Scheduler – last run"
          value={formatDate(sh.schedulerLastRun)}
        />
        <HealthRow
          label="Disk / Drive Sync"
          value={sh.diskSyncStatus || "—"}
        />
        <HealthRow label="Source" value={sh.source || "unknown"} />
      </div>
    </div>
  );
}

function HealthRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 13,
        color: "#e5e7eb",
      }}
    >
      <span style={{ color: "#9ca3af" }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function FooterUpdated({ updatedAt }) {
  if (!updatedAt) return null;
  return (
    <div
      style={{
        marginTop: 12,
        fontSize: 11,
        color: "#6b7280",
        textAlign: "right",
      }}
    >
      Updated: {formatDate(updatedAt)}
    </div>
  );
}

// ---------- Main Page ----------

const pageStyle = {
  minHeight: "100vh",
  padding: "32px 32px 48px",
  background:
    "radial-gradient(circle at top left, #112240, #0a192f 45%, #020617 85%)",
  color: "#e5e7eb",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
};

const headingStyle = {
  fontSize: 28,
  fontWeight: 700,
  color: "#f9fafb",
};

const subheadingStyle = {
  marginTop: 4,
  fontSize: 14,
  color: "#9ca3af",
};

const layoutStyle = {
  display: "grid",
  gridTemplateColumns: "2fr 1.4fr",
  gap: 24,
  marginTop: 24,
};

const columnStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 20,
};

const cardStyle = {
  background:
    "linear-gradient(145deg, rgba(15,23,42,0.96), rgba(15,23,42,0.75))",
  borderRadius: 16,
  padding: 16,
  border: "1px solid rgba(148,163,184,0.4)",
  boxShadow: "0 18px 40px rgba(15,23,42,0.8)",
};

const cardTitleStyle = {
  fontSize: 16,
  fontWeight: 600,
  color: "#f9fafb",
};

const subtitleStyle = {
  fontSize: 12,
  color: "#9ca3af",
  marginBottom: 12,
};

const miniCardStyle = {
  borderRadius: 12,
  border: "1px solid rgba(148,163,184,0.4)",
  padding: 10,
  minWidth: 140,
};

const labelStyle = {
  fontSize: 12,
  color: "#9ca3af",
};

const bigNumberStyle = {
  fontSize: 20,
  fontWeight: 700,
  color: "#f9fafb",
};

function CommandCenter() {
  const [status, setStatus] = useState({ divisions: [], systemHealth: null });
  const [revenue, setRevenue] = useState({});
  const [fusion, setFusion] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchAll() {
    try {
      setError("");
      const [statusRes, revRes, fusionRes] = await Promise.all([
        axios.get(`${API_BASE}/api/status`),
        axios.get(`${API_BASE}/api/revenue`),
        axios.get(`${API_BASE}/api/fusion`),
      ]);

      setStatus({
        divisions: statusRes.data.divisions || [],
        systemHealth: statusRes.data.systemHealth || null,
        updatedAt: statusRes.data.updatedAt,
      });

      setRevenue(revRes.data || {});
      setFusion(fusionRes.data || null);

      // Project Pulse can be derived either from status or a future /api/projects endpoint.
      // For now, try to infer WOW & Q-VAN from memo index if present.
      const inferredProjects = (statusRes.data.divisions || [])
        .filter((d) =>
          ["wow", "q-van", "qvan", "italian projects"]
            .map((x) => x.toLowerCase())
            .some((k) => d.name.toLowerCase().includes(k))
        )
        .map((d) => ({
          id: d.id || d.name,
          name: d.name,
          progress: d.progress || d.kpi || 0,
          link: d.latestHtml || null,
        }));

      setProjects(inferredProjects);
    } catch (err) {
      console.error("CommandCenter fetch error", err);
      setError("Could not load Command Center data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10 * 60 * 1000); // 10 minutes
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={pageStyle}>
      <header>
        <h1 style={headingStyle}>AHK Command Center</h1>
        <p style={subheadingStyle}>
          Real-time mirror of AHKStrategies – memos, revenue, fusion, and
          system health in one glance.
        </p>
      </header>

      {error && (
        <div
          style={{
            marginTop: 16,
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ef4444",
            color: "#fecaca",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ marginTop: 24, color: "#9ca3af", fontSize: 14 }}>
          Loading live empire metrics…
        </p>
      ) : (
        <main style={layoutStyle}>
          <section style={columnStyle}>
            <EmpireStatusGrid
              divisions={status.divisions || []}
              updatedAt={status.updatedAt}
            />
            <BoutiqueRevenueTracker revenue={revenue} />
          </section>

          <section style={columnStyle}>
            <ProjectPulse projects={projects} />
            <SystemHealthPanel systemHealth={status.systemHealth} />
          </section>

          <section style={{ gridColumn: "1 / -1" }}>
            <FusionInsightViewer fusion={fusion} />
          </section>

          {/* Fusion Feed - Real-time data stream */}
          <section style={{ gridColumn: "1 / -1" }}>
            <FusionFeed />
          </section>
        </main>
      )}
    </div>
  );
}

export default CommandCenter;
