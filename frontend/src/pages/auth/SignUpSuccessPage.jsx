import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AuthPageLayout from "./AuthPageLayout";

export default function SignUpSuccessPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const pending = location.state?.pendingPayment;

  if (pending?.planName) {
    return (
      <AuthPageLayout
        title={t("auth.confirmEmailTitle")}
        subtitle={t("auth.confirmEmailPaidSubtitle", { plan: pending.planName })}
      >
        <p className="text-sm text-center" style={{ color: "rgba(255,255,255,0.7)" }}>
          {t("auth.checkInbox")}
        </p>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout
      title={t("auth.checkEmailTitle")}
      subtitle={t("auth.checkEmailSubtitle")}
    >
      <p className="text-sm text-center" style={{ color: "rgba(255,255,255,0.7)" }}>
        <Link to="/auth/login">{t("auth.goToSignIn")}</Link>
      </p>
    </AuthPageLayout>
  );
}
