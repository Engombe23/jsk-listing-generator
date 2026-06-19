import LoginForm from "../../components/LoginForm";
import AuthPageLayout from "./AuthPageLayout";

export default function LoginPage() {
  return (
    <AuthPageLayout title="Welcome back" subtitle="Sign in to your account to continue generating listings.">
      <LoginForm />
    </AuthPageLayout>
  );
}
