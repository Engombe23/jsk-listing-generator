import { useMemo } from "react";
import { T, MidKpiCard, DailyToggleLineChart, HorizontalBarChart, DataTable, fmtDateTime, fmtPct, ImpactDot, SectionEmpty } from "../shared";

const FAILURE_EVENTS = ["listing_generation_failed", "compat_check_failed"];
const ATTEMPT_EVENTS = [
  "listing_generation_started", "listing_generated", "listing_generation_failed",
  "compat_check_started", "compat_check_performed", "compat_check_failed",
];
const FAILURE_LABELS = {
  listing_generation_failed: "Listing generation failed",
  compat_check_failed:       "Compatibility check failed",
};
const FAILURE_IMPACT = {
  listing_generation_failed: "High",
  compat_check_failed:       "Medium",
};

function dailySeriesByCategory(events) {
  const categories = ["landing", "signup", "listing_generator", "smart_pricing", "compatibility_checker"];
  const byDay = new Map();
  events.forEach((e) => {
    const day = e.created_at.slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, {});
    const bucket = byDay.get(day);
    const cat = e.event_category || "other";
    bucket[cat] = (bucket[cat] || 0) + 1;
  });
  return [...byDay.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, counts]) => {
    const row = { date };
    categories.forEach((c) => { row[c] = counts[c] || 0; });
    return row;
  });
}

function errorRateSeries(events) {
  const num = new Map(), den = new Map();
  events.forEach((e) => {
    const day = e.created_at.slice(0, 10);
    if (FAILURE_EVENTS.includes(e.event_name)) num.set(day, (num.get(day) || 0) + 1);
    if (ATTEMPT_EVENTS.includes(e.event_name)) den.set(day, (den.get(day) || 0) + 1);
  });
  const days = new Set([...num.keys(), ...den.keys()]);
  return [...days].sort().map((date) => {
    const d = den.get(date) || 0;
    return { date, rate: d > 0 ? Math.round(((num.get(date) || 0) / d) * 1000) / 10 : 0 };
  });
}

export default function ApiUsageErrorsSection({ events }) {
  const stats = useMemo(() => {
    const totalEvents = events.length;
    const failures = events.filter((e) => FAILURE_EVENTS.includes(e.event_name));
    const attempts  = events.filter((e) => ATTEMPT_EVENTS.includes(e.event_name)).length;
    const errorRate = attempts > 0 ? failures.length / attempts : null;

    const byCategory = {};
    events.forEach((e) => {
      const cat = e.event_category || "other";
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    });
    const categoryBreakdown = Object.entries(byCategory)
      .map(([key, count]) => ({ key, label: key.replace(/_/g, " "), count }))
      .sort((a, b) => b.count - a.count);

    const failedByName = new Map();
    failures.forEach((e) => {
      const entry = failedByName.get(e.event_name) || { count: 0, last: e.created_at };
      entry.count += 1;
      if (e.created_at > entry.last) entry.last = e.created_at;
      failedByName.set(e.event_name, entry);
    });
    const failedSummary = [...failedByName.entries()].map(([name, v]) => ({
      event: FAILURE_LABELS[name] || name, count: v.count, last_occurred: v.last, impact: FAILURE_IMPACT[name] || "Low",
    })).sort((a, b) => b.count - a.count);

    const recentFailures = failures
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, 15)
      .map((e) => ({
        event: FAILURE_LABELS[e.event_name] || e.event_name,
        time: e.created_at,
        error: e.metadata?.error || "—",
        impact: FAILURE_IMPACT[e.event_name] || "Low",
      }));

    return { totalEvents, failures: failures.length, errorRate, categoryBreakdown, failedSummary, recentFailures, volumeSeries: dailySeriesByCategory(events), errorRateOverTime: errorRateSeries(events) };
  }, [events]);

  if (stats.totalEvents === 0) return <SectionEmpty message="No events recorded in this range yet." />;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 18 }}>
        <MidKpiCard icon="📊" label="Total Events" value={stats.totalEvents} accent={T.blue} />
        <MidKpiCard icon="⚠️" label="Failed Events" value={stats.failures} accent={T.red} />
        <MidKpiCard icon="📉" label="Error Rate" value={fmtPct(stats.errorRate)} accent={T.amber} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 14, marginBottom: 18 }}>
        <DailyToggleLineChart title="Event Volume by Category" data={stats.volumeSeries} lines={[
          { key: "landing",                label: "landing",                color: T.blue,   name: "Landing" },
          { key: "signup",                 label: "signup",                 color: T.purple, name: "Signup" },
          { key: "listing_generator",      label: "listing_generator",      color: T.green,  name: "Listing Generator" },
          { key: "smart_pricing",          label: "smart_pricing",          color: T.orange, name: "Smart Pricing" },
          { key: "compatibility_checker",  label: "compatibility_checker",  color: T.amber,  name: "Compatibility Checker" },
        ]} />
        <HorizontalBarChart title="Event Volume by Category (total)" data={stats.categoryBreakdown} height={220} />
      </div>

      <div style={{ marginBottom: 18 }}>
        <DailyToggleLineChart title="Error Rate Over Time (%)" data={stats.errorRateOverTime} lines={[
          { key: "rate", name: "Error Rate %", color: T.red },
        ]} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 14 }}>
        <DataTable
          title="Failed events summary"
          columns={[
            { key: "event", label: "Event", flex: 1.6, emphasize: true },
            { key: "count", label: "Count" },
            { key: "last_occurred", label: "Last occurred", render: fmtDateTime },
            { key: "impact", label: "Impact", render: (v) => <ImpactDot impact={v} /> },
          ]}
          rows={stats.failedSummary}
        />
        <DataTable
          title="Recent individual failures"
          columns={[
            { key: "event", label: "Event", flex: 1.3, emphasize: true },
            { key: "time", label: "When", render: fmtDateTime },
            { key: "error", label: "Error", flex: 1.6 },
            { key: "impact", label: "Impact", render: (v) => <ImpactDot impact={v} /> },
          ]}
          rows={stats.recentFailures}
        />
      </div>
    </>
  );
}
