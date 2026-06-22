import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "../context/SessionContext";

// No roles table exists yet — gate /admin/* on an email allowlist instead.
// Configure via VITE_ADMIN_EMAILS="you@example.com,other@example.com" in
// frontend/.env. This is a UX convenience only — the real security boundary
// is the backend's ADMIN_EMAILS check in requireAdmin.js.
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "aaron@partlister.app,engombe@partlister.app")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default function AdminRoute() {
  const { session } = useSession();
  const email = session?.user?.email?.toLowerCase();

  if (!session || !email || !ADMIN_EMAILS.includes(email)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
