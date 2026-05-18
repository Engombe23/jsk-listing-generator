import SignUpForm from "../../components/SignUpForm";
import AuthPageLayout from "./AuthPageLayout";

export default function SignUpPage() {
  return (
    <AuthPageLayout title="Create account" subtitle="Start using PartLister">
      <SignUpForm />
    </AuthPageLayout>
  );
}
