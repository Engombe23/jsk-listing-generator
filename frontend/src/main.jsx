import { StrictMode, Component } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

class RootErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: "monospace", color: "#c00" }}>
          <strong>App crashed — check console for details.</strong>
          <pre style={{ marginTop: 12, fontSize: 13, whiteSpace: "pre-wrap" }}>
            {this.state.error?.message}
            {"\n"}
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
import "./index.css";
import "./i18n/index.js";
import "./lib/posthogClient.js";
import "./lib/gtag.js";
import PostHogPageView from "./lib/PostHogPageView.jsx";
import Providers from "./Providers.jsx";
import HomeRoute from "./router/HomeRoute.jsx";
import GuestOnlyRoute from "./router/GuestOnlyRoute.jsx";
import AdminRoute from "./router/AdminRoute.jsx";
import AdminAnalytics from "./pages/admin/AdminAnalytics.jsx";
import About       from "./pages/About.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import HelpPage         from "./pages/HelpPage.jsx";
import HelpArticlePage  from "./pages/HelpArticlePage.jsx";
import DemoPage  from "./pages/DemoPage.jsx";
import Pricing from "./pages/Pricing.jsx";
import TermsPage from "./pages/TermsPage.jsx";
import PrivacyPage from "./pages/PrivacyPage.jsx";
import CheckoutSummaryPage from "./pages/checkout/CheckoutSummaryPage.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import SignUpPage from "./pages/auth/SignUpPage.jsx";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage.jsx";
import UpdatePasswordPage from "./pages/auth/UpdatePasswordPage.jsx";
import SignUpSuccessPage from "./pages/auth/SignUpSuccessPage.jsx";
import AuthCallback from "./callback/AuthCallback.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RootErrorBoundary>
    <BrowserRouter>
      <PostHogPageView />
      <Routes>
        <Route element={<Providers />}>
          <Route path="/" element={<HomeRoute />} />

          <Route path="/about"   element={<About />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/help"    element={<HelpPage />} />
          <Route path="/help/articles/:slug" element={<HelpArticlePage />} />
          <Route path="/demo"    element={<DemoPage />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/checkout" element={<CheckoutSummaryPage />} />

          <Route element={<AdminRoute />}>
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
          </Route>

          <Route element={<GuestOnlyRoute />}>
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/sign-up" element={<SignUpPage />} />
            <Route path="/auth/sign-up-success" element={<SignUpSuccessPage />} />
          </Route>

          <Route path="/auth/callback" element={<AuthCallback />} />

          <Route path="/auth/forget-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/update-password" element={<UpdatePasswordPage />} />

          <Route path="/login" element={<Navigate to="/auth/login" replace />} />
          <Route path="/app" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </RootErrorBoundary>
  </StrictMode>
);
