import { Outlet } from "react-router-dom";
import { SessionProvider } from "./context/SessionContext";
import { ThemeProvider } from "./context/ThemeContext";

export default function Providers() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <Outlet />
      </SessionProvider>
    </ThemeProvider>
  );
}
