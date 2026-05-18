import ForgotPasswordForm from "../../components/ForgotPasswordForm";
import AuthPageLayout from "./AuthPageLayout";

export default function ForgotPasswordPage() {
  return (
    <AuthPageLayout
      title="Reset password"
      subtitle="We'll email you a link to choose a new password"
    >
      <ForgotPasswordForm />
    </AuthPageLayout>
  );
}
