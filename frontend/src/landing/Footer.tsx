import { Link } from "react-router-dom";
import { Mail, LifeBuoy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Logo } from "./Primitives";

export default function Footer() {
  const { t } = useTranslation();

  const cols = [
    {
      title: t("footer.product"),
      links: [
        { label: t("marketing.features"), href: "/#features" },
        { label: t("marketing.howItWorks"), href: "/#how-it-works" },
        { label: t("marketing.pricing"), href: "/#pricing" },
        { label: t("marketing.faq"), href: "/#faq" },
      ],
    },
    {
      title: t("footer.support"),
      links: [
        { label: t("marketing.helpCentre"), href: "/help" },
        { label: t("marketing.contact"), href: "/contact" },
        { label: t("marketing.login"), href: "/auth/login" },
      ],
    },
    {
      title: t("footer.legal"),
      links: [
        { label: t("marketing.privacy"), href: "/privacy" },
        { label: t("marketing.terms"), href: "/terms" },
      ],
    },
  ];

  return (
    <footer className="border-t border-hair bg-white px-6 py-14">
      <div className="mx-auto grid w-full max-w-[1180px] gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-xs text-[0.93rem] leading-[1.7] text-muted2">
            {t("footer.tagline")}
          </p>

          <div className="mt-6 flex flex-col gap-3">
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
              {t("marketing.helpCentre")}
            </a>
          </div>

          <p className="mt-5 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-faint">
            {t("footer.slogan")}
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
          {t("footer.copyright", { year: new Date().getFullYear() })}
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
            {t("marketing.ctaFree")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
