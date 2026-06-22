import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import "./lib/posthogClient.js";
import PostHogPageView from "./lib/PostHogPageView.jsx";
import Providers from "./Providers.jsx";
import HomeRoute from "./router/HomeRoute.jsx";
import GuestOnlyRoute from "./router/GuestOnlyRoute.jsx";
import AdminRoute from "./router/AdminRoute.jsx";
import AdminAnalytics from "./pages/admin/AdminAnalytics.jsx";
import About from "./pages/About.jsx";
import Pricing from "./pages/Pricing.jsx";
import CheckoutSummaryPage from "./pages/checkout/CheckoutSummaryPage.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import SignUpPage from "./pages/auth/SignUpPage.jsx";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage.jsx";
import UpdatePasswordPage from "./pages/auth/UpdatePasswordPage.jsx";
import SignUpSuccessPage from "./pages/auth/SignUpSuccessPage.jsx";
import AuthCallback from "./callback/AuthCallback.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <PostHogPageView />
      <Routes>
        <Route element={<Providers />}>
          <Route path="/" element={<HomeRoute />} />

          <Route path="/about" element={<About />} />
          <Route path="/pricing" element={<Pricing />} />
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
  </StrictMode>
);
