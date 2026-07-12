import { useState } from "react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ─── Dark navy command-centre palette — fixed regardless of app theme ─────────
export const T = {
  bg:           "#0a1322",
  sidebar:      "#0a1525",
  card:         "#101f35",
  cardAlt:      "#0d1c30",
  border:       "rgba(59,130,246,0.16)",
  borderStrong: "rgba(59,130,246,0.32)",
  text:         "#e7edf7",
  textMuted:    "#8995ad",
  textDim:      "#4d5b75",
  blue:         "#3b82f6",
  purple:       "#a855f7",
  green:        "#22c55e",
  amber:        "#f59e0b",
  red:          "#ef4444",
  orange:       "#f97316",
};

export function fmtNum(v) {
  if (v === null || v === undefined || isNaN(v)) return "—";
  return v.toLocaleString();
}
export function fmtPct(v) {
  if (v === null || v === undefined || isNaN(v)) return "—";
  return `${(v * 100).toFixed(1)}%`;
}
export function fmtDate(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }); }
  catch { return "—"; }
}
export function fmtDateTime(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }
  catch { return "—"; }
}

export function Trend({ value }) {
  if (value === null || value === undefined || isNaN(value)) {
    return <span style={{ fontSize: 12, color: T.textDim }}>—</span>;
  }
  const up = value >= 0;
  return (
    <span style={{ fontSize: 12, fontWeight: 700, color: up ? T.green : T.red, display: "inline-flex", alignItems: "center", gap: 3 }}>
      {up ? "▲" : "▼"} {Math.abs(value * 100).toFixed(1)}%
    </span>
  );
}

// ─── Reusable card shell ───────────────────────────────────────────────────────
export function Panel({ title, subtitle, right, children, style }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`, borderRadius: 16,
      padding: "18px 20px", boxShadow: "0 0 0 1px rgba(59,130,246,0.04), 0 8px 24px rgba(0,0,0,0.35)",
      ...style,
    }}>
      {(title || right) && (
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, gap: 12 }}>
          <div>
            {title && <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{title}</div>}
            {subtitle && <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{subtitle}</div>}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── North Star KPI card with sparkline ────────────────────────────────────────
export function NorthStarCard({ icon, label, value, delta, accent, series }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${T.card} 0%, ${T.cardAlt} 100%)`,
      border: `1px solid ${T.border}`, borderRadius: 16, padding: "18px 20px",
      boxShadow: `0 0 0 1px rgba(59,130,246,0.04), 0 0 28px ${accent}14`,
      display: "flex", flexDirection: "column", gap: 10, minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, background: `${accent}1f`,
          border: `1px solid ${accent}40`, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {label}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, color: T.text, letterSpacing: -0.5, lineHeight: 1 }}>{fmtNum(value)}</div>
          <div style={{ marginTop: 6 }}><Trend value={delta} /> <span style={{ fontSize: 11, color: T.textDim }}>vs previous period</span></div>
        </div>
        {series && series.length > 1 && (
          <div style={{ width: 90, height: 36, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="count" stroke={accent} strokeWidth={2} fill={`url(#spark-${label})`} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Medium KPI card ────────────────────────────────────────────────────────────
export function MidKpiCard({ icon, label, value, delta, accent }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "14px 16px",
      display: "flex", alignItems: "center", gap: 12, minWidth: 0,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, background: `${accent}1f`, border: `1px solid ${accent}40`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.text }}>{fmtNum(value)}</div>
          <Trend value={delta} />
        </div>
      </div>
    </div>
  );
}

// ─── Generic funnel panel ───────────────────────────────────────────────────────
export function FunnelPanel({ title, subtitle, funnel, overallConversion, overallLabel, style }) {
  const maxCount = funnel?.[0]?.count || 1;
  return (
    <Panel title={title} subtitle={subtitle} style={{ height: "100%", ...style }}>
      <div style={{ display: "flex", fontSize: 11, fontWeight: 700, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8, padding: "0 2px" }}>
        <div style={{ flex: 1 }} />
        <div style={{ width: 70, textAlign: "right" }}>Users</div>
        <div style={{ width: 70, textAlign: "right" }}>Conv.</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {(funnel || []).map((step, i) => {
          const widthPct = Math.max(6, (step.count / maxCount) * 100);
          return (
            <div key={step.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 3 }}>{i + 1}. {step.label}</div>
                <div style={{ height: 22, background: "rgba(59,130,246,0.08)", borderRadius: 6, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${widthPct}%`, borderRadius: 6,
                    background: `linear-gradient(90deg, ${T.blue} 0%, #60a5fa 100%)`,
                    boxShadow: "0 0 12px rgba(59,130,246,0.35)",
                    transition: "width 0.3s ease",
                  }} />
                </div>
              </div>
              <div style={{ width: 70, textAlign: "right", fontSize: 13, fontWeight: 700, color: T.text }}>{fmtNum(step.count)}</div>
              <div style={{ width: 70, textAlign: "right", fontSize: 12, fontWeight: 600, color: T.textMuted }}>{fmtPct(step.rate)}</div>
            </div>
          );
        })}
      </div>
      {overallConversion !== undefined && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
          <span style={{ fontSize: 12, color: T.textMuted }}>{overallLabel || "Overall conversion"}</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: T.blue }}>{fmtPct(overallConversion)}</span>
        </div>
      )}
    </Panel>
  );
}

// ─── Generic multi-line time-series chart ──────────────────────────────────────
export function TrendLineChart({ title, right, data, lines, height = 260 }) {
  return (
    <Panel title={title} right={right}>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data || []} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: T.textDim, fontSize: 11 }} tickFormatter={fmtDate} axisLine={{ stroke: T.border }} tickLine={false} />
            <YAxis tick={{ fill: T.textDim, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: T.cardAlt, border: `1px solid ${T.borderStrong}`, borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: T.textMuted }}
              labelFormatter={fmtDate}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: T.textMuted }} />
            {(lines || []).map((l) => (
              <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2.5} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

export function DailyToggleLineChart({ title, data, lines, height }) {
  const [granularity, setGranularity] = useState("Daily");
  return (
    <TrendLineChart
      title={title}
      right={
        <select value={granularity} onChange={(e) => setGranularity(e.target.value)} style={{
          background: T.cardAlt, color: T.textMuted, border: `1px solid ${T.borderStrong}`,
          borderRadius: 8, fontSize: 12, padding: "5px 10px", cursor: "pointer",
        }}>
          <option>Daily</option>
          <option>Weekly</option>
        </select>
      }
      data={data}
      lines={lines}
      height={height}
    />
  );
}

// ─── Generic horizontal bar chart ───────────────────────────────────────────────
export function HorizontalBarChart({ title, data, dataKey = "count", labelKey = "label", colors, pctKey, height = 260 }) {
  const COLORS = colors || [T.blue, T.purple, T.orange, T.amber, T.green, T.red];
  return (
    <Panel title={title}>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data || []} layout="vertical" margin={{ top: 4, right: 28, left: 8, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
            <XAxis type="number" tick={{ fill: T.textDim, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey={labelKey} tick={{ fill: T.textMuted, fontSize: 12 }} axisLine={false} tickLine={false} width={140} />
            <Tooltip
              contentStyle={{ background: T.cardAlt, border: `1px solid ${T.borderStrong}`, borderRadius: 8, fontSize: 12 }}
              formatter={(value, _name, item) => pctKey ? [`${fmtNum(value)} (${fmtPct(item.payload[pctKey])})`, "Count"] : [fmtNum(value), "Count"]}
            />
            <Bar dataKey={dataKey} radius={[0, 6, 6, 0]}>
              {(data || []).map((entry, i) => (
                <Cell key={entry.key || i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

// ─── Generic compact table ───────────────────────────────────────────────────────
export function DataTable({ title, subtitle, columns, rows, total, footerLabel, right }) {
  return (
    <Panel title={title} subtitle={subtitle} right={right}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 11, fontWeight: 700, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.4, paddingBottom: 8, borderBottom: `1px solid ${T.border}` }}>
          {columns.map((c) => <div key={c.key} style={{ flex: c.flex || 1 }}>{c.label}</div>)}
        </div>
        {(!rows || rows.length === 0) ? (
          <div style={{ padding: "20px 0", fontSize: 12.5, color: T.textDim, textAlign: "center" }}>No data for this range.</div>
        ) : rows.map((r, i) => (
          <div key={i} style={{ display: "flex", fontSize: 12.5, color: T.textMuted, padding: "9px 0", borderBottom: `1px solid ${T.border}` }}>
            {columns.map((c) => (
              <div key={c.key} style={{ flex: c.flex || 1, color: c.emphasize ? T.text : T.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.render ? c.render(r[c.key], r) : (r[c.key] ?? "—")}
              </div>
            ))}
          </div>
        ))}
      </div>
      {total > (rows?.length || 0) && (
        <div style={{ marginTop: 10, fontSize: 12, color: T.blue, fontWeight: 600, cursor: "pointer" }}>
          View all ({fmtNum(total)}) →
        </div>
      )}
      {!total && footerLabel && (
        <div style={{ marginTop: 10, fontSize: 12, color: T.blue, fontWeight: 600, cursor: "pointer" }}>{footerLabel} →</div>
      )}
    </Panel>
  );
}

export const IMPACT_COLOR = { High: T.red, Medium: T.amber, Low: T.green };
export function ImpactDot({ impact }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: IMPACT_COLOR[impact] || T.textDim, display: "inline-block" }} />
      {impact}
    </span>
  );
}

// ─── Empty / loading / error helpers (shared across sections) ──────────────────
export function SectionLoading() {
  return <div style={{ padding: 60, textAlign: "center", color: T.textMuted, fontSize: 14 }}>Loading…</div>;
}
export function SectionError({ error }) {
  return (
    <div style={{ background: "rgba(239,68,68,0.08)", border: `1px solid ${T.red}40`, borderRadius: 12, padding: "14px 18px", color: T.red, fontSize: 13 }}>
      {error}
    </div>
  );
}
export function SectionEmpty({ message = "No data for this range yet." }) {
  return (
    <div style={{ minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center", color: T.textDim, fontSize: 13 }}>
      {message}
    </div>
  );
}
