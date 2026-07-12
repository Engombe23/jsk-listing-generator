import { useSession } from "../context/SessionContext";
import App from "../App.jsx";
import LandingHome from "../landing/LandingHome.jsx";

// Root route ("/"): shows the public marketing landing page to signed-out
// visitors, and the authenticated dashboard (App) once logged in.
export default function HomeRoute() {
  const { session } = useSession();
  return session ? <App /> : <LandingHome />;
}
