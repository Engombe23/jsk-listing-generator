import { useMemo } from "react";
import { T, MidKpiCard, FunnelPanel, DailyToggleLineChart, HorizontalBarChart, fmtPct, SectionEmpty } from "../shared";

function dailySeries(events, names) {
  const byDay = new Map();
  events.forEach((e) => {
    if (!names.includes(e.event_name)) return;
    const day = e.created_at.slice(0, 10);
    byDay.set(day, (byDay.get(day) || 0) + 1);
  });
  return [...byDay.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, count]) => ({ date, count }));
}

export default function SignupFunnelSection({ events, data }) {
  const stats = useMemo(() => {
    const ctaCounts = {};
    events.filter((e) => e.event_name === "signup_clicked").forEach((e) => {
      const loc = e.metadata?.cta_location || "unknown";
      ctaCounts[loc] = (ctaCounts[loc] || 0) + 1;
    });
    const ctaBreakdown = Object.entries(ctaCounts)
      .map(([key, count]) => ({ key, label: key.replace(/_/g, " "), count }))
      .sort((a, b) => b.count - a.count);

    const signupsSeries = dailySeries(events, ["user_signed_up"]);
    const clicksSeries  = dailySeries(events, ["signup_clicked"]);
    const merged = (() => {
      const days = new Set([...signupsSeries.map((d) => d.date), ...clicksSeries.map((d) => d.date)]);
      const sMap = new Map(signupsSeries.map((d) => [d.date, d.count]));
      const cMap = new Map(clicksSeries.map((d) => [d.date, d.count]));
      return [...days].sort().map((date) => ({ date, signups: sMap.get(date) || 0, clicks: cMap.get(date) || 0 }));
    })();

    return { ctaBreakdown, merged };
  }, [events]);

  const funnel = data?.funnel?.slice(0, 4); // landing -> signup clicked -> account created -> trial started
  if (!funnel || funnel[0].count === 0) return <SectionEmpty message="No signup activity in this range yet." />;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
        <MidKpiCard icon="👥" label="Landing Page Viewed" value={funnel[0].count} accent={T.blue} />
        <MidKpiCard icon="🖱️" label="Signup Clicked"      value={funnel[1].count} accent={T.purple} />
        <MidKpiCard icon="✅" label="Account Created"      value={funnel[2].count} accent={T.green} />
        <MidKpiCard icon="🚀" label="Trial Started"        value={funnel[3].count} accent={T.orange} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18, alignItems: "stretch" }}>
        <FunnelPanel
          title="Signup Funnel"
          subtitle="Landing page → signup clicked → account created → trial started"
          funnel={funnel}
          overallConversion={funnel[3].count > 0 ? funnel[3].count / funnel[0].count : null}
          overallLabel="Overall conversion (viewed → trial)"
        />
        <HorizontalBarChart title="Signup CTA Clicks by Location" data={stats.ctaBreakdown} />
      </div>

      <DailyToggleLineChart title="Signup Clicks vs Account Created" data={stats.merged} lines={[
        { key: "clicks",  name: "Signup Clicks",   color: T.purple },
        { key: "signups", name: "Account Created", color: T.green },
      ]} />

      {data?.rates && (
        <div style={{ marginTop: 18, display: "flex", gap: 24, fontSize: 13, color: T.textMuted }}>
          <span>Signup click rate: <strong style={{ color: T.text }}>{fmtPct(data.rates.signup_click_rate)}</strong></span>
          <span>Signup completion rate: <strong style={{ color: T.text }}>{fmtPct(data.rates.signup_completion_rate)}</strong></span>
        </div>
      )}
    </>
  );
}
