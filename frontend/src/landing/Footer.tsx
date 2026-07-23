import { Link } from "react-router-dom";
import { Mail, LifeBuoy } from "lucide-react";
import { Logo } from "./Primitives";

const cols = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "How It Works", href: "/#how-it-works" },
      { label: "Pricing", href: "/#pricing" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Centre", href: "/help" },
      { label: "Contact", href: "mailto:enquiries@partlister.app" },
      { label: "Login", href: "/auth/sign-in" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-hair bg-white px-6 py-14">
      <div className="mx-auto grid w-full max-w-[1180px] gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-[0.92rem] leading-relaxed text-muted2">
            OEM to listing in one click. TecDoc-accurate eBay listings for automotive parts sellers.
          </p>

          <div className="mt-5 flex flex-col gap-2.5">
            <a
              href="mailto:enquiries@partlister.app"
              className="inline-flex w-fit items-center gap-2 text-[0.9rem] font-medium text-slate transition-colors hover:text-primary"
            >
              <Mail className="h-4 w-4 text-primary" />
              enquiries@partlister.app
            </a>
            <a
              href="/help"
              className="inline-flex w-fit items-center gap-2 text-[0.9rem] font-medium text-slate transition-colors hover:text-primary"
            >
              <LifeBuoy className="h-4 w-4 text-primary" />
              Help Centre
            </a>
          </div>

          <p className="mt-5 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-faint">
            List Smart. Sell More.
          </p>
        </div>

        {cols.map((c) => (
          <div key={c.title}>
            <h4 className="font-display text-[0.85rem] font-bold uppercase tracking-wider text-navy">{c.title}</h4>
            <ul className="mt-4 flex flex-col gap-2.5">
              {c.links.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-[0.92rem] text-slate transition-colors hover:text-primary"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-12 flex w-full max-w-[1180px] flex-col items-center justify-between gap-4 border-t border-hair pt-8 sm:flex-row">
        <p className="text-[0.85rem] text-muted2">
          © {new Date().getFullYear()} PartLister. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <a
            href="mailto:enquiries@partlister.app"
            className="text-[0.85rem] font-semibold text-navy hover:text-primary"
          >
            enquiries@partlister.app
          </a>
          <Link
            to="/auth/sign-up"
            className="rounded-lg bg-primary px-4 py-2 text-[0.85rem] font-semibold text-white transition-colors hover:bg-primary-deep"
          >
            Generate 10 Listings Free
          </Link>
        </div>
      </div>
    </footer>
  );
}
