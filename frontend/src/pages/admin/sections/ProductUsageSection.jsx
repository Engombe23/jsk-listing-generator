import { useMemo } from "react";
import { T, MidKpiCard, DailyToggleLineChart, HorizontalBarChart, SectionEmpty } from "../shared";

const PRODUCT_EVENTS = ["listing_generated", "ebay_search_performed", "compat_check_performed", "price_entered"];

function dailySeries(events, names) {
  const byDay = new Map();
  events.forEach((e) => {
    if (!names.includes(e.event_name)) return;
    const day = e.created_at.slice(0, 10);
    byDay.set(day, (byDay.get(day) || 0) + 1);
  });
  return [...byDay.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, count]) => ({ date, count }));
}

export default function ProductUsageSection({ events, data }) {
  const stats = useMemo(() => {
    const dauByDay = new Map(); // date -> Set(user_id)
    events.forEach((e) => {
      if (!e.user_id || !PRODUCT_EVENTS.includes(e.event_name)) return;
      const day = e.created_at.slice(0, 10);
      if (!dauByDay.has(day)) dauByDay.set(day, new Set());
      dauByDay.get(day).add(e.user_id);
    });
    const dauSeries = [...dauByDay.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, set]) => ({ date, count: set.size }));

    const series = {
      listing_generator:     dailySeries(events, ["listing_generated"]),
      smart_pricing:         dailySeries(events, ["ebay_search_performed"]),
      compatibility_checker: dailySeries(events, ["compat_check_performed"]),
      price_calculator:      dailySeries(events, ["price_entered"]),
    };
    const days = new Set(Object.values(series).flatMap((s) => s.map((d) => d.date)).concat(dauSeries.map((d) => d.date)));
    const toMap = (s) => new Map(s.map((d) => [d.date, d.count]));
    const maps = Object.fromEntries(Object.entries(series).map(([k, v]) => [k, toMap(v)]));
    const merged = [...days].sort().map((date) => ({
      date,
      listing_generator: maps.listing_generator.get(date) || 0,
      smart_pricing: maps.smart_pricing.get(date) || 0,
      compatibility_checker: maps.compatibility_checker.get(date) || 0,
      price_calculator: maps.price_calculator.get(date) || 0,
    }));

    const totalProductEvents = events.filter((e) => PRODUCT_EVENTS.includes(e.event_name)).length;
    const distinctActiveUsers = new Set(events.filter((e) => e.user_id && PRODUCT_EVENTS.includes(e.event_name)).map((e) => e.user_id)).size;

    return { merged, dauSeries, totalProductEvents, distinctActiveUsers };
  }, [events]);

  if (stats.totalProductEvents === 0) return <SectionEmpty message="No product usage in this range yet." />;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 18 }}>
        <MidKpiCard icon="⚡" label="Total Product Actions" value={stats.totalProductEvents} accent={T.blue} />
        <MidKpiCard icon="👤" label="Distinct Active Users" value={stats.distinctActiveUsers} accent={T.green} />
        <MidKpiCard icon="🧰" label="Features Tracked" value={4} accent={T.purple} />
      </div>

      <div style={{ marginBottom: 18 }}>
        <DailyToggleLineChart title="Daily Active Users (any product feature)" data={stats.dauSeries} lines={[
          { key: "count", name: "Active Users", color: T.blue },
        ]} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 14 }}>
        <DailyToggleLineChart title="Feature Usage Over Time" data={stats.merged} lines={[
          { key: "listing_generator",     name: "Listing Generator",     color: T.blue },
          { key: "smart_pricing",         name: "Smart Pricing",         color: T.purple },
          { key: "compatibility_checker", name: "Compatibility Checker", color: T.orange },
          { key: "price_calculator",      name: "Price Calculator",      color: T.amber },
        ]} />
        <HorizontalBarChart title="Feature Usage Split" data={data?.featureUsage} pctKey="pctOfCore" />
      </div>
    </>
  );
}
