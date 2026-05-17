import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import Providers from "./Providers.jsx";
import AuthProtectedRoute from "./router/AuthProtectedRoute.jsx";
import GuestOnlyRoute from "./router/GuestOnlyRoute.jsx";
import App from "./App.jsx";
import About from "./pages/About.jsx";
import Pricing from "./pages/Pricing.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import SignUpPage from "./pages/auth/SignUpPage.jsx";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage.jsx";
import UpdatePasswordPage from "./pages/auth/UpdatePasswordPage.jsx";
import SignUpSuccessPage from "./pages/auth/SignUpSuccessPage.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Providers />}>
          <Route element={<AuthProtectedRoute />}>
            <Route path="/" element={<App />} />
          </Route>

          <Route path="/about" element={<About />} />
          <Route path="/pricing" element={<Pricing />} />

          <Route element={<GuestOnlyRoute />}>
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/sign-up" element={<SignUpPage />} />
            <Route path="/auth/sign-up-success" element={<SignUpSuccessPage />} />
          </Route>

          <Route path="/auth/forget-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/update-password" element={<UpdatePasswordPage />} />

          <Route path="/login" element={<Navigate to="/auth/login" replace />} />
          <Route path="/app" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
