import SignUpForm from "../../components/SignUpForm";
import AuthPageLayout from "./AuthPageLayout";
import { useSearchParams } from "react-router-dom";
import { getDisplayPrice, getPlan, isValidPaidPlan } from "../../lib/plans";

export default function SignUpPage() {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get("plan") || "";
  const interval = searchParams.get("interval") || "monthly";
  const paidSignup = isValidPaidPlan(plan, interval);
  const planInfo = paidSignup ? getPlan(plan) : null;
  const displayPrice = paidSignup ? getDisplayPrice(plan, interval) : null;

  return (
    <AuthPageLayout
      title="Create your account"
      subtitle={
        paidSignup
          ? `You're signing up for ${planInfo.name} (${displayPrice}/${interval === "annual" ? "mo, billed annually" : "month"}). Create your account to continue to payment.`
          : "Start generating eBay listings in minutes."
      }
    >
      <SignUpForm
        submitLabel={paidSignup ? "Create account & continue to payment" : "Start free trial"}
      />
    </AuthPageLayout>
  );
}
