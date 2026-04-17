import { redirect } from "next/navigation";

export default function AuthCallbackPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;
  if (!token) {
    redirect("/login?error=expired");
  }
  redirect(`/api/auth/verify?token=${encodeURIComponent(token)}`);
}
