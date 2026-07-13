import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Logo, PrimaryButton } from "./Primitives";

const links = [
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
];

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="group relative px-3.5 py-2 text-[0.9rem] font-medium text-slate transition-colors duration-150 hover:text-[#135DFF]"
    >
      {label}
      <span className="absolute bottom-1 left-1/2 h-[2px] w-0 -translate-x-1/2 rounded-full bg-[#135DFF] transition-all duration-200 group-hover:w-[calc(100%-1.75rem)]" />
    </a>
  );
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-3"
    >
      <div
        className={`relative mx-auto flex w-full max-w-[1180px] items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-300 ${
          scrolled
            ? "border border-hair bg-white/80 shadow-soft backdrop-blur-xl"
            : "border border-transparent bg-transparent"
        }`}
      >
        <Logo />

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink key={l.href} href={l.href} label={l.label} />
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            to="/auth/login"
            className="group relative px-3.5 py-2 text-[0.9rem] font-semibold text-navy transition-colors duration-150 hover:text-[#135DFF]"
          >
            Login
            <span className="absolute bottom-1 left-1/2 h-[2px] w-0 -translate-x-1/2 rounded-full bg-[#135DFF] transition-all duration-200 group-hover:w-[calc(100%-1.75rem)]" />
          </Link>
          <PrimaryButton href="/auth/sign-up">
            Generate 10 Listings Free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </PrimaryButton>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-hair bg-white text-navy md:hidden"
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mx-auto mt-2 w-full max-w-[1180px] overflow-hidden rounded-2xl border border-hair bg-white p-3 shadow-soft md:hidden"
          >
            <div className="flex flex-col">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-3 text-[0.95rem] font-medium text-slate transition-colors hover:bg-wash hover:text-[#135DFF]"
                >
                  {l.label}
                </a>
              ))}
              <Link
                to="/auth/login"
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-3 text-[0.95rem] font-semibold text-navy transition-colors hover:bg-wash hover:text-[#135DFF]"
              >
                Login
              </Link>
              <PrimaryButton href="/auth/sign-up" className="mt-2 w-full">
                Generate 10 Listings Free
                <ArrowRight className="h-4 w-4" />
              </PrimaryButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

export default Nav;
