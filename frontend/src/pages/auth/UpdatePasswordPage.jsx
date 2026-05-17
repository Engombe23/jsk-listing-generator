import UpdatePasswordForm from "../../components/UpdatePasswordForm";
import AuthPageLayout from "./AuthPageLayout";

export default function UpdatePasswordPage() {
  return (
    <AuthPageLayout title="Update password" subtitle="Choose a new password for your account">
      <UpdatePasswordForm />
    </AuthPageLayout>
  );
}
