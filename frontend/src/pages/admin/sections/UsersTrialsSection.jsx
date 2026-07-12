import { useEffect, useMemo, useState } from "react";
import { T, API_URL, MidKpiCard, DailyToggleLineChart, HorizontalBarChart, DataTable, fmtDate, SectionEmpty } from "../shared";

function dailySeries(events, names) {
  const byDay = new Map();
  events.forEach((e) => {
    if (!names.includes(e.event_name)) return;
    const day = e.created_at.slice(0, 10);
    byDay.set(day, (byDay.get(day) || 0) + 1);
  });
  return [...byDay.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, count]) => ({ date, count }));
}

export default function UsersTrialsSection({ events, accessToken, demoMode }) {
  const [dupClusters, setDupClusters] = useState(null);

  useEffect(() => {
    if (demoMode || !accessToken) return;
    fetch(`${API_URL}/api/analytics/duplicate-accounts`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((j) => setDupClusters(j.clusters || []))
      .catch(() => setDupClusters([]));
  }, [accessToken, demoMode]);

  const stats = useMemo(() => {
    const signupEvents = events.filter((e) => e.event_name === "user_signed_up" && e.user_id);
    const newUsers  = signupEvents.length;
    const trials    = events.filter((e) => e.event_name === "trial_started").length;

    const signupsSeries = dailySeries(events, ["user_signed_up"]);
    const trialsSeries  = dailySeries(events, ["trial_started"]);
    const merged = (() => {
      const days = new Set([...signupsSeries.map((d) => d.date), ...trialsSeries.map((d) => d.date)]);
      const sMap = new Map(signupsSeries.map((d) => [d.date, d.count]));
      const tMap = new Map(trialsSeries.map((d) => [d.date, d.count]));
      return [...days].sort().map((date) => ({ date, signups: sMap.get(date) || 0, trials: tMap.get(date) || 0 }));
    })();

    const planCounts = {};
    signupEvents.forEach((e) => {
      const p = e.plan || "free";
      planCounts[p] = (planCounts[p] || 0) + 1;
    });
    const planBreakdown = Object.entries(planCounts)
      .map(([key, count]) => ({ key, label: key.charAt(0).toUpperCase() + key.slice(1), count }))
      .sort((a, b) => b.count - a.count);

    // Recent signups with listing activity, computed from the same event window.
    const listingCountByUser = new Map();
    events.filter((e) => e.event_name === "listing_generated" && e.user_id).forEach((e) => {
      listingCountByUser.set(e.user_id, (listingCountByUser.get(e.user_id) || 0) + 1);
    });
    const lastSeenByUser = new Map();
    events.forEach((e) => {
      if (!e.user_id) return;
      const t = new Date(e.created_at).getTime();
      if (!lastSeenByUser.has(e.user_id) || t > lastSeenByUser.get(e.user_id)) lastSeenByUser.set(e.user_id, t);
    });

    const recentSignups = signupEvents
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, 10)
      .map((e) => ({
        user: e.user_id.slice(0, 8),
        signed_up: e.created_at,
        last_seen: lastSeenByUser.has(e.user_id) ? new Date(lastSeenByUser.get(e.user_id)).toISOString() : e.created_at,
        listings: listingCountByUser.get(e.user_id) || 0,
        plan: e.plan || "free",
      }));

    return { newUsers, trials, merged, planBreakdown, recentSignups };
  }, [events]);

  if (stats.newUsers === 0) return <SectionEmpty message="No signups in this range yet." />;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 18 }}>
        <MidKpiCard icon="✅" label="New Users" value={stats.newUsers} accent={T.blue} />
        <MidKpiCard icon="🚀" label="Trial Starts" value={stats.trials} accent={T.green} />
        <MidKpiCard icon="📦" label="Plans Represented" value={stats.planBreakdown.length} accent={T.purple} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 14, marginBottom: 18, alignItems: "stretch" }}>
        <DailyToggleLineChart title="Signups vs Trial Starts" data={stats.merged} lines={[
          { key: "signups", name: "Signups", color: T.blue },
          { key: "trials",  name: "Trial Starts", color: T.green },
        ]} />
        <HorizontalBarChart title="Plan Breakdown" data={stats.planBreakdown} height={Math.max(160, stats.planBreakdown.length * 40)} />
      </div>

      <DataTable
        title="Recent signups"
        columns={[
          { key: "user", label: "User", flex: 1.2, emphasize: true },
          { key: "signed_up", label: "Signed up", render: fmtDate },
          { key: "last_seen", label: "Last seen", render: fmtDate },
          { key: "listings", label: "Listings" },
          { key: "plan", label: "Plan" },
        ]}
        rows={stats.recentSignups}
      />

      {dupClusters && dupClusters.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <DataTable
            title="Possible duplicate accounts"
            subtitle="IPs with 2+ signups — a review signal, not an automatic block. Shared IPs (offices, universities, VPNs) can be legitimate."
            columns={[
              { key: "ip_address", label: "IP Address", flex: 1.1, emphasize: true },
              { key: "account_count", label: "Accounts" },
              { key: "emails", label: "Emails", flex: 2.2, render: (v) => (v || []).join(", ") },
              { key: "last_signup", label: "Last signup", render: fmtDate },
            ]}
            rows={dupClusters}
          />
        </div>
      )}
    </>
  );
}
