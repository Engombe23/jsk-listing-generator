import { useTranslation } from "react-i18next";
import LoginForm from "../../components/LoginForm";
import AuthPageLayout from "./AuthPageLayout";
import { useSearchParams } from "react-router-dom";
import { getDisplayPrice, getPlan, isValidPaidPlan } from "../../lib/plans";

export default function LoginPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get("plan") || "";
  const interval = searchParams.get("interval") || "monthly";
  const paidLogin = isValidPaidPlan(plan, interval);
  const planInfo = paidLogin ? getPlan(plan) : null;
  const displayPrice = paidLogin ? getDisplayPrice(plan, interval) : null;
  const period = interval === "annual" ? "mo" : "month";

  return (
    <AuthPageLayout
      title={t("auth.welcomeBack")}
      subtitle={
        paidLogin
          ? t("auth.signInPaid", { plan: planInfo.name, price: displayPrice, period })
          : t("auth.signInContinue")
      }
    >
      <LoginForm />
    </AuthPageLayout>
  );
}
