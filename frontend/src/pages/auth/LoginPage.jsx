import LoginForm from "../../components/LoginForm";
import AuthPageLayout from "./AuthPageLayout";

export default function LoginPage() {
  return (
    <AuthPageLayout title="Sign in" subtitle="Access your PartLister account">
      <LoginForm />
    </AuthPageLayout>
  );
}
