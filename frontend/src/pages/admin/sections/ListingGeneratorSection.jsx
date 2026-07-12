import { useMemo } from "react";
import { T, MidKpiCard, FunnelPanel, DailyToggleLineChart, DataTable, SectionEmpty, fmtNum } from "../shared";

function distinctUsers(events, names) {
  const set = new Set();
  events.forEach((e) => { if (e.user_id && names.includes(e.event_name)) set.add(e.user_id); });
  return set;
}
function dailyRate(events, numNames, denNames) {
  const num = new Map(), den = new Map();
  events.forEach((e) => {
    const day = e.created_at.slice(0, 10);
    if (numNames.includes(e.event_name)) num.set(day, (num.get(day) || 0) + 1);
    if (denNames.includes(e.event_name)) den.set(day, (den.get(day) || 0) + 1);
  });
  const days = new Set([...num.keys(), ...den.keys()]);
  return [...days].sort().map((date) => {
    const d = den.get(date) || 0;
    return { date, rate: d > 0 ? Math.round(((num.get(date) || 0) / d) * 1000) / 10 : 0 };
  });
}

export default function ListingGeneratorSection({ events }) {
  const stats = useMemo(() => {
    const started  = events.filter((e) => e.event_name === "listing_generation_started").length;
    const generated = events.filter((e) => e.event_name === "listing_generated");
    const failed    = events.filter((e) => e.event_name === "listing_generation_failed").length;
    const saved     = events.filter((e) => e.event_name === "listing_saved").length;
    const copied    = events.filter((e) => e.event_name === "listing_copied").length;
    const exported  = events.filter((e) => e.event_name === "listing_exported_csv").length;

    const funnel = [
      { key: "started",   label: "Generation started", count: started },
      { key: "generated", label: "Listing generated",  count: generated.length },
      { key: "saved",     label: "Listing saved",       count: saved },
      { key: "exported",  label: "Listing exported",    count: exported },
    ].map((s, i, arr) => ({ ...s, rate: i === 0 ? 1 : (arr[i - 1].count > 0 ? s.count / arr[i - 1].count : null) }));

    const genTimes = generated.map((e) => e.metadata?.generation_time_ms).filter((v) => typeof v === "number");
    const avgGenTime = genTimes.length ? Math.round(genTimes.reduce((a, b) => a + b, 0) / genTimes.length) : null;

    const partCounts = {};
    events.filter((e) => e.event_name === "listing_generated").forEach((e) => {
      const p = e.metadata?.part_number;
      if (p) partCounts[p] = (partCounts[p] || 0) + 1;
    });
    const topParts = Object.entries(partCounts).map(([part_number, count]) => ({ part_number, count })).sort((a, b) => b.count - a.count).slice(0, 8);

    const failureRateSeries = dailyRate(events, ["listing_generation_failed"], ["listing_generation_started"]);

    return { funnel, copied, failed, avgGenTime, topParts, failureRateSeries };
  }, [events]);

  if (stats.funnel[0].count === 0) return <SectionEmpty message="No listing generation activity in this range yet." />;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
        <MidKpiCard icon="📋" label="Listings Copied"  value={stats.copied} accent={T.purple} />
        <MidKpiCard icon="⚠️" label="Generation Failures" value={stats.failed} accent={T.red} />
        <MidKpiCard icon="⏱️" label="Avg Generation Time" value={stats.avgGenTime ? `${(stats.avgGenTime / 1000).toFixed(1)}s` : "—"} accent={T.amber} />
        <MidKpiCard icon="🔧" label="Unique Parts Generated" value={stats.topParts.length} accent={T.blue} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 14, marginBottom: 18, alignItems: "stretch" }}>
        <FunnelPanel
          title="Listing Generator Funnel"
          subtitle="Started → generated → saved → exported"
          funnel={stats.funnel}
          overallConversion={stats.funnel[0].count > 0 ? stats.funnel[3].count / stats.funnel[0].count : null}
          overallLabel="Overall conversion (started → exported)"
        />
        <DataTable
          title="Top searched part numbers"
          columns={[
            { key: "part_number", label: "Part Number", flex: 1.4, emphasize: true },
            { key: "count", label: "Generated" },
          ]}
          rows={stats.topParts}
        />
      </div>

      <DailyToggleLineChart title="Generation Failure Rate (%)" data={stats.failureRateSeries} lines={[
        { key: "rate", name: "Failure Rate %", color: T.red },
      ]} />
    </>
  );
}
