import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Reveal, Section } from "./Primitives";

export default function FinalCTA() {
  return (
    <Section className="pb-24 sm:pb-28">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] bg-navy px-6 py-20 text-center sm:px-12 sm:py-24">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-0 h-[440px] w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(19,93,255,0.55),transparent_60%)] blur-2xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
          </div>

          <img
            src="/parts3d/turbo.png"
            alt=""
            aria-hidden
            className="pointer-events-none absolute -bottom-6 -left-8 hidden h-40 w-40 rotate-[-8deg] object-contain opacity-90 drop-shadow-[0_24px_40px_rgba(0,0,0,0.5)] md:block lg:-left-4 lg:h-48 lg:w-48"
          />
          <img
            src="/parts3d/piston.png"
            alt=""
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-8 hidden h-36 w-36 rotate-[12deg] object-contain opacity-90 drop-shadow-[0_24px_40px_rgba(0,0,0,0.5)] md:block lg:-right-4 lg:h-44 lg:w-44"
          />

          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-balance font-display text-[clamp(2rem,4.6vw,3.4rem)] font-extrabold leading-[1.05] tracking-tightest text-white">
              Ready to create listings in seconds?
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-[1.08rem] leading-relaxed text-white/70">
              Stop copy-pasting part data by hand. Turn your next OEM number into a complete eBay listing right now.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/auth/sign-up"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-[1.05rem] font-semibold text-white shadow-[0_16px_40px_-10px_rgba(19,93,255,0.8)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-navy sm:w-auto"
              >
                Generate 10 Listings Free
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <p className="mt-4 font-mono text-[0.78rem] text-white/40">
              No card required · Cancel anytime
            </p>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
