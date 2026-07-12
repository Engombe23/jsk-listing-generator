import { useEffect, useRef } from "react";
import { trackEvent } from "./analytics";

// Fires scroll_25 / scroll_50 / scroll_75 / scroll_100 once each, the first
// time the page is scrolled past that percentage of total scrollable height.
export function useScrollDepthTracking() {
  const firedRef = useRef(new Set());

  useEffect(() => {
    const THRESHOLDS = [25, 50, 75, 100];

    const onScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      if (scrollable <= 0) return;
      const pct = (window.scrollY / scrollable) * 100;

      THRESHOLDS.forEach((t) => {
        if (pct >= t && !firedRef.current.has(t)) {
          firedRef.current.add(t);
          trackEvent(`scroll_${t}`, { percent: t });
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
}

// Fires section_viewed once per section name, the first time >=50% of it
// enters the viewport. Attach `ref` to the section's root element.
export function useSectionViewed(sectionName) {
  const ref = useRef(null);
  const firedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || firedRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !firedRef.current) {
          firedRef.current = true;
          trackEvent("section_viewed", { section: sectionName });
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [sectionName]);

  return ref;
}
