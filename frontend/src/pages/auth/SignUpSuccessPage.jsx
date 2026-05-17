import { Link } from "react-router-dom";
import AuthPageLayout from "./AuthPageLayout";

export default function SignUpSuccessPage() {
  return (
    <AuthPageLayout
      title="Check your email"
      subtitle="We sent you a confirmation link. After confirming, you can sign in."
    >
      <p className="text-sm text-center" style={{ color: "rgba(255,255,255,0.7)" }}>
        <Link to="/auth/login">Go to sign in</Link>
      </p>
    </AuthPageLayout>
  );
}
