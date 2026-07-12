import { Link, useLocation } from "react-router-dom";
import AuthPageLayout from "./AuthPageLayout";

export default function SignUpSuccessPage() {
  const location = useLocation();
  const pending = location.state?.pendingPayment;

  if (pending?.planName) {
    return (
      <AuthPageLayout
        title="Confirm your email"
        subtitle={`Your ${pending.planName} account is almost ready. Confirm your email — you'll be taken to payment, then into the product.`}
      >
        <p className="text-sm text-center" style={{ color: "rgba(255,255,255,0.7)" }}>
          Check your inbox for the confirmation link.
        </p>
      </AuthPageLayout>
    );
  }

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
