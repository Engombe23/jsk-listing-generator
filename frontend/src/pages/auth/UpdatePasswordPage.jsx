import UpdatePasswordForm from "../../components/UpdatePasswordForm";
import AuthPageLayout from "./AuthPageLayout";
import { useTranslation } from "react-i18next";

export default function UpdatePasswordPage() {
  const { t } = useTranslation();
  return (
    <AuthPageLayout title={t("auth.updatePasswordTitle")} subtitle={t("auth.updatePasswordSubtitle")}>
      <UpdatePasswordForm />
    </AuthPageLayout>
  );
}
