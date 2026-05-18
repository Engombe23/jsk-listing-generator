import { Outlet } from "react-router-dom";
import { SessionProvider } from "./context/SessionContext";

export default function Providers() {
  return (
    <SessionProvider>
      <Outlet />
    </SessionProvider>
  );
}
