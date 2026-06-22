import { useMemo } from "react";
import { T, MidKpiCard, FunnelPanel, HorizontalBarChart, SectionEmpty } from "../shared";

function distinctSessions(events, names) {
  const set = new Set();
  events.forEach((e) => { if (e.session_id && names.includes(e.event_name)) set.add(e.session_id); });
  return set;
}
function countBy(events, name) {
  return events.filter((e) => e.event_name === name).length;
}

export default function LandingPageSection({ events }) {
  const stats = useMemo(() => {
    const views        = distinctSessions(events, ["landing_page_viewed"]).size;
    const pricingViews  = countBy(events, "pricing_page_viewed");
    const signupClicks  = countBy(events, "signup_clicked");

    const scrollFunnel = [
      { key: "viewed",    label: "Landing page viewed", count: views },
      { key: "scroll_25", label: "Scrolled 25%",        count: distinctSessions(events, ["scroll_25"]).size },
      { key: "scroll_50", label: "Scrolled 50%",        count: distinctSessions(events, ["scroll_50"]).size },
      { key: "scroll_75", label: "Scrolled 75%",        count: distinctSessions(events, ["scroll_75"]).size },
      { key: "scroll_100",label: "Scrolled 100%",       count: distinctSessions(events, ["scroll_100"]).size },
    ].map((s, i, arr) => ({ ...s, rate: i === 0 ? 1 : (arr[i - 1].count > 0 ? s.count / arr[i - 1].count : null) }));

    const ctaCounts = {};
    events.filter((e) => e.event_name === "signup_clicked").forEach((e) => {
      const loc = e.metadata?.cta_location || "unknown";
      ctaCounts[loc] = (ctaCounts[loc] || 0) + 1;
    });
    const ctaBreakdown = Object.entries(ctaCounts)
      .map(([key, count]) => ({ key, label: key.replace(/_/g, " "), count }))
      .sort((a, b) => b.count - a.count);

    const sectionCounts = {};
    events.filter((e) => e.event_name === "section_viewed").forEach((e) => {
      const s = e.metadata?.section || "unknown";
      sectionCounts[s] = (sectionCounts[s] || 0) + 1;
    });
    const sectionBreakdown = Object.entries(sectionCounts)
      .map(([key, count]) => ({ key, label: key.replace(/_/g, " "), count }))
      .sort((a, b) => b.count - a.count);

    return { views, pricingViews, signupClicks, scrollFunnel, ctaBreakdown, sectionBreakdown };
  }, [events]);

  if (stats.views === 0) return <SectionEmpty message="No landing page events in this range yet." />;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 18 }}>
        <MidKpiCard icon="👀" label="Landing Page Views" value={stats.views} accent={T.blue} />
        <MidKpiCard icon="💲" label="Pricing Page Views" value={stats.pricingViews} accent={T.purple} />
        <MidKpiCard icon="🖱️" label="Signup Clicks" value={stats.signupClicks} accent={T.green} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18, alignItems: "stretch" }}>
        <FunnelPanel title="Scroll Depth" subtitle="How far visitors scroll down the landing page" funnel={stats.scrollFunnel} />
        <HorizontalBarChart title="Signup CTA Clicks by Location" data={stats.ctaBreakdown} />
      </div>

      <HorizontalBarChart title="Section Views" data={stats.sectionBreakdown} height={Math.max(220, stats.sectionBreakdown.length * 36)} />
    </>
  );
}
