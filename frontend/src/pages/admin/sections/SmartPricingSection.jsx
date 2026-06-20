import { useMemo } from "react";
import { T, MidKpiCard, FunnelPanel, HorizontalBarChart, DataTable, SectionEmpty } from "../shared";

export default function SmartPricingSection({ events }) {
  const stats = useMemo(() => {
    const searches = events.filter((e) => e.event_name === "ebay_search_performed");
    const entered   = events.filter((e) => e.event_name === "price_entered").length;
    const calculated = events.filter((e) => e.event_name === "price_calculated").length;
    const saved     = events.filter((e) => e.event_name === "price_saved").length;

    const funnel = [
      { key: "search",     label: "eBay search performed", count: searches.length },
      { key: "entered",    label: "Price entered",         count: entered },
      { key: "calculated", label: "Price calculated",      count: calculated },
      { key: "saved",      label: "Price saved",           count: saved },
    ].map((s, i, arr) => ({ ...s, rate: i === 0 ? 1 : (arr[i - 1].count > 0 ? s.count / arr[i - 1].count : null) }));

    const queryCounts = {};
    searches.forEach((e) => {
      const q = e.metadata?.query;
      if (q) queryCounts[q] = (queryCounts[q] || 0) + 1;
    });
    const topQueries = Object.entries(queryCounts).map(([query, count]) => ({ query, count })).sort((a, b) => b.count - a.count).slice(0, 8);

    const conditionCounts = {};
    searches.forEach((e) => {
      const c = e.metadata?.condition || "unknown";
      conditionCounts[c] = (conditionCounts[c] || 0) + 1;
    });
    const conditionBreakdown = Object.entries(conditionCounts)
      .map(([key, count]) => ({ key, label: key, count }))
      .sort((a, b) => b.count - a.count);

    return { funnel, topQueries, conditionBreakdown };
  }, [events]);

  if (stats.funnel[0].count === 0) return <SectionEmpty message="No Smart Pricing activity in this range yet." />;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
        {stats.funnel.map((s, i) => (
          <MidKpiCard key={s.key} icon={["🔍", "💷", "🧮", "💾"][i]} label={s.label} value={s.count} accent={[T.blue, T.purple, T.orange, T.green][i]} />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 14, marginBottom: 18, alignItems: "stretch" }}>
        <FunnelPanel
          title="Smart Pricing Funnel"
          subtitle="Search → price entered → calculated → saved"
          funnel={stats.funnel}
          overallConversion={stats.funnel[0].count > 0 ? stats.funnel[3].count / stats.funnel[0].count : null}
          overallLabel="Overall conversion (search → saved)"
        />
        <DataTable
          title="Top searched queries"
          columns={[
            { key: "query", label: "Query", flex: 1.6, emphasize: true },
            { key: "count", label: "Searches" },
          ]}
          rows={stats.topQueries}
        />
      </div>

      <HorizontalBarChart title="Searches by Condition" data={stats.conditionBreakdown} height={180} />
    </>
  );
}
