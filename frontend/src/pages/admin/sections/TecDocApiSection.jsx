import { useMemo } from "react";
import { T, MidKpiCard, DailyToggleLineChart, HorizontalBarChart, DataTable, fmtDateTime, SectionEmpty } from "../shared";

export default function TecDocApiSection({ events }) {
  const stats = useMemo(() => {
    const listing = events.filter(
      (e) => e.event_name === "listing_generated" && e.metadata?.tecdoc_api_calls != null
    );
    const all = events.filter((e) => e.event_name === "listing_generated");
    const calls = listing.map((e) => Number(e.metadata.tecdoc_api_calls));

    if (calls.length === 0) return null;

    const total   = calls.reduce((a, b) => a + b, 0);
    const avg     = total / calls.length;
    const min     = Math.min(...calls);
    const max     = Math.max(...calls);
    const coverage = all.length > 0 ? listing.length / all.length : 1;

    // Daily average calls per listing
    const byDay = {};
    listing.forEach((e) => {
      const day = e.created_at.slice(0, 10);
      if (!byDay[day]) byDay[day] = { sum: 0, count: 0, total: 0 };
      byDay[day].sum += Number(e.metadata.tecdoc_api_calls);
      byDay[day].count++;
      byDay[day].total += Number(e.metadata.tecdoc_api_calls);
    });
    const dailySeries = Object.entries(byDay)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, v]) => ({
        date,
        avg: Math.round((v.sum / v.count) * 10) / 10,
        total: v.total,
      }));

    // Distribution — how many listings used X calls
    const dist = {};
    calls.forEach((n) => { dist[n] = (dist[n] || 0) + 1; });
    const distribution = Object.entries(dist)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([n, count]) => ({ key: String(n), label: `${n} calls`, count }));

    // Recent high-call listings
    const highCall = [...listing]
      .sort((a, b) => Number(b.metadata.tecdoc_api_calls) - Number(a.metadata.tecdoc_api_calls))
      .slice(0, 10)
      .map((e) => ({
        part: e.metadata?.part_number || "—",
        calls: Number(e.metadata.tecdoc_api_calls),
        time: e.created_at,
      }));

    return { total, avg, min, max, coverage, listing_count: listing.length, dailySeries, distribution, highCall };
  }, [events]);

  if (!stats) return (
    <SectionEmpty message="No TecDoc API call data yet. Generate a listing after the latest deploy to start collecting data." />
  );

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
        <MidKpiCard icon="📡" label="Total TecDoc Calls" value={stats.total.toLocaleString()} accent={T.blue} />
        <MidKpiCard icon="⌀"  label="Avg Calls / Listing" value={stats.avg.toFixed(1)} accent={T.purple} />
        <MidKpiCard icon="↕"  label="Range (min – max)" value={`${stats.min} – ${stats.max}`} accent={T.green} />
        <MidKpiCard icon="📋" label="Listings Tracked" value={stats.listing_count.toLocaleString()} accent={T.amber}
          subLabel={stats.coverage < 1 ? `${Math.round(stats.coverage * 100)}% coverage` : "100% coverage"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginBottom: 18 }}>
        <DailyToggleLineChart
          title="Avg TecDoc calls per listing (daily)"
          data={stats.dailySeries}
          lines={[
            { key: "avg",   name: "Avg calls",   color: T.blue },
            { key: "total", name: "Total calls",  color: T.purple },
          ]}
        />
        <HorizontalBarChart
          title="Call count distribution"
          data={stats.distribution}
          height={220}
        />
      </div>

      <DataTable
        title="Listings with highest API call count"
        columns={[
          { key: "part",  label: "Part number", flex: 1.2, emphasize: true },
          { key: "calls", label: "TecDoc calls" },
          { key: "time",  label: "Generated", render: fmtDateTime },
        ]}
        rows={stats.highCall}
      />

      {stats.coverage < 1 && (
        <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: "rgba(245,158,11,0.08)", border: `1px solid ${T.amber}40`, fontSize: 12.5, color: T.amber }}>
          ⚠ Only {Math.round(stats.coverage * 100)}% of listings in this range have call data — older listings were generated before tracking was added.
        </div>
      )}
    </>
  );
}
