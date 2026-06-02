import { Outlet } from "react-router-dom";

// Auth temporarily disabled — remove this comment and restore session check when Supabase is configured
export default function AuthProtectedRoute() {
  return <Outlet />;
}
