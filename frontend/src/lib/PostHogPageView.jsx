import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import posthog from "./posthogClient";

// Captures a $pageview on every route change. Must be rendered inside
// <BrowserRouter> (so useLocation works) and mounted once near the root.
export default function PostHogPageView() {
  const location = useLocation();

  useEffect(() => {
    posthog.capture("$pageview", {
      $current_url: window.location.href,
    });
  }, [location.pathname, location.search]);

  return null;
}
