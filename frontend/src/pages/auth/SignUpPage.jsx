import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import SignUpForm from "../../components/SignUpForm";
import AuthPageLayout from "./AuthPageLayout";
import { useSearchParams } from "react-router-dom";
import { getDisplayPrice, getPlan, isValidPaidPlan } from "../../lib/plans";

export default function SignUpPage() {
  const { t } = useTranslation();
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
      title={t("auth.createAccountTitle")}
      subtitle={
        paidSignup
          ? t("auth.signupPaidSubtitle", { plan: `${planInfo.name} (${displayPrice})` })
          : t("auth.signupSubtitle")
      }
    >
      <SignUpForm
        submitLabel={paidSignup ? t("auth.createAccountContinuePayment") : t("common.tryFree")}
      />
    </AuthPageLayout>
  );
}
