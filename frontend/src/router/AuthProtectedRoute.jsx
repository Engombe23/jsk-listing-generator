import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "../context/SessionContext";

export default function AuthProtectedRoute() {
  const { session } = useSession();

  if (!session) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
}
