import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "../context/SessionContext";

// No roles table exists yet — gate /admin/* on an email allowlist instead.
// Configure via VITE_ADMIN_EMAILS="you@example.com,other@example.com" in
// frontend/.env. Falls back to the original PartLister account email.
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "aaronbutlerwm@gmail.com")
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
