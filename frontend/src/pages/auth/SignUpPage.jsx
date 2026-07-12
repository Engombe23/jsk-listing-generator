import { useEffect } from "react";
import SignUpForm from "../../components/SignUpForm";
import AuthPageLayout from "./AuthPageLayout";
import { useSearchParams } from "react-router-dom";
import { getDisplayPrice, getPlan, isValidPaidPlan } from "../../lib/plans";

export default function SignUpPage() {
  useEffect(() => {
    window.gtag?.("event", "conversion", {
      send_to: "AW-18273467195/sEHWCJyby8UcELv2u4lE",
      value: 1.0,
      currency: "GBP",
    });
  }, []);
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
