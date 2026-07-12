import { Link } from "react-router-dom";
import "../landing/landing-v2.css";
import Navbar from "../landing/Navbar";
import Footer from "../landing/Footer";
import { useSession } from "../context/SessionContext";

const ACCENT = "#135DFF";
const TEXT = "#132A46";
const MUTED = "#4d6a8a";
const BORDER = "#dde7f5";

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: TEXT, marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${BORDER}` }}>
        {title}
      </h2>
      <div style={{ fontSize: 15, color: MUTED, lineHeight: 1.8 }}>
        {children}
      </div>
    </section>
  );
}

function Li({ children }) {
  return <li style={{ marginBottom: 6 }}>{children}</li>;
}

function ThirdParty({ name, url }) {
  return (
    <li style={{ marginBottom: 6 }}>
      <strong style={{ color: TEXT }}>{name}</strong>
      {url && (
        <> — <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: ACCENT, textDecoration: "none" }}>Privacy Policy</a></>
      )}
    </li>
  );
}

export default function PrivacyPage() {
  const { session } = useSession();

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Inter', sans-serif" }}>
      {session ? (
        <div style={{ padding: "16px 24px", background: "#0a0e17", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <Link to="/" style={{ color: "#9aa3b8", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
            ← Back to app
          </Link>
        </div>
      ) : (
        <Navbar />
      )}

      <main style={{ maxWidth: 780, margin: "0 auto", padding: "64px 24px 80px" }}>
        <p style={{ fontSize: 13, color: "#9aa3b8", marginBottom: 8 }}>Last updated: June 2025</p>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: TEXT, marginBottom: 12 }}>Privacy Policy</h1>
        <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.8, marginBottom: 48 }}>
          PartLister is committed to protecting your privacy. This policy explains what information we collect,
          how we use it, and your rights regarding your personal data.
        </p>

        <Section title="Information We Collect">
          <p style={{ marginBottom: 12 }}>When you use PartLister, we may collect:</p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <Li>Name and email address (at signup)</Li>
            <Li>Account information (plan, preferences, subscription status)</Li>
            <Li>Billing information — processed securely by Stripe; we never see or store your card details</Li>
            <Li>Listings and content you generate within the platform</Li>
            <Li>Saved products and listing preferences</Li>
            <Li>Usage analytics (features used, pages viewed, session behaviour)</Li>
            <Li>Technical data such as IP address, browser type, and device information</Li>
          </ul>
        </Section>

        <Section title="Information We Do Not Store">
          <p>PartLister does <strong style={{ color: TEXT }}>not</strong> store payment card details. All payment processing is handled securely by{" "}
            <a href="https://stripe.com/gb/privacy" target="_blank" rel="noopener noreferrer" style={{ color: ACCENT, textDecoration: "none" }}>Stripe</a>.
            We only receive confirmation of a successful payment and your subscription status.
          </p>
        </Section>

        <Section title="How We Use Your Information">
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <Li>To provide, maintain, and improve the PartLister service</Li>
            <Li>To manage your account and subscription</Li>
            <Li>To send transactional emails (account confirmation, billing receipts, password resets)</Li>
            <Li>To send marketing emails, only where you have opted in</Li>
            <Li>To analyse usage patterns and improve the product</Li>
            <Li>To detect and prevent fraud or abuse</Li>
            <Li>To comply with legal obligations</Li>
          </ul>
        </Section>

        <Section title="Analytics">
          <p style={{ marginBottom: 12 }}>We use the following analytics tools to understand how PartLister is used:</p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <Li><strong style={{ color: TEXT }}>Google Analytics</strong> — page views, traffic sources, and general usage patterns</Li>
            <Li><strong style={{ color: TEXT }}>PostHog</strong> — feature usage, session behaviour, and product analytics</Li>
          </ul>
          <p style={{ marginTop: 12 }}>These tools may collect anonymised data including pages visited, time on site, and interaction events. We use this information solely to improve the product.</p>
        </Section>

        <Section title="Cookies">
          <p style={{ marginBottom: 12 }}>PartLister uses cookies for:</p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <Li>Authentication — keeping you logged in securely</Li>
            <Li>Security — protecting your session</Li>
            <Li>Preferences — remembering your settings</Li>
            <Li>Analytics — understanding how the platform is used</Li>
          </ul>
          <p style={{ marginTop: 12 }}>You can control cookies through your browser settings. Disabling cookies may affect your ability to use some features of PartLister.</p>
        </Section>

        <Section title="Third-Party Services">
          <p style={{ marginBottom: 12 }}>PartLister integrates with the following third-party services. Each processes data in accordance with its own privacy policy:</p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <ThirdParty name="Stripe" url="https://stripe.com/gb/privacy" />
            <ThirdParty name="Supabase" url="https://supabase.com/privacy" />
            <ThirdParty name="Vercel" url="https://vercel.com/legal/privacy-policy" />
            <ThirdParty name="Google Analytics" url="https://policies.google.com/privacy" />
            <ThirdParty name="PostHog" url="https://posthog.com/privacy" />
            <ThirdParty name="eBay APIs" url="https://www.ebay.co.uk/help/policies/member-behaviour-policies/user-privacy-notice-privacy-policy?id=4260" />
            <ThirdParty name="OpenAI" url="https://openai.com/policies/privacy-policy" />
          </ul>
        </Section>

        <Section title="Data Sources">
          <p>Compatibility information, OEM references, pricing insights, and other automotive data may be sourced from third-party data providers. While we work with reputable sources, PartLister cannot guarantee the completeness or accuracy of third-party data. Users are responsible for verifying listings before publishing.</p>
        </Section>

        <Section title="Data Security">
          <p>We use industry-standard security measures to protect your personal data, including:</p>
          <ul style={{ paddingLeft: 20, margin: "12px 0 0" }}>
            <Li>Encrypted connections (HTTPS) on all pages</Li>
            <Li>Secure cloud infrastructure via Supabase and Vercel</Li>
            <Li>Row-level security on our database</Li>
            <Li>Access controls limiting who can view your data internally</Li>
          </ul>
        </Section>

        <Section title="Data Retention">
          <p>We retain your personal data for as long as your account is active or as needed to provide the service. If you delete your account, we will delete or anonymise your personal data within a reasonable period, unless we are required to retain it by law.</p>
        </Section>

        <Section title="Your Rights">
          <p style={{ marginBottom: 12 }}>Under UK GDPR and applicable data protection law, you have the right to:</p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <Li>Request access to the personal data we hold about you</Li>
            <Li>Correct inaccurate or incomplete information</Li>
            <Li>Request deletion of your account and personal data</Li>
            <Li>Withdraw consent for marketing communications at any time</Li>
            <Li>Request a portable copy of your data where applicable</Li>
            <Li>Object to processing of your data in certain circumstances</Li>
          </ul>
          <p style={{ marginTop: 12 }}>To exercise any of these rights, contact us at{" "}
            <a href="mailto:support@partlister.app" style={{ color: ACCENT, textDecoration: "none" }}>support@partlister.app</a>.
          </p>
        </Section>

        <Section title="Marketing Emails">
          <p>We only send marketing emails to users who have explicitly opted in. Every marketing email includes a clear unsubscribe option. Transactional emails (receipts, password resets, account notifications) are sent regardless of marketing preferences as they are necessary to provide the service.</p>
        </Section>

        <Section title="Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. We will notify you of any significant changes by email or by displaying a notice in the app. The date at the top of this page reflects when the policy was last updated.</p>
        </Section>

        <Section title="Contact">
          <p>If you have any questions about this Privacy Policy or how we handle your data, please contact us:</p>
          <p style={{ marginTop: 12 }}>
            <strong style={{ color: TEXT }}>Email:</strong>{" "}
            <a href="mailto:support@partlister.app" style={{ color: ACCENT, textDecoration: "none" }}>support@partlister.app</a>
          </p>
        </Section>

        <div style={{ marginTop: 48, padding: "24px 28px", background: "#f4f6fb", borderRadius: 12, border: `1px solid ${BORDER}` }}>
          <p style={{ fontSize: 14, color: MUTED, margin: 0 }}>
            View our{" "}
            <Link to="/terms" style={{ color: ACCENT, textDecoration: "none" }}>Terms &amp; Conditions</Link>
            {" "}for information about your rights and responsibilities when using PartLister.
          </p>
        </div>
      </main>

      {!session && <Footer />}
    </div>
  );
}
