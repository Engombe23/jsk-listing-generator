import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      );

      if (!error) {
        navigate("/", { replace: true });
      } else {
        navigate("/auth/login", { replace: true });
      }
    };

    run();
  }, [navigate]);

  return <p>Signing you in...</p>;
}