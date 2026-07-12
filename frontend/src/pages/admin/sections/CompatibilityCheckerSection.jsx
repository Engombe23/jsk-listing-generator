import { useMemo } from "react";
import { T, MidKpiCard, FunnelPanel, HorizontalBarChart, DailyToggleLineChart, SectionEmpty } from "../shared";

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

export default function CompatibilityCheckerSection({ events }) {
  const stats = useMemo(() => {
    const started   = events.filter((e) => e.event_name === "compat_check_started").length;
    const performed  = events.filter((e) => e.event_name === "compat_check_performed").length;
    const failed     = events.filter((e) => e.event_name === "compat_check_failed").length;
    const compatible = events.filter((e) => e.event_name === "compat_result_compatible").length;
    const notCompatible = events.filter((e) => e.event_name === "compat_result_not_compatible").length;

    const funnel = [
      { key: "started",   label: "Check started",   count: started },
      { key: "performed",  label: "Check performed", count: performed },
    ].map((s, i, arr) => ({ ...s, rate: i === 0 ? 1 : (arr[i - 1].count > 0 ? s.count / arr[i - 1].count : null) }));

    const resultSplit = [
      { key: "compatible",     label: "Compatible",     count: compatible },
      { key: "not_compatible", label: "Not compatible", count: notCompatible },
    ];

    const failureRateSeries = dailyRate(events, ["compat_check_failed"], ["compat_check_started"]);

    return { funnel, failed, resultSplit, failureRateSeries, started };
  }, [events]);

  if (stats.started === 0) return <SectionEmpty message="No compatibility checks in this range yet." />;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
        <MidKpiCard icon="🛡️" label="Checks Started"   value={stats.funnel[0].count} accent={T.blue} />
        <MidKpiCard icon="✅" label="Checks Performed" value={stats.funnel[1].count} accent={T.green} />
        <MidKpiCard icon="⚠️" label="Checks Failed"    value={stats.failed} accent={T.red} />
        <MidKpiCard icon="🚗" label="Compatible Results" value={stats.resultSplit[0].count} accent={T.purple} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18, alignItems: "stretch" }}>
        <FunnelPanel title="Compatibility Checker Funnel" subtitle="Started → performed" funnel={stats.funnel} />
        <HorizontalBarChart title="Result Split" data={stats.resultSplit} colors={[T.green, T.red]} height={160} />
      </div>

      <DailyToggleLineChart title="Check Failure Rate (%)" data={stats.failureRateSeries} lines={[
        { key: "rate", name: "Failure Rate %", color: T.red },
      ]} />
    </>
  );
}
