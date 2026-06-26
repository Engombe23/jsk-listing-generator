import { Link } from "react-router-dom";
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
  return (
    <li style={{ marginBottom: 6 }}>{children}</li>
  );
}

export default function TermsPage() {
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
        <h1 style={{ fontSize: 36, fontWeight: 800, color: TEXT, marginBottom: 12 }}>Terms &amp; Conditions</h1>
        <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.8, marginBottom: 48 }}>
          Please read these Terms &amp; Conditions carefully before using PartLister. By creating an account or using
          our service, you agree to be bound by these terms.
        </p>

        <Section title="1. Acceptance of Terms">
          <p>By accessing or using PartLister, you confirm that you have read, understood, and agree to be bound by these Terms &amp; Conditions. If you do not agree, please do not use the service.</p>
        </Section>

        <Section title="2. Service Description">
          <p style={{ marginBottom: 12 }}>PartLister is a cloud-based platform that helps sellers generate automotive parts listings. Features include:</p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <Li>AI-generated titles and descriptions</Li>
            <Li>OEM and interchangeable reference numbers</Li>
            <Li>Vehicle compatibility information</Li>
            <Li>Engine codes</Li>
            <Li>Pricing insights via eBay market data</Li>
            <Li>CSV exports</Li>
            <Li>Other listing automation features</Li>
          </ul>
        </Section>

        <Section title="3. Accounts">
          <p style={{ marginBottom: 12 }}>When creating an account, you agree to:</p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <Li>Provide accurate and complete information</Li>
            <Li>Keep your login credentials secure and confidential</Li>
            <Li>Be responsible for all activity that occurs under your account</Li>
            <Li>Notify us immediately of any unauthorised use of your account</Li>
          </ul>
          <p style={{ marginTop: 12 }}>You may not create multiple accounts or share your account with others without express permission.</p>
        </Section>

        <Section title="4. Subscriptions &amp; Billing">
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <Li>Subscription fees are billed in advance on a monthly or annual basis.</Li>
            <Li>Paid plans renew automatically unless cancelled before the renewal date.</Li>
            <Li>You may cancel your subscription at any time from your account settings.</Li>
            <Li>Access to paid features continues until the end of your current billing period.</Li>
            <Li>No refunds are provided except where required by applicable law.</Li>
            <Li>Pricing is subject to change with reasonable notice.</Li>
          </ul>
        </Section>

        <Section title="5. Fair Use">
          <p style={{ marginBottom: 12 }}>You agree not to:</p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <Li>Reverse engineer, decompile, or attempt to extract the source code of PartLister</Li>
            <Li>Scrape, copy, or reproduce the platform or its data in bulk</Li>
            <Li>Share your account or credentials with third parties without permission</Li>
            <Li>Use PartLister for any unlawful, fraudulent, or abusive purpose</Li>
            <Li>Abuse or overload our APIs or automated systems</Li>
            <Li>Attempt to circumvent subscription limits or access controls</Li>
          </ul>
        </Section>

        <Section title="6. Intellectual Property">
          <p>All software, branding, designs, and functionality of PartLister remain the exclusive intellectual property of PartLister. Nothing in these terms transfers any ownership rights to you.</p>
          <p style={{ marginTop: 12 }}>You retain full ownership of the listings and content you generate using PartLister. By using the service, you grant PartLister a limited licence to process your content solely for the purpose of providing the service.</p>
        </Section>

        <Section title="7. Accuracy &amp; Data Sources">
          <p>PartLister uses trusted automotive data sources and AI to assist with listing creation. However:</p>
          <ul style={{ paddingLeft: 20, margin: "12px 0 0" }}>
            <Li>Compatibility information, OEM references, pricing insights, and other automotive data may be sourced from third-party providers. PartLister cannot guarantee the completeness or accuracy of third-party data.</Li>
            <Li>You remain responsible for verifying compatibility, pricing, product specifications, and vehicle applications before listing.</Li>
            <Li>PartLister is a tool to assist with listing creation, not a guarantee of accuracy.</Li>
          </ul>
        </Section>

        <Section title="8. Limitation of Liability">
          <p style={{ marginBottom: 12 }}>To the fullest extent permitted by law, PartLister is not liable for:</p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <Li>Incorrect or inaccurate listings</Li>
            <Li>Lost sales or revenue</Li>
            <Li>Marketplace penalties (including eBay policy violations)</Li>
            <Li>Business interruption</Li>
            <Li>Any indirect, consequential, or special losses</Li>
          </ul>
          <p style={{ marginTop: 12 }}>Where liability cannot be excluded by law, it is limited to the total amount you have paid for the service in the three months preceding the claim.</p>
        </Section>

        <Section title="9. Termination">
          <p>We reserve the right to suspend or terminate your account without notice if you breach these terms, engage in fraudulent activity, or misuse the platform. You may terminate your account at any time by cancelling your subscription and contacting support.</p>
        </Section>

        <Section title="10. Changes to Terms">
          <p>We may update these Terms &amp; Conditions from time to time. We will notify you of material changes by email or by displaying a notice in the app. Continued use of PartLister after changes take effect constitutes acceptance of the revised terms.</p>
        </Section>

        <Section title="11. Governing Law">
          <p>These Terms &amp; Conditions are governed by the laws of England and Wales. Any disputes arising from or in connection with these terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
        </Section>

        <div style={{ marginTop: 48, padding: "24px 28px", background: "#f4f6fb", borderRadius: 12, border: `1px solid ${BORDER}` }}>
          <p style={{ fontSize: 14, color: MUTED, margin: 0 }}>
            Questions about these terms? Contact us at{" "}
            <a href="mailto:support@partlister.app" style={{ color: ACCENT, textDecoration: "none" }}>
              support@partlister.app
            </a>
          </p>
        </div>
      </main>

      {!session && <Footer />}
    </div>
  );
}
