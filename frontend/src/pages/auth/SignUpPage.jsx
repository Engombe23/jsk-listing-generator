import SignUpForm from "../../components/SignUpForm";
import AuthPageLayout from "./AuthPageLayout";

export default function SignUpPage() {
  return (
    <AuthPageLayout title="Create your account" subtitle="Start generating eBay listings in minutes.">
      <SignUpForm />
    </AuthPageLayout>
  );
}
