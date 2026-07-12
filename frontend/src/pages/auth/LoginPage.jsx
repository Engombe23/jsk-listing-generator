import LoginForm from "../../components/LoginForm";
import AuthPageLayout from "./AuthPageLayout";
import { useSearchParams } from "react-router-dom";
import { getDisplayPrice, getPlan, isValidPaidPlan } from "../../lib/plans";

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get("plan") || "";
  const interval = searchParams.get("interval") || "monthly";
  const paidLogin = isValidPaidPlan(plan, interval);
  const planInfo = paidLogin ? getPlan(plan) : null;
  const displayPrice = paidLogin ? getDisplayPrice(plan, interval) : null;

  return (
    <AuthPageLayout
      title="Welcome back"
      subtitle={
        paidLogin
          ? `Sign in to complete your ${planInfo.name} subscription (${displayPrice}/${interval === "annual" ? "mo" : "month"}).`
          : "Sign in to your account to continue generating listings."
      }
    >
      <LoginForm />
    </AuthPageLayout>
  );
}
