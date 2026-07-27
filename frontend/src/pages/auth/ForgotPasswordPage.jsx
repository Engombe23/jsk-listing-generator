import { useTranslation } from "react-i18next";
import ForgotPasswordForm from "../../components/ForgotPasswordForm";
import AuthPageLayout from "./AuthPageLayout";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  return (
    <AuthPageLayout
      title={t("auth.resetTitle")}
      subtitle={t("auth.resetSubtitle")}
    >
      <ForgotPasswordForm />
    </AuthPageLayout>
  );
}
